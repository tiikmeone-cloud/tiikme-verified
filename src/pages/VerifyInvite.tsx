import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const waitingUsers = [
  { initials: "AK", name: "Arjun Kumar", color: "#4F46E5" },
  { initials: "PM", name: "Priya Mehta", color: "#0369A1" },
  { initials: "RS", name: "Rahul Singh", color: "#7C3AED" },
  { initials: "NS", name: "Neha Sharma", color: "#C2410C" },
];

const OTPModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl p-6 bg-white/70 dark:bg-[#111118]/80 backdrop-blur-2xl border border-white/30 dark:border-white/10"
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-t1">{step === "phone" ? "Quick Login" : "Enter OTP"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 cursor-pointer active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <p className="text-[13px] text-t2">Enter your phone number to verify in under a minute.</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-t3">+91</span>
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-12 pl-12 bg-surface-2 border-border/30 text-t1"
              />
            </div>
            <Button
              className="w-full gap-2 active:scale-95 transition-all duration-200"
              onClick={() => { if (phone.length === 10) { setStep("otp"); toast.success("OTP sent!"); } else { toast.error("Enter a valid 10-digit number"); } }}
            >
              Send OTP <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-t2">We sent a 6-digit code to +91 {phone}.</p>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-12 text-center text-[20px] font-mono tracking-[0.3em] bg-surface-2 border-border/30 text-t1"
            />
            <Button
              className="w-full gap-2 active:scale-95 transition-all duration-200"
              onClick={() => { if (otp.length === 6) { toast.success("Verified! Redirecting to approval dashboard..."); } else { toast.error("Enter the full 6-digit OTP"); } }}
            >
              Verify & Continue <Shield className="w-4 h-4" />
            </Button>
            <button onClick={() => { setStep("phone"); setOtp(""); }} className="block mx-auto text-[12px] text-t3 hover:text-t1 cursor-pointer active:scale-95 transition-all duration-200">
              Change number
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const VerifyInvite = () => {
  const [otpOpen, setOtpOpen] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const projectName = params.get("project") || "TelemedicineRx";
  const fromUser = params.get("from") || "arjunkumar";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Subtle background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Frosted glass card */}
        <div className="rounded-3xl p-8 text-center bg-white/60 dark:bg-[#111118]/60 backdrop-blur-2xl border border-white/30 dark:border-white/10" style={{ boxShadow: "var(--card-shadow)" }}>
          {/* Tiikme branding */}
          <Link to="/" className="text-[20px] font-extrabold text-t1 mb-8 block">Tiikme</Link>

          {/* Avatar cluster */}
          <div className="flex items-center justify-center mb-6">
            {waitingUsers.map((u, i) => (
              <div
                key={u.initials}
                className="w-14 h-14 rounded-full flex items-center justify-center text-[14px] font-bold text-white border-[3px] border-white dark:border-[#111118]"
                style={{
                  backgroundColor: u.color,
                  marginLeft: i > 0 ? "-12px" : "0",
                  zIndex: waitingUsers.length - i,
                }}
              >
                {u.initials}
              </div>
            ))}
          </div>

          {/* Headline */}
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-t1 mb-2 leading-tight">
            {waitingUsers[0].name} and {waitingUsers.length - 1} others are waiting for your verification.
          </h1>

          {/* Subtext */}
          <p className="text-[14px] text-t2 leading-relaxed mb-2">
            Tiikme is India's verified professional identity platform. Join as Faculty to approve their work.
          </p>

          {/* Project context */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>
            <Shield className="w-4 h-4" style={{ color: "var(--brand)" }} />
            <span className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>
              Verify: {projectName}
            </span>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full gap-2 h-14 text-[16px] font-bold active:scale-95 transition-all duration-200 rounded-2xl"
            onClick={() => setOtpOpen(true)}
          >
            Verify their work (Takes 1 min) <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-[11px] text-t3 mt-4">
            No app download needed. Verify via phone OTP.
          </p>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {["Zero spam", "1-minute process", "Free forever"].map(t => (
            <span key={t} className="text-[11px] font-medium text-t3">{t}</span>
          ))}
        </div>
      </motion.div>

      <OTPModal open={otpOpen} onClose={() => setOtpOpen(false)} />
    </div>
  );
};

export default VerifyInvite;
