/**
 * Enhanced API Service
 * Provides high-level API methods with automatic backend management
 */

import { axiosInstance } from '../lib/axios.js';
import backendManager from './backendManager.js';

class ApiService {
  constructor() {
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Initialize the API service
   */
  async initialize() {
    console.log('🚀 Initializing API Service...');
    
    // Start backend manager in production
    if (import.meta.env.PROD) {
      backendManager.start();
      
      // Wait for initial health check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = backendManager.getStatus();
      console.log(`✅ API Service initialized with ${status.healthyCount}/${status.totalCount} healthy backends`);
    } else {
      console.log('✅ API Service initialized in development mode');
    }
  }

  /**
   * Make a resilient API request with automatic retry and backend switching
   */
  async makeRequest(config, retryCount = 0) {
    try {
      const response = await axiosInstance(config);
      return response;
    } catch (error) {
      console.warn(`⚠️ API request failed (attempt ${retryCount + 1}/${this.maxRetries}):`, error.message);

      // If we have retries left and it's a server error, try again
      if (retryCount < this.maxRetries - 1 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * (retryCount + 1)); // Exponential backoff
        return this.makeRequest(config, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return !error.response || 
           error.response.status >= 500 || 
           error.code === 'NETWORK_ERROR' ||
           error.code === 'TIMEOUT';
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Authentication API methods
   */
  async login(credentials) {
    return this.makeRequest({
      method: 'POST',
      url: '/auth/login',
      data: credentials
    });
  }

  async register(userData) {
    return this.makeRequest({
      method: 'POST',
      url: '/auth/register',
      data: userData
    });
  }

  async logout() {
    return this.makeRequest({
      method: 'POST',
      url: '/auth/logout'
    });
  }

  async verifyEmail(token) {
    return this.makeRequest({
      method: 'POST',
      url: '/auth/verify-email',
      data: { token }
    });
  }

  /**
   * Translation API methods
   */
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    return this.makeRequest({
      method: 'POST',
      url: '/translation/translate',
      data: {
        text,
        targetLanguage,
        sourceLanguage
      }
    });
  }

  async getTranslationHistory(page = 1, limit = 20) {
    return this.makeRequest({
      method: 'GET',
      url: '/translation/history',
      params: { page, limit }
    });
  }

  async getTranslationStatus() {
    return this.makeRequest({
      method: 'GET',
      url: '/translation/status'
    });
  }

  /**
   * Messages API methods
   */
  async getMessages(conversationId, page = 1, limit = 50) {
    return this.makeRequest({
      method: 'GET',
      url: `/messages/${conversationId}`,
      params: { page, limit }
    });
  }

  async sendMessage(conversationId, messageData) {
    return this.makeRequest({
      method: 'POST',
      url: `/messages/${conversationId}`,
      data: messageData
    });
  }

  /**
   * Settings API methods
   */
  async getUserSettings() {
    return this.makeRequest({
      method: 'GET',
      url: '/settings'
    });
  }

  async updateUserSettings(settings) {
    return this.makeRequest({
      method: 'PUT',
      url: '/settings',
      data: settings
    });
  }

  /**
   * Health check methods
   */
  async checkBackendHealth() {
    if (import.meta.env.PROD) {
      await backendManager.performHealthCheck();
      return backendManager.getStatus();
    } else {
      // Simple health check for development
      try {
        const response = await axiosInstance.get('/health');
        return { healthy: true, data: response.data };
      } catch (error) {
        return { healthy: false, error: error.message };
      }
    }
  }

  /**
   * Get API service status
   */
  getStatus() {
    if (import.meta.env.PROD) {
      return {
        mode: 'production',
        backendManager: backendManager.getStatus(),
        requestQueue: this.requestQueue.length
      };
    } else {
      return {
        mode: 'development',
        baseURL: import.meta.env.VITE_API_URL,
        requestQueue: this.requestQueue.length
      };
    }
  }

  /**
   * Force backend switch (for testing)
   */
  forceBackendSwitch(backendId) {
    if (import.meta.env.PROD) {
      return backendManager.forceBackend(backendId);
    }
    return false;
  }

  /**
   * Set load balancing strategy
   */
  setLoadBalancingStrategy(strategy) {
    if (import.meta.env.PROD) {
      return backendManager.setLoadBalancingStrategy(strategy);
    }
    return false;
  }

  /**
   * Get available load balancing strategies
   */
  getLoadBalancingStrategies() {
    return [
      'round_robin',
      'least_response_time',
      'least_connections',
      'weighted_round_robin',
      'health_based'
    ];
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (import.meta.env.PROD) {
      backendManager.stop();
    }
    this.requestQueue = [];
    console.log('🧹 API Service cleaned up');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
