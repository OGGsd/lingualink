import { useState } from "react";
import { Languages, ChevronDown, Sparkles } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";

const MessageTranslation = ({ message, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const { translateText, translateMessageById, userPreferredLanguage, getLanguageName, autoTranslateEnabled } = useTranslationStore();

  const handleTranslate = async () => {
    if (!message.text || isTranslating) return;

    setIsTranslating(true);
    try {
      // Use database-driven translation if message has an ID, otherwise use direct translation
      let result;
      if (message.id || message._id) {
        result = await translateMessageById(message.id || message._id, userPreferredLanguage);
      } else {
        result = await translateText(message.text, userPreferredLanguage);
      }

      if (result && result.translatedText) {
        setTranslatedText(result);
        setIsExpanded(true);
      } else {
        // Translation failed, but don't show error to user
      }
    } catch (error) {
      // Error is already handled by the translation store
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleTranslation = () => {
    if (!translatedText) {
      handleTranslate();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // Only show translation button when auto-translate is disabled and there's text
  if (!message.text || autoTranslateEnabled) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {!translatedText ? (
        // Simple translate icon - clean and minimal
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1 opacity-75 hover:opacity-100"
          title="Translate message"
        >
          {isTranslating ? (
            <div className="animate-spin w-3 h-3 border border-slate-400 border-t-cyan-400 rounded-full"></div>
          ) : (
            <Languages className="w-3 h-3" />
          )}
        </button>
      ) : (
        // Clean language indicator - just like your preferred design
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 flex items-center gap-1"
          title={isExpanded ? 'Hide translation' : 'Show translation'}
        >
          <Sparkles className="w-3 h-3" />
          <span>{getLanguageName(translatedText.targetLanguage)}</span>
          <ChevronDown className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Simple translation overlay - appears below message */}
      {translatedText && isExpanded && (
        <div className="absolute left-0 right-0 mt-1 p-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-lg z-10">
          <div className="text-slate-100 text-sm">
            {translatedText.translatedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTranslation;
