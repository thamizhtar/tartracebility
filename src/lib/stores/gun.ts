import Gun from 'gun';
import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { TraceRecord, TraceChain, PeerInfo, SyncStatus } from '$lib/types/traceability';

// Stores for reactive data
export const traceRecords: Writable<TraceRecord[]> = writable([]);
export const traceChains: Writable<TraceChain[]> = writable([]);
export const connectedPeers: Writable<PeerInfo[]> = writable([]);
export const syncStatus: Writable<SyncStatus> = writable({
  status: 'idle',
  lastSync: 0,
  peersConnected: 0,
  recordsCount: 0
});

// Gun.js configuration - only initialize in browser
let gun: any;
let db: any;

if (browser) {
  gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);

  // Gun database references
  db = {
    traces: gun.get('traces'),
    chains: gun.get('chains'),
    peers: gun.get('peers'),
    user: gun.user
  };

  // Initialize peer monitoring
  gun.on('hi', (peer: any) => {
    connectedPeers.update(peers => {
      const existingPeer = peers.find(p => p.id === peer.id);
      if (existingPeer) {
        existingPeer.lastSeen = Date.now();
        existingPeer.isOnline = true;
        return peers;
      } else {
        return [...peers, {
          id: peer.id,
          publicKey: '',
          lastSeen: Date.now(),
          isOnline: true,
          reputation: 0
        }];
      }
    });
    
    syncStatus.update(status => ({
      ...status,
      peersConnected: status.peersConnected + 1
    }));
  });

  gun.on('bye', (peer: any) => {
    connectedPeers.update(peers => {
      const peerIndex = peers.findIndex(p => p.id === peer.id);
      if (peerIndex !== -1) {
        peers[peerIndex].isOnline = false;
        peers[peerIndex].lastSeen = Date.now();
      }
      return peers;
    });
    
    syncStatus.update(status => ({
      ...status,
      peersConnected: Math.max(0, status.peersConnected - 1)
    }));
  });
} else {
  // Provide fallback for server-side rendering
  db = {
    traces: null,
    chains: null,
    peers: null,
    user: null
  };
}


export { db }