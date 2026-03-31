import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-[rgba(124,111,255,0.15)] blur-[120px]" style={{ animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-[rgba(0,255,178,0.08)] blur-[100px]" style={{ animation: "float 10s ease-in-out infinite", animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[rgba(255,107,107,0.05)] blur-[140px]" style={{ animation: "glowPulse 6s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8"
        >
          <Shield className="w-4 h-4 text-neon" />
          <span className="text-sm text-muted-foreground">Verified Professional Identity for India</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-extrabold tracking-[-0.04em] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Get{" "}
          <span className="gradient-text-shimmer">
            Tiiked.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Your work. Verified. For everyone in India.
          <br />
          <span className="text-foreground/70">Students. Doctors. Plumbers. Engineers. Everyone.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link to="/signup">
            <Button size="xl">
              Create your profile
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/signin">
            <Button variant="ghost" size="lg">
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-3">
            {["#7C6FFF", "#00FFB2", "#FF6B6B", "#4FC3F7", "#FFB547"].map((color, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {["AR", "PK", "SM", "VR", "NK"][i]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon" />
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">12,400+</span> verified profiles
            </span>
          </div>
        </motion.div>

        {/* Feature preview card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#7C6FFF] flex items-center justify-center text-sm font-bold text-white">AK</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Arjun Kumar</span>
                  <Shield className="w-3.5 h-3.5 text-neon" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(124,111,255,0.2)] text-electric">Student</span>
                </div>
                <span className="text-xs text-muted-foreground">Delhi Technological University</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-[3px] border-l-[#7C6FFF]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-electric" />
                <span className="text-sm font-bold">TelemedicineRx</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,255,178,0.2)] text-neon">Active</span>
              </div>
              <p className="text-xs text-muted-foreground">Telemedicine platform for rural India with AI triage</p>
              <div className="flex gap-2 mt-2">
                {["React Native", "Supabase", "Python"].map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-muted-foreground">{t}</span>
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
