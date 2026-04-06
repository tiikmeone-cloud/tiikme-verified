import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoDark from "@/assets/tiikme-logo-dark.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] rounded-full opacity-100" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.18) 0%, rgba(61,90,241,0.06) 40%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
        <div className="absolute -bottom-[100px] -right-[100px] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(91,115,245,0.15) 0%, transparent 70%)", animation: "floatOrb2 15s ease-in-out infinite reverse", filter: "blur(60px)" }} />
        <div className="absolute top-1/2 right-[20%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", animation: "floatOrb3 18s ease-in-out infinite", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 max-w-[860px] mx-auto text-center" style={{ padding: "140px 24px 100px" }}>
        {/* Eyebrow pill */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 mb-8 rounded-full" style={{ background: "rgba(61,90,241,0.12)", border: "1px solid rgba(61,90,241,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-[#3D5AF1]" style={{ animation: "pulseDot 2s infinite" }} />
          <span className="text-[12px] font-semibold text-[rgba(238,240,255,0.8)]">50M+ Indian professionals have no verified identity</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-extrabold tracking-[-0.04em] mb-7 text-[#EEF0FF] leading-[1.06]"
          style={{ fontSize: "clamp(42px, 6vw, 72px)" }}>
          Your work, verified.{"\n"}
          <span style={{ background: "linear-gradient(135deg, #3D5AF1 0%, #7B8FF8 50%, #5B73F5 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200%", animation: "shimmer 4s ease-in-out infinite" }}>
            For everyone in India.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[18px] max-w-[560px] mx-auto mb-11 leading-[1.75]" style={{ color: "rgba(238,240,255,0.55)" }}>
          Students. Doctors. Police. Engineers. Plumbers. Teachers.
          Every working Indian deserves a verified professional identity.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <Link to="/signup">
            <Button size="xl" className="gap-2 font-['Silkscreen']">
              Get Tiiked — it's free
              <span className="text-white/80 text-lg">✓</span>
            </Button>
          </Link>
          <a href="#features">
            <Button size="xl" style={{ background: "rgba(238,240,255,0.06)", border: "1px solid rgba(238,240,255,0.12)", color: "#EEF0FF" }}>See how it works</Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[{ c: "#4F46E5", i: "AR" }, { c: "#10B981", i: "PK" }, { c: "#F59E0B", i: "SM" }, { c: "#0369A1", i: "VR" }, { c: "#C2410C", i: "NK" }].map((a, idx) => (
              <div key={idx} className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: a.c, boxShadow: "0 0 0 2px #04061A" }}>
                {a.i}
              </div>
            ))}
          </div>
          <span className="text-[13px]" style={{ color: "rgba(238,240,255,0.55)" }}>
            <span className="text-[#EEF0FF] font-semibold">12,400+</span> verified profiles across India
          </span>
        </motion.div>

        {/* Platform mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-[72px] max-w-[880px] mx-auto relative">
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(8,11,42,0.9)", border: "1px solid rgba(238,240,255,0.08)", boxShadow: "0 32px 64px rgba(4,6,26,0.8), 0 0 0 1px rgba(61,90,241,0.1)" }}>
            {/* Browser chrome */}
            <div className="h-10 flex items-center gap-2 px-4" style={{ background: "rgba(14,18,64,0.8)", borderBottom: "1px solid rgba(238,240,255,0.06)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              <div className="flex-1 mx-4 h-6 rounded-md" style={{ background: "rgba(238,240,255,0.06)" }} />
            </div>
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mock post 1 */}
              <div className="rounded-xl p-4" style={{ background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.06)", borderLeft: "3px solid #4F46E5" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#EEF0FF]">Arjun Kumar</span>
                      <Shield className="w-3 h-3 text-[#F59E0B]" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.2)", color: "#4F46E5" }}>Student</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(238,240,255,0.4)" }}>DTU · 2h ago</span>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(238,240,255,0.6)" }}>Telemedicine platform for rural India with AI triage — just shipped offline mode for areas with no connectivity.</p>
              </div>
              {/* Mock post 2 */}
              <div className="rounded-xl p-4" style={{ background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.06)", borderLeft: "3px solid #0E7490" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#0E7490] flex items-center justify-center text-[10px] font-bold text-white">MP</div>
                  <div>
                    <span className="text-[13px] font-bold text-[#EEF0FF]">Dr. Manoj Patil</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2" style={{ background: "rgba(14,116,144,0.2)", color: "#0E7490" }}>Doctor</span>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(238,240,255,0.6)" }}>3-day health camp in Gadchiroli — screened 450+ patients for diabetes.</p>
              </div>
            </div>
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 0%, #04061A 100%)" }} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
