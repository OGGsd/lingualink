import { useEffect, useMemo, useState } from "react";
import { useTranslationStore } from "../store/useTranslationStore";
import { useAuthStore } from "../store/useAuthStore";
import { LoaderIcon, LanguagesIcon, ArrowRightIcon } from "lucide-react";

const FALLBACK_LANGS = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  ru: "Russian",
  hi: "Hindi",
};

export default function TranslatePlayground() {
  const {
    supportedLanguages,
    fetchSupportedLanguages,
    translateText,
    detectLanguage,
    isLoading,
    userPreferredLanguage,
  } = useTranslationStore();
  const { authUser } = useAuthStore();

  const [input, setInput] = useState("Bonjour! Ravi de vous rencontrer.");
  const [target, setTarget] = useState(userPreferredLanguage || "en");
  const [detected, setDetected] = useState(null);
  const [result, setResult] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only fetch languages when authenticated; otherwise rely on fallback list
    if (authUser) {
      fetchSupportedLanguages().catch(() => {});
    }
  }, [authUser, fetchSupportedLanguages]);

  useEffect(() => {
    if (userPreferredLanguage) setTarget(userPreferredLanguage);
  }, [userPreferredLanguage]);

  const languages = useMemo(() => {
    const keys = Object.keys(supportedLanguages);
    if (keys.length) return supportedLanguages;
    return FALLBACK_LANGS;
  }, [supportedLanguages]);

  const runDetection = async () => {
    setError("");
    try {
      const info = await detectLanguage(input);
      setDetected(info?.languageName || info?.language || null);
    } catch {
      setDetected(null);
    }
  };

  const runTranslate = async () => {
    setError("");
    setResult("");
    let text = "";
    try {
      if (authUser) {
        const res = await translateText(input, target);
        text = res?.translatedText || "";
      } else {
        // Public demo fallback: simple heuristic or canned sample
        const name = languages[target] || target;
        if (/bonjour/i.test(input) && target === "en") {
          text = "Hello! Nice to meet you.";
        } else {
          text = `${input} → [${name}]`;
        }
      }
      // Streaming effect
      setStreaming(true);
      let i = 0;
      const timer = setInterval(() => {
        i += 2;
        setResult(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timer);
          setStreaming(false);
        }
      }, 16);
    } catch (e) {
      setError("Could not translate right now. Try again later.");
      setStreaming(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LanguagesIcon className="w-5 h-5 text-cyan-400" />
          <p className="text-slate-200 font-semibold">Try a translation</p>
        </div>
        <p className="text-[11px] text-slate-400">One‑click translate</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-2">Your text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-900/50 text-slate-100 p-3 resize-vertical"
            placeholder="Type something to translate"
          />
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <button onClick={runDetection} className="px-2 py-1 rounded-md border border-slate-700/60 hover:bg-slate-800/60">
              Detect language
            </button>
            {detected && <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/60">Detected: {detected}</span>}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-2">Target language</label>
          <div className="flex items-center gap-2">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-48 rounded-md border border-slate-700/60 bg-slate-900/50 text-slate-100 p-2"
              aria-label="Target language"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <button
              onClick={runTranslate}
              disabled={!input.trim() || isLoading}
              className="btn-primary disabled:opacity-50"
              aria-label="Translate"
            >
              {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <ArrowRightIcon className="w-4 h-4" />}
              Translate
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-2">Result</label>
            <div className="min-h-[88px] rounded-lg border border-slate-700/60 bg-slate-900/40 p-3 text-slate-100">
              {result || (streaming ? "" : <span className="text-slate-500">Your translation will appear here…</span>)}
            </div>
            {error && <p className="text-xs text-pink-400 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}