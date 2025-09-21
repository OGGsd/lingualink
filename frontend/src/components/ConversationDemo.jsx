import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowDownLeft } from "lucide-react";

const MESSAGES = [
  { id: 1, from: "Lucía", lang: "Spanish", text: "¡Hola! ¿Cómo estás?", translated: { lang: "English", text: "Hello! How are you?" } },
  { id: 2, from: "Amina", lang: "Arabic", text: "أنا بخير، شكرًا!", translated: { lang: "English", text: "I'm good, thank you!" } },
  { id: 3, from: "Kenji", lang: "Japanese", text: "6時に会う？", translated: { lang: "English", text: "Want to meet at 6?" } },
  { id: 4, from: "Marie", lang: "French", text: "Parfait.", translated: { lang: "English", text: "Perfect." } },
];

const FLAG = {
  English: "🇺🇸",
  Spanish: "🇪🇸",
  Arabic: "🇪🇬",
  French: "🇫🇷",
  Japanese: "🇯🇵",
};

function Bubble({ side = "left", name, lang, text, canTranslate = false, onTranslate, isTranslating = false, variant = "default" }) {
  const isLeft = side === "left";
  return (
    <div className={`flex items-end gap-2 ${isLeft ? "justify-start" : "flex-row-reverse justify-start"}`}>
      <div className="size-8 rounded-full bg-slate-700/50 grid place-items-center text-xs text-slate-200 border border-slate-600/50">
        {name?.[0]}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed border ${
          variant === "translated" ? "translated-bubble border-cyan-500/40" : isLeft ? "bg-slate-800/60 border-slate-700/60" : "bg-cyan-500/15 border-cyan-500/30"
        } animate-reveal`}>
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
          <span className="inline-flex items-center gap-1">{FLAG[lang]} {lang}</span>
          {canTranslate && (
            <button onClick={onTranslate} className="px-2 py-0.5 rounded-md border border-slate-700/60 text-slate-300 hover:bg-slate-800/60">
              {isTranslating ? "Translating…" : "Translate"}
            </button>
          )}
        </div>
        <p className="text-slate-100">{text}</p>
      </div>
    </div>
  );
}

export default function ConversationDemo() {
  const [idx, setIdx] = useState(1);
  const [translatingId, setTranslatingId] = useState(null);
  const [revealed, setRevealed] = useState(new Set());
  const [paused, setPaused] = useState(false);
  const containerRef = useRef(null);
  const pauseTimer = useRef(null);

  const sequence = useMemo(() => MESSAGES.slice(0, idx), [idx]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setIdx((v) => (v >= MESSAGES.length ? 1 : v + 1));
      setTranslatingId(null);
    }, 2000);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [sequence]);

  const last = sequence[sequence.length - 1];

  return (
    <div className="relative rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden shadow-2xl"
         onMouseEnter={() => setPaused(true)}
         onMouseLeave={() => setPaused(false)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.08),transparent_40%)]" />
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-slate-300 text-sm">Live conversation preview</p>
          </div>
          <div className="text-right">
            <span className="inline-block text-[11px] text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-full px-2 py-0.5">
              Preferred language: English
            </span>
            <div className="text-[11px] text-slate-400 mt-1">Tap translate to view</div>
          </div>
        </div>

        {/* Messages */}
        <div ref={containerRef} className="h-72 overflow-y-auto space-y-4 pr-2">
          {sequence.map((m, i) => {
            const isRight = i % 2 === 0;
            return (
              <div key={m.id} className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
                <div className="space-y-2 max-w-[75%]">
                  <Bubble
                    side={isRight ? "right" : "left"}
                    name={m.from}
                    lang={m.lang}
                    text={m.text}
                    canTranslate={!!m.translated}
                    onTranslate={() => {
                      if (revealed.has(m.id) || translatingId) return;
                      // Pause rotation briefly to allow user to see the translation
                      setPaused(true);
                      if (pauseTimer.current) clearTimeout(pauseTimer.current);
                      setTranslatingId(m.id);
                      setTimeout(() => {
                        setRevealed((prev) => new Set(prev).add(m.id));
                        setTranslatingId(null);
                        pauseTimer.current = setTimeout(() => setPaused(false), 3000);
                      }, 500);
                    }}
                    isTranslating={translatingId === m.id}
                  />
                  {m.translated && revealed.has(m.id) && (
                    <div className={`relative ${isRight ? "pr-6" : "pl-6"}`}>
                      <div className={isRight ? "connector-line connector-line-right" : "connector-line connector-line-left"} />
                      <div className={`${isRight ? "mr-2" : "ml-2"} mb-1 translation-meta`}>
                        {isRight ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span className="lang-chip">Translated to {m.translated.lang}</span>
                      </div>
                      <Bubble variant="translated" side={isRight ? "right" : "left"} name={"↻"} lang={m.translated.lang} text={m.translated.text} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className={`size-1.5 rounded-full ${last ? "bg-cyan-400" : "bg-slate-500"} ${paused ? "" : "animate-ping"}`} />
            <span>Streaming translation…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
