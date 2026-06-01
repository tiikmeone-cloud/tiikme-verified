import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  MapPin, Globe, Users, Briefcase, Shield, Calendar,
  ExternalLink, Plus, Building2, Share2, Settings, Link2,
  BarChart2, Bookmark, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OrgVerificationRouting from "@/components/verification/OrgVerificationRouting";
import { PageSEO, orgSEO } from "@/hooks/usePageSEO";
import { CompanyBrain } from "@/components/org/CompanyBrain";
import OrgIdentityCard from "@/components/profile/clay/OrgIdentityCard";
import ClayNavBar from "@/components/profile/clay/ClayNavBar";

const normalizeWebsiteUrl = (url?: string | null) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
const stripWebsiteProtocol = (url?: string | null) =>
  (url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");

function SectionBox({
  title, accentColor = "#E8733A", onAdd, isAdmin, children,
}: {
  title: string;
  accentColor?: string;
  onAdd?: () => void;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="clay-card mb-3" style={{ padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.25px" }}>{title}</h2>
        {isAdmin && onAdd && (
          <button type="button" onClick={onAdd} className="clay-btn" style={{ width: 30, height: 30, borderRadius: 10, color: accentColor }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function OrgDashboard({ followerCount, openRoles, memberCount }: { followerCount: number; openRoles: number; memberCount: number }) {
  const tiles = [
    { label: "Followers", value: followerCount, color: "#E8733A" },
    { label: "Open Roles", value: openRoles, color: "#34C759" },
    { label: "Members", value: memberCount, color: "#0369A1" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
      {tiles.map(t => (
        <div key={t.label} className="clay-card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: t.color, display: "block", lineHeight: 1 }}>
            {(t.value || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 500, letterSpacing: "0.02em", marginTop: 4, display: "block" }}>
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
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
  const [squadCount, setSquadCount] = useState(0);

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
        supabase.from("opportunities").select("id, title, type, location, is_remote, is_open, compensation, created_at")
          .eq("org_id", data.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select("id, content, image_urls, created_at, post_reactions(count), post_comments(count)")
          .eq("posted_by_org", data.id).order("created_at", { ascending: false }).limit(6),
      ]);

      if (membersRes.status === "fulfilled") setMembers((membersRes.value as any).data || []);
      if (oppsRes.status === "fulfilled") setOpps((oppsRes.value as any).data || []);
      if (postsRes.status === "fulfilled") setPosts((postsRes.value as any).data || []);

      // Squad/cosign count from squad_edges
      try {
        const { count } = await (supabase.from("squad_edges" as any)
          .select("id", { count: "exact", head: true })
          .eq("org_id", data.id)
          .eq("status", "confirmed") as any);
        setSquadCount(count || 0);
      } catch {}

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
      const name = org.name || "this organization";
      toast(`Unfollow ${name}?`, {
        action: {
          label: "Unfollow",
          onClick: async () => {
            if (isInstitution && viewerOrgId) {
              await supabase.from("org_follows" as any).delete().eq("follower_org_id", viewerOrgId).eq("following_org_id", org.id);
            } else {
              await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
            }
            setIsFollowing(false);
            setFollowerCount(p => Math.max(0, p - 1));
            toast.success(`Unfollowed ${name}`);
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
        duration: 5000,
      });
    } else {
      if (isInstitution && viewerOrgId) {
        await supabase.from("org_follows" as any).insert({ follower_org_id: viewerOrgId, following_org_id: org.id });
        if (org.created_by) {
          sendNotification({ userId: org.created_by, actorId: user.id, type: "follow", title: `An organization started following ${org.name}`, actionUrl: `/org/${org.slug}` });
        }
      } else {
        await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
        if (org.created_by) {
          sendNotification({ userId: org.created_by, actorId: user.id, type: "follow", title: `${profile?.full_name || "Someone"} started following ${org.name}`, actionUrl: `/org/${org.slug}` });
        }
      }
      setIsFollowing(true);
      setFollowerCount(p => p + 1);
    }
  };

  const activeOpps = useMemo(() => opps.filter(o => o.is_open !== false), [opps]);
  const oneWordType = org?.subtype || org?.industry || org?.type || "";
  const websiteUrl = normalizeWebsiteUrl(org?.website_url);
  const websiteLabel = stripWebsiteProtocol(org?.website_url);

  if (loading) return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <div className="animate-pulse space-y-3">
          <div className="clay-card" style={{ height: 200, borderRadius: 28 }} />
          <div className="clay-card" style={{ height: 80, borderRadius: 24 }} />
          <div className="clay-card" style={{ height: 120, borderRadius: 24 }} />
        </div>
      </div>
    </div>
  );

  if (!org) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Building2 style={{ width: 48, height: 48, color: "#9CA3C0", marginBottom: 12 }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Organisation not found</p>
      <p style={{ fontSize: 13, color: "#9CA3C0", marginTop: 4 }}>No organisation matches "{slug}"</p>
      <button type="button" onClick={() => navigate(-1)} className="cursor-pointer" style={{ fontSize: 13, marginTop: 12, color: "#E8733A", background: "none", border: "none" }}>Go back</button>
    </div>
  );

  const seoProps = orgSEO({
    name: org.name,
    tagline: org.tagline,
    about: org.about,
    logo_url: org.logo_url,
    city: org.city,
    state: org.state,
    page_type: org.type,
    slug: org.slug,
    member_count: members.length,
  });

  return (
    <div className="min-h-screen pb-24">
      <PageSEO {...seoProps} />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: 720 }}>
        {/* Identity card */}
        <OrgIdentityCard
          org={org}
          followerCount={followerCount}
          memberCount={members.length}
          openRolesCount={activeOpps.length}
          isAdmin={isAdmin}
          isFollowing={isFollowing}
          onToggleFollow={toggleFollow}
          oneWordType={oneWordType}
          websiteLabel={websiteLabel}
          websiteUrl={websiteUrl}
        />

        {/* Admin dashboard row */}
        {isAdmin && (
          <OrgDashboard
            followerCount={followerCount}
            openRoles={activeOpps.length}
            memberCount={members.length}
          />
        )}

        {/* Main content + sticky nav */}
        <div className="profile-page-layout">
          <div className="profile-main-col">

            {/* The Story */}
            {(org.description || org.tagline || org.about || isAdmin) && (
              <SectionBox title="The Story">
                {org.description || org.tagline || org.about ? (
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-2)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {org.description || org.about || org.tagline}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>
                    No description yet — add one in Settings.
                  </p>
                )}
              </SectionBox>
            )}

            {/* Open Roles */}
            {(activeOpps.length > 0 || isAdmin) && (
              <SectionBox
                title={`Open Roles${activeOpps.length > 0 ? ` · ${activeOpps.length}` : ""}`}
                accentColor="#34C759"
                isAdmin={isAdmin}
                onAdd={() => navigate("/app/opportunities/create")}
              >
                {activeOpps.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>No open roles right now.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {activeOpps.map((o: any) => (
                      <div
                        key={o.id}
                        onClick={() => navigate("/app/opportunities")}
                        className="cursor-pointer"
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                          borderRadius: 14, background: "rgba(52,199,89,0.05)",
                          border: "1px solid rgba(52,199,89,0.15)", transition: "background 0.15s",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{o.title}</p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                            {o.type && (
                              <span className="clay-pill" style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "rgba(232,115,58,0.10)", color: "#E8733A" }}>
                                {(o.type || "job").replace(/[-_]/g, " ")}
                              </span>
                            )}
                            {o.location && <span style={{ fontSize: 11, color: "#9CA3C0" }}>{o.location}</span>}
                            {o.is_remote && (
                              <span className="clay-pill" style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "rgba(52,199,89,0.10)", color: "#34C759" }}>Remote</span>
                            )}
                          </div>
                          {o.compensation && (
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", marginTop: 4 }}>{o.compensation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionBox>
            )}

            {/* The Squad — verified employees */}
            <SectionBox title="The Squad">
              {members.filter((m: any) => m.is_verified && m.approval_status === "approved").length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>
                  No verified employees yet. Employees add this org to their profile experience to appear here.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {members.filter((m: any) => m.is_verified && m.approval_status === "approved").map((m: any) => (
                    <Link key={m.id} to={`/app/profile/${m.user_id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <AvatarSquare src={m.profile?.avatar_url} name={m.profile?.full_name || "?"} size={44} />
                        <span style={{ fontSize: 10, color: "var(--text-2)", fontWeight: 500, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.profile?.full_name?.split(" ")[0] || "Member"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionBox>

            {/* The Team — all members */}
            {members.length > 0 && (
              <SectionBox title={`The Team · ${members.length}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {members.map((m: any, idx: number) => (
                    <Link
                      key={m.id}
                      to={`/app/profile/${m.user_id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 0", textDecoration: "none",
                        borderBottom: idx < members.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      <AvatarSquare src={m.profile?.avatar_url} name={m.profile?.full_name || "Member"} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.profile?.full_name || "Member"}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3C0" }}>
                          {m.title || m.role}{m.department ? ` · ${m.department}` : ""}
                        </p>
                      </div>
                      {m.is_verified && m.approval_status === "approved" && (
                        <span className="clay-pill" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "rgba(255,184,0,0.15)", color: "#B77900", flexShrink: 0 }}>
                          Verified
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </SectionBox>
            )}

            {/* Drops — org posts */}
            {posts.length > 0 && (
              <SectionBox title={`Drops · ${posts.length}`}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {posts.map((p: any) => (
                    <Link key={p.id} to={`/app/post/${p.id}`} style={{ textDecoration: "none" }}>
                      {p.image_urls && p.image_urls.length > 0 ? (
                        <img
                          src={p.image_urls[0]}
                          alt=""
                          loading="lazy"
                          style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12 }}
                        />
                      ) : (
                        <div style={{
                          width: "100%", aspectRatio: "4/3", borderRadius: 12,
                          background: "rgba(232,115,58,0.08)", display: "flex",
                          alignItems: "flex-start", padding: "8px",
                        }}>
                          <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4 as any, overflow: "hidden" }}>
                            {p.content}
                          </p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </SectionBox>
            )}

            {/* Location + Links */}
            {(org.city || org.state || org.full_address || websiteUrl || (org.social_links && Object.keys(org.social_links).length > 0) || org.founded_year) && (
              <SectionBox title="Details">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(org.city || org.state) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{[org.city, org.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {org.founded_year && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>Founded {org.founded_year}</span>
                    </div>
                  )}
                  {org.employee_count && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Users style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{org.employee_count} employees</span>
                    </div>
                  )}
                  {websiteUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Globe style={{ width: 13, height: 13, color: "#9CA3C0", flexShrink: 0 }} />
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#E8733A", display: "flex", alignItems: "center", gap: 3 }}>
                        {websiteLabel || "Visit website"}
                        <ExternalLink style={{ width: 10, height: 10 }} />
                      </a>
                    </div>
                  )}
                  {org.social_links && Object.keys(org.social_links).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {Object.entries(org.social_links as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                        <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="clay-pill" style={{ fontSize: 11, padding: "4px 10px", color: "#E8733A", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Link2 style={{ width: 10, height: 10 }} /> {k}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </SectionBox>
            )}

            {/* Company Brain — admin only */}
            {isAdmin && (
              <SectionBox title="Company Brain" isAdmin={isAdmin}>
                <CompanyBrain orgId={org.id} orgName={org.name} isAdmin={isAdmin} />
              </SectionBox>
            )}

          </div>

          {/* Sticky side nav */}
          <nav className="profile-clay-nav" aria-label="Org actions">
            {isAdmin ? (
              <>
                <Link to="/app/workspace" className="clay-btn" title="Settings" aria-label="Settings" style={{ width: 48, height: 48 }}>
                  <Settings style={{ width: 18, height: 18, color: "var(--text-2)" }} strokeWidth={1.8} />
                </Link>
                <Link to="/app/opportunities/create" className="clay-btn" title="Post a Job" aria-label="Post a Job" style={{ width: 48, height: 48 }}>
                  <Briefcase style={{ width: 18, height: 18, color: "var(--text-2)" }} strokeWidth={1.8} />
                </Link>
                <Link to="/app/workspace?tab=analytics" className="clay-btn" title="Analytics" aria-label="Analytics" style={{ width: 48, height: 48 }}>
                  <BarChart2 style={{ width: 18, height: 18, color: "var(--text-2)" }} strokeWidth={1.8} />
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="clay-btn"
                  title="Share"
                  aria-label="Share"
                  style={{ width: 48, height: 48 }}
                  onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); toast.success("Link copied!"); }}
                >
                  <Share2 style={{ width: 18, height: 18, color: "var(--text-2)" }} strokeWidth={1.8} />
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
