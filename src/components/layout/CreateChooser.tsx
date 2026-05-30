import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PencilLine, Images, X } from "lucide-react";

interface CreateChooserProps {
  children: (open: () => void) => React.ReactNode;
}

const OPTIONS = [
  {
    label: "Thought",
    description: "Share a text post or photo",
    icon: PencilLine,
    path: "/post/create",
  },
  {
    label: "Flick",
    description: "Share a single image reel",
    icon: Images,
    path: "/flick/create",
  },
] as const;

export function CreateChooser({ children }: CreateChooserProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {children(() => setOpen(true))}

      {open && (
        <>
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setOpen(false)}
          />

          {/* Desktop: small popover; Mobile: bottom sheet */}
          <>
            {/* Mobile bottom sheet */}
            <div
              className="md:hidden fixed left-0 right-0 z-50 animate-in slide-in-from-bottom duration-200"
              style={{
                bottom: 0,
                background: "var(--bg-card)",
                borderRadius: "20px 20px 0 0",
                padding: "20px 16px calc(24px + env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Create
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X style={{ width: 16, height: 16, color: "var(--text-2)" }} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {OPTIONS.map(opt => (
                  <button
                    key={opt.path}
                    type="button"
                    onClick={() => pick(opt.path)}
                    className="flex items-center gap-14 cursor-pointer active:scale-[0.98]"
                    style={{
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "var(--surface-2)",
                      border: "1px solid var(--hairline)",
                      textAlign: "left",
                      transition: "background 150ms",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <opt.icon style={{ width: 20, height: 20, color: "#FF5A1F" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{opt.label}</p>
                      <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop popover */}
            <div
              className="hidden md:block fixed z-50"
              style={{
                left: 232,
                bottom: 120,
                background: "var(--bg-card)",
                border: "1px solid var(--hairline)",
                borderRadius: 16,
                padding: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                minWidth: 200,
              }}
            >
              {OPTIONS.map(opt => (
                <button
                  key={opt.path}
                  type="button"
                  onClick={() => pick(opt.path)}
                  className="flex items-center gap-3 cursor-pointer w-full"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    transition: "background 120ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <opt.icon style={{ width: 16, height: 16, color: "#FF5A1F" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{opt.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)" }}>{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        </>
      )}
    </>
  );
}
