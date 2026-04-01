import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, Plus, MessageSquare, CheckCircle, Calendar, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
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
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link to="/app/teams" className="flex items-center gap-1.5 text-[13px] font-medium text-t3 hover:text-t1 transition-colors active:scale-95">
        <ArrowLeft className="w-4 h-4" /> Back to Teams & Projects
      </Link>

      {/* Header Card — Liquid Glossy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 border transition-all duration-300
          bg-white/40 backdrop-blur-2xl border-white/60 shadow-sm
          dark:bg-[#050510]/30 dark:border-white/10 dark:backdrop-blur-2xl"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <h1 className="text-[24px] md:text-[28px] font-extrabold text-gray-900 dark:text-white">{mockProject.title}</h1>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                background: mockProject.status === "active" ? "rgba(16,185,129,0.12)" : "var(--brand-dim)",
                color: mockProject.status === "active" ? "#10B981" : "var(--brand)",
              }}>
                {mockProject.status === "active" ? "Active" : "Completed"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/50">{mockProject.domain}</span>
            </div>
            <p className="text-[14px] text-gray-600 dark:text-white/60 leading-relaxed">{mockProject.description}</p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" className="gap-1.5 active:scale-95 transition-all duration-200" onClick={() => toast.info("Opening invite...")}>
                <Users className="w-3.5 h-3.5" /> Invite Member
              </Button>
            </div>
          )}
        </div>

        {/* Team avatars */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-200/60 dark:border-white/8">
          <div className="flex -space-x-2">
            {mockProject.team.map((m, i) => (
              <Link key={i} to="/app/profile" className="relative group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white dark:border-[#050510] hover:scale-110 transition-transform" style={{ backgroundColor: m.color, zIndex: mockProject.team.length - i }}>
                  {m.initials}
                </div>
                {m.isHead && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/50 border border-white dark:border-[#050510]">
                    <Shield className="w-2.5 h-2.5" style={{ color: "#F59E0B" }} />
                  </div>
                )}
              </Link>
            ))}
          </div>
          <span className="text-[12px] text-gray-500 dark:text-white/40">{mockProject.team.length} members</span>
        </div>
      </motion.div>

      {/* Post Update — only for owner/team */}
      {isOwner && (
        <div className="rounded-2xl p-5 border border-border/30" style={{ background: "var(--surface)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-t3 mb-3">Post an update</p>
          <textarea
            value={updateText}
            onChange={e => setUpdateText(e.target.value)}
            placeholder="Share a milestone, progress update, or achievement..."
            rows={2}
            className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 focus:border-brand transition-all duration-200 mb-3"
          />
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 active:scale-95 transition-all duration-200" onClick={handlePostUpdate}>
              <Send className="w-3.5 h-3.5" /> Post Update
            </Button>
          </div>
        </div>
      )}

      {/* Living Timeline */}
      <div>
        <h2 className="text-[15px] font-bold text-t1 mb-4 px-1">Project Timeline</h2>
        <div className="space-y-0">
          {mockTimeline.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4"
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center pt-1.5">
                <div className="w-3 h-3 rounded-full shrink-0 border-2" style={{
                  borderColor: entry.isHead ? "#F59E0B" : "var(--brand)",
                  background: entry.isHead ? "#F59E0B" : "var(--brand)",
                }} />
                {i < mockTimeline.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border-2)" }} />}
              </div>

              {/* Content card */}
              <div className="flex-1 pb-6">
                <div className="rounded-xl p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
                  bg-white/40 backdrop-blur-xl border-white/60 shadow-sm
                  dark:bg-white/4 dark:border-white/8 dark:backdrop-blur-xl"
                >
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
                      <Link to="/app/profile" className="text-[13px] font-bold text-t1 hover:text-brand transition-colors">{entry.author}</Link>
                      <p className="text-[10px] text-t3">{entry.date} · {entry.time}</p>
                    </div>
                  </div>
                  <p className="text-[14px] text-t1 leading-relaxed">{entry.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectHub;
