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
    console.log("Error in getAllContacts:", error);
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
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log("SendMessage called with:", {
      hasText: !!text,
      hasImage: !!image,
      imageLength: image ? image.length : 0,
      receiverId,
      senderId
    });

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
      console.log("Processing image data...");
      // Validate image data
      const imageValidation = validateImageData(image);
      console.log("Image validation result:", imageValidation);
      if (!imageValidation.valid) {
        console.log("Image validation failed:", imageValidation.error);
        return res.status(400).json({ message: imageValidation.error });
      }

      imageType = imageValidation.mimeType;
      imageBuffer = Buffer.from(imageValidation.base64Data, 'base64');
      imageName = `image_${Date.now()}.${imageType.split('/')[1]}`;
      console.log("Image processed successfully:", { imageType, imageName, bufferSize: imageBuffer.length });
    }

    // Extract translation metadata from request
    const { originalText, translatedFrom, translatedTo } = req.body;
    const isAutoTranslated = !!(originalText && translatedFrom && translatedTo);

    console.log("Translation metadata:", {
      hasOriginalText: !!originalText,
      translatedFrom,
      translatedTo,
      isAutoTranslated
    });

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
        console.log("✅ Translation history entry created (background)");
      }).catch((historyError) => {
        console.error("❌ Failed to create translation history (background):", historyError);
        // This won't affect the user experience
      });
    }

    // 🚀 SOCKET: Send message to both users immediately
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    console.log("📡 Sending message to receiver:", receiverId, "socketId:", receiverSocketId);
    console.log("📡 Sending message to sender:", senderId, "socketId:", senderSocketId);

    // Send to receiver - if message is auto-translated, receiver should see both original and translated
    if (receiverSocketId) {
      const messageForReceiver = { ...newMessage };

      // If this is an auto-translated message, ensure receiver sees the translation properly
      if (isAutoTranslated) {
        console.log("📡 Sending auto-translated message to receiver with both texts");
        messageForReceiver.isAutoTranslated = true;
        messageForReceiver.originalText = originalText;
        messageForReceiver.translatedFrom = translatedFrom;
        messageForReceiver.translatedTo = translatedTo;
      }

      io.to(receiverSocketId).emit("newMessage", messageForReceiver);
      console.log("✅ Message sent to receiver via socket");
    } else {
      console.log("⚠️ Receiver not online");
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
      console.log("✅ Message sent to sender via socket");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
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
    console.error("Error in getChatPartners: ", error.message);
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
    console.error("Error in getMessageImage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔄 UPDATE TRANSLATION: Send translation update to receiver via socket
export const updateTranslation = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { translatedText, originalText, translatedFrom, translatedTo } = req.body;
    const senderId = req.user._id;

    console.log(`🔄 Translation update for message ${messageId}:`, {
      translatedText,
      originalText,
      translatedFrom,
      translatedTo
    });

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
      console.log("✅ Translation update sent to receiver via socket");
    } else {
      console.log("⚠️ Receiver not online for translation update");
    }

    res.status(200).json({ success: true, message: "Translation update sent" });
  } catch (error) {
    console.error("❌ Error updating translation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
