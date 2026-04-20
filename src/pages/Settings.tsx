import AvatarSquare from "@/components/ui/AvatarSquare";
import { storageImageUrl } from "@/lib/imageTransform";
import { cleanUsername } from "@/lib/cleanUsername";
import { useState, useEffect, useRef } from "react";
import { Check, Camera, User, Eye, Lock, LogOut, Users, Copy, Share2, HelpCircle, MessageSquare, Send, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgSubscription } from "@/hooks/useOrgSubscription";
import { DISPLAY_PREFERENCE_OPTIONS, DEFAULT_DISPLAY_PREFERENCE, type DisplayPreference } from "@/utils/displayProfile";

const baseNavItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "display", label: "Profile Display", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "invite", label: "Invite", icon: Users },
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

const ADDITIONAL_ROLES = [
  "Investor", "Startup Founder", "Freelancer", "Gig Worker",
  "Stock Market Trader/Analyst", "Content Creator", "Restaurant/Cafe Owner",
  "Small Business Owner", "Consultant", "Coach/Mentor",
  "Real Estate Professional", "Farmer/Agriculture", "Artist/Designer",
  "Musician", "Athlete", "Social Worker", "Politician",
  "Journalist/Media", "Lawyer/Legal", "Chartered Accountant", "Teacher/Tutor",
];

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

const PrivacySection = ({ userId }: { userId: string | null }) => {
  const [privacy, setPrivacy] = useState({
    profile_visibility: "public",
    show_in_search: true,
    show_current_company: true,
    show_location: true,
    who_can_message: "everyone",
    who_can_see_connections: "everyone",
    contact_email_visible: false,
    profile_view_notifications: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("privacy_settings").eq("id", userId).maybeSingle().then(({ data }) => {
      if (data?.privacy_settings) {
        const s = data.privacy_settings as any;
        setPrivacy({
          profile_visibility: s.profile_visibility || "public",
          show_in_search: s.show_in_search !== false,
          show_current_company: s.show_current_company !== false,
          show_location: s.show_location !== false,
          who_can_message: s.who_can_message || "everyone",
          who_can_see_connections: s.who_can_see_connections || "everyone",
          contact_email_visible: !!s.contact_email_visible,
          profile_view_notifications: s.profile_view_notifications !== false,
        });
      }
      setLoaded(true);
    });
  }, [userId]);

  const save = async (patch: Partial<typeof privacy>) => {
    const updated = { ...privacy, ...patch };
    setPrivacy(updated);
    if (!userId) return;
    await supabase.from("profiles").update({ privacy_settings: updated as any }).eq("id", userId);
    tiikToast.success("Privacy updated");
  };

  if (!loaded) return <div className="glass-light animate-pulse h-48" style={{ borderRadius: 20 }} />;

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Contact & Display</h3>
        <Toggle label="Show email on profile" desc="Display your contact email publicly" value={privacy.contact_email_visible} onChange={v => save({ contact_email_visible: v })} />
        <Toggle label="Show in Explore & Search" value={privacy.show_in_search} onChange={v => save({ show_in_search: v })} />
        <Toggle label="Show Current Company" value={privacy.show_current_company} onChange={v => save({ show_current_company: v })} />
        <Toggle label="Show Location" value={privacy.show_location} onChange={v => save({ show_location: v })} />
      </div>

      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Who Can Message Me</h3>
        <p className="text-[12px] mb-4" style={{ color: "#6B7094" }}>Control who can start a conversation</p>
        <div className="space-y-2">
          {MESSAGE_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => save({ who_can_message: opt.value })}
              className="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: privacy.who_can_message === opt.value ? "rgba(232,115,58,0.10)" : "var(--surface-2)",
                border: privacy.who_can_message === opt.value ? "1.5px solid rgba(232,115,58,0.40)" : "1.5px solid var(--border)",
              }}>
              <span className="text-[14px] font-medium" style={{ color: privacy.who_can_message === opt.value ? "#E8733A" : "#1A1A2E" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Who Can See My Connections</h3>
        <p className="text-[12px] mb-4" style={{ color: "#6B7094" }}>Control connection list visibility</p>
        <div className="space-y-2">
          {CONNECTIONS_VIS_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => save({ who_can_see_connections: opt.value })}
              className="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: privacy.who_can_see_connections === opt.value ? "rgba(232,115,58,0.10)" : "var(--surface-2)",
                border: privacy.who_can_see_connections === opt.value ? "1.5px solid rgba(232,115,58,0.40)" : "1.5px solid var(--border)",
              }}>
              <span className="text-[14px] font-medium" style={{ color: privacy.who_can_see_connections === opt.value ? "#E8733A" : "#1A1A2E" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Additional Roles Section ── */
interface AdditionalRole {
  id?: string;
  role_name: string;
  designation: string;
  about: string;
  links: { label: string; url: string }[];
  achievements: string;
  show_on_profile: boolean;
}

const AdditionalRolesSection = ({ userId }: { userId: string }) => {
  const [savedRoles, setSavedRoles] = useState<AdditionalRole[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [form, setForm] = useState<AdditionalRole>({ role_name: "", designation: "", about: "", links: [], achievements: "", show_on_profile: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("user_additional_roles").select("*").eq("user_id", userId).then(({ data }) => {
      if (data) setSavedRoles(data.map((d: any) => ({ ...d, links: d.links || [] })));
    });
  }, [userId]);

  const isRoleActive = (name: string) => savedRoles.some(r => r.role_name === name);

  const handleRoleClick = (name: string) => {
    const existing = savedRoles.find(r => r.role_name === name);
    if (existing) {
      setEditingRole(name);
      setForm({ ...existing });
    } else {
      setEditingRole(name);
      setForm({ role_name: name, designation: "", about: "", links: [{ label: "", url: "" }], achievements: "", show_on_profile: false });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const existing = savedRoles.find(r => r.role_name === form.role_name);
    const payload = {
      user_id: userId,
      role_name: form.role_name,
      designation: form.designation || null,
      about: form.about || null,
      links: form.links.filter(l => l.url.trim()),
      achievements: form.achievements || null,
      show_on_profile: form.show_on_profile,
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await supabase.from("user_additional_roles").update(payload as any).eq("id", existing.id);
    } else {
      await supabase.from("user_additional_roles").insert(payload as any);
    }
    const { data } = await supabase.from("user_additional_roles").select("*").eq("user_id", userId);
    if (data) setSavedRoles(data.map((d: any) => ({ ...d, links: d.links || [] })));
    setSaving(false);
    setEditingRole(null);
    tiikToast.success("Role saved");
  };

  const handleRemove = async (roleName: string) => {
    const existing = savedRoles.find(r => r.role_name === roleName);
    if (existing?.id) {
      await supabase.from("user_additional_roles").delete().eq("id", existing.id);
      setSavedRoles(prev => prev.filter(r => r.role_name !== roleName));
    }
    setEditingRole(null);
    tiikToast.success("Role removed");
  };

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Additional Roles</h3>
        <p className="text-[13px] mb-4" style={{ color: "#6B7094" }}>Add professional roles beyond your primary profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ADDITIONAL_ROLES.map(name => {
            const active = isRoleActive(name);
            return (
              <button key={name} type="button" onClick={() => handleRoleClick(name)}
                className="text-left px-3 py-3 rounded-[10px] cursor-pointer transition-all flex items-center gap-2"
                style={{
                  background: active ? "rgba(232,115,58,0.08)" : "var(--surface-2)",
                  border: active ? "1.5px solid #E8733A" : "1.5px solid var(--border)",
                }}>
                <TrendingUp className="w-4 h-4 shrink-0" style={{ color: active ? "#E8733A" : "#6B7094" }} />
                <span className="text-[13px] font-semibold" style={{ color: active ? "#E8733A" : "#1A1A2E" }}>{name}</span>
                {active && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: "#E8733A" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {editingRole && (
        <div className="glass-light" style={{ padding: 16, borderRadius: 20, borderLeft: "3px solid #E8733A" }}>
          <h3 className="text-[15px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>{editingRole}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Designation/Title</label>
              <Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Angel Investor" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>About</label>
              <textarea value={form.about} onChange={e => setForm({ ...form, about: e.target.value.slice(0, 300) })} placeholder="Describe what you do in this role" rows={3} maxLength={300}
                className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
              <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{form.about.length}/300</p>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Links (up to 3)</label>
              {(form.links.length === 0 ? [{ label: "", url: "" }] : form.links).map((link, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input value={link.label} onChange={e => {
                    const links = [...form.links.length ? form.links : [{ label: "", url: "" }]];
                    links[i] = { ...links[i], label: e.target.value };
                    setForm({ ...form, links });
                  }} placeholder="Label" className="w-1/3" />
                  <Input value={link.url} onChange={e => {
                    const links = [...form.links.length ? form.links : [{ label: "", url: "" }]];
                    links[i] = { ...links[i], url: e.target.value };
                    setForm({ ...form, links });
                  }} placeholder="https://..." className="flex-1" />
                </div>
              ))}
              {form.links.length < 3 && (
                <button type="button" onClick={() => setForm({ ...form, links: [...(form.links.length ? form.links : [{ label: "", url: "" }]), { label: "", url: "" }] })}
                  className="text-[12px] font-medium cursor-pointer" style={{ color: "#E8733A" }}>+ Add link</button>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7094" }}>Achievements/Portfolio</label>
              <textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value.slice(0, 500) })} placeholder="Notable achievements, certifications, or portfolio highlights" rows={3} maxLength={500}
                className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
            </div>
            <Toggle label="Show on profile" desc="Display this role on your public profile" value={form.show_on_profile} onChange={v => setForm({ ...form, show_on_profile: v })} />
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 h-10 rounded-2xl text-[13px] font-bold transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Role"}
              </button>
              {isRoleActive(editingRole) && (
                <button type="button" onClick={() => handleRemove(editingRole)}
                  className="h-10 px-4 rounded-2xl text-[13px] font-bold cursor-pointer"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}>
                  Remove
                </button>
              )}
              <button type="button" onClick={() => setEditingRole(null)}
                className="h-10 px-4 rounded-2xl text-[13px] font-medium cursor-pointer"
                style={{ background: "var(--surface-2)", color: "#6B7094", border: "1px solid var(--border)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
    ...baseNavItems.filter(item => !(isInstitutionAccount && item.id === "roles")),
    ...(isInstitutionAccount ? [{ id: "subscription", label: "Subscription", icon: CreditCard }] : []),
  ];

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", headline: "", bio: "", institution: "", city: "", state: "", slug: "", avatar_url: "", org_type: "", open_to_work: false });
  const [originalProfile, setOriginalProfile] = useState({ name: "", headline: "", bio: "", institution: "", city: "", state: "", slug: "", avatar_url: "", org_type: "", open_to_work: false });
  const [userId, setUserId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setUserId(u.id);
      const { data } = await supabase.from("profiles").select("full_name, headline, bio, institution_name, location_city, location_state, username, avatar_url, open_to_work").eq("id", u.id).maybeSingle();
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
          open_to_work: !!data.open_to_work,
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
      open_to_work: profile.open_to_work,
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
                    <AvatarSquare src={profile.avatar_url} name={profile.name || "U"} size="xl" />
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
                  {!isInstitutionAccount && (
                    <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <span className="text-[14px] font-semibold" style={{ color: "#1A1A2E" }}>Open to Work</span>
                        <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>Show recruiters and connections you're looking for opportunities</p>
                      </div>
                      <button type="button"
                        onClick={() => setProfile(p => ({ ...p, open_to_work: !p.open_to_work }))}
                        className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95 shrink-0"
                        style={{ background: profile.open_to_work ? "#34C759" : "rgba(0,0,0,0.12)", border: "none", transition: "all 0.2s" }}>
                        <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: profile.open_to_work ? "translateX(20px)" : "translateX(0)" }} />
                      </button>
                    </div>
                  )}
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

          {/* Additional Roles */}
          {activeTab === "roles" && userId && (
            <AdditionalRolesSection userId={userId} />
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

          {/* Subscription (institution only) */}
          {activeTab === "subscription" && (
            <SubscriptionSection userId={userId} />
          )}

          {/* Help */}
          {activeTab === "help" && (
            <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: "#1A1A2E" }}>Help & Support</h3>
              <p className="text-[14px] mb-4" style={{ color: "#6B7094" }}>Need help? Reach out to us.</p>
              <div className="space-y-3">
                <a href="mailto:support@tiikme.in" className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <Copy className="w-4 h-4" style={{ color: "#E8733A" }} />
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>Email Support</p>
                    <p className="text-[12px]" style={{ color: "#6B7094" }}>support@tiikme.in</p>
                  </div>
                </a>
                <a href="/grievance" className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <HelpCircle className="w-4 h-4" style={{ color: "#E8733A" }} />
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>File a Grievance</p>
                    <p className="text-[12px]" style={{ color: "#6B7094" }}>Report issues or concerns</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
