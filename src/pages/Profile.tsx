import { useState, useEffect, useRef } from "react";
import { MapPin, Copy, Shield, Layers, Users, X, Settings, MessageCircle, CheckCircle, Calendar, Globe, Send, Share2, ArrowRight, Building2, Languages, ExternalLink, Clock, Eye, Briefcase, Plus, Link2 } from "lucide-react";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import AchievementsTab from "@/components/profile/AchievementsTab";
import CustomLinks from "@/components/profile/CustomLinks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const tabs = ["Work & Projects", "Achievements", "Posts"] as const;

const allIndianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const EditProfileDrawer = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: "", headline: "", bio: "", city: "", state: "", username: "", open_to_work: false, avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [customLinks, setCustomLinks] = useState<{ url: string; label: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          city: data.location_city || "",
          state: data.location_state || "",
          username: data.username || "",
          open_to_work: data.open_to_work || false,
          avatar_url: data.avatar_url || "",
        });
        setCustomLinks(Array.isArray(data.custom_links) ? (data.custom_links as any[]).map(l => ({ url: l.url || "", label: l.label || "" })) : []);
      }
    };
    load();
  }, [open]);

  const addLink = () => { if (customLinks.length < 5) setCustomLinks([...customLinks, { url: "", label: "" }]); };
  const updateLink = (i: number, key: string, val: string) => {
    const updated = [...customLinks];
    updated[i] = { ...updated[i], [key]: val };
    setCustomLinks(updated);
  };
  const removeLink = (i: number) => setCustomLinks(customLinks.filter((_, idx) => idx !== i));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("JPEG, PNG, or WebP only"); return; }
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(r => img.onload = r);
    const size = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 400, 400);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob) { toast.error("Processing failed"); return; }
    const path = `${userId}/avatar.webp`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
    if (uploadErr) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    setForm(p => ({ ...p, avatar_url: avatarUrl }));
    toast.success("Avatar updated ✓");
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.name,
      headline: form.headline.slice(0, 80),
      bio: form.bio.slice(0, 300),
      username: form.username.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
      location_city: form.city,
      location_state: form.state,
      open_to_work: form.open_to_work,
      custom_links: customLinks.filter(l => l.url) as any,
    }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile updated ✓");
    await refreshProfile();
    onSaved();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        className="w-full sm:w-[400px] h-full sm:h-auto sm:max-h-[90vh] rounded-l-[24px] sm:rounded-[20px] p-6 sm:p-8 overflow-y-auto glass-card"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : form.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Click to change avatar</p>
        </div>
        <div className="space-y-4">
          <div><label className="micro-label block mb-1.5">Display name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <label className="micro-label block mb-1.5">Headline (80 chars)</label>
            <Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value.slice(0, 80) })} maxLength={80} />
            <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{form.headline.length}/80</p>
          </div>
          <div>
            <label className="micro-label block mb-1.5">Bio (300 chars)</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value.slice(0, 300) })} placeholder="Tell people about yourself..." rows={3} maxLength={300}
              className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
            <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{form.bio.length}/300</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: "var(--text-3)" }}>@</span>
            <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="micro-label block mb-1.5">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div>
              <label className="micro-label block mb-1.5">State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-10 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}>
                <option value="">Select</option>
                {allIndianStates.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <span className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>Open to work</span>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Show green dot on your profile</p>
            </div>
            <button onClick={() => setForm({ ...form, open_to_work: !form.open_to_work })}
              className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95"
              style={{ background: form.open_to_work ? "var(--brand)" : "var(--border-2)", transition: "all 0.2s" }}>
              <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: form.open_to_work ? "translateX(20px)" : "translateX(0)" }} />
            </button>
          </div>
          <div>
            <label className="micro-label block mb-1.5">Custom Links</label>
            <div className="space-y-2">
              {customLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="URL" value={link.url} onChange={e => updateLink(i, "url", e.target.value)} className="flex-1" />
                  <Input placeholder="Display text" value={link.label} onChange={e => updateLink(i, "label", e.target.value)} className="flex-1" />
                  <button onClick={() => removeLink(i)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
                </div>
              ))}
              {customLinks.length < 5 && (
                <button onClick={addLink} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>+ Add another link</button>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AddWorkForm = ({ userId, role, institution, onSaved, onClose }: { userId?: string; role: string; institution: string; onSaved: () => void; onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [techStack, setTechStack] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputS: React.CSSProperties = { background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, color: "var(--text-1)", height: 44 };
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = Array.from({ length: 15 }, (_, i) => String(2026 - i));

  const handleSave = async () => {
    if (!title.trim() || !userId) return;
    setSaving(true);
    const startDate = startMonth && startYear ? `${startYear}-${String(months.indexOf(startMonth) + 1).padStart(2, "0")}-01` : null;
    const endDate = !isCurrent && endMonth && endYear ? `${endYear}-${String(months.indexOf(endMonth) + 1).padStart(2, "0")}-01` : null;
    const { error } = await supabase.from("work_items").insert({
      owner_id: userId, title: title.trim(), description: description.trim(),
      type: type || "project", institution_name: institution,
      tech_stack: techStack ? techStack.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "active", visibility: "public",
      start_date: startDate, end_date: endDate, is_current: isCurrent,
    });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Project added ✓");
    onSaved();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Add project</h2>
        <button onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4">
        <Input placeholder="Project title *" value={title} onChange={e => setTitle(e.target.value)} style={inputS} />
        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={inputS}>
          <option value="">Type</option>
          <option value="software">💻 Software / App</option>
          <option value="research">🔬 Research</option>
          <option value="hardware">⚡ Hardware / IoT</option>
          <option value="design">📐 Design</option>
          <option value="internship">💼 Internship</option>
          <option value="other">📝 Other</option>
        </select>
        <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 300))} placeholder="Short description (300 chars)" rows={3} maxLength={300}
          className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
        <Input placeholder="Tech stack (comma separated)" value={techStack} onChange={e => setTechStack(e.target.value)} style={inputS} />
        
        {/* Duration */}
        <div>
          <label className="micro-label block mb-2">Duration</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <option value="">From month</option>{months.map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={startYear} onChange={e => setStartYear(e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <option value="">From year</option>{years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {!isCurrent && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="">To month</option>{months.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={endYear} onChange={e => setEndYear(e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="">To year</option>{years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} className="rounded" />
            <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>Present / Ongoing</span>
          </label>
        </div>
        
        <Button className="w-full" onClick={handleSave} disabled={saving || !title.trim()}>{saving ? "Saving..." : "Save project"}</Button>
      </div>
    </>
  );
};

const ROLE_COLOR_MAP: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E", builder: "#7C3AED", aspirant: "#374151" };

const Profile = () => {
  const { id: urlUserId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Work & Projects");
  const [editOpen, setEditOpen] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const { profile: authProfile, initials: authInitials, displayName: authDisplayName, refreshProfile, user, loading: authLoading } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ projects: 0, workspaces: 0, strands: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const navigate = useNavigate();

  const isOwnProfile = !urlUserId || urlUserId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : urlUserId;

  const loadProfile = async () => {
    if (!targetUserId) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);

    const [profileRes, itemsRes, strandCountRes, postsRes, achvsRes, wsCountRes] = await Promise.allSettled([
      isOwnProfile ? Promise.resolve({ data: authProfile }) : supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle(),
      supabase.from("work_items").select("*").eq("owner_id", targetUserId).order("created_at", { ascending: false }),
      supabase.from("strands").select("*", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("*").eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(20),
      supabase.from("achievements").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      supabase.from("workspace_members").select("*", { count: "exact", head: true }).eq("user_id", targetUserId),
    ]);

    const profile = profileRes.status === "fulfilled" ? (profileRes.value as any).data : null;
    const items = itemsRes.status === "fulfilled" ? (itemsRes.value as any).data : [];
    const strandCount = strandCountRes.status === "fulfilled" ? (strandCountRes.value as any).count : 0;
    const posts = postsRes.status === "fulfilled" ? (postsRes.value as any).data : [];
    const achvs = achvsRes.status === "fulfilled" ? (achvsRes.value as any).data : [];
    const wsCount = wsCountRes.status === "fulfilled" ? (wsCountRes.value as any).count : 0;

    setViewedProfile(profile || (isOwnProfile ? authProfile : null));
    setWorkItems(items || []);
    setUserPosts(posts || []);
    setAchievements(achvs || []);
    setStats({ projects: items?.length || 0, workspaces: wsCount || 0, strands: strandCount || 0 });
    setDataLoading(false);
  };

  useEffect(() => {
    if (!authLoading) void loadProfile();
  }, [targetUserId, authLoading, authProfile]);

  if (authLoading || dataLoading) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-7 space-y-4">
        <div className="t-card p-6 animate-pulse">
          <div className="h-24 rounded-xl" style={{ background: "var(--surface-2)" }} />
          <div className="flex items-end gap-4 -mt-12 px-6">
            <div className="w-24 h-24 rounded-full" style={{ background: "var(--surface-2)" }} />
            <div className="flex-1 space-y-2 pb-1">
              <div className="h-6 w-40 rounded" style={{ background: "var(--surface-2)" }} />
              <div className="h-4 w-24 rounded" style={{ background: "var(--surface-2)" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && isOwnProfile) return null;

  const profileData = viewedProfile || authProfile;

  if (!profileData?.full_name && isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-bold text-white mb-4" style={{ background: "var(--brand)" }}>
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <h1 className="text-[22px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Set up your profile</h1>
        <p className="text-[14px] mb-2" style={{ color: "var(--text-2)" }}>{user?.email}</p>
        <p className="text-[13px] mb-6 text-center max-w-xs" style={{ color: "var(--text-3)" }}>Add your name, location, and details so people can find and connect with you.</p>
        <button onClick={() => navigate("/signup")} className="px-6 py-3 rounded-xl font-bold text-sm text-white cursor-pointer active:scale-95 transition-transform" style={{ background: "#E8580A" }}>
          Complete your profile →
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Profile not found</p>
        <button onClick={() => navigate("/app/explore")} className="text-[13px] mt-2" style={{ color: "var(--brand)" }}>← Back to Explore</button>
      </div>
    );
  }

  const displayName = profileData.full_name || authDisplayName || "";
  const username = profileData.username || "";
  const headline = profileData.headline || "";
  const bio = profileData.bio || "";
  const institution = profileData.institution_name || "";
  const city = profileData.location_city || "";
  const state = profileData.location_state || "";
  const role = profileData.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const initials = displayName ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : authInitials || "U";
  const roleColor = ROLE_COLOR_MAP[role] || "#4F46E5";
  const isVerified = profileData.is_verified === true;
  const activityScore = profileData.activity_score || 0;

  const statusColors: Record<string, { dot: string; accent: string; label: string }> = {
    active: { dot: "var(--brand)", accent: "var(--open-green)", label: "Active" },
    completed: { dot: "var(--open-green)", accent: "var(--brand)", label: "Completed" },
    paused: { dot: "#F59E0B", accent: "#F59E0B", label: "Paused" },
  };

  const handleCopyLink = async () => {
    const url = window.location.origin + "/" + username;
    await navigator.clipboard.writeText(url);
    toast.success(`Profile link copied! tiikme.in/${username}`);
  };

  const handleStrand = async () => {
    if (!user || !targetUserId) return;
    const { error } = await supabase.from("strands").insert({ requester_id: user.id, receiver_id: targetUserId });
    if (error) toast.error("Failed to send request");
    else toast.success("Strand request sent ✓");
  };

  const formatDuration = (startDate: string | null, endDate: string | null, isCurrent: boolean) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fmt = (d: string) => { const dt = new Date(d); return `${months[dt.getMonth()]} ${dt.getFullYear()}`; };
    if (!startDate) return "";
    const start = fmt(startDate);
    if (isCurrent) return `${start} – Present`;
    if (endDate) return `${start} – ${fmt(endDate)}`;
    return start;
  };

  return (
    <div className="max-w-[760px] mx-auto px-0 md:px-4 py-0 md:py-7 space-y-0">
      {/* ═══ PROFILE HERO CARD ═══ */}
      <div className="t-card overflow-hidden relative" style={{ borderRadius: "0px" }}>
        <div className="h-[100px] relative" style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${roleColor} 40%, var(--surface)) 0%, color-mix(in srgb, ${roleColor} 15%, var(--surface)) 50%, var(--surface) 100%)`,
        }}>
          {isVerified && (
            <div className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
              <Shield className="w-3 h-3" /> Tiik Approved
            </div>
          )}
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className={`relative ${isOwnProfile ? "group cursor-pointer" : ""}`} onClick={() => isOwnProfile && setEditOpen(true)}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-[30px] font-extrabold text-white shrink-0 overflow-hidden"
                style={{
                  backgroundColor: roleColor,
                  border: "3px solid var(--surface)",
                  boxShadow: isVerified
                    ? "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)"
                    : "0 0 0 2px var(--surface), 0 4px 12px rgba(0,0,0,0.2)",
                }}>
                {profileData.avatar_url ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              {isOwnProfile && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{displayName}</h1>
                {isVerified && (
                  <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "#F59E0B" }}>
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor, border: `1px solid ${roleColor}33` }}>{roleLabel}</span>
              </div>
              {username && <p className="text-[12px] font-mono" style={{ color: "var(--text-3)" }}>@{username}</p>}
            </div>
          </div>

          {profileData.open_to_work && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--open-green)", animation: "statusPulse 2s infinite" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--open-green)" }}>Open to work</span>
            </div>
          )}

          {headline && <p className="text-[14px] mt-2 line-clamp-1" style={{ color: "var(--text-2)" }}>{headline}</p>}

          {/* Bio — merged from About tab */}
          {bio && (
            <div className="mt-2">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {bioExpanded || bio.length <= 150 ? bio : bio.slice(0, 150) + "..."}
              </p>
              {bio.length > 150 && (
                <button onClick={() => setBioExpanded(!bioExpanded)} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>
                  {bioExpanded ? "show less" : "...see more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {institution && (
              <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <Building2 className="w-3 h-3" /> {institution}
              </span>
            )}
            {(city || state) && (
              <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <MapPin className="w-3 h-3" /> {[city, state].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          <div className="mt-2">
            <CustomLinks links={Array.isArray(profileData.custom_links) ? (profileData.custom_links as any[]) : []} />
          </div>

          {/* Action buttons — different for own vs other */}
          <div className="flex gap-2 mt-4">
            {isOwnProfile ? (
              <>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={handleCopyLink}><Copy className="w-3.5 h-3.5" /> Copy link</Button>
                <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditOpen(true)}><Settings className="w-3.5 h-3.5" /> Edit profile</Button>
              </>
            ) : (
              <>
                <Button size="sm" className="gap-1.5 rounded-full" onClick={handleStrand}><Link2 className="w-3.5 h-3.5" /> Strand</Button>
                <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => navigate("/app/pings")}><MessageCircle className="w-3.5 h-3.5" /> Ping</Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setActiveTab("Work & Projects")} className="text-center cursor-pointer">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.projects}</p>
              <p className="micro-label mt-0.5">Projects</p>
            </button>
            <div className="text-center">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.workspaces}</p>
              <p className="micro-label mt-0.5">Workspaces</p>
            </div>
            <Link to="/app/strands" className="text-center">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.strands}</p>
              <p className="micro-label mt-0.5">Strands</p>
            </Link>
            <div className="ml-auto">
              <ActivityScoreRing score={activityScore} size={44} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="t-card mt-0 overflow-hidden" style={{ borderRadius: 0 }}>
        <div className="flex overflow-x-auto scrollbar-hide px-6" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="py-3.5 px-4 text-[13px] font-semibold relative whitespace-nowrap transition-all duration-200 cursor-pointer"
              style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-2)", fontWeight: activeTab === tab ? 700 : 600, borderBottom: activeTab === tab ? "3px solid var(--brand)" : "3px solid transparent" }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "Work & Projects" && (
            <div className="relative">
              {workItems.length === 0 ? (
                <EmptyState icon={Layers} title="No projects yet" description={isOwnProfile ? "Add your first project or work item to build your verified portfolio." : "This user hasn't added any projects yet."} actionLabel={isOwnProfile ? "+ Add project" : undefined} onAction={isOwnProfile ? () => setShowAddWork(true) : undefined} />
              ) : (
                <>
                  <div className="absolute left-[11px] top-5 bottom-16 w-[2px]" style={{ background: "var(--border-2)" }} />
                  <div className="space-y-3.5">
                    {workItems.map((p: any) => {
                      const sc = statusColors[p.status] || statusColors.active;
                      const duration = formatDuration(p.start_date, p.end_date, p.is_current);
                      return (
                        <div key={p.id} className="flex gap-4 relative">
                          <div className="w-6 flex justify-center pt-5 shrink-0 z-10">
                            <div className="w-[10px] h-[10px] rounded-full" style={{ background: sc.dot, border: "2px solid var(--surface)" }} />
                          </div>
                          <div className="flex-1 t-card t-card-hover overflow-hidden cursor-pointer" style={{ borderLeft: `4px solid ${sc.accent}` }}>
                            <div className="flex items-start gap-3 px-4 pt-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
                                <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{p.title}</span>
                                  {p.is_tiik_approved && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                                      <Shield className="w-2.5 h-2.5" /> Tiik Approved
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{sc.label}</span>
                                </div>
                                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                                  {[p.institution_name, p.role_in_work, p.type].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </div>
                            {p.description && <p className="px-4 pt-1.5 text-[13px] line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>}
                            {p.tech_stack?.length > 0 && (
                              <div className="flex flex-wrap gap-1 px-4 pt-2">
                                {p.tech_stack.slice(0, 4).map((t: string) => <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{t}</span>)}
                                {p.tech_stack.length > 4 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--brand)", border: "1px solid var(--border)" }}>+{p.tech_stack.length - 4}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-3 px-4 py-3 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Eye className="w-3 h-3" /> {p.total_views || 0}</span>
                              {duration && <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Calendar className="w-3 h-3" /> {duration}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {isOwnProfile && (
                <button onClick={() => setShowAddWork(true)} className="flex items-center justify-center gap-1.5 mt-5 py-3 t-card t-card-hover text-[13px] font-semibold w-full" style={{ color: "var(--brand)" }}>
                  <Plus className="w-4 h-4" /> Add new project
                </button>
              )}
            </div>
          )}

          {activeTab === "Achievements" && <AchievementsTab isOwnProfile={isOwnProfile} achievements={achievements} userId={targetUserId} onRefresh={loadProfile} />}

          {activeTab === "Posts" && (
            userPosts.length === 0 ? (
              <EmptyState icon={MessageCircle} title="No posts yet" description={isOwnProfile ? "Posts you share on the feed will appear here." : "This user hasn't posted anything yet."} />
            ) : (
              <div className="space-y-3">
                {userPosts.map((post: any) => (
                  <div key={post.id} className="t-card p-4">
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-1)" }}>{post.content}</p>
                    {post.image_urls?.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {post.image_urls.slice(0, 3).map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                        {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                        {(post.reactions?.useful || 0) + (post.reactions?.insightful || 0) + (post.reactions?.inspiring || 0)} reactions
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                        {post.comment_count || 0} comments
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <AnimatePresence>
        {editOpen && isOwnProfile && <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} onSaved={loadProfile} />}
      </AnimatePresence>

      {showAddWork && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowAddWork(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[20px] p-6 glass-card mx-4"
            onClick={e => e.stopPropagation()}>
            <AddWorkForm userId={user?.id} role={profileData?.role || "student"} institution={profileData?.institution_name || ""} onSaved={() => { setShowAddWork(false); loadProfile(); }} onClose={() => setShowAddWork(false)} />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
