/**
 * Performance Monitor Service
 * Tracks and optimizes system performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowestRequest: 0,
        fastestRequest: Infinity
      },
      backends: new Map(),
      translations: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        charactersTranslated: 0
      },
      resources: {
        memoryUsage: [],
        networkRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      },
      errors: {
        networkErrors: 0,
        timeoutErrors: 0,
        serverErrors: 0,
        clientErrors: 0
      }
    };

    this.startTime = Date.now();
    this.isMonitoring = false;
    this.monitoringInterval = null;


  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Monitor memory usage every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryMetrics();
    }, 30000);

    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Record a request performance
   */
  recordRequest(backendId, responseTime, success = true, error = null) {
    // Update overall request metrics
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      this.recordError(error);
    }

    // Update response time metrics
    if (responseTime > 0) {
      this.metrics.requests.averageResponseTime = 
        (this.metrics.requests.averageResponseTime * (this.metrics.requests.total - 1) + responseTime) / 
        this.metrics.requests.total;
      
      this.metrics.requests.slowestRequest = Math.max(this.metrics.requests.slowestRequest, responseTime);
      this.metrics.requests.fastestRequest = Math.min(this.metrics.requests.fastestRequest, responseTime);
    }

    // Update backend-specific metrics
    if (!this.metrics.backends.has(backendId)) {
      this.metrics.backends.set(backendId, {
        requests: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        lastUsed: null
      });
    }

    const backendMetrics = this.metrics.backends.get(backendId);
    backendMetrics.requests++;
    backendMetrics.lastUsed = new Date();
    
    if (success) {
      backendMetrics.successful++;
    } else {
      backendMetrics.failed++;
    }

    if (responseTime > 0) {
      backendMetrics.averageResponseTime = 
        (backendMetrics.averageResponseTime * (backendMetrics.requests - 1) + responseTime) / 
        backendMetrics.requests;
    }
  }

  /**
   * Record translation performance
   */
  recordTranslation(responseTime, success = true, characterCount = 0) {
    this.metrics.translations.total++;
    
    if (success) {
      this.metrics.translations.successful++;
      this.metrics.translations.charactersTranslated += characterCount;
    } else {
      this.metrics.translations.failed++;
    }

    if (responseTime > 0) {
      this.metrics.translations.averageTime = 
        (this.metrics.translations.averageTime * (this.metrics.translations.total - 1) + responseTime) / 
        this.metrics.translations.total;
    }
  }

  /**
   * Record error details
   */
  recordError(error) {
    if (!error) return;

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      this.metrics.errors.timeoutErrors++;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      this.metrics.errors.networkErrors++;
    } else if (error.message.includes('5')) { // 5xx errors
      this.metrics.errors.serverErrors++;
    } else if (error.message.includes('4')) { // 4xx errors
      this.metrics.errors.clientErrors++;
    }
  }

  /**
   * Record cache performance
   */
  recordCacheHit() {
    this.metrics.resources.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.resources.cacheMisses++;
  }

  /**
   * Collect memory usage metrics
   */
  collectMemoryMetrics() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryInfo = {
        timestamp: Date.now(),
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
      };

      this.metrics.resources.memoryUsage.push(memoryInfo);

      // Keep only last 100 measurements
      if (this.metrics.resources.memoryUsage.length > 100) {
        this.metrics.resources.memoryUsage.shift();
      }
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const uptime = Date.now() - this.startTime;
    const uptimeMinutes = Math.round(uptime / 60000);

    return {
      uptime: {
        milliseconds: uptime,
        minutes: uptimeMinutes,
        formatted: this.formatUptime(uptime)
      },
      requests: {
        ...this.metrics.requests,
        successRate: this.metrics.requests.total > 0 ? 
          Math.round((this.metrics.requests.successful / this.metrics.requests.total) * 100) : 0,
        requestsPerMinute: uptimeMinutes > 0 ? 
          Math.round(this.metrics.requests.total / uptimeMinutes) : 0
      },
      translations: {
        ...this.metrics.translations,
        successRate: this.metrics.translations.total > 0 ? 
          Math.round((this.metrics.translations.successful / this.metrics.translations.total) * 100) : 0,
        charactersPerMinute: uptimeMinutes > 0 ? 
          Math.round(this.metrics.translations.charactersTranslated / uptimeMinutes) : 0
      },
      backends: Object.fromEntries(
        Array.from(this.metrics.backends.entries()).map(([id, metrics]) => [
          id, 
          {
            ...metrics,
            successRate: metrics.requests > 0 ? 
              Math.round((metrics.successful / metrics.requests) * 100) : 0
          }
        ])
      ),
      resources: {
        ...this.metrics.resources,
        cacheHitRate: (this.metrics.resources.cacheHits + this.metrics.resources.cacheMisses) > 0 ?
          Math.round((this.metrics.resources.cacheHits / 
            (this.metrics.resources.cacheHits + this.metrics.resources.cacheMisses)) * 100) : 0,
        currentMemory: this.metrics.resources.memoryUsage.length > 0 ?
          this.metrics.resources.memoryUsage[this.metrics.resources.memoryUsage.length - 1] : null
      },
      errors: this.metrics.errors,
      performance: {
        isHealthy: this.isSystemHealthy(),
        recommendations: this.getPerformanceRecommendations()
      }
    };
  }

  /**
   * Check if system performance is healthy
   */
  isSystemHealthy() {
    const successRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.successful / this.metrics.requests.total) : 1;
    
    const avgResponseTime = this.metrics.requests.averageResponseTime;
    
    return successRate >= 0.95 && avgResponseTime < 5000; // 95% success rate, <5s response time
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    
    const successRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.successful / this.metrics.requests.total) : 1;
    
    if (successRate < 0.9) {
      recommendations.push('Low success rate detected. Check backend health and network connectivity.');
    }
    
    if (this.metrics.requests.averageResponseTime > 3000) {
      recommendations.push('High response times detected. Consider optimizing backend performance or adding more instances.');
    }
    
    if (this.metrics.errors.timeoutErrors > this.metrics.requests.total * 0.1) {
      recommendations.push('High timeout rate. Consider increasing timeout values or improving backend response times.');
    }
    
    const cacheHitRate = (this.metrics.resources.cacheHits + this.metrics.resources.cacheMisses) > 0 ?
      (this.metrics.resources.cacheHits / (this.metrics.resources.cacheHits + this.metrics.resources.cacheMisses)) : 0;
    
    if (cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate. Consider implementing better caching strategies.');
    }

    return recommendations;
  }

  /**
   * Format uptime duration
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowestRequest: 0,
        fastestRequest: Infinity
      },
      backends: new Map(),
      translations: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        charactersTranslated: 0
      },
      resources: {
        memoryUsage: [],
        networkRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      },
      errors: {
        networkErrors: 0,
        timeoutErrors: 0,
        serverErrors: 0,
        clientErrors: 0
      }
    };

    this.startTime = Date.now();

  }
}

export default PerformanceMonitor;
