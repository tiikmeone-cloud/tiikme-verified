import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Briefcase, UserCheck, BookOpen, Stethoscope, Building2, Wrench, Heart, Rocket, Check, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RoleFields from "@/components/signup/RoleFields";
import ThemeLogo from "@/components/ThemeLogo";
import AuthThemeToggle from "@/components/AuthThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

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

const allIndianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const courseOptions = [
  "Computer Science & Engineering", "Mechanical Engineering", "Civil Engineering",
  "Electrical Engineering", "Electronics & Communication", "Chemical Engineering",
  "Biotechnology / Life Sciences", "Medicine / MBBS / BDS", "Architecture & Urban Planning",
  "Law / LLB", "Business / MBA", "Agriculture & Food Science", "Arts & Humanities",
  "Science (BSc/MSc/PhD)", "Other"
];

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad", "PhD", "Research"];
const industryOptions = ["Tech", "Healthcare", "Finance", "Education", "Manufacturing", "Government", "Legal", "Media", "Other"];
const experienceOptions = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const specialisationOptions = ["General", "Cardiology", "Neurology", "Orthopaedics", "Paediatrics", "Gynaecology", "Dermatology", "Psychiatry", "Radiology", "Other"];
const degreeOptions = ["MBBS", "MD", "MS", "BDS", "MDS", "Other"];
const facultyDesignations = ["Assistant Professor", "Associate Professor", "Professor", "Principal", "Dean", "Other"];
const tradeTypes = ["Electrician", "Plumber", "Carpenter", "Welder", "AC Technician", "Construction", "Driver", "Chef", "Tailor", "Other"];
const stageOptions = ["Idea", "Building", "Launched", "Scaling"];

const getStrength = (pw: string) => {
  if (pw.length < 6) return { level: 0, label: "Too short", color: "#DC2626" };
  if (pw.length < 10) return { level: 1, label: "Could be stronger", color: "#F59E0B" };
  return { level: 2, label: "Strong", color: "#10B981" };
};

const SignUp = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  // Steps: 1=email/password, 2=OTP, 3=role, 4=profile details, 5=redirecting to welcome
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [institution, setInstitution] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [roleData, setRoleData] = useState<Record<string, string>>({});
  const updateRole = (key: string, val: string) => setRoleData(p => ({ ...p, [key]: val }));

  const strength = getStrength(password);

  // Redirect if already logged in AND has completed profile (not mid-onboarding)
  useEffect(() => {
    if (user && step === 1) {
      // Only redirect if user already has a name set (completed onboarding before)
      const checkProfile = async () => {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        if (data?.full_name) {
          navigate("/app/feed", { replace: true });
        } else {
          // User is logged in but hasn't completed onboarding — go to role step
          setStep(3);
        }
      };
      checkProfile();
    }
  }, [user, step]);

  // Resend cooldown timer
  useEffect(() => {
    if (step !== 2) return;
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/welcome" },
    });
    if (error) toast.error(error.message);
  };

  // STEP 1: Create account
  const handleSignUp = async () => {
    if (!email || !password) { toast.info("Please fill in all fields"); return; }
    if (password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/app/feed" },
    });
    setIsSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email.");
    sessionStorage.setItem("signup_email", email);
    setStep(2);
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError("Enter all 6 digits"); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: sessionStorage.getItem("signup_email") || email,
      token: otpValue,
      type: "email",
    });
    setIsSubmitting(false);
    if (error) { setOtpError("Code is invalid or expired. Try again."); return; }
    toast.success("Email verified!");
    setStep(3);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: sessionStorage.getItem("signup_email") || email });
    if (error) { toast.error(error.message); return; }
    toast.success("Code resent!");
    setResendCooldown(60);
  };

  // STEP 3: Role selected → go to step 4
  const handleRoleContinue = () => {
    if (!selectedRole) return;
    sessionStorage.setItem("onboarding_role", selectedRole);
    setStep(4);
  };

  // STEP 4: Save profile
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { toast.error("Not authenticated"); setIsSubmitting(false); return; }

    const fullName = `${firstName} ${lastName}`.trim();
    const username = (firstName || "user").toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + currentUser.id.substring(0, 6);

    const { error } = await supabase.from("profiles").upsert({
      id: currentUser.id,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role: selectedRole || "student",
      headline,
      institution_name: institution,
      location_city: city,
      location_state: state,
      username,
      designation: roleData.designation || null,
      department: roleData.department || null,
      sector: roleData.sector || null,
      role_subtype: roleData.roleSubtype || null,
      role_metadata: roleData as any,
      onboarding_complete: true,
    }, { onConflict: "id" });

    setIsSubmitting(false);
    if (error) { toast.error("Failed to save profile"); return; }
    await refreshProfile();
    navigate("/welcome");
  };

  const handleSkip = async () => {
    // Save minimal profile with just role
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && selectedRole) {
      await supabase.from("profiles").upsert({
        id: currentUser.id,
        role: selectedRole,
      }, { onConflict: "id" });
      await refreshProfile();
    }
    navigate("/app/feed");
  };

  const inputS: React.CSSProperties = { background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, color: "var(--text-1)", height: 44 };
  const selectS: React.CSSProperties = { background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, color: "var(--text-1)", height: 44 };
  const glassCard: React.CSSProperties = { background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)", border: "1px solid var(--border)", borderRadius: 24 };

  const totalSteps = 4;
  const progressSteps = [1, 2, 3, 4];

  // Role-specific fields for Step 4
  const renderRoleFields = () => {
    if (!selectedRole) return null;
    switch (selectedRole) {
      case "student":
        return (<>
          <Input placeholder="Institution / University name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <select value={roleData.course || ""} onChange={e => updateRole("course", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Course / Branch *</option>
            {courseOptions.map(c => <option key={c}>{c}</option>)}
          </select>
          {roleData.course === "Other" && <Input placeholder="Specify your course" value={roleData.courseOther || ""} onChange={e => updateRole("courseOther", e.target.value)} style={inputS} />}
          <select value={roleData.year || ""} onChange={e => updateRole("year", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Year of study *</option>
            {yearOptions.map(y => <option key={y}>{y}</option>)}
          </select>
        </>);
      case "professional":
        return (<>
          <Input placeholder="Company / Organisation name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <Input placeholder="Job title / Designation *" value={roleData.designation || ""} onChange={e => updateRole("designation", e.target.value)} style={inputS} />
          <select value={roleData.industry || ""} onChange={e => updateRole("industry", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Industry</option>
            {industryOptions.map(i => <option key={i}>{i}</option>)}
          </select>
          <select value={roleData.experience || ""} onChange={e => updateRole("experience", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Years of experience</option>
            {experienceOptions.map(e => <option key={e}>{e}</option>)}
          </select>
        </>);
      case "doctor":
        return (<>
          <Input placeholder="Hospital or Clinic name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <select value={roleData.specialisation || ""} onChange={e => updateRole("specialisation", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Specialisation</option>
            {specialisationOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={roleData.degree || ""} onChange={e => updateRole("degree", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Degree</option>
            {degreeOptions.map(d => <option key={d}>{d}</option>)}
          </select>
          <Input placeholder="Council registration number (optional)" value={roleData.regNumber || ""} onChange={e => updateRole("regNumber", e.target.value)} style={inputS} />
        </>);
      case "government":
        return (<>
          <Input placeholder="Ministry / Department / PSU name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <Input placeholder="Designation *" value={roleData.designation || ""} onChange={e => updateRole("designation", e.target.value)} style={inputS} />
          <select value={roleData.stateCadre || ""} onChange={e => updateRole("stateCadre", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">State cadre (if applicable)</option>
            {allIndianStates.map(s => <option key={s}>{s}</option>)}
          </select>
        </>);
      case "faculty":
        return (<>
          <Input placeholder="Institution name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <Input placeholder="Department *" value={roleData.department || ""} onChange={e => updateRole("department", e.target.value)} style={inputS} />
          <select value={roleData.designation || ""} onChange={e => updateRole("designation", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Designation</option>
            {facultyDesignations.map(d => <option key={d}>{d}</option>)}
          </select>
        </>);
      case "hr":
        return (<>
          <Input placeholder="Company name *" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <Input placeholder="Job title *" value={roleData.designation || ""} onChange={e => updateRole("designation", e.target.value)} style={inputS} />
          <select value={roleData.industry || ""} onChange={e => updateRole("industry", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Industry</option>
            {industryOptions.map(i => <option key={i}>{i}</option>)}
          </select>
        </>);
      case "builder":
        return (<>
          <Input placeholder="Startup / Company name (optional)" value={institution} onChange={e => setInstitution(e.target.value)} style={inputS} />
          <Input placeholder="What are you building?" value={roleData.building || ""} onChange={e => updateRole("building", e.target.value.slice(0, 100))} maxLength={100} style={inputS} />
          <select value={roleData.stage || ""} onChange={e => updateRole("stage", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Stage</option>
            {stageOptions.map(s => <option key={s}>{s}</option>)}
          </select>
        </>);
      case "skilled_trade":
        return (<>
          <select value={roleData.tradeType || ""} onChange={e => updateRole("tradeType", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
            <option value="">Trade type</option>
            {tradeTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </>);
      default:
        return <RoleFields role={selectedRole} data={roleData} update={updateRole} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] rounded-full" style={{ background: "radial-gradient(circle, var(--brand-glow) 0%, var(--brand-dim) 45%, transparent 70%)", animation: "floatOrb1 14s ease-in-out infinite", filter: "blur(60px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full" style={{ background: "radial-gradient(circle, var(--brand-dim) 0%, transparent 70%)", animation: "floatOrb2 18s ease-in-out infinite alternate", filter: "blur(80px)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[520px] relative z-10">
        <Link to="/" className="flex items-center justify-center mb-7">
          <ThemeLogo className="h-10 w-auto" />
        </Link>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8 max-w-xs mx-auto">
          {progressSteps.map(s => (
            <div key={s} className="flex-1 h-[3px] rounded-full transition-all duration-500" style={{ background: s <= step ? "var(--brand)" : "var(--border-2)" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Email + Password ═══ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="p-8 sm:p-10" style={glassCard}>
                <h2 className="text-[28px] font-extrabold text-center mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Create your account</h2>
                <p className="text-center mb-7 text-[14px]" style={{ color: "var(--text-2)" }}>Your verified professional identity starts here.</p>

                <button onClick={handleGoogleSignIn} className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5 text-[14px] font-semibold cursor-pointer active:scale-[0.98] transition-all mb-4"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z"/></svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-3)" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                <div className="space-y-3.5">
                  <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputS} />
                  <div>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputS, paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-3)" }}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength.level ? strength.color : "var(--border-2)" }} />
                          ))}
                        </div>
                        <p className="text-[10px] mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[12px] text-center mt-5 mb-4" style={{ color: "var(--text-3)" }}>By continuing you agree to our <Link to="/terms" style={{ color: "var(--brand)" }}>Terms</Link> and <Link to="/privacy" style={{ color: "var(--brand)" }}>Privacy Policy</Link>.</p>
                <Button size="xl" onClick={handleSignUp} disabled={isSubmitting} className="w-full active:scale-95 transition-all duration-200">
                  {isSubmitting ? "Creating account..." : "Create account"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <p className="text-center text-[14px] mt-4" style={{ color: "var(--text-3)" }}>
                Already have an account? <Link to="/signin" className="font-semibold" style={{ color: "var(--brand)" }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* ═══ STEP 2: OTP Verification ═══ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="p-8 sm:p-10 text-center" style={glassCard}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                  <Mail className="w-8 h-8" style={{ color: "var(--brand)" }} />
                </div>
                <h2 className="text-[28px] font-extrabold mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Check your inbox</h2>
                <p className="text-[14px] mb-8" style={{ color: "var(--text-2)" }}>
                  We sent a 6-digit code to <span className="font-semibold" style={{ color: "var(--text-1)" }}>{sessionStorage.getItem("signup_email") || email}</span>
                </p>
                <div className="flex justify-center mb-4">
                  <InputOTP maxLength={6} value={otpValue} onChange={(val) => { setOtpValue(val); setOtpError(""); }}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg font-bold" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpError && <p className="text-[13px] font-medium mb-3" style={{ color: "var(--danger)" }}>{otpError}</p>}
                <Button size="xl" onClick={handleVerifyOtp} disabled={isSubmitting || otpValue.length !== 6} className="w-full active:scale-95 transition-all duration-200 mb-4">
                  {isSubmitting ? "Verifying..." : "Verify"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed"
                  style={{ color: resendCooldown > 0 ? "var(--text-3)" : "var(--brand)" }}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                <p className="text-[12px] mt-3" style={{ color: "var(--text-3)" }}>
                  Wrong email? <button onClick={() => setStep(1)} className="font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>Go back →</button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Role Selection ═══ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="p-8 sm:p-10" style={glassCard}>
                <h2 className="text-[28px] font-extrabold text-center mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Who are you?</h2>
                <p className="text-center mb-8 text-[14px]" style={{ color: "var(--text-2)" }}>Pick your role — you can update this anytime.</p>
                <div className="grid grid-cols-3 gap-2.5 mb-8">
                  {roles.map(role => {
                    const sel = selectedRole === role.id;
                    return (
                      <button key={role.id} onClick={() => setSelectedRole(role.id)}
                        className="rounded-2xl p-5 text-center transition-all duration-200 relative cursor-pointer active:scale-[0.98]"
                        style={{
                          background: sel ? "var(--brand-dim)" : "var(--surface-2)",
                          border: `1.5px solid ${sel ? "var(--brand)" : "var(--border-2)"}`,
                          boxShadow: sel ? "0 0 0 1px var(--brand-dim), 0 4px 20px var(--brand-glow)" : "none",
                        }}>
                        {sel && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                            <Check className="w-[11px] h-[11px] text-white" />
                          </motion.div>
                        )}
                        <div className="w-11 h-11 rounded-xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: `${role.color}20` }}>
                          <role.icon className="w-[22px] h-[22px]" style={{ color: sel ? role.color : "var(--text-3)" }} />
                        </div>
                        <span className="text-[14px] font-bold block" style={{ color: sel ? "var(--text-1)" : "var(--text-2)" }}>{role.label}</span>
                        <span className="text-[11px] mt-1 block" style={{ color: "var(--text-3)" }}>{role.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <Button size="xl" onClick={handleRoleContinue} disabled={!selectedRole} className="w-full active:scale-95 transition-all duration-200">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                <p className="text-center text-[13px] mt-4" style={{ color: "var(--text-3)" }}>
                  Registering for a company or institution?{" "}
                  <Link to="/join-as-institution" className="font-semibold" style={{ color: "var(--brand)" }}>Create an Institution Page →</Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: Profile Details ═══ */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide" style={glassCard}>
                <h2 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Your details</h2>
                <p className="text-center mb-7 text-[14px]" style={{ color: "var(--text-2)" }}>This helps others find and verify you.</p>
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="First name *" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputS} />
                    <Input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputS} />
                  </div>
                  <Input placeholder="Headline (80 chars)" value={headline} onChange={e => setHeadline(e.target.value.slice(0, 80))} maxLength={80} style={inputS} />

                  {renderRoleFields()}

                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={inputS} />
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
                      <option value="">State</option>
                      {allIndianStates.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <Button size="xl" onClick={handleSaveProfile} disabled={isSubmitting || !firstName} className="w-full mt-5 active:scale-95 transition-all duration-200">
                  {isSubmitting ? "Saving..." : "Complete profile"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={handleSkip} className="block mx-auto mt-3 text-[13px] cursor-pointer hover:underline" style={{ color: "var(--brand)" }}>Skip for now</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AuthThemeToggle />
    </div>
  );
};

export default SignUp;
