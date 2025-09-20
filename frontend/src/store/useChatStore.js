import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useTranslationStore } from "./useTranslationStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: true, // Will be loaded from database via translation store
  soundSettingsLoaded: false, // Track if sound settings have been synced

  // Database-driven sound toggle
  toggleSound: async () => {
    try {
      const { useTranslationStore } = await import("./useTranslationStore");
      const { setSoundEnabled } = useTranslationStore.getState();
      const newSoundState = !get().isSoundEnabled;

      // Optimistically update UI
      set({ isSoundEnabled: newSoundState });

      // Update in database
      await setSoundEnabled(newSoundState);
    } catch (error) {
      console.error("❌ Error toggling sound:", error);
      // Revert optimistic update on error
      set({ isSoundEnabled: !get().isSoundEnabled });
    }
  },

  // Sync sound settings from translation store
  syncSoundSettings: () => {
    try {
      const { soundEnabled } = useTranslationStore.getState();
      set({
        isSoundEnabled: soundEnabled,
        soundSettingsLoaded: true
      });
      console.log("🔊 Sound settings synced from translation store:", soundEnabled);
    } catch (error) {
      console.error("❌ Error syncing sound settings:", error);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();

    console.log("🚀 SEND MESSAGE:", {
      hasText: !!messageData.text,
      hasImage: !!messageData.image
    });

    try {
      console.log("📤 Sending to backend:", messageData);

      const response = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);

      console.log("✅ Message sent successfully:", response.data);

      // 🔄 UPDATE LOCAL MESSAGES (the socket will handle receiver updates)
      set(state => ({
        messages: [...state.messages, response.data]
      }));

    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();



    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("translationUpdate");

    socket.on("newMessage", (newMessage) => {
      console.log("📨 Received new message:", newMessage);

      // Check if this message is part of the current conversation
      const isMessageForCurrentConversation =
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id);

      console.log("Is message for current conversation:", isMessageForCurrentConversation);

      if (!isMessageForCurrentConversation) return;

      const currentMessages = get().messages;

      // Skip messages sent by current user (they already have them via optimistic updates)
      if (newMessage.senderId === authUser._id) {
        return;
      }

      // Check if message already exists (to prevent duplicates)
      const messageExists = currentMessages.some(msg => msg._id === newMessage._id);
      if (messageExists) {
        console.log("Message already exists, skipping duplicate");
        return;
      }

      console.log("Adding new message to chat");
      set({ messages: [...currentMessages, newMessage] });

      // Play notification sound only for received messages (not sent by current user)
      if (newMessage.senderId !== authUser._id && isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });


  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    console.log("Unsubscribing from messages");
    socket.off("newMessage");
    socket.off("translationUpdate");
  },
}));
