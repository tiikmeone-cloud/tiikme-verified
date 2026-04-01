import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, Send, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CURRENT_USER = "arjunkumar";

const mockProject = {
  title: "TelemedicineRx",
  status: "active" as const,
  description: "Telemedicine platform for rural India with AI triage and offline-first sync",
  domain: "HealthTech",
  team: [
    { name: "Arjun Kumar", initials: "AK", role: "Lead Developer", color: "#4F46E5", isHead: false },
    { name: "Prof. Sharma", initials: "PS", role: "Project Head", color: "#92400E", isHead: true },
    { name: "Riya Sharma", initials: "RS", role: "UI/UX Designer", color: "#0369A1", isHead: false },
    { name: "Rahul Mehra", initials: "RM", role: "Backend Engineer", color: "#166534", isHead: false },
  ],
  owner: "arjunkumar",
};

const mockTimeline = [
  { id: "1", type: "milestone" as const, author: "Prof. Sharma", initials: "PS", color: "#92400E", isHead: true, content: "Approved Milestone 1: Architecture setup and database schema finalized.", time: "2 days ago", date: "Mar 28, 2026" },
  { id: "2", type: "update" as const, author: "Arjun Kumar", initials: "AK", color: "#4F46E5", isHead: false, content: "Deployed v0.3 with offline-first sync. Initial testing shows 94% cache hit rate on rural 2G networks.", time: "5 days ago", date: "Mar 25, 2026" },
  { id: "3", type: "update" as const, author: "Riya Sharma", initials: "RS", color: "#0369A1", isHead: false, content: "Completed the patient onboarding flow with vernacular language support. Tested with 20 users in Gadchiroli.", time: "1 week ago", date: "Mar 22, 2026" },
  { id: "4", type: "milestone" as const, author: "Prof. Sharma", initials: "PS", color: "#92400E", isHead: true, content: "Project kickoff. Problem statement approved: AI-powered triage for rural healthcare.", time: "2 weeks ago", date: "Mar 15, 2026" },
];

const isOwner = CURRENT_USER === mockProject.owner;

const ProjectHub = () => {
  const [updateText, setUpdateText] = useState("");

  const handlePostUpdate = () => {
    if (!updateText.trim()) return;
    toast.success("Update posted to project timeline");
    setUpdateText("");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <Link to="/app/teams" className="flex items-center gap-1.5 text-[13px] font-medium transition-colors active:scale-95 hover:opacity-80" style={{ color: "var(--text-3)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Teams & Projects
      </Link>

      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hero Box — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-liquid rounded-2xl md:rounded-3xl overflow-hidden relative min-h-[260px]"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(61,90,241,0.15) 0%, rgba(16,185,129,0.08) 50%, transparent 100%)"
          }} />
          <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-3">
                <h1 className="text-[24px] md:text-[28px] font-extrabold" style={{ color: "var(--text-1)" }}>{mockProject.title}</h1>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                  background: "rgba(16,185,129,0.12)", color: "#10B981",
                }}>Active</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{mockProject.domain}</span>
              </div>
              <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: "var(--text-2)" }}>{mockProject.description}</p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button className="active:scale-95 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Live
              </Button>
              {isOwner && (
                <Button variant="secondary" className="active:scale-95 gap-1.5" onClick={() => toast.info("Opening invite...")}>
                  <Users className="w-3.5 h-3.5" /> Invite Member
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tiikme Chain Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-liquid rounded-2xl md:rounded-3xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <div>
              <p className="text-[12px] font-bold" style={{ color: "#F59E0B" }}>Verified by</p>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Prof. Sharma</p>
            </div>
          </div>

          {/* Vertical chain */}
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "var(--border-2)" }} />
            {mockProject.team.map((m, i) => (
              <Link key={i} to="/app/profile" className="relative flex items-center gap-3 py-2.5 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 group-hover:scale-110 transition-transform relative z-10" style={{ backgroundColor: m.color }}>
                  {m.initials}
                </div>
                {m.isHead && (
                  <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center z-20" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <Shield className="w-3 h-3" style={{ color: "#F59E0B" }} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-bold group-hover:underline" style={{ color: "var(--text-1)" }}>{m.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{m.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Post Update */}
      {isOwner && (
        <div className="glass-liquid rounded-2xl md:rounded-3xl p-5">
          <p className="micro-label mb-3">POST AN UPDATE</p>
          <textarea
            value={updateText}
            onChange={e => setUpdateText(e.target.value)}
            placeholder="Share a milestone, progress update, or achievement..."
            rows={2}
            className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none transition-all duration-200 mb-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          />
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 active:scale-95" onClick={handlePostUpdate}>
              <Send className="w-3.5 h-3.5" /> Post Update
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <section>
        <h2 className="text-[15px] font-bold mb-4 px-1" style={{ color: "var(--text-1)" }}>Project Timeline</h2>
        <div className="space-y-0">
          {mockTimeline.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4"
            >
              {/* Dot + line */}
              <div className="flex flex-col items-center pt-1.5">
                <div className="w-3 h-3 rounded-full shrink-0 border-2" style={{
                  borderColor: entry.isHead ? "#F59E0B" : "var(--brand)",
                  background: entry.isHead ? "#F59E0B" : "var(--brand)",
                }} />
                {i < mockTimeline.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border-2)" }} />}
              </div>

              {/* Content */}
              <article className="flex-1 pb-6">
                <div className="glass-liquid glass-liquid-hover rounded-xl p-4">
                  {entry.isHead && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                      <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>Official Milestone</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-2">
                    <Link to="/app/profile">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: entry.color }}>{entry.initials}</div>
                    </Link>
                    <div>
                      <Link to="/app/profile" className="text-[13px] font-bold hover:underline transition-colors" style={{ color: "var(--text-1)" }}>{entry.author}</Link>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{entry.date} · {entry.time}</p>
                    </div>
                  </div>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-1)" }}>{entry.content}</p>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ProjectHub;
