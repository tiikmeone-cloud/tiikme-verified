import { useEffect, useCallback, type ReactNode } from "react";
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
  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(26, 26, 78, 0.40)",
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
            className="glass-dark glass-scrollbar glass-modal-content w-[90vw] max-w-[560px] max-h-[80vh] overflow-y-auto"
            style={{
              padding: 28,
              borderRadius: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <Icon className="w-6 h-6" style={{ color: accentColor }} />
                  <h2 className="text-[18px] font-semibold text-white">{title}</h2>
                </div>
                <div className="mt-2 h-[2px] rounded-full" style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
                  width: "100%",
                }} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 cursor-pointer transition-colors"
                style={{ color: "rgba(255,255,255,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
              >
                <X className="w-5 h-5" />
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
    </AnimatePresence>
  );
};

/* Reusable form field components for inside the modal */

const glassInputDarkStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 14,
  color: "#F0F2F7",
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
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 14,
  color: "#F0F2F7",
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  minHeight: 80,
  resize: "none" as const,
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.70)",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  display: "block",
};

export default GlassModal;
export { glassInputDarkStyle, glassSelectDarkStyle, glassTextareaDarkStyle, labelStyle };
