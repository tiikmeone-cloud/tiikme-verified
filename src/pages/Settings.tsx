import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee, Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, AlertTriangle, Camera, User, Shield, Bell, Eye, Lock, LogOut, Users, Copy, Share2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "invite", label: "Invite & Earn", icon: Users },
  { id: "journey", label: "My Journey", icon: Rocket },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Eye },
  
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Lock },
];

const journeyCards = [
  { id: "higher", icon: GraduationCap, title: "Higher studies", desc: "M.Tech, MBA, PhD — stay as Student" },
  { id: "job", icon: Briefcase, title: "Got a job", desc: "Become Professional" },
  { id: "startup", icon: Rocket, title: "Starting a startup", desc: "Become Founder" },
  { id: "freelance", icon: Laptop, title: "Freelancing", desc: "Become Professional" },
  { id: "break", icon: Coffee, title: "Taking a break", desc: "Become Alumni" },
];

const applyTheme = (t: string) => {
  const resolved = t === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.setAttribute("data-theme", resolved);
};

const Toggle = ({ label, desc, defaultOn = true }: { label: string; desc?: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
      <div><span className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{label}</span>{desc && <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>{desc}</p>}</div>
      <button type="button" onClick={() => { setOn(!on); tiikToast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95"
        style={{ background: on ? "#E8733A" : "rgba(255,255,255,0.25)", transition: "all 0.2s" }}>
        <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("tiikme-theme") || "light");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", headline: "", bio: "", institution: "", city: "", state: "", slug: "", avatar_url: "", cover_url: "" });
  const [originalProfile, setOriginalProfile] = useState({ name: "", headline: "", bio: "", institution: "", city: "", state: "", slug: "", avatar_url: "", cover_url: "" });
  const [userId, setUserId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Invite state
  const [inviteCount, setInviteCount] = useState(0);

  // Account tab state
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  useEffect(() => { applyTheme(theme); }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setUserId(u.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (data) {
        const p = {
          name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          institution: data.institution_name || "",
          city: data.location_city || "",
          state: data.location_state || "",
          slug: data.username || "",
          avatar_url: data.avatar_url || "",
          cover_url: (data as any).cover_url || "",
        };
        setProfile(p);
        setOriginalProfile(p);

        // Load invite count
        if (data.username) {
          const { count, error: countErr } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", data.username);
          if (countErr) console.warn("[Settings] invite count failed:", countErr.message);
          setInviteCount(count || 0);
        }
      }
    };
    loadProfile();
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyTheme(newTheme);
    tiikToast.success(`Theme set to ${newTheme}`);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.name,
      headline: profile.headline,
      bio: profile.bio,
      institution_name: profile.institution,
      location_city: profile.city,
      location_state: profile.state,
      username: profile.slug,
    }).eq("id", userId);
    setSaving(false);
    if (error) { tiikToast.error("Failed to save"); return; }
    setOriginalProfile({ ...profile });
    await refreshProfile();
    tiikToast.success("Saved ✓");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) { tiikToast.error("Max 2MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { tiikToast.error("JPEG, PNG, or WebP only"); return; }

    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(r => img.onload = r);
    const size = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 400, 400);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob) { tiikToast.error("Processing failed"); return; }

    const path = `${userId}/avatar.webp`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
    if (uploadErr) { tiikToast.error("Upload failed"); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    setOriginalProfile(p => ({ ...p, avatar_url: avatarUrl }));
    await refreshProfile();
    tiikToast.success("Avatar updated ✓");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) { tiikToast.error("Max 5MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { tiikToast.error("JPEG, PNG, or WebP only"); return; }

    const ext = file.name.split(".").pop();
    const path = `${userId}/cover.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("cover-images").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) { tiikToast.error("Upload failed: " + uploadErr.message); return; }

    const { data: urlData } = supabase.storage.from("cover-images").getPublicUrl(path);
    const coverUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ cover_url: coverUrl } as any).eq("id", userId);
    setProfile(p => ({ ...p, cover_url: coverUrl }));
    setOriginalProfile(p => ({ ...p, cover_url: coverUrl }));
    await refreshProfile();
    tiikToast.success("Cover photo updated ✓");
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) { tiikToast.error("Enter a new email"); return; }
    setEmailUpdating(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailUpdating(false);
    if (error) { tiikToast.error(error.message); return; }
    tiikToast.success(`Verification email sent to ${newEmail}. Check your inbox.`);
    setNewEmail("");
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) { tiikToast.error("Fill in all fields"); return; }
    if (newPassword.length < 8) { tiikToast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { tiikToast.error("Passwords don't match"); return; }
    setPasswordUpdating(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });
    if (signInErr) {
      setPasswordUpdating(false);
      tiikToast.error("Current password is incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordUpdating(false);
    if (error) { tiikToast.error(error.message); return; }
    tiikToast.success("Password updated ✓");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    const savedTheme = localStorage.getItem("tiikme-theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
    setTimeout(() => navigate("/signin"), 500);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setShowDeleteModal(false);
    try {
      await Promise.all([
        supabase.from("posts").delete().eq("author_id", user.id),
        supabase.from("work_items").delete().eq("owner_id", user.id),
        supabase.from("achievements").delete().eq("user_id", user.id),
        supabase.from("post_reactions").delete().eq("user_id", user.id),
        supabase.from("post_comments").delete().eq("user_id", user.id),
        supabase.from("strands").delete().eq("requester_id", user.id),
      ]);
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      const savedTheme = localStorage.getItem("tiikme-theme");
      localStorage.clear();
      if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
      tiikToast.success("Account deleted");
      navigate("/");
    } catch {
      tiikToast.error("Failed to delete account");
    }
  };

  const inviteLink = `https://tiikme.in/join?ref=${profile.slug}`;
  const inviteMessage = `Hey! I'm on Tiikme — India's first verified professional identity platform.\nYour work, your degree, your skills — all verified by the people who were actually there.\nJoin me here: ${inviteLink}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    tiikToast.success("Invite link copied ✓");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  };

  const shareOther = () => {
    if (navigator.share) {
      navigator.share({ title: "Join Tiikme", text: inviteMessage, url: inviteLink });
    } else {
      copyInviteLink();
    }
  };

  return (
    <motion.div
      animate={loggingOut ? { scale: 0.97, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="max-w-[960px] mx-auto px-3 md:px-6 py-7"
    >
      <h1 className="text-[20px] font-extrabold mb-5" style={{ color: "#1A1A2E", letterSpacing: "-0.01em" }}>Settings</h1>

      <div className="flex gap-6">
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="sticky top-20 space-y-0.5">
            {navItems.map(item => (
              <button type="button" key={item.id} onClick={() => setActiveTab(item.id)}
                className="w-full text-left text-[13px] px-3 h-[42px] rounded-xl flex items-center gap-2.5 cursor-pointer"
                style={{
                  background: activeTab === item.id ? "rgba(232,115,58,0.12)" : "transparent",
                  color: activeTab === item.id ? "#E8733A" : "#6B7094",
                  fontWeight: activeTab === item.id ? 700 : 500,
                  transition: "all 0.15s",
                }}>
                <item.icon className="w-4 h-4" strokeWidth={1.8} />
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 8, paddingTop: 8 }}>
              <button type="button" onClick={handleSignOut}
                className="w-full text-left text-[13px] px-3 h-[42px] rounded-xl flex items-center gap-2.5 cursor-pointer"
                style={{ color: "#6B7094", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7094"; }}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="md:hidden flex flex-wrap gap-1.5 mb-5">
            {navItems.map(item => (
              <button type="button" key={item.id} onClick={() => setActiveTab(item.id)}
                className="text-[11px] px-3 h-7 rounded-full cursor-pointer"
                style={{
                  background: activeTab === item.id ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "rgba(255,255,255,0.20)",
                  color: activeTab === item.id ? "white" : "#1A1A2E",
                  border: activeTab === item.id ? "none" : "1px solid rgba(255,255,255,0.25)",
                  fontWeight: activeTab === item.id ? 700 : 600,
                  transition: "all 0.15s",
                  backdropFilter: activeTab === item.id ? "none" : "blur(12px)",
                }}>
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="space-y-5">
              {/* Cover Photo */}
              <div className="glass-light overflow-hidden" style={{ borderRadius: 20 }}>
                <div
                  className="relative w-full h-[120px] md:h-[160px] cursor-pointer group"
                  style={{ background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, var(--brand-dim), var(--surface-2))" }}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ImageIcon className="w-6 h-6 text-white" />
                    <span className="text-white text-[13px] font-bold ml-2">Change Cover</span>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
                </div>
                <div className="p-5">
                  <h3 className="text-[16px] font-semibold mb-5" style={{ color: "#1A1A2E" }}>Edit Profile</h3>
                  <div className="flex items-center gap-5 mb-5">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
                        {profile.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (profile.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U")}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center" style={{ transition: "opacity 0.2s" }}>
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: "#1A1A2E" }}>{profile.name || "Your Name"}</p>
                      <p className="text-[12px]" style={{ color: "#6B7094" }}>Click avatar or cover to change</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094", letterSpacing: "0.08em" }}>Display Name</label>
                      <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094", letterSpacing: "0.08em" }}>Headline</label>
                      <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value.slice(0, 80) })} maxLength={80} />
                      <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{profile.headline.length}/80</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094", letterSpacing: "0.08em" }}>Bio</label>
                      <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value.slice(0, 300) })} placeholder="Tell people about yourself..." rows={3} maxLength={300}
                        className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                        style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)", transition: "border 0.15s" }}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--brand)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                      />
                      <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{profile.bio.length}/300</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>City</label><Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
                      <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>State</label><Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} /></div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094", letterSpacing: "0.08em" }}>Username</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ color: "var(--text-3)" }}>tiikme.in/</span>
                        <Input value={profile.slug} disabled className="flex-1 opacity-60" />
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>Username cannot be changed</p>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={handleSaveProfile} disabled={saving || !hasChanges}
                        className="h-10 px-6 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: hasChanges ? "pointer" : "default", boxShadow: "0 4px 16px rgba(232,115,58,0.25)" }}>
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "invite" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: "#1A1A2E" }}>Invite & Earn</h3>
                <p className="text-[13px] mb-5" style={{ color: "#6B7094" }}>Share your unique link. When someone signs up using it, they show up in your invite count.</p>

                <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="flex-1 text-[13px] truncate" style={{ color: "var(--text-1)" }}>{inviteLink}</p>
                  <button type="button" onClick={copyInviteLink} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--brand)" }}>
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Button onClick={shareWhatsApp} variant="secondary" className="flex-1 gap-2">
                    Share via WhatsApp
                  </Button>
                  <Button onClick={shareOther} variant="secondary" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" /> Share on Other Apps
                  </Button>
                </div>

                <div className="rounded-xl p-4 text-center" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>
                  <p className="text-[28px] font-extrabold" style={{ color: "var(--brand)" }}>{inviteCount}</p>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
                    {inviteCount === 1 ? "person has" : "people have"} joined Tiikme from your invite
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "dark", label: "Dark", icon: Moon, desc: "Krishna Blue", previewBg: "#04061A", previewSurface: "#080B2A", previewDot: "#3D5AF1" },
                  { id: "light", label: "Light", icon: Sun, desc: "Anjaneyam Orange", previewBg: "#FFF8F2", previewSurface: "#FFFFFF", previewDot: "#E8580A" },
                  { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                ].map(t => (
                  <button type="button" key={t.id} onClick={() => handleThemeChange(t.id)}
                    className="rounded-2xl p-3 text-left cursor-pointer relative overflow-hidden active:scale-[0.98]"
                    style={{
                      background: "var(--surface-2)",
                      border: theme === t.id ? "2px solid var(--brand)" : "1.5px solid var(--border)",
                      boxShadow: theme === t.id ? "0 0 0 3px var(--brand-dim)" : "none",
                      transition: "all 0.2s",
                      width: "100%", height: 92,
                    }}>
                    {theme === t.id && <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    {t.previewBg ? (
                      <div className="w-full h-[55px] rounded-lg mb-2 relative overflow-hidden" style={{ background: t.previewBg }}>
                        <div className="absolute inset-x-2 top-2 h-2 rounded-full" style={{ background: t.previewSurface, opacity: 0.5 }} />
                        <div className="absolute inset-x-2 top-5 h-2 rounded-full" style={{ background: t.previewSurface, opacity: 0.3 }} />
                        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ background: t.previewDot }} />
                      </div>
                    ) : (
                      <div className="w-full h-[55px] rounded-lg mb-2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #04061A 50%, #FFF8F2 50%)" }}>
                        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ background: "#3D5AF1" }} />
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full" style={{ background: "#E8580A" }} />
                      </div>
                    )}
                    <span className="text-[13px] font-semibold block" style={{ color: "var(--text-2)" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "journey" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 16, borderRadius: 20, borderLeft: "2px dashed #E8733A" }}>
                <h3 className="text-[18px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Your chapter is changing. What's next?</h3>
                <p className="text-[13px]" style={{ color: "#6B7094" }}>Your project history always stays. Your role and badge updates instantly.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {journeyCards.map(c => (
                  <button type="button" key={c.id} onClick={() => setJourneyChoice(c.id)}
                    className="glass-light text-left relative cursor-pointer active:scale-[0.98] transition-all duration-200"
                    style={{ padding: 20, borderRadius: 20, ...(journeyChoice === c.id ? { borderColor: "#E8733A", background: "rgba(232,115,58,0.08)" } : {}) }}>
                    {journeyChoice === c.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    <c.icon className="w-7 h-7 mb-3" style={{ color: "var(--brand)" }} />
                    <h4 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{c.title}</h4>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full" size="lg" onClick={() => tiikToast.success("Journey updated!")}>Update my journey</Button>}
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Privacy settings</h3>
              <Toggle label="Open to opportunities" desc="Show green dot on profile" />
              <Toggle label="Show profile in Explore" />
              <Toggle label="Show recruiter view count on work" />
              <Toggle label="Allow Connection requests" />
              <Toggle label="Show Activity Score publicly" />
              <Toggle label="Show Connection count publicly" />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Notification preferences</h3>
              <Toggle label="Recruiter views my work" />
              <Toggle label="Connection requests received" />
              <Toggle label="Tiik Approvals received" />
              <Toggle label="Opportunity matches" />
              <Toggle label="Replies to my comments" />
              <Toggle label="New Pings (unread)" />
              <Toggle label="Activity Score milestones" defaultOn={false} />
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Change Email</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Current Email</label>
                    <Input value={user?.email || ""} disabled className="opacity-60" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>New Email</label>
                    <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" />
                  </div>
                  <Button onClick={handleUpdateEmail} disabled={emailUpdating} className="gap-2">
                    <Mail className="w-4 h-4" /> {emailUpdating ? "Sending..." : "Update email"}
                  </Button>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Current Password</label>
                    <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>New Password (min 8 chars)</label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Confirm New Password</label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button onClick={handleUpdatePassword} disabled={passwordUpdating} className="gap-2">
                    <Key className="w-4 h-4" /> {passwordUpdating ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </div>

              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <Button variant="secondary" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" /> Sign out of all devices
                </Button>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Danger Zone</h3>
                <p className="text-[13px] mb-2" style={{ color: "var(--text-2)" }}>This will permanently delete your profile, posts, and all data.</p>
                <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Type <strong>DELETE</strong> below to confirm.</p>
                {!showDeleteModal ? (
                  <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete my account</Button>
                ) : (
                  <div className="space-y-3">
                    <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="Type DELETE" />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setShowDeleteModal(false); setDeleteText(""); }}>Cancel</Button>
                      <Button variant="destructive" size="sm" disabled={deleteText !== "DELETE"} onClick={handleDeleteAccount}>
                        Permanently delete account
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
