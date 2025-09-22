/**
 * Backend Manager Service
 * Manages multiple backend instances with intelligent load balancing and health checking
 */

import LoadBalancer from './loadBalancer.js';
import backendConfig from './backendConfig.js';
import SmartKeepAlive from './smartKeepAlive.js';

class BackendManager {
  constructor() {
    // Backend instances configuration - loaded from environment variables
    this.backends = backendConfig.getBackends();

    // Health status for each backend
    this.healthStatus = new Map();
    
    // Initialize health status
    this.backends.forEach(backend => {
      this.healthStatus.set(backend.id, {
        isHealthy: true,
        lastCheck: null,
        responseTime: null,
        consecutiveFailures: 0,
        lastError: null,
        uptime: null
      });
    });

    // Configuration - SMART resource management for Render free tier
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes (balanced)
    this.keepAliveInterval = 12 * 60 * 1000; // 12 minutes (just under 15min sleep threshold)
    this.smartPingInterval = 8 * 60 * 1000; // 8 minutes for active backends only
    this.maxConsecutiveFailures = 3;
    this.requestTimeout = 8000; // 8 seconds
    this.healthCheckTimeout = 5000; // 5 seconds for health checks

    // Current backend selection
    this.currentBackendIndex = 0;
    this.lastUsedBackend = null;

    // Intervals
    this.healthCheckIntervalId = null;
    this.keepAliveIntervalId = null;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      backendSwitches: 0
    };

    // Initialize load balancer and smart keep-alive
    this.loadBalancer = new LoadBalancer(this);
    this.smartKeepAlive = new SmartKeepAlive(this);


  }

  /**
   * Reload backend configuration (for dynamic scaling)
   */
  reloadBackends() {

    const oldCount = this.backends.length;
    this.backends = backendConfig.getBackends();

    // Reinitialize health status for new backends
    this.backends.forEach(backend => {
      if (!this.healthStatus.has(backend.id)) {
        this.healthStatus.set(backend.id, {
          isHealthy: true,
          lastCheck: null,
          responseTime: null,
          consecutiveFailures: 0,
          lastError: null,
          uptime: null
        });
      }
    });


    return this.backends.length;
  }

  /**
   * Start the backend manager services
   */
  start() {

    // Start smart keep-alive system (replaces old keep-alive)
    this.smartKeepAlive.start();

    // Initial health check
    this.performHealthCheck();

    // Start health checking interval (less frequent now)
    this.healthCheckIntervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);


  }

  /**
   * Stop the backend manager services
   */
  stop() {

    // Stop smart keep-alive
    this.smartKeepAlive.stop();

    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }


  }

  /**
   * Get the best available backend using load balancer
   */
  getBestBackend() {
    const selectedBackend = this.loadBalancer.selectBackend();

    if (this.lastUsedBackend?.id !== selectedBackend.id) {
      this.stats.backendSwitches++;
      console.log(`🔄 Switching to backend ${selectedBackend.id} (${selectedBackend.url})`);
    }

    this.lastUsedBackend = selectedBackend;

    // Record connection for load balancing
    this.loadBalancer.recordConnection(selectedBackend.id);

    return selectedBackend;
  }

  /**
   * Get the API URL for the best backend
   */
  getApiUrl() {
    const backend = this.getBestBackend();
    return `${backend.url}/api`;
  }

  /**
   * Make a request to the best available backend with automatic failover
   */
  async makeRequest(endpoint, options = {}) {
    // Input validation
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint: must be a non-empty string');
    }

    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    const maxRetries = 3;
    let lastError = null;
    const attemptedBackends = new Set();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const backend = this.loadBalancer.selectBackend();

      if (!backend) {
        // Try to wake up a sleeping backend if all are unhealthy
        const sleepingBackend = this.backends.find(b => !this.healthStatus.get(b.id).isHealthy);
        if (sleepingBackend && !attemptedBackends.has(sleepingBackend.id)) {

          await this.wakeUpBackend(sleepingBackend.id);
          continue;
        }

        throw new Error('No healthy backends available and all wake-up attempts failed');
      }

      // Avoid retrying the same backend immediately
      if (attemptedBackends.has(backend.id) && attempt > 0) {
        continue;
      }

      attemptedBackends.add(backend.id);

      try {


        const url = `${backend.url}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        const requestOptions = {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
          }
        };

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Update stats
        this.stats.totalRequests++;
        this.lastUsedBackend = backend;

        if (response.ok) {
          this.stats.successfulRequests++;

          // Mark backend as healthy on successful request
          const health = this.healthStatus.get(backend.id);
          health.isHealthy = true;
          health.consecutiveFailures = 0;
          health.lastError = null;


          return response;
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

      } catch (error) {
        lastError = error;
        this.stats.failedRequests++;

        // Mark backend as unhealthy based on error type
        const health = this.healthStatus.get(backend.id);
        if (error.name === 'AbortError') {
          health.isHealthy = false;
          health.consecutiveFailures++;
          health.lastError = 'Request timeout';

        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          health.isHealthy = false;
          health.consecutiveFailures++;
          health.lastError = error.message;

        } else {
          // Server error - don't mark as unhealthy immediately

        }



        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`All backends failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Perform health check on all backends
   */
  async performHealthCheck() {
    console.log('🔍 Performing health check on all backends...');
    
    const healthPromises = this.backends.map(backend => 
      this.checkBackendHealth(backend)
    );

    await Promise.allSettled(healthPromises);
    
    const healthyCount = Array.from(this.healthStatus.values())
      .filter(status => status.isHealthy).length;
    
    console.log(`💚 Health check complete: ${healthyCount}/${this.backends.length} backends healthy`);
  }

  /**
   * Check health of a specific backend
   * Falls back to /api/ping if /api/health is not available
   */
  async checkBackendHealth(backend) {
    const startTime = Date.now();

    try {
      // Try new health endpoint first
      let response;
      let healthData;

      try {
        response = await fetch(`${backend.url}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(this.healthCheckTimeout)
        });

        if (response.ok) {
          healthData = await response.json();
        } else {
          throw new Error(`Health endpoint returned ${response.status}`);
        }
      } catch (healthError) {
        // Fallback to ping endpoint for older deployments
        console.log(`🔄 Backend ${backend.id}: Health endpoint not available, using ping fallback`);

        response = await fetch(`${backend.url}/api/ping`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(this.healthCheckTimeout)
        });

        if (response.ok) {
          const pingData = await response.json();
          // Convert ping response to health format
          healthData = {
            status: pingData.status === 'alive' ? 'healthy' : 'unhealthy',
            uptime: pingData.uptime,
            timestamp: pingData.timestamp
          };
        } else {
          throw new Error(`Ping endpoint returned ${response.status}`);
        }
      }

      const responseTime = Date.now() - startTime;
      const health = this.healthStatus.get(backend.id);
      health.isHealthy = response.ok && (healthData.status === 'healthy' || healthData.status === 'alive');
      health.lastCheck = new Date();
      health.responseTime = responseTime;
      health.consecutiveFailures = health.isHealthy ? 0 : health.consecutiveFailures + 1;
      health.lastError = null;
      health.uptime = healthData.uptime;

      console.log(`${health.isHealthy ? '💚' : '❌'} Backend ${backend.id}: ${health.isHealthy ? 'Healthy' : 'Unhealthy'} (${responseTime}ms)`);

    } catch (error) {
      const health = this.healthStatus.get(backend.id);
      health.isHealthy = false;
      health.lastCheck = new Date();
      health.responseTime = null;
      health.consecutiveFailures++;
      health.lastError = error.message;


    }
  }

  /**
   * Wake up a specific backend using smart keep-alive
   */
  async wakeUpBackend(backendId) {
    return await this.smartKeepAlive.wakeUpBackend(backendId);
  }

  /**
   * Adjust resource usage based on demand
   */
  adjustResourceUsage(demand = 'normal') {
    this.smartKeepAlive.adjustResourceUsage(demand);
  }

  /**
   * Get current status of all backends
   */
  getStatus() {
    const backendStatuses = this.backends.map(backend => {
      const health = this.healthStatus.get(backend.id);
      return {
        id: backend.id,
        url: backend.url,
        email: backend.email,
        isHealthy: health.isHealthy,
        responseTime: health.responseTime,
        consecutiveFailures: health.consecutiveFailures,
        lastCheck: health.lastCheck,
        lastError: health.lastError,
        uptime: health.uptime
      };
    });

    return {
      backends: backendStatuses,
      currentBackend: this.lastUsedBackend,
      stats: this.stats,
      healthyCount: backendStatuses.filter(b => b.isHealthy).length,
      totalCount: this.backends.length,
      loadBalancing: this.getLoadBalancingStats(),
      configuration: backendConfig.getSummary(),
      smartKeepAlive: this.smartKeepAlive.getStatus()
    };
  }

  /**
   * Force switch to a specific backend (for testing)
   */
  forceBackend(backendId) {
    const backend = this.backends.find(b => b.id === backendId);
    if (backend) {
      this.lastUsedBackend = backend;

      return true;
    }
    return false;
  }

  /**
   * Record request statistics
   */
  recordRequest(success) {
    this.stats.totalRequests++;
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
  }

  /**
   * Set load balancing strategy
   */
  setLoadBalancingStrategy(strategy) {
    return this.loadBalancer.setStrategy(strategy);
  }

  /**
   * Get load balancing statistics
   */
  getLoadBalancingStats() {
    return this.loadBalancer.getStats();
  }

  /**
   * Record connection end for load balancing
   */
  recordConnectionEnd(backendId) {
    this.loadBalancer.recordDisconnection(backendId);
  }
}

// Create singleton instance
const backendManager = new BackendManager();

// Expose globally for auth store access
if (typeof window !== 'undefined') {
  window.backendManager = backendManager;
}

export default backendManager;
