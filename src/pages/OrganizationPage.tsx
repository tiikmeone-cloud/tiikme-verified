import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Building2, MapPin, Globe, Users, Heart, Briefcase, Shield, Calendar,
  Share2, Settings, Award, FileText, ExternalLink, Trophy, Plus,
  Image as ImageIcon, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AVATAR_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const initials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
const daysAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "1d ago" : `${diff}d ago`;
};

const orgTabs = ["About", "Members", "Opportunities", "Posts"] as const;
type Tab = typeof orgTabs[number];

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("About");
  const [members, setMembers] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [oppFilter, setOppFilter] = useState<"all" | "active" | "closed">("all");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setOrg(data);
      setFollowerCount(data.followers_count || 0);

      const [membersRes, oppsRes, postsRes] = await Promise.allSettled([
        supabase.from("org_members")
          .select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, headline, role)")
          .eq("org_id", data.id).eq("is_current", true).order("joined_at", { ascending: true }),
        supabase.from("opportunities").select("*").eq("org_id", data.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url)")
          .eq("posted_by_org", data.id).order("created_at", { ascending: false }).limit(20),
      ]);

      if (membersRes.status === "fulfilled") setMembers((membersRes.value as any).data || []);
      if (oppsRes.status === "fulfilled") setOpps((oppsRes.value as any).data || []);
      if (postsRes.status === "fulfilled") setPosts((postsRes.value as any).data || []);

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
      setIsFollowing(false); setFollowerCount(p => Math.max(0, p - 1));
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setIsFollowing(true); setFollowerCount(p => p + 1);
      // Notify org creator about new follower
      if (org.created_by) {
        sendNotification({
          userId: org.created_by,
          actorId: user.id,
          type: "follow",
          title: `${profile?.full_name || "Someone"} started following ${org.name}`,
          actionUrl: `/org/${org.slug}`,
        });
      }
    }
  };

  const departments = useMemo(() => Array.from(new Set(members.map(m => m.department).filter(Boolean))), [members]);
  const filteredMembers = useMemo(() => deptFilter === "all" ? members : members.filter(m => m.department === deptFilter), [members, deptFilter]);
  const filteredOpps = useMemo(() => {
    if (oppFilter === "active") return opps.filter(o => o.is_open);
    if (oppFilter === "closed") return opps.filter(o => !o.is_open);
    return opps;
  }, [opps, oppFilter]);

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-52 rounded-2xl" style={{ background: "var(--glass-bg)" }} />
        <div className="h-8 w-1/3 rounded-xl" style={{ background: "var(--glass-bg)" }} />
      </div>
    </div>
  );

  if (!org) return (
    <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
      <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--color-text)" }}>Organisation not found</h1>
      <p className="text-[13px] mb-4" style={{ color: "var(--color-text-muted)" }}>No organisation matches "{slug}"</p>
      <Button onClick={() => navigate(-1)} variant="secondary">Go back</Button>
    </div>
  );

  const typeLabel = org.type?.charAt(0).toUpperCase() + org.type?.slice(1).replace(/_/g, " ");

  return (
    <div className="max-w-[960px] mx-auto px-0 md:px-4 pb-8">
      {/* ── COVER ── */}
      <div className="w-full h-[200px] md:h-[240px] relative overflow-hidden" style={{
        borderRadius: "0 0 20px 20px",
        background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, var(--color-accent), #8B5CF6)",
      }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,30,0.6) 0%, transparent 60%)" }} />
        {!org.cover_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <Building2 className="w-24 h-24 text-white" />
          </div>
        )}
      </div>

      {/* ── LOGO + IDENTITY ── */}
      <div className="relative px-4 md:px-6 -mt-12 mb-4">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[22px] font-bold shrink-0 overflow-hidden"
            style={{
              background: org.logo_url ? "var(--glass-bg)" : hashColor(org.id),
              color: "white",
              border: "3px solid var(--glass-border-color, rgba(255,255,255,0.2))",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}>
            {org.logo_url
              ? <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" />
              : initials(org.name)}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-extrabold truncate" style={{ color: "var(--color-text)" }}>{org.name}</h1>
              {org.is_verified && <Shield className="w-5 h-5 shrink-0" style={{ color: "#FFB800" }} />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.12)", color: "var(--color-accent)" }}>{typeLabel}</span>
              {org.tagline && <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{org.tagline}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            {(org.city || org.state) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[org.city, org.state].filter(Boolean).join(", ")}</span>}
            <span>{followerCount} followers</span>
            <span>{members.length} members</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/app/workspace")}>
                <Settings className="w-3.5 h-3.5 mr-1" /> Manage
              </Button>
            )}
            <button className={`text-[12px] px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${isFollowing ? "glass-light" : "btn-liquid-primary"}`}
              onClick={toggleFollow}>
              <Heart className="w-3.5 h-3.5 mr-1 inline" style={{ fill: isFollowing ? "currentColor" : "none" }} />
              {isFollowing ? "Following" : "Follow"}
            </button>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div className="mx-4 md:mx-6 mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-3 overflow-x-auto scrollbar-hide text-[12px]"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))", backdropFilter: "blur(20px)" }}>
        {org.type && <span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Building2 className="w-3.5 h-3.5" /> {typeLabel}</span>}
        {org.employee_count && <><span style={{ color: "var(--glass-border-color)" }}>|</span><span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Users className="w-3.5 h-3.5" /> {org.employee_count}</span></>}
        {org.founded_year && <><span style={{ color: "var(--glass-border-color)" }}>|</span><span className="flex items-center gap-1 shrink-0" style={{ color: "var(--color-text-secondary)" }}><Calendar className="w-3.5 h-3.5" /> Est. {org.founded_year}</span></>}
        {org.website_url && <><span style={{ color: "var(--glass-border-color)" }}>|</span><a href={org.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 shrink-0 hover:underline" style={{ color: "var(--color-accent)" }}><Globe className="w-3.5 h-3.5" /> Website</a></>}
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="mx-4 md:mx-6 mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {orgTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-[13px] font-semibold rounded-xl shrink-0 transition-all cursor-pointer"
            style={{
              background: activeTab === tab ? "linear-gradient(135deg, var(--color-accent), #FF6B9D)" : "var(--glass-bg)",
              color: activeTab === tab ? "white" : "var(--color-text-secondary)",
              border: activeTab === tab ? "none" : "1px solid var(--glass-border-color, rgba(255,255,255,0.12))",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-4 md:px-6">

        {activeTab === "About" && (
          <div className="space-y-4">
            <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>About</h3>
              {org.description
                ? <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{org.description}</p>
                : <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No description added yet.</p>}
            </div>

            {/* Details grid */}
            <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--color-text)" }}>Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {org.founded_year && <InfoCell label="Founded" value={org.founded_year.toString()} />}
                {org.employee_count && <InfoCell label="Employees" value={org.employee_count} />}
                {org.email && <InfoCell label="Email" value={org.email} />}
                {org.phone && <InfoCell label="Phone" value={org.phone} />}
                {(org.city || org.state) && <InfoCell label="Location" value={[org.city, org.state].filter(Boolean).join(", ")} />}
                {org.website_url && <InfoCell label="Website" value={org.website_url.replace(/https?:\/\//, "")} />}
              </div>
            </div>

            {/* Social links */}
            {org.social_links && Object.keys(org.social_links as any).length > 0 && (
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Social</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(org.social_links as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)", color: "var(--color-accent)" }}>
                      <ExternalLink className="w-3 h-3" /> {k}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Members" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setDeptFilter("all")}
                className="text-[12px] px-3 py-1.5 rounded-xl shrink-0 font-semibold cursor-pointer"
                style={{ background: deptFilter === "all" ? "var(--color-accent)" : "var(--glass-bg)", color: deptFilter === "all" ? "white" : "var(--color-text-secondary)", border: deptFilter !== "all" ? "1px solid var(--glass-border-color)" : "none" }}>
                All ({members.length})
              </button>
              {departments.map(d => (
                <button key={d} onClick={() => setDeptFilter(d)}
                  className="text-[12px] px-3 py-1.5 rounded-xl shrink-0 font-semibold cursor-pointer"
                  style={{ background: deptFilter === d ? "var(--color-accent)" : "var(--glass-bg)", color: deptFilter === d ? "white" : "var(--color-text-secondary)", border: deptFilter !== d ? "1px solid var(--glass-border-color)" : "none" }}>
                  {d}
                </button>
              ))}
            </div>
            {filteredMembers.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMembers.map(m => (
                  <Link key={m.id} to={`/app/profile/${m.user_id}`}
                    className="glass-light rounded-2xl p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                    style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: hashColor(m.user_id) }}>
                      {m.profile?.avatar_url
                        ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" />
                        : initials(m.profile?.full_name || "")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{m.profile?.full_name || "Member"}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>{m.title || m.role}{m.department ? ` · ${m.department}` : ""}</p>
                    </div>
                    {m.is_verified && <Shield className="w-4 h-4 shrink-0" style={{ color: "#FFB800" }} />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Opportunities" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {(["all", "active", "closed"] as const).map(f => (
                <button key={f} onClick={() => setOppFilter(f)}
                  className="text-[12px] px-3 py-1.5 rounded-xl font-semibold cursor-pointer capitalize"
                  style={{ background: oppFilter === f ? "var(--color-accent)" : "var(--glass-bg)", color: oppFilter === f ? "white" : "var(--color-text-secondary)", border: oppFilter !== f ? "1px solid var(--glass-border-color)" : "none" }}>
                  {f} ({f === "all" ? opps.length : f === "active" ? opps.filter(o => o.is_open).length : opps.filter(o => !o.is_open).length})
                </button>
              ))}
            </div>
            {filteredOpps.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>No opportunities</p>
              </div>
            ) : (
              filteredOpps.map(o => (
                <div key={o.id} onClick={() => navigate("/app/opportunities")}
                  className="glass-light rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>{o.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(74,144,217,0.1)", color: "#4A90D9" }}>{(o.type || "job").replace(/[-_]/g, " ")}</span>
                        {o.location && <span className="text-[11px] flex items-center gap-0.5" style={{ color: "var(--color-text-muted)" }}><MapPin className="w-3 h-3" />{o.location}</span>}
                        {o.is_remote && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(52,199,89,0.1)", color: "#34C759" }}>Remote</span>}
                      </div>
                      {o.compensation && <p className="text-[12px] mt-1 font-semibold" style={{ color: "var(--color-accent)" }}>{o.compensation}</p>}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                      style={{ background: o.is_open ? "rgba(52,199,89,0.1)" : "rgba(156,163,175,0.1)", color: o.is_open ? "#34C759" : "var(--color-text-muted)" }}>
                      {o.is_open ? "Active" : "Closed"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Posts" && (
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="glass-light rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>No posts yet</p>
              </div>
            ) : (
              posts.map(p => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="glass-light rounded-2xl p-4 block transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <p className="text-[13px] line-clamp-3" style={{ color: "var(--color-text)" }}>{p.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {p.author?.full_name && <span>by {p.author.full_name}</span>}
                    <span>{daysAgo(p.created_at)}</span>
                    {(p.comment_count || 0) > 0 && <span>{p.comment_count} comments</span>}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2.5 rounded-xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color, rgba(255,255,255,0.12))" }}>
    <p className="text-[10px] font-bold" style={{ color: "var(--color-text-muted)" }}>{label}</p>
    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{value}</p>
  </div>
);
