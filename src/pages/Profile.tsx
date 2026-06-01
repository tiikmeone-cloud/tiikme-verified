import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { fixStorageUrl } from "@/components/ui/AvatarSquare";
import { cleanUsername } from "@/lib/cleanUsername";
import { getPrimaryRoleLine, sanitizeIdentityText } from "@/lib/profileUtils";
import { getDisplayFlags, safeDisplayName } from "@/utils/displayProfile";
import { PageSEO, profileSEO } from "@/hooks/usePageSEO";
import {
  Shield, X, CheckCircle, Plus,
  Pencil, Trash2, Briefcase, GraduationCap, Award, Code2, Eye, EyeOff,
  Users, Settings, Layers, Rocket,
} from "lucide-react";
import GlassModal, { glassInputDarkStyle as gInputStyle, glassSelectDarkStyle as gSelectStyle, glassTextareaDarkStyle as gTextareaStyle, labelStyle } from "@/components/ui/GlassModal";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
import { sendNotification } from "@/lib/notify";
import VerifiedBadge from "@/components/VerifiedBadge";
import ProfileAnalyticsRow from "@/components/profile/ProfileAnalyticsRow";
import { track } from "@/lib/track";
import { getActivityTier } from "@/lib/algorithms";
import { applyPrivacyToProfile } from "@/lib/applyPrivacy";
import { FollowIconButton } from "@/components/FollowIconButton";
import IdentityCard from "@/components/profile/clay/IdentityCard";
import ClayNavBar from "@/components/profile/clay/ClayNavBar";
import {
  DashboardTiles, TheStory, TheGrind, TheClass,
  TheToolkit, TheWins, CertsSection, DropsSection,
  ReelsSection, CreatorSection,
} from "@/components/profile/clay/Sections";

/* ── Constants ── */
const ROLE_COLOR_MAP: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E", builder: "#7C3AED", aspirant: "#374151" };
const allIndianStates = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const years = Array.from({ length: 67 }, (_, i) => String(2026 - i));

const formatDuration = (start: string | null, end: string | null, isCurrent: boolean) => {
  const fmt = (d: string) => { const dt = new Date(d); return `${months[dt.getMonth()]} ${dt.getFullYear()}`; };
  if (!start) return "";
  const s = new Date(start);
  const e = isCurrent ? new Date() : end ? new Date(end) : null;
  if (!e) return fmt(start);
  let mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (mo < 0) mo = 0;
  const yrs = Math.floor(mo / 12); const mos = mo % 12;
  const parts: string[] = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
  if (mos > 0) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
  return `${fmt(start)} – ${isCurrent ? "Present" : end ? fmt(end) : ""} · ${parts.join(" ") || "< 1 mo"}`;
};

/* Edit Profile drawer removed — editing happens inline (per-section pencils) and via /app/settings/profile. */

/* ═══════════ ABOUT SECTION ═══════════ */
const AboutSection = ({ about, isOwnProfile, userId }: { about: string; isOwnProfile: boolean; userId: string }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(about || "");
  const [savedText, setSavedText] = useState(about || "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setText(about || ""); setSavedText(about || ""); }, [about]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ about: text.slice(0, 500) } as any).eq("id", userId);
    setSaving(false);
    setSavedText(text.slice(0, 500));
    setEditing(false);
    toast.success("About updated");
  };

  const displayText = savedText;
  const lines = displayText.split("\n");
  const needsTruncate = lines.length > 4 || displayText.length > 280;
  const showFull = expanded || !needsTruncate;

  return (
    <div className="glass-card p-3 md:p-4 mt-2 md:mt-3" style={{ borderRadius: 16 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", flex: 1 }}>About</span>
        {isOwnProfile && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="cursor-pointer p-1" style={{ color: "#9CA3C0" }}>
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 500))}
            rows={4}
            maxLength={500}
            className="w-full outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A2E", lineHeight: "20px" }}
            autoFocus
          />
          <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#9CA3C0" }}>{text.length}/500</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(false); setText(about || ""); }} className="cursor-pointer" style={{ fontSize: 12, color: "#9CA3C0", background: "none", border: "none" }}>Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", background: "none", border: "none" }}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {displayText ? (
            <>
              <p style={{
                fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#1A1A2E",
                ...(showFull ? {} : { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
              }}>
                {displayText}
              </p>
              {needsTruncate && (
                <button type="button" onClick={() => setExpanded(!expanded)} className="cursor-pointer" style={{ fontSize: 13, fontWeight: 500, color: "#E8733A", background: "none", border: "none", padding: 0, marginTop: 4 }}>
                  {expanded ? "See less" : "See more"}
                </button>
              )}
            </>
          ) : (
            isOwnProfile ? (
              <button type="button" onClick={() => setEditing(true)}
                className="flex items-center gap-2 cursor-pointer w-full text-left"
                style={{ background: "rgba(232,115,58,0.04)", border: "1px dashed rgba(232,115,58,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
                <Pencil style={{ width: 14, height: 14, color: "#E8733A", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#E8733A", fontWeight: 500 }}>Tell your story — add a bio</span>
              </button>
            ) : (
              <p style={{ fontSize: 13, fontWeight: 400, color: "#9CA3C0", fontStyle: "italic" }}>No about section</p>
            )
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════ CONTACT SECTION ═══════════ */
const ContactSection = ({ isOwnProfile, profile, userEmail }: { isOwnProfile: boolean; profile: any; userEmail: string | null }) => {
  // Use normalized privacy settings (set by applyPrivacyToProfile, or raw for own profile)
  const showEmail = !!(profile?.privacy?.show_email ?? (profile?.privacy_settings as any)?.show_email ?? false);

  // For other people's profiles: hide entire section if show_email is off (email will also be null after applyPrivacy)
  if (!isOwnProfile && !showEmail) return null;

  const emailToShow = isOwnProfile ? userEmail : profile?.email;

  return (
    <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", display: "block", marginBottom: 8 }}>Contact</span>
      {showEmail && emailToShow ? (
        <div className="flex items-center" style={{ gap: 6 }}>
          <Mail style={{ width: 14, height: 14, color: "#E8733A", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#E8733A" }}>{emailToShow}</span>
        </div>
      ) : isOwnProfile ? (
        <p style={{ fontSize: 12, color: "#9CA3C0" }}>
          Email hidden.{" "}
          <a href="/app/settings?tab=privacy" style={{ color: "#E8733A", fontWeight: 500 }}>Enable in Settings →</a>
        </p>
      ) : null}
    </div>
  );
};

/* ═══════════ MAIN PROFILE ═══════════ */
const Profile = () => {
  const { id: urlUserId } = useParams<{ id: string }>();
  const { profile: authProfile, initials: authInitials, displayName: authDisplayName, refreshProfile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !urlUserId || urlUserId === user?.id;

  useEffect(() => {
    if (isOwnProfile && authProfile?.account_type === "institution" && authProfile?.org_id) {
      supabase.from("organizations").select("slug").eq("id", authProfile.org_id).maybeSingle()
        .then(({ data }) => { if (data?.slug) navigate(`/org/${data.slug}`, { replace: true }); });
    }
  }, [isOwnProfile, authProfile?.account_type, authProfile?.org_id, navigate]);

  
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });
  const [connectedAvatars, setConnectedAvatars] = useState<any[]>([]);
  const [mutualConnections, setMutualConnections] = useState<{ profiles: any[]; total: number }>({ profiles: [], total: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [modalSection, setModalSection] = useState<string | null>(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const [expForm, setExpForm] = useState({ company: "", title: "", type: "Full-time", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", branch: "", startYear: "", endYear: "", isCurrent: false, grade: "" });
  const [projForm, setProjForm] = useState({ title: "", org: "", description: "", techStack: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false });
  const [achForm, setAchForm] = useState({ title: "", issuedBy: "", dateMonth: "", dateYear: "", description: "", url: "" });
  const [profileRoles, setProfileRoles] = useState<any[]>([]);
  const [roleForm, setRoleForm] = useState({ roleType: "Side Hustle", title: "", description: "" });
  const [creatorChannels, setCreatorChannels] = useState<any[]>([]);
  const [gigServices, setGigServices] = useState<any[]>([]);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [coSignsCount, setCoSignsCount] = useState(0);
  const [squadsCount, setSquadsCount] = useState(0);

  const [connectionStatus, setConnectionStatus] = useState<{ status: string | null; direction: string | null; id: string | null }>({ status: null, direction: null, id: null });
  const [connectLoading, setConnectLoading] = useState(false);
  const [orgFollowingUser, setOrgFollowingUser] = useState(false); // org admin viewing user profile
  const [orgsFollowingMe, setOrgsFollowingMe] = useState<Array<{ org_id: string; org: { name: string; logo_url: string | null; slug: string } }>>([]);

  const targetUserId = isOwnProfile ? user?.id : urlUserId;

  // Get user email
  useEffect(() => {
    if (!isOwnProfile) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [isOwnProfile]);

  const loadProfile = useCallback(async () => {
    if (!targetUserId) { setDataLoading(false); return; }
    setDataLoading(true);
    const [profileRes, itemsRes, strandCountRes, postsRes, achvsRes, certsRes, connAvatarsRes] = await Promise.allSettled([
      isOwnProfile ? Promise.resolve({ data: authProfile }) : supabase.from("profiles").select("id, full_name, username, role, role_subtype, headline, bio, avatar_url, institution_name, location_city, location_state, activity_score, is_public, custom_links, open_to_work, otw_visibility, designation, sector, languages, department, is_verified, role_metadata, about_qa, verification_badge_text, verification_type, created_at, account_type, org_id, skills, display_preference, profession_type, currently_working_at, privacy").eq("id", targetUserId).maybeSingle(),
      supabase.from("work_items").select("id, title, job_title, description, company_name, institution_name, item_type, employment_type, work_location, start_date, end_date, start_month, start_year, end_month, end_year, is_current, status, visibility, verification_status, verified_by_user, verified_at, is_tiik_approved, created_at, owner_id, skills_used, tech_stack, degree_type, field_of_study, institution_name_edu, grade_score, role_in_work, tech_stack").eq("owner_id", targetUserId).order("is_current", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("strands").select("id", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("id, author_id, posted_by_user_id, posted_by_org, content, type, image_urls, comment_count, repost_count, reactions, is_edited, repost_of, created_at, updated_at, post_reactions(count), post_comments(count)", { count: "exact" }).eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(10),
      supabase.from("achievements").select("id, title, type, description, icon_emoji, achievement_date, issued_by, certificate_url, certificate_file_url, source_type, source_workspace_name, visibility, created_at, user_id").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      supabase.from("certificates").select("id, title, description, issued_date, expiry_date, certificate_url, is_verified, issued_by, issued_to, org_id, created_at, org:organizations(name, logo_url)").eq("issued_to", targetUserId).order("created_at", { ascending: false }),
      supabase.from("strands").select("requester_id, receiver_id").or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted").limit(6),
    ]);

    const profile = profileRes.status === "fulfilled" ? (profileRes.value as any).data : null;
    setViewedProfile(profile || (isOwnProfile ? authProfile : null));
    setWorkItems(itemsRes.status === "fulfilled" ? (itemsRes.value as any).data || [] : []);
    setUserPosts(postsRes.status === "fulfilled" ? (postsRes.value as any).data || [] : []);
    setAchievements(achvsRes.status === "fulfilled" ? (achvsRes.value as any).data || [] : []);
    setCertifications(certsRes.status === "fulfilled" ? (certsRes.value as any).data || [] : []);
    const strandCount = strandCountRes.status === "fulfilled" ? (strandCountRes.value as any).count || 0 : 0;
    const postsCount = postsRes.status === "fulfilled" ? (postsRes.value as any).count || 0 : 0;
    setStats({ connections: strandCount, posts: postsCount });

    if (connAvatarsRes.status === "fulfilled") {
      const strands = (connAvatarsRes.value as any).data || [];
      const otherIds = strands.map((s: any) => s.requester_id === targetUserId ? s.receiver_id : s.requester_id).filter(Boolean);
      if (otherIds.length > 0) {
        const { data: avatars } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds.slice(0, 6));
        setConnectedAvatars(avatars || []);
      }
    }

    // Load profile roles (parallel with avatar fetch above — already awaited)
    supabase.from("profile_roles").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false })
      .then(({ data: rolesData }) => setProfileRoles(rolesData || []));

    // Load role-specific sections
    supabase.from("creator_channels" as any).select("*").eq("user_id", targetUserId).order("created_at", { ascending: false })
      .then(({ data }) => setCreatorChannels((data as any[]) || []));
    supabase.from("gig_services" as any).select("*").eq("user_id", targetUserId).order("created_at", { ascending: false })
      .then(({ data }) => setGigServices((data as any[]) || []));

    // Load orgs that follow this user (only needed for own profile display)
    if (isOwnProfile) {
      (supabase.from("org_user_follows" as any).select("org_id, org:organizations!org_user_follows_org_id_fkey(name, logo_url, slug)").eq("user_id", targetUserId).limit(5) as any)
        .then(({ data }: { data: any }) => setOrgsFollowingMe(data || []));
    }

    // Squad counts deferred until WS4 is fully live (503s on profile load)

    setDataLoading(false);
  }, [targetUserId, isOwnProfile, authProfile]);

  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;
    supabase.from("strands").select("id, status, requester_id, receiver_id")
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .maybeSingle().then(({ data }) => {
        if (data) setConnectionStatus({ status: data.status, direction: data.requester_id === user.id ? "sent" : "received", id: data.id });
      });
    // Institution accounts: check if their org already follows this user
    if (authProfile?.account_type === "institution" && (authProfile as any)?.org_id) {
      (supabase.from("org_user_follows" as any).select("id").eq("org_id", (authProfile as any).org_id).eq("user_id", targetUserId).maybeSingle() as any)
        .then(({ data }: { data: any }) => setOrgFollowingUser(!!data));
    }
  }, [user, targetUserId, isOwnProfile, authProfile?.account_type, (authProfile as any)?.org_id]);

  // Load mutual connections when viewing someone else's profile
  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;
    let cancelled = false;
    (async () => {
      // My connection IDs
      const { data: myStrands } = await supabase.from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      if (cancelled) return;
      const myIds = new Set<string>();
      (myStrands || []).forEach((s: any) => {
        if (s.requester_id !== user.id) myIds.add(s.requester_id);
        if (s.receiver_id !== user.id) myIds.add(s.receiver_id);
      });
      if (myIds.size === 0) return;

      // Target's connection IDs
      const { data: theirStrands } = await supabase.from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
        .eq("status", "accepted");
      if (cancelled) return;
      const theirIds = new Set<string>();
      (theirStrands || []).forEach((s: any) => {
        if (s.requester_id !== targetUserId) theirIds.add(s.requester_id);
        if (s.receiver_id !== targetUserId) theirIds.add(s.receiver_id);
      });

      // Intersection (mutual connections, excluding self)
      const mutual = [...myIds].filter(id => theirIds.has(id) && id !== user.id && id !== targetUserId);
      if (mutual.length === 0) return;

      const { data: profiles } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, display_preference")
        .in("id", mutual.slice(0, 3));
      if (cancelled) return;
      setMutualConnections({ profiles: profiles || [], total: mutual.length });
    })();
    return () => { cancelled = true; };
  }, [user, targetUserId, isOwnProfile]);

  useEffect(() => { if (!authLoading) loadProfile(); }, [authLoading, loadProfile]);

  // Track profile_view when a visitor views someone's profile
  useEffect(() => {
    if (!targetUserId || isOwnProfile || dataLoading) return;
    track("profile_view", { viewed_profile_id: targetUserId, viewer_id: user?.id ?? null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, isOwnProfile, dataLoading]);

  // Hoisted above early returns to satisfy Rules of Hooks (no hooks after conditional return)
  const completenessPercent = useMemo(() => {
    const pd: any = isOwnProfile ? authProfile : viewedProfile;
    if (!pd) return 0;
    const expCount = workItems.filter((w: any) => w.item_type === "experience").length;
    const eduCount = workItems.filter((w: any) => w.item_type === "education").length;
    const pts: [number, boolean][] = [
      [15, !!pd.avatar_url],
      [15, !!pd.headline?.trim()],
      [15, !!pd.bio?.trim()],
      [20, expCount > 0],
      [10, eduCount > 0],
      [10, Array.isArray(pd.skills) && pd.skills.length > 0],
      [5,  !!(pd.location_city || pd.location_state)],
      [10, !!(pd as any).resume_url],
    ];
    return pts.reduce((sum, [w, ok]) => sum + (ok ? w : 0), 0);
  }, [isOwnProfile, authProfile, viewedProfile, workItems]);

  if (authLoading || dataLoading) return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <div className="animate-pulse space-y-3">
          <div className="glass-card" style={{ height: 140, borderRadius: 16 }} />
          <div className="glass-card" style={{ height: 80, borderRadius: 16 }} />
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3">
            <div className="glass-card" style={{ height: 120, borderRadius: 16 }} />
            <div className="glass-card" style={{ height: 120, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    </div>
  );
  if (!user && isOwnProfile) return null;

  const rawProfileData = isOwnProfile ? authProfile : viewedProfile;
  if (!rawProfileData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Profile not found</p>
      <button type="button" onClick={() => navigate("/app/explore")} className="cursor-pointer" style={{ fontSize: 13, marginTop: 8, color: "#E8733A", background: "none", border: "none" }}>Back to Explore</button>
    </div>
  );

  // Privacy — apply field-level visibility for non-owners.
  const isConnected = connectionStatus.status === "accepted";
  const profileData: any = applyPrivacyToProfile(rawProfileData, {
    id: user?.id ?? null,
    isConnection: isConnected,
    isVerified: !!authProfile?.is_verified,
  });

  const privacySettings = (rawProfileData as any).privacy_settings as any || {};
  const profileVisibility = privacySettings.profile_visibility || "public";
  const showLocation = profileData.location_city != null || profileData.location_state != null;
  const isPrivateView = !isOwnProfile && profileVisibility === "private";
  const isConnectionsOnly = !isOwnProfile && profileVisibility === "connections_only" && !isConnected;

  if (isPrivateView || isConnectionsOnly) {
    const limitedFlags = getDisplayFlags(profileData);
    const limitedName = limitedFlags.showName ? (profileData.full_name || "User") : "Tiikme member";
    const limitedInitials = limitedName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="min-h-screen" style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
        <div className="glass-card" style={{ borderRadius: 16, padding: 20, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <AvatarSquare src={profileData.avatar_url} name={limitedName} size="profile" bgColor={ROLE_COLOR_MAP[profileData.role || ""] || "#4F46E5"} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>{limitedName}</p>
          </div>
        </div>
        <div className="glass-card" style={{ borderRadius: 16, padding: 32, textAlign: "center", marginTop: 12 }}>
          <Shield style={{ width: 48, height: 48, margin: "0 auto 12px", color: "#9CA3C0" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>This profile is {isPrivateView ? "private" : "for connections only"}</p>
          <p style={{ fontSize: 13, color: "#6B7094", marginTop: 4 }}>{isPrivateView ? "Only basic info is visible." : "Connect to see their full profile."}</p>
        </div>
      </div>
    );
  }

  const dpFlags = isOwnProfile
    ? { showName: true, showRole: true, showCompany: true }
    : getDisplayFlags(profileData);
  const realName = profileData.full_name || authDisplayName || "";
  const displayName = dpFlags.showName ? realName : safeDisplayName(profileData, "Tiikme member");
  const username = cleanUsername(profileData.username || "");
  const headline = sanitizeIdentityText(profileData.headline || "");
  const city = showLocation || isOwnProfile ? (profileData.location_city || "") : "";
  const state = showLocation || isOwnProfile ? (profileData.location_state || "") : "";
  const role = profileData.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const compactRoleLine = getPrimaryRoleLine(profileData) || (role !== "professional" && role !== "working" ? roleLabel : "");
  const initials = displayName ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : authInitials || "U";
  const roleColor = ROLE_COLOR_MAP[role] || "#4F46E5";
  const isVerified = profileData.is_verified === true && (() => {
    // Verified badge auto-lapses 6 months after verified_at
    const va = (profileData as any).verified_at;
    if (!va) return true; // legacy: no timestamp → still trust until backfill catches up
    const t = new Date(va).getTime();
    if (!t) return true;
    return Date.now() - t < 183 * 24 * 60 * 60 * 1000;
  })();
  const skills: string[] = profileData.skills || [];
  const customLinks: any[] = Array.isArray(profileData.custom_links) ? profileData.custom_links : [];
  const aboutText = profileData.bio || profileData.about || "";

  const priv: any = profileData.privacy || {};
  const visFilter = (items: any[], privKey?: string) => {
    if (!isOwnProfile && privKey && priv[privKey] === false) return [];
    return isOwnProfile ? items : items.filter((w: any) => w.visibility === "public" || !w.visibility);
  };
  const experiences = visFilter(workItems.filter((w: any) => w.item_type === "experience"), "show_experience").sort((a: any, b: any) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return (b.start_year || 0) - (a.start_year || 0);
  });
  const education = visFilter(workItems.filter((w: any) => w.item_type === "education"), "show_education");
  const projects = visFilter(workItems.filter((w: any) => w.item_type === "project" || (!w.item_type && w.title)));
  const cleanProfileUsername =
    (profileData as any).clean_username ||
    profileData.username?.replace(/-[0-9a-f]{6}$/i, "") ||
    "";
  const tiikmeProfilePath = cleanProfileUsername ? `https://tiikme.com/${cleanProfileUsername}` : "";
  const normalizedTiikmeProfilePath = tiikmeProfilePath.replace(/\/+$/, "").toLowerCase();
  const tiikmeProfilePathnames = new Set(
    [
      cleanProfileUsername ? `/${cleanProfileUsername}` : "",
      cleanProfileUsername ? `/app/${cleanProfileUsername}` : "",
      isOwnProfile ? "/app/profile" : "",
      targetUserId ? `/app/profile/${targetUserId}` : "",
    ]
      .map((value) => value.trim().replace(/\/+$/, "").toLowerCase())
      .filter(Boolean),
  );
  const visibleCustomLinks = customLinks.filter((link: any) => {
    const rawUrl = typeof link?.url === "string" ? link.url.trim() : "";
    if (!rawUrl) return false;
    const normalizedUrl = rawUrl.replace(/\/+$/, "").toLowerCase();
    if (normalizedUrl === normalizedTiikmeProfilePath) return false;

    try {
      const parsedUrl = new URL(rawUrl, window.location.origin);
      const normalizedHost = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
      const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "").toLowerCase() || "/";
      const isTiikmeHost =
        normalizedHost === "tiikme.com" ||
        normalizedHost === "www.tiikme.com" ||
        normalizedHost === window.location.hostname.replace(/^www\./, "").toLowerCase();
      if (isTiikmeHost && tiikmeProfilePathnames.has(normalizedPath)) {
        return false;
      }
    } catch {
      // Ignore malformed links and let them render so the user can still edit/remove them.
    }

    return true;
  });

  const handleCopyLink = () => {
    const url = tiikmeProfilePath || `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  const handleConnect = async () => {
    if (!user || !targetUserId || connectLoading) return;
    setConnectLoading(true);
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, targetUserId, authProfile?.full_name || "Someone");
    if (result === null) { toast.info("Connection already exists"); setConnectLoading(false); return; }
    if (result === "accepted") {
      setConnectionStatus({ status: "accepted", direction: "sent", id: null });
      toast.success("Connected!");
    } else {
      setConnectionStatus({ status: "pending", direction: "sent", id: null });
      toast.success("Connection request sent");
    }
    setConnectLoading(false);
    try { await supabase.rpc("increment_score", { uid: user.id, amount: 3 }); } catch {}
  };

  const handleAcceptConnection = async () => {
    if (!connectionStatus.id) return;
    await supabase.from("strands").update({ status: "accepted" }).eq("id", connectionStatus.id);
    setConnectionStatus({ ...connectionStatus, status: "accepted" });
    if (targetUserId && user) {
      sendNotification({ userId: targetUserId, actorId: user.id, type: "connection_accepted", title: `${authProfile?.full_name || "Someone"} accepted your connection`, actionUrl: `/app/profile/${user.id}` });
    }
    toast.success("Connected!");
  };

  const handleDeclineConnection = async () => {
    if (!connectionStatus.id) return;
    await supabase.from("strands").delete().eq("id", connectionStatus.id);
    setConnectionStatus({ status: null, direction: null, id: null });
  };

  /* Map UI employment_type → DB type CHECK constraint values
     Allowed: experience, education, full_time, freelance, internship, job_role,
              part_time, research, project, volunteer, certification, achievement, other */
  const mapEmploymentToType = (employmentType: string): string => {
    switch (employmentType) {
      case "Full-time": return "job_role";
      case "Part-time": return "part_time";
      case "Internship": return "internship";
      case "Freelance": return "freelance";
      case "Contract": return "job_role";
      case "Volunteer": return "volunteer";
      default: return "experience";
    }
  };

  /* Save functions */
  const saveExperience = async () => {
    if (!expForm.company.trim()) { toast.error("Company name is required"); return; }
    if (!expForm.title.trim()) { toast.error("Job title is required"); return; }
    setSaving(true);
    try {
      // Always pull the live auth user so RLS (owner_id = auth.uid()) cannot fail on a stale ref
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        toast.error("You must be logged in to save");
        setSaving(false);
        return;
      }
      const startDate = expForm.startMonth && expForm.startYear ? `${expForm.startYear}-${String(months.indexOf(expForm.startMonth) + 1).padStart(2, "0")}-01` : null;
      const endDate = !expForm.isCurrent && expForm.endMonth && expForm.endYear ? `${expForm.endYear}-${String(months.indexOf(expForm.endMonth) + 1).padStart(2, "0")}-01` : null;
      const payload = {
        owner_id: authUser.id, // REQUIRED — RLS checks this
        title: expForm.title.trim() || expForm.company.trim() || "Untitled",
        job_title: expForm.title.trim(),
        description: expForm.description.trim(), company_name: expForm.company.trim(), institution_name: expForm.company.trim(),
        employment_type: expForm.type, type: mapEmploymentToType(expForm.type), item_type: "experience",
        work_location: expForm.city.trim() || null,
        start_month: expForm.startMonth || null, start_year: expForm.startYear ? Number(expForm.startYear) : null,
        end_month: !expForm.isCurrent ? (expForm.endMonth || null) : null, end_year: !expForm.isCurrent && expForm.endYear ? Number(expForm.endYear) : null,
        start_date: startDate, end_date: endDate, is_current: expForm.isCurrent,
        skills_used: expForm.skills ? expForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        tech_stack: expForm.skills ? expForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        status: "active", visibility: "public", verification_status: "unverified",
      };
      if (import.meta.env.DEV) console.log("[saveExperience] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload as any).select().single();
      if (error) {
        console.error("[saveExperience]", error);
        toast.error(error.message || "Save failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (data) setWorkItems(prev => [data, ...prev]);
      setModalSection(null);
      setExpForm({ company: "", title: "", type: "Full-time", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
      toast.success("Experience added");
    } catch (e: any) {
      console.error("[saveExperience] exception", e);
      toast.error(e?.message || "Network error — check your connection");
      setSaving(false);
    }
  };

  const saveEducation = async () => {
    if (!eduForm.institution.trim()) { toast.error("Institution is required"); return; }
    setSaving(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        toast.error("You must be logged in to save");
        setSaving(false);
        return;
      }
      const payload = {
        owner_id: authUser.id, // REQUIRED — RLS checks this
        title: eduForm.degree.trim() || eduForm.institution.trim() || "Untitled",
        degree_type: eduForm.degree.trim() || null, field_of_study: eduForm.branch.trim() || null,
        institution_name_edu: eduForm.institution.trim(), institution_name: eduForm.institution.trim(),
        grade_score: eduForm.grade.trim() || null, item_type: "education", type: "education",
        start_year: eduForm.startYear ? Number(eduForm.startYear) : null,
        end_year: !eduForm.isCurrent && eduForm.endYear ? Number(eduForm.endYear) : null,
        start_date: eduForm.startYear ? `${eduForm.startYear}-01-01` : null,
        end_date: !eduForm.isCurrent && eduForm.endYear ? `${eduForm.endYear}-12-31` : null,
        is_current: eduForm.isCurrent, status: "active", visibility: "public", verification_status: "unverified",
      };
      if (import.meta.env.DEV) console.log("[saveEducation] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload as any).select().single();
      if (error) {
        console.error("[saveEducation]", error);
        toast.error(error.message || "Save failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (data) setWorkItems(prev => [data, ...prev]);
      setModalSection(null);
      setEduForm({ institution: "", degree: "", branch: "", startYear: "", endYear: "", isCurrent: false, grade: "" });
      toast.success("Education added");
    } catch (e: any) {
      console.error("[saveEducation] exception", e);
      toast.error(e?.message || "Network error — check your connection");
      setSaving(false);
    }
  };

  const saveProject = async () => {
    if (!projForm.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        toast.error("You must be logged in to save");
        setSaving(false);
        return;
      }
      const payload = {
        owner_id: authUser.id, // REQUIRED — RLS checks this
        title: projForm.title.trim() || "Untitled",
        description: projForm.description.trim(),
        company_name: projForm.org.trim() || null, item_type: "project", type: "project",
        tech_stack: projForm.techStack ? projForm.techStack.split(",").map(s => s.trim()).filter(Boolean) : [],
        start_year: projForm.startYear ? Number(projForm.startYear) : null,
        end_year: !projForm.isCurrent && projForm.endYear ? Number(projForm.endYear) : null,
        is_current: projForm.isCurrent, status: "active", visibility: "public", verification_status: "unverified",
      };
      if (import.meta.env.DEV) console.log("[saveProject] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload as any).select().single();
      if (error) {
        console.error("[saveProject]", error);
        toast.error(error.message || "Save failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (data) setWorkItems(prev => [data, ...prev]);
      setModalSection(null);
      setProjForm({ title: "", org: "", description: "", techStack: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false });
      toast.success("Project added");
    } catch (e: any) {
      console.error("[saveProject] exception", e);
      toast.error(e?.message || "Network error — check your connection");
      setSaving(false);
    }
  };

  const saveAchievement = async () => {
    if (!achForm.title.trim() || !user) return;
    setSaving(true);
    try {
      const dateStr = achForm.dateYear ? `${achForm.dateYear}-${achForm.dateMonth ? String(months.indexOf(achForm.dateMonth) + 1).padStart(2, "0") : "01"}-01` : null;
      const payload = {
        user_id: user.id, title: achForm.title.trim(), issued_by: achForm.issuedBy,
        achievement_date: dateStr, description: achForm.description, certificate_url: achForm.url || null, type: "award",
      };
      if (import.meta.env.DEV) console.log("[saveAchievement] payload:", payload);
      const { data, error } = await supabase.from("achievements").insert(payload).select().single();
      if (error) {
        console.error("[saveAchievement]", error);
        toast.error(error.message || "Save failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (data) setAchievements(prev => [data, ...prev]);
      setModalSection(null);
      setAchForm({ title: "", issuedBy: "", dateMonth: "", dateYear: "", description: "", url: "" });
      toast.success("Achievement added");
    } catch (e: any) {
      console.error("[saveAchievement] exception", e);
      toast.error(e?.message || "Network error — check your connection");
      setSaving(false);
    }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim() || !user) return;
    const url = newLinkUrl.trim().startsWith("http") ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
    const platform = detectPlatform(url);
    const updated = [...customLinks, { url, label: platform.name }];
    await supabase.from("profiles").update({ custom_links: updated } as any).eq("id", user.id);
    toast.success("Link added");
    setNewLinkUrl(""); setShowAddLink(false);
    await refreshProfile(); loadProfile();
  };

  const removeLink = async (index: number) => {
    if (!user) return;
    const updated = customLinks.filter((_, i) => i !== index);
    await supabase.from("profiles").update({ custom_links: updated } as any).eq("id", user.id);
    await refreshProfile(); loadProfile();
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user) return;
    const trimmed = newSkill.trim();
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    const updated = [...skills, trimmed];
    await supabase.from("profiles").update({ skills: updated } as any).eq("id", user.id);
    toast.success("Skill added");
    setNewSkill(""); setModalSection(null);
    await refreshProfile(); loadProfile();
  };

  const removeSkill = async (skill: string) => {
    if (!user) return;
    const updated = skills.filter(s => s !== skill);
    await supabase.from("profiles").update({ skills: updated } as any).eq("id", user.id);
    await refreshProfile(); loadProfile();
  };

  const deleteItem = async (id: string, table: "work_items" | "achievements") => {
    await supabase.from(table).delete().eq("id", id);
    toast.success("Deleted");
    if (table === "work_items") setWorkItems(prev => prev.filter(w => w.id !== id));
    else setAchievements(prev => prev.filter(a => a.id !== id));
  };

  const toggleVisibility = async (id: string, table: "work_items" | "achievements", currentVis: string) => {
    const newVis = currentVis === "public" ? "private" : "public";
    if (table === "work_items") setWorkItems(prev => prev.map(w => w.id === id ? { ...w, visibility: newVis } : w));
    else setAchievements(prev => prev.map(a => a.id === id ? { ...a, visibility: newVis } : a));
    await supabase.from(table).update({ visibility: newVis }).eq("id", id);
  };

  /* Avatar click handlers */
  const handleAvatarChangePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const { validateUpload } = await import("@/lib/uploadValidation");
    const err = validateUpload(file, { maxBytes: 5 * 1024 * 1024, allowImages: true });
    if (err) { toast.error(err); return; }
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(r => img.onload = r);
    const size = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 400, 400);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob) return;
    const path = `${user.id}/avatar.webp`;
    await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    toast.success("Photo updated");
    setShowAvatarMenu(false);
    await refreshProfile(); loadProfile();
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    toast.success("Photo removed");
    setShowAvatarMenu(false);
    await refreshProfile(); loadProfile();
  };

  const handleResumeUpload = async (file: File) => {
    if (!user) return;
    if (!file.name.endsWith(".pdf")) { toast.error("PDF only"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setResumeUploading(true);
    const path = `${user.id}/profile-resume.pdf`;
    const { data: upData, error: upErr } = await supabase.storage
      .from("resumes").upload(path, file, { upsert: true });
    if (upErr || !upData) { toast.error("Upload failed"); setResumeUploading(false); return; }
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    const url = urlData?.publicUrl;
    if (url) {
      await supabase.from("profiles").update({ resume_url: url } as any).eq("id", user.id);
      setViewedProfile((prev: any) => ({ ...prev, resume_url: url }));
      toast.success("Resume uploaded");
    }
    setResumeUploading(false);
  };

  /* Role save/delete */
  const saveRole = async () => {
    if (!roleForm.title.trim() || !user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id, role_type: roleForm.roleType, title: roleForm.title.trim(), description: roleForm.description.trim() || null,
      };
      if (import.meta.env.DEV) console.log("[saveRole] payload:", payload);
      const { data, error } = await supabase.from("profile_roles" as any).insert(payload).select().single();
      if (error) {
        console.error("[saveRole]", error);
        toast.error(error.message || "Save failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
      if (data) setProfileRoles(prev => [data as any, ...prev]);
      setModalSection(null);
      setRoleForm({ roleType: "Side Hustle", title: "", description: "" });
      toast.success("Role added");
    } catch (e: any) {
      console.error("[saveRole] exception", e);
      toast.error(e?.message || "Network error — check your connection");
      setSaving(false);
    }
  };

  const deleteRole = async (id: string) => {
    await supabase.from("profile_roles" as any).delete().eq("id", id);
    setProfileRoles(prev => prev.filter(r => r.id !== id));
    toast.success("Deleted");
  };

  const currentExp = experiences.find((e: any) => e.is_current);
  const seoProps = profileSEO(profileData as any);
  const activityScore = profileData.activity_score || 0;
  const tier = getActivityTier(activityScore);

  const handleReport = async () => {
    if (!user || !targetUserId) return;
    await supabase.from("profile_reports" as any).insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reason: "user_report",
    });
    toast.success("Report submitted. Our team will review.");
  };

  const handleBlock = async () => {
    if (!user || !targetUserId) return;
    if (!confirm("Block this user? You won't see their content and they can't contact you.")) return;
    // Disconnect first if connected
    if (connectionStatus.id) {
      await supabase.from("strands").delete().eq("id", connectionStatus.id);
    } else {
      const { data } = await supabase.from("strands").select("id")
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .maybeSingle();
      if (data) await supabase.from("strands").delete().eq("id", data.id);
    }
    setConnectionStatus({ status: null, direction: null, id: null });
    toast.success("User blocked");
  };

  const handleDisconnect = () => {
    if (!user || !targetUserId) return;
    const name = displayName || "this person";
    toast(`Remove connection with ${name}?`, {
      action: {
        label: "Disconnect",
        onClick: async () => {
          const prev = connectionStatus;
          setConnectionStatus({ status: null, direction: null, id: null });
          let strandId = connectionStatus.id;
          if (!strandId) {
            const { data } = await supabase.from("strands").select("id")
              .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
              .eq("status", "accepted").maybeSingle();
            strandId = data?.id || null;
          }
          if (strandId) {
            const { error } = await supabase.from("strands").delete().eq("id", strandId);
            if (error) { setConnectionStatus(prev); toast.error("Could not disconnect"); return; }
          }
          toast.success(`Connection with ${name} removed`);
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 5000,
    });
  };

  const handleWithdraw = async () => {
    if (!user || !targetUserId) return;
    const prev = connectionStatus;
    setConnectionStatus({ status: null, direction: null, id: null });
    let strandId = connectionStatus.id;
    if (!strandId) {
      const { data } = await supabase.from("strands").select("id")
        .eq("requester_id", user.id).eq("receiver_id", targetUserId)
        .eq("status", "pending").maybeSingle();
      strandId = data?.id || null;
    }
    if (strandId) {
      const { error } = await supabase.from("strands").delete().eq("id", strandId);
      if (error) { setConnectionStatus(prev); toast.error("Could not withdraw"); return; }
    }
    toast.info("Request withdrawn");
  };

  const renderConnectButton = () => {
    const { status, direction } = connectionStatus;
    if (status === "accepted") {
      return (
        <button
          type="button"
          className="cursor-pointer"
          style={{
            height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "rgba(52,199,89,0.10)", color: "#34C759",
            border: "1px solid rgba(52,199,89,0.25)",
            display: "inline-flex", alignItems: "center", gap: 4
          }}
          onClick={() => {
            const name = profileData?.full_name || displayName || "this person";
            toast(`Disconnect from ${name}?`, {
              action: { label: "Disconnect", onClick: handleDisconnect },
              cancel: { label: "Cancel", onClick: () => {} },
              duration: 5000,
            });
          }}
        >
          <CheckCircle className="w-3.5 h-3.5" /> Connected ✓
        </button>
      );
    }
    if (status === "pending" && direction === "sent") return (
      <button
        type="button"
        className="cursor-pointer"
        style={{
          height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: "rgba(255,184,0,0.10)", color: "#FFB800",
          border: "1px solid rgba(255,184,0,0.25)",
          display: "inline-flex", alignItems: "center", gap: 4
        }}
        onClick={() => {
          toast("Withdraw connection request?", {
            action: { label: "Withdraw", onClick: handleWithdraw },
            cancel: { label: "Cancel", onClick: () => {} },
            duration: 5000,
          });
        }}
      >
        Pending…
      </button>
    );
    if (status === "pending" && direction === "received") return (
      <div className="flex gap-2">
        <button type="button" onClick={handleAcceptConnection} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg, #34C759, #30B350)", color: "#fff", border: "none" }}>Accept</button>
        <button type="button" onClick={handleDeclineConnection} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>Decline</button>
      </div>
    );
    // Institution account viewing another user — show "Follow as [OrgName]" instead of Connect
    if (authProfile?.account_type === "institution" && (authProfile as any)?.org_id) {
      const orgName = authProfile?.institution_name || "your organization";
      const orgId = (authProfile as any).org_id;
      const handleFollowAsOrg = async () => {
        if (!targetUserId) return;
        const { error } = await (supabase.from("org_user_follows" as any).insert({ org_id: orgId, user_id: targetUserId }) as any);
        if (!error) {
          setOrgFollowingUser(true);
          sendNotification({ userId: targetUserId, actorId: user!.id, type: "org_follow", title: `${orgName} started following you`, actionUrl: `/app/profile/${user!.id}` });
          toast.success(`${orgName} is now following this user`);
        } else {
          toast.error("Could not follow. Try again.");
        }
      };
      const handleUnfollowAsOrg = () => {
        toast(`Stop following as ${orgName}?`, {
          action: { label: "Unfollow", onClick: async () => {
            await (supabase.from("org_user_follows" as any).delete().eq("org_id", orgId).eq("user_id", targetUserId) as any);
            setOrgFollowingUser(false);
            toast.success("Unfollowed");
          }},
          cancel: { label: "Cancel", onClick: () => {} },
          duration: 5000,
        });
      };
      return orgFollowingUser ? (
        <button type="button" onClick={handleUnfollowAsOrg} className="cursor-pointer" style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(13,148,136,0.10)", color: "#0D9488", border: "1px solid rgba(13,148,136,0.25)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <CheckCircle className="w-3.5 h-3.5" /> {orgName} Following ✓
        </button>
      ) : (
        <button type="button" onClick={handleFollowAsOrg} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(13,148,136,0.10)", color: "#0D9488", border: "1px solid rgba(13,148,136,0.25)" }}>
          Follow as {orgName}
        </button>
      );
    }

    return (
      <button type="button" onClick={handleConnect} disabled={connectLoading} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#FF5A1F", color: "#fff", border: "none", boxShadow: "0 2px 12px rgba(255,90,31,0.25)" }}>
        <Users className="w-3 h-3 inline mr-1" />Connect
      </button>
    );
  };

  const otwVis = (profileData as any).otw_visibility || "recruiters";
  const viewerIsRecruiter = authProfile?.account_type === "institution";
  const showOTW = !!profileData.open_to_work && (
    isOwnProfile || otwVis === "all" || (otwVis === "recruiters" && viewerIsRecruiter)
  );
  return (
    <div className="min-h-screen pb-24">
      <PageSEO {...seoProps} />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: 720 }}>
        {/* ── IDENTITY CARD ── */}
        <IdentityCard
          profileData={profileData}
          displayName={displayName}
          username={username}
          oneWordRole={compactRoleLine}
          roleColor={roleColor}
          isVerified={isVerified}
          showOTW={showOTW}
          isOwnProfile={isOwnProfile}
          followerCount={(profileData as any).follower_count ?? 0}
          followingCount={(profileData as any).following_count ?? 0}
          cosignCount={squadsCount}
          city={city}
          state={state}
          renderConnectButton={renderConnectButton}
          targetUserId={targetUserId}
        />

        {/* ── OWNER DASHBOARD — owner only ── */}
        {isOwnProfile && (
          <DashboardTiles
            profileViewsCount={0}
            activityScore={activityScore}
            cosignCount={squadsCount}
            completenessPercent={completenessPercent}
          />
        )}

        {/* ── MAIN CONTENT + STICKY NAV ── */}
        <div className="profile-page-layout">
          <div className="profile-main-col">
            <TheStory about={aboutText} isOwner={isOwnProfile} />

            <TheGrind
              experiences={experiences}
              isOwner={isOwnProfile}
              onAdd={() => setModalSection("experience")}
              onDelete={deleteItem}
              onToggleVisibility={toggleVisibility}
            />

            <TheClass
              education={education}
              isOwner={isOwnProfile}
              onAdd={() => setModalSection("education")}
              onDelete={deleteItem}
            />

            <TheToolkit
              skills={skills}
              isOwner={isOwnProfile}
              onAdd={() => setModalSection("skills")}
              onRemoveSkill={removeSkill}
            />

            <TheWins
              achievements={achievements}
              isOwner={isOwnProfile}
              onAdd={() => setModalSection("achievement")}
              onDelete={deleteItem}
            />

            {certifications.length > 0 && (
              <CertsSection certifications={certifications} />
            )}

            <DropsSection
              userId={targetUserId || ""}
              posts={userPosts}
              totalPosts={stats.posts}
              isOwner={isOwnProfile}
              username={username}
            />

            <ReelsSection
              profileId={targetUserId || ""}
              isOwner={isOwnProfile}
            />

            {(creatorChannels.length > 0 || isOwnProfile) && (
              <CreatorSection
                channels={creatorChannels}
                isOwner={isOwnProfile}
              />
            )}

            {isOwnProfile && targetUserId && (
              <div data-analytics>
                <ProfileAnalyticsRow profileId={targetUserId} />
              </div>
            )}
          </div>

          <ClayNavBar
            isOwner={isOwnProfile}
            targetUserId={targetUserId}
            cleanProfileUsername={cleanProfileUsername}
            username={username}
            onScrollToAnalytics={() => {
              document.querySelector("[data-analytics]")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>

      </div>

      {/* ═══ GLASS MODALS ═══ */}
      <GlassModal open={modalSection === "experience"} onClose={() => setModalSection(null)} title="Add Experience" icon={Briefcase} accentColor="#E8733A"
        actions={<>
          <button type="button" onClick={saveExperience} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Company / Organisation *</label><input value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} style={gInputStyle} placeholder="e.g. Google" /></div>
        <div><label style={labelStyle}>Job Title *</label><input value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} style={gInputStyle} placeholder="e.g. Software Engineer" /></div>
        <div><label style={labelStyle}>Employment Type</label>
          <select value={expForm.type} onChange={e => setExpForm({ ...expForm, type: e.target.value })} style={gSelectStyle}>
            {["Full-time","Part-time","Contract","Freelance","Internship"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label style={labelStyle}>Start Month</label><select value={expForm.startMonth} onChange={e => setExpForm({ ...expForm, startMonth: e.target.value })} style={gSelectStyle}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label style={labelStyle}>Start Year</label><select value={expForm.startYear} onChange={e => setExpForm({ ...expForm, startYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={expForm.isCurrent} onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "#6B7094" }}>I currently work here</span></label>
        {!expForm.isCurrent && (
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>End Month</label><select value={expForm.endMonth} onChange={e => setExpForm({ ...expForm, endMonth: e.target.value })} style={gSelectStyle}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label style={labelStyle}>End Year</label><select value={expForm.endYear} onChange={e => setExpForm({ ...expForm, endYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
          </div>
        )}
        <div><label style={labelStyle}>Location</label><input value={expForm.city} onChange={e => setExpForm({ ...expForm, city: e.target.value })} style={gInputStyle} placeholder="City" /></div>
        <div><label style={labelStyle}>Description</label><textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value.slice(0, 500) })} style={gTextareaStyle} placeholder="What did you do?" maxLength={500} /></div>
        <div><label style={labelStyle}>Skills (comma separated)</label><input value={expForm.skills} onChange={e => setExpForm({ ...expForm, skills: e.target.value })} style={gInputStyle} placeholder="e.g. Leadership, Python, Surgery" /></div>
      </GlassModal>

      <GlassModal open={modalSection === "education"} onClose={() => setModalSection(null)} title="Add Education" icon={GraduationCap} accentColor="#34C759"
        actions={<>
          <button type="button" onClick={saveEducation} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Institution Name *</label><input value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} style={gInputStyle} placeholder="e.g. IIT Delhi" /></div>
        <div><label style={labelStyle}>Degree / Program</label><input value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} style={gInputStyle} placeholder="e.g. B.Tech" /></div>
        <div><label style={labelStyle}>Branch / Specialisation</label><input value={eduForm.branch} onChange={e => setEduForm({ ...eduForm, branch: e.target.value })} style={gInputStyle} placeholder="e.g. Computer Science" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label style={labelStyle}>Start Year</label><select value={eduForm.startYear} onChange={e => setEduForm({ ...eduForm, startYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><label style={labelStyle}>{eduForm.isCurrent ? "Expected Grad Year" : "End Year"}</label><select value={eduForm.endYear} onChange={e => setEduForm({ ...eduForm, endYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={eduForm.isCurrent} onChange={e => setEduForm({ ...eduForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "#6B7094" }}>Currently studying here</span></label>
        <div><label style={labelStyle}>Grade / CGPA</label><input value={eduForm.grade} onChange={e => setEduForm({ ...eduForm, grade: e.target.value })} style={gInputStyle} placeholder="e.g. 9.2" /></div>
      </GlassModal>

      <GlassModal open={modalSection === "project"} onClose={() => setModalSection(null)} title="Add Project" icon={Rocket} accentColor="#FF6B9D"
        actions={<>
          <button type="button" onClick={saveProject} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Project Name *</label><input value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={gInputStyle} placeholder="e.g. Portfolio Website" /></div>
        <div><label style={labelStyle}>Organisation (optional)</label><input value={projForm.org} onChange={e => setProjForm({ ...projForm, org: e.target.value })} style={gInputStyle} placeholder="e.g. Open source" /></div>
        <div><label style={labelStyle}>Description</label><textarea value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value.slice(0, 500) })} style={gTextareaStyle} placeholder="What is this project about?" maxLength={500} /></div>
        <div><label style={labelStyle}>Tech Stack (comma separated)</label><input value={projForm.techStack} onChange={e => setProjForm({ ...projForm, techStack: e.target.value })} style={gInputStyle} placeholder="e.g. tools, languages, frameworks" /></div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={projForm.isCurrent} onChange={e => setProjForm({ ...projForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "#6B7094" }}>Currently active</span></label>
      </GlassModal>

      <GlassModal open={modalSection === "achievement"} onClose={() => setModalSection(null)} title="Add Achievement" icon={Award} accentColor="#FFB800"
        actions={<>
          <button type="button" onClick={saveAchievement} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Title *</label><input value={achForm.title} onChange={e => setAchForm({ ...achForm, title: e.target.value })} style={gInputStyle} placeholder="e.g. Best Paper Award" /></div>
        <div><label style={labelStyle}>Issued By</label><input value={achForm.issuedBy} onChange={e => setAchForm({ ...achForm, issuedBy: e.target.value })} style={gInputStyle} placeholder="e.g. IEEE" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label style={labelStyle}>Month</label><select value={achForm.dateMonth} onChange={e => setAchForm({ ...achForm, dateMonth: e.target.value })} style={gSelectStyle}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label style={labelStyle}>Year</label><select value={achForm.dateYear} onChange={e => setAchForm({ ...achForm, dateYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
        </div>
        <div><label style={labelStyle}>Description</label><textarea value={achForm.description} onChange={e => setAchForm({ ...achForm, description: e.target.value })} style={gTextareaStyle} placeholder="Brief description..." /></div>
        <div><label style={labelStyle}>Credential URL (optional)</label><input value={achForm.url} onChange={e => setAchForm({ ...achForm, url: e.target.value })} style={gInputStyle} placeholder="https://..." /></div>
      </GlassModal>

      <GlassModal open={modalSection === "skills"} onClose={() => setModalSection(null)} title="Add Skill" icon={Code2} accentColor="#8B5CF6"
        actions={<>
          <button type="button" onClick={addSkill} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>Add</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Skill Name</label><input value={newSkill} onChange={e => setNewSkill(e.target.value)} style={gInputStyle} placeholder="e.g. React" onKeyDown={e => { if (e.key === "Enter") addSkill(); }} /></div>
        {skills.length > 0 && (
          <div>
            <label style={labelStyle}>Your skills</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skills.map((s: string) => (
                <span key={s} className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "1.5px solid #8B5CF6", color: "#8B5CF6", background: "rgba(139,92,246,0.12)" }}>
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 0, color: "#8B5CF6" }}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassModal>

      <GlassModal open={modalSection === "role"} onClose={() => setModalSection(null)} title="Add Moonlighting" icon={Layers} accentColor="#0369A1"
        actions={<>
          <button type="button" onClick={saveRole} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(107,112,148,0.10)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.15)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Role Type *</label>
          <select value={roleForm.roleType} onChange={e => setRoleForm({ ...roleForm, roleType: e.target.value })} style={gSelectStyle}>
            {["Side Hustle", "Freelance", "Dual Employment", "Moonlighting"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label style={labelStyle}>Title *</label><input value={roleForm.title} onChange={e => setRoleForm({ ...roleForm, title: e.target.value })} style={gInputStyle} placeholder="e.g. Freelance Designer" /></div>
        <div><label style={labelStyle}>Description</label><textarea value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value.slice(0, 300) })} style={gTextareaStyle} placeholder="Brief description..." maxLength={300} /></div>
      </GlassModal>


      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={(updated) => {
            setUserPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
          }}
        />
      )}
      {deletingPostId && (
        <DeletePostDialog
          postId={deletingPostId}
          onClose={() => setDeletingPostId(null)}
          onDeleted={(id) => {
            setUserPosts(prev => prev.filter(p => p.id !== id));
            setStats(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
            setDeletingPostId(null);
          }}
        />
      )}
    </div>
  );
};

export default Profile;
