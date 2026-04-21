import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────  Auth Input  ───────────────────────── */
export const AuthInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-12 rounded-xl border bg-white/[0.04] px-4 text-[14px] text-paper placeholder:text-paper/40 outline-none transition",
        "focus:border-brand focus:ring-2 focus:ring-brand/40",
        error ? "border-destructive/60" : "border-white/15",
        className,
      )}
      {...props}
    />
  ),
);
AuthInput.displayName = "AuthInput";

/* ─────────────────────────  Auth Select  ───────────────────────── */
export const AuthSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full h-12 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-[14px] text-paper outline-none transition cursor-pointer",
        "focus:border-brand focus:ring-2 focus:ring-brand/40",
        "[&>option]:bg-midnight [&>option]:text-paper",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
AuthSelect.displayName = "AuthSelect";

/* ─────────────────────────  Auth Textarea  ───────────────────────── */
export const AuthTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[88px] rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[14px] text-paper placeholder:text-paper/40 outline-none transition resize-none",
        "focus:border-brand focus:ring-2 focus:ring-brand/40",
        className,
      )}
      {...props}
    />
  ),
);
AuthTextarea.displayName = "AuthTextarea";

/* ─────────────────────────  Auth Button  ───────────────────────── */
type AuthButtonVariant = "primary" | "secondary" | "ghost";
interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AuthButtonVariant;
  loading?: boolean;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants: Record<AuthButtonVariant, string> = {
      primary:
        "bg-brand text-white shadow-[0_4px_14px_rgba(250,144,62,0.30)] hover:bg-brand-hover active:bg-brand-press",
      secondary:
        "border border-white/20 bg-white/[0.06] text-paper backdrop-blur-md hover:bg-white/[0.10]",
      ghost:
        "text-paper/70 hover:text-paper hover:bg-white/[0.06]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], className)}
        {...props}
      >
        {loading ? "Please wait…" : children}
      </button>
    );
  },
);
AuthButton.displayName = "AuthButton";

/* ─────────────────────────  Field Label  ───────────────────────── */
export function AuthLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-[13px] font-semibold text-paper/85", className)}>
      {children}
    </label>
  );
}

/* ─────────────────────────  Field Helper Text / Error  ───────────────────────── */
export function AuthHelp({ children, error, className }: { children: React.ReactNode; error?: boolean; className?: string }) {
  return (
    <p className={cn("mt-1.5 text-[12px]", error ? "text-destructive" : "text-paper/55", className)}>
      {children}
    </p>
  );
}
