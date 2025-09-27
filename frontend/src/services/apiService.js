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
    this.cloudflareWorkerURL = 'https://lingualink-api.stefanjohnmiranda3.workers.dev';
  }

  /**
   * Initialize the API service
   */
  async initialize() {
    // Start backend manager in production
    if (import.meta.env.PROD) {
      backendManager.start();

      // Wait for initial health check
      await new Promise(resolve => setTimeout(resolve, 2000));
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
   * Admin API Methods
   */

  /**
   * Get admin analytics data (using Cloudflare Worker)
   */
  async getAdminAnalytics() {
    try {
      const response = await fetch(`${this.cloudflareWorkerURL}/api/health/admin/analytics`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get admin analytics from Cloudflare Worker:', error);
      // Fallback to local backend
      const response = await this.get('/health/admin/analytics');
      return response.data;
    }
  }

  /**
   * Generate email using AI (using Cloudflare Worker)
   */
  async generateEmail(prompt) {
    console.log('🌐 Calling Cloudflare Worker for email generation:', prompt);
    console.log('🔗 Worker URL:', `${this.cloudflareWorkerURL}/api/health/generate-email`);

    try {
      const response = await fetch(`${this.cloudflareWorkerURL}/api/health/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      console.log('📡 Cloudflare Worker response status:', response.status);
      console.log('📡 Cloudflare Worker response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📧 Cloudflare Worker response data:', data);

      return data;
    } catch (error) {
      console.error('❌ Failed to generate email with Cloudflare Worker:', error);

      try {
        console.log('🔄 Falling back to local backend...');
        // Fallback to local backend
        const response = await this.post('/health/generate-email', { prompt });
        return response.data;
      } catch (fallbackError) {
        console.error('❌ Local backend fallback also failed:', fallbackError);
        throw new Error(`Both Cloudflare Worker and local backend failed: ${error.message}`);
      }
    }
  }

  /**
   * Get load balancing statistics
   */
  async getLoadBalancingStats() {
    const response = await this.get('/health/load-balancing');
    return response.data;
  }

  /**
   * Find user by email (Admin only) - using Cloudflare Worker with fallback
   */
  async findUser(email) {
    try {
      const response = await fetch(`${this.cloudflareWorkerURL}/api/health/admin/find-user/${email}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to find user with Cloudflare Worker:', error);
      // Fallback to local backend
      const response = await this.get(`/health/admin/find-user/${email}`);
      return response.data;
    }
  }

  /**
   * Make user admin (Admin only) - using Cloudflare Worker with fallback
   */
  async makeUserAdmin(email) {
    try {
      const response = await fetch(`${this.cloudflareWorkerURL}/api/health/admin/make-admin/${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to make user admin with Cloudflare Worker:', error);
      // Fallback to local backend
      const response = await this.post(`/health/admin/make-admin/${email}`);
      return response.data;
    }
  }

  /**
   * Remove admin privileges (Admin only)
   */
  async removeUserAdmin(email) {
    try {
      const response = await this.post(`/health/admin/remove-admin/${email}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove admin privileges:', error);
      throw error;
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers() {
    try {
      const response = await this.get('/health/admin/users');
      return response.data;
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  /**
   * Get enhanced analytics (Admin only)
   */
  async getEnhancedAnalytics() {
    try {
      const response = await this.get('/health/admin/enhanced-analytics');
      return response.data;
    } catch (error) {
      console.error('Failed to get enhanced analytics:', error);
      throw error;
    }
  }

  /**
   * Send email (Admin only)
   */
  async sendEmail(emailData) {
    try {
      const response = await this.post('/health/admin/send-email', emailData);
      return response.data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Get email templates (Admin only)
   */
  async getEmailTemplates() {
    try {
      const response = await this.get('/health/admin/email-templates');
      return response.data;
    } catch (error) {
      console.error('Failed to get email templates:', error);
      throw error;
    }
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
