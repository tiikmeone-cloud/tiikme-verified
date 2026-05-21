import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeLogo from "@/components/ThemeLogo";
import AvatarSquare from "@/components/ui/AvatarSquare";

const ORG_TYPES = [
  { value: "tech_startup", label: "Tech / Startup", icon: "💻", desc: "Software, SaaS, product company" },
  { value: "hospital", label: "Hospital / Clinic", icon: "🏥", desc: "Healthcare, diagnostic centre" },
  { value: "college", label: "College / University", icon: "🎓", desc: "Degree-granting institution" },
  { value: "school", label: "School", icon: "📚", desc: "K-12, coaching, preschool" },
  { value: "government", label: "Government / PSU", icon: "🏛️", desc: "Ministry, department, public sector" },
  { value: "ngo", label: "NGO / Foundation", icon: "🤝", desc: "Non-profit, trust, social org" },
  { value: "sports", label: "Sports Club / Team", icon: "⚽", desc: "Club, team, sports academy" },
  { value: "media_creator", label: "Media / Creator", icon: "🎬", desc: "YouTube channel, media house, studio" },
  { value: "restaurant", label: "Restaurant / Food", icon: "🍽️", desc: "Restaurant, cafe, cloud kitchen" },
  { value: "bank", label: "Bank / NBFC", icon: "🏦", desc: "Bank, NBFC, insurance, fintech" },
  { value: "manufacturing", label: "Manufacturing", icon: "🏭", desc: "Factory, auto, industrial" },
  { value: "agency", label: "Agency / Consulting", icon: "📊", desc: "Marketing, design, consulting" },
  { value: "apparel", label: "Apparel / Retail", icon: "👕", desc: "Fashion, retail, e-commerce" },
  { value: "other", label: "Other", icon: "🏢", desc: "Something else" },
];

export default function OrgSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "",
    name: "",
    tagline: "",
    city: "",
    state: "",
    website: "",
    email_domain: "",
    description: "",
  });

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo max 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const handleCreate = async () => {
    if (!form.type || !form.name.trim()) { toast.error("Please fill in required fields"); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/signin"); return; }

      let logo_url: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData } = await supabase.storage.from("org-logos").upload(path, logoFile, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("org-logos").getPublicUrl(path);
          logo_url = urlData.publicUrl;
        }
      }

      const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 8)}`;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: form.name.trim(),
          type: form.type,
          tagline: form.tagline.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          website_url: form.website.trim() || null,
          email_domain: form.email_domain.trim() || null,
          description: form.description.trim() || null,
          logo_url,
          slug,
          created_by: user.id,
          status: "active",
        } as any)
        .select("id, slug")
        .single();

      if (orgError) throw orgError;

      await supabase.from("org_admins").insert({ org_id: org.id, user_id: user.id, role: "owner" } as any);
      await supabase.from("profiles").update({ org_id: org.id, account_type: "institution" } as any).eq("id", user.id);

      toast.success(`${form.name} created!`);
      navigate(`/org/${org.slug}`);
    } catch (e: any) {
      toast.error(e.message || "Could not create organization");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E8733A] bg-white transition-colors";

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-4 py-8">
      <div className="mb-6"><ThemeLogo className="h-10 w-auto" /></div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              s <= step ? "bg-[#E8733A] text-white" : "bg-gray-200 text-gray-500"
            }`}>{s < step ? "✓" : s}</div>
            {s < 3 && <div className={`w-12 h-0.5 transition-colors ${s < step ? "bg-[#E8733A]" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* Step 1 — Org type */}
        {step === 1 && (
          <>
            <h1 className="text-xl font-bold mb-1">What type of organization?</h1>
            <p className="text-sm text-gray-500 mb-5">Pick the closest match</p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {ORG_TYPES.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    form.type === t.value ? "border-[#E8733A] bg-[#FFF3EC]" : "border-gray-100 hover:border-gray-200"
                  }`}>
                  <span className="text-2xl flex-shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => { if (!form.type) { toast.error("Pick an org type first"); return; } setStep(2); }}
              className="w-full bg-[#E8733A] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#d4632e] transition-colors">
              Continue →
            </button>
          </>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <>
            <h1 className="text-xl font-bold mb-1">Tell us about your organization</h1>
            <p className="text-sm text-gray-500 mb-5">This appears on your public profile</p>

            <div className="flex items-center gap-4 mb-5">
              <label className="cursor-pointer">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1">
                    <span className="text-xl">📷</span>
                    <span className="text-[10px] text-gray-400">Logo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <div>
                <p className="text-sm font-medium">Upload logo</p>
                <p className="text-xs text-gray-400">PNG/JPG · Square · Max 2MB</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Organization name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="e.g. Apollo Hospitals, IIT Hyderabad" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tagline</label>
                <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} className={inp} placeholder="One line that captures what you do" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">City *</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inp} placeholder="Hyderabad" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">State *</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inp} placeholder="Telangana" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Website</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inp} placeholder="https://yourorg.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Work email domain</label>
                <input value={form.email_domain} onChange={e => setForm(f => ({ ...f, email_domain: e.target.value }))} className={inp} placeholder="yourorg.com (for auto-verifying employees)" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">About</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inp} resize-none`} rows={3} placeholder="What does your organization do?" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button onClick={() => {
                if (!form.name.trim() || !form.city.trim()) { toast.error("Name and city are required"); return; }
                setStep(3);
              }} className="flex-1 bg-[#E8733A] text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-[#d4632e] transition-colors">
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Verification */}
        {step === 3 && (
          <>
            <h1 className="text-xl font-bold mb-1">Verify {form.name}</h1>
            <p className="text-sm text-gray-500 mb-5">Verification makes your org trusted on Tiikme. You can skip this and do it later.</p>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-xl border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="text-sm font-semibold">Work email domain</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.email_domain ? `Employees with @${form.email_domain} auto-verify` : "Set an email domain on the previous step to auto-verify employees"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-semibold">Upload GST / Registration certificate</p>
                    <p className="text-xs text-gray-500 mt-0.5">Our team reviews in 1–2 business days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 bg-[#E8733A] text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-[#d4632e] disabled:opacity-50 transition-colors">
                {loading ? "Creating..." : "Create organization →"}
              </button>
            </div>
            <button onClick={handleCreate} disabled={loading}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50">
              Skip verification for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
