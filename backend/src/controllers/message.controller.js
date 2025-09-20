import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import TranslationHistory from "../models/TranslationHistory.js";
import User from "../models/User.js";
import { sanitizeMessageText, validateImageData } from "../utils/security.utils.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.findAllExcept(loggedInUserId);

    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.findBetweenUsers(myId, userToChatId);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;



    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId == receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Sanitize text input
    const sanitizedText = text ? sanitizeMessageText(text) : null;

    let imageBuffer = null;
    let imageName = null;
    let imageType = null;

    if (image) {
      // Validate image data
      const imageValidation = validateImageData(image);
      if (!imageValidation.valid) {
        return res.status(400).json({ message: imageValidation.error });
      }

      imageType = imageValidation.mimeType;
      imageBuffer = Buffer.from(imageValidation.base64Data, 'base64');
      imageName = `image_${Date.now()}.${imageType.split('/')[1]}`;
    }

    // Extract translation metadata from request
    const { originalText, translatedFrom, translatedTo } = req.body;
    const isAutoTranslated = !!(originalText && translatedFrom && translatedTo);

    // ⚡ FAST FLOW: Create message in database (this is fast)
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: sanitizedText,
      originalText: originalText || null,
      translatedFrom: translatedFrom || null,
      translatedTo: translatedTo || null,
      isAutoTranslated,
      image: imageBuffer,
      imageName,
      imageType,
    });

    // 🚀 ASYNC BACKGROUND: Create translation history entry (fire and forget)
    if (isAutoTranslated && originalText && translatedFrom && translatedTo) {
      // Don't await this - let it run in background
      TranslationHistory.create({
        userId: senderId,
        messageId: newMessage.id,
        originalText: originalText,
        translatedText: sanitizedText,
        sourceLanguage: translatedFrom,
        targetLanguage: translatedTo,
        translationType: 'auto',
        apiProvider: 'openai'
      }).then(() => {
        // Translation history entry created (background)
      }).catch((historyError) => {
        // Failed to create translation history (background) - this won't affect the user experience
      });
    }

    // 🚀 SOCKET: Send message to both users immediately
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    // Send to receiver - if message is auto-translated, receiver should see both original and translated
    if (receiverSocketId) {
      const messageForReceiver = { ...newMessage };

      // If this is an auto-translated message, ensure receiver sees the translation properly
      if (isAutoTranslated) {
        messageForReceiver.isAutoTranslated = true;
        messageForReceiver.originalText = originalText;
        messageForReceiver.translatedFrom = translatedFrom;
        messageForReceiver.translatedTo = translatedTo;
      }

      io.to(receiverSocketId).emit("newMessage", messageForReceiver);
    }

    // Also send to sender for real-time update (if they're on a different device/tab)
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      const messageForSender = { ...newMessage };

      // Sender should also see the translation data
      if (isAutoTranslated) {
        messageForSender.isAutoTranslated = true;
        messageForSender.originalText = originalText;
        messageForSender.translatedFrom = translatedFrom;
        messageForSender.translatedTo = translatedTo;
      }

      io.to(senderSocketId).emit("newMessage", messageForSender);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all users that have chatted with the logged-in user
    const chatPartnerIds = await Message.findChatPartners(loggedInUserId);

    // Get user details for each chat partner
    const chatPartners = [];
    for (const partnerId of chatPartnerIds) {
      const user = await User.findByIdWithoutPassword(partnerId);
      if (user) {
        chatPartners.push(user);
      }
    }

    res.status(200).json(chatPartners);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to serve images
export const getMessageImage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const imageData = await Message.getImageData(messageId);
    if (!imageData || !imageData.image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set({
      'Content-Type': imageData.image_type || 'image/jpeg',
      'Content-Length': imageData.image.length,
    });

    res.send(imageData.image);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔄 UPDATE TRANSLATION: Send translation update to receiver via socket
export const updateTranslation = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { translatedText, originalText, translatedFrom, translatedTo } = req.body;
    const senderId = req.user._id;



    // Find the message to get receiver info
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify sender owns this message
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const receiverId = message.receiverId;

    // 📡 SOCKET: Send translation update to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      const translationUpdate = {
        messageId,
        translatedText,
        originalText,
        translatedFrom,
        translatedTo,
        isAutoTranslated: true
      };

      io.to(receiverSocketId).emit("translationUpdate", translationUpdate);
    }

    res.status(200).json({ success: true, message: "Translation update sent" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
