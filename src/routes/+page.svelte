<script lang="ts">
  import { onMount } from 'svelte';
  import { TraceService } from '$lib/services/traceService';
  import { CryptoService } from '$lib/services/cryptoService';
  import { traceRecords, connectedPeers, syncStatus } from '$lib/stores/gun';
  import type { Actor } from '$lib/types/traceability';

  let initialized = false;
  let networkStats = {
    totalRecords: 0,
    uniqueProducts: 0,
    uniqueActors: 0,
    averageChainLength: 0
  };

  onMount(async () => {
    // Initialize with demo actor
    const { publicKey, privateKey } = CryptoService.generateKeyPair();
    const demoActor: Actor = {
      id: 'demo-user-' + Date.now(),
      name: 'Demo User',
      type: 'producer',
      publicKey,
      verified: true
    };

    TraceService.initialize(demoActor, privateKey);
    initialized = true;

    // Update stats when records change
    const unsubscribe = traceRecords.subscribe(records => {
      networkStats = TraceService.getNetworkStats();
    });

    return () => {
      unsubscribe();
    };
  });

  $: peersOnline = $connectedPeers.filter(p => p.isOnline).length;
</script>

<svelte:head>
  <title>Dashboard - P2P Supply Chain Traceability</title>
</svelte:head>

<div class="dashboard">
  <div class="hero">
    <h1>Supply Chain Traceability Dashboard</h1>
    <p class="hero-subtitle">
      Decentralized peer-to-peer tracking system for transparent supply chains
    </p>
  </div>

  {#if initialized}
    <div class="stats-grid grid grid-4">
      <div class="stat-card card">
        <div class="card-body text-center">
          <div class="stat-value text-primary">{networkStats.totalRecords}</div>
          <div class="stat-label">Total Records</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="card-body text-center">
          <div class="stat-value text-success">{networkStats.uniqueProducts}</div>
          <div class="stat-label">Tracked Products</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="card-body text-center">
          <div class="stat-value text-warning">{networkStats.uniqueActors}</div>
          <div class="stat-label">Network Actors</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="card-body text-center">
          <div class="stat-value text-secondary">{peersOnline}</div>
          <div class="stat-label">Peers Online</div>
        </div>
      </div>
    </div>

    <div class="main-content grid grid-2">
      <div class="network-status card">
        <div class="card-header">
          <h3 class="mb-0">Network Status</h3>
        </div>
        <div class="card-body">
          <div class="status-item">
            <span class="status-label">Sync Status:</span>
            <span class="status-badge" class:status-online={$syncStatus.status === 'idle'}
                  class:status-syncing={$syncStatus.status === 'syncing'}
                  class:status-offline={$syncStatus.status === 'error'}>
              <span class="status-dot"></span>
              {$syncStatus.status === 'idle' ? 'Online' : $syncStatus.status}
            </span>
          </div>

          <div class="status-item">
            <span class="status-label">Last Sync:</span>
            <span class="status-value">
              {$syncStatus.lastSync ? new Date($syncStatus.lastSync).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          <div class="status-item">
            <span class="status-label">Average Chain Length:</span>
            <span class="status-value">{networkStats.averageChainLength} records</span>
          </div>

          <div class="status-item">
            <span class="status-label">Data Integrity:</span>
            <span class="status-badge status-online">
              <span class="status-dot"></span>
              Verified
            </span>
          </div>
        </div>
      </div>

      <div class="quick-actions card">
        <div class="card-header">
          <h3 class="mb-0">Quick Actions</h3>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <a href="/create" class="btn btn-primary">
              <span>📝</span>
              Create Record
            </a>

            <a href="/search" class="btn btn-secondary">
              <span>🔍</span>
              Search Records
            </a>

            <a href="/chains" class="btn btn-secondary">
              <span>🔗</span>
              View Chains
            </a>

            <a href="/network" class="btn btn-secondary">
              <span>🌐</span>
              Network Info
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="recent-activity card">
      <div class="card-header">
        <h3 class="mb-0">Recent Activity</h3>
      </div>
      <div class="card-body">
        {#if $traceRecords.length > 0}
          <div class="activity-list">
            {#each $traceRecords.slice(-5).reverse() as record}
              <div class="activity-item">
                <div class="activity-icon">
                  {#if record.event.type === 'production'}📦
                  {:else if record.event.type === 'shipping'}🚚
                  {:else if record.event.type === 'quality_check'}✅
                  {:else}📋{/if}
                </div>
                <div class="activity-content">
                  <div class="activity-title">
                    {record.event.type.replace('_', ' ').toUpperCase()} - {record.event.product.name}
                  </div>
                  <div class="activity-subtitle">
                    by {record.event.actor.name} at {record.event.location.name}
                  </div>
                  <div class="activity-time">
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state text-center">
            <p class="text-secondary">No trace records yet. <a href="/create">Create your first record</a> to get started.</p>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="loading-state text-center">
      <div class="loading"></div>
      <p>Initializing P2P network...</p>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hero {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
    color: var(--text-light);
  }

  .hero h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
    background: linear-gradient(135deg, #ffffff, #f0f8ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
  }

  .stats-grid {
    margin-bottom: var(--spacing-2xl);
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: var(--spacing-xs);
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .main-content {
    margin-bottom: var(--spacing-2xl);
  }

  .network-status .card-body,
  .quick-actions .card-body {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .status-item:last-child {
    border-bottom: none;
  }

  .status-label {
    font-weight: 500;
    color: var(--text-primary);
  }

  .status-value {
    color: var(--text-secondary);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  .actions-grid .btn {
    justify-content: flex-start;
    padding: var(--spacing-md);
  }

  .recent-activity {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .activity-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .activity-item:last-child {
    border-bottom: none;
  }

  .activity-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .activity-content {
    flex: 1;
  }

  .activity-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .activity-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .activity-time {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .loading-state {
    padding: var(--spacing-2xl);
    color: var(--text-light);
  }

  .loading-state .loading {
    margin: 0 auto var(--spacing-md);
    border-color: rgba(255, 255, 255, 0.3);
    border-top-color: white;
    width: 40px;
    height: 40px;
  }

  .empty-state {
    padding: var(--spacing-2xl);
  }

  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }

    .hero-subtitle {
      font-size: 1rem;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>