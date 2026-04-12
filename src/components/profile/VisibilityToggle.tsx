import { useState, useRef, useEffect } from "react";
import { Globe, Users, Lock } from "lucide-react";

const options = [
  { value: "public", label: "Public", icon: Globe, color: "var(--text-3)" },
  { value: "connections", label: "Connections only", icon: Users, color: "var(--brand)" },
  { value: "private", label: "Only me", icon: Lock, color: "var(--text-3)" },
] as const;

interface VisibilityToggleProps {
  value: string;
  onChange: (val: string) => void;
}

export default function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find(o => o.value === value) || options[0];
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="p-1 rounded-md cursor-pointer hover:bg-[var(--surface-2)] transition-colors" title={current.label}>
        <Icon className="w-3.5 h-3.5" style={{ color: current.color }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 160 }}>
          {options.map(opt => {
            const selected = opt.value === value;
            return (
              <button type="button" key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium cursor-pointer transition-colors"
                style={{ background: selected ? "var(--brand-dim)" : "transparent", color: selected ? "var(--brand)" : "var(--text-2)" }}>
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
