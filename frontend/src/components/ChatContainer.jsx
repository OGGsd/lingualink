import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useTranslationStore } from "../store/useTranslationStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageTranslation from "./MessageTranslation";
import { Globe, Languages } from "lucide-react";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { autoTranslateEnabled, getLanguageName } = useTranslationStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <div
                key={`${msg._id || msg.tempId || `msg-${index}`}-${msg.createdAt || Date.now()}`}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                  )}

                  {/* Message text with auto-translate support */}
                  {msg.text && (
                    <div className="mt-2">
                      {/* Show translated text if auto-translate is enabled and message is auto-translated */}
                      {autoTranslateEnabled && msg.isAutoTranslated && msg.originalText ? (
                        <div className="space-y-2">
                          {/* Translated text (primary) */}
                          <div>
                            <p className="text-sm">{msg.text}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Globe className="w-3 h-3 opacity-60" />
                              <span className="text-xs opacity-60">
                                Translated to {getLanguageName(msg.translatedTo)}
                              </span>
                            </div>
                          </div>

                          {/* Original text (secondary) */}
                          <div className="border-t border-white/10 pt-2">
                            <p className="text-xs opacity-75 italic">"{msg.originalText}"</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Languages className="w-3 h-3 opacity-50" />
                              <span className="text-xs opacity-50">
                                Original in {getLanguageName(msg.translatedFrom)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Regular message text */
                        <p>{msg.text}</p>
                      )}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "Now"}
                  </p>

                  {/* Translation component for received messages (only when auto-translate is disabled) */}
                  {msg.senderId !== authUser._id && msg.text && !autoTranslateEnabled && (
                    <MessageTranslation message={msg} />
                  )}
                </div>
              </div>
            ))}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;
