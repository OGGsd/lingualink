/**
 * Backend Configuration Service
 * Dynamically loads backend instances from environment variables
 * Supports unlimited number of backend instances for scalability
 */

class BackendConfig {
  constructor() {
    this.backends = this.loadBackendsFromEnv();
    this.validateConfiguration();
  }

  /**
   * Load backend instances from environment variables
   * Supports pattern: VITE_RENDER_BACKEND_N, VITE_FROM_EMAIL_ACCOUNT_N
   */
  loadBackendsFromEnv() {
    const backends = [];
    let backendIndex = 1;
    const maxBackends = 50; // Safety limit to prevent infinite loop

    // Keep checking for backend environment variables
    while (backendIndex <= maxBackends) {
      const backendUrl = import.meta.env[`VITE_RENDER_BACKEND_${backendIndex}`];

      if (!backendUrl) {
        break; // No more backends found
      }

      const fromEmail = import.meta.env[`VITE_FROM_EMAIL_ACCOUNT_${backendIndex}`];

      const backend = {
        id: backendIndex,
        url: this.normalizeUrl(backendUrl),
        email: fromEmail || `backend${backendIndex}@example.com`,
        deeplConfigured: true, // Each backend has its own DeepL key
        createdAt: new Date().toISOString()
      };

      backends.push(backend);
      backendIndex++;
    }

    // Development fallback
    if (backends.length === 0 && import.meta.env.DEV) {
      backends.push({
        id: 1,
        url: 'http://localhost:3000',
        email: 'dev@localhost',
        deeplConfigured: true,
        createdAt: new Date().toISOString()
      });
    }
    return backends;
  }

  /**
   * Normalize URL format
   */
  normalizeUrl(url) {
    if (!url) return '';
    
    // Remove trailing slash and /api path
    return url.replace(/\/+$/, '').replace(/\/api$/, '');
  }

  /**
   * Validate backend configuration
   */
  validateConfiguration() {
    if (this.backends.length === 0) {
      throw new Error('❌ No backend instances configured! Please set VITE_RENDER_BACKEND_1 environment variable.');
    }

    // Validate each backend
    this.backends.forEach(backend => {
      if (!backend.url || !backend.url.startsWith('http')) {
        throw new Error(`❌ Invalid backend URL for backend ${backend.id}: ${backend.url}`);
      }
    });


  }

  /**
   * Get all backend instances
   */
  getBackends() {
    return [...this.backends]; // Return copy to prevent mutation
  }

  /**
   * Get backend by ID
   */
  getBackendById(id) {
    return this.backends.find(backend => backend.id === id);
  }

  /**
   * Get backend count
   */
  getBackendCount() {
    return this.backends.length;
  }

  /**
   * Add new backend instance (for dynamic scaling)
   */
  addBackend(url, email) {
    const newId = Math.max(...this.backends.map(b => b.id)) + 1;
    const backend = {
      id: newId,
      url: this.normalizeUrl(url),
      email: email || `backend${newId}@example.com`,
      deeplConfigured: true,
      createdAt: new Date().toISOString()
    };

    this.backends.push(backend);
    console.log(`➕ Added new backend ${newId}: ${backend.url}`);
    return backend;
  }

  /**
   * Remove backend instance
   */
  removeBackend(id) {
    const index = this.backends.findIndex(backend => backend.id === id);
    if (index !== -1) {
      const removed = this.backends.splice(index, 1)[0];

      return removed;
    }
    return null;
  }

  /**
   * Get configuration summary
   */
  getSummary() {
    return {
      totalBackends: this.backends.length,
      environment: import.meta.env.MODE,
      backends: this.backends.map(b => ({
        id: b.id,
        url: b.url,
        email: b.email,
        deeplConfigured: b.deeplConfigured
      }))
    };
  }

  /**
   * Reload configuration from environment
   */
  reload() {

    this.backends = this.loadBackendsFromEnv();
    this.validateConfiguration();
    return this.backends.length;
  }

  /**
   * Export configuration for debugging
   */
  exportConfig() {
    return {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      backends: this.backends,
      environmentVariables: this.getEnvironmentVariables()
    };
  }

  /**
   * Get relevant environment variables for debugging
   */
  getEnvironmentVariables() {
    const envVars = {};
    
    // Get all VITE_RENDER_BACKEND_* variables
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_RENDER_BACKEND_') || 
          key.startsWith('VITE_FROM_EMAIL_ACCOUNT_') ||
          key === 'VITE_API_URL') {
        envVars[key] = import.meta.env[key];
      }
    });

    return envVars;
  }
}

// Create singleton instance
const backendConfig = new BackendConfig();

export default backendConfig;
