export interface TraceRecord {
  id: string;
  timestamp: number;
  previousHash: string;
  hash: string;
  event: TraceEvent;
  signature: string;
  metadata: TraceMetadata;
}

export interface TraceEvent {
  type: EventType;
  actor: Actor;
  location: Location;
  product: Product;
  details: Record<string, any>;
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  publicKey: string;
  verified: boolean;
}

export interface Location {
  id: string;
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  batch?: string;
  sku?: string;
  quantity: number;
  unit: string;
}

export interface TraceMetadata {
  version: string;
  schemaVersion: string;
  networkId: string;
  peerId: string;
  parentRecords?: string[];
  childRecords?: string[];
}

export type EventType = 
  | 'production'
  | 'processing'
  | 'packaging'
  | 'shipping'
  | 'receiving'
  | 'quality_check'
  | 'storage'
  | 'retail'
  | 'disposal';

export type ActorType = 
  | 'producer'
  | 'processor'
  | 'distributor'
  | 'retailer'
  | 'consumer'
  | 'regulator'
  | 'auditor';

export interface TraceChain {
  id: string;
  name: string;
  records: TraceRecord[];
  isValid: boolean;
  lastUpdated: number;
}

export interface PeerInfo {
  id: string;
  publicKey: string;
  lastSeen: number;
  isOnline: boolean;
  reputation: number;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  lastSync: number;
  peersConnected: number;
  recordsCount: number;
}