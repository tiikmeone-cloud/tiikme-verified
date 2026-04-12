import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import ThemeLogo from "@/components/ThemeLogo";
import StepEmail from "@/components/institution-onboarding/StepEmail";
import StepOTP from "@/components/institution-onboarding/StepOTP";
import StepOrgType from "@/components/institution-onboarding/StepOrgType";
import StepRepresentative from "@/components/institution-onboarding/StepRepresentative";
import StepPageSetup from "@/components/institution-onboarding/StepPageSetup";

const STEPS = ["Account", "Verify", "Organisation", "Your Role", "Page Setup"];

const JoinAsInstitution = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [repRole, setRepRole] = useState("");
  const [repDesignation, setRepDesignation] = useState("");
  const [repDepartment, setRepDepartment] = useState("");

  // Force light mode
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.classList.add("light");
    html.setAttribute("data-theme", "light");
    document.body.style.backgroundColor = "#FFF8F2";
    document.body.style.color = "#1A1A1A";
    return () => {
      html.classList.remove("light");
      html.removeAttribute("data-theme");
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, []);

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF8F2" }}>
      <div className="min-h-screen flex">
        {/* Left brand panel — desktop only */}
        <div className="hidden lg:flex flex-col justify-center w-[420px] shrink-0 px-12 relative overflow-hidden"
          style={{ background: "#04061A" }}>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(232,88,10,0.15) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 mb-12">
              <ThemeLogo className="h-10 w-auto" />
            </Link>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#EEF0FF", marginBottom: 32, lineHeight: 1.2 }}>
              Your institution<br />on Tiikme
            </h1>
            <div className="space-y-4">
              {[
                "Verified presence — trusted by professionals across India",
                "Post opportunities seen by role-matched candidates",
                "6 months free for founding institutions",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                  }}>
                    <Check style={{ width: 12, height: 12, color: "#10B981" }} />
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(238,240,255,0.7)" }}>{t}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(238,240,255,0.1)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#EEF0FF", marginBottom: 16 }}>Simple pricing</h3>
              <div className="space-y-3">
                <div style={{ borderRadius: 12, padding: 16, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>Free — First 6 months</p>
                  <p style={{ fontSize: 12, color: "rgba(238,240,255,0.5)", marginTop: 4 }}>Full access. No credit card needed.</p>
                </div>
                <div style={{ borderRadius: 12, padding: 16, background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.1)" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#EEF0FF" }}>From month 7</p>
                  <p style={{ fontSize: 12, color: "rgba(238,240,255,0.5)", marginTop: 4 }}>50% off for months 7-9. Full from month 10.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ background: "#FFF8F2" }}>
          {/* Mobile logo */}
          <div className="w-full max-w-[480px] mb-4">
            <div className="flex items-center justify-between mb-2 lg:hidden">
              <Link to="/"><ThemeLogo className="h-8 w-auto" /></Link>
            </div>
            {step < 5 && (
              <button type="button" onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium mb-6"
                style={{ color: "#6B6B6B", background: "none", border: "none", cursor: "pointer" }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>
            )}
          </div>

          {/* Progress bar */}
          {step < 5 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 32, width: "100%", maxWidth: 320 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 4,
                  background: i <= step ? "#E8580A" : "#E5E7EB",
                }} />
              ))}
            </div>
          )}

          <motion.div className="w-full max-w-[480px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <StepEmail onNext={({ email: e, password: p }) => {
                    setEmail(e); setPassword(p); setStep(1);
                  }} />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <StepOTP email={email} password={password} onNext={() => setStep(2)} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <StepOrgType onNext={({ orgType: t, orgName: n, website: w, city: c, state: s }) => {
                    setOrgType(t); setOrgName(n); setWebsite(w); setCity(c); setState(s); setStep(3);
                  }} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <StepRepresentative orgName={orgName} orgType={orgType}
                    onNext={({ role, designation, department }) => {
                      setRepRole(role); setRepDesignation(designation); setRepDepartment(department); setStep(4);
                    }} />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <StepPageSetup
                    orgName={orgName} orgType={orgType} city={city} state={state}
                    website={website} repRole={repRole} repDesignation={repDesignation}
                    repDepartment={repDepartment}
                    onComplete={() => setStep(5)}
                  />
                </motion.div>
              )}

              {/* Step 5: Success */}
              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div style={{
                    background: "#FFFFFF", borderRadius: 12, padding: 40,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px",
                    }}>
                      <Check style={{ width: 32, height: 32, color: "#16A34A" }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", marginBottom: 8 }}>
                      Your institution page is live!
                    </h2>
                    <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 24 }}>
                      Start building your presence on Tiikme.
                    </p>
                    <div style={{ textAlign: "left", marginBottom: 24 }}>
                      {[
                        "Full institution page with all customization",
                        "Unlimited member listing",
                        "Post opportunities (jobs, internships, events)",
                        "Workspace with channels",
                        "Analytics (who tracked you, top viewer roles)",
                        "Priority in search results",
                      ].map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                          <Check style={{ width: 16, height: 16, color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: 13, color: "#374151" }}>{t}</p>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" onClick={() => navigate("/app/profile", { replace: true })}
                      style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
                      Go to my profile <ArrowRight style={{ width: 16, height: 16, marginLeft: 4 }} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 32 }}>
            Tiikme is a product of Veenavarse Private Limited
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinAsInstitution;