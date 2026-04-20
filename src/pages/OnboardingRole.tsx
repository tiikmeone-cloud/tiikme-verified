import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, GraduationCap, Briefcase, Stethoscope, BookOpen, Building2, ArrowLeft } from "lucide-react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { SUBTYPE_OPTIONS } from "@/lib/roleSubtypes";
import { supabase } from "@/integrations/supabase/client";

/* ── Type cards (Handshake-style: 4 main + Institution route) ── */
const TYPES = [
  { id: "student",      icon: GraduationCap, label: "Student",            desc: "Still in college, school, or pursuing a degree", color: "#4F46E5" },
  { id: "professional", icon: Briefcase,     label: "Professional",       desc: "Working, freelancing, or running a company",     color: "#0369A1" },
  { id: "doctor",       icon: Stethoscope,   label: "Doctor / Healthcare", desc: "MBBS, MD, dentist, nurse, or healthcare",         color: "#0E7490" },
  { id: "faculty",      icon: BookOpen,      label: "Faculty / Researcher", desc: "Teaching, research, academic",                  color: "#92400E" },
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
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<string | null>(null);
  const [subtype, setSubtype] = useState<string>("");
  const [meta, setMeta] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const u = (k: string, v: any) => setMeta(p => ({ ...p, [k]: v }));

  /* ── Step 1: pick type → push to step 2 ── */
  const pickType = (id: string) => {
    setRole(id);
    setSubtype("");
    setMeta({});
    setStep(2);
  };

  /* ── Step 2: validate → save → /onboarding/details ── */
  const subtypeOpts = role ? SUBTYPE_OPTIONS[role] || [] : [];
  const canContinue = !!role && !!subtype;

  const handleContinue = async () => {
    if (!canContinue || !role) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/signin"); return; }

      const cleanMeta: Record<string, any> = {};
      Object.entries(meta).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) cleanMeta[k] = v;
      });

      await supabase.from("profiles").update({
        role,
        role_subtype: subtype,
        role_metadata: cleanMeta,
      } as any).eq("id", user.id);

      // Stash for OnboardingDetails (back-compat)
      sessionStorage.setItem("ob_role", role);
      sessionStorage.setItem("ob_role_subtype", subtype);

      navigate("/onboarding/details");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────── STEP 1 ─────────────────────────────────────── */
  if (step === 1) {
    return (
      <OnboardingShell step={3} showBack backTo="/verify-email">
        <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h1 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827" }}>Who are you?</h1>
          <p className="text-center text-[14px] mb-7" style={{ color: "#6B7280" }}>Pick the option that best describes you</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => pickType(t.id)}
                  className="text-left p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{ border: "2px solid #E5E7EB", background: "#fff", minHeight: 140 }}
                >
                  <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${t.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: t.color }} />
                  </div>
                  <div className="text-[15px] font-bold mb-1" style={{ color: "#111827" }}>{t.label}</div>
                  <div className="text-[12px]" style={{ color: "#6B7280" }}>{t.desc}</div>
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

  /* ─────────────────────────────────────── STEP 2 ─────────────────────────────────────── */
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
          {/* Subtype — common to all */}
          <div>
            <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#111827" }}>What kind?</label>
            <select value={subtype} onChange={e => setSubtype(e.target.value)}
              className="w-full h-11 rounded-xl px-3.5 outline-none cursor-pointer text-[14px]" style={inputStyle}>
              <option value="">Select one…</option>
              {subtypeOpts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

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
        </div>

        <button type="button" onClick={handleContinue} disabled={!canContinue || saving}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-6 flex items-center justify-center gap-1.5"
          style={{ background: "#E8580A" }}>
          {saving ? "Saving…" : <>Continue <Check className="w-4 h-4" /></>}
        </button>
      </div>
    </OnboardingShell>
  );
}
