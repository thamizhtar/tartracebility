<script lang="ts">
  import { onMount } from 'svelte';
  import { syncStatus, connectedPeers } from '$lib/stores/gun';
  import '$lib/styles/global.css';

  let mounted = false;

  onMount(() => {
    mounted = true;
    // Initialize Gun.js connection
    console.log('P2P Traceability App initialized');
  });
</script>

<div class="app">
  <header class="header">
    <div class="container">
      <h1 class="logo">
        <span class="logo-icon">🔗</span>
        TraceChain
      </h1>
      
      {#if mounted}
        <div class="status-bar">
          <div class="peer-status" class:online={$connectedPeers.length > 0}>
            <span class="status-dot"></span>
            {$connectedPeers.length} peers connected
          </div>
          
          <div class="sync-status" class:syncing={$syncStatus.status === 'syncing'}>
            <span class="sync-icon">⟲</span>
            {$syncStatus.recordsCount} records
          </div>
        </div>
      {/if}
    </div>
  </header>

  <nav class="nav">
    <div class="container">
      <a href="/" class="nav-link">Dashboard</a>
      <a href="/create" class="nav-link">Create Record</a>
      <a href="/chains" class="nav-link">View Chains</a>
      <a href="/search" class="nav-link">Search</a>
      <a href="/network" class="nav-link">Network</a>
    </div>
  </nav>

  <main class="main">
    <div class="container">
      <slot />
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2024 P2P Supply Chain Traceability System</p>
    </div>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    width: 100%;
  }

  .header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem 0;
  }

  .header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon {
    font-size: 2rem;
  }

  .status-bar {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .peer-status, .sync-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    transition: all 0.3s ease;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    transition: background-color 0.3s ease;
  }

  .peer-status.online .status-dot {
    background: #10b981;
  }

  .sync-icon {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .sync-status.syncing .sync-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .nav {
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav .container {
    display: flex;
    gap: 2rem;
    padding: 1rem;
  }

  .nav-link {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .nav-link:hover {
    color: white;
  }

  .main {
    flex: 1;
    padding: 2rem 0;
  }

  .footer {
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 0;
    text-align: center;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .header .container {
      flex-direction: column;
      gap: 1rem;
    }

    .nav .container {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .status-bar {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>