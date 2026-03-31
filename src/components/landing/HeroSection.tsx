import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      <div className="relative z-10 max-w-[800px] mx-auto text-center">
        {/* Pre-headline pill */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-[rgba(91,79,255,0.15)] border border-[rgba(91,79,255,0.25)]">
          <Shield className="w-4 h-4 text-[#5B4FFF]" />
          <span className="text-[13px] text-[rgba(240,240,255,0.6)]">50M+ Indian professionals have no verified identity</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-extrabold tracking-[-0.04em] mb-6 text-[#F0F0FF]"
          style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>
          Your work, verified.{"\n"}
          <span className="text-[#5B4FFF]">For everyone in India.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[18px] text-[rgba(240,240,255,0.6)] max-w-[560px] mx-auto mb-10 leading-[1.7]">
          Students. Doctors. Police. Engineers. Plumbers. Teachers.
          Every working Indian deserves a verified professional identity.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link to="/signup">
            <Button size="xl">
              Get Tiiked — it's free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">See how it works</Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-3">
          <div className="flex -space-x-3">
            {["#4F46E5", "#10B981", "#F59E0B", "#0369A1", "#C2410C"].map((color, i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-[#050510] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
                {["AR", "PK", "SM", "VR", "NK"][i]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#10B981]" />
            <span className="text-[13px] text-[rgba(240,240,255,0.6)]">
              <span className="text-[#F0F0FF] font-semibold">12,400+</span> verified profiles across India
            </span>
          </div>
        </motion.div>

        {/* Platform mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 text-left bg-[#0D0D1A] border border-[rgba(255,255,255,0.08)]" style={{ borderRadius: 16 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#4F46E5] flex items-center justify-center text-sm font-bold text-white">AK</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#F0F0FF]">Arjun Kumar</span>
                  <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">Student</span>
                </div>
                <span className="text-[12px] text-[rgba(240,240,255,0.6)]">Delhi Technological University</span>
              </div>
            </div>
            <div className="rounded-xl p-4 border-l-[3px] border-l-[#5B4FFF] bg-[#13132A] border border-[rgba(255,255,255,0.08)]" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#5B4FFF]" />
                <span className="text-[13px] font-bold text-[#F0F0FF]">TelemedicineRx</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.2)] text-[#10B981]">Active</span>
              </div>
              <p className="text-[12px] text-[rgba(240,240,255,0.6)]">Telemedicine platform for rural India with AI triage</p>
              <div className="flex gap-2 mt-2">
                {["React Native", "Supabase", "Python"].map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[rgba(240,240,255,0.6)]">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
