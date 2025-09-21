import { useEffect, useRef } from "react";

export default function MobileMenu({ open, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={panelRef} className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-slate-900 border-l border-slate-700/60 p-4 shadow-2xl">
        {children}
      </div>
    </div>
  );
}