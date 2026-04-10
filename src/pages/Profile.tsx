import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Copy, Shield, Layers, X, MessageCircle, CheckCircle, Building2, Link2, Plus, Pencil, Trash2, Briefcase, GraduationCap, Award, Code2, GripVertical, Eye, EyeOff } from "lucide-react";
import GetTiikedModal from "@/components/profile/GetTiikedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ROLE_COLOR_MAP: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E", builder: "#7C3AED", aspirant: "#374151" };
const allIndianStates = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const years = Array.from({ length: 20 }, (_, i) => String(2026 - i));

const DEFAULT_SECTION_ORDER = ["experience","education","projects","achievements","skills","posts"];

/* ── Section Header ── */
const SectionHeader = ({ title, icon: Icon, onAdd, showAdd }: { title: string; icon: any; onAdd?: () => void; showAdd?: boolean }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-6 rounded-full" style={{ background: "var(--brand)" }} />
      <Icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
      <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)" }}>{title}</h2>
    </div>
    {showAdd && onAdd && (
      <button onClick={onAdd} className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer active:scale-95" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
        <Plus className="w-3 h-3" /> Add
      </button>
    )}
  </div>
);

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
    toast.success("Avatar updated ✓");
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
    toast.success("Profile updated ✓");
    await refreshProfile();
    onSaved(); onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        className="w-full sm:w-[400px] h-full sm:h-auto sm:max-h-[90vh] rounded-l-[24px] sm:rounded-[20px] p-6 overflow-y-auto glass-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-4 mb-5 cursor-pointer" onClick={() => avatarRef.current?.click()}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
            {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Click to change avatar</p>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="space-y-4">
          <div><label className="micro-label block mb-1.5">Display name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="micro-label block mb-1.5">Headline (80 chars)</label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value.slice(0, 80) })} maxLength={80} /></div>
          <div><label className="micro-label block mb-1.5">Bio (300 chars)</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value.slice(0, 300) })} rows={3} maxLength={300}
              className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
          </div>
          <div className="flex items-center gap-2"><span className="text-[13px]" style={{ color: "var(--text-3)" }}>@</span><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} className="flex-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="micro-label block mb-1.5">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="micro-label block mb-1.5">State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-10 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}>
                <option value="">Select</option>{allIndianStates.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <span className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>Open to work</span>
            <button onClick={() => setForm({ ...form, open_to_work: !form.open_to_work })} className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
              style={{ background: form.open_to_work ? "var(--brand)" : "var(--border-2)" }}>
              <div className="w-5 h-5 rounded-full bg-white" style={{ transform: form.open_to_work ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s" }} />
            </button>
          </div>
          <div>
            <label className="micro-label block mb-1.5">Custom Links</label>
            {customLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <Input placeholder="URL" value={link.url} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], url: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <Input placeholder="Label" value={link.label} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], label: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <button onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
              </div>
            ))}
            {customLinks.length < 5 && <button onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>+ Add link</button>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Inline Add Form ── */
const InlineForm = ({ title, fields, onSave, onCancel, saving }: { title: string; fields: React.ReactNode; onSave: () => void; onCancel: () => void; saving: boolean }) => (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
    className="t-card p-4 mt-3" style={{ borderLeft: "3px solid var(--brand)" }}>
    <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>{title}</h3>
    <div className="space-y-3">{fields}</div>
    <div className="flex gap-2 mt-4">
      <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  </motion.div>
);

const formatDuration = (start: string | null, end: string | null, isCurrent: boolean) => {
  const fmt = (d: string) => { const dt = new Date(d); return `${months[dt.getMonth()]} ${dt.getFullYear()}`; };
  if (!start) return "";
  const startStr = fmt(start);
  const endStr = isCurrent ? "Present" : end ? fmt(end) : "";
  const durationStr = (() => {
    if (!start) return "";
    const s = new Date(start);
    const e = isCurrent ? new Date() : end ? new Date(end) : null;
    if (!e) return "";
    let mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (mo < 0) mo = 0;
    const yrs = Math.floor(mo / 12);
    const mos = mo % 12;
    const parts = [];
    if (yrs > 0) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
    if (mos > 0) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
    return parts.join(" ") || "< 1 mo";
  })();
  return `${startStr} – ${endStr}${durationStr ? ` · ${durationStr}` : ""}`;
};

const inputStyle: React.CSSProperties = { background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, color: "var(--text-1)", height: 44 };

/* ── Sortable Section Wrapper ── */
const SortableSection = ({ id, children, isOwn }: { id: string; children: React.ReactNode; isOwn: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative group/section">
      {isOwn && (
        <div className="absolute -left-6 top-5 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" style={{ color: "var(--text-3)" }} />
        </div>
      )}
      {children}
    </div>
  );
};

const Profile = () => {
  const { id: urlUserId } = useParams<{ id: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const { profile: authProfile, initials: authInitials, displayName: authDisplayName, refreshProfile, user, loading: authLoading } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ projects: 0, strands: 0, posts: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const navigate = useNavigate();

  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [showGetTiiked, setShowGetTiiked] = useState(false);

  const [expForm, setExpForm] = useState({ company: "", title: "", type: "Full-time", industry: "", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", branch: "", startYear: "", endYear: "", isCurrent: false, grade: "" });
  const [projForm, setProjForm] = useState({ title: "", type: "software", description: "", techStack: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false });
  const [achForm, setAchForm] = useState({ title: "", issuedBy: "", date: "", description: "", url: "" });

  const isOwnProfile = !urlUserId || urlUserId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : urlUserId;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadProfile = useCallback(async () => {
    if (!targetUserId) { setDataLoading(false); return; }
    setDataLoading(true);
    const [profileRes, itemsRes, strandCountRes, postsRes, achvsRes] = await Promise.allSettled([
      isOwnProfile ? Promise.resolve({ data: authProfile }) : supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle(),
      supabase.from("work_items").select("*").eq("owner_id", targetUserId).order("is_current", { ascending: false }).order("start_date", { ascending: false }),
      supabase.from("strands").select("*", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("id, content, created_at, reactions, comment_count").eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(20),
      supabase.from("achievements").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }),
    ]);
    const profile = profileRes.status === "fulfilled" ? (profileRes.value as any).data : null;
    const items = itemsRes.status === "fulfilled" ? (itemsRes.value as any).data || [] : [];
    const strandCount = strandCountRes.status === "fulfilled" ? (strandCountRes.value as any).count || 0 : 0;
    const posts = postsRes.status === "fulfilled" ? (postsRes.value as any).data || [] : [];
    const achvs = achvsRes.status === "fulfilled" ? (achvsRes.value as any).data || [] : [];
    const p = profile || (isOwnProfile ? authProfile : null);
    setViewedProfile(p);
    setWorkItems(items);
    setUserPosts(posts);
    setAchievements(achvs);
    setStats({ projects: items.filter((i: any) => i.item_type === "project" || !i.item_type).length, strands: strandCount, posts: posts.length });
    // Load section order
    if (p?.section_order && Array.isArray(p.section_order)) {
      setSectionOrder(p.section_order as string[]);
    } else {
      setSectionOrder(DEFAULT_SECTION_ORDER);
    }
    setDataLoading(false);
  }, [targetUserId, isOwnProfile, authProfile]);

  useEffect(() => { if (!authLoading) loadProfile(); }, [authLoading, loadProfile]);

  if (authLoading || dataLoading) return (
    <div className="max-w-[760px] mx-auto px-4 py-7"><div className="t-card p-6 animate-pulse"><div className="h-[140px] rounded-xl" style={{ background: "var(--surface-2)" }} /></div></div>
  );
  if (!user && isOwnProfile) return null;

  const profileData = viewedProfile || authProfile;
  if (!profileData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Profile not found</p>
      <button onClick={() => navigate("/app/explore")} className="text-[13px] mt-2" style={{ color: "var(--brand)" }}>← Back to Explore</button>
    </div>
  );

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
  const skills: string[] = profileData.skills || [];

  // Sort experiences: current first, then by start_date desc
  const experiences = workItems.filter((w: any) => w.item_type === "experience").sort((a: any, b: any) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return (b.start_date || "").localeCompare(a.start_date || "");
  });
  const education = workItems.filter((w: any) => w.item_type === "education");
  const projects = workItems.filter((w: any) => w.item_type === "project" || (!w.item_type && w.title));

  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.origin + "/" + username); toast.success("Link copied!"); };
  const handleStrand = async () => { if (!user || !targetUserId) return; await supabase.from("strands").insert({ requester_id: user.id, receiver_id: targetUserId }); toast.success("Strand request sent ✓"); };

  const saveExperience = async () => {
    if (!expForm.company.trim() || !expForm.title.trim() || !user) return;
    setSaving(true);
    const startDate = expForm.startMonth && expForm.startYear ? `${expForm.startYear}-${String(months.indexOf(expForm.startMonth) + 1).padStart(2, "0")}-01` : null;
    const endDate = !expForm.isCurrent && expForm.endMonth && expForm.endYear ? `${expForm.endYear}-${String(months.indexOf(expForm.endMonth) + 1).padStart(2, "0")}-01` : null;
    const { error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: expForm.title.trim(), description: expForm.description.trim(),
      institution_name: expForm.company.trim(), type: expForm.type, item_type: "experience",
      start_date: startDate, end_date: endDate, is_current: expForm.isCurrent,
      tech_stack: expForm.skills ? expForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "active", visibility: "public",
    });
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Experience added ✓");
    setShowAddExp(false);
    setExpForm({ company: "", title: "", type: "Full-time", industry: "", city: "", isCurrent: true, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "", skills: "" });
    loadProfile();
  };

  const saveEducation = async () => {
    if (!eduForm.institution.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: eduForm.degree + (eduForm.branch ? ` · ${eduForm.branch}` : ""),
      institution_name: eduForm.institution.trim(), item_type: "education",
      start_date: eduForm.startYear ? `${eduForm.startYear}-01-01` : null,
      end_date: !eduForm.isCurrent && eduForm.endYear ? `${eduForm.endYear}-01-01` : null,
      is_current: eduForm.isCurrent, description: eduForm.grade ? `Grade: ${eduForm.grade}` : "",
      status: "active", visibility: "public",
    });
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Education added ✓");
    setShowAddEdu(false);
    loadProfile();
  };

  const saveProject = async () => {
    if (!projForm.title.trim() || !user) return;
    setSaving(true);
    const startDate = projForm.startMonth && projForm.startYear ? `${projForm.startYear}-${String(months.indexOf(projForm.startMonth) + 1).padStart(2, "0")}-01` : null;
    const endDate = !projForm.isCurrent && projForm.endMonth && projForm.endYear ? `${projForm.endYear}-${String(months.indexOf(projForm.endMonth) + 1).padStart(2, "0")}-01` : null;
    const { error } = await supabase.from("work_items").insert({
      owner_id: user.id, title: projForm.title.trim(), description: projForm.description.trim(),
      type: projForm.type, item_type: "project",
      tech_stack: projForm.techStack ? projForm.techStack.split(",").map(s => s.trim()).filter(Boolean) : [],
      start_date: startDate, end_date: endDate, is_current: projForm.isCurrent,
      status: "active", visibility: "public",
    });
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Project added ✓");
    setShowAddProject(false);
    loadProfile();
  };

  const saveAchievement = async () => {
    if (!achForm.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("achievements").insert({
      user_id: user.id, title: achForm.title.trim(), issued_by: achForm.issuedBy,
      achievement_date: achForm.date || null, description: achForm.description,
      certificate_url: achForm.url || null, type: "award",
    });
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Achievement added ✓");
    setShowAddAchievement(false);
    loadProfile();
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user) return;
    const updated = [...skills, newSkill.trim()];
    await supabase.from("profiles").update({ skills: updated } as any).eq("id", user.id);
    toast.success("Skill added");
    setNewSkill("");
    setShowAddSkill(false);
    await refreshProfile();
    loadProfile();
  };

  const removeSkill = async (skill: string) => {
    if (!user) return;
    const updated = skills.filter(s => s !== skill);
    await supabase.from("profiles").update({ skills: updated } as any).eq("id", user.id);
    await refreshProfile();
    loadProfile();
  };

  const deleteItem = async (id: string, table: "work_items" | "achievements") => {
    if (!confirm("Delete this item?")) return;
    await supabase.from(table).delete().eq("id", id);
    toast.success("Deleted");
    loadProfile();
  };

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;
    const oldIndex = sectionOrder.indexOf(active.id as string);
    const newIndex = sectionOrder.indexOf(over.id as string);
    const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
    setSectionOrder(newOrder);
    await supabase.from("profiles").update({ section_order: newOrder } as any).eq("id", user.id);
  };

  const sectionComponents: Record<string, React.ReactNode> = {
    experience: (
      <div className="t-card p-5">
        <SectionHeader title="Experience" icon={Briefcase} onAdd={() => setShowAddExp(true)} showAdd={isOwnProfile} />
        {experiences.length === 0 && !showAddExp && (
          <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}>
            <p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your work experience" : "No experience added yet"}</p>
          </div>
        )}
        {experiences.map((exp: any) => (
          <div key={exp.id} className="flex gap-3 py-3 group" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-2)" }}>
              <Briefcase className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{exp.title}</p>
                {exp.is_current && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Current</span>}
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{exp.institution_name}{exp.type ? ` · ${exp.type}` : ""}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{formatDuration(exp.start_date, exp.end_date, exp.is_current)}</p>
              {exp.description && <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>{exp.description}</p>}
              {exp.tech_stack?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{exp.tech_stack.map((s: string) => <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{s}</span>)}</div>}
            </div>
            {isOwnProfile && <button onClick={() => deleteItem(exp.id, "work_items")} className="opacity-0 group-hover:opacity-100 p-1 cursor-pointer self-start" style={{ color: "var(--text-3)" }}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <AnimatePresence>
          {showAddExp && (
            <InlineForm title="Add Experience" saving={saving} onSave={saveExperience} onCancel={() => setShowAddExp(false)} fields={<>
              <Input placeholder="Company / Organisation *" value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} style={inputStyle} />
              <Input placeholder="Job Title / Designation *" value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} style={inputStyle} />
              <select value={expForm.type} onChange={e => setExpForm({ ...expForm, type: e.target.value })} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={inputStyle}>
                {["Full-time","Part-time","Contract","Freelance","Internship","Apprenticeship"].map(t => <option key={t}>{t}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={expForm.startMonth} onChange={e => setExpForm({ ...expForm, startMonth: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Start month</option>{months.map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={expForm.startYear} onChange={e => setExpForm({ ...expForm, startYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Start year</option>{years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={expForm.isCurrent} onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "var(--text-2)" }}>I currently work here</span></label>
              {!expForm.isCurrent && <div className="grid grid-cols-2 gap-2">
                <select value={expForm.endMonth} onChange={e => setExpForm({ ...expForm, endMonth: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">End month</option>{months.map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={expForm.endYear} onChange={e => setExpForm({ ...expForm, endYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">End year</option>{years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>}
              <textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value.slice(0, 500) })} placeholder="Description (optional)" rows={2} maxLength={500}
                className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
              <Input placeholder="Skills used (comma separated)" value={expForm.skills} onChange={e => setExpForm({ ...expForm, skills: e.target.value })} style={inputStyle} />
            </>} />
          )}
        </AnimatePresence>
      </div>
    ),
    education: (
      <div className="t-card p-5">
        <SectionHeader title="Education" icon={GraduationCap} onAdd={() => setShowAddEdu(true)} showAdd={isOwnProfile} />
        {education.length === 0 && !showAddEdu && (
          <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}>
            <p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your education" : "No education added yet"}</p>
          </div>
        )}
        {education.map((edu: any) => (
          <div key={edu.id} className="flex gap-3 py-3 group" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-2)" }}><GraduationCap className="w-4 h-4" style={{ color: "var(--text-3)" }} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{edu.institution_name}</p>
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{edu.title}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{formatDuration(edu.start_date, edu.end_date, edu.is_current)}</p>
              {edu.description && <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>{edu.description}</p>}
            </div>
            {isOwnProfile && <button onClick={() => deleteItem(edu.id, "work_items")} className="opacity-0 group-hover:opacity-100 p-1 cursor-pointer self-start" style={{ color: "var(--text-3)" }}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <AnimatePresence>
          {showAddEdu && (
            <InlineForm title="Add Education" saving={saving} onSave={saveEducation} onCancel={() => setShowAddEdu(false)} fields={<>
              <Input placeholder="Institution Name *" value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} style={inputStyle} />
              <Input placeholder="Degree / Program *" value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} style={inputStyle} />
              <Input placeholder="Branch / Specialisation" value={eduForm.branch} onChange={e => setEduForm({ ...eduForm, branch: e.target.value })} style={inputStyle} />
              <div className="grid grid-cols-2 gap-2">
                <select value={eduForm.startYear} onChange={e => setEduForm({ ...eduForm, startYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Start year</option>{years.map(y => <option key={y}>{y}</option>)}
                </select>
                <select value={eduForm.endYear} onChange={e => setEduForm({ ...eduForm, endYear: e.target.value })} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">End year</option>{years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={eduForm.isCurrent} onChange={e => setEduForm({ ...eduForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "var(--text-2)" }}>Currently studying here</span></label>
              <Input placeholder="Grade / CGPA (optional)" value={eduForm.grade} onChange={e => setEduForm({ ...eduForm, grade: e.target.value })} style={inputStyle} />
            </>} />
          )}
        </AnimatePresence>
      </div>
    ),
    projects: (
      <div className="t-card p-5">
        <SectionHeader title="Projects" icon={Layers} onAdd={() => setShowAddProject(true)} showAdd={isOwnProfile} />
        {projects.length === 0 && !showAddProject && (
          <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}><p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your first project" : "No projects yet"}</p></div>
        )}
        {projects.map((p: any) => (
          <div key={p.id} className="flex gap-3 py-3 group" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}><Layers className="w-4 h-4" style={{ color: "var(--brand)" }} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{p.title}</p>
                {p.is_tiik_approved && <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}><Shield className="w-2.5 h-2.5" /> Tiiked</span>}
              </div>
              {p.type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{p.type}</span>}
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{formatDuration(p.start_date, p.end_date, p.is_current)}</p>
              {p.description && <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>}
              {p.tech_stack?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{p.tech_stack.map((s: string) => <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{s}</span>)}</div>}
            </div>
            {isOwnProfile && <button onClick={() => deleteItem(p.id, "work_items")} className="opacity-0 group-hover:opacity-100 p-1 cursor-pointer self-start" style={{ color: "var(--text-3)" }}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <AnimatePresence>
          {showAddProject && (
            <InlineForm title="Add Project" saving={saving} onSave={saveProject} onCancel={() => setShowAddProject(false)} fields={<>
              <Input placeholder="Project title *" value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={inputStyle} />
              <select value={projForm.type} onChange={e => setProjForm({ ...projForm, type: e.target.value })} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={inputStyle}>
                <option value="software">💻 Software</option><option value="research">🔬 Research</option><option value="hardware">⚡ Hardware</option><option value="design">📐 Design</option><option value="other">📝 Other</option>
              </select>
              <textarea value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value.slice(0, 300) })} placeholder="Description" rows={2} maxLength={300}
                className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
              <Input placeholder="Tech stack (comma separated)" value={projForm.techStack} onChange={e => setProjForm({ ...projForm, techStack: e.target.value })} style={inputStyle} />
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={projForm.isCurrent} onChange={e => setProjForm({ ...projForm, isCurrent: e.target.checked })} /><span className="text-[12px]" style={{ color: "var(--text-2)" }}>Ongoing</span></label>
            </>} />
          )}
        </AnimatePresence>
      </div>
    ),
    achievements: (
      <div className="t-card p-5">
        <SectionHeader title="Achievements" icon={Award} onAdd={() => setShowAddAchievement(true)} showAdd={isOwnProfile} />
        {achievements.length === 0 && !showAddAchievement && (
          <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}><p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your achievements" : "No achievements yet"}</p></div>
        )}
        {achievements.map((a: any) => (
          <div key={a.id} className="flex items-center gap-3 py-3 group" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}><span className="text-[16px]">{a.icon_emoji || "🏆"}</span></div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{a.title}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{[a.issued_by, a.achievement_date].filter(Boolean).join(" · ")}</p>
            </div>
            {a.certificate_url && <a href={a.certificate_url} target="_blank" rel="noopener" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>View ↗</a>}
            {isOwnProfile && <button onClick={() => deleteItem(a.id, "achievements")} className="opacity-0 group-hover:opacity-100 p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <AnimatePresence>
          {showAddAchievement && (
            <InlineForm title="Add Achievement" saving={saving} onSave={saveAchievement} onCancel={() => setShowAddAchievement(false)} fields={<>
              <Input placeholder="Title *" value={achForm.title} onChange={e => setAchForm({ ...achForm, title: e.target.value })} style={inputStyle} />
              <Input placeholder="Issued by *" value={achForm.issuedBy} onChange={e => setAchForm({ ...achForm, issuedBy: e.target.value })} style={inputStyle} />
              <Input placeholder="Date (e.g. June 2024)" value={achForm.date} onChange={e => setAchForm({ ...achForm, date: e.target.value })} style={inputStyle} />
              <Input placeholder="Credential URL (optional)" value={achForm.url} onChange={e => setAchForm({ ...achForm, url: e.target.value })} style={inputStyle} />
            </>} />
          )}
        </AnimatePresence>
      </div>
    ),
    skills: (
      <div className="t-card p-5">
        <SectionHeader title="Skills" icon={Code2} onAdd={() => setShowAddSkill(true)} showAdd={isOwnProfile} />
        <div className="flex flex-wrap gap-1.5">
          {skills.length === 0 && !showAddSkill && (
            <div className="w-full rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border-2)" }}><p className="text-[13px]" style={{ color: "var(--text-3)" }}>{isOwnProfile ? "Add your skills" : "No skills added"}</p></div>
          )}
          {skills.map((s: string) => (
            <span key={s} className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ border: "1.5px solid var(--brand)", color: "var(--brand)", background: "var(--brand-dim)" }}>
              {s}
              {isOwnProfile && <button onClick={() => removeSkill(s)} className="cursor-pointer ml-0.5"><X className="w-3 h-3" /></button>}
            </span>
          ))}
        </div>
        {showAddSkill && (
          <div className="flex items-center gap-2 mt-3">
            <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Type a skill..." className="flex-1" onKeyDown={e => { if (e.key === "Enter") addSkill(); }} />
            <Button size="sm" onClick={addSkill}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(false)}>Cancel</Button>
          </div>
        )}
      </div>
    ),
    posts: userPosts.length > 0 ? (
      <div className="t-card p-5">
        <SectionHeader title="Posts" icon={MessageCircle} showAdd={false} />
        {userPosts.map((p: any) => (
          <div key={p.id} className="py-3 group" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-[13px] line-clamp-2" style={{ color: "var(--text-2)" }}>{p.content}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.created_at ? getTimeAgo(new Date(p.created_at)) : ""}</span>
              {isOwnProfile && <span className="text-[11px]" style={{ color: "var(--text-3)" }}>♥ {(p.reactions?.like || 0) + (p.reactions?.insightful || 0) + (p.reactions?.useful || 0) + (p.reactions?.inspiring || 0)}</span>}
            </div>
          </div>
        ))}
      </div>
    ) : null,
  };

  return (
    <div className="max-w-[760px] mx-auto px-0 md:px-4 py-0 md:py-7 space-y-4 md:pl-8">
      {/* HEADER */}
      <div className="t-card overflow-hidden">
        <div className="h-[140px]" style={{ background: `linear-gradient(135deg, #FFF8F2 0%, color-mix(in srgb, ${roleColor} 20%, #FFF8F2) 50%, var(--brand) 100%)` }} />
        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className={`relative ${isOwnProfile ? "group cursor-pointer" : ""}`} onClick={() => isOwnProfile && setEditOpen(true)}>
              <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[28px] font-extrabold text-white shrink-0 overflow-hidden"
                style={{ backgroundColor: roleColor, border: "4px solid var(--surface)", boxShadow: isVerified ? "0 0 0 3px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" : "0 4px 12px rgba(0,0,0,0.15)" }}>
                {profileData.avatar_url ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              {isOwnProfile && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-4 h-4 text-white" /></div>}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{displayName}</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>{roleLabel}</span>
                {isVerified ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <CheckCircle className="w-3 h-3" /> Tiiked
                  </span>
                ) : isOwnProfile ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>Not yet Tiiked</span>
                ) : null}
              </div>
              {username && <p className="text-[12px] font-mono" style={{ color: "var(--text-3)" }}>@{username}</p>}
            </div>
          </div>
          {(city || state || institution) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(city || state) && <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-2)" }}><MapPin className="w-3 h-3" /> {[city, state].filter(Boolean).join(", ")}</span>}
              {institution && <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-2)" }}><Building2 className="w-3 h-3" /> {institution}</span>}
            </div>
          )}
          {headline && <p className="text-[15px] italic mt-2" style={{ color: "var(--text-2)" }}>{headline}</p>}
          {bio && (
            <div className="mt-2">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{bioExpanded || bio.length <= 150 ? bio : bio.slice(0, 150) + "..."}</p>
              {bio.length > 150 && <button onClick={() => setBioExpanded(!bioExpanded)} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>{bioExpanded ? "show less" : "...see more"}</button>}
            </div>
          )}
          {isOwnProfile && !isVerified && (
            <div className="flex items-center justify-between p-3 rounded-xl mt-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "#F59E0B" }} />
                <p className="text-[12px]" style={{ color: "rgba(245,158,11,0.9)" }}>Your profile is not yet Tiiked. Get verified to unlock the gold badge.</p>
              </div>
              <button onClick={() => setShowGetTiiked(true)} className="text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ background: "#F59E0B", color: "white" }}>Get Tiiked →</button>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {isOwnProfile ? (
              <>
                <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditOpen(true)}><Pencil className="w-3.5 h-3.5" /> Edit profile</Button>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={handleCopyLink}><Copy className="w-3.5 h-3.5" /> Copy link</Button>
              </>
            ) : (
              <>
                <Button size="sm" className="gap-1.5 rounded-full" onClick={handleStrand}><Link2 className="w-3.5 h-3.5" /> Strand</Button>
                <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => navigate("/app/pings")}><MessageCircle className="w-3.5 h-3.5" /> Ping</Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-center"><p className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.strands}</p><p className="micro-label mt-0.5">Connections</p></div>
            <div className="text-center"><p className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.projects}</p><p className="micro-label mt-0.5">Projects</p></div>
            <div className="text-center"><p className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>{stats.posts}</p><p className="micro-label mt-0.5">Posts</p></div>
          </div>
        </div>
      </div>

      {/* SECTIONS with drag reorder (own profile only) */}
      {isOwnProfile ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            {sectionOrder.map(sectionId => {
              const content = sectionComponents[sectionId];
              if (!content) return null;
              return (
                <SortableSection key={sectionId} id={sectionId} isOwn={isOwnProfile}>
                  {content}
                </SortableSection>
              );
            })}
          </SortableContext>
        </DndContext>
      ) : (
        sectionOrder.map(sectionId => {
          const content = sectionComponents[sectionId];
          if (!content) return null;
          return <div key={sectionId}>{content}</div>;
        })
      )}

      <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} onSaved={loadProfile} />
      {user && <GetTiikedModal open={showGetTiiked} onClose={() => setShowGetTiiked(false)} userId={user.id} userRole={role} onVerified={loadProfile} />}
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default Profile;
