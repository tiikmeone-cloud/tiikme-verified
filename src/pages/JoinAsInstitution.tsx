import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Building2, Landmark, Heart, Banknote, Palette, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import ThemeLogo from "@/components/ThemeLogo";

const indianStates = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const typeCards = [
  { id: "college", emoji: "🎓", label: "College / University", desc: "Engineering, Medical, Arts, Law colleges", icon: GraduationCap },
  { id: "company", emoji: "🏢", label: "Company / Startup", desc: "Private, public, startup, agency", icon: Building2 },
  { id: "government", emoji: "🏛️", label: "Government Department", desc: "Central, State, Municipal departments", icon: Landmark },
  { id: "hospital", emoji: "🏥", label: "Hospital / Healthcare", desc: "Hospitals, clinics, health institutions", icon: Heart },
  { id: "bank", emoji: "🏦", label: "Bank / Financial", desc: "Nationalised, private, co-operative banks", icon: Banknote },
  { id: "agency", emoji: "🎨", label: "Agency / Studio / Creator", desc: "Design, content, marketing, media", icon: Palette },
];

const inputS: React.CSSProperties = { background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 12, color: "#0A0A0A", height: 44 };
const selectS: React.CSSProperties = { ...inputS, cursor: "pointer" };
const cardStyle: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };

const JoinAsInstitution = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [admin, setAdmin] = useState({ name: "", email: "", password: "" });
  const [instType, setInstType] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({ name: "", alsoKnownAs: "", officialEmail: "", website: "", city: "", state: "", pincode: "", foundedYear: "", about: "" });
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [awards, setAwards] = useState<{ name: string; year: string }[]>([]);
  const [customLinks, setCustomLinks] = useState<{ url: string; label: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Force light mode
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark');
    html.classList.add('light');
    html.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#FFF8F2';
    document.body.style.color = '#0A0A0A';
    return () => {
      html.classList.remove('light');
      html.removeAttribute('data-theme');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateAccount = async () => {
    if (!admin.name?.trim() || !admin.email || !admin.password) { toast.info("Fill all required fields"); return; }
    if (admin.password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: admin.email,
      password: admin.password,
      options: {
        emailRedirectTo: window.location.origin + "/app/feed",
        data: { full_name: admin.name.trim(), role: "institution_admin" },
      },
    });
    setIsSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created!");
    setStep(1);
  };

  const handleComplete = async () => {
    if (!details.name?.trim()) { toast.error("Please enter the organisation name"); return; }
    if (!details.city || !details.state) { toast.info("Fill required fields (city, state)"); return; }
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Authentication failed. Please try again."); setIsSubmitting(false); return; }

      // Generate unique slug
      const baseSlug = details.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Upload logo if any
      let logoUrl = "";
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("org-logos").upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(path);
          logoUrl = publicUrl;
        }
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          slug,
          name: details.name.trim(),
          type: instType || 'company',
          subtype: extraFields.subType || null,
          description: details.about || null,
          website_url: details.website || null,
          email: details.officialEmail || null,
          country: 'India',
          state: details.state || null,
          city: details.city || null,
          pincode: details.pincode || null,
          founded_year: details.foundedYear ? parseInt(details.foundedYear) : null,
          logo_url: logoUrl || null,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (orgError) {
        console.error('Org create error:', orgError);
        toast.error(orgError.message);
        setIsSubmitting(false);
        return;
      }

      // Add creator as owner
      await supabase.from('org_members').insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
        title: 'Owner',
        is_verified: true,
      });

      toast.success('Organisation page created successfully!');
      setStep(4);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const orgSlug = details.name
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F2', colorScheme: 'light' as any }}>
      <div className="min-h-screen flex">
        {/* Left brand panel — desktop only */}
        <div className="hidden lg:flex flex-col justify-center w-[420px] shrink-0 px-12 relative overflow-hidden" style={{ background: '#04061A' }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(232,88,10,0.15) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 mb-12">
              <ThemeLogo className="h-10 w-auto" />
            </Link>
            <h1 className="text-[32px] font-extrabold text-[#EEF0FF] mb-8 leading-tight">Your institution<br />on Tiikme</h1>
            <div className="space-y-4">
              {["Verified presence — trusted by professionals across India", "Post opportunities seen by role-matched candidates", "6 months free for founding institutions"].map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(16,185,129,0.15)" }}>
                    <Check className="w-3 h-3" style={{ color: "#10B981" }} />
                  </div>
                  <p className="text-[14px]" style={{ color: "rgba(238,240,255,0.7)" }}>{t}</p>
                </div>
              ))}
            </div>

            {/* Pricing section */}
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(238,240,255,0.1)" }}>
              <h3 className="text-[18px] font-extrabold text-[#EEF0FF] mb-4">Simple pricing</h3>
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p className="text-[14px] font-bold" style={{ color: "#10B981" }}>Free — First 6 months</p>
                  <p className="text-[12px] mt-1" style={{ color: "rgba(238,240,255,0.5)" }}>Full access. No credit card needed. No commitments.</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.1)" }}>
                  <p className="text-[14px] font-bold text-[#EEF0FF]">₹299/month — From month 7</p>
                  <p className="text-[12px] mt-1" style={{ color: "rgba(238,240,255,0.5)" }}>50% off for months 7–9 (₹149/mo). Full ₹299/month from month 10.</p>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(238,240,255,0.35)" }}>After 6 months you enter payment details — terms apply.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ background: '#FFF8F2' }}>
          {/* Mobile logo + back */}
          <div className="w-full max-w-[520px] mb-4">
            <div className="flex items-center justify-between mb-2 lg:hidden">
              <Link to="/"><ThemeLogo className="h-8 w-auto" /></Link>
            </div>
            <button
              onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium mb-6"
              style={{ color: '#374151' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <motion.div className="w-full max-w-[520px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Progress */}
            <div className="flex gap-1.5 mb-8 max-w-xs mx-auto">
              {[0, 1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1 h-[3px] rounded-full" style={{ background: s <= step ? "#E8580A" : "#E5E7EB" }} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 0: Admin account */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <div className="p-8" style={cardStyle}>
                    <h2 className="text-[24px] font-extrabold text-center mb-1" style={{ color: '#0A0A0A' }}>Create your Institution Page</h2>
                    <p className="text-center mb-6 text-[13px]" style={{ color: "#6B7280" }}>Free for 6 months · No credit card · 5 minutes</p>
                    <div className="space-y-3">
                      <Input placeholder="Organisation Name *" value={admin.name} onChange={e => setAdmin({ ...admin, name: e.target.value })} style={inputS} />
                      <Input type="email" placeholder="Email address *" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} style={inputS} />
                      <Input type="password" placeholder="Password (min 8 chars) *" value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })} style={inputS} />
                    </div>
                    <p className="text-[11px] mt-3 mb-4" style={{ color: "#9CA3AF" }}>You'll be the Page Admin. Add more admins later.</p>
                    <Button size="xl" className="w-full" onClick={handleCreateAccount} disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Type selection */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <div className="p-8" style={cardStyle}>
                    <h2 className="text-[24px] font-extrabold text-center mb-6" style={{ color: '#0A0A0A' }}>What type of institution?</h2>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {typeCards.map(t => {
                        const sel = instType === t.id;
                        return (
                          <button type="button" key={t.id} onClick={() => setInstType(t.id)}
                            className="rounded-2xl p-4 text-left cursor-pointer active:scale-[0.98] relative"
                            style={{ background: sel ? "rgba(232,88,10,0.06)" : "#FAFAFA", border: `1.5px solid ${sel ? "#E8580A" : "#E5E7EB"}` }}>
                            {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E8580A" }}><Check className="w-3 h-3 text-white" /></div>}
                            <span className="text-[24px] block mb-1">{t.emoji}</span>
                            <p className="text-[13px] font-bold" style={{ color: '#0A0A0A' }}>{t.label}</p>
                            <p className="text-[11px]" style={{ color: "#6B7280" }}>{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    <Button size="xl" className="w-full" onClick={() => instType && setStep(2)} disabled={!instType}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide" style={cardStyle}>
                    <h2 className="text-[22px] font-extrabold text-center mb-6" style={{ color: '#0A0A0A' }}>Institution details</h2>
                    <div className="space-y-3">
                      <Input placeholder={
                        instType === 'college' ? "e.g. IIT Hyderabad" :
                        instType === 'hospital' ? "e.g. Apollo Hospitals" :
                        instType === 'government' ? "e.g. Ministry of Finance" :
                        instType === 'bank' ? "e.g. State Bank of India" :
                        "e.g. Tata Consultancy Services"
                      } value={details.name} onChange={e => setDetails({ ...details, name: e.target.value.slice(0, 100) })} style={inputS} />
                      <p className="text-[11px] -mt-1" style={{ color: '#9CA3AF' }}>Organisation Name *</p>
                      <Input placeholder="Also known as (optional)" value={details.alsoKnownAs} onChange={e => setDetails({ ...details, alsoKnownAs: e.target.value.slice(0, 60) })} style={inputS} />
                      <Input type="email" placeholder="Official email *" value={details.officialEmail} onChange={e => setDetails({ ...details, officialEmail: e.target.value })} style={inputS} />
                      <Input placeholder="Website URL (optional)" value={details.website} onChange={e => setDetails({ ...details, website: e.target.value })} style={inputS} />
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="City *" value={details.city} onChange={e => setDetails({ ...details, city: e.target.value })} style={inputS} />
                        <select value={details.state} onChange={e => setDetails({ ...details, state: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                          <option value="">State *</option>
                          {indianStates.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Pincode" value={details.pincode} onChange={e => setDetails({ ...details, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} style={inputS} />
                        <Input type="number" placeholder="Est. year *" value={details.foundedYear} onChange={e => setDetails({ ...details, foundedYear: e.target.value.slice(0, 4) })} min={1800} max={2025} style={inputS} />
                      </div>

                      {/* Type-specific fields */}
                      {instType === "college" && (
                        <>
                          <select value={extraFields.subType || ""} onChange={e => setExtraFields({ ...extraFields, subType: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                            <option value="">Institution type</option>
                            {["University", "Engineering", "Medical", "Arts", "Law", "IIT/IIM/IISc", "Deemed", "Polytechnic", "School"].map(t => <option key={t}>{t}</option>)}
                          </select>
                          <Input placeholder="Affiliation (e.g. Anna University)" value={extraFields.affiliation || ""} onChange={e => setExtraFields({ ...extraFields, affiliation: e.target.value })} style={inputS} />
                          <select value={extraFields.naacGrade || ""} onChange={e => setExtraFields({ ...extraFields, naacGrade: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                            <option value="">NAAC Grade (optional)</option>
                            {["A++", "A+", "A", "B++", "B+", "B", "C"].map(g => <option key={g}>{g}</option>)}
                          </select>
                        </>
                      )}
                      {instType === "company" && (
                        <>
                          <select value={extraFields.subType || ""} onChange={e => setExtraFields({ ...extraFields, subType: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                            <option value="">Company type</option>
                            {["Private Ltd", "Public Ltd", "LLP", "PSU", "Startup", "NGO"].map(t => <option key={t}>{t}</option>)}
                          </select>
                          <select value={extraFields.teamSize || ""} onChange={e => setExtraFields({ ...extraFields, teamSize: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                            <option value="">Team size</option>
                            {["1-10", "11-50", "51-200", "201-500", "500-2000", "2000+"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </>
                      )}
                      {instType === "government" && (
                        <select value={extraFields.subType || ""} onChange={e => setExtraFields({ ...extraFields, subType: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                          <option value="">Level</option>
                          {["Central", "State", "District", "Municipal"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      )}
                      {instType === "hospital" && (
                        <>
                          <select value={extraFields.subType || ""} onChange={e => setExtraFields({ ...extraFields, subType: e.target.value })} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={selectS}>
                            <option value="">Hospital type</option>
                            {["Government", "Private", "Trust", "Charitable"].map(t => <option key={t}>{t}</option>)}
                          </select>
                          <Input placeholder="Specialisations (comma separated)" value={extraFields.specialisations || ""} onChange={e => setExtraFields({ ...extraFields, specialisations: e.target.value })} style={inputS} />
                        </>
                      )}

                      {/* About */}
                      <div className="relative">
                        <textarea value={details.about} onChange={e => setDetails({ ...details, about: e.target.value.slice(0, 500) })} placeholder="About your institution (500 chars) *" rows={4}
                          className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                          style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#0A0A0A" }} />
                        <span className="absolute bottom-2 right-3 text-[10px]" style={{ color: "#9CA3AF" }}>{details.about.length}/500</span>
                      </div>

                      {/* Logo */}
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#F9FAFB", border: "1.5px dashed #D1D5DB" }}>
                          {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full rounded-full object-cover" /> : <Upload className="w-5 h-5" style={{ color: "#9CA3AF" }} />}
                        </button>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: '#0A0A0A' }}>Logo *</p>
                          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Square, max 2MB</p>
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                      </div>
                    </div>
                    <Button size="xl" className="w-full mt-5" onClick={() => setStep(3)}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Links & Awards */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide" style={cardStyle}>
                    <h2 className="text-[22px] font-extrabold text-center mb-6" style={{ color: '#0A0A0A' }}>Links & awards</h2>

                    <p className="text-[12px] font-bold mb-2" style={{ color: "#6B7280" }}>CUSTOM LINKS (up to 5)</p>
                    <div className="space-y-2 mb-4">
                      {customLinks.map((l, i) => (
                        <div key={i} className="flex gap-2">
                          <Input placeholder="URL" value={l.url} onChange={e => { const u = [...customLinks]; u[i].url = e.target.value; setCustomLinks(u); }} style={inputS} className="flex-1" />
                          <Input placeholder="Label" value={l.label} onChange={e => { const u = [...customLinks]; u[i].label = e.target.value; setCustomLinks(u); }} style={inputS} className="flex-1" />
                          <button type="button" onClick={() => setCustomLinks(customLinks.filter((_, j) => j !== i))} className="p-2 cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      {customLinks.length < 5 && (
                        <button type="button" onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])}
                          className="text-[12px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: "#E8580A" }}>
                          <Plus className="w-3 h-3" /> Add link
                        </button>
                      )}
                    </div>

                    <p className="text-[12px] font-bold mb-2" style={{ color: "#6B7280" }}>AWARDS / RANKINGS (up to 5)</p>
                    <div className="space-y-2 mb-6">
                      {awards.map((a, i) => (
                        <div key={i} className="flex gap-2">
                          <Input placeholder="Award name" value={a.name} onChange={e => { const u = [...awards]; u[i].name = e.target.value; setAwards(u); }} style={inputS} className="flex-1" />
                          <Input placeholder="Year" value={a.year} onChange={e => { const u = [...awards]; u[i].year = e.target.value.slice(0, 4); setAwards(u); }} style={inputS} className="w-20" />
                          <button type="button" onClick={() => setAwards(awards.filter((_, j) => j !== i))} className="p-2 cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      {awards.length < 5 && (
                        <button type="button" onClick={() => setAwards([...awards, { name: "", year: "" }])}
                          className="text-[12px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: "#E8580A" }}>
                          <Plus className="w-3 h-3" /> Add award
                        </button>
                      )}
                    </div>

                    <Button size="xl" className="w-full" onClick={handleComplete} disabled={isSubmitting}>
                      {isSubmitting ? "Creating page..." : "Complete setup"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Founding member */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="p-8 text-center" style={cardStyle}>
                    <div className="text-[48px] mb-4">🏅</div>
                    <h2 className="text-[24px] font-extrabold mb-2" style={{ color: '#0A0A0A' }}>You're a Founding Institution!</h2>
                    <p className="text-[14px] mb-6" style={{ color: "#6B7280" }}>You get 6 months of Tiikme Growth — completely free.</p>
                    <div className="text-left space-y-2 mb-8">
                      {["Full institution page with all customization", "Unlimited member listing", "Post opportunities (jobs, internships, events)", "Workspace with channels", "Analytics (who tracked you, top viewer roles)", "Priority in search results", "\"Founding Institution\" badge (permanent)"].map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                          <p className="text-[13px]" style={{ color: "#374151" }}>{t}</p>
                        </div>
                      ))}
                    </div>
                    <Button size="xl" className="w-full" onClick={() => navigate(`/org/${orgSlug}`)}>
                      Go to my page <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <p className="text-[12px] mt-3" style={{ color: "#9CA3AF" }}>Founding spots remaining: ~1,847 of 2,000</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '32px' }}>
            Tiikme is a product of Veenavarse Private Limited
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinAsInstitution;
