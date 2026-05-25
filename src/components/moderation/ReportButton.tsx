import { useState } from "react";
import { createPortal } from "react-dom";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REASONS: { value: "spam" | "harassment" | "misinformation" | "nsfw" | "other"; label: string; hint: string }[] = [
  { value: "spam", label: "Spam", hint: "Repetitive, promotional, or off-topic" },
  { value: "harassment", label: "Harassment", hint: "Targeting or attacking a person" },
  { value: "misinformation", label: "Misinformation", hint: "False or misleading claims" },
  { value: "nsfw", label: "NSFW", hint: "Explicit, violent, or unsafe content" },
  { value: "other", label: "Other", hint: "Tell us what's wrong" },
];

interface Props {
  contentType: "post" | "circle_post" | "comment";
  contentId: string;
  className?: string;
}

export default function ReportButton({ contentType, contentId, className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<typeof REASONS[number]["value"] | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Sign in to report"); return; }
    if (!reason) { toast.info("Pick a reason"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("post_reports").insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason,
      notes: notes.trim() || null,
      // legacy column for back-compat with the old single-purpose schema
      post_id: contentType === "post" ? contentId : null,
    } as any);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. Thanks for keeping Tiikme safe.");
    setOpen(false);
    setReason(null);
    setNotes("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-3)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 8,
        }}
        aria-label="Report content"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center px-0 sm:px-4 md:pl-[220px]"
            style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }}
            onClick={() => !submitting && setOpen(false)}
          >
            <div
              className="w-full sm:max-w-[440px] rounded-t-[20px] sm:rounded-2xl border border-border/30 p-5"
              style={{ background: "var(--surface)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[15px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                What's wrong with this content?
              </h3>
              <div className="flex flex-col gap-2 mb-3">
                {REASONS.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className="text-left p-3 rounded-xl cursor-pointer"
                    style={{
                      background: reason === r.value ? "var(--brand-dim)" : "var(--surface-2)",
                      border: `1px solid ${reason === r.value ? "var(--brand)" : "var(--border)"}`,
                    }}
                  >
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{r.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{r.hint}</p>
                  </button>
                ))}
              </div>
              {reason === "other" && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Tell us more (optional)"
                  className="w-full min-h-[72px] px-3 py-2 text-[13px] rounded-xl outline-none mb-3"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !reason}
                  className="flex-1 h-10 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {submitting ? "Submitting…" : "Submit report"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
