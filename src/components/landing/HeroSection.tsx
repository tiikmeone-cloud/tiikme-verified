import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Orbs — use brand-dim for theme awareness */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] rounded-full opacity-100" style={{ background: "radial-gradient(circle, var(--brand-glow) 0%, var(--brand-dim) 40%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
        <div className="absolute -bottom-[100px] -right-[100px] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, var(--brand-dim) 0%, transparent 70%)", animation: "floatOrb2 15s ease-in-out infinite reverse", filter: "blur(60px)" }} />
        <div className="absolute top-1/2 right-[20%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", animation: "floatOrb3 18s ease-in-out infinite", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 max-w-[860px] mx-auto text-center" style={{ padding: "140px 24px 100px" }}>
        {/* Eyebrow pill */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 mb-8 rounded-full" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-glow)" }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--brand)", animation: "pulseDot 2s infinite" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>50M+ Indian professionals have no verified identity</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-extrabold tracking-[-0.04em] mb-7 leading-[1.06]"
          style={{ fontSize: "clamp(42px, 6vw, 72px)", color: "var(--text-1)" }}>
          Your work, verified.{"\n"}
          <span style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 50%, var(--brand-hover) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200%", animation: "shimmer 4s ease-in-out infinite" }}>
            For everyone in India.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[18px] max-w-[560px] mx-auto mb-11 leading-[1.75]" style={{ color: "var(--text-2)" }}>
          Students. Doctors. Police. Engineers. Plumbers. Teachers.
          Every working Indian deserves a verified professional identity.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <Link to="/signup">
            <Button size="xl" className="gap-2 font-['Silkscreen']">
              Get Tiiked — it's free
              <span className="opacity-80 text-lg">✓</span>
            </Button>
          </Link>
          <a href="#features">
            <Button size="xl" variant="outline" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-1)" }}>See how it works</Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[{ c: "#4F46E5", i: "AR" }, { c: "#10B981", i: "PK" }, { c: "#F59E0B", i: "SM" }, { c: "#0369A1", i: "VR" }, { c: "#C2410C", i: "NK" }].map((a, idx) => (
              <div key={idx} className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: a.c, boxShadow: "0 0 0 2px var(--bg)" }}>
                {a.i}
              </div>
            ))}
          </div>
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
            <span className="font-semibold" style={{ color: "var(--text-1)" }}>12,400+</span> verified profiles across India
          </span>
        </motion.div>

        {/* Platform mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-[72px] max-w-[880px] mx-auto relative">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            {/* Browser chrome */}
            <div className="h-10 flex items-center gap-2 px-4" style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              <div className="flex-1 mx-4 h-6 rounded-md" style={{ background: "var(--surface-3)" }} />
            </div>
            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: "3px solid #4F46E5" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Arjun Kumar</span>
                      <Shield className="w-3 h-3" style={{ color: "var(--tiik-gold)" }} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.15)", color: "#4F46E5" }}>Student</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>DTU · 2h ago</span>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>Telemedicine platform for rural India with AI triage — just shipped offline mode for areas with no connectivity.</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: "3px solid #0E7490" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#0E7490] flex items-center justify-center text-[10px] font-bold text-white">MP</div>
                  <div>
                    <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Dr. Manoj Patil</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2" style={{ background: "rgba(14,116,144,0.15)", color: "#0E7490" }}>Doctor</span>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>3-day health camp in Gadchiroli — screened 450+ patients for diabetes.</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 0%, var(--bg) 100%)" }} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
