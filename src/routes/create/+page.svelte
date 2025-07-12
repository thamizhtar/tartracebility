<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { TraceService } from '$lib/services/traceService';
  import { CryptoService } from '$lib/services/cryptoService';
  import type { EventType, ActorType, Actor } from '$lib/types/traceability';

  let loading = false;
  let error = '';
  let success = false;

  // Form data
  let eventType: EventType = 'production';
  let productName = '';
  let productCategory = '';
  let productQuantity = 1;
  let productUnit = 'kg';
  let locationName = '';
  let locationAddress = '';
  let actorName = '';
  let actorType: ActorType = 'producer';
  let details = '';

  const eventTypes: EventType[] = [
    'production',
    'processing', 
    'packaging',
    'shipping',
    'receiving',
    'quality_check',
    'storage',
    'retail',
    'disposal'
  ];

  const actorTypes: ActorType[] = [
    'producer',
    'processor',
    'distributor', 
    'retailer',
    'consumer',
    'regulator',
    'auditor'
  ];

  let initialized = false;

  onMount(async () => {
    // Initialize TraceService if not already done
    if (!initialized) {
      const { publicKey, privateKey } = CryptoService.generateKeyPair();
      const demoActor: Actor = {
        id: 'user-' + Date.now(),
        name: 'Current User',
        type: 'producer',
        publicKey,
        verified: true
      };
      
      TraceService.initialize(demoActor, privateKey);
      initialized = true;
    }
  });

  async function handleSubmit() {
    if (!initialized) {
      error = 'Service not initialized. Please wait and try again.';
      return;
    }

    loading = true;
    error = '';
    success = false;

    try {
      // Validate required fields
      if (!productName.trim()) {
        throw new Error('Product name is required');
      }
      if (!locationName.trim()) {
        throw new Error('Location name is required');
      }
      if (!actorName.trim()) {
        throw new Error('Actor name is required');
      }

      // Create the trace record
      const traceEvent = {
        type: eventType,
        actor: {
          id: 'actor-' + Date.now(),
          name: actorName.trim(),
          type: actorType,
          publicKey: CryptoService.generateKeyPair().publicKey,
          verified: true
        },
        location: locationAddress.trim() 
          ? {
              id: 'location-' + Date.now(),
              name: locationName.trim(),
              address: locationAddress.trim()
            }
          : {
              id: 'location-' + Date.now(),
              name: locationName.trim()
            },
        product: {
          id: 'product-' + Date.now(),
          name: productName.trim(),
          category: productCategory.trim() || 'General',
          quantity: productQuantity,
          unit: productUnit
        },
        details: details.trim() ? { notes: details.trim() } : {}
      };

      await TraceService.createTraceRecord(traceEvent);
      
      success = true;
      
      // Reset form
      setTimeout(() => {
        productName = '';
        productCategory = '';
        productQuantity = 1;
        locationName = '';
        locationAddress = '';
        actorName = '';
        details = '';
        success = false;
      }, 2000);

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create record';
      console.error('Record creation error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Record - TraceChain</title>
</svelte:head>

<div class="create-page">
  <div class="header">
    <h1>Create Trace Record</h1>
    <p>Add a new event to the supply chain</p>
  </div>

  <div class="form-container">
    <form on:submit|preventDefault={handleSubmit}>
      
      <div class="form-section">
        <h3>Event Information</h3>
        
        <div class="form-group">
          <label for="eventType">Event Type</label>
          <select id="eventType" bind:value={eventType} required>
            {#each eventTypes as type}
              <option value={type}>{type.replace('_', ' ').toUpperCase()}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-section">
        <h3>Product Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="productName">Product Name *</label>
            <input 
              id="productName"
              type="text" 
              bind:value={productName}
              placeholder="e.g., Organic Tomatoes"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="productCategory">Category</label>
            <input 
              id="productCategory"
              type="text" 
              bind:value={productCategory}
              placeholder="e.g., Vegetables"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="productQuantity">Quantity</label>
            <input 
              id="productQuantity"
              type="number" 
              bind:value={productQuantity}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="productUnit">Unit</label>
            <select id="productUnit" bind:value={productUnit}>
              <option value="kg">Kilograms</option>
              <option value="lbs">Pounds</option>
              <option value="tons">Tons</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="liters">Liters</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Location Information</h3>
        
        <div class="form-group">
          <label for="locationName">Location Name *</label>
          <input 
            id="locationName"
            type="text" 
            bind:value={locationName}
            placeholder="e.g., Green Valley Farm"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="locationAddress">Address</label>
          <input 
            id="locationAddress"
            type="text" 
            bind:value={locationAddress}
            placeholder="e.g., 123 Farm Road, Valley City"
          />
        </div>
      </div>

      <div class="form-section">
        <h3>Actor Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="actorName">Actor Name *</label>
            <input 
              id="actorName"
              type="text" 
              bind:value={actorName}
              placeholder="e.g., John Smith"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="actorType">Actor Type</label>
            <select id="actorType" bind:value={actorType}>
              {#each actorTypes as type}
                <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Additional Details</h3>
        
        <div class="form-group">
          <label for="details">Notes</label>
          <textarea 
            id="details"
            bind:value={details}
            placeholder="Additional information about this event..."
            rows="3"
          ></textarea>
        </div>
      </div>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      {#if success}
        <div class="success-message">
          Record created successfully!
        </div>
      {/if}

      <div class="form-actions">
        <button type="button" on:click={() => goto('/')}>
          Cancel
        </button>
        <button type="submit" disabled={loading}>
          {#if loading}
            Creating...
          {:else}
            Create Record
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .create-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 300;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .header p {
    color: #666;
    font-size: 1.1rem;
  }

  .form-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
  }

  .form-section h3 {
    font-size: 1.2rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
    background: white;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
  }

  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
  }

  .success-message {
    background: #efe;
    color: #363;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #cfc;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .form-actions button {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .form-actions button[type="button"] {
    background: #f8f9fa;
    color: #666;
    border: 2px solid #e0e0e0;
  }

  .form-actions button[type="button"]:hover {
    background: #e9ecef;
  }

  .form-actions button[type="submit"] {
    background: #007bff;
    color: white;
  }

  .form-actions button[type="submit"]:hover:not(:disabled) {
    background: #0056b3;
  }

  .form-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .create-page {
      padding: 1rem;
    }

    .form-container {
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .header h1 {
      font-size: 2rem;
    }
  }
</style>