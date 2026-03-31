import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, Copy, Shield, ExternalLink, Users, MessageSquare, Share2, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const work = {
  title: "TelemedicineRx",
  status: "Active",
  domain: ["HealthTech", "React Native", "Supabase"],
  description: "A telemedicine platform designed for rural India, enabling remote consultations with AI-powered triage. The app works on 2G connectivity and supports voice-based inputs in Hindi and Telugu. Built by a team of 4 students from Delhi Technological University.",
  links: [{ label: "GitHub", icon: Github, url: "#" }, { label: "Demo", icon: Globe, url: "#" }],
  metrics: [{ label: "Profile views", value: "847" }, { label: "Recruiter views", value: "6" }, { label: "Followers", value: "23" }, { label: "Discussions", value: "8" }],
  verifiedBy: { name: "Prof. Kumar", initials: "PK", designation: "HOD, CSE · DTU", verified: "gold" },
  team: [
    { name: "Arjun Kumar", initials: "AK", role: "Backend Lead", color: "#4F46E5" },
    { name: "Riya Sharma", initials: "RS", role: "Frontend", color: "#4F46E5" },
    { name: "Rahul K.", initials: "RK", role: "Mobile Dev", color: "#0369A1" },
    { name: "Priya M.", initials: "PM", role: "Design", color: "#92400E" },
  ],
  milestones: [
    { date: "Mar 2025", title: "AI triage module launched", desc: "Integrated symptom checker with 85% accuracy", active: true },
    { date: "Feb 2025", title: "Beta released", desc: "50 pilot users in Gadchiroli district", active: false },
    { date: "Jan 2025", title: "Project started", desc: "Team formed, tech stack decided", active: false },
  ],
};

const WorkDetail = () => {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");

  return (
    <div className="max-w-5xl mx-auto px-4 py-7">
      <div className="flex items-center gap-2 text-sm text-t2 mb-5">
        <button onClick={() => navigate(-1)} className="hover:text-t1 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <Link to="/app/profile" className="hover:text-brand transition-colors">arjunkumar</Link>
        <span>/</span>
        <span className="text-t1 font-bold">{work.title}</span>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Main */}
        <div className="flex-1 space-y-4">
          {/* Hero */}
          <div className="t-card p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981]">{work.status}</span>
              {work.domain.map(d => <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t2">{d}</span>)}
            </div>
            <h1 className="text-2xl font-extrabold text-t1 mb-3">{work.title}</h1>
            <p className="text-sm text-t2 leading-[1.75] mb-4">{work.description}</p>
            <div className="flex gap-2 mb-4">
              {work.links.map(l => (
                <Button key={l.label} variant="secondary" size="sm" className="gap-1.5"><l.icon className="w-3 h-3" /> {l.label}</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.success("Following this work")}>Follow work</Button>
              <Button variant="secondary" size="sm">Discuss</Button>
              <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar/telemedicinerx"); toast.success("Link copied"); }}><Copy className="w-3 h-3" /> Share</Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3">
            {work.metrics.map(m => (
              <div key={m.label} className="t-card p-4 text-center">
                <p className="text-xl font-bold text-t1">{m.value}</p>
                <p className="micro-label mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Chain */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">TIIKME CHAIN</p>
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
              <div className="text-center shrink-0">
                <p className="micro-label text-[#F59E0B] mb-1">VERIFIED BY</p>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-1" style={{ backgroundColor: "#92400E", border: "2.5px solid #F59E0B" }}>{work.verifiedBy.initials}</div>
                <p className="text-[11px] font-bold text-t1">{work.verifiedBy.name}</p>
                <p className="text-[10px] text-t3">{work.verifiedBy.designation}</p>
              </div>
              <div className="w-8 h-[3px] bg-border shrink-0" />
              {work.team.map(m => (
                <Link key={m.name} to="/app/profile" className="text-center shrink-0 hover:-translate-y-1 transition-transform">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white mx-auto mb-1" style={{ backgroundColor: m.color }}>{m.initials}</div>
                  <p className="text-[11px] font-bold text-t1">{m.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-t3">{m.role}</p>
                </Link>
              ))}
              <div className="w-8 h-[3px] bg-border shrink-0" />
              <button className="text-center shrink-0" onClick={() => toast.info("Opening collab request")}>
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-brand flex items-center justify-center text-brand mx-auto mb-1">+</div>
                <p className="text-[10px] text-t3">Open role</p>
              </button>
            </div>
            <p className="text-[11px] text-t3 mt-3">Click any name to see their contribution</p>
          </div>

          {/* Timeline */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">BUILD TIMELINE</p>
            <div className="space-y-4">
              {work.milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: m.active ? "hsl(var(--brand))" : "hsl(var(--text-3))" }} />
                  <div>
                    <p className="text-xs text-t3">{m.date}</p>
                    <p className="text-sm font-bold text-t1">{m.title}</p>
                    <p className="text-xs text-t2">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussions */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">DISCUSSIONS</p>
            <div className="flex items-center gap-2 mb-4">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ask a question about this work..." className="flex-1 h-9 bg-surface-2 border border-border rounded-2xl px-4 text-xs outline-none placeholder:text-t3 text-t1 focus:border-brand transition-colors" />
              <Button size="sm" onClick={() => { if (commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }}>Post</Button>
            </div>
            <p className="text-sm text-t3 text-center">No discussions yet. Be the first to ask!</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="t-card p-5">
            <h3 className="text-sm font-bold text-t1 mb-3">Interested in this person?</h3>
            <div className="space-y-2">
              <Button className="w-full" size="sm">Reach out</Button>
              <Button variant="secondary" className="w-full" size="sm">Save to pool</Button>
              <Button variant="secondary" className="w-full" size="sm">Post a challenge</Button>
            </div>
          </div>
          <div className="t-card p-5">
            <p className="micro-label mb-2">VERIFIED BY</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#92400E", border: "2px solid #F59E0B" }}>{work.verifiedBy.initials}</div>
              <div><p className="text-sm font-bold text-t1">{work.verifiedBy.name}</p><p className="text-xs text-t2">{work.verifiedBy.designation}</p></div>
            </div>
          </div>
          <div className="t-card p-5">
            <p className="micro-label mb-2">SIMILAR WORK</p>
            {["HealthBridge App", "MedConnect", "RuralCare AI"].map(w => (
              <div key={w} className="py-2 border-b border-border last:border-0">
                <p className="text-sm font-bold text-t1">{w}</p>
                <p className="text-xs text-t3">HealthTech · Active</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
