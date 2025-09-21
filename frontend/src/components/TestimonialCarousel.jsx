import { useEffect, useRef, useState } from "react";

export default function TestimonialCarousel({ items = [], interval = 3500 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(timerRef.current);
  }, [items.length, interval]);

  if (!items.length) return null;

  return (
    <div className="relative w-full">
      <div className="relative h-56 sm:h-48">
        {items.map((it, i) => (
          <figure
            key={i}
            className={`absolute inset-0 rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 transition-opacity duration-500 hover:bg-slate-700/40 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== index}
          >
            <blockquote className="text-slate-200 text-sm sm:text-base">“{it.quote}”</blockquote>
            <figcaption className="text-slate-400 text-xs mt-3">— {it.author}</figcaption>
          </figure>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-2" aria-label="Testimonials carousel controls">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`size-2.5 rounded-full transition-colors ${
              i === index ? "bg-cyan-400" : "bg-slate-600 hover:bg-slate-500"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}