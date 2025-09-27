import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Use backend manager for dynamic URL selection in production
const getSocketBaseUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the backend manager's current URL
    try {
      const backendManager = window.backendManager;
      if (backendManager) {
        return backendManager.getApiUrl().replace('/api', '');
      }
    } catch (error) {
      // Fallback if backend manager not available
    }
    // Fallback to first backend from environment
    return import.meta.env.VITE_RENDER_BACKEND_1 || import.meta.env.VITE_API_URL?.replace('/api', '');
  }
  // Development mode
  return import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:3000";
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isLoading: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);

      // Store email for potential verification resend
      localStorage.setItem('pendingVerificationEmail', data.email);

      // Don't set authUser since email needs verification
      toast.success(res.data.message || "Account created successfully! Please check your email to verify your account.");

      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      toast.error(message);
      return { success: false, message };
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      // Clear any pending verification email
      localStorage.removeItem('pendingVerificationEmail');

      toast.success("Logged in successfully");

      get().connectSocket();

      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);

      // If email not verified, store email for potential resend
      if (error.response?.status === 403 && error.response?.data?.emailVerified === false) {
        localStorage.setItem('pendingVerificationEmail', error.response.data.email);
      }

      return { success: false, message, data: error.response?.data };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });

      // Clear any stored verification email
      localStorage.removeItem('pendingVerificationEmail');

      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
    }
  },

  // Email verification methods
  verifyEmail: async (token) => {
    try {
      const res = await axiosInstance.post("/auth/verify-email", { token });

      // Clear pending verification email
      localStorage.removeItem('pendingVerificationEmail');

      toast.success("Email verified successfully!");
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Email verification failed";
      toast.error(message);
      return { success: false, message };
    }
  },

  resendVerification: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/resend-verification", { email });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend verification email";
      return { success: false, message };
    }
  },

  // Password reset methods
  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reset email";
      toast.error(message);
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully!");
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      toast.error(message);
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;



    const socketUrl = getSocketBaseUrl();
    const socket = io(socketUrl, {
      withCredentials: true, // this ensures cookies are sent with the connection
    });

    socket.on("connect", () => {
      // Socket connected
    });

    socket.on("disconnect", () => {
      // Socket disconnected
    });

    socket.on("connect_error", () => {
      // Socket.io will automatically retry connection
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      // Keep IDs as strings for consistent comparison since Object.keys() returns strings
      // and user._id from database might be string or number depending on context
      const stringUserIds = userIds.map(id => String(id));
      set({ onlineUsers: stringUserIds });
    });

    // Listen for real-time profile updates
    socket.on("profileUpdated", (profileData) => {
      const currentUser = get().authUser;
      if (currentUser) {
        set({
          authUser: {
            ...currentUser,
            ...profileData
          }
        });
      }
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
