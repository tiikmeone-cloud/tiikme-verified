import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FFF7ED", color: "#92400E" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#166534" },
  rejected: { label: "Rejected", bg: "#FFF1F2", color: "#9F1239" },
  completed: { label: "Completed", bg: "#F0F9FF", color: "#0369A1" },
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn",
  twitter: "Twitter/X", reels: "Reels", shorts: "Shorts", blog: "Blog",
};

export default function CampaignApplicants() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const orgId = (profile as any)?.org_id;

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      const [{ data: c }, { data: apps }] = await Promise.all([
        supabase.from("brand_campaigns")
          .select("*, org:organizations!brand_campaigns_org_id_fkey(id, name, logo_url)")
          .eq("id", campaignId)
          .maybeSingle(),
        supabase.from("brand_campaign_applications")
          .select("*, applicant:profiles!brand_campaign_applications_applicant_id_fkey(id, full_name, avatar_url, role, headline, location_city)")
          .eq("campaign_id", campaignId)
          .order("applied_at", { ascending: false }),
      ]);
      setCampaign(c);
      setApplicants(apps || []);
      setLoading(false);
    })();
  }, [campaignId]);

  const updateStatus = async (appId: string, applicantId: string, newStatus: string, appTitle: string) => {
    setUpdating(appId);
    const { error } = await supabase.from("brand_campaign_applications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq("id", appId);
    setUpdating(null);
    if (error) { toast.error("Failed to update"); return; }
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    const notifTitle = newStatus === "approved"
      ? `Your campaign application was approved!`
      : `Update on your campaign application`;
    const notifBody = newStatus === "approved"
      ? `You've been selected for "${campaign?.title}". The brand will reach out with next steps.`
      : `Thank you for applying to "${campaign?.title}". Unfortunately you weren't selected this time.`;
    sendNotification({
      userId: applicantId,
      actorId: user!.id,
      type: "opportunity",
      title: notifTitle,
      body: notifBody,
      actionUrl: "/app/opportunities?tab=campaigns",
    });
    toast.success(newStatus === "approved" ? "Creator approved!" : "Application rejected");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--brand)" }} />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
      <p style={{ color: "var(--text-3)", fontSize: 14 }}>Campaign not found.</p>
      <button type="button" onClick={() => navigate(-1)} className="cursor-pointer" style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600, background: "none", border: "none" }}>Go back</button>
    </div>
  );

  const counts = { pending: 0, approved: 0, rejected: 0, completed: 0 };
  for (const a of applicants) counts[a.status as keyof typeof counts] = (counts[a.status as keyof typeof counts] || 0) + 1;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="sticky top-0 z-10 flex items-center gap-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "12px 16px" }}>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 cursor-pointer"
          style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ fontSize: 14, color: "var(--text-1)" }}>{campaign.title}</p>
          <p style={{ fontSize: 11, color: "var(--text-3)" }}>{applicants.length} applicant{applicants.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: 680, padding: "16px 16px 80px" }}>
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(["pending", "approved", "rejected", "completed"] as const).map(s => {
            const conf = STATUS_CONFIG[s];
            return (
              <div key={s} className="text-center rounded-xl py-3" style={{ background: conf.bg }}>
                <p className="font-bold text-[18px]" style={{ color: conf.color }}>{counts[s]}</p>
                <p className="text-[11px] font-semibold" style={{ color: conf.color, opacity: 0.8 }}>{conf.label}</p>
              </div>
            );
          })}
        </div>

        {applicants.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-semibold mb-1" style={{ fontSize: 15, color: "var(--text-1)" }}>No applications yet</p>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Creators will apply once they discover this campaign.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicants.map(app => {
              const p = app.applicant;
              const conf = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              return (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <AvatarSquare src={p?.avatar_url} name={p?.full_name || "?"} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => navigate(`/app/profile/${p?.id}`)}
                          className="font-bold text-[14px] hover:underline cursor-pointer"
                          style={{ color: "var(--text-1)", background: "none", border: "none", padding: 0 }}>
                          {p?.full_name || "Creator"}
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
                      </div>
                      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{p?.headline || p?.role}</p>
                      {app.platform && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#6B7094" }}>
                          {PLATFORM_LABELS[app.platform] || app.platform}
                          {app.follower_count ? ` · ${app.follower_count.toLocaleString()} followers` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {app.portfolio_url && (
                        <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                          style={{ color: "#6B7094" }}>
                          <ExternalLink style={{ width: 14, height: 14 }} />
                        </a>
                      )}
                    </div>
                  </div>

                  {app.pitch_text && (
                    <p className="text-[13px] mt-3 p-3 rounded-xl" style={{ background: "#FAFAFA", color: "var(--text-2)", lineHeight: "20px" }}>
                      {app.pitch_text}
                    </p>
                  )}

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" disabled={updating === app.id}
                        onClick={() => updateStatus(app.id, app.applicant_id, "approved", campaign.title)}
                        className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: "#F0FDF4", color: "#166534", border: "1.5px solid #BBF7D0" }}>
                        {updating === app.id ? <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> : <CheckCircle style={{ width: 12, height: 12 }} />}
                        Approve
                      </button>
                      <button type="button" disabled={updating === app.id}
                        onClick={() => updateStatus(app.id, app.applicant_id, "rejected", campaign.title)}
                        className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: "#FFF1F2", color: "#9F1239", border: "1.5px solid #FECDD3" }}>
                        <XCircle style={{ width: 12, height: 12 }} /> Reject
                      </button>
                      {app.status === "approved" && (
                        <button type="button" disabled={updating === app.id}
                          onClick={() => updateStatus(app.id, app.applicant_id, "completed", campaign.title)}
                          className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-4 py-2 rounded-xl text-[12px] font-bold"
                          style={{ background: "#F0F9FF", color: "#0369A1", border: "1.5px solid #BAE6FD" }}>
                          <Clock style={{ width: 12, height: 12 }} /> Mark complete
                        </button>
                      )}
                    </div>
                  )}
                  {app.status === "approved" && (
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" disabled={updating === app.id}
                        onClick={() => updateStatus(app.id, app.applicant_id, "completed", campaign.title)}
                        className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: "#F0F9FF", color: "#0369A1", border: "1.5px solid #BAE6FD" }}>
                        {updating === app.id ? <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> : <Clock style={{ width: 12, height: 12 }} />}
                        Mark complete
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] mt-2" style={{ color: "#9CA3C0" }}>
                    Applied {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
