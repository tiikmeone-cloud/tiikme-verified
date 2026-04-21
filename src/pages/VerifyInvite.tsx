import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AuthButton, AuthInput } from "@/components/layouts/AuthPrimitives";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,10,11,0.55)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl p-6 border border-white/10 bg-midnight/90 backdrop-blur-2xl"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-paper">
            {step === "phone" ? "Quick Login" : "Enter OTP"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-paper/60 hover:text-paper hover:bg-white/[0.06] cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <p className="text-[13px] text-paper/70">
              Enter your phone number to verify in under a minute.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-paper/55 z-10">
                +91
              </span>
              <AuthInput
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="pl-12"
              />
            </div>
            <AuthButton
              onClick={() => {
                if (phone.length === 10) { setStep("otp"); toast.success("OTP sent!"); }
                else { toast.error("Enter a valid 10-digit number"); }
              }}
            >
              Send OTP <ArrowRight className="w-4 h-4" />
            </AuthButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-paper/70">We sent a 6-digit code to +91 {phone}.</p>
            <AuthInput
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-[20px] font-mono tracking-[0.3em]"
            />
            <AuthButton
              onClick={() => {
                if (otp.length === 6) { toast.success("Verified! Redirecting to approval dashboard..."); }
                else { toast.error("Enter the full 6-digit OTP"); }
              }}
            >
              Verify & Continue <Shield className="w-4 h-4" />
            </AuthButton>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="block mx-auto text-[12px] text-paper/55 hover:text-paper cursor-pointer active:scale-95 transition-all duration-200"
            >
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

  return (
    <AuthLayout maxWidth={460}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Link to="/" className="text-[20px] font-extrabold text-paper mb-8 block">Tiikme</Link>

        {/* Avatar cluster */}
        <div className="flex items-center justify-center mb-6">
          {waitingUsers.map((u, i) => (
            <div
              key={u.initials}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[14px] font-bold text-white border-[3px] border-midnight"
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

        <h1 className="text-[22px] md:text-[26px] font-extrabold text-paper mb-2 leading-tight">
          {waitingUsers[0].name} and {waitingUsers.length - 1} others are waiting for your verification.
        </h1>

        <p className="text-[14px] text-paper/70 leading-relaxed mb-4">
          Tiikme is India's verified professional identity platform. Join as Faculty to approve their work.
        </p>

        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 bg-brand/15 border border-brand/35">
          <Shield className="w-4 h-4 text-brand" />
          <span className="text-[12px] font-semibold text-brand">Verify: {projectName}</span>
        </div>

        <AuthButton onClick={() => setOtpOpen(true)} className="h-14 text-[16px]">
          Verify their work (Takes 1 min) <ArrowRight className="w-5 h-5" />
        </AuthButton>

        <p className="text-[11px] text-paper/55 mt-4">No app download needed. Verify via phone OTP.</p>

        <div className="flex items-center justify-center gap-4 mt-6">
          {["Zero spam", "1-minute process", "Free forever"].map(t => (
            <span key={t} className="text-[11px] font-medium text-paper/55">{t}</span>
          ))}
        </div>
      </motion.div>

      <OTPModal open={otpOpen} onClose={() => setOtpOpen(false)} />
    </AuthLayout>
  );
};

export default VerifyInvite;
