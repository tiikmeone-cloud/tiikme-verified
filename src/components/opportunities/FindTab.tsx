import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronDown, ChevronUp, Sparkles, Search as SearchIcon, Send } from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { useAuth } from "@/contexts/AuthContext";
import SendJDModal from "@/components/opportunities/SendJDModal";

interface OTWProfile {
  id: string;
  user_id: string;
  role_types: string[];
  preferred_location: string | null;
  location_type: string;
  desired_title: string | null;
  pitch: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    headline: string | null;
    location_city: string | null;
    bio: string | null;
  };
}

export default function FindTab() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const [profiles, setProfiles] = useState<OTWProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sendJdTarget, setSendJdTarget] = useState<{ id: string; full_name: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: otw } = await supabase
        .from("open_to_work_profiles")
        .select("id, user_id, role_types, preferred_location, location_type, desired_title, pitch")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!otw?.length) { setProfiles([]); setLoading(false); return; }

      const userIds = otw.map(o => o.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, headline, location_city, bio")
        .in("id", userIds);

      const profMap: Record<string, any> = {};
      for (const p of profs || []) profMap[p.id] = p;

      setProfiles(otw.map(o => ({ ...o, profile: profMap[o.user_id] || undefined })));
      setLoading(false);
    })();
  }, []);

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

          return (
            <div key={p.id} className="glass-light rounded-xl overflow-hidden transition-all duration-200">
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => navigate(`/app/profile/${p.user_id}`)}>
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
                  <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
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
                <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
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

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate(`/app/profile/${p.user_id}`); }}
                      className="flex-1 h-9 rounded-lg text-[12px] font-semibold cursor-pointer"
                      style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }}>
                      View Profile
                    </button>
                    {isInstitution && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setSendJdTarget({ id: p.user_id, full_name: p.profile?.full_name || null }); }}
                        className="flex-1 h-9 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
                        <Send className="w-3.5 h-3.5" /> Send JD
                      </button>
                    )}
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
    </div>
  );
}
