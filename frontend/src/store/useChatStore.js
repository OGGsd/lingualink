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
    const { autoTranslateEnabled, translateText, detectLanguage } = useTranslationStore.getState();

    console.log("🚀 SIMPLE SEND MESSAGE:", {
      hasText: !!messageData.text,
      hasImage: !!messageData.image,
      autoTranslateEnabled
    });

    try {
      let finalMessageData = { ...messageData };

      // 🌍 TRANSLATE BEFORE SENDING (if auto-translate enabled)
      if (autoTranslateEnabled && messageData.text && messageData.text.trim()) {
        console.log("🔄 Translating message before sending...");

        // Get recipient's preferred language
        const recipientSettings = await axiosInstance.get(`/settings/user/${selectedUser._id}`);
        const recipientLanguage = recipientSettings.data?.settings?.preferredLanguage || 'en';

        // Detect source language
        const detectedLang = await detectLanguage(messageData.text);
        const detectedLanguageCode = detectedLang?.language || 'en';

        console.log(`🎯 Translation: ${detectedLanguageCode} → ${recipientLanguage}`);

        // Only translate if languages are different
        if (detectedLanguageCode !== recipientLanguage) {
          const translationResult = await translateText(messageData.text, recipientLanguage, detectedLanguageCode);

          if (translationResult && translationResult.translatedText) {
            console.log(`✅ Translation ready: "${messageData.text}" → "${translationResult.translatedText}"`);

            // Prepare message with translation data
            finalMessageData = {
              ...messageData,
              text: translationResult.translatedText, // Translated text as main text
              originalText: messageData.text, // Original text preserved
              translatedFrom: detectedLanguageCode,
              translatedTo: recipientLanguage
            };
          }
        }
      }

      // 🚀 SEND TO BACKEND (with translation data if available)
      console.log("📤 Sending to backend:", {
        hasOriginalText: !!finalMessageData.originalText,
        translatedFrom: finalMessageData.translatedFrom,
        translatedTo: finalMessageData.translatedTo
      });

      const response = await axiosInstance.post(`/messages/send/${selectedUser._id}`, finalMessageData);

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

    console.log("Subscribing to messages for user:", selectedUser.fullName);
    console.log("Socket connected:", socket?.connected);

    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("translationUpdate");

    socket.on("newMessage", (newMessage) => {
      console.log("📨 Received new message:", newMessage);
      console.log("🔍 Translation data in received message:", {
        isAutoTranslated: newMessage.isAutoTranslated,
        hasOriginalText: !!newMessage.originalText,
        translatedFrom: newMessage.translatedFrom,
        translatedTo: newMessage.translatedTo,
        text: newMessage.text?.substring(0, 50) + "...",
        originalText: newMessage.originalText?.substring(0, 50) + "..."
      });

      // Check if this message is part of the current conversation
      const isMessageForCurrentConversation =
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id);

      console.log("Is message for current conversation:", isMessageForCurrentConversation);

      if (!isMessageForCurrentConversation) return;

      const currentMessages = get().messages;

      // Skip messages sent by current user (they already have them via optimistic updates)
      if (newMessage.senderId === authUser._id) {
        console.log("Skipping own message received via socket");
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

    // 🔄 TRANSLATION UPDATE: Listen for translation updates
    socket.on("translationUpdate", (translationUpdate) => {
      console.log("🔄 Received translation update:", translationUpdate);

      const { messageId, translatedText, originalText, translatedFrom, translatedTo } = translationUpdate;

      // Update the message with translation (receiver sees both original and translated)
      set(state => ({
        messages: state.messages.map(msg =>
          msg._id === messageId
            ? {
                ...msg,
                text: translatedText,
                originalText: originalText,
                translatedFrom: translatedFrom,
                translatedTo: translatedTo,
                isAutoTranslated: true
              }
            : msg
        )
      }));

      console.log("✅ Message updated with translation for receiver");
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    console.log("Unsubscribing from messages");
    socket.off("newMessage");
    socket.off("translationUpdate");
  },
}));
