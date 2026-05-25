import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Briefcase, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AvatarSquare from "@/components/ui/AvatarSquare";
import GlassBox from "@/components/ui/GlassBox";
import { Button } from "@/components/ui/button";
import ApplyModal from "@/components/opportunities/ApplyModal";

interface Referral {
  id: string;
  created_at: string;
  referrer: { id: string; full_name: string | null; avatar_url: string | null } | null;
  opportunity: any;
}

export default function ReferralsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: refs } = await supabase
        .from("opportunity_referrals")
        .select("id, created_at, opportunity_id, referrer_id")
        .eq("referred_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!refs?.length) { setItems([]); setLoading(false); return; }

      const oppIds = [...new Set(refs.map(r => r.opportunity_id))];
      const referrerIds = [...new Set(refs.map(r => r.referrer_id))];

      const [oppsRes, profsRes] = await Promise.all([
        supabase.from("opportunities")
          .select("*, org:organizations!opportunities_org_id_fkey(id, name, logo_url, is_verified)")
          .in("id", oppIds),
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", referrerIds),
      ]);

      const oppMap: Record<string, any> = {};
      (oppsRes.data || []).forEach((o: any) => { oppMap[o.id] = o; });
      const profMap: Record<string, any> = {};
      (profsRes.data || []).forEach((p: any) => { profMap[p.id] = p; });

      setItems(refs.map(r => ({
        id: r.id,
        created_at: r.created_at,
        referrer: profMap[r.referrer_id] || null,
        opportunity: oppMap[r.opportunity_id] || null,
      })).filter(r => r.opportunity));
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-4 glass-light" style={{ minHeight: 100 }}>
            <div className="h-4 w-1/2 rounded mb-2" style={{ background: "var(--surface-2)" }} />
            <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-2)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <Link2 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No referrals yet</p>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>When someone refers you for a role, it'll show up here.</p>
      </div>
    );
  }

  const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return diff === 0 ? "Today" : `${diff}d ago`;
  };

  return (
    <div className="mt-4 space-y-3">
      {items.map(r => {
        const o = r.opportunity;
        const ref = r.referrer;
        return (
          <GlassBox key={r.id} accent="#8B5CF6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Referred by</span>
              {ref ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); navigate(`/app/profile/${ref.id}`); }}
                  className="flex items-center gap-1.5 cursor-pointer hover:underline"
                  style={{ background: "none", border: "none", padding: 0 }}>
                  <AvatarSquare src={ref.avatar_url} name={ref.full_name || "U"} size={20} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>{ref.full_name || "Someone"}</span>
                </button>
              ) : (
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>Someone</span>
              )}
              <span className="text-[11px] ml-auto" style={{ color: "var(--text-3)" }}>{timeAgo(r.created_at)}</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--surface-2)" }}>
                {o.org?.logo_url
                  ? <img src={o.org.logo_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <Briefcase className="w-4 h-4" style={{ color: "var(--text-3)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold truncate" style={{ color: "var(--text-1)" }}>{o.title}</p>
                <p className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>{o.org?.name || "Organisation"}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {o.location && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                      <MapPin className="w-3 h-3" />{o.location}
                    </span>
                  )}
                  {o.is_remote && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.08)", color: "#E8733A" }}>Remote</span>
                  )}
                  {o.deadline && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                      <Clock className="w-3 h-3" />Apply by {new Date(o.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <Button
                onClick={() => setShowApply(o)}
                className="btn-liquid-primary"
                style={{ height: 38, borderRadius: 12 }}>
                View & Apply →
              </Button>
            </div>
          </GlassBox>
        );
      })}

      {showApply && (
        <ApplyModal
          open={!!showApply}
          onClose={() => setShowApply(null)}
          opportunity={showApply}
          orgName={showApply?.org?.name}
          onApplied={() => setShowApply(null)}
        />
      )}
    </div>
  );
}
