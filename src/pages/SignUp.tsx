import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart, Rocket, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";

const roles = [
  { id: "student", label: "Student", desc: "College, university, or school", icon: GraduationCap, color: "#4F46E5" },
  { id: "professional", label: "Professional", desc: "Working in any industry", icon: Briefcase, color: "#0369A1" },
  { id: "hr", label: "HR / Recruiter", desc: "Hiring or talent acquisition", icon: UserCheck, color: "#6B21A8" },
  { id: "faculty", label: "Faculty / Mentor", desc: "Teaching or guiding others", icon: BookOpen, color: "#92400E" },
  { id: "doctor", label: "Doctor / Health", desc: "Healthcare professional", icon: Stethoscope, color: "#0E7490" },
  { id: "government", label: "Government", desc: "Public sector or schemes", icon: Building2, color: "#166534" },
  { id: "skilled_trade", label: "Skilled Trade", desc: "Electrician, plumber, etc.", icon: Wrench, color: "#C2410C" },
  { id: "aspirant", label: "Aspirant", desc: "Preparing for exams", icon: Heart, color: "#374151" },
  { id: "builder", label: "Builder / Founder", desc: "Starting something new", icon: Rocket, color: "#7C3AED" },
];

const indianStates = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Postgraduate", "PhD", "Alumni"];
const tradeTypes = ["Electrician", "Plumber", "Carpenter", "Mechanic", "Mason", "Welder", "Painter", "Other"];

const inputS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.13)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const selectS = "w-full h-11 rounded-xl px-3 text-[14px] outline-none";

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", institution: "", city: "", state: "", yearOfStudy: "", projectTitle: "", projectDesc: "", projectStatus: "Active", projectLink: "", jobTitle: "", companyName: "", jobDesc: "", designation: "", department: "", district: "", specialisation: "", hospitalName: "", subject: "", tradeType: "", yearsExperience: "" });
  const update = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));

  const renderStep3 = () => {
    const r = selectedRole;
    const fields: { [k: string]: { title: string; sub: string; items: { placeholder: string; key: string; type?: string; options?: string[] }[] } } = {
      student: { title: "Add your first project", sub: "Any project, even half-done counts.", items: [{ placeholder: "Project title", key: "projectTitle" }, { placeholder: "One-line description", key: "projectDesc" }, { placeholder: "Link (optional)", key: "projectLink" }] },
      professional: { title: "Your current role", sub: "Tell us where you work.", items: [{ placeholder: "Job title", key: "jobTitle" }, { placeholder: "Company name", key: "companyName" }] },
      government: { title: "Your service profile", sub: "Tell us about your role.", items: [{ placeholder: "Designation", key: "designation" }, { placeholder: "Department", key: "department" }, { placeholder: "District / Zone", key: "district" }] },
      doctor: { title: "Your medical profile", sub: "Tell us about your practice.", items: [{ placeholder: "Designation (MBBS, MD...)", key: "designation" }, { placeholder: "Specialisation", key: "specialisation" }, { placeholder: "Hospital / Clinic", key: "hospitalName" }] },
      faculty: { title: "Your teaching profile", sub: "Tell us what you teach.", items: [{ placeholder: "Designation", key: "designation" }, { placeholder: "Department + Subject", key: "subject" }] },
      skilled_trade: { title: "Your trade profile", sub: "Tell us about your trade.", items: [{ placeholder: "Years of experience", key: "yearsExperience", type: "number" }, { placeholder: "City of work", key: "city" }] },
    };
    const f = fields[r || ""] || fields.student;
    return (
      <>
        <h2 className="text-[28px] font-extrabold text-center mb-2 text-[#EEF0FF]">{f.title}</h2>
        <p className="text-center mb-8" style={{ color: "rgba(238,240,255,0.5)" }}>{f.sub}</p>
        <div className="max-w-md mx-auto space-y-4 mb-8">
          {f.items.map(i => <Input key={i.key} type={i.type} placeholder={i.placeholder} value={(formData as any)[i.key]} onChange={e => update(i.key, e.target.value)} style={inputS} />)}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#04061A" }}>
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.12) 0%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)", animation: "floatOrb3 18s ease-in-out infinite", filter: "blur(50px)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <Link to="/" className="text-2xl font-extrabold mb-8 block text-center text-[#EEF0FF]">Tiikme</Link>

        {/* Progress */}
        <div className="flex gap-2 mb-10 max-w-xs mx-auto">
          {[0, 1, 2].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-500" style={{ background: s <= step ? "var(--brand)" : "rgba(238,240,255,0.1)" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="rounded-3xl p-10 max-w-[520px] mx-auto" style={{ background: "rgba(8,11,42,0.8)", border: "1px solid rgba(238,240,255,0.08)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-[28px] font-extrabold text-center mb-2 text-[#EEF0FF]">Who are you?</h2>
                <p className="text-center mb-8" style={{ color: "rgba(238,240,255,0.5)" }}>Pick your role — you can change it later.</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {roles.map(role => {
                    const sel = selectedRole === role.id;
                    return (
                      <button key={role.id} onClick={() => setSelectedRole(role.id)} className="rounded-2xl p-5 text-center transition-all relative" style={{
                        background: sel ? "var(--brand-dim)" : "rgba(238,240,255,0.04)",
                        border: `1.5px solid ${sel ? role.color : "rgba(238,240,255,0.08)"}`,
                        boxShadow: sel ? `0 0 0 1px rgba(61,90,241,0.14), 0 4px 16px ${role.color}33` : "none",
                      }}>
                        {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: role.color }}><Check className="w-3 h-3 text-white" /></div>}
                        <div className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${role.color}20` }}>
                          <role.icon className="w-5 h-5" style={{ color: sel ? role.color : "rgba(238,240,255,0.35)" }} />
                        </div>
                        <span className="text-[13px] font-bold block" style={{ color: sel ? "#EEF0FF" : "rgba(238,240,255,0.6)" }}>{role.label}</span>
                        <span className="text-[10px] mt-0.5 block" style={{ color: "rgba(238,240,255,0.32)" }}>{role.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <Button size="xl" onClick={() => selectedRole && setStep(1)} disabled={!selectedRole} className="w-full">Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-[13px] mb-6 transition-colors" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <h2 className="text-[28px] font-extrabold text-center mb-2 text-[#EEF0FF]">Your details</h2>
              <p className="text-center mb-8" style={{ color: "rgba(238,240,255,0.5)" }}>This helps others find and verify you.</p>
              <div className="max-w-md mx-auto space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First name" value={formData.firstName} onChange={e => update("firstName", e.target.value)} style={inputS} />
                  <Input placeholder="Last name" value={formData.lastName} onChange={e => update("lastName", e.target.value)} style={inputS} />
                </div>
                <Input type="email" placeholder="Email address" value={formData.email} onChange={e => update("email", e.target.value)} style={inputS} />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 characters)" value={formData.password} onChange={e => update("password", e.target.value)} style={{ ...inputS, paddingRight: 40 }} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(238,240,255,0.4)" }}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: "rgba(238,240,255,0.4)" }}>+91</span>
                  <Input type="tel" placeholder="Phone number" value={formData.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} style={{ ...inputS, paddingLeft: 48 }} />
                </div>
                <Input placeholder="Institution or Company" value={formData.institution} onChange={e => update("institution", e.target.value)} style={inputS} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="City" value={formData.city} onChange={e => update("city", e.target.value)} style={inputS} />
                  <select value={formData.state} onChange={e => update("state", e.target.value)} className={selectS} style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.13)", color: "#EEF0FF" }}>
                    <option value="">State</option>
                    {indianStates.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[12px] text-center mb-4" style={{ color: "rgba(238,240,255,0.4)" }}>By continuing you agree to our <Link to="/terms" style={{ color: "var(--brand)" }}>Terms</Link> and <Link to="/privacy" style={{ color: "var(--brand)" }}>Privacy Policy</Link>.</p>
              <Button size="xl" onClick={() => setStep(2)} className="w-full max-w-md mx-auto block">Continue <ArrowRight className="w-4 h-4" /></Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[13px] mb-6" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              {renderStep3()}
              <Button size="xl" onClick={() => navigate("/welcome")} className="w-full max-w-md mx-auto block">Create my profile <ArrowRight className="w-4 h-4" /></Button>
              <button onClick={() => navigate("/welcome")} className="block mx-auto mt-4 text-[13px] transition-colors" style={{ color: "rgba(238,240,255,0.4)" }}>Skip for now</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[13px] mt-10" style={{ color: "rgba(238,240,255,0.4)" }}>
          Already have an account? <Link to="/signin" style={{ color: "var(--brand)" }} className="font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
