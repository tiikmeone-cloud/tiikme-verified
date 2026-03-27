import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Shield, MapPin, Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tabs = ["Profile", "Notifications", "Privacy", "My Journey"] as const;

const journeyCards = [
  { id: "higher", icon: GraduationCap, title: "Higher studies", desc: "Going for masters, PhD, or another degree" },
  { id: "job", icon: Briefcase, title: "Got a job", desc: "Joining a company or organization" },
  { id: "startup", icon: Rocket, title: "Starting something", desc: "Building a startup or side project" },
  { id: "freelance", icon: Laptop, title: "Freelancing", desc: "Working independently on client projects" },
  { id: "break", icon: Coffee, title: "Taking a break", desc: "Recharging before the next chapter" },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Profile");
  const [status, setStatus] = useState("open");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Settings</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full glass-card transition-all ${
              activeTab === tab ? "border-electric text-electric" : "text-muted-foreground"
            }`}
            style={activeTab === tab ? { borderColor: "#7C6FFF", boxShadow: "0 0 10px rgba(124,111,255,0.2)" } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "Profile" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Professional Status</h3>
            <div className="space-y-3">
              {[
                { id: "open", label: "Open to work", color: "#00FFB2", desc: "Recruiters can see you're available" },
                { id: "working", label: "Currently working", color: "#4FC3F7", desc: "Show your current company" },
                { id: "not", label: "Not looking", color: "rgba(240,240,255,0.35)", desc: "Status hidden from recruiters" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setStatus(opt.id); toast.success(`Status updated to "${opt.label}"`); }}
                  className="w-full glass-card rounded-xl p-4 flex items-center gap-4 text-left transition-all"
                  style={status === opt.id ? { borderColor: opt.color, boxShadow: `0 0 15px ${opt.color}33` } : {}}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                  <div className="flex-1">
                    <span className="text-sm font-bold" style={status === opt.id ? { color: opt.color } : {}}>{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {status === opt.id && <Check className="w-4 h-4" style={{ color: opt.color }} />}
                </button>
              ))}
            </div>
            {status === "working" && (
              <div className="mt-4">
                <Input placeholder="Company name" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                <p className="text-xs text-muted-foreground mt-2">Verified via work email domain OTP</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === "Notifications" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            {[
              "New strand requests",
              "Challenge updates",
              "Recruiter views",
              "Comments on your posts",
              "Project team activity",
            ].map(item => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <button className="w-10 h-6 rounded-full bg-electric/20 flex items-center px-1 transition-colors" onClick={() => toast.success("Preference saved")}>
                  <div className="w-4 h-4 rounded-full bg-electric transition-transform translate-x-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Privacy */}
      {activeTab === "Privacy" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-sm font-bold mb-2">Profile visibility</p>
              <select className="w-full h-10 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                <option className="bg-background">Public — anyone can view</option>
                <option className="bg-background">Strands only — connections only</option>
                <option className="bg-background">Hidden — only you</option>
              </select>
            </div>
            <div>
              <p className="text-sm font-bold mb-2">Activity Score visibility</p>
              <select className="w-full h-10 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                <option className="bg-background">Visible to everyone</option>
                <option className="bg-background">Visible to strands only</option>
                <option className="bg-background">Hidden</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* My Journey */}
      {activeTab === "My Journey" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card rounded-2xl p-5" style={{ borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.2)" }}>
            <h3 className="text-lg font-bold mb-1">Your chapter is changing. What's next?</h3>
            <p className="text-sm text-muted-foreground">Your project history is always preserved, no matter what path you choose.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {journeyCards.map(card => (
              <button
                key={card.id}
                onClick={() => setJourneyChoice(card.id)}
                className="glass-card rounded-2xl p-5 text-left transition-all relative"
                style={journeyChoice === card.id ? { borderColor: "#7C6FFF", boxShadow: "0 0 20px rgba(124,111,255,0.3)" } : {}}
              >
                {journeyChoice === card.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-electric flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <card.icon className="w-7 h-7 text-electric mb-3" />
                <h4 className="text-sm font-bold mb-1">{card.title}</h4>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </button>
            ))}
          </div>

          {journeyChoice && (
            <Button variant="hero" className="w-full" onClick={() => toast.success("Journey updated! Your role badge has been updated.")}>
              Update my journey
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
