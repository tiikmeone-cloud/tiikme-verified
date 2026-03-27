import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart, Check } from "lucide-react";
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
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir",
  "Ladakh", "Puducherry", "Chandigarh",
];

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Postgraduate", "PhD", "Alumni"];
const workTypes = ["Project", "Job", "Case", "Research", "Trade work", "Community work", "Government scheme", "Other"];
const statusOptions = ["Active", "Completed", "Paused"];

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", institution: "",
    city: "", state: "", yearOfStudy: "",
    projectTitle: "", projectDesc: "", projectType: "", projectStatus: "Active", projectLink: "",
  });

  const handleComplete = () => {
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen liquid-gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Link to="/" className="text-2xl font-extrabold mb-8 block text-center">Tiikme</Link>

        {/* Progress bar */}
        <div className="flex gap-2 mb-10 max-w-xs mx-auto">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? "bg-electric glow-primary" : "bg-[rgba(255,255,255,0.08)]"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-extrabold text-center mb-2">Who are you?</h2>
              <p className="text-muted-foreground text-center mb-8">Pick your role — you can change it later.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className="glass-card p-5 rounded-2xl text-center transition-all duration-200 border relative hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        borderColor: isSelected ? role.color : "rgba(255,255,255,0.12)",
                        boxShadow: isSelected ? `0 0 0 1px ${role.color}, 0 0 20px ${role.color}33` : undefined,
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: role.color }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <role.icon className="w-7 h-7 mx-auto mb-2" style={{ color: isSelected ? role.color : "rgba(240,240,255,0.35)" }} />
                      <span className="text-sm font-bold block" style={{ color: isSelected ? role.color : "rgba(240,240,255,0.6)" }}>
                        {role.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{role.desc}</span>
                    </button>
                  );
                })}
              </div>

              <Button variant="hero" size="lg" onClick={() => selectedRole && setStep(1)} disabled={!selectedRole} className="w-full">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-3xl font-extrabold text-center mb-2">Your details</h2>
              <p className="text-muted-foreground text-center mb-8">This helps others find and verify you.</p>

              <div className="max-w-md mx-auto space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  <Input placeholder="Last name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                </div>
                <Input placeholder="Professional / College email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                <Input placeholder="Institution or Company" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm"
                  >
                    <option value="" className="bg-background">State</option>
                    {indianStates.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                  </select>
                </div>
                {selectedRole === "student" && (
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm"
                  >
                    <option value="" className="bg-background">Year of study</option>
                    {yearOptions.map(y => <option key={y} value={y} className="bg-background">{y}</option>)}
                  </select>
                )}
              </div>

              <Button variant="hero" size="lg" onClick={() => setStep(2)} className="w-full">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: First Work */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-3xl font-extrabold text-center mb-2">Show what you've built</h2>
              <p className="text-muted-foreground text-center mb-8">Add any project, job, case, or work. Even half-done counts as proof.</p>

              <div className="max-w-md mx-auto space-y-4 mb-8">
                <Input placeholder="Work / Project title" value={formData.projectTitle} onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                <Input placeholder="One-line description" value={formData.projectDesc} onChange={(e) => setFormData({ ...formData, projectDesc: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm"
                  >
                    <option value="" className="bg-background">Type</option>
                    {workTypes.map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
                  </select>
                  <select
                    value={formData.projectStatus}
                    onChange={(e) => setFormData({ ...formData, projectStatus: e.target.value })}
                    className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm"
                  >
                    {statusOptions.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                  </select>
                </div>
                <Input placeholder="Link (optional)" value={formData.projectLink} onChange={(e) => setFormData({ ...formData, projectLink: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
              </div>

              <Button variant="hero" size="lg" onClick={handleComplete} className="w-full">
                Create my profile
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button onClick={handleComplete} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Skip for now
              </button>
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
