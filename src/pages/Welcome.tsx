import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Link2, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Welcome = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [linkText, setLinkText] = useState("");
  const fullLink = "tiikme.in/arjunkumar";

  // Typing effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLinkText(fullLink.slice(0, i + 1));
      i++;
      if (i >= fullLink.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Stop confetti after 2s
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleGoToFeed = () => {
    navigate("/app/feed");
    toast.success("Welcome to Tiikme, Arjun! Your profile is live at tiikme.in/arjunkumar");
  };

  const copyLink = () => {
    navigator.clipboard.writeText("https://tiikme.in/arjunkumar");
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="min-h-screen liquid-gradient-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ["#7C6FFF", "#00FFB2", "#FF6B6B", "#FFB547", "#4FC3F7"][i % 5],
                  animation: `confetti-fall ${1.5 + Math.random()}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-8 sm:p-12 max-w-2xl w-full text-center relative z-10"
      >
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-[rgba(0,255,178,0.15)] flex items-center justify-center mx-auto mb-6"
          style={{ animation: "glowPulse 2s ease-in-out infinite" }}
        >
          <Check className="w-10 h-10 text-neon" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl font-extrabold mb-2"
        >
          You're Tiiked, <span className="gradient-text-shimmer">Arjun</span>!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8"
        >
          Your verified profile is live. Start building your proof of work.
        </motion.p>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Zap, title: "Add a project", desc: "Every piece of work is your portfolio" },
            { icon: Link2, title: "Share your link", desc: "tiikme.in/arjunkumar" },
            { icon: Users, title: "Find your people", desc: "Connect with your field in Nexus" },
          ].map((card, i) => (
            <div key={i} className="glass-card rounded-xl p-5 text-left">
              <card.icon className="w-6 h-6 text-electric mb-3" />
              <h3 className="text-sm font-bold mb-1">{card.title}</h3>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Profile link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-full px-5 py-3 inline-flex items-center gap-3 mb-8"
        >
          <span className="text-sm font-mono text-electric">{linkText}<span className="animate-pulse">|</span></span>
          <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button size="lg" onClick={handleGoToFeed}>
            Take me to my feed
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate("/app/profile")}>
            Complete my profile
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
