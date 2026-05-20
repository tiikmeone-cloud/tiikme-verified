/**
 * Legacy compatibility wrapper.
 * The old profile-scoped inbox operated on employer_endorsement_requests and
 * directly updated profiles.is_verified. That path is intentionally retired.
 * Keep this component around so stale imports fail safe and point callers to
 * the canonical inbox route instead of reviving direct trust mutations.
 */
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function VerificationInbox() {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="min-w-0">
          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
            Verification moved
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-2)" }}>
            This legacy inbox no longer processes verification decisions. Use the canonical verification inbox instead.
          </p>
          <Link
            to="/app/verification-inbox"
            className="mt-3 inline-flex h-8 items-center rounded-lg px-3 text-[11px] font-bold"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          >
            Open Verification Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
