/**
 * SMART Keep-Alive System for Render Free Tier
 * Maximizes limited resources by intelligent backend rotation and selective pinging
 */

class SmartKeepAlive {
  constructor(backendManager) {
    this.backendManager = backendManager;
    
    // Resource-efficient configuration
    this.rotationInterval = 8 * 60 * 1000; // 8 minutes - rotate active backend
    this.maxActiveBackends = 2; // Keep max 2 backends alive at once
    this.sleepThreshold = 14 * 60 * 1000; // 14 minutes (just under Render's 15min limit)
    
    // State management
    this.activeBackends = new Set();
    this.lastPingTimes = new Map();
    this.rotationIndex = 0;
    this.intervalId = null;
    
    // Statistics
    this.stats = {
      totalPings: 0,
      bandwidthSaved: 0,
      instanceHoursSaved: 0,
      rotations: 0
    };

    console.log('🧠 Smart Keep-Alive initialized - Resource-efficient mode');
  }

  /**
   * Start the smart keep-alive system
   */
  start() {
    if (this.intervalId) {
      console.log('🔄 Smart Keep-Alive already running');
      return;
    }

    console.log('🚀 Starting Smart Keep-Alive system...');
    
    // Initialize with primary backend
    this.selectInitialBackends();
    
    // Start rotation cycle
    this.intervalId = setInterval(() => {
      this.performSmartKeepAlive();
    }, this.rotationInterval);

    // Immediate first ping
    this.performSmartKeepAlive();
    
    console.log(`✅ Smart Keep-Alive started (${this.maxActiveBackends} active backends, ${this.rotationInterval/60000}min rotation)`);
  }

  /**
   * Stop the smart keep-alive system
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.activeBackends.clear();
    console.log('⏹️ Smart Keep-Alive stopped');
  }

  /**
   * Select initial backends to keep alive
   */
  selectInitialBackends() {
    const backends = this.backendManager.backends;
    
    // Always include the primary backend (Backend 1)
    this.activeBackends.add(1);
    
    // Add one more backend for redundancy
    if (backends.length > 1) {
      this.activeBackends.add(2);
    }
    
    console.log(`🎯 Initial active backends: [${Array.from(this.activeBackends).join(', ')}]`);
  }

  /**
   * Perform smart keep-alive with resource optimization
   */
  async performSmartKeepAlive() {
    console.log('🧠 Smart Keep-Alive cycle starting...');
    
    // 1. Ping currently active backends
    await this.pingActiveBackends();
    
    // 2. Rotate backends to distribute load and save resources
    this.rotateActiveBackends();
    
    // 3. Update statistics
    this.updateResourceStats();
    
    console.log(`📊 Active backends: [${Array.from(this.activeBackends).join(', ')}] | Pings: ${this.stats.totalPings} | Rotations: ${this.stats.rotations}`);
  }

  /**
   * Ping only the currently active backends
   */
  async pingActiveBackends() {
    const pingPromises = [];
    
    for (const backendId of this.activeBackends) {
      const backend = this.backendManager.backends.find(b => b.id === backendId);
      if (backend) {
        pingPromises.push(this.pingBackend(backend));
      }
    }
    
    await Promise.allSettled(pingPromises);
  }

  /**
   * Ping a specific backend with proper error handling
   */
  async pingBackend(backend) {
    if (!backend || !backend.url) {
      console.error('❌ Invalid backend configuration');
      return false;
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${backend.url}/api/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LinguaLink-KeepAlive/1.0'
        }
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      this.lastPingTimes.set(backend.id, Date.now());
      this.stats.totalPings++;

      if (response.ok) {
        const data = await response.json();
        console.log(`💚 Backend ${backend.id} alive (${responseTime}ms, uptime: ${Math.round(data.uptime / 60)}m)`);
        
        // Update backend manager health status
        const health = this.backendManager.healthStatus.get(backend.id);
        if (health) {
          health.isHealthy = true;
          health.lastCheck = new Date();
          health.responseTime = responseTime;
          health.consecutiveFailures = 0;
          health.uptime = data.uptime;
        }
        
        return true;
      } else {
        console.warn(`⚠️ Backend ${backend.id} returned ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn(`❌ Backend ${backend.id} ping failed: ${error.message}`);
      
      // Update backend manager health status
      const health = this.backendManager.healthStatus.get(backend.id);
      if (health) {
        health.isHealthy = false;
        health.consecutiveFailures++;
        health.lastError = error.message;
      }
      
      return false;
    }
  }

  /**
   * Rotate active backends to distribute resource usage
   */
  rotateActiveBackends() {
    const totalBackends = this.backendManager.backends.length;
    
    if (totalBackends <= this.maxActiveBackends) {
      return; // No need to rotate if we have few backends
    }

    // Every 3rd rotation, change one of the active backends
    if (this.stats.rotations % 3 === 0) {
      const activeArray = Array.from(this.activeBackends);
      const backendToReplace = activeArray[this.rotationIndex % activeArray.length];
      
      // Find next backend to activate
      let nextBackendId = (backendToReplace % totalBackends) + 1;
      
      // Skip if already active
      while (this.activeBackends.has(nextBackendId) && nextBackendId !== backendToReplace) {
        nextBackendId = (nextBackendId % totalBackends) + 1;
      }
      
      if (nextBackendId !== backendToReplace) {
        this.activeBackends.delete(backendToReplace);
        this.activeBackends.add(nextBackendId);
        
        console.log(`🔄 Rotated: Backend ${backendToReplace} → Backend ${nextBackendId}`);
        this.rotationIndex++;
      }
    }
    
    this.stats.rotations++;
  }

  /**
   * Update resource usage statistics
   */
  updateResourceStats() {
    const totalBackends = this.backendManager.backends.length;
    const activeBackends = this.activeBackends.size;
    
    // Estimate bandwidth saved (each ping ~1KB, each rotation saves ~5KB)
    const bandwidthPerPing = 1; // KB
    const savedPings = (totalBackends - activeBackends) * bandwidthPerPing;
    this.stats.bandwidthSaved += savedPings;
    
    // Estimate instance hours saved (keeping backends asleep saves compute time)
    const hoursPerRotation = this.rotationInterval / (1000 * 60 * 60); // Convert to hours
    const savedHours = (totalBackends - activeBackends) * hoursPerRotation;
    this.stats.instanceHoursSaved += savedHours;
  }

  /**
   * Get current status and statistics
   */
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      activeBackends: Array.from(this.activeBackends),
      maxActiveBackends: this.maxActiveBackends,
      rotationInterval: this.rotationInterval,
      stats: {
        ...this.stats,
        bandwidthSavedMB: Math.round(this.stats.bandwidthSaved / 1024 * 100) / 100,
        instanceHoursSaved: Math.round(this.stats.instanceHoursSaved * 100) / 100
      },
      lastPingTimes: Object.fromEntries(this.lastPingTimes),
      resourceEfficiency: {
        activeBandwidthUsage: `${this.activeBackends.size}/${this.backendManager.backends.length} backends`,
        estimatedMonthlySavings: this.calculateMonthlySavings()
      }
    };
  }

  /**
   * Calculate estimated monthly resource savings
   */
  calculateMonthlySavings() {
    const totalBackends = this.backendManager.backends.length;
    const activeBackends = this.activeBackends.size;
    
    // Estimate monthly savings
    const pingsPerMonth = (30 * 24 * 60) / (this.rotationInterval / 60000); // Pings per month
    const bandwidthSavedPerMonth = (totalBackends - activeBackends) * pingsPerMonth * 1; // KB
    const instanceHoursSavedPerMonth = (totalBackends - activeBackends) * (30 * 24) * 0.1; // Rough estimate
    
    return {
      bandwidthSavedMB: Math.round(bandwidthSavedPerMonth / 1024),
      instanceHoursSaved: Math.round(instanceHoursSavedPerMonth),
      costSavings: 'Maximizes free tier usage'
    };
  }

  /**
   * Force wake up a specific backend
   */
  async wakeUpBackend(backendId) {
    const backend = this.backendManager.backends.find(b => b.id === backendId);
    if (!backend) {
      return false;
    }

    console.log(`🔧 Force waking up backend ${backendId}...`);
    const success = await this.pingBackend(backend);
    
    if (success) {
      this.activeBackends.add(backendId);
      console.log(`✅ Backend ${backendId} is now active`);
    }
    
    return success;
  }

  /**
   * Adjust resource usage based on demand
   */
  adjustResourceUsage(demand = 'normal') {
    switch (demand) {
      case 'high':
        this.maxActiveBackends = Math.min(4, this.backendManager.backends.length);
        this.rotationInterval = 6 * 60 * 1000; // 6 minutes
        break;
      case 'low':
        this.maxActiveBackends = 1;
        this.rotationInterval = 12 * 60 * 1000; // 12 minutes
        break;
      default: // normal
        this.maxActiveBackends = 2;
        this.rotationInterval = 8 * 60 * 1000; // 8 minutes
    }
    
    console.log(`⚙️ Resource usage adjusted to ${demand}: ${this.maxActiveBackends} active backends, ${this.rotationInterval/60000}min rotation`);
  }
}

export default SmartKeepAlive;
