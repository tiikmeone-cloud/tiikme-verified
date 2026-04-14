import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  MapPin, Copy, Shield, X, MessageCircle, CheckCircle, Building2, Link2, Plus,
  Pencil, Trash2, Briefcase, GraduationCap, Award, Code2, Eye, EyeOff,
  Heart, Rocket, Send, Share2, Users, Globe, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import GetTiikedModal from "@/components/profile/GetTiikedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";
import MentionText from "@/components/feed/MentionText";
import VerificationRequest from "@/components/profile/VerificationRequest";
import CertificatesSection from "@/components/profile/CertificatesSection";
import GlassBox from "@/components/ui/GlassBox";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";

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

function getTimeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* Company logo color from name */
const LOGO_COLORS = ["#E8580A","#3B82F6","#8B5CF6","#10B981","#F59E0B","#EC4899","#06B6D4","#6366F1"];
const hashColor = (name: string) => LOGO_COLORS[name.split("").reduce((a,c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

/* ── VerifBadge ── */
const VerifBadge = ({ item, isOwn, onStatusChange }: { item: any; isOwn: boolean; onStatusChange?: (id: string, status: string) => void }) => {
  const status = item.verification_status || "unverified";
  if (status === "verified") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
      <CheckCircle className="w-3 h-3" /> Tiiked
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 text-[10px] mt-1 px-2.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.08)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}>
      Verification pending
    </span>
  );
  if (isOwn) return <VerificationRequest item={item} itemType={item.item_type || "experience"} onStatusChange={onStatusChange!} />;
  return <span className="text-[10px] mt-1 block" style={{ color: "#9CA3AF" }}>Unverified</span>;
};

/* ── Edit Profile Drawer ── */
const EditProfileDrawer = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: "", headline: "", bio: "", city: "", state: "", username: "", open_to_work: false, avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [customLinks, setCustomLinks] = useState<{ url: string; label: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({ name: data.full_name || "", headline: data.headline || "", bio: data.bio || "", city: data.location_city || "", state: data.location_state || "", username: data.username || "", open_to_work: data.open_to_work || false, avatar_url: data.avatar_url || "" });
        setCustomLinks(Array.isArray(data.custom_links) ? (data.custom_links as any[]).map(l => ({ url: l.url || "", label: l.label || "" })) : []);
      }
    })();
  }, [open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
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
    const path = `${userId}/avatar.webp`;
    await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    setForm(p => ({ ...p, avatar_url: avatarUrl }));
    toast.success("Avatar updated");
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: form.name, headline: form.headline.slice(0, 80), bio: form.bio.slice(0, 300),
      username: form.username.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
      location_city: form.city, location_state: form.state, open_to_work: form.open_to_work,
      custom_links: customLinks.filter(l => l.url) as any,
    }).eq("id", userId);
    setSaving(false);
    toast.success("Profile updated");
    await refreshProfile();
    onSaved(); onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px] overflow-y-auto" style={{ background: "#fff" }}>
        <SheetHeader><SheetTitle className="text-[18px] font-extrabold" style={{ color: "#1A1A1A" }}>Edit Profile</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => avatarRef.current?.click()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white overflow-hidden" style={{ backgroundColor: "#E8580A" }}>
              {form.avatar_url ? <img src={storageImageUrl(form.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </div>
            <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Click to change avatar</p>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>Display name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>Headline</label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value.slice(0, 80) })} maxLength={80} /></div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value.slice(0, 300) })} rows={3} maxLength={300}
              className="w-full rounded-xl p-3 text-[14px] outline-none resize-none" style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#1A1A1A" }} />
          </div>
          <div className="flex items-center gap-2"><span className="text-[13px]" style={{ color: "#9CA3AF" }}>@</span><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} className="flex-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#1A1A1A" }}>
                <option value="">Select</option>{allIndianStates.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid #F0E8E0", borderBottom: "1px solid #F0E8E0" }}>
            <span className="text-[14px] font-medium" style={{ color: "#1A1A1A" }}>Open to work</span>
            <button type="button" onClick={() => setForm({ ...form, open_to_work: !form.open_to_work })} className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
              style={{ background: form.open_to_work ? "#E8580A" : "#E5E7EB" }}>
              <div className="w-5 h-5 rounded-full bg-white" style={{ transform: form.open_to_work ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s" }} />
            </button>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9CA3AF" }}>Custom Links</label>
            {customLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <Input placeholder="URL" value={link.url} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], url: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <Input placeholder="Label" value={link.label} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], label: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <button type="button" onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))} className="p-1 cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-4 h-4" /></button>
              </div>
            ))}
            {customLinks.length < 5 && <button type="button" onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])} className="text-[12px] font-semibold cursor-pointer" style={{ color: "#E8580A" }}>+ Add link</button>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Inline Add Form ── */
const InlineForm = ({ title, fields, onSave, onCancel, saving }: { title: string; fields: React.ReactNode; onSave: () => void; onCancel: () => void; saving: boolean }) => (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
    className="p-4 mt-3 rounded-2xl" style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}>
    <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1A1A1A" }}>{title}</h3>
    <div className="space-y-3">{fields}</div>
    <div className="flex gap-2 mt-4">
      <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  </motion.div>
);

const inputStyle: React.CSSProperties = { background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 12, color: "#1A1A1A", height: 44 };
const selectStyle: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#1A1A1A" };

/* ═══════════ MAIN PROFILE ═══════════ */
const Profile = () => {
  const { id: urlUserId } = useParams<{ id: string }>();
  const { profile: authProfile, initials: authInitials, displayName: authDisplayName, refreshProfile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !urlUserId || urlUserId === user?.id;

  // Redirect institution accounts to org page
  useEffect(() => {
    if (isOwnProfile && authProfile?.account_type === "institution" && authProfile?.org_id) {
      supabase.from("organizations").select("slug").eq("id", authProfile.org_id).maybeSingle()
        .then(({ data }) => { if (data?.slug) navigate(`/org/${data.slug}`, { replace: true }); });
    }
  }, [isOwnProfile, authProfile?.account_type, authProfile?.org_id, navigate]);

  const [editOpen, setEditOpen] = useState(false);
  const [expandedBox, setExpandedBox] = useState<string | null>("experience");
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });
  const [connectedAvatars, setConnectedAvatars] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showGetTiiked, setShowGetTiiked] = useState(false);

  // Add forms
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const [expForm, setExpForm] = useState({ company: "", title: "", type: "Full-time", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", branch: "", startYear: "", endYear: "", isCurrent: false, grade: "" });
  const [projForm, setProjForm] = useState({ title: "", org: "", description: "", techStack: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false });
  const [achForm, setAchForm] = useState({ title: "", issuedBy: "", dateMonth: "", dateYear: "", description: "", url: "" });

  const [connectionStatus, setConnectionStatus] = useState<{ status: string | null; direction: string | null; id: string | null }>({ status: null, direction: null, id: null });
  const [connectLoading, setConnectLoading] = useState(false);

  const targetUserId = isOwnProfile ? user?.id : urlUserId;

  const toggleBox = (id: string) => setExpandedBox(prev => prev === id ? null : id);

  const loadProfile = useCallback(async () => {
    if (!targetUserId) { setDataLoading(false); return; }
    setDataLoading(true);
    const [profileRes, itemsRes, strandCountRes, postsRes, achvsRes, certsRes, connAvatarsRes] = await Promise.allSettled([
      isOwnProfile ? Promise.resolve({ data: authProfile }) : supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle(),
      supabase.from("work_items").select("*").eq("owner_id", targetUserId).order("is_current", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("strands").select("*", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("id, content, created_at, image_urls, comment_count").eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(5),
      supabase.from("achievements").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      supabase.from("certificates").select("*, org:organizations(name, logo_url)").eq("issued_to", targetUserId).order("created_at", { ascending: false }),
      supabase.from("strands").select("requester_id, receiver_id").or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted").limit(6),
    ]);

    const profile = profileRes.status === "fulfilled" ? (profileRes.value as any).data : null;
    setViewedProfile(profile || (isOwnProfile ? authProfile : null));
    setWorkItems(itemsRes.status === "fulfilled" ? (itemsRes.value as any).data || [] : []);
    setUserPosts(postsRes.status === "fulfilled" ? (postsRes.value as any).data || [] : []);
    setAchievements(achvsRes.status === "fulfilled" ? (achvsRes.value as any).data || [] : []);
    setCertificates(certsRes.status === "fulfilled" ? (certsRes.value as any).data || [] : []);
    const strandCount = strandCountRes.status === "fulfilled" ? (strandCountRes.value as any).count || 0 : 0;
    const posts = postsRes.status === "fulfilled" ? (postsRes.value as any).data || [] : [];
    setStats({ connections: strandCount, posts: posts.length });

    // Get connected user avatars
    if (connAvatarsRes.status === "fulfilled") {
      const strands = (connAvatarsRes.value as any).data || [];
      const otherIds = strands.map((s: any) => s.requester_id === targetUserId ? s.receiver_id : s.requester_id).filter(Boolean);
      if (otherIds.length > 0) {
        const { data: avatars } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds.slice(0, 6));
        setConnectedAvatars(avatars || []);
      }
    }
    setDataLoading(false);
  }, [targetUserId, isOwnProfile, authProfile]);

  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;
    supabase.from("strands").select("id, status, requester_id, receiver_id")
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .maybeSingle().then(({ data }) => {
        if (data) setConnectionStatus({ status: data.status, direction: data.requester_id === user.id ? "sent" : "received", id: data.id });
      });
  }, [user, targetUserId, isOwnProfile]);

  useEffect(() => { if (!authLoading) loadProfile(); }, [authLoading, loadProfile]);

  if (authLoading || dataLoading) return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FFF8F2 0%, #FFF0E8 50%, #FFF8F2 100%)" }}>
      <div className="max-w-[960px] mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-[180px] rounded-3xl" style={{ background: "rgba(232,88,10,0.1)" }} /><div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4"><div className="h-48 rounded-2xl" style={{ background: "#fff" }} /><div className="h-48 rounded-2xl" style={{ background: "#fff" }} /></div></div></div>
    </div>
  );
  if (!user && isOwnProfile) return null;

  const profileData = viewedProfile || authProfile;
  if (!profileData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <p className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>Profile not found</p>
      <button type="button" onClick={() => navigate("/app/explore")} className="text-[13px] mt-2" style={{ color: "#E8580A" }}>Back to Explore</button>
    </div>
  );

  const displayName = profileData.full_name || authDisplayName || "";
  const username = profileData.username || "";
  const headline = profileData.headline || "";
  const bio = profileData.bio || "";
  const city = profileData.location_city || "";
  const state = profileData.location_state || "";
  const role = profileData.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const initials = displayName ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : authInitials || "U";
  const roleColor = ROLE_COLOR_MAP[role] || "#4F46E5";
  const isVerified = profileData.is_verified === true;
  const skills: string[] = profileData.skills || [];
  const customLinks: any[] = Array.isArray(profileData.custom_links) ? profileData.custom_links : [];

  const visFilter = (items: any[]) => isOwnProfile ? items : items.filter((w: any) => w.visibility === "public" || !w.visibility);
  const experiences = visFilter(workItems.filter((w: any) => w.item_type === "experience")).sort((a: any, b: any) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return (b.start_year || 0) - (a.start_year || 0);
  });
  const education = visFilter(workItems.filter((w: any) => w.item_type === "education"));
  const projects = visFilter(workItems.filter((w: any) => w.item_type === "project" || (!w.item_type && w.title)));

  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.origin + "/" + username); toast.success("Profile link copied"); };

  const handleConnect = async () => {
    if (!user || !targetUserId || connectLoading) return;
    setConnectLoading(true);
    const { error } = await supabase.from("strands").insert({ requester_id: user.id, receiver_id: targetUserId });
    if (error) { toast.error(error.message); setConnectLoading(false); return; }
    await supabase.from("alerts").insert({ user_id: targetUserId, type: "strand", title: `${authProfile?.full_name || "Someone"} wants to connect`, body: `Connection request received`, action_url: `/app/profile/${user.id}`, data: { actor_id: user.id } as any });
    setConnectionStatus({ status: "pending", direction: "sent", id: null });
    setConnectLoading(false);
    toast.success("Connection request sent");
    try { await supabase.rpc("increment_score", { uid: user.id, amount: 3 }); } catch {}
  };

  const handleAcceptConnection = async () => {
    if (!connectionStatus.id) return;
    await supabase.from("strands").update({ status: "accepted" }).eq("id", connectionStatus.id);
    setConnectionStatus({ ...connectionStatus, status: "accepted" });
    toast.success("Connected!");
  };

  const handleDeclineConnection = async () => {
    if (!connectionStatus.id) return;
    await supabase.from("strands").delete().eq("id", connectionStatus.id);
    setConnectionStatus({ status: null, direction: null, id: null });
  };

  /* Save functions */
  const saveExperience = async () => {
    if (!expForm.company.trim() || !expForm.title.trim() || !user) return;
    setSaving(true);
    const startDate = expForm.startMonth && expForm.startYear ? `${expForm.startYear}-${String(months.indexOf(expForm.startMonth) + 1).padStart(2, "0")}-01` : null;
    const endDate = !expForm.isCurrent && expForm.endMonth && expForm.endYear ? `${expForm.endYear}-${String(months.indexOf(expForm.endMonth) + 1).padStart(2, "0")}-01` : null;
    const { data, error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: expForm.title.trim(), job_title: expForm.title.trim(),
      description: expForm.description.trim(), company_name: expForm.company.trim(), institution_name: expForm.company.trim(),
      employment_type: expForm.type, type: expForm.type, item_type: "experience",
      work_location: expForm.city.trim() || null,
      start_month: expForm.startMonth || null, start_year: expForm.startYear ? Number(expForm.startYear) : null,
      end_month: !expForm.isCurrent ? (expForm.endMonth || null) : null, end_year: !expForm.isCurrent && expForm.endYear ? Number(expForm.endYear) : null,
      start_date: startDate, end_date: endDate, is_current: expForm.isCurrent,
      skills_used: expForm.skills ? expForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      tech_stack: expForm.skills ? expForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "active", visibility: "public",
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setWorkItems(prev => [data, ...prev]);
    setShowAddExp(false);
    setExpForm({ company: "", title: "", type: "Full-time", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
    toast.success("Experience added");
  };

  const saveEducation = async () => {
    if (!eduForm.institution.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: eduForm.degree + (eduForm.branch ? ` - ${eduForm.branch}` : ""),
      degree_type: eduForm.degree.trim() || null, field_of_study: eduForm.branch.trim() || null,
      institution_name_edu: eduForm.institution.trim(), institution_name: eduForm.institution.trim(),
      grade_score: eduForm.grade.trim() || null, item_type: "education",
      start_year: eduForm.startYear ? Number(eduForm.startYear) : null,
      end_year: !eduForm.isCurrent && eduForm.endYear ? Number(eduForm.endYear) : null,
      start_date: eduForm.startYear ? `${eduForm.startYear}-01-01` : null,
      end_date: !eduForm.isCurrent && eduForm.endYear ? `${eduForm.endYear}-12-31` : null,
      is_current: eduForm.isCurrent, status: "active", visibility: "public",
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setWorkItems(prev => [data, ...prev]);
    setShowAddEdu(false);
    setEduForm({ institution: "", degree: "", branch: "", startYear: "", endYear: "", isCurrent: false, grade: "" });
    toast.success("Education added");
  };

  const saveProject = async () => {
    if (!projForm.title.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: projForm.title.trim(), description: projForm.description.trim(),
      company_name: projForm.org.trim() || null, item_type: "project",
      tech_stack: projForm.techStack ? projForm.techStack.split(",").map(s => s.trim()).filter(Boolean) : [],
      start_year: projForm.startYear ? Number(projForm.startYear) : null,
      end_year: !projForm.isCurrent && projForm.endYear ? Number(projForm.endYear) : null,
      is_current: projForm.isCurrent, status: "active", visibility: "public",
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setWorkItems(prev => [data, ...prev]);
    setShowAddProject(false);
    setProjForm({ title: "", org: "", description: "", techStack: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false });
    toast.success("Project added");
  };

  const saveAchievement = async () => {
    if (!achForm.title.trim() || !user) return;
    setSaving(true);
    const dateStr = achForm.dateYear ? `${achForm.dateYear}-${achForm.dateMonth ? String(months.indexOf(achForm.dateMonth) + 1).padStart(2, "0") : "01"}-01` : null;
    const { data, error } = await supabase.from("achievements").insert({
      user_id: user.id, title: achForm.title.trim(), issued_by: achForm.issuedBy,
      achievement_date: dateStr, description: achForm.description, certificate_url: achForm.url || null, type: "award",
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setAchievements(prev => [data, ...prev]);
    setShowAddAchievement(false);
    setAchForm({ title: "", issuedBy: "", dateMonth: "", dateYear: "", description: "", url: "" });
    toast.success("Achievement added");
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user) return;
    const updated = [...skills, newSkill.trim()];
    await supabase.from("profiles").update({ skills: updated } as any).eq("id", user.id);
    toast.success("Skill added");
    setNewSkill(""); setShowAddSkill(false);
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

  const renderConnectButton = () => {
    const { status, direction } = connectionStatus;
    if (status === "accepted") return <button type="button" className="h-10 px-5 rounded-full text-[13px] font-bold" style={{ background: "#F0FDF4", color: "#059669", border: "1.5px solid #059669" }} disabled><CheckCircle className="w-3.5 h-3.5 inline mr-1" />Connected</button>;
    if (status === "pending" && direction === "sent") return <button type="button" className="h-10 px-5 rounded-full text-[13px] font-bold opacity-60" style={{ background: "#F9FAFB", color: "#6B7280", border: "1.5px solid #E5E7EB" }} disabled>Requested</button>;
    if (status === "pending" && direction === "received") return (
      <div className="flex gap-2">
        <button type="button" onClick={handleAcceptConnection} className="h-10 px-5 rounded-full text-[13px] font-bold text-white" style={{ background: "#E8580A" }}>Accept</button>
        <button type="button" onClick={handleDeclineConnection} className="h-10 px-5 rounded-full text-[13px] font-bold" style={{ color: "#6B7280", border: "1.5px solid #E5E7EB" }}>Decline</button>
      </div>
    );
    return <button type="button" onClick={handleConnect} disabled={connectLoading} className="h-10 px-5 rounded-full text-[13px] font-bold text-white" style={{ background: "#E8580A" }}><Users className="w-3.5 h-3.5 inline mr-1" />Connect</button>;
  };

  const currentExp = experiences.find(e => e.is_current);

  return (
    <div className="min-h-screen pb-8">
      {/* ── COVER ── */}
      <div className="max-w-[960px] mx-auto px-4">
        <div className="h-[240px] relative overflow-hidden"
          style={{
            borderRadius: "0 0 28px 28px",
            background: profileData.cover_url ? undefined : "linear-gradient(135deg, #1A1A4E 0%, #2D2D7A 60%, #3D3D8A 100%)",
          }}>
          {profileData.cover_url && (
            <>
              <img src={storageImageUrl(profileData.cover_url, "cover")} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,26,78,0.20) 0%, rgba(26,26,78,0.70) 100%)" }} />
            </>
          )}

          {/* Edit / Connect button */}
          <div className="absolute top-4 right-4 z-10">
            {isOwnProfile ? (
              <button type="button" onClick={() => setEditOpen(true)}
                className="btn-glass-pill text-[12px] font-bold cursor-pointer"
                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.30)" }}>
                <Pencil className="w-3.5 h-3.5 inline mr-1" /> Edit Profile
              </button>
            ) : renderConnectButton()}
          </div>

          {/* Avatar + Name ON cover */}
          <div className="absolute bottom-5 left-6 flex items-end gap-4 z-10">
            <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-[28px] font-extrabold text-white overflow-hidden shrink-0"
              style={{
                backgroundColor: profileData.avatar_url ? "#fff" : roleColor,
                border: "3px solid rgba(255, 255, 255, 0.40)",
                boxShadow: "0 0 24px rgba(232, 115, 58, 0.20)",
              }}>
              {profileData.avatar_url ? <img src={storageImageUrl(profileData.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] font-bold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{displayName}</h1>
                {isVerified && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#34C759", boxShadow: "0 0 8px rgba(52,199,89,0.40)" }}>
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
              </div>
              <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.80)" }}>{headline || `${roleLabel}${currentExp ? ` at ${currentExp.company_name || currentExp.institution_name || ""}` : ""}`}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: roleColor }}>{roleLabel}</span>
                {isVerified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.9)", color: "#fff" }}><Shield className="w-3 h-3" /> Tiiked</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPACT INFO STRIP ── */}
      <div className="max-w-[960px] mx-auto px-4 mt-4">
        <div className="glass-light flex items-center gap-4 px-4 py-3 flex-wrap" style={{ borderRadius: 20 }}>
          {username && <span className="text-[13px] font-mono" style={{ color: "var(--color-text-secondary)" }}>@{username}</span>}
          {username && <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.20)" }} />}
          {profileData.open_to_work && (
            <>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg" style={{ background: "rgba(52,199,89,0.15)", color: "#34C759" }}>Open to work</span>
              <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.20)" }} />
            </>
          )}
          {(city || state) && (
            <>
              <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                <MapPin className="w-3.5 h-3.5" />{[city, state].filter(Boolean).join(", ")}
              </span>
              <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.20)" }} />
            </>
          )}
          <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            🚀 {profileData.activity_score || 0} · Explorer
          </span>
          <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.20)" }} />
          <button type="button" onClick={handleCopyLink}
            className="btn-glass-pill text-[12px] font-semibold"
            style={{ padding: "4px 12px", fontSize: 12 }}>
            <Share2 className="w-3 h-3 inline mr-1" /> Share profile
          </button>
        </div>
      </div>

      {/* ── BIO (if exists) ── */}
      {bio && (
        <div className="max-w-[960px] mx-auto px-4 mt-3">
          <div className="glass-light px-4 py-3" style={{ borderRadius: 20 }}>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7094" }}>{bioExpanded || bio.length <= 180 ? bio : bio.slice(0, 180) + "..."}</p>
            {bio.length > 180 && <button type="button" onClick={() => setBioExpanded(!bioExpanded)} className="text-[11px] font-semibold cursor-pointer" style={{ color: "#E8733A" }}>{bioExpanded ? "show less" : "...see more"}</button>}
          </div>
        </div>
      )}

      {/* ── GRID ── */}
      <div className="max-w-[960px] mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-[35%_1fr] gap-3">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="space-y-[10px]">
          {/* Connections Box */}
          <GlassBox accent="connections">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#6B7094" }}>Connections</p>
                <p className="text-[24px] font-bold leading-tight" style={{ color: "var(--color-text)" }}>{stats.connections}</p>
              </div>
              {connectedAvatars.length > 0 && (
                <div className="flex -space-x-2">
                  {connectedAvatars.slice(0, 4).map((a: any) => (
                    <div key={a.id} className="w-7 h-7 rounded-full overflow-hidden border-2 border-white flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#6366F1" }}>
                      {a.avatar_url ? <img src={storageImageUrl(a.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (a.full_name?.[0] || "?")}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link to="/app/strands" className="text-[12px] font-semibold mt-1 block" style={{ color: "#E8733A" }}>See all →</Link>
          </GlassBox>

          {/* Not Tiiked banner (owner only) */}
          {isOwnProfile && !isVerified && (
            <div className="glass-glow" style={{ borderRadius: 20, padding: "12px 16px" }}>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 shrink-0" style={{ color: "#E8733A" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: "var(--color-text)" }}>Get Tiiked</p>
                  <p className="text-[11px]" style={{ color: "#6B7094" }}>Verify your profile for the gold badge</p>
                </div>
                <button type="button" onClick={() => setShowGetTiiked(true)} className="btn-liquid-primary text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ fontSize: 11 }}>Verify</button>
              </div>
            </div>
          )}

          {/* Social Links (if any) — compact */}
          {customLinks.length > 0 && (
            <GlassBox accent="contact">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B7094" }}>Links</p>
              <div className="space-y-1.5">
                {customLinks.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] font-medium hover:underline" style={{ color: "#E8733A" }}>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />{link.label || link.url}
                  </a>
                ))}
              </div>
            </GlassBox>
          )}
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-[10px]">
          {/* Experience Box */}
          <GlassBox accent="experience" expanded={expandedBox === "experience"} onClick={() => !showAddExp && toggleBox("experience")} spanFull>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" style={{ color: "#4A90D9" }} />
                <h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Experience</h2>
              </div>
              {isOwnProfile && <button type="button" onClick={e => { e.stopPropagation(); setShowAddExp(true); setExpandedBox("experience"); }} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}><Plus className="w-3 h-3 inline mr-0.5" /> Add</button>}
            </div>

            {expandedBox === "experience" ? (
              <>
                {experiences.length === 0 && !showAddExp && <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No experience added</p>}
                <div className="relative pl-6 mt-1">
                  {experiences.length > 0 && <div className="absolute left-[7px] top-2 bottom-2 w-[2px]" style={{ background: "linear-gradient(to bottom, #4A90D9, rgba(74,144,217,0.15))" }} />}
                  {experiences.map((exp: any, idx: number) => (
                    <div key={exp.id} className="relative flex gap-3 py-2 group" style={{ borderBottom: idx < experiences.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                      <div className="absolute -left-6 top-3 w-3 h-3 rounded-full border-2 z-10" style={{ background: exp.is_current ? "#4A90D9" : "#fff", borderColor: "#4A90D9" }} />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: hashColor(exp.company_name || exp.institution_name || "X") }}>
                        {(exp.company_name || exp.institution_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{exp.company_name || exp.institution_name}</p>
                        <p className="text-[12px]" style={{ color: "#6B7094" }}>{exp.job_title || exp.title}</p>
                        {exp.employment_type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5" style={{ background: "rgba(74,144,217,0.08)", color: "#4A90D9" }}>{exp.employment_type}</span>}
                        <p className="text-[11px] mt-0.5" style={{ color: "#6B7094" }}>
                          {exp.start_month && exp.start_year ? `${exp.start_month} ${exp.start_year} – ${exp.is_current ? "Present" : exp.end_month && exp.end_year ? `${exp.end_month} ${exp.end_year}` : ""}` : exp.start_date ? formatDuration(exp.start_date, exp.end_date, exp.is_current) : ""}
                        </p>
                        {exp.work_location && <p className="text-[11px] flex items-center gap-1" style={{ color: "#6B7094" }}><MapPin className="w-3 h-3" />{exp.work_location}</p>}
                        {exp.description && <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "#6B7094" }}>{exp.description}</p>}
                        {(exp.skills_used?.length > 0 || exp.tech_stack?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">{(exp.skills_used || exp.tech_stack || []).slice(0, 5).map((s: string) => <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(74,144,217,0.08)", color: "#4A90D9" }}>{s}</span>)}</div>
                        )}
                        <VerifBadge item={exp} isOwn={isOwnProfile} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
                      </div>
                      {isOwnProfile && (
                        <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => toggleVisibility(exp.id, "work_items", exp.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}>
                            {exp.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button type="button" onClick={() => deleteItem(exp.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {experiences.length > 2 && <button type="button" className="text-[12px] font-semibold mt-1" style={{ color: "#E8733A" }}>See all {experiences.length} →</button>}
                <AnimatePresence>{showAddExp && (
                  <div onClick={e => e.stopPropagation()}>
                    <InlineForm title="Add Experience" saving={saving} onSave={saveExperience} onCancel={() => setShowAddExp(false)} fields={<>
                      <Input placeholder="Company / Organisation *" value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} style={inputStyle} />
                      <Input placeholder="Job Title *" value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} style={inputStyle} />
                      <select value={expForm.type} onChange={e => setExpForm({ ...expForm, type: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={inputStyle}>
                        {["Full-time","Part-time","Contract","Freelance","Internship"].map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={expForm.startMonth} onChange={e => setExpForm({ ...expForm, startMonth: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">Start month</option>{months.map(m => <option key={m}>{m}</option>)}</select>
                        <select value={expForm.startYear} onChange={e => setExpForm({ ...expForm, startYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">Start year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={expForm.isCurrent} onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "#6B7094" }}>I currently work here</span></label>
                      {!expForm.isCurrent && <div className="grid grid-cols-2 gap-2">
                        <select value={expForm.endMonth} onChange={e => setExpForm({ ...expForm, endMonth: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">End month</option>{months.map(m => <option key={m}>{m}</option>)}</select>
                        <select value={expForm.endYear} onChange={e => setExpForm({ ...expForm, endYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">End year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
                      </div>}
                      <Input placeholder="Location (optional)" value={expForm.city} onChange={e => setExpForm({ ...expForm, city: e.target.value })} style={inputStyle} />
                      <textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value.slice(0, 500) })} placeholder="Description" rows={2} maxLength={500}
                        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#1A1A2E" }} />
                      <Input placeholder="Skills (comma separated)" value={expForm.skills} onChange={e => setExpForm({ ...expForm, skills: e.target.value })} style={inputStyle} />
                    </>} />
                  </div>
                )}</AnimatePresence>
              </>
            ) : (
              currentExp ? (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white" style={{ background: hashColor(currentExp.company_name || "") }}>{(currentExp.company_name || "?")[0]}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "#1A1A2E" }}>{currentExp.company_name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#6B7094" }}>{currentExp.job_title || currentExp.title}</p>
                  </div>
                </div>
              ) : <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No experience added</p>
            )}
          </GlassBox>

          {/* Education Box */}
          <GlassBox accent="education" expanded={expandedBox === "education"} onClick={() => !showAddEdu && toggleBox("education")} spanFull>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5" style={{ color: "#34C759" }} /><h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Education</h2></div>
              {isOwnProfile && <button type="button" onClick={e => { e.stopPropagation(); setShowAddEdu(true); setExpandedBox("education"); }} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}><Plus className="w-3 h-3 inline mr-0.5" /> Add</button>}
            </div>
            {expandedBox === "education" ? (
              <>
                {education.length === 0 && !showAddEdu && <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No education added</p>}
                <div className="relative pl-6 mt-1">
                  {education.length > 0 && <div className="absolute left-[7px] top-2 bottom-2 w-[2px]" style={{ background: "linear-gradient(to bottom, #34C759, rgba(52,199,89,0.15))" }} />}
                  {education.map((edu: any, idx: number) => (
                    <div key={edu.id} className="relative flex gap-3 py-2 group" style={{ borderBottom: idx < education.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                      <div className="absolute -left-6 top-3 w-3 h-3 rounded-full border-2 z-10" style={{ background: edu.is_current ? "#34C759" : "#fff", borderColor: "#34C759" }} />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,199,89,0.08)" }}><GraduationCap className="w-4 h-4" style={{ color: "#34C759" }} /></div>
                      <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{edu.institution_name_edu || edu.institution_name}</p>
                        <p className="text-[12px]" style={{ color: "#6B7094" }}>{edu.degree_type || edu.title}{edu.field_of_study ? ` · ${edu.field_of_study}` : ""}</p>
                        <p className="text-[11px]" style={{ color: "#6B7094" }}>{edu.start_year || ""}{edu.start_year && (edu.is_current || edu.end_year) ? " – " : ""}{edu.is_current ? "Present" : edu.end_year || ""}</p>
                        {edu.grade_score && <p className="text-[11px]" style={{ color: "#6B7094" }}>Grade: {edu.grade_score}</p>}
                        <VerifBadge item={{ ...edu, item_type: "education" }} isOwn={isOwnProfile} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
                      </div>
                      {isOwnProfile && (
                        <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => toggleVisibility(edu.id, "work_items", edu.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}>{edu.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                          <button type="button" onClick={() => deleteItem(edu.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {education.length > 2 && <button type="button" className="text-[12px] font-semibold mt-1" style={{ color: "#E8733A" }}>See all {education.length} →</button>}
                <AnimatePresence>{showAddEdu && (
                  <div onClick={e => e.stopPropagation()}>
                    <InlineForm title="Add Education" saving={saving} onSave={saveEducation} onCancel={() => setShowAddEdu(false)} fields={<>
                      <Input placeholder="Institution Name *" value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} style={inputStyle} />
                      <Input placeholder="Degree / Program" value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} style={inputStyle} />
                      <Input placeholder="Branch / Specialisation" value={eduForm.branch} onChange={e => setEduForm({ ...eduForm, branch: e.target.value })} style={inputStyle} />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={eduForm.startYear} onChange={e => setEduForm({ ...eduForm, startYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">Start year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
                        {!eduForm.isCurrent && <select value={eduForm.endYear} onChange={e => setEduForm({ ...eduForm, endYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">End year</option>{years.map(y => <option key={y}>{y}</option>)}</select>}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={eduForm.isCurrent} onChange={e => setEduForm({ ...eduForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "#6B7094" }}>Currently studying here</span></label>
                      <Input placeholder="Grade / CGPA" value={eduForm.grade} onChange={e => setEduForm({ ...eduForm, grade: e.target.value })} style={inputStyle} />
                    </>} />
                  </div>
                )}</AnimatePresence>
              </>
            ) : (
              education.length > 0 ? (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,199,89,0.08)" }}><GraduationCap className="w-4 h-4" style={{ color: "#34C759" }} /></div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "#1A1A2E" }}>{education[0].institution_name_edu || education[0].institution_name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#6B7094" }}>{education[0].degree_type || education[0].title}</p>
                  </div>
                </div>
              ) : <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No education added</p>
            )}
          </GlassBox>

          {/* Projects Box */}
          <GlassBox accent="projects" expanded={expandedBox === "projects"} onClick={() => !showAddProject && toggleBox("projects")} spanFull>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Rocket className="w-5 h-5" style={{ color: "#FF6B9D" }} /><h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Projects</h2></div>
              {isOwnProfile && <button type="button" onClick={e => { e.stopPropagation(); setShowAddProject(true); setExpandedBox("projects"); }} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}><Plus className="w-3 h-3 inline mr-0.5" /> Add</button>}
            </div>
            {expandedBox === "projects" ? (
              <>
                {projects.length === 0 && !showAddProject && <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No projects added</p>}
                {projects.slice(0, 2).map((p: any, idx: number) => (
                  <div key={p.id} className="py-2 group" style={{ borderBottom: idx < Math.min(projects.length, 2) - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{p.title}</p>
                        {p.description && <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: "#6B7094" }}>{p.description}</p>}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: p.is_current ? "rgba(52,199,89,0.08)" : "rgba(107,112,148,0.08)", color: p.is_current ? "#34C759" : "#6B7094" }}>{p.is_current ? "Active" : "Completed"}</span>
                        {p.tech_stack?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{(p.tech_stack as string[]).slice(0, 4).map((s: string) => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,157,0.08)", color: "#FF6B9D" }}>{s}</span>)}</div>}
                        <VerifBadge item={{ ...p, item_type: "project" }} isOwn={isOwnProfile} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={() => toggleVisibility(p.id, "work_items", p.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}>{p.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                          <button type="button" onClick={() => deleteItem(p.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {projects.length > 2 && <button type="button" className="text-[12px] font-semibold mt-1" style={{ color: "#E8733A" }}>See all {projects.length} →</button>}
                <AnimatePresence>{showAddProject && (
                  <div onClick={e => e.stopPropagation()}>
                    <InlineForm title="Add Project" saving={saving} onSave={saveProject} onCancel={() => setShowAddProject(false)} fields={<>
                      <Input placeholder="Project Name *" value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={inputStyle} />
                      <Input placeholder="Organisation (optional)" value={projForm.org} onChange={e => setProjForm({ ...projForm, org: e.target.value })} style={inputStyle} />
                      <textarea value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value.slice(0, 500) })} placeholder="Description" rows={2} maxLength={500}
                        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#1A1A2E" }} />
                      <Input placeholder="Tech stack (comma separated)" value={projForm.techStack} onChange={e => setProjForm({ ...projForm, techStack: e.target.value })} style={inputStyle} />
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={projForm.isCurrent} onChange={e => setProjForm({ ...projForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "#6B7094" }}>Currently active</span></label>
                    </>} />
                  </div>
                )}</AnimatePresence>
              </>
            ) : (
              projects.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {projects.slice(0, 2).map(p => (
                    <span key={p.id} className="text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(255,107,157,0.08)", color: "#FF6B9D", border: "1px solid rgba(255,107,157,0.2)" }}>{p.title}</span>
                  ))}
                  {projects.length > 2 && <span className="text-[11px]" style={{ color: "#6B7094" }}>+{projects.length - 2} more</span>}
                </div>
              ) : <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No projects</p>
            )}
          </GlassBox>

          {/* Achievements Box */}
          <GlassBox accent="achievements" expanded={expandedBox === "achievements"} onClick={() => !showAddAchievement && toggleBox("achievements")} spanFull>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Award className="w-5 h-5" style={{ color: "#FFB800" }} /><h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Achievements</h2></div>
              {isOwnProfile && <button type="button" onClick={e => { e.stopPropagation(); setShowAddAchievement(true); setExpandedBox("achievements"); }} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}><Plus className="w-3 h-3 inline mr-0.5" /> Add</button>}
            </div>
            {expandedBox === "achievements" ? (
              <>
                {achievements.length === 0 && !showAddAchievement && <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>No achievements added</p>}
                {achievements.slice(0, 2).map((a: any, idx: number) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 group" style={{ borderBottom: idx < Math.min(achievements.length, 2) - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={e => e.stopPropagation()}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,184,0,0.08)" }}><Award className="w-4 h-4" style={{ color: "#FFB800" }} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{a.title}</p>
                      <p className="text-[11px]" style={{ color: "#6B7094" }}>{[a.issued_by, a.achievement_date].filter(Boolean).join(" · ")}</p>
                    </div>
                    {a.certificate_url && <a href={a.certificate_url} target="_blank" rel="noopener" className="text-[11px] font-bold" style={{ color: "#E8733A" }}>View</a>}
                    {isOwnProfile && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => toggleVisibility(a.id, "achievements", a.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}>{a.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                        <button type="button" onClick={() => deleteItem(a.id, "achievements")} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
                {achievements.length > 2 && <button type="button" className="text-[12px] font-semibold mt-1" style={{ color: "#E8733A" }}>See all {achievements.length} →</button>}
                <AnimatePresence>{showAddAchievement && (
                  <div onClick={e => e.stopPropagation()}>
                    <InlineForm title="Add Achievement" saving={saving} onSave={saveAchievement} onCancel={() => setShowAddAchievement(false)} fields={<>
                      <Input placeholder="Title *" value={achForm.title} onChange={e => setAchForm({ ...achForm, title: e.target.value })} style={inputStyle} />
                      <Input placeholder="Issued by" value={achForm.issuedBy} onChange={e => setAchForm({ ...achForm, issuedBy: e.target.value })} style={inputStyle} />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={achForm.dateMonth} onChange={e => setAchForm({ ...achForm, dateMonth: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select>
                        <select value={achForm.dateYear} onChange={e => setAchForm({ ...achForm, dateYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none" style={selectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
                      </div>
                      <Input placeholder="Credential URL (optional)" value={achForm.url} onChange={e => setAchForm({ ...achForm, url: e.target.value })} style={inputStyle} />
                    </>} />
                  </div>
                )}</AnimatePresence>
              </>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[14px] font-bold" style={{ color: "#1A1A2E" }}>{achievements.length}</span>
                <span className="text-[12px]" style={{ color: "#6B7094" }}>achievements</span>
                {achievements[0] && <span className="text-[12px] font-semibold" style={{ color: "#FFB800" }}>· {achievements[0].title}</span>}
              </div>
            )}
          </GlassBox>

          {/* Skills Box */}
          <GlassBox accent="skills" expanded={expandedBox === "skills"} onClick={() => !showAddSkill && toggleBox("skills")} spanFull>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Code2 className="w-5 h-5" style={{ color: "#8B5CF6" }} /><h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Skills</h2></div>
              {isOwnProfile && <button type="button" onClick={e => { e.stopPropagation(); setShowAddSkill(true); setExpandedBox("skills"); }} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}><Plus className="w-3 h-3 inline mr-0.5" /> Add</button>}
            </div>
            {expandedBox === "skills" ? (
              <div onClick={e => e.stopPropagation()} className="mt-1">
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s: string) => (
                    <span key={s} className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1 rounded-full" style={{ border: "1.5px solid #8B5CF6", color: "#8B5CF6", background: "rgba(139,92,246,0.06)" }}>
                      {s}
                      {isOwnProfile && <button type="button" onClick={() => removeSkill(s)} className="cursor-pointer ml-0.5"><X className="w-3 h-3" /></button>}
                    </span>
                  ))}
                </div>
                {showAddSkill && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Type a skill..." className="flex-1" onKeyDown={e => { if (e.key === "Enter") addSkill(); }} />
                    <Button size="sm" onClick={addSkill}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(false)}>Cancel</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {skills.slice(0, 5).map(s => <span key={s} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.06)", color: "#8B5CF6" }}>{s}</span>)}
                {skills.length > 5 && <span className="text-[11px]" style={{ color: "#6B7094" }}>+{skills.length - 5} more</span>}
                {skills.length === 0 && <span className="text-[13px]" style={{ color: "#6B7094" }}>No skills added</span>}
              </div>
            )}
          </GlassBox>

          {/* Posts Box */}
          <GlassBox accent="posts" expanded={expandedBox === "posts"} onClick={() => toggleBox("posts")} spanFull>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: "#E8733A" }} />
              <h2 className="text-[15px] font-semibold" style={{ color: "#1A1A2E" }}>Posts</h2>
            </div>
            {expandedBox === "posts" ? (
              <div className="mt-1">
                {userPosts.length === 0 ? <p className="text-[13px]" style={{ color: "#6B7094" }}>No posts yet</p> : userPosts.slice(0, 2).map((p: any, idx: number) => (
                  <Link key={p.id} to={`/post/${p.id}`} className="block py-2" style={{ borderBottom: idx < Math.min(userPosts.length, 2) - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={e => e.stopPropagation()}>
                    <p className="text-[13px] line-clamp-2" style={{ color: "#1A1A2E" }}>{p.content}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#6B7094" }}>{p.created_at ? getTimeAgo(new Date(p.created_at)) : ""} · {p.comment_count || 0} comments</p>
                  </Link>
                ))}
                {userPosts.length > 2 && <Link to="/app/feed" className="text-[12px] font-semibold mt-1 block" style={{ color: "#E8733A" }}>See all posts →</Link>}
              </div>
            ) : (
              <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>{stats.posts} posts</p>
            )}
          </GlassBox>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} onSaved={loadProfile} />

      {/* Get Tiiked Modal */}
      {user && <GetTiikedModal open={showGetTiiked} onClose={() => setShowGetTiiked(false)} userId={user.id} userRole={role} onVerified={loadProfile} />}
    </div>
  );
};

export default Profile;
