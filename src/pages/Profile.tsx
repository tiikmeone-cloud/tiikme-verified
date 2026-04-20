import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { fixStorageUrl } from "@/components/ui/AvatarSquare";
import { cleanUsername } from "@/lib/cleanUsername";
import { SUBTYPE_OPTIONS, hasSubtypes } from "@/lib/roleSubtypes";
import { getDisplayFlags, safeDisplayName } from "@/utils/displayProfile";
import { PageSEO, profileSEO } from "@/hooks/usePageSEO";
import {
  MapPin, Copy, Shield, X, MessageCircle, CheckCircle, Building2, Link2, Plus,
  Pencil, Trash2, Briefcase, GraduationCap, Award, Code2, Eye, EyeOff,
  Heart, Rocket, Send, Share2, Users, Globe, ExternalLink, LinkIcon, TrendingUp,
  Mail, Settings, Camera, UserX, Layers, ChevronRight, LifeBuoy
} from "lucide-react";
import { detectPlatform } from "@/lib/platformDetect";
import GlassModal, { glassInputDarkStyle as gInputStyle, glassSelectDarkStyle as gSelectStyle, glassTextareaDarkStyle as gTextareaStyle, labelStyle } from "@/components/ui/GlassModal";
import ActivityScoreCard from "@/components/profile/ActivityScoreCard";
import { shouldShowPublicScore } from "@/lib/activityTiers";
import GetTiikedModal from "@/components/profile/GetTiikedModal";
import { ExperienceSection, EducationSection, ProjectsSection, AchievementsSection, SkillsSection, PostsSection, RolesSection } from "@/components/profile/ProfileSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MentionText from "@/components/feed/MentionText";
import { sendNotification } from "@/lib/notify";
import VerificationRequest from "@/components/profile/VerificationRequest";
import CertificatesSection from "@/components/profile/CertificatesSection";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { getActivityTier } from "@/lib/algorithms";
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

/* ── Edit Profile Drawer ── */
const OTW_ROLE_TAGS = ["Frontend", "Backend", "Full-stack", "Product", "Design", "Data", "Marketing", "Sales", "Operations", "Research"];

const EditProfileDrawer = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: "", headline: "", bio: "", city: "", state: "", username: "", open_to_work: false, otw_visibility: "recruiters", avatar_url: "", about: "", role: "", role_subtype: "" });
  const [otwRoleTypes, setOtwRoleTypes] = useState<string[]>([]);
  const [otwLocation, setOtwLocation] = useState("");
  const [otwLocationType, setOtwLocationType] = useState("onsite");
  const [otwPitch, setOtwPitch] = useState("");
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
      const { data } = await supabase.from("profiles").select("full_name, headline, bio, location_city, location_state, username, open_to_work, otw_visibility, avatar_url, custom_links, role, role_subtype").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({ name: data.full_name || "", headline: data.headline || "", bio: data.bio || "", city: data.location_city || "", state: data.location_state || "", username: data.username || "", open_to_work: data.open_to_work || false, otw_visibility: (data as any).otw_visibility || "recruiters", avatar_url: data.avatar_url || "", about: (data as any).about || "", role: (data as any).role || "", role_subtype: (data as any).role_subtype || "" });
        setCustomLinks(Array.isArray(data.custom_links) ? (data.custom_links as any[]).map(l => ({ url: l.url || "", label: l.label || "" })) : []);
      }
      // Load OTW preferences
      const { data: otw } = await supabase.from("open_to_work_profiles").select("role_types, preferred_location, location_type, pitch").eq("user_id", user.id).maybeSingle();
      if (otw) {
        setOtwRoleTypes(otw.role_types || []);
        setOtwLocation(otw.preferred_location || "");
        setOtwLocationType(otw.location_type || "onsite");
        setOtwPitch(otw.pitch || "");
      }
    })();
  }, [open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const { validateUpload } = await import("@/lib/uploadValidation");
    const err = validateUpload(file, { maxBytes: 2 * 1024 * 1024, allowImages: true });
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
    const subtypeAllowed = hasSubtypes(form.role);
    await supabase.from("profiles").update({
      full_name: form.name, headline: form.headline.slice(0, 80), bio: form.bio.slice(0, 300),
      username: form.username.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
      location_city: form.city, location_state: form.state,
      open_to_work: form.open_to_work,
      otw_visibility: form.otw_visibility,
      role_subtype: subtypeAllowed ? (form.role_subtype || null) : null,
      custom_links: customLinks.filter(l => l.url) as any,
    } as any).eq("id", userId);

    // Upsert OTW preferences when open_to_work is on
    if (form.open_to_work) {
      const otwPayload = {
        user_id: userId,
        role_types: otwRoleTypes,
        preferred_location: otwLocation || null,
        location_type: otwLocationType,
        pitch: otwPitch.slice(0, 200),
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { error: otwErr } = await supabase.from("open_to_work_profiles").upsert(otwPayload as any, { onConflict: "user_id" });
      if (otwErr) console.warn("[otw upsert]", otwErr.message);
    } else {
      await supabase.from("open_to_work_profiles").update({ is_active: false } as any).eq("user_id", userId);
    }

    setSaving(false);
    toast.success("Profile updated");
    await refreshProfile();
    onSaved(); onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px] overflow-y-auto" style={{ background: "#fff" }}>
        <SheetHeader><SheetTitle style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>Edit Profile</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => avatarRef.current?.click()}>
            <AvatarSquare src={form.avatar_url} name={form.name || "U"} size="xl" />
            <p style={{ fontSize: 12, color: "#9CA3C0" }}>Click to change avatar</p>
            <p style={{ fontSize: 12, color: "#9CA3C0" }}>Click to change avatar</p>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div><label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>Display name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>Headline</label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value.slice(0, 80) })} maxLength={80} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value.slice(0, 300) })} rows={3} maxLength={300}
              className="w-full outline-none resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A2E" }} />
          </div>
          <div className="flex items-center gap-2"><span style={{ fontSize: 13, color: "#9CA3C0" }}>@</span><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} className="flex-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full outline-none cursor-pointer" style={{ height: 40, borderRadius: 10, padding: "0 12px", fontSize: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,0,0,0.10)", color: "#1A1A2E" }}>
                <option value="">Select</option>{allIndianStates.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {hasSubtypes(form.role) && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>
                Role subtype
              </label>
              <select
                value={form.role_subtype}
                onChange={e => setForm({ ...form, role_subtype: e.target.value })}
                className="w-full outline-none cursor-pointer"
                style={{ height: 40, borderRadius: 10, padding: "0 12px", fontSize: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,0,0,0.10)", color: "#1A1A2E" }}
              >
                <option value="">Select…</option>
                {SUBTYPE_OPTIONS[form.role].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          {/* OPEN TO WORK CARD */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>Open to Work</p>
                <p style={{ fontSize: 11, color: "#6B7094", marginTop: 2 }}>Let recruiters know you're available</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, open_to_work: !form.open_to_work })} className="cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, background: form.open_to_work ? "#10B981" : "#ddd", display: "flex", alignItems: "center", padding: 2, border: "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", transform: form.open_to_work ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s" }} />
              </button>
            </div>

            {form.open_to_work && (
              <>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7094", marginBottom: 6 }}>Visibility</p>
                  <div className="space-y-1.5">
                    {[
                      { v: "all", label: "Everyone can see", desc: "Show the green badge on your profile to anyone" },
                      { v: "recruiters", label: "Only recruiters", desc: "Visible only to institution accounts" },
                      { v: "hidden", label: "Hidden for now", desc: "Save preferences but don't display" },
                    ].map(opt => (
                      <label key={opt.v} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg" style={{ background: form.otw_visibility === opt.v ? "rgba(16,185,129,0.08)" : "transparent" }}>
                        <input type="radio" name="otw_vis" checked={form.otw_visibility === opt.v} onChange={() => setForm({ ...form, otw_visibility: opt.v })} style={{ marginTop: 3, accentColor: "#10B981" }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{opt.label}</p>
                          <p style={{ fontSize: 11, color: "#6B7094" }}>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7094", marginBottom: 6 }}>Roles open to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {OTW_ROLE_TAGS.map(r => {
                      const on = otwRoleTypes.includes(r);
                      return (
                        <button key={r} type="button" onClick={() => setOtwRoleTypes(p => on ? p.filter(x => x !== r) : [...p, r])}
                          className="cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 999, background: on ? "#10B981" : "#fff", color: on ? "#fff" : "#1A1A2E", border: on ? "1px solid #10B981" : "1px solid rgba(0,0,0,0.10)" }}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7094", marginBottom: 4 }}>City</p>
                    <Input value={otwLocation} onChange={e => setOtwLocation(e.target.value)} placeholder="e.g. Mumbai" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7094", marginBottom: 4 }}>Mode</p>
                    <select value={otwLocationType} onChange={e => setOtwLocationType(e.target.value)} className="w-full outline-none cursor-pointer" style={{ height: 40, borderRadius: 10, padding: "0 12px", fontSize: 14, background: "#fff", border: "1px solid rgba(0,0,0,0.10)", color: "#1A1A2E" }}>
                      <option value="onsite">Onsite</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7094", marginBottom: 4 }}>Short pitch</p>
                  <textarea value={otwPitch} onChange={e => setOtwPitch(e.target.value.slice(0, 200))} rows={2} maxLength={200}
                    placeholder="Why should recruiters pick you?"
                    className="w-full outline-none resize-none" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, padding: 10, fontSize: 13, color: "#1A1A2E" }} />
                  <p className="text-right" style={{ fontSize: 10, color: otwPitch.length >= 190 ? "#EF4444" : "#9CA3C0" }}>{otwPitch.length}/200</p>
                </div>
              </>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#9CA3C0" }}>Custom Links</label>
            {customLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <Input placeholder="URL" value={link.url} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], url: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <Input placeholder="Label" value={link.label} onChange={e => { const u = [...customLinks]; u[i] = { ...u[i], label: e.target.value }; setCustomLinks(u); }} className="flex-1" />
                <button type="button" onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))} className="p-1 cursor-pointer" style={{ color: "#9CA3C0" }}><X className="w-4 h-4" /></button>
              </div>
            ))}
            {customLinks.length < 5 && <button type="button" onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", background: "none", border: "none", padding: 0 }}>+ Add link</button>}
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

/* ═══════════ ABOUT SECTION ═══════════ */
const AboutSection = ({ about, isOwnProfile, userId }: { about: string; isOwnProfile: boolean; userId: string }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(about || "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setText(about || ""); }, [about]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ about: text.slice(0, 500) } as any).eq("id", userId);
    setSaving(false);
    setEditing(false);
    toast.success("About updated");
  };

  const displayText = about || "";
  const lines = displayText.split("\n");
  const needsTruncate = lines.length > 4 || displayText.length > 280;
  const showFull = expanded || !needsTruncate;

  return (
    <div className="glass-card" style={{ padding: 16, borderRadius: 16, marginTop: 12 }}>
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
            <p style={{ fontSize: 13, fontWeight: 400, color: "#9CA3C0", fontStyle: "italic" }}>
              {isOwnProfile ? "Tell people about yourself..." : "No about section"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════ CONTACT SECTION ═══════════ */
const ContactSection = ({ isOwnProfile, profile, userEmail }: { isOwnProfile: boolean; profile: any; userEmail: string | null }) => {
  const [emailVisible, setEmailVisible] = useState(profile?.contact_email_visible ?? false);
  const [toggling, setToggling] = useState(false);

  const toggleEmailVisibility = async () => {
    setToggling(true);
    const newVal = !emailVisible;
    await supabase.from("profiles").update({ contact_email_visible: newVal } as any).eq("id", profile.id);
    setEmailVisible(newVal);
    setToggling(false);
    toast.success(newVal ? "Email now visible on profile" : "Email hidden from profile");
  };

  // For other people's profiles: hide entire section if email not visible
  if (!isOwnProfile && !profile?.contact_email_visible) return null;

  return (
    <div className="glass-card" style={{ padding: 12, borderRadius: 16, marginTop: 8 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", flex: 1 }}>Contact</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {isOwnProfile ? (
          <>
            <div className="flex items-center justify-between" style={{ marginBottom: emailVisible ? 8 : 0 }}>
              <span style={{ fontSize: 12, color: "#6B7094" }}>Show email on profile</span>
              <button
                type="button"
                onClick={toggleEmailVisibility}
                disabled={toggling}
                className="cursor-pointer"
                style={{ width: 32, height: 18, borderRadius: 9, background: emailVisible ? "#34C759" : "#ddd", display: "flex", alignItems: "center", padding: 2, border: "none" }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", transform: emailVisible ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }} />
              </button>
            </div>
            {emailVisible && (
              <div className="flex items-center" style={{ gap: 6 }}>
                <Mail style={{ width: 14, height: 14, color: "#4A90D9" }} />
                <span style={{ fontSize: 13, fontWeight: 400, color: "#4A90D9" }}>{userEmail || "No email"}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center" style={{ gap: 6 }}>
            <Mail style={{ width: 14, height: 14, color: "#4A90D9" }} />
            <span style={{ fontSize: 13, fontWeight: 400, color: "#4A90D9" }}>{profile?.email || "Email"}</span>
          </div>
        )}
      </div>
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

  const [editOpen, setEditOpen] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });
  const [connectedAvatars, setConnectedAvatars] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showGetTiiked, setShowGetTiiked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [connectionStatus, setConnectionStatus] = useState<{ status: string | null; direction: string | null; id: string | null }>({ status: null, direction: null, id: null });
  const [connectLoading, setConnectLoading] = useState(false);

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
      isOwnProfile ? Promise.resolve({ data: authProfile }) : supabase.from("profiles").select("id, full_name, username, role, role_subtype, headline, bio, avatar_url, institution_name, location_city, location_state, activity_score, is_public, custom_links, open_to_work, otw_visibility, designation, sector, languages, department, is_verified, role_metadata, about_qa, verification_badge_text, verification_type, created_at, account_type, org_id, skills, display_preference, profession_type, currently_working_at").eq("id", targetUserId).maybeSingle(),
      supabase.from("work_items").select("id, title, job_title, description, company_name, institution_name, item_type, employment_type, work_location, start_date, end_date, start_month, start_year, end_month, end_year, is_current, status, visibility, verification_status, verified_by_user, verified_at, is_tiik_approved, created_at, owner_id").eq("owner_id", targetUserId).order("is_current", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("strands").select("id", { count: "exact", head: true }).or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`).eq("status", "accepted"),
      supabase.from("posts").select("id, content, created_at, image_urls, repost_count, post_reactions(count), post_comments(count)").eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(5),
      supabase.from("achievements").select("id, title, type, description, icon_emoji, achievement_date, issued_by, certificate_url, certificate_file_url, source_type, source_workspace_name, visibility, created_at, user_id").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      supabase.from("certificates").select("id, title, description, issued_date, expiry_date, certificate_url, is_verified, issued_by, issued_to, org_id, created_at, org:organizations(name, logo_url)").eq("issued_to", targetUserId).order("created_at", { ascending: false }),
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

  const profileData = viewedProfile || authProfile;
  if (!profileData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Profile not found</p>
      <button type="button" onClick={() => navigate("/app/explore")} className="cursor-pointer" style={{ fontSize: 13, marginTop: 8, color: "#E8733A", background: "none", border: "none" }}>Back to Explore</button>
    </div>
  );

  // Privacy
  const privacySettings = profileData.privacy_settings as any || {};
  const profileVisibility = privacySettings.profile_visibility || "public";
  const showLocation = privacySettings.show_location !== false;
  const isConnected = connectionStatus.status === "accepted";
  const isPrivateView = !isOwnProfile && profileVisibility === "private";
  const isConnectionsOnly = !isOwnProfile && profileVisibility === "connections_only" && !isConnected;

  if (isPrivateView || isConnectionsOnly) {
    const limitedName = profileData.full_name || "User";
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

  const displayName = profileData.full_name || authDisplayName || "";
  const username = cleanUsername(profileData.username || "");
  const headline = profileData.headline || "";
  const city = showLocation || isOwnProfile ? (profileData.location_city || "") : "";
  const state = showLocation || isOwnProfile ? (profileData.location_state || "") : "";
  const role = profileData.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
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

  /* Save functions */
  const saveExperience = async () => {
    if (!user) return;
    if (!expForm.company.trim()) { toast.error("Company name is required"); return; }
    if (!expForm.title.trim()) { toast.error("Job title is required"); return; }
    setSaving(true);
    try {
      const startDate = expForm.startMonth && expForm.startYear ? `${expForm.startYear}-${String(months.indexOf(expForm.startMonth) + 1).padStart(2, "0")}-01` : null;
      const endDate = !expForm.isCurrent && expForm.endMonth && expForm.endYear ? `${expForm.endYear}-${String(months.indexOf(expForm.endMonth) + 1).padStart(2, "0")}-01` : null;
      const payload = {
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
      };
      if (import.meta.env.DEV) console.log("[saveExperience] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload).select().single();
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
    if (!eduForm.institution.trim() || !user) return;
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id, title: eduForm.degree + (eduForm.branch ? ` - ${eduForm.branch}` : ""),
        degree_type: eduForm.degree.trim() || null, field_of_study: eduForm.branch.trim() || null,
        institution_name_edu: eduForm.institution.trim(), institution_name: eduForm.institution.trim(),
        grade_score: eduForm.grade.trim() || null, item_type: "education",
        start_year: eduForm.startYear ? Number(eduForm.startYear) : null,
        end_year: !eduForm.isCurrent && eduForm.endYear ? Number(eduForm.endYear) : null,
        start_date: eduForm.startYear ? `${eduForm.startYear}-01-01` : null,
        end_date: !eduForm.isCurrent && eduForm.endYear ? `${eduForm.endYear}-12-31` : null,
        is_current: eduForm.isCurrent, status: "active", visibility: "public",
      };
      if (import.meta.env.DEV) console.log("[saveEducation] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload).select().single();
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
    if (!projForm.title.trim() || !user) return;
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id, title: projForm.title.trim(), description: projForm.description.trim(),
        company_name: projForm.org.trim() || null, item_type: "project",
        tech_stack: projForm.techStack ? projForm.techStack.split(",").map(s => s.trim()).filter(Boolean) : [],
        start_year: projForm.startYear ? Number(projForm.startYear) : null,
        end_year: !projForm.isCurrent && projForm.endYear ? Number(projForm.endYear) : null,
        is_current: projForm.isCurrent, status: "active", visibility: "public",
      };
      if (import.meta.env.DEV) console.log("[saveProject] payload:", payload);
      const { data, error } = await supabase.from("work_items").insert(payload).select().single();
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
    const updated = [...skills, newSkill.trim()];
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
    const err = validateUpload(file, { maxBytes: 2 * 1024 * 1024, allowImages: true });
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

  const renderConnectButton = () => {
    const { status, direction } = connectionStatus;
    if (status === "accepted") {
      const handleDisconnect = async () => {
        if (!connectionStatus.id && user && targetUserId) {
          // Find the strand ID
          const { data } = await supabase.from("strands").select("id")
            .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
            .eq("status", "accepted").maybeSingle();
          if (data) {
            await supabase.from("strands").delete().eq("id", data.id);
            setConnectionStatus({ status: null, direction: null, id: null });
            toast.success("Disconnected");
            return;
          }
        }
        if (connectionStatus.id) {
          await supabase.from("strands").delete().eq("id", connectionStatus.id);
          setConnectionStatus({ status: null, direction: null, id: null });
          toast.success("Disconnected");
        }
      };

      return (
        <div className="relative group">
          <button type="button" className="cursor-pointer" style={{ height: 32, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <CheckCircle className="w-3.5 h-3.5" /> Connected
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-20" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: 4, minWidth: 120 }}>
            <button type="button" onClick={handleDisconnect} className="w-full text-left cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", borderRadius: 6 }}>
              <UserX className="w-3.5 h-3.5 inline mr-2" />Disconnect
            </button>
          </div>
        </div>
      );
    }
    if (status === "pending" && direction === "sent") return (
      <button type="button" className="cursor-default" style={{ height: 32, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(255,184,0,0.10)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)", display: "inline-flex", alignItems: "center" }}>Requested</button>
    );
    if (status === "pending" && direction === "received") return (
      <div className="flex gap-2">
        <button type="button" onClick={handleAcceptConnection} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg, #34C759, #30B350)", color: "#fff", border: "none" }}>Accept</button>
        <button type="button" onClick={handleDeclineConnection} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>Decline</button>
      </div>
    );
    return (
      <button type="button" onClick={handleConnect} disabled={connectLoading} className="cursor-pointer" style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 2px 12px rgba(232,115,58,0.25)" }}>
        <Users className="w-3 h-3 inline mr-1" />Connect
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-8">
      <PageSEO {...seoProps} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        {/* ── PROFILE INFO CARD (no cover) ── */}
        <div className="glass-card" style={{
          padding: 20, borderRadius: 16,
          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.40)",
          boxShadow: "0 8px 32px rgba(26,26,78,0.08), inset 0 1px 0 rgba(255,255,255,0.60)",
        }}>
          {(() => {
            const otwVis = (profileData as any).otw_visibility || "recruiters";
            const viewerIsRecruiter = authProfile?.account_type === "institution";
            const showOTW = !!profileData.open_to_work && (
              isOwnProfile ||
              otwVis === "all" ||
              (otwVis === "recruiters" && viewerIsRecruiter)
            );
            return (
          <div className="flex profile-info-flex" style={{ gap: 16, alignItems: "flex-start" }}>
            {/* Avatar — green ring when Open to Work and visible to viewer */}
              <div className="shrink-0" style={showOTW ? { padding: 3, borderRadius: 14, background: "#10B981" } : undefined}>
                <AvatarSquare src={profileData.avatar_url} name={displayName || "U"} size="profile" bgColor={roleColor} className="shadow-md" />
              </div>

            {/* Info */}
            <div className="profile-info-body" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {/* ROW 1: Name + Edit */}
              <div className="flex items-center" style={{ justifyContent: "space-between" }}>
                <p style={{ fontSize: 20, fontWeight: 700, lineHeight: "28px", color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
              </div>

              {/* ROW 1b: Role · Subtype */}
              <p style={{ fontSize: 12, fontWeight: 600, color: roleColor }}>
                {profileData.role_subtype
                  ? `${roleLabel} · ${profileData.role_subtype}`
                  : roleLabel}
              </p>

              {/* ROW 1c: Role-metadata-derived inline summary (BITS Pilani · 3rd Year, etc.) */}
              {(() => {
                const m = (profileData as any).role_metadata as Record<string, any> | null;
                if (!m || typeof m !== "object") return null;
                const r = profileData.role;
                let parts: string[] = [];
                if (r === "student") parts = [m.institution, m.current_year].filter(Boolean);
                else if (r === "professional") parts = [m.company, m.years_experience ? `${m.years_experience} yrs` : ""].filter(Boolean);
                else if (r === "doctor") parts = [m.hospital, m.specialty === "Other" ? m.specialty_other : m.specialty].filter(Boolean);
                else if (r === "faculty") parts = [m.institution, m.department].filter(Boolean);
                if (parts.length === 0) return null;
                return (
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#6B7094" }}>
                    {parts.join(" · ")}
                  </p>
                );
              })()}

              {/* ROW 2: Current position / headline */}
              {(currentExp || headline) && (
              <p style={{ fontSize: 13, fontWeight: 400, color: "#6B7094" }}>
                {currentExp ? `${currentExp.job_title || currentExp.title} at ${currentExp.company_name || ""}` : headline}
              </p>
              )}

              {/* ROW 3: @username + location + badges */}
              <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                {username && <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3C0" }}>@{username}</span>}
                {username && (city || state) && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9CA3C0", flexShrink: 0 }} />}
                {(city || state) && (
                  <span className="flex items-center" style={{ gap: 2, fontSize: 12, color: "#9CA3C0" }}>
                    <MapPin style={{ width: 12, height: 12 }} />{[city, state].filter(Boolean).join(", ")}
                  </span>
                )}
                {((city || state) || username) && (
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9CA3C0", flexShrink: 0 }} />
                )}
                {showOTW ? (
                  <span style={{ fontSize: 11, fontWeight: 700, height: 20, padding: "0 8px", borderRadius: 999, background: "rgba(16,185,129,0.12)", color: "#10B981", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                    Open to Work · Contact for roles
                  </span>
                ) : null}
              </div>

              {/* ROW 4: Stats */}
              <div className="flex items-center" style={{ gap: 16, marginTop: 4 }}>
                <Link to="/app/connections" className="cursor-pointer hover:opacity-80">
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{stats.connections}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>Connections</span>
                </Link>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{stats.posts}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B7094", marginLeft: 4 }}>Posts</span>
                </div>
              </div>

              {/* ROW 5: Action buttons */}
              <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
                {isOwnProfile ? null : (
                  <>
                    {renderConnectButton()}
                    <button type="button" onClick={() => navigate(`/app/pings?to=${targetUserId}`)} className="cursor-pointer" style={{
                      height: 32, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)",
                      color: "#1A1A2E", display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <MessageCircle style={{ width: 13, height: 13 }} /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Activity Score Card — right side on desktop, full-width below on mobile */}
            {(() => {
              const score = (profileData as any).activity_score ?? 0;
              const visible = shouldShowPublicScore(
                { id: profileData.id, activity_score: score },
                authProfile ? { id: authProfile.id } : undefined,
              );
              if (!visible) return null;
              return (
                <div className="profile-score-wrap shrink-0" style={{ alignSelf: "flex-start" }}>
                  <ActivityScoreCard score={score} isOwn={isOwnProfile} />
                </div>
              );
            })()}
          </div>
            );
          })()}
        </div>

        {/* ── MOBILE-ONLY QUICK NAV (own profile) ── */}
        {isOwnProfile && (
          <div className="md:hidden glass-card" style={{ marginTop: 12, padding: 4, borderRadius: 16, overflow: "hidden" }}>
            {[
              { label: "Circles", icon: Layers, path: "/app/circles" },
              { label: "Connections", icon: Link2, path: "/app/connections" },
              { label: "Settings", icon: Settings, path: "/app/settings" },
              { label: "Help & Support", icon: LifeBuoy, path: "/grievance" },
            ].map((item, i, arr) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center w-full active:scale-[0.99]"
                style={{
                  height: 52, padding: "0 12px", gap: 14,
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  textDecoration: "none",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(232,115,58,0.10)",
                }}>
                  <item.icon style={{ width: 18, height: 18, color: "#E8733A" }} strokeWidth={1.8} />
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#1A1A2E" }}>{item.label}</span>
                <ChevronRight style={{ width: 16, height: 16, color: "#9CA3C0" }} />
              </Link>
            ))}
          </div>
        )}

        {/* ── ABOUT ── */}
        <AboutSection about={aboutText} isOwnProfile={isOwnProfile} userId={targetUserId || ""} />


        {/* ── SECTION GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]" style={{ marginTop: 12, gap: 12 }}>
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* L1: Connections preview */}
            <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.02em" }}>CONNECTIONS</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#1A1A2E", margin: "4px 0", lineHeight: "36px", letterSpacing: "-0.02em" }}>{stats.connections}</p>
              {/* Mini avatars */}
              {connectedAvatars.length > 0 && (
                <div className="flex items-center" style={{ marginBottom: 8 }}>
                  {connectedAvatars.slice(0, 3).map((a, i) => (
                    <div key={a.id} style={{
                      width: 24, height: 24, borderRadius: 0, overflow: "hidden", border: "2px solid #fff",
                      marginLeft: i > 0 ? -6 : 0, flexShrink: 0,
                      background: ROLE_COLOR_MAP["student"] || "#4F46E5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 9, fontWeight: 700,
                    }}>
                      {a.avatar_url ? <img src={fixStorageUrl(a.avatar_url) || ""} alt="" loading="lazy" className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : (a.full_name || "U")[0]}
                    </div>
                  ))}
                </div>
              )}
              <Link to="/app/connections" style={{ fontSize: 12, fontWeight: 400, color: "#E8733A" }}>See all &gt;</Link>
            </div>

            {/* L2: Get Tiiked */}
            {isOwnProfile && !isVerified && (
              <div className="glass-glow" style={{ padding: 12, borderRadius: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <Shield style={{ width: 24, height: 24, color: "#E8733A", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>Get Tiiked</p>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "#9CA3C0" }}>Verify your profile</p>
                </div>
                <button type="button" onClick={() => setShowGetTiiked(true)} className="cursor-pointer" style={{
                  height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
                  boxShadow: "0 2px 12px rgba(232,115,58,0.25)", flexShrink: 0,
                }}>Verify</button>
              </div>
            )}

            {/* L3: Links */}
            <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", flex: 1 }}>Links</span>
                {isOwnProfile && (
                  <button type="button" onClick={() => setShowAddLink(true)} className="cursor-pointer" style={{
                    height: 26, padding: "0 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                    background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)",
                    color: "#1A1A2E", display: "inline-flex", alignItems: "center", gap: 4,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.50)",
                  }}>
                    <Plus style={{ width: 12, height: 12 }} /> Add
                  </button>
                )}
              </div>
              {customLinks.length > 0 ? (
                <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
                  {customLinks.map((link: any, i: number) => {
                    const platform = detectPlatform(link.url);
                    const Icon = platform.icon;
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center" style={{
                        height: 28, padding: "0 10px", borderRadius: 6, gap: 6,
                        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        <Icon style={{ width: 14, height: 14, color: platform.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 400, color: "#1A1A2E" }}>{platform.name}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, fontWeight: 400, color: "#9CA3C0", marginTop: 8 }}>{isOwnProfile ? "Add your links" : "No links added"}</p>
              )}
              {showAddLink && (
                <div style={{ marginTop: 8 }} className="space-y-2">
                  <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="Paste your link..." onKeyDown={e => { if (e.key === "Enter") addLink(); }} />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={addLink} className="cursor-pointer" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>Add</button>
                    <button type="button" onClick={() => { setShowAddLink(false); setNewLinkUrl(""); }} className="cursor-pointer" style={{ fontSize: 12, color: "#9CA3C0", background: "none", border: "none" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ExperienceSection items={experiences} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("experience")} onDelete={deleteItem} onToggleVisibility={toggleVisibility} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
            <EducationSection items={education} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("education")} onDelete={deleteItem} onToggleVisibility={toggleVisibility} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
            <RolesSection items={profileRoles} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("role")} onDelete={deleteRole} />
            <ProjectsSection items={projects} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("project")} onDelete={deleteItem} onToggleVisibility={toggleVisibility} onStatusChange={(id, status) => setWorkItems(prev => prev.map(w => w.id === id ? { ...w, verification_status: status } : w))} />
            <AchievementsSection items={achievements} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("achievement")} onDelete={deleteItem} onToggleVisibility={toggleVisibility} />
            <SkillsSection skills={skills} isOwnProfile={isOwnProfile} onAdd={() => setModalSection("skills")} onRemoveSkill={removeSkill} />
            <PostsSection posts={userPosts} stats={stats} />
          </div>
        </div>
      </div>

      {/* ═══ GLASS MODALS ═══ */}
      <GlassModal open={modalSection === "experience"} onClose={() => setModalSection(null)} title="Add Experience" icon={Briefcase} accentColor="#4A90D9"
        actions={<>
          <button type="button" onClick={saveExperience} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
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
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={expForm.isCurrent} onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)" }}>I currently work here</span></label>
        {!expForm.isCurrent && (
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>End Month</label><select value={expForm.endMonth} onChange={e => setExpForm({ ...expForm, endMonth: e.target.value })} style={gSelectStyle}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label style={labelStyle}>End Year</label><select value={expForm.endYear} onChange={e => setExpForm({ ...expForm, endYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
          </div>
        )}
        <div><label style={labelStyle}>Location</label><input value={expForm.city} onChange={e => setExpForm({ ...expForm, city: e.target.value })} style={gInputStyle} placeholder="City" /></div>
        <div><label style={labelStyle}>Description</label><textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value.slice(0, 500) })} style={gTextareaStyle} placeholder="What did you do?" maxLength={500} /></div>
        <div><label style={labelStyle}>Skills (comma separated)</label><input value={expForm.skills} onChange={e => setExpForm({ ...expForm, skills: e.target.value })} style={gInputStyle} placeholder="React, TypeScript, Node.js" /></div>
      </GlassModal>

      <GlassModal open={modalSection === "education"} onClose={() => setModalSection(null)} title="Add Education" icon={GraduationCap} accentColor="#34C759"
        actions={<>
          <button type="button" onClick={saveEducation} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Institution Name *</label><input value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} style={gInputStyle} placeholder="e.g. IIT Delhi" /></div>
        <div><label style={labelStyle}>Degree / Program</label><input value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} style={gInputStyle} placeholder="e.g. B.Tech" /></div>
        <div><label style={labelStyle}>Branch / Specialisation</label><input value={eduForm.branch} onChange={e => setEduForm({ ...eduForm, branch: e.target.value })} style={gInputStyle} placeholder="e.g. Computer Science" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label style={labelStyle}>Start Year</label><select value={eduForm.startYear} onChange={e => setEduForm({ ...eduForm, startYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>
          {!eduForm.isCurrent && <div><label style={labelStyle}>End Year</label><select value={eduForm.endYear} onChange={e => setEduForm({ ...eduForm, endYear: e.target.value })} style={gSelectStyle}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select></div>}
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={eduForm.isCurrent} onChange={e => setEduForm({ ...eduForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)" }}>Currently studying here</span></label>
        <div><label style={labelStyle}>Grade / CGPA</label><input value={eduForm.grade} onChange={e => setEduForm({ ...eduForm, grade: e.target.value })} style={gInputStyle} placeholder="e.g. 9.2" /></div>
      </GlassModal>

      <GlassModal open={modalSection === "project"} onClose={() => setModalSection(null)} title="Add Project" icon={Rocket} accentColor="#FF6B9D"
        actions={<>
          <button type="button" onClick={saveProject} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
        </>}
      >
        <div><label style={labelStyle}>Project Name *</label><input value={projForm.title} onChange={e => setProjForm({ ...projForm, title: e.target.value })} style={gInputStyle} placeholder="e.g. Portfolio Website" /></div>
        <div><label style={labelStyle}>Organisation (optional)</label><input value={projForm.org} onChange={e => setProjForm({ ...projForm, org: e.target.value })} style={gInputStyle} placeholder="e.g. Open source" /></div>
        <div><label style={labelStyle}>Description</label><textarea value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value.slice(0, 500) })} style={gTextareaStyle} placeholder="What is this project about?" maxLength={500} /></div>
        <div><label style={labelStyle}>Tech Stack (comma separated)</label><input value={projForm.techStack} onChange={e => setProjForm({ ...projForm, techStack: e.target.value })} style={gInputStyle} placeholder="React, Node.js, PostgreSQL" /></div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={projForm.isCurrent} onChange={e => setProjForm({ ...projForm, isCurrent: e.target.checked })} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)" }}>Currently active</span></label>
      </GlassModal>

      <GlassModal open={modalSection === "achievement"} onClose={() => setModalSection(null)} title="Add Achievement" icon={Award} accentColor="#FFB800"
        actions={<>
          <button type="button" onClick={saveAchievement} disabled={saving} className="cursor-pointer" style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(232,115,58,0.35)" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
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
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
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
          <button type="button" onClick={() => setModalSection(null)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: 16, fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>Cancel</button>
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

      {user && <GetTiikedModal open={showGetTiiked} onClose={() => setShowGetTiiked(false)} userId={user.id} userRole={role} onVerified={loadProfile} />}
    </div>
  );
};

export default Profile;
