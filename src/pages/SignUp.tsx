import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart, Rocket, Check, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RoleFields from "@/components/signup/RoleFields";
import RoleStep3 from "@/components/signup/RoleStep3";
import tiikLogo from "@/assets/tiikme-logo.png";

const roles = [
  { id: "student", label: "Student", desc: "College, university, or school", icon: GraduationCap, color: "#4F46E5" },
  { id: "professional", label: "Professional", desc: "Working in any industry", icon: Briefcase, color: "#0369A1" },
  { id: "hr", label: "HR / Recruiter", desc: "Hiring or talent acquisition", icon: UserCheck, color: "#6B21A8" },
  { id: "faculty", label: "Faculty", desc: "Teaching or guiding others", icon: BookOpen, color: "#92400E" },
  { id: "doctor", label: "Doctor / Health", desc: "Healthcare professional", icon: Stethoscope, color: "#0E7490" },
  { id: "government", label: "Government", desc: "Public sector or schemes", icon: Building2, color: "#166534" },
  { id: "skilled_trade", label: "Skilled Trade", desc: "Electrician, plumber, etc.", icon: Wrench, color: "#C2410C" },
  { id: "aspirant", label: "Aspirant", desc: "Preparing for exams", icon: Heart, color: "#374151" },
  { id: "builder", label: "Builder / Founder", desc: "Starting something new", icon: Rocket, color: "#7C3AED" },
];

const indianStates = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];

const inputS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const selectS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const glassCard: React.CSSProperties = { background: "rgba(8,11,42,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(238,240,255,0.08)", borderRadius: 24 };

const getStrength = (pw: string) => {
  if (pw.length < 6) return { level: 0, label: "Too short", color: "#DC2626" };
  if (pw.length < 10) return { level: 1, label: "Could be stronger", color: "#F59E0B" };
  return { level: 2, label: "Strong", color: "#10B981" };
};

const getInstitutionLabel = (role: string | null) => {
  switch (role) {
    case "student": return "College or University name";
    case "aspirant": return "Coaching institute (optional)";
    case "professional": return "Current company";
    case "hr": return "Your company name";
    case "government": return "Department or Ministry";
    case "doctor": return "Hospital or Clinic";
    case "faculty": return "Institution name";
    case "builder": return "Startup name";
    case "skilled_trade": return null; // hide
    default: return "Institution or Company";
  }
};

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", institution: "", city: "", state: "" });
  const [roleData, setRoleData] = useState<Record<string, string>>({});
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));
  const updateRole = (key: string, val: string) => setRoleData(p => ({ ...p, [key]: val }));
  const strength = getStrength(formData.password);
  const institutionLabel = getInstitutionLabel(selectedRole);

  // Resend cooldown timer
  useEffect(() => {
    if (step !== 1.5) return;
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/welcome" },
    });
    if (error) toast.error(error.message);
  };

  const handleSignUpSubmit = async () => {
    if (!formData.email || !formData.password || !formData.firstName) {
      toast.info("Please fill in required fields"); return;
    }
    if (formData.password.length < 8) {
      toast.info("Password must be at least 8 characters"); return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin + "/app/feed",
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          role: selectedRole,
          institution: formData.institution,
          city: formData.city,
          state: formData.state,
        },
      },
    });
    setIsSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email.");
    setStep(1.5); // Go to OTP verification
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError("Enter all 6 digits"); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otpValue,
      type: "email",
    });
    setIsSubmitting(false);
    if (error) { setOtpError("Wrong code. Try again."); return; }
    toast.success("Email verified!");
    setStep(2);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: formData.email });
    if (error) { toast.error(error.message); return; }
    toast.success("Code resent!");
    setResendCooldown(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#04061A" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.15) 0%, rgba(61,90,241,0.04) 45%, transparent 70%)", animation: "floatOrb1 14s ease-in-out infinite", filter: "blur(60px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(91,115,245,0.1) 0%, transparent 70%)", animation: "floatOrb2 18s ease-in-out infinite alternate", filter: "blur(80px)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[520px] relative z-10">
        <Link to="/" className="flex items-center justify-center mb-7">
          <img src={tiikLogo} alt="Tiikme" className="h-10 w-auto" />
        </Link>

        <div className="flex gap-1.5 mb-8 max-w-xs mx-auto">
          {[0, 1, 2].map(s => (
            <div key={s} className="flex-1 h-[3px] rounded-full transition-all duration-500" style={{ background: s <= Math.floor(step) ? "var(--brand)" : "rgba(238,240,255,0.12)" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: ROLE SELECTION */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="p-8 sm:p-10" style={glassCard}>
                <h2 className="text-[28px] font-extrabold text-center mb-2 text-[#EEF0FF]" style={{ letterSpacing: "-0.02em" }}>Who are you?</h2>
                <p className="text-center mb-8 text-[14px]" style={{ color: "rgba(238,240,255,0.55)" }}>Pick your role — you can update this anytime.</p>
                <div className="grid grid-cols-3 gap-2.5 mb-8">
                  {roles.map(role => {
                    const sel = selectedRole === role.id;
                    return (
                      <button key={role.id} onClick={() => setSelectedRole(role.id)}
                        className="rounded-2xl p-5 text-center transition-all duration-200 relative cursor-pointer active:scale-[0.98]"
                        style={{
                          background: sel ? "rgba(61,90,241,0.12)" : "rgba(238,240,255,0.04)",
                          border: `1.5px solid ${sel ? "var(--brand)" : "rgba(238,240,255,0.08)"}`,
                          boxShadow: sel ? "0 0 0 1px var(--brand-dim), 0 4px 20px var(--brand-glow)" : "none",
                        }}>
                        {sel && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                            <Check className="w-[11px] h-[11px] text-white" />
                          </motion.div>
                        )}
                        <div className="w-11 h-11 rounded-xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: `${role.color}20` }}>
                          <role.icon className="w-[22px] h-[22px]" style={{ color: sel ? role.color : "rgba(238,240,255,0.35)" }} />
                        </div>
                        <span className="text-[14px] font-bold block" style={{ color: sel ? "#EEF0FF" : "rgba(238,240,255,0.6)" }}>{role.label}</span>
                        <span className="text-[11px] mt-1 block" style={{ color: "rgba(238,240,255,0.45)" }}>{role.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <Button size="xl" onClick={() => selectedRole && setStep(1)} disabled={!selectedRole} className="w-full active:scale-95 transition-all duration-200">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                <p className="text-center text-[13px] mt-4" style={{ color: "rgba(238,240,255,0.4)" }}>
                  Registering for a company or institution?{" "}
                  <Link to="/join-as-institution" className="font-semibold" style={{ color: "var(--brand, #3D5AF1)" }}>Create an Institution Page →</Link>
                </p>
              </div>
              <p className="text-center text-[14px] mt-4" style={{ color: "rgba(238,240,255,0.4)" }}>
                Already have an account? <Link to="/signin" className="font-semibold" style={{ color: "var(--brand)" }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* STEP 1: YOUR DETAILS */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer active:scale-95" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide" style={glassCard}>
                <h2 className="text-[28px] font-extrabold text-center mb-1 text-[#EEF0FF]" style={{ letterSpacing: "-0.02em" }}>Your details</h2>
                <p className="text-center mb-7 text-[14px]" style={{ color: "rgba(238,240,255,0.55)" }}>This helps others find and verify you.</p>
                <div className="space-y-3.5">
                  {/* Google OAuth */}
                  <button onClick={handleGoogleSignIn} className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5 text-[14px] font-semibold cursor-pointer active:scale-[0.98] transition-all"
                    style={{ background: "rgba(238,240,255,0.06)", border: "1.5px solid rgba(238,240,255,0.12)", color: "#EEF0FF" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z"/></svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: "rgba(238,240,255,0.1)" }} />
                    <span className="text-[12px] font-medium" style={{ color: "rgba(238,240,255,0.3)" }}>or</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(238,240,255,0.1)" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="First name" value={formData.firstName} onChange={e => update("firstName", e.target.value)} style={inputS} />
                    <Input placeholder="Last name" value={formData.lastName} onChange={e => update("lastName", e.target.value)} style={inputS} />
                  </div>
                  <Input type="email" placeholder="Email address" value={formData.email} onChange={e => update("email", e.target.value)} style={inputS} />
                  <div>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 characters)" value={formData.password} onChange={e => update("password", e.target.value)} style={{ ...inputS, paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "rgba(238,240,255,0.4)" }}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength.level ? strength.color : "rgba(238,240,255,0.1)" }} />
                          ))}
                        </div>
                        <p className="text-[10px] mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Role-aware institution field */}
                  {institutionLabel && (
                    <Input placeholder={institutionLabel} value={formData.institution} onChange={e => update("institution", e.target.value)} style={inputS} />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={formData.city} onChange={e => update("city", e.target.value)} style={inputS} />
                    <select value={formData.state} onChange={e => update("state", e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
                      <option value="">State</option>
                      {indianStates.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Role-specific fields */}
                  {selectedRole && <RoleFields role={selectedRole} data={roleData} update={updateRole} />}
                </div>
                <p className="text-[12px] text-center mt-5 mb-4" style={{ color: "rgba(238,240,255,0.35)" }}>By continuing you agree to our <Link to="/terms" style={{ color: "var(--brand)" }}>Terms</Link> and <Link to="/privacy" style={{ color: "var(--brand)" }}>Privacy Policy</Link>.</p>
                <Button size="xl" onClick={handleSignUpSubmit} disabled={isSubmitting} className="w-full active:scale-95 transition-all duration-200">
                  {isSubmitting ? "Creating account..." : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 1.5: EMAIL OTP VERIFICATION */}
          {step === 1.5 && (
            <motion.div key="s1.5" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="p-8 sm:p-10 text-center" style={glassCard}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--brand-dim, rgba(61,90,241,0.15))" }}>
                  <Mail className="w-8 h-8" style={{ color: "var(--brand, #3D5AF1)" }} />
                </div>
                <h2 className="text-[28px] font-extrabold mb-2 text-[#EEF0FF]" style={{ letterSpacing: "-0.02em" }}>Check your email</h2>
                <p className="text-[14px] mb-8" style={{ color: "rgba(238,240,255,0.55)" }}>
                  We sent a 6-digit code to <span className="font-semibold" style={{ color: "#EEF0FF" }}>{formData.email}</span>
                </p>
                <div className="flex justify-center mb-4">
                  <InputOTP maxLength={6} value={otpValue} onChange={(val) => { setOtpValue(val); setOtpError(""); }}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg font-bold" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.15)", color: "#EEF0FF" }} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpError && <p className="text-[13px] font-medium mb-3" style={{ color: "#DC2626" }}>{otpError}</p>}
                <Button size="xl" onClick={handleVerifyOtp} disabled={isSubmitting || otpValue.length !== 6} className="w-full active:scale-95 transition-all duration-200 mb-4">
                  {isSubmitting ? "Verifying..." : "Verify"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed"
                  style={{ color: resendCooldown > 0 ? "rgba(238,240,255,0.3)" : "var(--brand, #3D5AF1)" }}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ROLE-ADAPTIVE FIRST ENTRY */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer active:scale-95" style={{ color: "rgba(238,240,255,0.5)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <RoleStep3
                role={selectedRole || "student"}
                roleData={roleData}
                onFinish={() => navigate("/welcome")}
                onSkip={() => navigate("/welcome")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SignUp;
