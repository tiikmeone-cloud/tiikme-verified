import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

interface Suggestion {
  id: string;
  display: string;
  username?: string;
  avatar_url?: string | null;
  type: "user" | "page";
}

const MentionInput = ({
  value,
  onChange,
  placeholder = "What's on your mind?",
  maxLength = 3000,
  className = "",
  style,
  autoFocus,
  minHeight = 200,
  maxHeight = 500,
}: MentionInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight)) + "px";
    }
  }, [minHeight, maxHeight]);

  useEffect(() => { autoResize(); }, [value, autoResize]);

  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }

    const results: Suggestion[] = [];

    const [profilesRes, pagesRes] = await Promise.allSettled([
      supabase.from("profiles")
        .select("id, full_name, username, avatar_url")
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5),
      supabase.from("pages")
        .select("id, name, slug, logo_url")
        .ilike("name", `%${query}%`)
        .limit(3),
    ]);

    if (profilesRes.status === "fulfilled" && profilesRes.value.data) {
      for (const p of profilesRes.value.data) {
        results.push({
          id: p.id,
          display: p.full_name || p.username || "User",
          username: p.username || undefined,
          avatar_url: p.avatar_url,
          type: "user",
        });
      }
    }

    if (pagesRes.status === "fulfilled" && pagesRes.value.data) {
      for (const p of pagesRes.value.data) {
        results.push({
          id: p.id,
          display: p.name,
          username: p.slug,
          avatar_url: p.logo_url,
          type: "page",
        });
      }
    }

    setSuggestions(results);
    setSelectedIdx(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value.slice(0, maxLength);
    onChange(newVal);

    // Check for @ trigger
    const cursorPos = e.target.selectionStart || 0;
    const textBefore = newVal.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);

    if (atMatch) {
      setMentionStart(cursorPos - atMatch[0].length);
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchMentions(atMatch[1]), 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const insertMention = (suggestion: Suggestion) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice((textareaRef.current?.selectionStart || mentionStart) || mentionStart);
    const mentionText = `@${suggestion.username || suggestion.display.replace(/\s+/g, "")} `;
    const newValue = before + mentionText + after;
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);

    // Focus back
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        const pos = before.length + mentionText.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(suggestions[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full resize-none outline-none ${className}`}
        style={{ minHeight, ...style }}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />

      {/* Mention suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 z-20 rounded-xl overflow-hidden"
          style={{
            top: "100%",
            marginTop: 4,
            background: "var(--glass-card-bg, #fff)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            backdropFilter: "blur(20px)",
          }}
        >
          {suggestions.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => insertMention(s)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left cursor-pointer transition-colors"
              style={{
                background: idx === selectedIdx ? "rgba(232,115,58,0.08)" : "transparent",
                borderBottom: idx < suggestions.length - 1 ? "1px solid var(--glass-border-subtle)" : "none",
              }}
            >
              <AvatarSquare
                src={s.avatar_url}
                name={s.display}
                size={28}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {s.display}
                </p>
                {s.username && (
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    @{s.username} · {s.type === "page" ? "Page" : "User"}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
