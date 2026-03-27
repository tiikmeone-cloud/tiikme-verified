import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full bg-electric/10 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full bg-neon/8 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-coral/5 blur-[140px] animate-pulse-glow" />
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
          className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          Get{" "}
          <span className="bg-gradient-to-r from-electric via-neon to-liquid-blue bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
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
          Your work. Verified. For everyone.
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
            <Button variant="hero" size="xl">
              Create profile
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg">
              See how it works
            </Button>
          </a>
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
                className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold"
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

        {/* Hero illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-2 overflow-hidden">
            <img
              src={heroIllustration}
              alt="Tiikme verified identity platform"
              className="w-full rounded-xl"
              width={1280}
              height={720}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
