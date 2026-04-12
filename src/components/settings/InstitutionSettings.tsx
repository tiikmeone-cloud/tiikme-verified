import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { tiikToast } from "@/components/ui/tiik-toast";
import { storageImageUrl } from "@/lib/imageTransform";
import { Camera, Building2, Globe, Users, Shield, MessageSquare, Bell, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sectionNav = [
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Camera },
  { id: "verification", label: "Verification", icon: Shield },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function InstitutionSettings() {
  const { org, refreshOrg } = useOrgIdentity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Verification
  const [allowVerifReqs, setAllowVerifReqs] = useState(true);
  const [emailDomain, setEmailDomain] = useState("");

  // Messaging
  const [allowMessages, setAllowMessages] = useState(true);

  useEffect(() => {
    if (!org) return;
    setName(org.name || "");
    setTagline(org.tagline || "");
    setDescription(org.description || "");
    setWebsite(org.website_url || "");
    setCity(org.city || "");
    setState(org.state || "");
    setFoundedYear(org.founded_year?.toString() || "");
    setEmployeeCount(org.employee_count || "");
    setEmail(org.email || "");
    setPhone(org.phone || "");
    setAllowVerifReqs(org.allow_employee_requests);
    setAllowMessages(org.allow_messages);
  }, [org]);

  const handleSaveProfile = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("organizations").update({
        name, tagline, description, website_url: website,
        city, state,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        employee_count: employeeCount || null,
        email: email || null, phone: phone || null,
      }).eq("id", org.id);
      if (error) throw error;
      await refreshOrg();
      tiikToast.success("Profile saved ✓");
    } catch (e: any) { tiikToast.error(e.message || "Save failed"); }
    setSaving(false);
  };

  const handleSaveVerification = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await supabase.from("organizations").update({
        allow_employee_requests: allowVerifReqs,
        email_domain: emailDomain || null,
      }).eq("id", org.id);
      await refreshOrg();
      tiikToast.success("Verification settings saved ✓");
    } catch (e: any) { tiikToast.error(e.message || "Save failed"); }
    setSaving(false);
  };

  const handleSaveMessaging = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await supabase.from("organizations").update({ allow_messages: allowMessages }).eq("id", org.id);
      await refreshOrg();
      tiikToast.success("Messaging settings saved ✓");
    } catch (e: any) { tiikToast.error(e.message || "Save failed"); }
    setSaving(false);
  };

  const handleDeleteOrg = async () => {
    if (!org || !confirm("Are you sure? This cannot be undone.")) return;
    try {
      await supabase.from("organizations").delete().eq("id", org.id);
      await supabase.from("profiles").update({ account_type: "user", org_id: null }).eq("id", user!.id);
      tiikToast.success("Organization deleted");
      navigate("/app/feed", { replace: true });
    } catch (e: any) { tiikToast.error(e.message || "Delete failed"); }
  };

  if (!org) return <p className="text-center py-8 text-[14px]" style={{ color: "#9CA3AF" }}>No organization linked</p>;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="hidden md:block w-[200px] shrink-0">
        <div className="sticky top-20 space-y-0.5">
          {sectionNav.map(s => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)}
              className="w-full text-left text-[13px] px-3 h-[42px] rounded-xl flex items-center gap-2.5 cursor-pointer"
              style={{
                background: section === s.id ? "var(--brand-dim)" : "transparent",
                color: section === s.id ? "var(--brand)" : "var(--text-2)",
                fontWeight: section === s.id ? 700 : 500,
              }}>
              <s.icon className="w-4 h-4" strokeWidth={1.8} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Mobile section pills */}
        <div className="md:hidden flex flex-wrap gap-1.5 mb-5">
          {sectionNav.map(s => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)}
              className="text-[11px] px-3 h-7 rounded-full cursor-pointer"
              style={{
                background: section === s.id ? "#E8580A" : "#F3F4F6",
                color: section === s.id ? "#fff" : "#6B6B6B",
                fontWeight: section === s.id ? 700 : 600,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {section === "profile" && (
          <div className="t-card p-5 space-y-4">
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Organisation Profile</h3>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Tagline</label>
              <Input value={tagline} onChange={e => setTagline(e.target.value.slice(0, 100))} maxLength={100} />
              <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{tagline.length}/100</p>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} rows={4} maxLength={500}
                className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
              <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{description.length}/500</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>City</label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>State</label><Input value={state} onChange={e => setState(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Founded Year</label><Input value={foundedYear} onChange={e => setFoundedYear(e.target.value)} type="number" /></div>
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Size</label><Input value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} placeholder="e.g. 51-200" /></div>
            </div>
            <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Website</label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Email</label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Phone</label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} style={{ background: "#E8580A", color: "#fff" }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {section === "branding" && (
          <div className="t-card p-5 space-y-4">
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Branding</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#FFF3EC", border: "2px dashed #E8580A" }}>
                {org.logo_url ? (
                  <img src={storageImageUrl(org.logo_url, "avatar")} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6" style={{ color: "#E8580A" }} />
                )}
              </div>
              <div>
                <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>Logo</p>
                <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Update your logo from the org page settings</p>
              </div>
            </div>
            <div className="h-[120px] rounded-xl flex items-center justify-center" style={{ background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, #E8580A, #C4460A)" }}>
              {!org.cover_url && <p className="text-white text-[14px]">Cover photo</p>}
            </div>
          </div>
        )}

        {section === "verification" && (
          <div className="t-card p-5 space-y-4">
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Verification Settings</h3>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>Allow verification requests</p>
                <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Members can request verification of their affiliation</p>
              </div>
              <Switch checked={allowVerifReqs} onCheckedChange={setAllowVerifReqs} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: "var(--text-3)" }}>Email Domain (auto-verification)</label>
              <Input value={emailDomain} onChange={e => setEmailDomain(e.target.value)} placeholder="e.g. company.com" />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>Users with this email domain can auto-verify</p>
            </div>
            <Button onClick={handleSaveVerification} disabled={saving} style={{ background: "#E8580A", color: "#fff" }}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}

        {section === "messaging" && (
          <div className="t-card p-5 space-y-4">
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Messaging (Pings)</h3>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>Allow messages to this page</p>
                <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Public can message your organisation</p>
              </div>
              <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
            </div>
            <Button onClick={handleSaveMessaging} disabled={saving} style={{ background: "#E8580A", color: "#fff" }}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}

        {section === "notifications" && (
          <div className="t-card p-5 space-y-1">
            <h3 className="text-[16px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Notification Preferences</h3>
            {[
              { label: "New follower", desc: "When someone follows your page" },
              { label: "New application received", desc: "When someone applies to a role" },
              { label: "Verification request", desc: "When someone requests verification" },
              { label: "New team member joined", desc: "When someone joins your team" },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>{n.label}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{n.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        )}

        {section === "danger" && (
          <div className="rounded-2xl p-5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Danger Zone</h3>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
              Permanently delete this organisation page. This cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleDeleteOrg}>Delete Organisation</Button>
          </div>
        )}
      </div>
    </div>
  );
}
