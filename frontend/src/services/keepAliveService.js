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
      return;
    }

    this.isRunning = true;

    // If using backend manager, start it and let it handle keep-alive
    if (this.useBackendManager) {
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
      await axiosInstance.get('/ping', {
        timeout: 5000, // 5 second timeout
      });
      


      return true;
    } catch (error) {
      // Retry logic for failed pings
      if (retryCount < this.maxRetries - 1) {
        setTimeout(() => {
          this.ping(retryCount + 1);
        }, this.retryDelay);
      } else {

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
