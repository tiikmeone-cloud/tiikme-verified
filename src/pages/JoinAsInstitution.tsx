import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Building2, Landmark, Heart, Banknote, Palette, Zap, Upload, Plus, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

const indianStates = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const typeCards = [
  { id: "college", emoji: "🎓", label: "College / University", desc: "Engineering, Medical, Arts, Law colleges", icon: GraduationCap },
  { id: "company", emoji: "🏢", label: "Company / Startup", desc: "Private, public, startup, agency", icon: Building2 },
  { id: "government", emoji: "🏛️", label: "Government Department", desc: "Central, State, Municipal departments", icon: Landmark },
  { id: "hospital", emoji: "🏥", label: "Hospital / Healthcare", desc: "Hospitals, clinics, health institutions", icon: Heart },
  { id: "bank", emoji: "🏦", label: "Bank / Financial", desc: "Nationalised, private, co-operative banks", icon: Banknote },
  { id: "agency", emoji: "🎨", label: "Agency / Studio / Creator", desc: "Design, content, marketing, media", icon: Palette },
];

const inputS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const selectS: React.CSSProperties = { ...inputS, cursor: "pointer" };
const glassCard: React.CSSProperties = { background: "rgba(8,11,42,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(238,240,255,0.08)", borderRadius: 24 };

const JoinAsInstitution = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [admin, setAdmin] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [instType, setInstType] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({ name: "", alsoKnownAs: "", officialEmail: "", website: "", city: "", state: "", pincode: "", foundedYear: "", about: "" });
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [awards, setAwards] = useState<{ name: string; year: string }[]>([]);
  const [customLinks, setCustomLinks] = useState<{ url: string; label: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateAccount = async () => {
    if (!admin.email || !admin.password || !admin.firstName) { toast.info("Fill all required fields"); return; }
    if (admin.password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: admin.email,
      password: admin.password,
      options: {
        emailRedirectTo: window.location.origin + "/app/feed",
        data: { first_name: admin.firstName, last_name: admin.lastName, full_name: `${admin.firstName} ${admin.lastName}`.trim(), role: "institution_admin" },
      },
    });
    setIsSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created!");
    setStep(1);
  };

  const handleComplete = async () => {
    if (!details.name || !details.city || !details.state) { toast.info("Fill required fields"); return; }
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create slug
    const slug = details.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);

    // Upload logo if any
    let logoUrl = "";
    if (logoFile && user) {
      const ext = logoFile.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      await supabase.storage.from("work-assets").upload(path, logoFile, { upsert: true });
      const { data: signed } = await supabase.storage.from("work-assets").createSignedUrl(path, 60 * 60 * 24 * 365);
      logoUrl = signed?.signedUrl || "";
    }

    // Map type
    const pageType = instType === "college" ? "college" : instType === "company" ? "company" : instType === "government" ? "government" : instType === "hospital" ? "hospital" : instType === "bank" ? "bank" : "agency";

    const { error } = await supabase.from("pages").insert({
      name: details.name,
      slug,
      page_type: pageType,
      sub_type: extraFields.subType || null,
      about: details.about || null,
      city: details.city,
      state: details.state,
      pincode: details.pincode || null,
      official_email: details.officialEmail || null,
      official_website: details.website || null,
      founded_year: details.foundedYear ? parseInt(details.foundedYear) : null,
      also_known_as: details.alsoKnownAs || null,
      logo_url: logoUrl || null,
      custom_links: customLinks.filter(l => l.url) as any,
      awards: awards.filter(a => a.name) as any,
      created_by: user?.id || null,
      team_size: extraFields.teamSize || null,
      industry: extraFields.industry || null,
      affiliation: extraFields.affiliation || null,
      naac_grade: extraFields.naacGrade || null,
      specialisations: extraFields.specialisations ? extraFields.specialisations.split(",").map(s => s.trim()) : [],
    } as any);

    if (error) { toast.error("Failed to create page"); console.error(error); setIsSubmitting(false); return; }

    // Add as admin
    if (user) {
      await supabase.from("page_admins").insert({ page_id: slug, user_id: user.id, role: "owner" } as any);
    }

    setIsSubmitting(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#04061A" }}>
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-center w-[420px] shrink-0 px-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(61,90,241,0.15) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AF1, #5B73F5)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[19px] font-extrabold text-[#EEF0FF]">Tiikme</span>
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
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div className="w-full max-w-[520px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress */}
          <div className="flex gap-1.5 mb-8 max-w-xs mx-auto">
            {[0, 1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1 h-[3px] rounded-full" style={{ background: s <= step ? "#3D5AF1" : "rgba(238,240,255,0.12)" }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Admin account */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="p-8" style={glassCard}>
                  <h2 className="text-[24px] font-extrabold text-center mb-1 text-[#EEF0FF]">Create your Institution Page</h2>
                  <p className="text-center mb-6 text-[13px]" style={{ color: "rgba(238,240,255,0.5)" }}>Free for 6 months · No credit card · 5 minutes</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="First name *" value={admin.firstName} onChange={e => setAdmin({ ...admin, firstName: e.target.value })} style={inputS} />
                      <Input placeholder="Last name" value={admin.lastName} onChange={e => setAdmin({ ...admin, lastName: e.target.value })} style={inputS} />
                    </div>
                    <Input type="email" placeholder="Email address *" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} style={inputS} />
                    <Input type="password" placeholder="Password (min 8 chars) *" value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })} style={inputS} />
                  </div>
                  <p className="text-[11px] mt-3 mb-4" style={{ color: "rgba(238,240,255,0.35)" }}>You'll be the Page Admin. Add more admins later.</p>
                  <Button size="xl" className="w-full" onClick={handleCreateAccount} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Type selection */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <button onClick={() => setStep(0)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
                <div className="p-8" style={glassCard}>
                  <h2 className="text-[24px] font-extrabold text-center mb-6 text-[#EEF0FF]">What type of institution?</h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {typeCards.map(t => {
                      const sel = instType === t.id;
                      return (
                        <button key={t.id} onClick={() => setInstType(t.id)}
                          className="rounded-2xl p-4 text-left cursor-pointer active:scale-[0.98] relative"
                          style={{ background: sel ? "rgba(61,90,241,0.12)" : "rgba(238,240,255,0.04)", border: `1.5px solid ${sel ? "#3D5AF1" : "rgba(238,240,255,0.08)"}` }}>
                          {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#3D5AF1" }}><Check className="w-3 h-3 text-white" /></div>}
                          <span className="text-[24px] block mb-1">{t.emoji}</span>
                          <p className="text-[13px] font-bold text-[#EEF0FF]">{t.label}</p>
                          <p className="text-[11px]" style={{ color: "rgba(238,240,255,0.45)" }}>{t.desc}</p>
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
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
                <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide" style={glassCard}>
                  <h2 className="text-[22px] font-extrabold text-center mb-6 text-[#EEF0FF]">Institution details</h2>
                  <div className="space-y-3">
                    <Input placeholder="Institution name *" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value.slice(0, 100) })} style={inputS} />
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
                        style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }} />
                      <span className="absolute bottom-2 right-3 text-[10px]" style={{ color: "rgba(238,240,255,0.3)" }}>{details.about.length}/500</span>
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-4">
                      <button onClick={() => logoInputRef.current?.click()} className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px dashed rgba(238,240,255,0.15)" }}>
                        {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full rounded-full object-cover" /> : <Upload className="w-5 h-5" style={{ color: "rgba(238,240,255,0.3)" }} />}
                      </button>
                      <div>
                        <p className="text-[13px] font-semibold text-[#EEF0FF]">Logo *</p>
                        <p className="text-[11px]" style={{ color: "rgba(238,240,255,0.35)" }}>Square, max 2MB</p>
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
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
                <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide" style={glassCard}>
                  <h2 className="text-[22px] font-extrabold text-center mb-6 text-[#EEF0FF]">Links & awards</h2>

                  <p className="text-[12px] font-bold mb-2" style={{ color: "rgba(238,240,255,0.5)" }}>CUSTOM LINKS (up to 5)</p>
                  <div className="space-y-2 mb-4">
                    {customLinks.map((l, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="URL" value={l.url} onChange={e => { const u = [...customLinks]; u[i].url = e.target.value; setCustomLinks(u); }} style={inputS} className="flex-1" />
                        <Input placeholder="Label" value={l.label} onChange={e => { const u = [...customLinks]; u[i].label = e.target.value; setCustomLinks(u); }} style={inputS} className="flex-1" />
                        <button onClick={() => setCustomLinks(customLinks.filter((_, j) => j !== i))} className="p-2 cursor-pointer" style={{ color: "rgba(238,240,255,0.3)" }}><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {customLinks.length < 5 && (
                      <button onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])}
                        className="text-[12px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: "#3D5AF1" }}>
                        <Plus className="w-3 h-3" /> Add link
                      </button>
                    )}
                  </div>

                  <p className="text-[12px] font-bold mb-2" style={{ color: "rgba(238,240,255,0.5)" }}>AWARDS / RANKINGS (up to 5)</p>
                  <div className="space-y-2 mb-6">
                    {awards.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Award name" value={a.name} onChange={e => { const u = [...awards]; u[i].name = e.target.value; setAwards(u); }} style={inputS} className="flex-1" />
                        <Input placeholder="Year" value={a.year} onChange={e => { const u = [...awards]; u[i].year = e.target.value.slice(0, 4); setAwards(u); }} style={inputS} className="w-20" />
                        <button onClick={() => setAwards(awards.filter((_, j) => j !== i))} className="p-2 cursor-pointer" style={{ color: "rgba(238,240,255,0.3)" }}><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {awards.length < 5 && (
                      <button onClick={() => setAwards([...awards, { name: "", year: "" }])}
                        className="text-[12px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: "#3D5AF1" }}>
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
                <div className="p-8 text-center" style={glassCard}>
                  <div className="text-[48px] mb-4">🏅</div>
                  <h2 className="text-[24px] font-extrabold text-[#EEF0FF] mb-2">You're a Founding Institution!</h2>
                  <p className="text-[14px] mb-6" style={{ color: "rgba(238,240,255,0.55)" }}>You get 6 months of Tiikme Growth — completely free.</p>
                  <div className="text-left space-y-2 mb-8">
                    {["Full institution page with all customization", "Unlimited member listing", "Post opportunities (jobs, internships, events)", "Workspace with channels", "Analytics (who tracked you, top viewer roles)", "Priority in search results", "\"Founding Institution\" badge (permanent)"].map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                        <p className="text-[13px]" style={{ color: "rgba(238,240,255,0.7)" }}>{t}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="xl" className="w-full" onClick={() => navigate(`/p/${details.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`)}>
                    Go to my page <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <p className="text-[12px] mt-3" style={{ color: "rgba(238,240,255,0.3)" }}>Founding spots remaining: ~1,847 of 2,000</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinAsInstitution;
