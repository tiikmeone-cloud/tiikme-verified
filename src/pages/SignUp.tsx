import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";

const roles = [
  { id: "student", label: "Student", desc: "College, university, or school", icon: GraduationCap, color: "#7C6FFF" },
  { id: "professional", label: "Professional", desc: "Working in any industry", icon: Briefcase, color: "#4FC3F7" },
  { id: "hr", label: "HR / Recruiter", desc: "Hiring or talent acquisition", icon: UserCheck, color: "#FF6B6B" },
  { id: "faculty", label: "Faculty / Mentor", desc: "Teaching or guiding others", icon: BookOpen, color: "#FFB547" },
  { id: "doctor", label: "Doctor / Health", desc: "Healthcare professional", icon: Stethoscope, color: "#26C6DA" },
  { id: "government", label: "Government", desc: "Public sector or schemes", icon: Building2, color: "#66BB6A" },
  { id: "skilled_trade", label: "Skilled Trade", desc: "Electrician, plumber, etc.", icon: Wrench, color: "#FFA726" },
  { id: "other", label: "Other", desc: "Something else entirely", icon: Heart, color: "#7C6FFF" },
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Postgraduate", "PhD", "Alumni"];
const tradeTypes = ["Electrician", "Plumber", "Carpenter", "Mechanic", "Mason", "Welder", "Painter", "Other"];

const inputClass = "h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]";

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", phone: "", institution: "",
    city: "", state: "", yearOfStudy: "",
    // Role-specific step 3 fields
    projectTitle: "", projectDesc: "", projectType: "", projectStatus: "Active", projectLink: "",
    jobTitle: "", companyName: "", jobDesc: "",
    designation: "", department: "", district: "",
    specialisation: "", hospitalName: "",
    subject: "",
    tradeType: "", yearsExperience: "",
  });

  const handleComplete = () => navigate("/welcome");
  const update = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const renderStep3 = () => {
    const role = selectedRole;

    if (role === "student" || role === "other") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Add your first project</h2>
          <p className="text-muted-foreground text-center mb-8">Any project or side project. Even half-done counts.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <Input placeholder="Project title" value={formData.projectTitle} onChange={e => update("projectTitle", e.target.value)} className={inputClass} />
            <Input placeholder="One-line description" value={formData.projectDesc} onChange={e => update("projectDesc", e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.projectStatus} onChange={e => update("projectStatus", e.target.value)} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                {["Active", "Completed", "Paused"].map(s => <option key={s} className="bg-[#050510]">{s}</option>)}
              </select>
              <Input placeholder="Link (optional)" value={formData.projectLink} onChange={e => update("projectLink", e.target.value)} className={inputClass} />
            </div>
          </div>
        </>
      );
    }

    if (role === "professional" || role === "hr") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Your current role</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us where you work.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <Input placeholder="Job title" value={formData.jobTitle} onChange={e => update("jobTitle", e.target.value)} className={inputClass} />
            <Input placeholder="Company name" value={formData.companyName} onChange={e => update("companyName", e.target.value)} className={inputClass} />
            <Input placeholder="What do you do? (optional)" value={formData.jobDesc} onChange={e => update("jobDesc", e.target.value)} className={inputClass} />
          </div>
        </>
      );
    }

    if (role === "government") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Your service profile</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us about your role.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <Input placeholder="Designation (e.g. Sub-Inspector, Branch Manager)" value={formData.designation} onChange={e => update("designation", e.target.value)} className={inputClass} />
            <Input placeholder="Department (e.g. Telangana Police, SBI)" value={formData.department} onChange={e => update("department", e.target.value)} className={inputClass} />
            <Input placeholder="District / Zone" value={formData.district} onChange={e => update("district", e.target.value)} className={inputClass} />
          </div>
        </>
      );
    }

    if (role === "doctor") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Your medical profile</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us about your practice.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <Input placeholder="Designation (e.g. MBBS, MD, Surgeon)" value={formData.designation} onChange={e => update("designation", e.target.value)} className={inputClass} />
            <Input placeholder="Specialisation" value={formData.specialisation} onChange={e => update("specialisation", e.target.value)} className={inputClass} />
            <Input placeholder="Hospital / Clinic name" value={formData.hospitalName} onChange={e => update("hospitalName", e.target.value)} className={inputClass} />
          </div>
        </>
      );
    }

    if (role === "faculty") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Your teaching profile</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us what you teach.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <select value={formData.designation} onChange={e => update("designation", e.target.value)} className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              <option value="" className="bg-[#050510]">Designation</option>
              {["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "HOD", "Trainer"].map(d => <option key={d} className="bg-[#050510]">{d}</option>)}
            </select>
            <Input placeholder="Department + Subject" value={formData.subject} onChange={e => update("subject", e.target.value)} className={inputClass} />
            <Input placeholder="Institution name" value={formData.institution} onChange={e => update("institution", e.target.value)} className={inputClass} />
          </div>
        </>
      );
    }

    if (role === "skilled_trade") {
      return (
        <>
          <h2 className="text-3xl font-extrabold text-center mb-2">Your trade profile</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us about your trade.</p>
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <select value={formData.tradeType} onChange={e => update("tradeType", e.target.value)} className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              <option value="" className="bg-[#050510]">Trade type</option>
              {tradeTypes.map(t => <option key={t} className="bg-[#050510]">{t}</option>)}
            </select>
            <Input type="number" placeholder="Years of experience" value={formData.yearsExperience} onChange={e => update("yearsExperience", e.target.value)} className={inputClass} />
            <Input placeholder="City of work" value={formData.city} onChange={e => update("city", e.target.value)} className={inputClass} />
          </div>
        </>
      );
    }

    // Fallback (startup/other)
    return (
      <>
        <h2 className="text-3xl font-extrabold text-center mb-2">Add your first project</h2>
        <p className="text-muted-foreground text-center mb-8">Any project, startup, or work sample. Even half-done counts.</p>
        <div className="max-w-md mx-auto space-y-4 mb-8">
          <Input placeholder="Project / Startup name" value={formData.projectTitle} onChange={e => update("projectTitle", e.target.value)} className={inputClass} />
          <Input placeholder="One-line description" value={formData.projectDesc} onChange={e => update("projectDesc", e.target.value)} className={inputClass} />
          <Input placeholder="Link (optional)" value={formData.projectLink} onChange={e => update("projectLink", e.target.value)} className={inputClass} />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen liquid-gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Link to="/" className="text-2xl font-extrabold mb-8 block text-center">Tiikme</Link>

        <div className="flex gap-2 mb-10 max-w-xs mx-auto">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? "bg-electric glow-primary" : "bg-[rgba(255,255,255,0.08)]"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-extrabold text-center mb-2">Who are you?</h2>
              <p className="text-muted-foreground text-center mb-8">Pick your role — you can change it later.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button key={role.id} onClick={() => setSelectedRole(role.id)}
                      className="glass-card p-5 rounded-2xl text-center transition-all duration-200 border relative hover:scale-[1.03] active:scale-[0.97]"
                      style={{ borderColor: isSelected ? role.color : "rgba(255,255,255,0.12)", boxShadow: isSelected ? `0 0 0 1px ${role.color}, 0 0 20px ${role.color}33` : undefined }}>
                      {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: role.color }}><Check className="w-3 h-3 text-white" /></div>}
                      <role.icon className="w-7 h-7 mx-auto mb-2" style={{ color: isSelected ? role.color : "rgba(240,240,255,0.35)" }} />
                      <span className="text-sm font-bold block" style={{ color: isSelected ? role.color : "rgba(240,240,255,0.6)" }}>{role.label}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{role.desc}</span>
                    </button>
                  );
                })}
              </div>
              <Button size="lg" onClick={() => selectedRole && setStep(1)} disabled={!selectedRole} className="w-full">Continue <ArrowRight className="w-4 h-4" /></Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <h2 className="text-3xl font-extrabold text-center mb-2">Your details</h2>
              <p className="text-muted-foreground text-center mb-8">This helps others find and verify you.</p>
              <div className="max-w-md mx-auto space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First name" value={formData.firstName} onChange={e => update("firstName", e.target.value)} className={inputClass} />
                  <Input placeholder="Last name" value={formData.lastName} onChange={e => update("lastName", e.target.value)} className={inputClass} />
                </div>
                <Input type="email" placeholder="Email address" value={formData.email} onChange={e => update("email", e.target.value)} className={inputClass} />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 characters)" value={formData.password} onChange={e => update("password", e.target.value)} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                  <Input type="tel" placeholder="Phone number" value={formData.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} className={`${inputClass} pl-12`} />
                </div>
                <Input placeholder="Institution or Company" value={formData.institution} onChange={e => update("institution", e.target.value)} className={inputClass} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="City" value={formData.city} onChange={e => update("city", e.target.value)} className={inputClass} />
                  <select value={formData.state} onChange={e => update("state", e.target.value)} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                    <option value="" className="bg-[#050510]">State</option>
                    {indianStates.map(s => <option key={s} value={s} className="bg-[#050510]">{s}</option>)}
                  </select>
                </div>
                {selectedRole === "student" && (
                  <select value={formData.yearOfStudy} onChange={e => update("yearOfStudy", e.target.value)} className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                    <option value="" className="bg-[#050510]">Year of study</option>
                    {yearOptions.map(y => <option key={y} value={y} className="bg-[#050510]">{y}</option>)}
                  </select>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center mb-4">By continuing you agree to our <Link to="/terms" className="text-electric underline">Terms</Link> and <Link to="/privacy" className="text-electric underline">Privacy Policy</Link>.</p>
              <Button size="lg" onClick={() => setStep(2)} className="w-full">Continue <ArrowRight className="w-4 h-4" /></Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              {renderStep3()}
              <Button size="lg" onClick={handleComplete} className="w-full">Create my profile <ArrowRight className="w-4 h-4" /></Button>
              <button onClick={handleComplete} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Skip for now</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Already have an account?{" "}
          <Link to="/signin" className="text-electric hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
