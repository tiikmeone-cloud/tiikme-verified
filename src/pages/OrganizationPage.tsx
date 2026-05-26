import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProfileSubtitle } from "@/lib/profileUtils";
import { storageImageUrl } from "@/lib/imageTransform";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  Building2, MapPin, Globe, Users, Heart, Briefcase, Shield, Calendar,
  Share2, Settings, ExternalLink, Plus, MessageCircle,
  Star, Rocket, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OrgVerificationRouting from "@/components/verification/OrgVerificationRouting";
import { isCreatorOrg } from "@/lib/orgTypes";
import { PageSEO, orgSEO } from "@/hooks/usePageSEO";
import { CompanyBrain } from "@/components/org/CompanyBrain";

const AVATAR_COLORS = ["#E8733A", "#2D7A4F", "#C44A1F", "#7E22CE", "#166534", "#B7640A"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const normalizeComparableToken = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[\s_-]+/g, "").trim();
const normalizeWebsiteUrl = (url?: string | null) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
const stripWebsiteProtocol = (url?: string | null) => (url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");

function getTimeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isOrgMembershipConfirmed(member: { is_verified?: boolean | null; approval_status?: string | null }) {
  return !!member.is_verified && member.approval_status === "approved";
}

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [communityCircles, setCommunityCircles] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setOrg(data);
      setFollowerCount(data.followers_count || 0);

      const [membersRes, oppsRes, postsRes, circlesRes] = await Promise.allSettled([
        supabase.from("org_members")
          .select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, headline, role)")
          .eq("org_id", data.id).eq("is_current", true).order("joined_at", { ascending: true }),
        supabase.from("opportunities").select("*").eq("org_id", data.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(full_name, avatar_url), post_reactions(count), post_comments(count)")
          .eq("posted_by_org", data.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("circles").select("id, name, slug, icon_url, description, member_count, active_7d, visibility")
          .eq("linked_org_id", data.id).order("member_count", { ascending: false }),
      ]);

      if (membersRes.status === "fulfilled") setMembers((membersRes.value as any).data || []);
      if (oppsRes.status === "fulfilled") setOpps((oppsRes.value as any).data || []);
      if (postsRes.status === "fulfilled") setPosts((postsRes.value as any).data || []);
      if (circlesRes.status === "fulfilled") setCommunityCircles((circlesRes.value as any).data || []);

      if (user) {
        const isInstitution = profile?.account_type === "institution";
        const viewerOrgId = (profile as any)?.org_id;
        const [adminRes, folRes] = await Promise.allSettled([
          supabase.from("org_members").select("role").eq("org_id", data.id).eq("user_id", user.id).maybeSingle(),
          isInstitution && viewerOrgId
            ? supabase.from("org_follows" as any).select("id").eq("follower_org_id", viewerOrgId).eq("following_org_id", data.id).maybeSingle()
            : supabase.from("org_followers").select("id").eq("org_id", data.id).eq("user_id", user.id).maybeSingle(),
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
    const isInstitution = profile?.account_type === "institution";
    const viewerOrgId = (profile as any)?.org_id;

    if (isFollowing) {
      if (isInstitution && viewerOrgId) {
        await supabase.from("org_follows" as any).delete().eq("follower_org_id", viewerOrgId).eq("following_org_id", org.id);
      } else {
        const name = org.name || "this organization";
        toast(`Unfollow ${name}?`, {
          action: { label: "Unfollow", onClick: async () => {
            await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
            setIsFollowing(false); setFollowerCount(p => Math.max(0, p - 1));
            toast.success(`Unfollowed ${name}`);
          }},
          cancel: { label: "Cancel", onClick: () => {} },
          duration: 5000,
        });
        return;
      }
      setIsFollowing(false); setFollowerCount(p => Math.max(0, p - 1));
    } else {
      if (isInstitution && viewerOrgId) {
        await supabase.from("org_follows" as any).insert({ follower_org_id: viewerOrgId, following_org_id: org.id });
        if (org.created_by) {
          sendNotification({
            userId: org.created_by,
            actorId: user.id,
            type: "follow",
            title: `An organization started following ${org.name}`,
            actionUrl: `/org/${org.slug}`,
          });
        }
      } else {
        await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
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
      setIsFollowing(true); setFollowerCount(p => p + 1);
    }
  };

  const activeOpps = useMemo(() => opps.filter(o => o.is_open), [opps]);
  const typeLabel = org?.type?.charAt(0).toUpperCase() + org?.type?.slice(1).replace(/_/g, " ");
  const normalizedSubtype = typeof org?.subtype === "string" ? org.subtype.trim() : "";
  const showSubtype =
    normalizedSubtype &&
    normalizeComparableToken(normalizedSubtype) !== normalizeComparableToken(typeLabel || "");
  const websiteUrl = normalizeWebsiteUrl(org?.website_url);
  const websiteLabel = stripWebsiteProtocol(org?.website_url);
  const isCreator = isCreatorOrg(org?.type, org?.subtype);
  const followLabel = isCreator
    ? (isFollowing ? "Subscribed" : "Subscribe")
    : (isFollowing ? "Following"  : "Follow");
  const followerLabel = isCreator ? "Subscribers" : "Followers";
  const teamSizeLabel = isCreator ? "Subscribers" : "Team Size";

  const getLikeCount = (p: any) => {
    if (Array.isArray(p.post_reactions) && p.post_reactions.length > 0) return p.post_reactions[0]?.count || 0;
    return 0;
  };
  const getCommentCount = (p: any) => {
    if (Array.isArray(p.post_comments) && p.post_comments.length > 0) return p.post_comments[0]?.count || 0;
    return p.comment_count || 0;
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <div className="animate-pulse space-y-3">
          <div className="glass-card" style={{ height: 140, borderRadius: 16 }} />
          <div className="glass-card" style={{ height: 80, borderRadius: 16 }} />
        </div>
      </div>
    </div>
  );

  if (!org) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Building2 style={{ width: 48, height: 48, color: "#9CA3C0", marginBottom: 12 }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Organisation not found</p>
      <p style={{ fontSize: 13, color: "#9CA3C0", marginTop: 4 }}>No organisation matches "{slug}"</p>
      <button type="button" onClick={() => navigate(-1)} className="cursor-pointer" style={{ fontSize: 13, marginTop: 12, color: "#E8733A", background: "none", border: "none" }}>Go back</button>
    </div>
  );

  const seoProps = orgSEO({
    name: org.name,
    tagline: org.tagline,
    about: org.about,
    logo_url: org.logo_url,
    cover_url: org.cover_url,
    city: org.city,
    state: org.state,
    page_type: org.type,
    slug: org.slug,
    member_count: members.length,
  });

  /* Divider */
  const Divider = () => (
    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
  );

  return (
    <div className="min-h-screen pb-8">
      <PageSEO {...seoProps} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── HERO HEADER ── */}
        <div className="glass-card" style={{
          padding: 20, borderRadius: 16,
          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.40)",
          boxShadow: "0 8px 32px rgba(26,26,78,0.08), inset 0 1px 0 rgba(255,255,255,0.60)",
        }}>
          <div className="flex" style={{ gap: 16, alignItems: "flex-start" }}>
            {/* Logo */}
            <div className="shrink-0">
              <AvatarSquare src={org.logo_url ? storageImageUrl(org.logo_url) : undefined} name={org.name} size="profile" bgColor={hashColor(org.id)} className="shadow-md" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Row 1: Name + verified */}
              <div className="flex items-center" style={{ gap: 6 }}>
                <p style={{ fontSize: 20, fontWeight: 700, lineHeight: "28px", color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</p>
                {org.is_verified && (
                  <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 10, background: "#FFB800", boxShadow: "0 0 8px rgba(255,184,0,0.40)" }}>
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Row 2: tagline */}
              {org.tagline && (
                <p style={{ fontSize: 13, fontWeight: 400, color: "#6B7094" }}>{org.tagline}</p>
              )}

              {/* Row 3: @slug + type + location */}
              <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3C0" }}>@{org.slug}</span>
                {typeLabel && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9CA3C0", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#9CA3C0" }}>{typeLabel}{showSubtype ? ` · ${normalizedSubtype}` : ""}</span>
                  </>
                )}
                {(org.city || org.state) && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9CA3C0", flexShrink: 0 }} />
                    <span className="flex items-center" style={{ gap: 2, fontSize: 12, color: "#9CA3C0" }}>
                      <MapPin style={{ width: 12, height: 12 }} />{[org.city, org.state].filter(Boolean).join(", ")}
                    </span>
                  </>
                )}
              </div>

              {/* Row 4: Stats */}
              <div className="flex items-center" style={{ gap: 16, marginTop: 4 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{followerCount}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>{followerLabel}</span>
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{members.length}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>Members</span>
                </div>
                {activeOpps.length > 0 && (
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#34C759" }}>{activeOpps.length}</span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>Open Jobs</span>
                  </div>
                )}
              </div>

              {/* Row 5: Action buttons */}
              <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
                {isFollowing ? (
                  <div className="relative group">
                    <button type="button" className="cursor-pointer" style={{
                      height: 32, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <Heart style={{ width: 13, height: 13, fill: "currentColor" }} /> {followLabel}
                    </button>
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-20" style={{
                      background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: 4, minWidth: 120,
                    }}>
                      <button type="button" onClick={toggleFollow} className="w-full text-left cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", borderRadius: 6 }}>
                        {isCreator ? "Unsubscribe" : "Unfollow"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={toggleFollow} className="cursor-pointer" style={{
                    height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                    boxShadow: "0 2px 12px rgba(232,115,58,0.25)", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <Heart style={{ width: 13, height: 13 }} /> {followLabel}
                  </button>
                )}

                <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="cursor-pointer" style={{
                  height: 32, width: 32, borderRadius: 8, fontSize: 12,
                  background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)",
                  color: "#1A1A2E", display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Share2 style={{ width: 13, height: 13 }} />
                </button>

                {isAdmin && (
                  <button type="button" onClick={() => navigate("/app/workspace")} className="cursor-pointer" style={{
                    height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)",
                    color: "#1A1A2E", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <Settings style={{ width: 13, height: 13 }} /> Manage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: ABOUT ── */}
        <ScrollSection>
          <SectionHeader icon={Building2} iconColor="#6B7094" title="About" />
          {org.description ? (
            <p style={{ fontSize: 13, fontWeight: 400, color: "#6B7094", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{org.description}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#9CA3C0" }}>No description added yet.</p>
          )}

          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {org.founded_year && (
              <DetailRow icon={Calendar} label="Founded" value={String(org.founded_year)} />
            )}
            {(org.city || org.state) && (
              <DetailRow icon={MapPin} label="Location" value={[org.city, org.state].filter(Boolean).join(", ")} />
            )}
            {org.employee_count && (
              <DetailRow icon={Users} label={teamSizeLabel} value={org.employee_count} />
            )}
            {websiteUrl && (
              <div className="flex items-center" style={{ gap: 6 }}>
                <Globe style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3C0", minWidth: 60 }}>Website</span>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: "#E8733A" }}>
                  {websiteLabel || "Visit"}
                </a>
              </div>
            )}
            {org.email && (
              <DetailRow icon={Globe} label="Email" value={org.email} />
            )}
          </div>

          {/* Social links */}
          {org.social_links && Object.keys(org.social_links as any).length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
              {Object.entries(org.social_links as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="flex items-center" style={{
                  height: 28, padding: "0 10px", borderRadius: 6, gap: 6,
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <ExternalLink style={{ width: 12, height: 12, color: "#E8733A", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#1A1A2E" }}>{k}</span>
                </a>
              ))}
            </div>
          )}
        </ScrollSection>

        {/* ── SECTION 2: OPEN JOBS ── */}
        <ScrollSection>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <SectionHeader icon={Briefcase} iconColor="#34C759" title="Open Jobs" count={activeOpps.length} />
            <Link to={`/app/opportunities?org=${org.id}`} style={{ fontSize: 12, color: "#E8733A", display: "flex", alignItems: "center", gap: 2 }}>
              See all <ChevronRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>
          {activeOpps.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9CA3C0" }}>No open jobs right now.</p>
              {isAdmin && (
                <button type="button" onClick={() => navigate("/app/opportunities/create")} className="cursor-pointer" style={{
                  marginTop: 8, height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Plus style={{ width: 12, height: 12 }} /> Post the first job
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activeOpps.slice(0, 3).map((o, idx) => (
                <div key={o.id} onClick={() => navigate("/app/opportunities")} className="cursor-pointer" style={{
                  padding: "10px 0",
                  borderBottom: idx < Math.min(activeOpps.length, 3) - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  <div className="flex items-start justify-between">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{o.title}</p>
                      <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(232,115,58,0.08)", color: "#E8733A" }}>
                          {(o.type || "job").replace(/[-_]/g, " ")}
                        </span>
                        {o.location && <span style={{ fontSize: 11, color: "#9CA3C0" }}>{o.location}</span>}
                        {o.is_remote && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(52,199,89,0.1)", color: "#34C759" }}>Remote</span>}
                      </div>
                      {o.compensation && <p style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", marginTop: 3 }}>{o.compensation}</p>}
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "#9CA3C0", flexShrink: 0, marginTop: 2 }} />
                  </div>
                </div>
              ))}
              {activeOpps.length > 3 && (
                <Link to={`/app/opportunities?org=${org.id}`} style={{ fontSize: 12, color: "#E8733A", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 2 }}>
                  See all {activeOpps.length} open jobs <ChevronRight style={{ width: 13, height: 13 }} />
                </Link>
              )}
            </div>
          )}
        </ScrollSection>

        {/* ── SECTION 3: POSTS ── */}
        <ScrollSection>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <SectionHeader icon={MessageCircle} iconColor="#E8733A" title="Posts" count={posts.length} />
            {isAdmin && (
              <button type="button" onClick={() => navigate("/post/create")} className="cursor-pointer" style={{
                height: 28, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Plus style={{ width: 11, height: 11 }} /> New Post
              </button>
            )}
          </div>
          {posts.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9CA3C0" }}>No posts yet.</p>
              {isAdmin && (
                <button type="button" onClick={() => navigate("/post/create")} className="cursor-pointer" style={{
                  marginTop: 8, height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Plus style={{ width: 12, height: 12 }} /> Share your first update
                </button>
              )}
            </div>
          ) : (
            <>
              {posts.slice(0, 3).map((p, idx) => (
                <Link key={p.id} to={`/app/post/${p.id}`} className="block" style={{
                  padding: "10px 0",
                  borderBottom: idx < Math.min(posts.length, 3) - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 400, color: "#1A1A2E", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</p>
                  {p.image_urls && p.image_urls.length > 0 && (
                    <div className="flex gap-1 mt-1.5 overflow-hidden" style={{ borderRadius: 8 }}>
                      {p.image_urls.slice(0, 3).map((url: string, i: number) => (
                        <img key={i} src={url} alt="" loading="lazy" className="object-cover" style={{ width: p.image_urls.length === 1 ? "100%" : 80, height: 56, borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center" style={{ gap: 12, marginTop: 6 }}>
                    <span className="flex items-center" style={{ gap: 3, fontSize: 12, color: "#9CA3C0" }}>
                      <Star style={{ width: 12, height: 12, color: "#FF6B9D" }} /> {getLikeCount(p)}
                    </span>
                    <span className="flex items-center" style={{ gap: 3, fontSize: 12, color: "#9CA3C0" }}>
                      <MessageCircle style={{ width: 12, height: 12 }} /> {getCommentCount(p)}
                    </span>
                    <span className="flex items-center" style={{ gap: 3, fontSize: 12, color: "#9CA3C0" }}>
                      <Rocket style={{ width: 12, height: 12 }} /> {p.repost_count || 0}
                    </span>
                    <span style={{ fontSize: 11, color: "#9CA3C0", marginLeft: "auto" }}>
                      {p.created_at ? getTimeAgo(new Date(p.created_at)) : ""}
                    </span>
                  </div>
                </Link>
              ))}
              {posts.length > 3 && (
                <Link to="/app/feed" style={{ fontSize: 12, color: "#E8733A", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 2 }}>
                  See all posts <ChevronRight style={{ width: 13, height: 13 }} />
                </Link>
              )}
            </>
          )}
        </ScrollSection>

        {/* ── SECTION 4: COMMUNITY ── */}
        <ScrollSection>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <SectionHeader icon={Users} iconColor="#0E7490" title="Community" count={communityCircles.length} />
            {isAdmin && (
              <button type="button" onClick={() => navigate(`/app/circles/create?org=${org.id}`)} className="cursor-pointer" style={{
                height: 28, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(14,116,144,0.10)", color: "#0E7490", border: "1px solid rgba(14,116,144,0.20)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Plus style={{ width: 11, height: 11 }} /> New Circle
              </button>
            )}
          </div>
          {communityCircles.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9CA3C0" }}>
                {isAdmin ? "Create a circle so your followers can talk to each other." : "No community circles yet."}
              </p>
              {isAdmin && (
                <button type="button" onClick={() => navigate(`/app/circles/create?org=${org.id}`)} className="cursor-pointer" style={{
                  marginTop: 8, height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "rgba(14,116,144,0.10)", color: "#0E7490", border: "1px solid rgba(14,116,144,0.20)",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Plus style={{ width: 12, height: 12 }} /> Create first circle
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {communityCircles.map((c, idx) => (
                <Link key={c.id} to={`/app/circles/${c.slug}`} className="flex items-center" style={{
                  gap: 10, padding: "10px 0",
                  borderBottom: idx < communityCircles.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  <div className="flex items-center justify-center shrink-0" style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(14,116,144,0.10)", fontSize: 18,
                  }}>
                    {c.icon_url || "💬"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3C0" }}>
                      {c.member_count || 0} member{(c.member_count || 0) === 1 ? "" : "s"}
                      {c.active_7d ? ` · ${c.active_7d} active this week` : ""}
                    </p>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: "#9CA3C0", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </ScrollSection>

        {/* ── SECTION 5: TEAM ── */}
        <ScrollSection>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <SectionHeader icon={Users} iconColor="#9CA3C0" title="Team" count={members.length} />
            {isAdmin && (
              <button type="button" onClick={() => navigate("/app/settings?tab=team")} className="cursor-pointer" style={{
                height: 28, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(232,115,58,0.10)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.20)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Settings style={{ width: 11, height: 11 }} /> Manage
              </button>
            )}
          </div>

          {!isAdmin && (
            <p style={{ fontSize: 12, color: "#6B7094", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
              Members are verified employees or affiliates of this organisation. To appear here, add this organisation to your profile experience and get it verified.
            </p>
          )}

          {members.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9CA3C0", padding: "16px 0", textAlign: "center" }}>No verified members listed yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {members.slice(0, 8).map((m, idx) => (
                <Link key={m.id} to={`/app/profile/${m.user_id}`} className="flex items-center" style={{
                  gap: 10, padding: "8px 0",
                  borderBottom: idx < Math.min(members.length, 8) - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  <AvatarSquare src={m.profile?.avatar_url} name={m.profile?.full_name || "Member"} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.profile?.full_name || "Member"}</p>
                    <p style={{ fontSize: 11, color: "#9CA3C0" }}>{m.title || m.role}{m.department ? ` · ${m.department}` : ""}</p>
                  </div>
                  {isOrgMembershipConfirmed(m) && (
                    <span className="shrink-0" style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 6px", borderRadius: 999,
                      background: "rgba(255,184,0,0.16)", color: "#B77900", whiteSpace: "nowrap",
                    }}>Org confirmed</span>
                  )}
                </Link>
              ))}
              {members.length > 8 && (
                <p style={{ fontSize: 12, color: "#E8733A", marginTop: 8 }}>+{members.length - 8} more members</p>
              )}
            </div>
          )}
        </ScrollSection>

        {/* ── SECTION 6: RATINGS / REVIEWS (placeholder) ── */}
        <ScrollSection>
          <SectionHeader icon={Star} iconColor="#FFB800" title="Reviews" />
          <div style={{ padding: "16px 0", textAlign: "center" }}>
            <div className="flex justify-center" style={{ gap: 4, marginBottom: 8 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} style={{ width: 22, height: 22, color: "#E5E7EB" }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#9CA3C0" }}>No reviews yet.</p>
            <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 4 }}>Be the first to share your experience with {org.name}.</p>
          </div>
        </ScrollSection>

        {/* ── AI BRAIN (admin only) ── */}
        {isAdmin && (
          <ScrollSection>
            <SectionHeader icon={Building2} iconColor="#7E22CE" title="Company Brain" />
            <div style={{ marginTop: 8 }}>
              <CompanyBrain orgId={org.id} orgName={org.name} isAdmin={isAdmin} />
            </div>
          </ScrollSection>
        )}

      </div>
    </div>
  );
}

/* ── Scroll section wrapper ── */
const ScrollSection = ({ children }: { children: React.ReactNode }) => (
  <div className="glass-card" style={{
    padding: 16, borderRadius: 16,
    background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.40)",
    boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
  }}>
    {children}
  </div>
);

/* ── Section header ── */
const SectionHeader = ({ icon: Icon, iconColor, title, count }: { icon: any; iconColor: string; title: string; count?: number }) => (
  <div className="flex items-center" style={{ gap: 8, marginBottom: 0 }}>
    <Icon style={{ width: 16, height: 16, color: iconColor }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", flex: 1 }}>{title}</span>
    {count !== undefined && <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3C0" }}>{count}</span>}
  </div>
);

/* ── Detail row helper ── */
const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center" style={{ gap: 6 }}>
    <Icon style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3C0", minWidth: 60 }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: "#1A1A2E" }}>{value}</span>
  </div>
);
