import { useOrgSubscription } from "@/hooks/useOrgSubscription";
import { Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tiikToast } from "@/components/ui/tiik-toast";
import type { ReactNode } from "react";

interface SubscriptionGateProps {
  feature: "workspace" | "verification" | "opportunities";
  children: ReactNode;
}

const FEATURE_LABELS: Record<string, string> = {
  workspace: "Workspace",
  verification: "Verification",
  opportunities: "Opportunity Posting",
};

export default function SubscriptionGate({ feature, children }: SubscriptionGateProps) {
  const { hasAccess, isInstitution, isTrialExpired, isLoading } = useOrgSubscription();

  // Non-institution users or users with access pass through
  if (!isInstitution || hasAccess || isLoading) return <>{children}</>;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div
        className="w-full max-w-md text-center p-8 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: "rgba(232,115,58,0.1)" }}
        >
          <Shield className="w-8 h-8" style={{ color: "#E8733A" }} />
        </div>

        <h2 className="text-[20px] font-bold mb-2" style={{ color: "#1A1A2E" }}>
          {isTrialExpired ? "Free Trial Ended" : "Subscription Required"}
        </h2>

        <p className="text-[14px] mb-6" style={{ color: "#6B7094" }}>
          {isTrialExpired
            ? `Your free trial has ended. Subscribe to continue using ${FEATURE_LABELS[feature]}.`
            : `A subscription is required to access ${FEATURE_LABELS[feature]}.`}
        </p>

        <Button
          onClick={() =>
            tiikToast("Payment integration coming soon. Contact support@tiikme.com")
          }
          className="w-full h-12 rounded-xl text-[15px] font-semibold text-white"
          style={{ background: "#E8733A" }}
        >
          Subscribe — ₹299/month
        </Button>

        <p className="text-[12px] mt-3" style={{ color: "#9CA3AF" }}>
          50% off for the first 3 months. Regular price ₹599/month.
        </p>

        <button
          onClick={() => (window.location.href = "mailto:support@tiikme.com")}
          className="flex items-center justify-center gap-2 mx-auto mt-4 text-[13px] font-medium"
          style={{ color: "#E8733A" }}
        >
          <Mail className="w-4 h-4" /> Contact Support
        </button>
      </div>
    </div>
  );
}
