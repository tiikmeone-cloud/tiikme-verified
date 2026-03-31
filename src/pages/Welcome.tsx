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

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { setLinkText(fullLink.slice(0, i + 1)); i++; if (i >= fullLink.length) clearInterval(iv); }, 60);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 2500); return () => clearTimeout(t); }, []);

  const copyLink = () => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied!"); };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#04061A" }}>
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.12) 0%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="absolute rounded-sm" style={{
                left: `${Math.random() * 100}%`,
                width: `${4 + Math.random() * 4}px`,
                height: `${4 + Math.random() * 4}px`,
                backgroundColor: ["#3D5AF1", "#10B981", "#F59E0B", "#6B21A8", "#E8580A"][i % 5],
                animation: `confetti-fall ${1.5 + Math.random()}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-[500px] w-full text-center relative z-10">
        {/* Check */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(16,185,129,0.1)", border: "2px solid #10B981", animation: "tiikPulse 2.5s infinite" }}>
          <Check className="w-8 h-8 text-[#10B981]" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-[40px] font-extrabold mb-2 text-[#EEF0FF]">
          You're <span style={{ background: "linear-gradient(135deg, #3D5AF1, #5B73F5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tiiked</span>, Arjun!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[16px] mb-8" style={{ color: "rgba(238,240,255,0.6)" }}>
          Your professional identity is live.
        </motion.p>

        {/* Profile link card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-3 rounded-[14px] px-[18px] py-3.5 mb-8"
          style={{ background: "rgba(238,240,255,0.05)", border: "1px solid rgba(238,240,255,0.1)" }}>
          <Link2 className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <span className="text-[14px] font-mono text-[#EEF0FF]">{linkText}<span className="animate-pulse">|</span></span>
          <button onClick={copyLink} className="p-1.5 rounded-lg transition-colors"><Copy className="w-4 h-4" style={{ color: "rgba(238,240,255,0.4)" }} /></button>
        </motion.div>

        {/* Feature cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Zap, title: "Add a project", desc: "Your work is your portfolio" },
            { icon: Link2, title: "Share your link", desc: "tiikme.in/arjunkumar" },
            { icon: Users, title: "Find your people", desc: "Connect in Explore" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={{ background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                <c.icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="text-[13px] font-bold text-[#EEF0FF] mb-0.5">{c.title}</h3>
              <p className="text-[11px]" style={{ color: "rgba(238,240,255,0.5)" }}>{c.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Button size="xl" className="w-full" onClick={() => { navigate("/app/feed"); toast.success("Welcome to Tiikme!"); }}>
            Take me to my feed <Zap className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
