import { axiosInstance } from '../lib/axios.js';
import backendManager from './backendManager.js';

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pingInterval = 8 * 60 * 1000; // 8 minutes - SMART resource management
    this.retryDelay = 30 * 1000; // 30 seconds retry delay
    this.maxRetries = 3;
    this.useBackendManager = import.meta.env.PROD; // Use backend manager in production
  }

  /**
   * Start the keep-alive service
   * Pings the backend every 10 minutes to prevent Render from sleeping
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 Keep-alive service is already running');
      return;
    }

    console.log('🚀 Starting SMART keep-alive service (resource-efficient)');
    this.isRunning = true;

    // If using backend manager, start it and let it handle keep-alive
    if (this.useBackendManager) {
      console.log('🏗️ Using Backend Manager for keep-alive');
      backendManager.start();
      return;
    }

    // Legacy single backend ping
    this.ping();

    // Set up interval for regular pings
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (!this.isRunning) {
      console.log('⏹️ Keep-alive service is not running');
      return;
    }

    console.log('⏹️ Stopping keep-alive service');
    this.isRunning = false;

    // If using backend manager, stop it
    if (this.useBackendManager) {
      backendManager.stop();
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Send a lightweight ping to the backend
   */
  async ping(retryCount = 0) {
    try {
      const startTime = Date.now();
      const response = await axiosInstance.get('/ping', {
        timeout: 5000, // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      console.log(`💚 Keep-alive ping successful (${responseTime}ms)`, {
        status: response.data.status,
        serverUptime: Math.round(response.data.uptime / 60), // minutes
        timestamp: new Date(response.data.timestamp).toLocaleTimeString()
      });

      return true;
    } catch (error) {
      console.warn(`❌ Keep-alive ping failed (attempt ${retryCount + 1}/${this.maxRetries})`, {
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toLocaleTimeString()
      });

      // Retry logic for failed pings
      if (retryCount < this.maxRetries - 1) {
        console.log(`🔄 Retrying ping in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => {
          this.ping(retryCount + 1);
        }, this.retryDelay);
      } else {
        console.error('💀 Keep-alive ping failed after all retries. Backend may be sleeping.');
      }

      return false;
    }
  }

  /**
   * Get the current status of the keep-alive service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pingInterval: this.pingInterval,
      nextPingIn: this.isRunning ? this.pingInterval : null
    };
  }

  /**
   * Manually trigger a ping (for testing)
   */
  async triggerPing() {
    console.log('🔧 Manual ping triggered');
    return await this.ping();
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;
