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
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const { autoTranslateEnabled, translateText, detectLanguage } = useTranslationStore.getState();

    console.log("Frontend sendMessage called with:", {
      hasText: !!messageData.text,
      hasImage: !!messageData.image,
      imageLength: messageData.image ? messageData.image.length : 0,
      selectedUserId: selectedUser._id,
      autoTranslateEnabled
    });

    // ⚡ LIGHTNING FAST: Send original message immediately to both users
    const tempId = `temp-${Date.now()}`;

    // 🚀 IMMEDIATE: Show original message to sender
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text, // Always show original text first
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Immediately update sender's UI with original message
    set({ messages: [...messages, optimisticMessage] });

    // 🚀 IMMEDIATE: Send original message to backend (so receiver gets it instantly)
    const realMessage = await sendToBackend(messageData, tempId);

    // 🌍 BACKGROUND: Auto-translate if enabled (this won't block the UI or receiver)
    if (autoTranslateEnabled && messageData.text && messageData.text.trim()) {
      // Start translation in background - completely non-blocking
      Promise.all([
        axiosInstance.get(`/settings/user/${selectedUser._id}`),
        detectLanguage(messageData.text)
      ]).then(async ([recipientSettings, detectedLang]) => {
        const recipientLanguage = recipientSettings.data?.settings?.preferredLanguage || 'en';
        const detectedLanguageCode = detectedLang?.language || 'en';

        console.log(`🎯 Background auto-translate: ${detectedLanguageCode} → ${recipientLanguage}`);

        // Only translate if languages are different
        if (detectedLanguageCode !== recipientLanguage) {
          const translationResult = await translateText(messageData.text, recipientLanguage, detectedLanguageCode);

          if (translationResult && translationResult.translatedText) {
            console.log(`✅ Translation ready: "${messageData.text}" → "${translationResult.translatedText}"`);

            // Update sender's UI with translated text (keep original text visible)
            // Use real message ID if available, otherwise use temp ID
            const messageIdToUpdate = realMessage?._id || tempId;
            set(state => ({
              messages: state.messages.map(msg =>
                msg._id === messageIdToUpdate
                  ? {
                      ...msg,
                      text: translationResult.translatedText,
                      originalText: messageData.text,
                      translatedFrom: detectedLanguageCode,
                      translatedTo: recipientLanguage,
                      isAutoTranslated: true
                    }
                  : msg
              )
            }));

            // 📡 SOCKET UPDATE: Send translation update to receiver using real message ID
            if (realMessage?._id) {
              try {
                await axiosInstance.post(`/messages/update-translation/${realMessage._id}`, {
                  translatedText: translationResult.translatedText,
                  originalText: messageData.text,
                  translatedFrom: detectedLanguageCode,
                  translatedTo: recipientLanguage
                });
                console.log("🔄 Translation update sent to receiver via socket");
              } catch (error) {
                console.error("❌ Failed to send translation update:", error);
              }
            } else {
              console.log("⚠️ No real message available for translation update");
            }
          }
        }
      }).catch(error => {
        console.error("❌ Background auto-translation failed:", error);
        // This won't affect the user experience since original message was already sent
      });
    }

    async function sendToBackend(data, tempId) {
      try {
        console.log("🚀 Sending message to backend...");
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
        console.log("✅ Backend response:", res.data);

        // Replace the optimistic message with the real one from the server
        // Preserve any translation data that might have been added to the optimistic message
        set(state => ({
          messages: state.messages.map(msg =>
            msg._id === tempId ? {
              ...res.data,
              fromSender: true,
              // Preserve translation data if it exists
              ...(msg.isAutoTranslated && {
                originalText: msg.originalText,
                translatedFrom: msg.translatedFrom,
                translatedTo: msg.translatedTo,
                isAutoTranslated: msg.isAutoTranslated
              })
            } : msg
          )
        }));

        // Return the real message for translation updates
        return res.data;
      } catch (error) {
        console.error("❌ Error sending message:", error.response?.data || error.message);
        // Remove optimistic message on failure
        set(state => ({
          messages: state.messages.filter(msg => msg._id !== tempId)
        }));
        toast.error(error.response?.data?.message || "Failed to send message");
        return null;
      }
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
