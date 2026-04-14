import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Building2, MapPin, Globe, Users, Heart, Briefcase, Shield, Calendar,
  Share2, MessageCircle, Settings, ChevronRight, Award, FileText, ExternalLink,
  Clock, Mail, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GlassBox from "@/components/ui/GlassBox";

/* ── Helpers ── */
const daysAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "Today" : `${diff}d ago`;
};

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data for boxes
  const [leaders, setLeaders] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [verifiedMembers, setVerifiedMembers] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setOrg(data);
      setFollowerCount(data.followers_count || 0);

      // Parallel fetches
      const [countRes, membersRes, verifRes, oppsRes, postsRes] = await Promise.allSettled([
        supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", data.id).eq("is_current", true),
        supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, role, headline)")
          .eq("org_id", data.id).eq("is_current", true).order("joined_at", { ascending: true }),
        supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(full_name, avatar_url, role)")
          .eq("org_id", data.id).eq("is_verified", true).order("verified_at", { ascending: false }).limit(20),
        supabase.from("opportunities").select("*").eq("org_id", data.id).eq("is_open", true).order("created_at", { ascending: false }).limit(10),
        supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url)")
          .eq("posted_by_org", data.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (countRes.status === "fulfilled") setMemberCount((countRes.value as any).count || 0);
      if (membersRes.status === "fulfilled") {
        const allMembers = (membersRes.value as any).data || [];
        setTeam(allMembers);
        setLeaders(allMembers.filter((m: any) => ["owner", "admin", "team_lead"].includes(m.role)));
      }
      if (verifRes.status === "fulfilled") setVerifiedMembers((verifRes.value as any).data || []);
      if (oppsRes.status === "fulfilled") setOpps((oppsRes.value as any).data || []);
      if (postsRes.status === "fulfilled") setPosts((postsRes.value as any).data || []);

      // Check user's relationship
      if (user) {
        const [adminRes, folRes] = await Promise.allSettled([
          supabase.from("org_members").select("role").eq("org_id", data.id).eq("user_id", user.id).maybeSingle(),
          supabase.from("org_followers").select("id").eq("org_id", data.id).eq("user_id", user.id).maybeSingle(),
        ]);
        if (adminRes.status === "fulfilled") {
          const r = (adminRes.value as any).data?.role;
          setIsAdmin(r === "owner" || r === "admin");
        }
        if (folRes.status === "fulfilled") setIsFollowing(!!(folRes.value as any).data);
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const toggleFollow = async () => {
    if (!user || !org) return;
    if (isFollowing) {
      await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
      setIsFollowing(false);
      setFollowerCount(p => Math.max(0, p - 1));
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setIsFollowing(true);
      setFollowerCount(p => p + 1);
    }
  };

  const toggle = (key: string) => setExpanded(prev => prev === key ? null : key);

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-48 rounded-2xl" style={{ background: "rgba(255,255,255,0.5)" }} />
        <div className="h-8 w-1/3 rounded" style={{ background: "rgba(255,255,255,0.5)" }} />
      </div>
    </div>
  );

  if (!org) return (
    <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
      <h1 className="text-[20px] font-bold mb-1" style={{ color: "#1A1A1A" }}>Organisation not found</h1>
      <p className="text-[13px] mb-4" style={{ color: "#9CA3AF" }}>No organisation matches "{slug}"</p>
      <Button onClick={() => navigate(-1)} variant="secondary">Go back</Button>
    </div>
  );

  const typeLabel = org.type?.charAt(0).toUpperCase() + org.type?.slice(1).replace(/_/g, " ");

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-6 pb-8" style={{ background: "linear-gradient(135deg, #FFF8F2, #FFF0E8)", minHeight: "100vh" }}>
      {/* Cover */}
      <div className="h-[200px] md:h-[240px] rounded-2xl mt-4 relative overflow-hidden" style={{ background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, #E8580A, #F59E0B)" }}>
        {!org.cover_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Building2 className="w-24 h-24 text-white" />
          </div>
        )}
      </div>

      {/* Logo + Identity */}
      <div className="relative px-4 -mt-12 mb-6">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "#fff", border: "4px solid #FFF8F2", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            {org.logo_url ? (
              <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-10 h-10" style={{ color: "#E8580A" }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-extrabold truncate" style={{ color: "#1A1A1A" }}>{org.name}</h1>
              {org.is_verified && <Shield className="w-5 h-5 shrink-0" style={{ color: "#F59E0B" }} />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>{typeLabel}</span>
              {org.tagline && <span className="text-[13px]" style={{ color: "#6B7280" }}>{org.tagline}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-[18px] font-extrabold" style={{ color: "#1A1A1A" }}>{followerCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "#6B7280" }}>Followers</p>
            </div>
            <div className="w-px h-8" style={{ background: "#E5E7EB" }} />
            <div className="text-center">
              <p className="text-[18px] font-extrabold" style={{ color: "#1A1A1A" }}>{memberCount}</p>
              <p className="text-[11px] font-medium" style={{ color: "#6B7280" }}>Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/app/workspace")}>
                <Settings className="w-3.5 h-3.5 mr-1" /> Manage
              </Button>
            )}
            <Button variant={isFollowing ? "secondary" : "default"} size="sm" onClick={toggleFollow}>
              <Heart className="w-3.5 h-3.5 mr-1" style={{ fill: isFollowing ? "currentColor" : "none" }} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* About */}
        <GlassBox accent="identity" expanded={expanded === "about"} onClick={() => toggle("about")} spanFull>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4" style={{ color: "#E8580A" }} />
            <span className="text-[13px] font-bold" style={{ color: "#E8580A" }}>About</span>
          </div>
          {org.description ? (
            <p className={`text-[14px] leading-relaxed ${expanded !== "about" ? "line-clamp-3" : ""}`} style={{ color: "#374151" }}>{org.description}</p>
          ) : (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No description added yet</p>
          )}
          {expanded === "about" && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {org.founded_year && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Founded</p>
                  <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>{org.founded_year}</p>
                </div>
              )}
              {org.employee_count && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Employees</p>
                  <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>{org.employee_count}</p>
                </div>
              )}
              {org.website_url && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Website</p>
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold truncate block" style={{ color: "#E8580A" }}>
                    {org.website_url.replace(/https?:\/\//, "")}
                  </a>
                </div>
              )}
              {(org.city || org.state) && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Location</p>
                  <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>{[org.city, org.state].filter(Boolean).join(", ")}</p>
                </div>
              )}
              {org.email && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Email</p>
                  <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{org.email}</p>
                </div>
              )}
              {org.phone && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>Phone</p>
                  <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>{org.phone}</p>
                </div>
              )}
            </div>
          )}
        </GlassBox>

        {/* Stats */}
        <GlassBox accent="stats" expanded={expanded === "stats"} onClick={() => toggle("stats")}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4" style={{ color: "#10B981" }} />
            <span className="text-[13px] font-bold" style={{ color: "#10B981" }}>Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[22px] font-extrabold" style={{ color: "#1A1A1A" }}>{memberCount}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Members</p>
            </div>
            <div>
              <p className="text-[22px] font-extrabold" style={{ color: "#1A1A1A" }}>{followerCount}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Followers</p>
            </div>
            <div>
              <p className="text-[22px] font-extrabold" style={{ color: "#1A1A1A" }}>{verifiedMembers.length}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Verified</p>
            </div>
            <div>
              <p className="text-[22px] font-extrabold" style={{ color: "#1A1A1A" }}>{opps.length}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Open Roles</p>
            </div>
          </div>
          {memberCount >= 5 && (
            <div className="flex items-center gap-1.5 mt-3 px-2 py-1 rounded-full w-fit" style={{ background: "#FFF7ED" }}>
              <Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
              <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>High-Trust Institution</span>
            </div>
          )}
        </GlassBox>

        {/* Leadership */}
        <GlassBox accent="leadership" expanded={expanded === "leadership"} onClick={() => toggle("leadership")}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span className="text-[13px] font-bold" style={{ color: "#F59E0B" }}>Leadership</span>
          </div>
          {leaders.length === 0 ? (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No leadership listed</p>
          ) : (
            <div className="space-y-2">
              {leaders.slice(0, expanded === "leadership" ? undefined : 3).map(m => (
                <Link key={m.id} to={`/app/profile/${m.user_id}`} className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#F59E0B" }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{m.profile?.full_name || "Leader"}</p>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{m.title || m.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassBox>

        {/* Team */}
        <GlassBox accent="team" expanded={expanded === "team"} onClick={() => toggle("team")} spanFull>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <span className="text-[13px] font-bold" style={{ color: "#8B5CF6" }}>Team</span>
              <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>{team.length}</span>
            </div>
          </div>
          {team.length === 0 ? (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No team members yet</p>
          ) : (
            <div className={`grid ${expanded === "team" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"} gap-2`}>
              {team.slice(0, expanded === "team" ? undefined : 4).map(m => (
                <Link key={m.id} to={`/app/profile/${m.user_id}`}
                  className="flex items-center gap-2 p-2 rounded-xl transition-all hover:scale-[1.02]"
                  onClick={e => e.stopPropagation()}
                  style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#8B5CF6" }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "#1A1A1A" }}>{m.profile?.full_name || "Member"}</p>
                    <p className="text-[10px] truncate" style={{ color: "#9CA3AF" }}>{m.title || m.role}</p>
                  </div>
                  {m.is_verified && <Shield className="w-3 h-3 shrink-0" style={{ color: "#F59E0B" }} />}
                </Link>
              ))}
            </div>
          )}
          {!expanded && team.length > 4 && (
            <p className="text-[11px] font-bold mt-2" style={{ color: "#8B5CF6" }}>+{team.length - 4} more</p>
          )}
        </GlassBox>

        {/* Opportunities */}
        <GlassBox accent="opportunities" expanded={expanded === "opps"} onClick={() => toggle("opps")} spanFull>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" style={{ color: "#3B82F6" }} />
              <span className="text-[13px] font-bold" style={{ color: "#3B82F6" }}>Open Opportunities</span>
              <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>{opps.length}</span>
            </div>
          </div>
          {opps.length === 0 ? (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No open opportunities</p>
          ) : (
            <div className="space-y-2">
              {opps.slice(0, expanded === "opps" ? undefined : 3).map(o => (
                <div key={o.id} onClick={e => { e.stopPropagation(); navigate("/app/opportunities"); }}
                  className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <h4 className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>{o.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      {(o.type || "job").replace(/[-_]/g, " ")}
                    </span>
                    {o.location && (
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#9CA3AF" }}>
                        <MapPin className="w-3 h-3" />{o.location}
                      </span>
                    )}
                    {o.compensation && <span className="text-[10px]" style={{ color: "#E8580A" }}>{o.compensation}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!expanded && opps.length > 3 && (
            <p className="text-[11px] font-bold mt-2" style={{ color: "#3B82F6" }}>View all {opps.length} opportunities</p>
          )}
        </GlassBox>

        {/* Verified Members */}
        <GlassBox accent="verified" expanded={expanded === "verified"} onClick={() => toggle("verified")}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span className="text-[13px] font-bold" style={{ color: "#F59E0B" }}>Verified Members</span>
            <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>{verifiedMembers.length}</span>
          </div>
          {verifiedMembers.length === 0 ? (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No verified members yet</p>
          ) : (
            <div className="space-y-2">
              {verifiedMembers.slice(0, expanded === "verified" ? undefined : 4).map(m => (
                <Link key={m.id} to={`/app/profile/${m.user_id}`} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#F59E0B" }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (m.profile?.full_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "#1A1A1A" }}>{m.profile?.full_name}</p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{m.title || m.role}{!m.is_current && " · Alumni"}</p>
                  </div>
                  <Shield className="w-3 h-3 shrink-0" style={{ color: "#F59E0B" }} />
                </Link>
              ))}
            </div>
          )}
        </GlassBox>

        {/* Posts */}
        <GlassBox accent="posts" expanded={expanded === "posts"} onClick={() => toggle("posts")} spanFull>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" style={{ color: "#E8580A" }} />
            <span className="text-[13px] font-bold" style={{ color: "#E8580A" }}>Posts</span>
            <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>{posts.length}</span>
          </div>
          {posts.length === 0 ? (
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No posts yet</p>
          ) : (
            <div className="space-y-2">
              {posts.slice(0, expanded === "posts" ? undefined : 3).map(p => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="block p-3 rounded-xl transition-all hover:scale-[1.01]"
                  onClick={e => e.stopPropagation()}
                  style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
                  <p className="text-[13px] line-clamp-2" style={{ color: "#1A1A1A" }}>{p.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px]" style={{ color: "#9CA3AF" }}>
                    {p.author?.full_name && <span>via {p.author.full_name}</span>}
                    <span>{daysAgo(p.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!expanded && posts.length > 3 && (
            <p className="text-[11px] font-bold mt-2" style={{ color: "#E8580A" }}>View all posts</p>
          )}
        </GlassBox>
      </div>
    </div>
  );
}
