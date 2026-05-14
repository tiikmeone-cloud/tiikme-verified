import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Link2, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);
  const [linkText, setLinkText] = useState("");
  const [exiting, setExiting] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const username = profile?.username || user?.id?.substring(0, 8) || "you";
  const fullLink = `tiikme.in/${username}`;

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { setLinkText(fullLink.slice(0, i + 1)); i++; if (i >= fullLink.length) clearInterval(iv); }, 60);
    return () => clearInterval(iv);
  }, [fullLink]);

  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 2500); return () => clearTimeout(t); }, []);

  const copyLink = () => { navigator.clipboard.writeText(`https://${fullLink}`); toast.success("Link copied!"); };

  const goToFeed = useCallback(() => {
    setExiting(true);
    setTimeout(() => { navigate("/app/feed"); toast.success("Welcome to Tiikme!"); }, 500);
  }, [navigate]);

  return (
    <>
    <PageSEO title="Welcome to Tiikme" description="You're in. Start building your verified professional identity on Tiikme." noIndex />
    <motion.div
      animate={exiting ? { scale: 0.96, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
      </div>

      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={i % 2 === 0 ? "absolute rounded-sm" : "absolute rounded-full"} style={{
                left: `${Math.random() * 100}%`,
                width: `${4 + Math.random() * 4}px`,
                height: `${4 + Math.random() * 4}px`,
                backgroundColor: ["#3D5AF1", "#10B981", "#F59E0B", "#6B21A8", "#FF5A1F"][i % 5],
                animation: `confetti-fall ${1.5 + Math.random()}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[500px] w-full text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(16,185,129,0.1)", border: "2px solid #10B981", animation: "tiikPulse 2.5s infinite" }}>
          <Check className="w-8 h-8 text-[#10B981]" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-[36px] sm:text-[40px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>
          You're <span style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tiiked</span>, {firstName}!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[15px] mb-8" style={{ color: "var(--text-2)" }}>
          Your professional identity is live.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-3 rounded-2xl px-5 py-3.5 mb-8"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Link2 className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <span className="text-[14px] font-mono" style={{ color: "var(--text-1)" }}>{linkText}<span className="animate-pulse">|</span></span>
          <button type="button" onClick={copyLink} className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}><Copy className="w-4 h-4" /></button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Zap, title: "Add a project", desc: "Your work is your portfolio" },
            { icon: Link2, title: "Share your link", desc: fullLink },
            { icon: Users, title: "Find your people", desc: "Connect in Explore" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                <c.icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="text-[12px] font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{c.title}</h3>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{c.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Button size="xl" className="w-full active:scale-95 transition-all duration-200" onClick={goToFeed}>
            Take me to my feed <Zap className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
};

export default Welcome;
