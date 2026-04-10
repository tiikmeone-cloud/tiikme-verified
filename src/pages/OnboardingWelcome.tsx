import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function OnboardingWelcome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "there";
  const role = profile?.role || "student";
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
  }, []);

  const roleLabels: Record<string, string> = {
    student: "Student", professional: "Professional", doctor: "Doctor / Health",
    government: "Government", faculty: "Faculty", builder: "Builder / Founder",
    hr: "HR / Recruiter", skilled_trade: "Skilled Trade", aspirant: "Aspirant",
  };

  const cards = [
    { icon: "📋", title: "Complete your profile", text: "Add bio, work history and photo", action: () => navigate("/app/profile"), cta: "Go →" },
    { icon: "✓", title: "Get Tiiked", text: "Verify with your institution or employer", action: () => {}, cta: "Learn how →" },
    { icon: "🔍", title: "Explore people", text: "Find professionals in your field", action: () => navigate("/app/explore"), cta: "Explore →" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#04061A" }}>
      {/* Logo */}
      <div className="flex items-center gap-1.5 mb-8">
        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 16, color: "#fff" }}>tiikme</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#E8580A" />
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Animated checkmark */}
      {showCheck && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "#E8580A" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}

      {/* Title */}
      <h1 className="text-center mb-2" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 20, color: "#E8580A" }}>
        You're Tiiked. ✓
      </h1>
      <p className="text-[22px] font-extrabold text-center mb-3" style={{ color: "#fff" }}>
        Welcome, {firstName}!
      </p>

      {/* Role badge */}
      <div className="px-4 py-1.5 rounded-full mb-8" style={{ border: "1.5px solid rgba(255,255,255,0.3)", color: "#E8580A", fontSize: 13, fontWeight: 700 }}>
        {roleLabels[role] || role}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-[700px] mb-8">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={c.action}
            className="rounded-2xl p-5 text-left cursor-pointer transition-all hover:border-orange-500 group"
            style={{ border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" }}
          >
            <span className="text-[24px] block mb-3">{c.icon}</span>
            <p className="text-[14px] font-bold mb-1" style={{ color: "#fff" }}>{c.title}</p>
            <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{c.text}</p>
            <span className="text-[13px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#E8580A" }}>
              {c.cta} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </div>

      {/* Go to feed */}
      <button
        onClick={() => navigate("/app/feed")}
        className="h-12 px-8 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 flex items-center gap-2"
        style={{ background: "#E8580A" }}
      >
        Go to my feed <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
