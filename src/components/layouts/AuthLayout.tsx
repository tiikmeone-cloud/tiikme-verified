import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThemeLogo from "@/components/ThemeLogo";

interface Props {
  children: ReactNode;
  /** Optional 1-indexed step for the dot progress bar */
  step?: number;
  totalSteps?: number;
  /** Show a back chevron in the top-left */
  showBack?: boolean;
  /** Where the back button navigates. If omitted, uses history.back(). */
  backTo?: string;
  /** Hide the centered logo at top */
  hideLogo?: boolean;
  /** Maximum width of the inner glass card. Default 440 (auth screens). Onboarding uses 600. */
  maxWidth?: number;
}

/**
 * Tiikme — Glass on Midnight auth shell.
 * Used by every unauthenticated screen: signin, signup, verify-email,
 * forgot/reset password, onboarding, auth callback, accept-invite.
 *
 * Background: Tiikme midnight (#21205A) with two soft orange radial glows.
 * Card: glossy white frosted glass, 1px translucent stroke, 24px radius.
 */
export default function AuthLayout({
  children,
  step,
  totalSteps,
  showBack = false,
  backTo,
  hideLogo = false,
  maxWidth = 440,
}: Props) {
  const navigate = useNavigate();
  const dots = totalSteps ? Array.from({ length: totalSteps }, (_, i) => i + 1) : [];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-midnight text-paper">
      {/* Soft orange radial glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand/30 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-midnight-700/40 blur-[120px]" />

      {/* Top bar (back button) */}
      {showBack && (
        <button
          type="button"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] font-medium text-paper/70 backdrop-blur-md transition hover:bg-white/[0.10] hover:text-paper"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      )}

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {!hideLogo && (
          <Link to="/" className="mb-6 inline-flex items-center" aria-label="Tiikme home">
            <div style={{ filter: "drop-shadow(0 0 24px rgba(255, 90, 31,0.35))" }}>
              <ThemeLogo className="h-14 w-auto" variant="dark" />
            </div>
          </Link>
        )}

        {/* Step dots */}
        {step && totalSteps && totalSteps > 1 && (
          <div className="mb-6 flex items-center gap-0">
            {dots.map((d, i) => (
              <div key={d} className="flex items-center">
                <div
                  className="h-2.5 w-2.5 rounded-full border-2 transition-all duration-300"
                  style={{
                    borderColor: d <= step ? "#FF5A1F" : "rgba(255,255,255,0.25)",
                    background: d <= step ? "#FF5A1F" : "transparent",
                  }}
                />
                {i < dots.length - 1 && (
                  <div
                    className="h-[2px] w-7 transition-colors"
                    style={{ background: d < step ? "#FF5A1F" : "rgba(255,255,255,0.15)" }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Glossy glass card */}
        <div
          className="w-full rounded-3xl border border-white/[0.14] bg-white/[0.06] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9"
          style={{ maxWidth }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
