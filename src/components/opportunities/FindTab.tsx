import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronDown, ChevronUp, Sparkles, Search as SearchIcon, Send, Link2, Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SendJDModal from "@/components/opportunities/SendJDModal";
import ReferModal from "@/components/opportunities/ReferModal";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { toast } from "sonner";

interface OTWProfile {
  id: string;
  user_id: string;
  role_types: string[];
  preferred_location: string | null;
  location_type: string;
  desired_title: string | null;
  pitch: string | null;
  profile?: {
    id?: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    headline: string | null;
    location_city: string | null;
    bio: string | null;
    open_to_work?: boolean | null;
    activity_score?: number | null;
    is_verified?: boolean | null;
  };
}

export default function FindTab() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const [profiles, setProfiles] = useState<OTWProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sendJdTarget, setSendJdTarget] = useState<{ id: string; full_name: string | null } | null>(null);
  const [referralTarget, setReferralTarget] = useState<{ id: string; full_name: string | null } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [myOpps, setMyOpps] = useState<any[]>([]);
  const [pickingOppFor, setPickingOppFor] = useState<{ id: string; full_name: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: directOtw } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, headline, location_city, bio, open_to_work, activity_score, is_verified")
        .eq("open_to_work", true)
        .eq("is_public", true)
        .order("activity_score", { ascending: false, nullsFirst: false })
        .limit(50);

      const ids = (directOtw || []).map(p => p.id);
      const { data: otwExtra } = ids.length
        ? await supabase
            .from("open_to_work_profiles")
            .select("user_id, role_types, preferred_location, location_type, desired_title, pitch")
            .eq("is_active", true)
            .in("user_id", ids)
        : { data: [] as any[] };

      const extraMap: Record<string, any> = {};
      for (const o of otwExtra || []) extraMap[o.user_id] = o;

      const merged: OTWProfile[] = (directOtw || []).map(p => ({
        id: p.id,
        user_id: p.id,
        profile: p as any,
        role_types: extraMap[p.id]?.role_types || [],
        preferred_location: extraMap[p.id]?.preferred_location || p.location_city,
        location_type: extraMap[p.id]?.location_type || "flexible",
        desired_title: extraMap[p.id]?.desired_title || p.headline,
        pitch: extraMap[p.id]?.pitch || p.bio,
      }));
      setProfiles(merged);
      setLoading(false);
    })();
  }, []);

  // Load this institution's own opportunities for the Refer flow
  useEffect(() => {
    if (!user?.id || !isInstitution) return;
    (async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("id, title, org:organizations!opportunities_org_id_fkey(name)")
        .eq("poster_id", user.id)
        .eq("is_open", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setMyOpps(data || []);
    })();
  }, [user?.id, isInstitution]);

  const toggleSave = (userId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); toast.success("Removed from saved"); }
      else { next.add(userId); toast.success("Saved candidate"); }
      return next;
    });
  };

  const startReferFor = (target: { id: string; full_name: string | null }) => {
    if (!myOpps.length) {
      toast.error("Post an opportunity first to refer candidates");
      return;
    }
    if (myOpps.length === 1) {
      setReferralTarget(target);
      return;
    }
    setPickingOppFor(target);
  };

  const filtered = search.trim()
    ? profiles.filter(p => {
        const q = search.toLowerCase();
        return (
          (p.profile?.full_name || "").toLowerCase().includes(q) ||
          (p.desired_title || "").toLowerCase().includes(q) ||
          (p.role_types || []).some(r => r.toLowerCase().includes(q))
        );
      })
    : profiles;

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-4 glass-light" style={{ minHeight: 80 }}>
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full" style={{ background: "var(--surface-2)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded" style={{ background: "var(--surface-2)" }} />
                <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-2)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="text-center py-16">
        <SearchIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No one is Open to Work yet</p>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Check back later or enable it on your profile</p>
      </div>
    );
  }

  const selectedOpportunity = referralTarget
    ? myOpps.find(o => o.id === (referralTarget as any)._oppId) || myOpps[0]
    : null;

  return (
    <div className="mt-2">
      <div className="relative mb-4">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, title, or role type..."
          className="w-full h-10 rounded-xl pl-10 pr-4 text-[13px] outline-none glass-input" />
      </div>

      <div className="space-y-3">
        {filtered.map(p => {
          const isExpanded = expanded === p.id;
          const name = p.profile?.full_name || "User";
          const location = p.preferred_location || p.profile?.location_city || null;
          const isSaved = savedIds.has(p.user_id);

          return (
            <div key={p.id} className="glass-light rounded-xl overflow-hidden transition-all duration-200" style={{ cursor: "pointer" }}
              onClick={() => navigate(`/app/profile/${p.user_id}`)}>
              <div className="flex items-center gap-3 p-3">
                {/* Circular avatar 48px */}
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid rgba(232,115,58,0.20)" }}>
                  {p.profile?.avatar_url ? (
                    <img src={p.profile.avatar_url} alt={name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[14px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                      {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
                    {p.profile?.activity_score != null ? (
                      <ActivityScoreRing score={p.profile.activity_score} size={28} strokeWidth={3} />
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>—</span>
                    )}
                  </div>
                  <p className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>
                    {p.desired_title || p.profile?.headline || p.profile?.role || "Professional"}
                  </p>
                  {location && (
                    <span className="text-[11px] flex items-center gap-0.5 mt-0.5" style={{ color: "var(--text-3)" }}>
                      <MapPin className="w-3 h-3" />{location}
                      {p.location_type === "remote" && " (Remote)"}
                      {p.location_type === "hybrid" && " (Hybrid)"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                    {p.role_types.slice(0, 2).map(r => (
                      <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.10)", color: "#E8733A" }}>{r}</span>
                    ))}
                    {p.role_types.length > 2 && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>+{p.role_types.length - 2}</span>}
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : p.id); }}
                    className="text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer" style={{ color: "#E8733A", background: "none", border: "none" }}>
                    {isExpanded ? "Less" : "More"} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
                  {p.pitch && (
                    <div className="mb-2">
                      <p className="text-[12px] font-bold flex items-center gap-1 mb-1" style={{ color: "#E8733A" }}>
                        <Sparkles className="w-3.5 h-3.5" /> Why you should pick me
                      </p>
                      <p className="text-[13px]" style={{ color: "var(--text-1)", lineHeight: "20px" }}>"{p.pitch}"</p>
                    </div>
                  )}
                  {p.profile?.bio && (
                    <p className="text-[12px] mt-2" style={{ color: "var(--text-2)", lineHeight: "18px" }}>{p.profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.role_types.map(r => (
                      <span key={r} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.10)", color: "#E8733A" }}>{r}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate(`/app/profile/${p.user_id}`); }}
                      className="flex-1 min-w-[110px] h-9 rounded-lg text-[12px] font-semibold cursor-pointer"
                      style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }}>
                      View Profile
                    </button>
                    {isInstitution && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setSendJdTarget({ id: p.user_id, full_name: p.profile?.full_name || null }); }}
                        className="flex-1 min-w-[110px] h-9 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
                        <Send className="w-3.5 h-3.5" /> Send JD
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); startReferFor({ id: p.user_id, full_name: p.profile?.full_name || null }); }}
                      className="flex-1 min-w-[90px] h-9 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(99,102,241,0.10)", color: "#6366F1", border: "1.5px solid rgba(99,102,241,0.25)" }}>
                      <Link2 className="w-3.5 h-3.5" /> Refer
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleSave(p.user_id); }}
                      aria-label={isSaved ? "Unsave" : "Save"}
                      className="h-9 w-9 rounded-lg cursor-pointer flex items-center justify-center"
                      style={{ background: isSaved ? "rgba(232,115,58,0.10)" : "var(--surface-2)", color: isSaved ? "#E8733A" : "var(--text-2)", border: "1.5px solid var(--border)" }}>
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sendJdTarget && (
        <SendJDModal
          open={!!sendJdTarget}
          onClose={() => setSendJdTarget(null)}
          targetUser={sendJdTarget}
        />
      )}

      {/* Opportunity picker — when institution has multiple postings */}
      {pickingOppFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-[400px] mx-4 rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <p className="text-[15px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Refer for which opportunity?</p>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {myOpps.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setReferralTarget({ ...pickingOppFor, ...({ _oppId: o.id } as any) });
                    setPickingOppFor(null);
                  }}
                  className="w-full text-left p-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--surface-2)]"
                  style={{ border: "1px solid var(--border)" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{o.title}</p>
                  {o.org?.name && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{o.org.name}</p>}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPickingOppFor(null)}
              className="mt-3 w-full h-9 rounded-lg text-[12px] font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {referralTarget && selectedOpportunity && (
        <ReferModal
          open={!!referralTarget}
          onClose={() => setReferralTarget(null)}
          opportunity={selectedOpportunity}
        />
      )}
    </div>
  );
}
