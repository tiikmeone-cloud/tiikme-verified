import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Check, GraduationCap, Briefcase, Stethoscope, BookOpen, Building2, ArrowLeft,
  Video, Wrench, Rocket, Landmark, MoreHorizontal,
} from "lucide-react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { SUBTYPE_OPTIONS, PROFESSION_TYPE_OPTIONS, hasSubtypes, hasProfessionType } from "@/lib/roleSubtypes";
import { supabase } from "@/integrations/supabase/client";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { DISPLAY_PREFERENCE_OPTIONS, type DisplayPreference, DEFAULT_DISPLAY_PREFERENCE } from "@/utils/displayProfile";

/* ── Type cards — 9 user roles + Institution route ── */
const TYPES = [
  { id: "student",      icon: GraduationCap,  label: "Student",            desc: "Still in college, school, or pursuing a degree", color: "#4F46E5" },
  { id: "professional", icon: Briefcase,      label: "Professional",       desc: "Working at a company, employed full-time",       color: "#0369A1" },
  { id: "doctor",       icon: Stethoscope,    label: "Doctor / Healthcare", desc: "MBBS, MD, dentist, nurse, healthcare worker",   color: "#0E7490" },
  { id: "creator",      icon: Video,          label: "Creator",            desc: "YouTuber, podcaster, content creator",            color: "#DB2777" },
  { id: "freelancer",   icon: Wrench,         label: "Freelancer / Gig",   desc: "Independent or gig worker",                       color: "#7C3AED" },
  { id: "founder",      icon: Rocket,         label: "Founder",            desc: "Building or running a startup",                   color: "#EA580C" },
  { id: "faculty",      icon: BookOpen,       label: "Faculty / Researcher", desc: "Teaching, research, academic",                  color: "#92400E" },
  { id: "investor",     icon: Landmark,       label: "Investor",           desc: "Angel, VC, family office",                        color: "#059669" },
  { id: "other",        icon: MoreHorizontal, label: "Other",              desc: "Doesn't fit above? Pick this",                    color: "#6B7280" },
];

const EXPERIENCE_BUCKETS = ["0", "1-2", "3-5", "6-10", "10+"];
const STUDENT_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => String(2024 + i));

const SPECIALTIES = [
  "General Medicine","Cardiology","Dermatology","Neurology","Orthopedics","Pediatrics","Gynecology",
  "Psychiatry","Radiology","Anesthesiology","Pathology","Ophthalmology","ENT","Urology","Nephrology",
  "Endocrinology","Gastroenterology","Pulmonology","Oncology","Hematology","Rheumatology","Surgery",
  "Plastic Surgery","Neurosurgery","Cardiothoracic Surgery","Vascular Surgery","Emergency Medicine",
  "Family Medicine","Internal Medicine","Geriatrics","Sports Medicine","Pain Management","Dentistry",
  "Orthodontics","Periodontics","Ayurveda","Homeopathy","Physiotherapy","Nursing","Other",
];

interface OrgLite { id: string; name: string; type?: string | null; }

/* ── Reusable inline org autocomplete ── */
function OrgAutocomplete({ value, onChange, placeholder, types }: { value: string; onChange: (v: string) => void; placeholder: string; types: string[] }) {
  const [results, setResults] = useState<OrgLite[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("organizations" as any)
        .select("id, name, type").ilike("name", `%${q}%`).in("type", types).limit(6);
      setResults((data as any) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [value, types]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl px-3.5 outline-none text-[14px]"
        style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#111827" }}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
          {results.map(r => (
            <button type="button" key={r.id} onMouseDown={e => { e.preventDefault(); onChange(r.name); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" style={{ color: "#111827" }}>
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full h-11 rounded-xl px-3.5 outline-none text-[14px]";
const inputStyle: React.CSSProperties = { background: "#fff", border: "2px solid #E5E7EB", color: "#111827" };

export default function OnboardingRole() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<string | null>(null);
  const [subtype, setSubtype] = useState<string>("");
  const [professionType, setProfessionType] = useState<string>("");
  const [meta, setMeta] = useState<Record<string, any>>({});
  const [displayPref, setDisplayPref] = useState<DisplayPreference>(DEFAULT_DISPLAY_PREFERENCE);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<{ full_name: string; avatar_url: string | null }>({ full_name: "Your Name", avatar_url: null });

  // Pull current name/avatar for display preview
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
      if (data) setMe({ full_name: data.full_name || user.email?.split("@")[0] || "Your Name", avatar_url: data.avatar_url || null });
    })();
  }, []);

  const u = (k: string, v: any) => setMeta(p => ({ ...p, [k]: v }));

  /* ── Step 1: pick type → push to step 2 ── */
  const pickType = (id: string) => {
    setRole(id);
    setSubtype("");
    setProfessionType("");
    setMeta({});
    setStep(2);
  };

  /* ── Step 2: validate → save → step 3 (display preference) ── */
  const subtypeOpts = role ? SUBTYPE_OPTIONS[role] || [] : [];
  const professionOpts = role ? PROFESSION_TYPE_OPTIONS[role] || [] : [];
  const requiresSubtype = role ? hasSubtypes(role) : false;
  const requiresProfessionType = role ? hasProfessionType(role) : false;

  const canContinueStep2 =
    !!role &&
    (!requiresSubtype || !!subtype) &&
    (!requiresProfessionType || !!professionType);

  const handleContinueToStep3 = () => {
    if (!canContinueStep2) return;
    setStep(3);
  };

  /* ── Step 3: save everything (role, subtype, profession_type, meta, display_pref) ── */
  const handleFinish = async () => {
    if (!role) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/signin"); return; }

      const cleanMeta: Record<string, any> = {};
      Object.entries(meta).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) cleanMeta[k] = v;
      });

      const update: any = {
        role,
        role_metadata: cleanMeta,
        display_preference: displayPref,
      };
      if (requiresSubtype && subtype) update.role_subtype = subtype;
      if (requiresProfessionType && professionType) update.profession_type = professionType;

      // Surface "currently working at" as a top-level column too
      if (role === "professional" && cleanMeta.company) {
        update.currently_working_at = cleanMeta.company;
      }
      if (role === "doctor" && cleanMeta.hospital) {
        update.currently_working_at = cleanMeta.hospital;
      }

      await supabase.from("profiles").update(update).eq("id", user.id);

      sessionStorage.setItem("ob_role", role);
      if (subtype) sessionStorage.setItem("ob_role_subtype", subtype);

      navigate("/onboarding/details");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────── STEP 1 — Pick role ─────────── */
  if (step === 1) {
    return (
      <OnboardingShell step={3} showBack backTo="/verify-email">
        <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h1 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827" }}>Tell us who you are</h1>
          <p className="text-center text-[14px] mb-7" style={{ color: "#6B7280" }}>Pick the option that best describes you</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => pickType(t.id)}
                  className="text-left p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{ border: "2px solid #E5E7EB", background: "#fff", minHeight: 130 }}
                >
                  <div className="w-10 h-10 rounded-xl mb-2.5 flex items-center justify-center" style={{ background: `${t.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <div className="text-[14px] font-bold mb-0.5" style={{ color: "#111827" }}>{t.label}</div>
                  <div className="text-[11px] leading-tight" style={{ color: "#6B7280" }}>{t.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Institution route */}
          <Link to="/join-as-institution" className="mt-4 flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ border: "2px dashed #E5E7EB", background: "#FFF8F2" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8580A15" }}>
                <Building2 className="w-5 h-5" style={{ color: "#E8580A" }} />
              </div>
              <div>
                <div className="text-[14px] font-bold" style={{ color: "#111827" }}>Institution / Employer</div>
                <div className="text-[12px]" style={{ color: "#6B7280" }}>Create a page for your college, company, or org</div>
              </div>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "#E8580A" }}>Continue →</span>
          </Link>
        </div>
      </OnboardingShell>
    );
  }

  /* ─────────── STEP 2 — Subtype + role-specific details ─────────── */
  if (step === 2) {
    const selectedType = TYPES.find(t => t.id === role);
    return (
      <OnboardingShell step={3} showBack backTo="/verify-email">
        <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <button type="button" onClick={() => setStep(1)}
            className="flex items-center gap-1 text-[13px] font-medium mb-4 cursor-pointer hover:opacity-70"
            style={{ color: "#6B7280" }}>
            <ArrowLeft className="w-4 h-4" /> Change type
          </button>

          <div className="flex items-center gap-3 mb-5">
            {selectedType && (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selectedType.color}15` }}>
                <selectedType.icon className="w-5 h-5" style={{ color: selectedType.color }} />
              </div>
            )}
            <div>
              <h1 className="text-[22px] font-extrabold" style={{ color: "#111827" }}>Tell us about your {selectedType?.label.toLowerCase()}</h1>
              <p className="text-[13px]" style={{ color: "#6B7280" }}>You can edit this anytime</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Subtype dropdown — for roles that have one */}
            {requiresSubtype && (
              <div>
                <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>What kind?</label>
                <select value={subtype} onChange={e => setSubtype(e.target.value)}
                  className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                  <option value="">Select one…</option>
                  {subtypeOpts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            {/* profession_type — Creator / Freelancer */}
            {requiresProfessionType && (
              <div>
                <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>
                  {role === "creator" ? "Primary platform" : "Field"}
                </label>
                <select value={professionType} onChange={e => setProfessionType(e.target.value)}
                  className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                  <option value="">Select one…</option>
                  {professionOpts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            {/* ─── STUDENT ─── */}
            {role === "student" && (
              <>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>College / School</label>
                  <OrgAutocomplete value={meta.institution || ""} onChange={v => u("institution", v)}
                    placeholder="Search your college or school" types={["college","university","school"]} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Current year</label>
                    <select value={meta.current_year || ""} onChange={e => u("current_year", e.target.value)}
                      className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                      <option value="">Select</option>
                      {STUDENT_YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Graduation year</label>
                    <select value={meta.graduation_year || ""} onChange={e => u("graduation_year", e.target.value)}
                      className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                      <option value="">Select</option>
                      {GRAD_YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Degree (e.g. B.Tech)" value={meta.degree || ""} onChange={e => u("degree", e.target.value)} className={inputCls} style={inputStyle} />
                  <input type="text" placeholder="Branch (e.g. CSE)" value={meta.branch || ""} onChange={e => u("branch", e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </>
            )}

            {/* ─── PROFESSIONAL ─── */}
            {role === "professional" && (
              <>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Current company</label>
                  <OrgAutocomplete value={meta.company || ""} onChange={v => u("company", v)}
                    placeholder="Search your company" types={["company","startup","nonprofit"]} />
                </div>
                <input type="text" placeholder="Job title" value={meta.jobTitle || ""} onChange={e => u("jobTitle", e.target.value)} className={inputCls} style={inputStyle} />
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Years of experience</label>
                  <select value={meta.years_experience || ""} onChange={e => u("years_experience", e.target.value)}
                    className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                    <option value="">Select</option>
                    {EXPERIENCE_BUCKETS.map(b => <option key={b} value={b}>{b} {b === "0" ? "(new grad)" : "years"}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="Top skills (comma separated, max 10)" value={meta.skills_text || ""}
                  onChange={e => u("skills_text", e.target.value)} className={inputCls} style={inputStyle} />
                <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "#FFF8F2", border: "1.5px solid #FBE4D2" }}>
                  <input type="checkbox" checked={!!meta.open_to_work} onChange={e => u("open_to_work", e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>I'm open to new opportunities</span>
                </label>
              </>
            )}

            {/* ─── DOCTOR ─── */}
            {role === "doctor" && (
              <>
                <input type="text" placeholder="Medical license / NMC number (optional)" value={meta.license || ""}
                  onChange={e => u("license", e.target.value)} className={inputCls} style={inputStyle} />
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Specialty</label>
                  <select value={meta.specialty || ""} onChange={e => u("specialty", e.target.value)}
                    className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {meta.specialty === "Other" && (
                  <input type="text" placeholder="Specify your specialty" value={meta.specialty_other || ""}
                    onChange={e => u("specialty_other", e.target.value)} className={inputCls} style={inputStyle} />
                )}
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Hospital / Clinic</label>
                  <OrgAutocomplete value={meta.hospital || ""} onChange={v => u("hospital", v)}
                    placeholder="Search your hospital or clinic" types={["hospital","clinic"]} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Years in practice</label>
                  <select value={meta.years_practice || ""} onChange={e => u("years_practice", e.target.value)}
                    className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                    <option value="">Select</option>
                    {EXPERIENCE_BUCKETS.map(b => <option key={b} value={b}>{b} {b === "0" ? "(intern)" : "years"}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ─── FACULTY ─── */}
            {role === "faculty" && (
              <>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Institution</label>
                  <OrgAutocomplete value={meta.institution || ""} onChange={v => u("institution", v)}
                    placeholder="Search your college or university" types={["college","university"]} />
                </div>
                <input type="text" placeholder="Department (e.g. Computer Science)" value={meta.department || ""}
                  onChange={e => u("department", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Research area (optional)" value={meta.research_area || ""}
                  onChange={e => u("research_area", e.target.value)} className={inputCls} style={inputStyle} />
              </>
            )}

            {/* ─── CREATOR ─── */}
            {role === "creator" && (
              <>
                <input type="text" placeholder="Channel / Page handle (e.g. @yourname)" value={meta.handle || ""}
                  onChange={e => u("handle", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Niche / Topic (e.g. Tech, Finance)" value={meta.niche || ""}
                  onChange={e => u("niche", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Audience size (e.g. 10k, 100k+)" value={meta.audience || ""}
                  onChange={e => u("audience", e.target.value)} className={inputCls} style={inputStyle} />
              </>
            )}

            {/* ─── FREELANCER ─── */}
            {role === "freelancer" && (
              <>
                <input type="text" placeholder="Top skills (comma separated)" value={meta.skills_text || ""}
                  onChange={e => u("skills_text", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Portfolio URL (optional)" value={meta.portfolio || ""}
                  onChange={e => u("portfolio", e.target.value)} className={inputCls} style={inputStyle} />
                <div>
                  <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>Years freelancing</label>
                  <select value={meta.years_experience || ""} onChange={e => u("years_experience", e.target.value)}
                    className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
                    <option value="">Select</option>
                    {EXPERIENCE_BUCKETS.map(b => <option key={b} value={b}>{b} years</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ─── FOUNDER ─── */}
            {role === "founder" && (
              <>
                <input type="text" placeholder="Startup name" value={meta.startup_name || ""}
                  onChange={e => u("startup_name", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="What does it do? (1 line)" value={meta.startup_pitch || ""}
                  onChange={e => u("startup_pitch", e.target.value.slice(0, 140))} maxLength={140} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Website (optional)" value={meta.startup_url || ""}
                  onChange={e => u("startup_url", e.target.value)} className={inputCls} style={inputStyle} />
              </>
            )}

            {/* ─── INVESTOR ─── */}
            {role === "investor" && (
              <>
                <input type="text" placeholder="Firm / Fund name (or 'Personal')" value={meta.firm || ""}
                  onChange={e => u("firm", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Sectors of interest (e.g. SaaS, Fintech)" value={meta.sectors_text || ""}
                  onChange={e => u("sectors_text", e.target.value)} className={inputCls} style={inputStyle} />
                <input type="text" placeholder="Typical ticket size (e.g. ₹10L – ₹1Cr)" value={meta.ticket_size || ""}
                  onChange={e => u("ticket_size", e.target.value)} className={inputCls} style={inputStyle} />
              </>
            )}

            {/* ─── OTHER ─── */}
            {role === "other" && (
              <input type="text" placeholder="Describe what you do" value={meta.description || ""}
                onChange={e => u("description", e.target.value.slice(0, 140))} maxLength={140} className={inputCls} style={inputStyle} />
            )}
          </div>

          <button type="button" onClick={handleContinueToStep3} disabled={!canContinueStep2}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-6 flex items-center justify-center gap-1.5"
            style={{ background: "#E8580A" }}>
            Continue <Check className="w-4 h-4" />
          </button>
        </div>
      </OnboardingShell>
    );
  }

  /* ─────────── STEP 3 — Display preference ─────────── */
  const selectedType = TYPES.find(t => t.id === role);
  const previewRole = selectedType?.label || "";
  const previewSubtype = subtype || professionType;
  const previewCompany = meta.company || meta.hospital || meta.institution || meta.startup_name || meta.firm || "Your Company";

  return (
    <OnboardingShell step={3} showBack>
      <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <button type="button" onClick={() => setStep(2)}
          className="flex items-center gap-1 text-[13px] font-medium mb-4 cursor-pointer hover:opacity-70"
          style={{ color: "#6B7280" }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "#111827" }}>How do you want to appear to others?</h1>
        <p className="text-[13px] mb-6" style={{ color: "#6B7280" }}>You can change this anytime in Settings</p>

        <div className="space-y-3">
          {DISPLAY_PREFERENCE_OPTIONS.map(opt => {
            const active = displayPref === opt.value;
            const showName = opt.value !== "dp_only";
            const showRole = opt.value === "dp_name_profession" || opt.value === "dp_name_profession_company";
            const showCompany = opt.value === "dp_name_profession_company";
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setDisplayPref(opt.value)}
                className="w-full text-left p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4"
                style={{
                  border: active ? "2px solid #E8580A" : "2px solid #E5E7EB",
                  background: active ? "#FFF8F2" : "#fff",
                }}
              >
                {/* live preview */}
                <div className="flex items-center gap-3 shrink-0">
                  <AvatarSquare src={me.avatar_url} name={me.full_name} size={44} />
                  <div className="min-w-0">
                    {showName ? (
                      <div className="text-[13px] font-bold truncate" style={{ color: "#111827", maxWidth: 180 }}>{me.full_name}</div>
                    ) : (
                      <div className="text-[12px] italic" style={{ color: "#9CA3AF" }}>(name hidden)</div>
                    )}
                    {showRole && previewRole && (
                      <div className="text-[11px] truncate" style={{ color: "#6B7280", maxWidth: 180 }}>
                        {previewRole}{previewSubtype ? ` · ${previewSubtype}` : ""}
                      </div>
                    )}
                    {showCompany && (
                      <div className="text-[11px] truncate" style={{ color: "#9CA3AF", maxWidth: 180 }}>{previewCompany}</div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 hidden sm:block">
                  <div className="text-[13px] font-bold" style={{ color: active ? "#E8580A" : "#111827" }}>{opt.label}</div>
                  <div className="text-[11px]" style={{ color: "#6B7280" }}>{opt.desc}</div>
                </div>

                <div className="shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ border: active ? "2px solid #E8580A" : "2px solid #D1D5DB", background: active ? "#E8580A" : "transparent" }}>
                    {active && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={handleFinish} disabled={saving}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-6 flex items-center justify-center gap-1.5"
          style={{ background: "#E8580A" }}>
          {saving ? "Saving…" : <>Continue <Check className="w-4 h-4" /></>}
        </button>
      </div>
    </OnboardingShell>
  );
}
