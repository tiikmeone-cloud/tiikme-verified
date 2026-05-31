import { useState, useEffect, useRef } from "react";
import { Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";

interface OrgOption {
  id: string;
  name: string;
  logo_url?: string | null;
  source: "db" | "provisional";
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function OrgTypeahead({ value, onChange, placeholder = "Company name" }: Props) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<OrgOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    const term = `%${debouncedQuery}%`;
    Promise.all([
      supabase
        .from("organizations")
        .select("id, name, logo_url")
        .ilike("name", term)
        .limit(6),
      supabase
        .from("provisional_orgs")
        .select("id, display_name")
        .ilike("display_name", term)
        .limit(4),
    ]).then(([orgsRes, provRes]) => {
      const orgs: OrgOption[] = (orgsRes.data || []).map(o => ({
        id: o.id,
        name: o.name,
        logo_url: o.logo_url,
        source: "db" as const,
      }));
      const provIds = new Set(orgs.map(o => o.name.toLowerCase().trim()));
      const provs: OrgOption[] = (provRes.data || [])
        .filter(p => !provIds.has(p.display_name.toLowerCase().trim()))
        .map(p => ({ id: p.id, name: p.display_name, source: "provisional" as const }));
      setOptions([...orgs, ...provs]);
      setLoading(false);
      setOpen(true);
    });
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: OrgOption) => {
    setQuery(opt.name);
    onChange(opt.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div className="flex items-center" style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: 10, width: 14, height: 14, color: "var(--text-3)", pointerEvents: "none" }} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (options.length > 0) setOpen(true); }}
          placeholder={placeholder}
          style={{
            width: "100%",
            height: 38,
            paddingLeft: 32,
            paddingRight: 12,
            borderRadius: 10,
            border: "1px solid var(--border-glass)",
            background: "var(--surface-2)",
            color: "var(--text-1)",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {open && options.length > 0 && (
        <div
          className="glass-card"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            borderRadius: 12,
            border: "1px solid var(--border-glass)",
            background: "var(--bg-card)",
            zIndex: 50,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {loading && (
            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-3)" }}>Searching…</div>
          )}
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className="flex items-center w-full"
              style={{
                padding: "9px 12px",
                gap: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-1)",
              }}
            >
              {opt.logo_url ? (
                <img src={opt.logo_url} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 22, height: 22, borderRadius: 4, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 style={{ width: 12, height: 12, color: "var(--text-3)" }} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.name}</p>
                {opt.source === "provisional" && (
                  <p style={{ fontSize: 11, color: "var(--text-3)" }}>community-added</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
