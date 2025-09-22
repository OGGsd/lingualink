import { useState } from "react";
import { Languages, ChevronDown, ChevronUp, Globe, Sparkles } from "lucide-react";
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
    <div className={`${className}`}>
      {/* Compact Translation Button */}
      {!translatedText ? (
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 flex items-center gap-1"
            title={`${isExpanded ? 'Hide' : 'Show'} translation`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="text-xs">{getLanguageName(translatedText.targetLanguage)}</span>
            <ChevronDown className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Collapsible Translation Content */}
      {translatedText && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <div className="border border-slate-700/50 rounded-lg bg-slate-800/30 backdrop-blur-sm p-3">
            {/* Translation Text */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <Globe className="w-3 h-3 mr-1 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-300">
                  {getLanguageName(translatedText.targetLanguage)}
                  {translatedText.sourceLanguage !== 'auto' && (
                    <span className="text-slate-400"> from {getLanguageName(translatedText.sourceLanguage)}</span>
                  )}
                </span>
              </div>
              <div className="text-slate-100 text-sm leading-relaxed bg-slate-800/40 p-2 rounded border border-slate-700/30">
                {translatedText.translatedText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTranslation;
