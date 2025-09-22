import axios from "axios";
import backendManager from "../services/backendManager.js";

// Create axios instance with dynamic baseURL
export const axiosInstance = axios.create({
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

// Request interceptor to set dynamic baseURL and handle retries
axiosInstance.interceptors.request.use(
  (config) => {
    // Use backend manager in production, fallback to env variable for development
    if (import.meta.env.PROD) {
      config.baseURL = backendManager.getApiUrl();
    } else {
      config.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    }


    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle backend failures and retries
axiosInstance.interceptors.response.use(
  (response) => {
    // Record successful request
    if (import.meta.env.PROD) {
      backendManager.recordRequest(true);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Record failed request
    if (import.meta.env.PROD) {
      backendManager.recordRequest(false);
    }

    // If in production and request failed, try with different backend
    if (import.meta.env.PROD && !originalRequest._retry && error.response?.status >= 500) {
      originalRequest._retry = true;



      // Force a health check to update backend status
      await backendManager.performHealthCheck();

      // Get new backend URL
      originalRequest.baseURL = backendManager.getApiUrl();

      // Retry the request
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);
