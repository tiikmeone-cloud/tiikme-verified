import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface OrgSearchInputProps {
  value: string;
  onChange: (name: string, orgId?: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function OrgSearchInput({ value, onChange, placeholder = "Company / Organisation *", style }: OrgSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 3) { setResults([]); setNotFound(false); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, type, logo_url, slug")
        .ilike("name", `%${query}%`)
        .limit(5);
      setResults(data || []);
      setNotFound(!data || data.length === 0);
      setOpen(true);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => { if (results.length > 0 || notFound) setOpen(true); }}
        placeholder={placeholder}
        className="w-full px-3 text-[14px] outline-none"
        style={{ ...style, height: 44 }}
      />
      {open && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {results.map(org => (
            <button type="button" key={org.id} className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-[var(--surface-2)]"
              onClick={() => { setQuery(org.name); onChange(org.name, org.id); setOpen(false); }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--brand-dim)" }}>
                {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4" style={{ color: "var(--brand)" }} />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{org.name}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{(org.type || "org").charAt(0).toUpperCase() + (org.type || "org").slice(1)}</p>
              </div>
            </button>
          ))}
          {notFound && (
            <div className="px-3 py-3 text-center">
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>This organisation is not on Tiikme yet</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--brand)" }}>You can still type the name manually</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
