/**
 * Advanced Load Balancer Service
 * Implements multiple load balancing strategies for optimal backend selection
 */

class LoadBalancer {
  constructor(backendManager) {
    this.backendManager = backendManager;
    this.strategies = {
      ROUND_ROBIN: 'round_robin',
      LEAST_RESPONSE_TIME: 'least_response_time',
      LEAST_CONNECTIONS: 'least_connections',
      WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
      HEALTH_BASED: 'health_based'
    };
    
    this.currentStrategy = this.strategies.HEALTH_BASED;
    this.roundRobinIndex = 0;
    this.connectionCounts = new Map();
    
    // Initialize connection counts
    this.backendManager.backends.forEach(backend => {
      this.connectionCounts.set(backend.id, 0);
    });


  }

  /**
   * Select the best backend based on current strategy
   */
  selectBackend() {
    const healthyBackends = this.getHealthyBackends();
    
    if (healthyBackends.length === 0) {
      console.warn('⚠️ No healthy backends available for load balancing');
      return this.backendManager.backends[0]; // Fallback
    }

    if (healthyBackends.length === 1) {
      return healthyBackends[0];
    }

    switch (this.currentStrategy) {
      case this.strategies.ROUND_ROBIN:
        return this.roundRobinSelection(healthyBackends);
      
      case this.strategies.LEAST_RESPONSE_TIME:
        return this.leastResponseTimeSelection(healthyBackends);
      
      case this.strategies.LEAST_CONNECTIONS:
        return this.leastConnectionsSelection(healthyBackends);
      
      case this.strategies.WEIGHTED_ROUND_ROBIN:
        return this.weightedRoundRobinSelection(healthyBackends);
      
      case this.strategies.HEALTH_BASED:
        return this.healthBasedSelection(healthyBackends);
      
      default:
        return this.healthBasedSelection(healthyBackends);
    }
  }

  /**
   * Get all healthy backends
   */
  getHealthyBackends() {
    return this.backendManager.backends.filter(backend => {
      const health = this.backendManager.healthStatus.get(backend.id);
      return health.isHealthy && health.consecutiveFailures < this.backendManager.maxConsecutiveFailures;
    });
  }

  /**
   * Round Robin Selection
   */
  roundRobinSelection(healthyBackends) {
    const backend = healthyBackends[this.roundRobinIndex % healthyBackends.length];
    this.roundRobinIndex++;
    console.log(`🔄 Round Robin selected backend ${backend.id}`);
    return backend;
  }

  /**
   * Least Response Time Selection
   */
  leastResponseTimeSelection(healthyBackends) {
    const backend = healthyBackends.reduce((best, current) => {
      const bestHealth = this.backendManager.healthStatus.get(best.id);
      const currentHealth = this.backendManager.healthStatus.get(current.id);
      
      if (!bestHealth.responseTime) return current;
      if (!currentHealth.responseTime) return best;
      
      return currentHealth.responseTime < bestHealth.responseTime ? current : best;
    });
    
    console.log(`⚡ Least Response Time selected backend ${backend.id}`);
    return backend;
  }

  /**
   * Least Connections Selection
   */
  leastConnectionsSelection(healthyBackends) {
    const backend = healthyBackends.reduce((best, current) => {
      const bestConnections = this.connectionCounts.get(best.id) || 0;
      const currentConnections = this.connectionCounts.get(current.id) || 0;
      
      return currentConnections < bestConnections ? current : best;
    });
    
    console.log(`🔗 Least Connections selected backend ${backend.id}`);
    return backend;
  }

  /**
   * Weighted Round Robin Selection (based on response time performance)
   */
  weightedRoundRobinSelection(healthyBackends) {
    // Calculate weights based on inverse response time
    const weights = healthyBackends.map(backend => {
      const health = this.backendManager.healthStatus.get(backend.id);
      const responseTime = health.responseTime || 1000; // Default to 1000ms if no data
      return {
        backend,
        weight: Math.max(1, Math.round(1000 / responseTime)) // Higher weight for faster backends
      };
    });

    // Select based on weighted probability
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { backend, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        console.log(`⚖️ Weighted Round Robin selected backend ${backend.id}`);
        return backend;
      }
    }

    // Fallback to first backend
    return weights[0].backend;
  }

  /**
   * Health-Based Selection (considers multiple factors)
   */
  healthBasedSelection(healthyBackends) {
    // Score each backend based on multiple factors
    const scoredBackends = healthyBackends.map(backend => {
      const health = this.backendManager.healthStatus.get(backend.id);
      const connections = this.connectionCounts.get(backend.id) || 0;
      
      let score = 100; // Base score
      
      // Response time factor (lower is better)
      if (health.responseTime) {
        score -= Math.min(50, health.responseTime / 100); // Max penalty of 50 points
      }
      
      // Consecutive failures penalty
      score -= health.consecutiveFailures * 20;
      
      // Connection count penalty
      score -= connections * 5;
      
      // Uptime bonus
      if (health.uptime) {
        score += Math.min(20, health.uptime / 3600); // Max bonus of 20 points for uptime
      }
      
      return { backend, score: Math.max(0, score) };
    });

    // Select backend with highest score
    const best = scoredBackends.reduce((best, current) => 
      current.score > best.score ? current : best
    );


    return best.backend;
  }

  /**
   * Record a connection to a backend
   */
  recordConnection(backendId) {
    const current = this.connectionCounts.get(backendId) || 0;
    this.connectionCounts.set(backendId, current + 1);
  }

  /**
   * Record a disconnection from a backend
   */
  recordDisconnection(backendId) {
    const current = this.connectionCounts.get(backendId) || 0;
    this.connectionCounts.set(backendId, Math.max(0, current - 1));
  }

  /**
   * Change load balancing strategy
   */
  setStrategy(strategy) {
    if (Object.values(this.strategies).includes(strategy)) {
      this.currentStrategy = strategy;
      console.log('⚖️ Load balancing strategy changed to:', strategy);
      return true;
    }
    return false;
  }

  /**
   * Get current load balancing statistics
   */
  getStats() {
    const healthyBackends = this.getHealthyBackends();
    const connectionStats = {};
    
    this.backendManager.backends.forEach(backend => {
      connectionStats[backend.id] = this.connectionCounts.get(backend.id) || 0;
    });

    return {
      strategy: this.currentStrategy,
      healthyBackends: healthyBackends.length,
      totalBackends: this.backendManager.backends.length,
      connectionCounts: connectionStats,
      roundRobinIndex: this.roundRobinIndex
    };
  }

  /**
   * Reset load balancer state
   */
  reset() {
    this.roundRobinIndex = 0;
    this.connectionCounts.clear();
    
    this.backendManager.backends.forEach(backend => {
      this.connectionCounts.set(backend.id, 0);
    });
    

  }
}

export default LoadBalancer;
