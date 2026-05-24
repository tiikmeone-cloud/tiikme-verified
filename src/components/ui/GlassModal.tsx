import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  accentColor: string;
  children: ReactNode;
  actions?: ReactNode;
}

const GlassModal = ({ open, onClose, title, icon: Icon, accentColor, children, actions }: GlassModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:pl-[246px]"
          style={{
            background: "rgba(26, 26, 78, 0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="glass-scrollbar w-[90vw] max-w-[540px] max-h-[85vh] overflow-y-auto"
            style={{
              padding: 28,
              borderRadius: 24,
              background: "#FFFFFF",
              boxShadow: "0 24px 64px rgba(26,26,78,0.18), 0 2px 8px rgba(26,26,78,0.08)",
              border: "1px solid rgba(232,115,58,0.12)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
                  <h2 className="text-[17px] font-semibold" style={{ color: "#1A1A2E" }}>{title}</h2>
                </div>
                <div className="mt-2.5 h-[2px] rounded-full" style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}33)`,
                  width: "100%",
                }} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full cursor-pointer ml-3 flex-shrink-0"
                style={{ color: "#6B7094", background: "rgba(107,112,148,0.10)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(107,112,148,0.20)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(107,112,148,0.10)"; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form content */}
            <div className="space-y-[14px]">
              {children}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2.5 mt-6">
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* Light-theme field styles for use inside GlassModal */

const glassInputDarkStyle: React.CSSProperties = {
  background: "#F8F9FC",
  border: "1.5px solid #E5E7EB",
  borderRadius: 12,
  color: "#1A1A2E",
  height: 42,
  padding: "0 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

const glassSelectDarkStyle: React.CSSProperties = {
  ...glassInputDarkStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

const glassTextareaDarkStyle: React.CSSProperties = {
  background: "#F8F9FC",
  border: "1.5px solid #E5E7EB",
  borderRadius: 12,
  color: "#1A1A2E",
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  minHeight: 80,
  resize: "none" as const,
};

const labelStyle: React.CSSProperties = {
  color: "#6B7094",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
  display: "block",
};

export default GlassModal;
export { glassInputDarkStyle, glassSelectDarkStyle, glassTextareaDarkStyle, labelStyle };
