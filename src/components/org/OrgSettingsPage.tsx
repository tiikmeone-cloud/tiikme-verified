import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";

const SECTIONS = ["General", "Branding", "Team & Access", "Verification", "Opportunities", "Messaging", "Notifications", "Danger Zone"] as const;
const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–1000", "1000–5000", "5000+"];

export default function OrgSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<typeof SECTIONS[number]>("General");
  const [form, setForm] = useState<any>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug || !user) return;
      try {
        const { data: orgData } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
        if (!orgData) { setLoading(false); return; }
        setOrg(orgData);
        setForm({ name: orgData.name || "", tagline: orgData.tagline || "", description: orgData.description || "", founded_year: orgData.founded_year || "", employee_count: orgData.employee_count || "", type: orgData.type || "", website_url: orgData.website_url || "", email: orgData.email || "", phone: orgData.phone || "", allow_messages: orgData.allow_messages ?? true, allow_employee_requests: orgData.allow_employee_requests ?? true });
        const { data: member } = await supabase.from("org_members").select("role").eq("org_id", orgData.id).eq("user_id", user.id).maybeSingle();
        setIsAdmin(member?.role === "owner" || member?.role === "admin" || orgData.created_by === user.id);
      } catch (e) { console.warn("[OrgSettings] error:", e); }
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("organizations").update({
        name: form.name, tagline: form.tagline, description: form.description,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        employee_count: form.employee_count, type: form.type,
        website_url: form.website_url, email: form.email, phone: form.phone,
        allow_messages: form.allow_messages, allow_employee_requests: form.allow_employee_requests,
      }).eq("id", org.id);
      if (error) toast.error(error.message);
      else toast.success("Settings saved");
    } catch (e) { console.warn("[OrgSettings] save error:", e); toast.error("Save failed"); }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    setUploadingLogo(true);
    try {
      const path = `${org.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });
      if (upErr) { toast.error(upErr.message); setUploadingLogo(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(path);
      await supabase.from("organizations").update({ logo_url: publicUrl }).eq("id", org.id);
      setOrg((prev: any) => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo updated!");
    } catch { toast.error("Upload failed"); }
    setUploadingLogo(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Cover must be under 5MB"); return; }
    setUploadingCover(true);
    try {
      const path = `${org.id}/cover-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("cover-images").upload(path, file, { upsert: true });
      if (upErr) { toast.error(upErr.message); setUploadingCover(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("cover-images").getPublicUrl(path);
      await supabase.from("organizations").update({ cover_url: publicUrl }).eq("id", org.id);
      setOrg((prev: any) => ({ ...prev, cover_url: publicUrl }));
      toast.success("Cover updated!");
    } catch { toast.error("Upload failed"); }
    setUploadingCover(false);
  };

  if (loading) return <PageLoader />;
  if (!org || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F2" }}>
      <p className="text-[14px]" style={{ color: "#6B6B6B" }}>Access denied or page not found</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F2" }}>
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: "#F0E8E0" }}>
        <button type="button" onClick={() => navigate(`/org/${slug}`)} className="flex items-center gap-2 text-[13px]" style={{ color: "#6B6B6B" }}>
          <ArrowLeft className="w-4 h-4" /> Back to page
        </button>
        <span className="text-[15px] font-bold" style={{ color: "#1A1A1A" }}>Page Settings</span>
      </div>

      <div className="max-w-[960px] mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-[200px] shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {SECTIONS.map(s => (
              <button key={s} type="button" onClick={() => setSection(s)}
                className="text-left px-3 py-2 rounded-lg text-[13px] font-medium shrink-0 transition-colors"
                style={{ background: section === s ? "rgba(232,88,10,0.08)" : "transparent", color: section === s ? "#E8580A" : "#6B6B6B" }}>
                {s}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {section === "General" && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>General</h2>
              <Field label="Organisation name"><Input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="h-12" /></Field>
              <Field label="Tagline"><Input value={form.tagline} onChange={e => setForm((p: any) => ({ ...p, tagline: e.target.value }))} className="h-12" maxLength={100} /></Field>
              <Field label="Description"><Textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} className="min-h-[120px]" maxLength={500} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Founded year"><Input type="number" value={form.founded_year} onChange={e => setForm((p: any) => ({ ...p, founded_year: e.target.value }))} className="h-12" /></Field>
                <Field label="Organisation size">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {SIZE_OPTIONS.map(s => (
                      <button key={s} type="button" onClick={() => setForm((p: any) => ({ ...p, employee_count: s }))}
                        className="text-[12px] px-3 py-1.5 rounded-full font-medium"
                        style={{ background: form.employee_count === s ? "rgba(232,88,10,0.1)" : "#F3F4F6", color: form.employee_count === s ? "#E8580A" : "#6B6B6B" }}>{s}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Website"><Input value={form.website_url} onChange={e => setForm((p: any) => ({ ...p, website_url: e.target.value }))} className="h-12" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email"><Input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} className="h-12" /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} className="h-12" /></Field>
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-1.5" style={{ background: "#E8580A", color: "#fff" }}>
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}

          {section === "Branding" && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>Branding</h2>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-[13px] font-medium mb-2" style={{ color: "#6B6B6B" }}>Logo</p>
                  <div className="w-[120px] h-[120px] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: "#F0E8E0" }}
                    onClick={() => logoRef.current?.click()}>
                    {uploadingLogo ? (
                      <span className="text-[12px]" style={{ color: "#E8580A" }}>Uploading...</span>
                    ) : org.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5" style={{ color: "#9CA3AF" }} />
                        <span className="text-[12px]" style={{ color: "#9CA3AF" }}>Upload logo</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium mb-2" style={{ color: "#6B6B6B" }}>Cover photo</p>
                  <div className="w-full h-[100px] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: "#F0E8E0" }}
                    onClick={() => coverRef.current?.click()}>
                    {uploadingCover ? (
                      <span className="text-[12px]" style={{ color: "#E8580A" }}>Uploading...</span>
                    ) : org.cover_url ? (
                      <img src={org.cover_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5" style={{ color: "#9CA3AF" }} />
                        <span className="text-[12px]" style={{ color: "#9CA3AF" }}>Upload cover</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "Verification" && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>Verification Settings</h2>
              <ToggleRow label="Allow experience verification requests" checked={form.allow_employee_requests} onChange={v => setForm((p: any) => ({ ...p, allow_employee_requests: v }))} />
              <Button onClick={handleSave} disabled={saving} style={{ background: "#E8580A", color: "#fff" }}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          )}

          {section === "Messaging" && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>Messaging</h2>
              <ToggleRow label="Allow messages to this page" checked={form.allow_messages} onChange={v => setForm((p: any) => ({ ...p, allow_messages: v }))} />
              <Button onClick={handleSave} disabled={saving} style={{ background: "#E8580A", color: "#fff" }}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          )}

          {section === "Danger Zone" && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid rgba(220,38,38,0.2)" }}>
              <h2 className="text-[18px] font-bold" style={{ color: "#DC2626" }}>Danger Zone</h2>
              <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E8E0" }}>
                <div><p className="text-[14px] font-medium" style={{ color: "#1A1A1A" }}>Deactivate page</p><p className="text-[12px]" style={{ color: "#9CA3AF" }}>Page will be hidden from search</p></div>
                <Button variant="destructive" size="sm" onClick={() => toast.info("This feature is coming soon. Stay Tiiked!")}>Deactivate</Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div><p className="text-[14px] font-medium" style={{ color: "#1A1A1A" }}>Delete page permanently</p><p className="text-[12px]" style={{ color: "#9CA3AF" }}>30-day hold then permanent deletion</p></div>
                <Button variant="destructive" size="sm" onClick={() => toast.info("This feature is coming soon. Stay Tiiked!")}>Delete</Button>
              </div>
            </div>
          )}

          {["Team & Access", "Opportunities", "Notifications"].includes(section) && (
            <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>{section}</p>
              <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>This feature is coming soon. Stay Tiiked!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-medium block mb-1" style={{ color: "#1A1A1A" }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[14px]" style={{ color: "#1A1A1A" }}>{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className="w-10 h-6 rounded-full relative transition-colors"
        style={{ background: checked ? "#E8580A" : "#D1D5DB" }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: checked ? "20px" : "4px" }} />
      </button>
    </div>
  );
}