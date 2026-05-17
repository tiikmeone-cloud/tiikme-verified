import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProfileSubtitle } from "@/lib/profileUtils";
import { storageImageUrl } from "@/lib/imageTransform";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  Building2, MapPin, Globe, Users, Heart, Briefcase, Shield, Calendar,
  Share2, Settings, Award, FileText, ExternalLink, Plus, MessageCircle,
  Star, Rocket, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OrgVerificationRouting from "@/components/verification/OrgVerificationRouting";
import { isCreatorOrg } from "@/lib/orgTypes";
import { PageSEO, orgSEO } from "@/hooks/usePageSEO";

const AVATAR_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const daysAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "1d ago" : `${diff}d ago`;
};

function getTimeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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
  const [showUnfollow, setShowUnfollow] = useState(false);

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
      setShowUnfollow(false);
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setIsFollowing(true); setFollowerCount(p => p + 1);
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

  const activeOpps = useMemo(() => opps.filter(o => o.is_open), [opps]);
  const typeLabel = org?.type?.charAt(0).toUpperCase() + org?.type?.slice(1).replace(/_/g, " ");
  const isCreator = isCreatorOrg(org?.type, org?.subtype);
  const followLabel = isCreator
    ? (isFollowing ? "Subscribed" : "Subscribe")
    : (isFollowing ? "Following"  : "Follow");
  const followerLabel = isCreator ? "Subscribers" : "Followers";
  const teamSizeLabel = isCreator ? "Subscribers" : "Team Size";

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

  const getLikeCount = (p: any) => {
    if (Array.isArray(p.post_reactions) && p.post_reactions.length > 0) return p.post_reactions[0]?.count || 0;
    return 0;
  };
  const getCommentCount = (p: any) => {
    if (Array.isArray(p.post_comments) && p.post_comments.length > 0) return p.post_comments[0]?.count || 0;
    return p.comment_count || 0;
  };

  /* Info cards data */
  const infoCards: { label: string; value: string }[] = [];
  if (org.type) infoCards.push({ label: "Type", value: `${typeLabel}${org.subtype ? ` · ${org.subtype}` : ""}` });
  if (org.founded_year) infoCards.push({ label: "Established", value: String(org.founded_year) });
  if (org.city || org.state) infoCards.push({ label: "Headquarters", value: [org.city, org.state].filter(Boolean).join(", ") });
  if (org.employee_count) infoCards.push({ label: teamSizeLabel, value: org.employee_count });
  if (org.website_url) infoCards.push({ label: "Website", value: org.website_url.replace(/https?:\/\//, "") });

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
    member_count: org.member_count,
  });

  return (
    <div className="min-h-screen pb-8">
      <PageSEO {...seoProps} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>

        {/* ── PROFILE INFO CARD (matching user profile style) ── */}
        <div className="glass-card" style={{
          padding: 20, borderRadius: 16,
          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.40)",
          boxShadow: "0 8px 32px rgba(26,26,78,0.08), inset 0 1px 0 rgba(255,255,255,0.60)",
        }}>
          <div className="flex" style={{ gap: 16, alignItems: "flex-start" }}>
            {/* Logo */}
            <div className="shrink-0">
              <AvatarSquare src={org.logo_url ? storageImageUrl(org.logo_url, "thumbnail") : undefined} name={org.name} size="profile" bgColor={hashColor(org.id)} className="shadow-md" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Row 1: Name + verified */}
              <div className="flex items-center" style={{ gap: 6 }}>
                <p style={{ fontSize: 20, fontWeight: 700, lineHeight: "28px", color: "#1A1A2E", wordBreak: "break-word" }} className="line-clamp-2">{org.name}</p>
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

              {/* Row 3: @slug + location */}
              <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3C0" }}>@{org.slug}</span>
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
              <div className="flex items-center flex-wrap" style={{ gap: 16, marginTop: 4 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{followerCount}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>{followerLabel}</span>
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{members.length}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>Members</span>
                </div>
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

                {org.allow_messages && org.created_by && (
                  <button type="button" onClick={() => navigate(`/app/pings?to=${org.created_by}`)} className="cursor-pointer" style={{
                    height: 32, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)",
                    color: "#1A1A2E", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <MessageCircle style={{ width: 13, height: 13 }} /> Message
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

        {/* ── COMPANY INFO CARDS ── */}
        {infoCards.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
            {infoCards.map((card, i) => (
              <div key={i} className="glass-card" style={{
                padding: "10px 16px", borderRadius: 12, flex: "1 1 140px", minWidth: 140,
                background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.40)",
                boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</p>
                <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginTop: 2 }}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── ADMIN: VERIFICATION ROUTING ── */}
        {isAdmin && (
          <div className="glass-card" style={{
            padding: 16, borderRadius: 16, marginTop: 12,
            background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.40)",
            boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
          }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>Verification Routing</p>
              <button type="button" onClick={() => navigate("/app/verification-inbox")} className="cursor-pointer text-[12px] font-semibold" style={{ color: "#E8733A" }}>
                Open inbox →
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#6B7094", marginBottom: 10 }}>Choose which admin handles verification requests for each department.</p>
            <OrgVerificationRouting orgId={org.id} />
          </div>
        )}

        {/* ── ABOUT ── */}
        <div className="glass-card" style={{
          padding: 16, borderRadius: 16, marginTop: 12,
          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.40)",
          boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>About</p>
          {org.description ? (
            <p style={{ fontSize: 13, fontWeight: 400, color: "#6B7094", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{org.description}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#9CA3C0" }}>No description added yet.</p>
          )}
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
        </div>

        {/* ── SECTION GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]" style={{ marginTop: 12, gap: 12 }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Followers card */}
            <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.02em" }}>{followerLabel}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#1A1A2E", margin: "4px 0", lineHeight: "36px", letterSpacing: "-0.02em" }}>{followerCount}</p>
            </div>

            {/* Quick details */}
            <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {org.email && <DetailRow icon={Globe} label="Email" value={org.email} />}
                {org.phone && <DetailRow icon={Globe} label="Phone" value={org.phone} />}
                {org.founded_year && <DetailRow icon={Calendar} label="Founded" value={String(org.founded_year)} />}
                {org.website_url && (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center" style={{ gap: 6, fontSize: 12, color: "#E8733A" }}>
                    <Globe style={{ width: 13, height: 13 }} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Members section */}
            <SectionBox title="Members" icon={Users} iconColor="#4A90D9" borderColor="#4A90D9" count={members.length}>
              {members.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3C0", padding: "4px 0" }}>No members yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {members.slice(0, 6).map(m => (
                    <Link key={m.id} to={`/app/profile/${m.user_id}`} className="flex items-center" style={{ gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <AvatarSquare src={m.profile?.avatar_url} name={m.profile?.full_name || "Member"} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="line-clamp-2 break-words" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{m.profile?.full_name || "Member"}</p>
                        <p className="truncate" style={{ fontSize: 11, color: "#9CA3C0" }}>{getProfileSubtitle(m.profile) || m.title || m.role || ''}{m.department ? ` · ${m.department}` : ""}</p>
                      </div>
                      {m.is_verified && (
                        <div className="flex items-center justify-center shrink-0" style={{ width: 18, height: 18, borderRadius: 9, background: "#FFB800" }}>
                          <Shield className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </Link>
                  ))}
                  {members.length > 6 && (
                    <p style={{ fontSize: 12, color: "#E8733A", marginTop: 4 }}>+{members.length - 6} more members</p>
                  )}
                </div>
              )}
            </SectionBox>

            {/* Opportunities section */}
            <SectionBox title="Opportunities" icon={Briefcase} iconColor="#34C759" borderColor="#34C759" count={activeOpps.length}>
              {opps.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3C0", padding: "4px 0" }}>No opportunities posted</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {opps.slice(0, 5).map((o, idx) => (
                    <div key={o.id} onClick={() => navigate("/app/opportunities")} className="cursor-pointer" style={{
                      padding: "8px 0",
                      borderBottom: idx < Math.min(opps.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    }}>
                      <div className="flex items-start justify-between">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{o.title}</p>
                          <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(74,144,217,0.1)", color: "#4A90D9" }}>
                              {(o.type || "job").replace(/[-_]/g, " ")}
                            </span>
                            {o.location && <span style={{ fontSize: 11, color: "#9CA3C0" }}>{o.location}</span>}
                            {o.is_remote && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(52,199,89,0.1)", color: "#34C759" }}>Remote</span>}
                          </div>
                          {o.compensation && <p style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", marginTop: 3 }}>{o.compensation}</p>}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, flexShrink: 0,
                          background: o.is_open ? "rgba(52,199,89,0.1)" : "rgba(156,163,175,0.1)",
                          color: o.is_open ? "#34C759" : "#9CA3C0",
                        }}>
                          {o.is_open ? "Active" : "Closed"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {opps.length > 5 && (
                    <Link to="/app/opportunities" style={{ fontSize: 12, color: "#E8733A", marginTop: 4, display: "block" }}>See all opportunities →</Link>
                  )}
                </div>
              )}
            </SectionBox>

            {/* Posts section */}
            <SectionBox title="Posts" icon={MessageCircle} iconColor="#E8733A" borderColor="#E8733A" count={posts.length}>
              {posts.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3C0", padding: "4px 0" }}>No posts yet</p>
              ) : (
                <>
                  {posts.slice(0, 5).map((p, idx) => (
                    <Link key={p.id} to={`/app/post/${p.id}`} className="block" style={{
                      padding: "8px 0",
                      borderBottom: idx < Math.min(posts.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
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
                          <Star style={{ width: 12, height: 12, color: "#FF6B9D" }} /> <span className="num">{getLikeCount(p)}</span>
                        </span>
                        <span className="flex items-center" style={{ gap: 3, fontSize: 12, color: "#9CA3C0" }}>
                          <MessageCircle style={{ width: 12, height: 12 }} /> <span className="num">{getCommentCount(p)}</span>
                        </span>
                        <span className="flex items-center" style={{ gap: 3, fontSize: 12, color: "#9CA3C0" }}>
                          <Rocket style={{ width: 12, height: 12 }} /> <span className="num">{p.repost_count || 0}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "#9CA3C0", marginLeft: "auto" }}>
                          {p.created_at ? getTimeAgo(new Date(p.created_at)) : ""}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {posts.length > 5 && (
                    <Link to="/app/feed" style={{ fontSize: 12, color: "#E8733A", marginTop: 4, display: "block" }}>See all posts →</Link>
                  )}
                </>
              )}
            </SectionBox>

            {/* Community circles section */}
            <SectionBox
              title="Community"
              icon={Users}
              iconColor="#0E7490"
              borderColor="#0E7490"
              count={communityCircles.length}
              action={isAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate(`/app/circles/create?org=${org.id}`)}
                  className="cursor-pointer"
                  style={{
                    height: 26, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: "rgba(14,116,144,0.10)", color: "#0E7490", border: "1px solid rgba(14,116,144,0.20)",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Plus style={{ width: 11, height: 11 }} /> New Community Circle
                </button>
              ) : null}
            >
              {communityCircles.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3C0", padding: "4px 0" }}>
                  {isAdmin ? "Create a circle so your followers can talk to each other." : "No community circles yet."}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {communityCircles.map((c, idx) => (
                    <Link
                      key={c.id}
                      to={`/app/circles/${c.slug}`}
                      className="flex items-center"
                      style={{
                        gap: 10, padding: "8px 0",
                        borderBottom: idx < communityCircles.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-center shrink-0" style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(14,116,144,0.10)", fontSize: 18,
                      }}>
                        {c.icon_url || "💬"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3C0" }}>
                          <span className="num">{c.member_count || 0}</span> member{(c.member_count || 0) === 1 ? "" : "s"}
                          {c.active_7d ? <> · <span className="num">{c.active_7d}</span> active this week</> : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionBox>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Section Box (matches user profile style) ── */
const SectionBox = ({ title, icon: Icon, iconColor, borderColor, count, action, children }: {
  title: string; icon: any; iconColor: string; borderColor: string; count?: number; action?: React.ReactNode; children: React.ReactNode;
}) => (
  <div className="glass-card" style={{
    padding: 16, borderRadius: 16,
    borderLeft: `3px solid ${borderColor}`,
    background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
    border: `1px solid rgba(255,255,255,0.40)`,
    borderLeftColor: borderColor, borderLeftWidth: 3,
    boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
  }}>
    <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
      <Icon style={{ width: 16, height: 16, color: iconColor }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", flex: 1 }}>{title}</span>
      {count !== undefined && <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3C0" }}>{count}</span>}
      {action}
    </div>
    {children}
  </div>
);

/* ── Detail row helper ── */
const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center" style={{ gap: 6 }}>
    <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3C0", minWidth: 60 }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: "#1A1A2E" }}>{value}</span>
  </div>
);
