import AvatarSquare from "@/components/ui/AvatarSquare";
import { storageImageUrl } from "@/lib/imageTransform";
import { cleanUsername } from "@/lib/cleanUsername";
import { useState, useEffect, useRef } from "react";
import { Check, Camera, User, Eye, Lock, LogOut, Users, Copy, Share2, HelpCircle, MessageSquare, Send, CreditCard, Sparkles, FileText, Shield, Trash2, Mail, UserPlus, X, Crown } from "lucide-react";
import DeleteAccountModal from "@/components/legal/DeleteAccountModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgSubscription } from "@/hooks/useOrgSubscription";
import { DISPLAY_PREFERENCE_OPTIONS, DEFAULT_DISPLAY_PREFERENCE, type DisplayPreference } from "@/utils/displayProfile";
import { PageSEO } from "@/hooks/usePageSEO";
import LinkedAccounts from "@/components/settings/LinkedAccounts";

const baseNavItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "display", label: "Profile Display", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "invite", label: "Invite", icon: Users },
  { id: "legal", label: "Legal", icon: Shield },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

const ORG_TYPE_OPTIONS = [
  { value: "product_company", label: "Product Company" },
  { value: "saas", label: "SaaS" },
  { value: "agency", label: "Agency" },
  { value: "services", label: "Services" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "ngo", label: "NGO/Non-Profit" },
  { value: "educational", label: "Educational Institution" },
  { value: "government", label: "Government" },
  { value: "hospital", label: "Hospital/Healthcare" },
  { value: "other", label: "Other" },
];

// (Additional roles UI lives on the Profile page; removed from Settings to avoid duplication.)

const Toggle = ({ label, desc, value, onChange }: { label: string; desc?: string; value?: boolean; onChange?: (v: boolean) => void }) => {
  const [localOn, setLocalOn] = useState(value ?? true);
  const on = value !== undefined ? value : localOn;
  const handleToggle = () => {
    const next = !on;
    setLocalOn(next);
    if (onChange) onChange(next);
    else tiikToast.success("Preference saved");
  };
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div><span className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{label}</span>{desc && <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>{desc}</p>}</div>
      <button type="button" onClick={handleToggle}
        className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95"
        style={{ background: on ? "#E8733A" : "rgba(0,0,0,0.12)", transition: "all 0.2s" }}>
        <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Anyone can see your full profile" },
  { value: "connections_only", label: "Connections Only", desc: "Only connected users see full details" },
  { value: "private", label: "Private", desc: "Only name + avatar visible" },
];

const MESSAGE_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "connections_only", label: "Connections Only" },
  { value: "no_one", label: "Nobody" },
];

const CONNECTIONS_VIS_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "connections_only", label: "Connections Only" },
  { value: "only_me", label: "Only Me" },
];

const SEGMENTED_CONN = [
  { value: "everyone", label: "Everyone" },
  { value: "connections", label: "Connections" },
  { value: "only_me", label: "Only me" },
] as const;
const SEGMENTED_MSG = [
  { value: "everyone", label: "Everyone" },
  { value: "connections", label: "Connections" },
  { value: "verified_only", label: "Verified" },
  { value: "no_one", label: "No one" },
] as const;
const SEGMENTED_POSTS = [
  { value: "everyone", label: "Everyone" },
  { value: "connections", label: "Connections" },
  { value: "only_me", label: "Only me" },
] as const;

const Segmented = ({ value, options, onChange }: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) => (
  <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
    {options.map(opt => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="px-3 h-8 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all"
          style={{
            background: active ? "#E8733A" : "transparent",
            color: active ? "#fff" : "#6B7094",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const PrivacyRow = ({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
    <div className="min-w-0">
      <span className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{label}</span>
      {desc && <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>{desc}</p>}
    </div>
    <div className="shrink-0">{control}</div>
  </div>
);

import { DEFAULT_PRIVACY, normalizePrivacy, type PrivacySettings } from "@/lib/applyPrivacy";

const PrivacySection = ({ userId }: { userId: string | null }) => {
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [loaded, setLoaded] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("privacy, privacy_settings").eq("id", userId).maybeSingle().then(({ data }) => {
      const merged = { ...(data?.privacy_settings as any || {}), ...(data?.privacy as any || {}) };
      setPrivacy(normalizePrivacy(merged));
      setLoaded(true);
    });
  }, [userId]);

  const save = async (patch: Partial<PrivacySettings>) => {
    const updated = { ...privacy, ...patch };
    setPrivacy(updated);
    if (!userId) return;
    const key = Object.keys(patch)[0];
    await supabase.from("profiles").update({ privacy: updated as any }).eq("id", userId);
    setSavedKey(key);
    setTimeout(() => setSavedKey(prev => (prev === key ? null : prev)), 1400);
  };

  const Saved = ({ k }: { k: string }) =>
    savedKey === k ? (
      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#16A34A" }}>
        <Check className="w-3 h-3" /> Saved
      </span>
    ) : null;

  const ToggleCtl = ({ k, value }: { k: keyof PrivacySettings; value: boolean }) => (
    <div className="flex items-center">
      <Saved k={k} />
      <button
        type="button"
        onClick={() => save({ [k]: !value } as any)}
        className="ml-2 w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95"
        style={{ background: value ? "#E8733A" : "rgba(0,0,0,0.12)", transition: "all 0.2s" }}
      >
        <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );

  if (!loaded) return <div className="glass-light animate-pulse h-48" style={{ borderRadius: 20 }} />;

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7094" }}>Profile Visibility</h3>
        <PrivacyRow label="Show my location" control={<ToggleCtl k="show_location" value={privacy.show_location} />} />
        <PrivacyRow label="Show current company" control={<ToggleCtl k="show_company" value={privacy.show_company} />} />
        <PrivacyRow label="Show my education" control={<ToggleCtl k="show_education" value={privacy.show_education} />} />
        <PrivacyRow label="Show my experience" control={<ToggleCtl k="show_experience" value={privacy.show_experience} />} />
        <PrivacyRow label="Show my email on profile" control={<ToggleCtl k="show_email" value={privacy.show_email} />} />
      </div>

      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7094" }}>Discovery</h3>
        <PrivacyRow
          label="Show me in Explore and Search"
          desc="Turn off to hide from discovery feeds"
          control={<ToggleCtl k="show_in_explore" value={privacy.show_in_explore} />}
        />
      </div>

      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7094" }}>Connections</h3>
        <PrivacyRow
          label="Who can see my connections"
          control={
            <div className="flex items-center">
              <Saved k="show_connections" />
              <span className="ml-2"><Segmented value={privacy.show_connections} options={SEGMENTED_CONN} onChange={v => save({ show_connections: v as any })} /></span>
            </div>
          }
        />
        <PrivacyRow
          label="Who can see my posts"
          control={
            <div className="flex items-center">
              <Saved k="who_can_see_posts" />
              <span className="ml-2"><Segmented value={privacy.who_can_see_posts} options={SEGMENTED_POSTS} onChange={v => save({ who_can_see_posts: v as any })} /></span>
            </div>
          }
        />
      </div>

      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7094" }}>Activity</h3>
        <PrivacyRow label="Show when I'm online" control={<ToggleCtl k="show_online_status" value={privacy.show_online_status} />} />
        <PrivacyRow label="Show my recent activity" control={<ToggleCtl k="show_activity" value={privacy.show_activity} />} />
      </div>
    </div>
  );
};

/* ── Display Preference Section (replaces Additional Roles) ── */
const DisplaySection = ({ userId }: { userId: string }) => {
  const { profile, refreshProfile } = useAuth();
  const [pref, setPref] = useState<DisplayPreference>(
    (profile?.display_preference as DisplayPreference) || DEFAULT_DISPLAY_PREFERENCE,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_preference) setPref(profile.display_preference as DisplayPreference);
  }, [profile?.display_preference]);

  const choose = async (val: DisplayPreference) => {
    if (val === pref) return;
    setPref(val);
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_preference: val }).eq("id", userId);
    setSaving(false);
    if (error) { tiikToast.error("Failed to save"); return; }
    await refreshProfile();
    tiikToast.success("Display preference updated");
  };

  const previewName = profile?.full_name || "Your Name";
  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace(/_/g, " ")
    : "Your Role";
  const previewSubtype = profile?.role_subtype || "";
  const previewCompany = (profile as any)?.currently_working_at || profile?.institution_name || "Your Company";

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Profile Display</h3>
        <p className="text-[13px] mb-4" style={{ color: "#6B7094" }}>Choose how your name, role, and company appear to others across the platform.</p>

        <div className="space-y-2.5">
          {DISPLAY_PREFERENCE_OPTIONS.map(opt => {
            const active = pref === opt.value;
            const showName = opt.value !== "dp_only";
            const showRole = opt.value === "dp_name_profession" || opt.value === "dp_name_profession_company";
            const showCompany = opt.value === "dp_name_profession_company";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => choose(opt.value)}
                disabled={saving}
                className="w-full text-left p-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 disabled:opacity-60"
                style={{
                  background: active ? "rgba(232,115,58,0.08)" : "var(--surface-2)",
                  border: active ? "1.5px solid #E8733A" : "1.5px solid var(--border)",
                }}
              >
                <AvatarSquare src={profile?.avatar_url} name={previewName} size={40} />
                <div className="flex-1 min-w-0">
                  {showName ? (
                    <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A2E" }}>{previewName}</p>
                  ) : (
                    <p className="text-[12px] italic" style={{ color: "#9CA3AF" }}>(name hidden)</p>
                  )}
                  {showRole && (
                    <p className="text-[11px] truncate" style={{ color: "#6B7094" }}>
                      {roleLabel}{previewSubtype ? ` · ${previewSubtype}` : ""}
                    </p>
                  )}
                  {showCompany && (
                    <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{previewCompany}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <div className="text-[12px] font-bold mb-0.5" style={{ color: active ? "#E8733A" : "#1A1A2E" }}>{opt.label}</div>
                  <div className="text-[10px]" style={{ color: "#6B7094" }}>{opt.desc}</div>
                </div>
                <div className="shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ border: active ? "2px solid #E8733A" : "2px solid #D1D5DB", background: active ? "#E8733A" : "transparent" }}>
                    {active && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SubscriptionSection = ({ userId }: { userId: string | null }) => {
  const { subscription, trialDaysRemaining, isTrialExpired, hasAccess } = useOrgSubscription();

  if (!subscription) {
    return (
      <div className="glass-light" style={{ padding: 20, borderRadius: 20 }}>
        <p className="text-[14px]" style={{ color: "#6B7094" }}>No subscription found. Contact support@tiikme.com.</p>
      </div>
    );
  }

  const planLabel = subscription.plan === "trial" ? "Free Trial" : subscription.plan === "basic" ? "Basic" : "Premium";
  const statusColor = hasAccess ? "#34C759" : "#EF4444";

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 20, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Subscription</h3>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: "#6B7094" }}>Current Plan</p>
            <p className="text-[18px] font-bold" style={{ color: "#1A1A2E" }}>{planLabel}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: "#6B7094" }}>Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor }} />
              <p className="text-[18px] font-bold" style={{ color: statusColor }}>{hasAccess ? "Active" : "Expired"}</p>
            </div>
          </div>
        </div>

        {subscription.plan === "trial" && (
          <div className="rounded-xl p-4 mb-4" style={{
            background: isTrialExpired ? "rgba(239,68,68,0.06)" : "rgba(232,115,58,0.06)",
            border: `1px solid ${isTrialExpired ? "rgba(239,68,68,0.15)" : "rgba(232,115,58,0.15)"}`,
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: isTrialExpired ? "#EF4444" : "#E8733A" }}>
                  {isTrialExpired ? "Trial Expired" : `${trialDaysRemaining} days remaining`}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>
                  Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {!isTrialExpired && (
                <div className="h-8 px-3 rounded-lg flex items-center" style={{ background: "rgba(232,115,58,0.12)" }}>
                  <p className="text-[12px] font-bold" style={{ color: "#E8733A" }}>{trialDaysRemaining}d</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-[13px] font-semibold mb-2" style={{ color: "#1A1A2E" }}>Included Features</p>
          <div className="space-y-2">
            {["Workspace & Team Messaging", "Verification Approvals", "Opportunity Posting"].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: hasAccess ? "#34C759" : "#9CA3AF" }} />
                <span className="text-[13px]" style={{ color: hasAccess ? "#1A1A2E" : "#9CA3AF" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {(isTrialExpired || subscription.plan === "trial") && (
          <button
            type="button"
            onClick={() => tiikToast("Payment integration coming soon. Contact support@tiikme.com")}
            className="w-full h-12 rounded-xl text-[15px] font-semibold text-white cursor-pointer active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none" }}
          >
            {isTrialExpired ? "Subscribe — ₹299/month" : "Upgrade to Basic — ₹299/month"}
          </button>
        )}
        <p className="text-[11px] text-center mt-2" style={{ color: "#9CA3AF" }}>
          50% off for the first 3 months. Regular price ₹599/month.
        </p>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, profile: authProfile } = useAuth();
  const isInstitutionAccount = authProfile?.account_type === "institution";

  const settingsNavItems = [
    ...baseNavItems.filter(item => !(isInstitutionAccount && item.id === "display")),
    ...(isInstitutionAccount ? [
      { id: "team", label: "Team Access", icon: UserPlus },
      { id: "subscription", label: "Subscription", icon: CreditCard },
    ] : []),
  ];

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    const validTabs = ["profile", "account", "display", "privacy", "invite", "legal", "help", "team", "subscription"];
    return validTabs.includes(tab || "") ? tab! : "profile";
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const seedProfile = () => ({
    name: authProfile?.full_name || "",
    headline: (authProfile as any)?.headline || "",
    bio: (authProfile as any)?.bio || "",
    institution: (authProfile as any)?.institution_name || "",
    city: (authProfile as any)?.location_city || "",
    state: (authProfile as any)?.location_state || "",
    slug: (authProfile as any)?.username || "",
    avatar_url: authProfile?.avatar_url || "",
    org_type: "",
  });
  const [profile, setProfile] = useState(seedProfile);
  const [originalProfile, setOriginalProfile] = useState(seedProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  // Re-seed local state when authProfile becomes available (handles cold load timing)
  useEffect(() => {
    if (authProfile && !profile.name && authProfile.full_name) {
      const seeded = seedProfile();
      setProfile(seeded);
      setOriginalProfile(seeded);
    }
  }, [authProfile?.full_name]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setUserId(u.id);
      const { data } = await supabase.from("profiles").select("full_name, headline, bio, institution_name, location_city, location_state, username, avatar_url").eq("id", u.id).maybeSingle();
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
          org_type: "",
        };
        if (isInstitutionAccount && authProfile?.org_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("name, logo_url, type, slug")
            .eq("id", authProfile.org_id)
            .maybeSingle();
          if (orgData) {
            p.name = orgData.name || p.name;
            p.avatar_url = orgData.logo_url || p.avatar_url;
            p.org_type = orgData.type || "";
          }
        }
        setProfile(p);
        setOriginalProfile(p);
        if (data.username) {
          const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", data.username);
          setInviteCount(count || 0);
        }
      }
    };
    loadProfile();
  }, [isInstitutionAccount, authProfile?.org_id]);

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
    if (error) { setSaving(false); tiikToast.error("Failed to save"); return; }

    if (isInstitutionAccount && authProfile?.org_id) {
      const { error: orgErr } = await supabase.from("organizations")
        .update({ name: profile.name, type: profile.org_type || null })
        .eq("id", authProfile.org_id);
      if (orgErr) { setSaving(false); tiikToast.error("Failed to save organization"); return; }
    }

    setSaving(false);
    setOriginalProfile({ ...profile });
    await refreshProfile();
    tiikToast.success("Saved");
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
    tiikToast.success("Avatar updated");
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    localStorage.clear();
    setTimeout(() => navigate("/signin"), 500);
  };

  const handleDeactivate = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ is_active: false } as any).eq("id", user.id);
    await supabase.auth.signOut();
    localStorage.clear();
    tiikToast.success("Account deactivated");
    navigate("/");
  };

  const cleanSlug = cleanUsername(profile.slug);
  const inviteLink = `https://tiikme.in/invite/${cleanSlug}`;
  const inviteMessage = `${profile.name} has invited you to create a verified professional profile on Tiikme. Join here: ${inviteLink}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopied(true);
    tiikToast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteMessage)}`, "_blank");
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  const shareEmail = () => window.open(`mailto:?subject=${encodeURIComponent("Join Tiikme")}&body=${encodeURIComponent(inviteMessage)}`, "_blank");

  return (
    <>
    <PageSEO title="Settings | Tiikme" description="Manage your Tiikme account settings, privacy, and preferences." noIndex />
    <motion.div
      animate={loggingOut ? { scale: 0.97, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="max-w-[960px] mx-auto px-3 md:px-6 py-7"
    >
      <h1 className="text-[20px] font-extrabold mb-5" style={{ color: "#1A1A2E", letterSpacing: "-0.01em" }}>Settings</h1>

      <div className="flex gap-6">
        {/* Desktop nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="sticky top-20 space-y-0.5">
            {settingsNavItems.map(item => (
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
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 8, paddingTop: 8 }}>
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile tabs */}
          <div className="md:hidden flex flex-wrap gap-1.5 mb-5">
            {settingsNavItems.map(item => (
              <button type="button" key={item.id} onClick={() => setActiveTab(item.id)}
                className="text-[11px] px-3 h-7 rounded-full cursor-pointer"
                style={{
                  background: activeTab === item.id ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "rgba(0,0,0,0.04)",
                  color: activeTab === item.id ? "white" : "#1A1A2E",
                  border: activeTab === item.id ? "none" : "1px solid rgba(0,0,0,0.08)",
                  fontWeight: activeTab === item.id ? 700 : 600,
                }}>
                {item.label}
              </button>
            ))}
            <button type="button" onClick={handleSignOut}
              className="text-[11px] px-3 h-7 rounded-full cursor-pointer"
              style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)", fontWeight: 600 }}>
              Sign out
            </button>
          </div>

          {/* Profile tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 20, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-5" style={{ color: "#1A1A2E" }}>Edit Profile</h3>
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <AvatarSquare src={profile.avatar_url || authProfile?.avatar_url} name={profile.name || authProfile?.full_name || "?"} size="xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center" style={{ transition: "opacity 0.2s", borderRadius: 0 }}>
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: "#1A1A2E" }}>{profile.name || "Your Name"}</p>
                    <p className="text-[12px]" style={{ color: "#6B7094" }}>Click avatar to change</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>{isInstitutionAccount ? "Organization Name" : "Display Name"}</label>
                    <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  {isInstitutionAccount ? (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Organization Type</label>
                      <select
                        value={profile.org_type}
                        onChange={e => setProfile({ ...profile, org_type: e.target.value })}
                        className="w-full rounded-xl px-3.5 h-11 text-[14px] outline-none"
                        style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}
                      >
                        <option value="">Select type…</option>
                        {ORG_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Headline</label>
                      <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value.slice(0, 80) })} maxLength={80} />
                      <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{profile.headline.length}/80</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value.slice(0, 300) })} placeholder="Tell people about yourself..." rows={3} maxLength={300}
                      className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                      style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                    <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{profile.bio.length}/300</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>City</label><Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
                    <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>State</label><Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} /></div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Username</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]" style={{ color: "var(--text-3)" }}>tiikme.in/</span>
                      <Input value={profile.slug} disabled className="flex-1 opacity-60" />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>Username cannot be changed</p>
                  </div>
                  {/* Open to Work toggle moved to Profile page header */}
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
          )}

          {/* Account tab */}
          {activeTab === "account" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Account</h3>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Account Email</label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                </div>
              </div>

              <LinkedAccounts />

              <div className="rounded-2xl p-5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Deactivate Account</h3>
                <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>Your profile will be hidden from everyone. You can reactivate by signing in again.</p>
                {!showDeleteModal ? (
                  <button type="button" onClick={() => setShowDeleteModal(true)}
                    className="text-[13px] font-semibold cursor-pointer" style={{ color: "#DC2626", background: "none", border: "none" }}>
                    Deactivate my account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[13px]" style={{ color: "#1A1A2E" }}>Are you sure you want to deactivate your account? Your profile will be hidden.</p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                      <Button variant="destructive" size="sm" onClick={handleDeactivate}>Deactivate</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Display preference */}
          {activeTab === "display" && userId && (
            <DisplaySection userId={userId} />
          )}

          {/* Privacy */}
          {activeTab === "privacy" && (
            <PrivacySection userId={userId} />
          )}

          {/* Invite */}
          {activeTab === "invite" && (
            <div className="space-y-5">
              <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
                <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Invite Friends to Tiikme</h3>
                <p className="text-[14px] mb-5" style={{ color: "#6B7094" }}>Share your verified professional network with others</p>

                <div className="rounded-[10px] p-3 mb-4 flex items-center gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="flex-1 text-[13px] truncate" style={{ color: "var(--text-1)" }}>{inviteLink}</p>
                  <button type="button" onClick={copyInviteLink}
                    className="h-8 px-3 rounded-lg text-[12px] font-bold cursor-pointer active:scale-95 flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
                    <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  <button type="button" onClick={shareWhatsApp} className="h-10 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5" style={{ background: "rgba(37,211,102,0.10)", color: "#25D366", border: "1px solid rgba(37,211,102,0.20)" }}>
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </button>
                  <button type="button" onClick={shareTelegram} className="h-10 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5" style={{ background: "rgba(0,136,204,0.10)", color: "#0088CC", border: "1px solid rgba(0,136,204,0.20)" }}>
                    <Send className="w-4 h-4" /> Telegram
                  </button>
                  <button type="button" onClick={shareTwitter} className="h-10 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5" style={{ background: "rgba(0,0,0,0.06)", color: "#1A1A2E", border: "1px solid rgba(0,0,0,0.10)" }}>
                    <Share2 className="w-4 h-4" /> X
                  </button>
                  <button type="button" onClick={shareEmail} className="h-10 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5" style={{ background: "rgba(232,115,58,0.10)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.20)" }}>
                    <Copy className="w-4 h-4" /> Email
                  </button>
                </div>

                <div className="rounded-xl p-4 text-center" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>
                  <p className="text-[28px] font-extrabold" style={{ color: "var(--brand)" }}>{inviteCount}</p>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
                    {inviteCount === 1 ? "person has" : "people have"} joined from your invite
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Team Access (institution only) */}
          {activeTab === "team" && isInstitutionAccount && authProfile?.org_id && (
            <TeamAccessSection orgId={authProfile.org_id} currentUserId={userId} />
          )}

          {/* Subscription (institution only) */}
          {activeTab === "subscription" && (
            <SubscriptionSection userId={userId} />
          )}

          {/* Legal */}
          {activeTab === "legal" && <LegalSection />}

          {/* Help */}
          {activeTab === "help" && (
            <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Help & Support</h3>
              <p className="text-[14px] mb-4" style={{ color: "#6B7094" }}>Need help? Reach out to us.</p>
              <div className="space-y-3">
                <a href="mailto:contact@tiikme.com" className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <Mail className="w-4 h-4" style={{ color: "#E8733A" }} />
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>Email Support</p>
                    <p className="text-[12px]" style={{ color: "#6B7094" }}>contact@tiikme.com</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
};

const ADMIN_ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hiring_manager: "Hiring Manager",
  verifier: "Verifier",
};

const TeamAccessSection = ({ orgId, currentUserId }: { orgId: string; currentUserId: string | null }) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  const [inviteRole, setInviteRole] = useState("admin");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadAdmins = async () => {
    const { data } = await supabase
      .from("org_admins")
      .select("*, profile:profiles!org_admins_user_id_fkey(id, full_name, avatar_url, headline)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => { loadAdmins(); }, [orgId]);

  useEffect(() => {
    if (inviteQuery.trim().length < 2) { setInviteResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, username, headline")
        .or(`full_name.ilike.%${inviteQuery.trim()}%,username.ilike.%${inviteQuery.trim()}%`)
        .limit(5);
      setInviteResults((data || []).filter(p => !admins.some(a => a.user_id === p.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [inviteQuery, admins]);

  const addAdmin = async (profile: any) => {
    setAdding(true);
    const { error } = await supabase.from("org_admins").insert({
      org_id: orgId, user_id: profile.id, role: inviteRole,
    });
    if (error) {
      tiikToast("Couldn't add team member. They may already be an admin.", "error");
    } else {
      tiikToast(`${profile.full_name} added as ${ADMIN_ROLE_LABELS[inviteRole]}`, "success");
      // Notify the newly added member in-app
      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "org_admin_invite",
        title: "You've been added to an organisation team",
        body: `You now have ${ADMIN_ROLE_LABELS[inviteRole]} access. Check your verification inbox or applicants dashboard.`,
        action_url: inviteRole === "verifier" ? "/app/verification-inbox" : "/app/opportunities/applicants",
      });
    }
    setInviteQuery(""); setInviteResults([]);
    await loadAdmins();
    setAdding(false);
  };

  const revokeAdmin = async (adminId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from team?`)) return;
    await supabase.from("org_admins").delete().eq("id", adminId);
    setAdmins(prev => prev.filter(a => a.id !== adminId));
    tiikToast(`${name} removed from team`, "success");
  };

  return (
    <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
      <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Team Access</h3>
      <p className="text-[13px] mb-4" style={{ color: "#6B7094" }}>Manage who can access your organisation's workspace and manage applicants.</p>

      {/* Current admins */}
      <div className="space-y-2 mb-5">
        {loading ? (
          <div className="animate-pulse h-12 rounded-xl" style={{ background: "var(--surface-2)" }} />
        ) : admins.map(a => {
          const isOwner = a.role === "owner";
          const isCurrentUser = a.user_id === currentUserId;
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <AvatarSquare src={a.profile?.avatar_url} name={a.profile?.full_name || "Member"} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="truncate text-[14px] font-semibold" style={{ color: "#1A1A2E" }}>{a.profile?.full_name || "Member"}</p>
                <p className="truncate text-[12px]" style={{ color: "#9CA3C0" }}>{a.profile?.headline || ""}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isOwner && <Crown style={{ width: 14, height: 14, color: "#FFB800" }} />}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: isOwner ? "rgba(255,184,0,0.12)" : "rgba(232,115,58,0.10)",
                  color: isOwner ? "#B45309" : "#E8733A",
                }}>{ADMIN_ROLE_LABELS[a.role] || a.role}</span>
                {!isOwner && !isCurrentUser && (
                  <button type="button" onClick={() => revokeAdmin(a.id, a.profile?.full_name || "Member")}
                    className="cursor-pointer flex items-center justify-center"
                    style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "none" }}>
                    <X style={{ width: 13, height: 13, color: "#EF4444" }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add member */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A2E" }}>Add team member</p>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <input type="text" value={inviteQuery} onChange={e => setInviteQuery(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full text-[13px] rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#1A1A2E", outline: "none" }} />
            {inviteResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10" style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
                {inviteResults.map(p => (
                  <button key={p.id} type="button" disabled={adding}
                    onClick={() => addAdmin(p)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <AvatarSquare src={p.avatar_url} name={p.full_name || "User"} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="truncate text-[13px] font-semibold" style={{ color: "#1A1A2E" }}>{p.full_name}</p>
                      <p className="truncate text-[11px]" style={{ color: "#9CA3C0" }}>@{p.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && <p className="text-[11px] mt-1" style={{ color: "#9CA3C0" }}>Searching…</p>}
          </div>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="text-[12px] rounded-xl px-2 py-2 cursor-pointer"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#1A1A2E" }}>
            <option value="admin">Admin</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="verifier">Verifier</option>
          </select>
        </div>
        <p className="text-[11px]" style={{ color: "#9CA3C0" }}>
          Admin: full access · Hiring Manager: applicants only · Verifier: verification requests only
        </p>
      </div>
    </div>
  );
};

const LegalSection = () => {
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const items = [
    { icon: FileText, label: "Terms of Service", desc: "Read our terms", href: "/terms", external: true },
    { icon: Shield, label: "Privacy Policy", desc: "How we handle your data", href: "/privacy", external: true },
    { icon: Mail, label: "Contact Support", desc: "contact@tiikme.com", href: "mailto:contact@tiikme.com", external: false },
  ];
  return (
    <>
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Legal</h3>
        <p className="text-[13px] mb-4" style={{ color: "#6B7094" }}>Terms, privacy, and account controls.</p>
        <div className="space-y-3">
          {items.map(it => (
            <a key={it.label} href={it.href} target={it.external ? "_blank" : undefined} rel={it.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <it.icon className="w-4 h-4" style={{ color: "#E8733A" }} />
              <div>
                <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>{it.label}</p>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>{it.desc}</p>
              </div>
            </a>
          ))}
          <button type="button" onClick={() => setShowDelete(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer text-left"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
            <div>
              <p className="text-[14px] font-medium" style={{ color: "#EF4444" }}>Delete My Account</p>
              <p className="text-[12px]" style={{ color: "#6B7094" }}>Permanently remove your account and data</p>
            </div>
          </button>
        </div>
      </div>
      <DeleteAccountModal open={showDelete} onClose={() => setShowDelete(false)} userId={user?.id ?? null} />
    </>
  );
};

export default SettingsPage;
