import { Globe2Icon } from "lucide-react";

export default function LangSwitcher({ value, onChange, options }) {
  return (
    <label className="inline-flex items-center gap-2 text-slate-300 text-xs">
      <Globe2Icon className="w-4 h-4" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900/50 border border-slate-700/60 rounded-md px-2 py-1 text-slate-200"
        aria-label="Select language"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}