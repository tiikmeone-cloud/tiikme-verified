import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrgSubscription {
  id: string;
  org_id: string;
  profile_id: string;
  plan: "trial" | "basic" | "premium";
  status: "active" | "past_due" | "cancelled" | "expired";
  trial_started_at: string;
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  amount: number;
  currency: string;
  discount_months_remaining: number;
  created_at: string;
  updated_at: string;
}

export function useOrgSubscription() {
  const { profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const profileId = profile?.id;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["org_subscription", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await supabase
        .from("org_subscriptions")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data as OrgSubscription | null;
    },
    enabled: !!profileId && isInstitution,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const hasAccess = (() => {
    if (!isInstitution) return true; // non-institution users aren't gated
    if (!subscription) return true; // No record = allow (fail open, trial not yet created)
    if (subscription.plan === "trial" && new Date(subscription.trial_ends_at) > new Date()) return true;
    if (subscription.plan !== "trial" && subscription.status === "active") return true;
    return false;
  })();

  const trialDaysRemaining = (() => {
    if (!subscription?.trial_ends_at) return 0;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const isTrialExpired = subscription?.plan === "trial" && trialDaysRemaining === 0;

  return {
    subscription,
    isLoading,
    hasAccess,
    trialDaysRemaining,
    isTrialExpired,
    isInstitution,
  };
}
