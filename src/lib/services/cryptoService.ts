import CryptoJS from 'crypto-js';
import type { TraceRecord } from '$lib/types/traceability';

export class CryptoService {
  /**
   * Calculate SHA-256 hash for a trace record
   */
  static calculateHash(record: Omit<TraceRecord, 'hash' | 'signature'>): string {
    const data = JSON.stringify({
      id: record.id,
      timestamp: record.timestamp,
      previousHash: record.previousHash,
      event: record.event,
      metadata: record.metadata
    });
    
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Validate hash chain integrity
   */
  static validateChain(records: TraceRecord[]): boolean {
    if (records.length === 0) return true;
    if (records.length === 1) return this.validateRecord(records[0]);

    // Sort records by timestamp
    const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sortedRecords.length; i++) {
      const currentRecord = sortedRecords[i];
      const previousRecord = sortedRecords[i - 1];

      // Validate current record hash
      if (!this.validateRecord(currentRecord)) {
        console.error(`Invalid hash for record ${currentRecord.id}`);
        return false;
      }

      // Validate chain link
      if (currentRecord.previousHash !== previousRecord.hash) {
        console.error(`Chain break between ${previousRecord.id} and ${currentRecord.id}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate individual record hash
   */
  static validateRecord(record: TraceRecord): boolean {
    const calculatedHash = this.calculateHash({
      id: record.id,
      timestamp: record.timestamp,
      previousHash: record.previousHash,
      event: record.event,
      metadata: record.metadata
    });

    return calculatedHash === record.hash;
  }

  /**
   * Generate digital signature for a record
   */
  static signRecord(record: TraceRecord, privateKey: string): string {
    const dataToSign = `${record.hash}:${record.timestamp}:${record.event.actor.id}`;
    return CryptoJS.HmacSHA256(dataToSign, privateKey).toString();
  }

  /**
   * Verify digital signature
   */
  static verifySignature(record: TraceRecord, publicKey: string): boolean {
    try {
      const dataToSign = `${record.hash}:${record.timestamp}:${record.event.actor.id}`;
      const expectedSignature = CryptoJS.HmacSHA256(dataToSign, publicKey).toString();
      return expectedSignature === record.signature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate key pair for actor authentication
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const privateKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return { publicKey, privateKey };
  }

  /**
   * Generate secure random ID
   */
  static generateSecureId(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }
}