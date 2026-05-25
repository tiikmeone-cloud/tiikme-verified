import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  category?: string;
  matchedTerm?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SoftWarnModal({ open, category, matchedTerm, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center px-0 sm:px-4 md:pl-[220px]"
      style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-[420px] rounded-t-[20px] sm:rounded-2xl border border-border/30 p-5"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245, 158, 11, 0.14)" }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "#F59E0B" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>
              This may violate community guidelines
            </h3>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>
              We detected {category === "mild_profanity" ? "mild profanity" : "potentially sensitive content"}
              {matchedTerm ? ` (e.g. "${matchedTerm}")` : ""}. You can rephrase or post anyway.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold cursor-pointer"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
              color: "#fff",
              border: "none",
            }}
          >
            Post anyway
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
