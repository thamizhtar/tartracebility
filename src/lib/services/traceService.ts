import { v4 as uuidv4 } from 'uuid';
import { get } from 'svelte/store';
import { db, traceRecords, traceChains, syncStatus } from '$lib/stores/gun';
import { CryptoService } from './cryptoService';
import type { TraceRecord, TraceEvent, TraceChain, Actor } from '$lib/types/traceability';

export class TraceService {
  private static currentActor: Actor | null = null;
  private static privateKey: string | null = null;

  /**
   * Initialize the service with actor credentials
   */
  static initialize(actor: Actor, privateKey: string): void {
    this.currentActor = actor;
    this.privateKey = privateKey;
    this.startSyncListener();
  }

  /**
   * Create a new trace record
   */
  static async createTraceRecord(
    event: TraceEvent,
    previousRecordId?: string
  ): Promise<TraceRecord> {
    if (!this.currentActor || !this.privateKey) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const id = uuidv4();
      const timestamp = Date.now();
      
      // Get previous hash
      let previousHash = '0'; // Genesis record
      if (previousRecordId) {
        const records = get(traceRecords);
        const previousRecord = records.find(r => r.id === previousRecordId);
        if (previousRecord) {
          previousHash = previousRecord.hash;
        }
      }

      // Create record without hash and signature
      const recordData = {
        id,
        timestamp,
        previousHash,
        event: {
          ...event,
          actor: this.currentActor
        },
        metadata: {
          version: '1.0.0',
          schemaVersion: '1.0.0',
          networkId: 'supply-chain-network',
          peerId: this.currentActor.id
        }
      };

      // Calculate hash
      const hash = CryptoService.calculateHash(recordData);

      // Create complete record
      const record: TraceRecord = {
        ...recordData,
        hash,
        signature: ''
      };

      // Sign the record
      record.signature = CryptoService.signRecord(record, this.privateKey);

      // Validate before storing
      if (!CryptoService.validateRecord(record)) {
        throw new Error('Generated record failed validation');
      }

      // Store in Gun.js
      await this.storeRecord(record);

      return record;
    } catch (error) {
      console.error('Failed to create trace record:', error);
      throw error;
    }
  }

  /**
   * Store record in Gun.js database
   */
  private static async storeRecord(record: TraceRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      db.traces.get(record.id).put(record, (ack: any) => {
        if (ack.err) {
          reject(new Error(`Failed to store record: ${ack.err}`));
        } else {
          // Update local store
          traceRecords.update(records => {
            const existingIndex = records.findIndex(r => r.id === record.id);
            if (existingIndex !== -1) {
              records[existingIndex] = record;
            } else {
              records.push(record);
            }
            return records;
          });
          resolve();
        }
      });
    });
  }

  /**
   * Retrieve trace chain for a product
   */
  static async getTraceChain(productId: string): Promise<TraceChain | null> {
    try {
      const records = get(traceRecords);
      const productRecords = records.filter(r => r.event.product.id === productId);
      
      if (productRecords.length === 0) {
        return null;
      }

      // Sort by timestamp
      productRecords.sort((a, b) => a.timestamp - b.timestamp);

      // Validate chain
      const isValid = CryptoService.validateChain(productRecords);

      const chain: TraceChain = {
        id: productId,
        name: productRecords[0]?.event.product.name || 'Unknown Product',
        records: productRecords,
        isValid,
        lastUpdated: Math.max(...productRecords.map(r => r.timestamp))
      };

      return chain;
    } catch (error) {
      console.error('Failed to get trace chain:', error);
      return null;
    }
  }

  /**
   * Search records by various criteria
   */
  static searchRecords(criteria: {
    productId?: string;
    actorId?: string;
    eventType?: string;
    dateRange?: { start: number; end: number };
    location?: string;
  }): TraceRecord[] {
    const records = get(traceRecords);
    
    return records.filter(record => {
      if (criteria.productId && record.event.product.id !== criteria.productId) {
        return false;
      }
      
      if (criteria.actorId && record.event.actor.id !== criteria.actorId) {
        return false;
      }
      
      if (criteria.eventType && record.event.type !== criteria.eventType) {
        return false;
      }
      
      if (criteria.dateRange) {
        if (record.timestamp < criteria.dateRange.start || 
            record.timestamp > criteria.dateRange.end) {
          return false;
        }
      }
      
      if (criteria.location && 
          !record.event.location.name.toLowerCase().includes(criteria.location.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Start listening for sync updates
   */
  private static startSyncListener(): void {
    // Listen for new records from other peers
    db.traces.map().on((record: TraceRecord, key: string) => {
      if (record && typeof record === 'object' && record.id) {
        // Validate incoming record
        if (CryptoService.validateRecord(record)) {
          traceRecords.update(records => {
            const existingIndex = records.findIndex(r => r.id === record.id);
            if (existingIndex !== -1) {
              records[existingIndex] = record;
            } else {
              records.push(record);
            }
            return records;
          });

          // Update sync status
          syncStatus.update(status => ({
            ...status,
            lastSync: Date.now(),
            recordsCount: get(traceRecords).length
          }));
        } else {
          console.warn('Received invalid record from peer:', record.id);
        }
      }
    });
  }

  /**
   * Get network statistics
   */
  static getNetworkStats(): {
    totalRecords: number;
    uniqueProducts: number;
    uniqueActors: number;
    averageChainLength: number;
  } {
    const records = get(traceRecords);
    const uniqueProducts = new Set(records.map(r => r.event.product.id)).size;
    const uniqueActors = new Set(records.map(r => r.event.actor.id)).size;
    
    // Calculate average chain length
    const productGroups = records.reduce((acc, record) => {
      const productId = record.event.product.id;
      if (!acc[productId]) acc[productId] = [];
      acc[productId].push(record);
      return acc;
    }, {} as Record<string, TraceRecord[]>);
    
    const chainLengths = Object.values(productGroups).map(chain => chain.length);
    const averageChainLength = chainLengths.length > 0 
      ? chainLengths.reduce((sum, length) => sum + length, 0) / chainLengths.length
      : 0;

    return {
      totalRecords: records.length,
      uniqueProducts,
      uniqueActors,
      averageChainLength: Math.round(averageChainLength * 100) / 100
    };
  }
}