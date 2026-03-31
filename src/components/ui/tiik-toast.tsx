import { createRoot } from "react-dom/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type ToastType = "default" | "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

let addToastFn: ((msg: string, type: ToastType) => void) | null = null;
let toastId = 0;
let containerMounted = false;

function ensureContainer() {
  if (containerMounted) return;
  containerMounted = true;
  const div = document.createElement("div");
  div.id = "tiik-toast-root";
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(<ToastContainer />);
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const add = useCallback((msg: string, type: ToastType) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  const borderColor = (type: ToastType) => {
    if (type === "success") return "var(--open-green)";
    if (type === "error") return "var(--danger)";
    if (type === "warning") return "#F59E0B";
    return "var(--brand)";
  };

  const IconComp = (type: ToastType) => {
    if (type === "success") return <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--open-green)" }} />;
    if (type === "error") return <XCircle className="w-4 h-4 shrink-0" style={{ color: "var(--danger)" }} />;
    if (type === "warning") return <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#F59E0B" }} />;
    return <Info className="w-4 h-4 shrink-0" style={{ color: "var(--brand)" }} />;
  };

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column-reverse", gap: 10,
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-2)",
            borderLeft: `4px solid ${borderColor(t.type)}`,
            borderRadius: 14,
            padding: "14px 18px",
            minWidth: 280,
            maxWidth: 400,
            boxShadow: "0 8px 24px rgba(4,6,26,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "auto",
            animation: t.exiting
              ? "tiikToastOut 0.2s ease forwards"
              : "tiikToastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {IconComp(t.type)}
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", flex: 1 }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: 6 }}
          >
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("tiik-toast-styles")) {
  const style = document.createElement("style");
  style.id = "tiik-toast-styles";
  style.textContent = `
    @keyframes tiikToastIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes tiikToastOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

export function tiikToast(message: string) {
  ensureContainer();
  setTimeout(() => addToastFn?.(message, "default"), 0);
}

tiikToast.success = (message: string) => {
  ensureContainer();
  setTimeout(() => addToastFn?.(message, "success"), 0);
};

tiikToast.error = (message: string) => {
  ensureContainer();
  setTimeout(() => addToastFn?.(message, "error"), 0);
};

tiikToast.warning = (message: string) => {
  ensureContainer();
  setTimeout(() => addToastFn?.(message, "warning"), 0);
};
