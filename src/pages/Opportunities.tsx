import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Zap, Clock, Users, Trophy, Shield, Plus, Briefcase, Handshake, Star, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterTabs = ["All", "Jobs", "Gigs", "Mentorship", "Collaboration", "Challenges", "Research"];

const opportunities = [
  { type: "funded", icon: Target, typeLabel: "FUNDED CHALLENGE", typeColor: "#F59E0B", title: "Affordable cold storage for Telangana mango and tomato farmers", description: "Post-harvest losses reach up to 35% for mangoes due to lack of cold storage within 30km.", postedBy: "TechMahindra CSR", verified: true, reward: "₹25,000", deadline: "May 15, 2025", daysLeft: "12 days left", solutions: 23, featured: true },
  { type: "job", icon: Briefcase, typeLabel: "JOB OPENING", typeColor: "#DC2626", title: "Backend Engineer — Zepto, Hyderabad", description: "Looking for a backend engineer with experience in distributed systems, Go/Python.", postedBy: "Zepto", verified: true, reward: "₹8-12 LPA", deadline: "Rolling", daysLeft: "Open", solutions: 0, featured: false },
  { type: "collab", icon: Handshake, typeLabel: "COLLABORATION", typeColor: "#5B4FFF", title: "Need React Native dev for healthcare app", description: "Building a patient management app for rural clinics. Equity + experience letter.", postedBy: "Dr. Riya Sharma", verified: true, reward: "Equity + letter", deadline: "3 months", daysLeft: "Ongoing", solutions: 0, featured: false },
  { type: "mentorship", icon: Star, typeLabel: "MENTORSHIP", typeColor: "#10B981", title: "Looking for mentor in IoT + AgriTech", description: "Final year student working on smart irrigation. Guidance over 3-6 months.", postedBy: "Arjun Kumar", verified: false, reward: "Online / Hyderabad", deadline: "3-6 months", daysLeft: "Open", solutions: 0, featured: false },
  { type: "gig", icon: Wrench, typeLabel: "GIG", typeColor: "#C2410C", title: "Electrical wiring for 3BHK apartment", description: "Complete rewiring of a 3BHK flat in Dwarka. MCB panel upgrade + earthing.", postedBy: "Verified homeowner", verified: true, reward: "₹8,000-12,000", deadline: "This week", daysLeft: "Urgent", solutions: 0, featured: false },
  { type: "funded", icon: Target, typeLabel: "FUNDED CHALLENGE", typeColor: "#F59E0B", title: "AI-based crop disease detection — mobile first", description: "Build a mobile app for crop disease identification from photos. Must work offline.", postedBy: "AgriTech India Foundation", verified: true, reward: "₹50,000", deadline: "July 10, 2025", daysLeft: "45 days left", solutions: 31, featured: false },
];

const ctaLabel: Record<string, string> = { funded: "Submit my work", job: "Apply via Tiikme", collab: "Express interest", mentorship: "Offer mentorship", gig: "I can do this" };

const Opportunities = () => {
  const [activeTab, setActiveTab] = useState("All");
  const filtered = activeTab === "All" ? opportunities : opportunities.filter(o => {
    const map: Record<string, string> = { Jobs: "job", Gigs: "gig", Mentorship: "mentorship", Collaboration: "collab", Challenges: "funded", Research: "research" };
    return o.type === map[activeTab];
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[20px] font-bold text-t1">Opportunities</h1>
        <Button size="sm" className="gap-1.5" onClick={() => toast.info("Opening opportunity form...")}><Plus className="w-4 h-4" /> Post opportunity</Button>
      </div>
      <p className="text-[13px] text-t2 mb-5">Jobs, gigs, mentorships, collaborations, and funded challenges.</p>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0 border"
            style={{ background: activeTab === tab ? "hsl(var(--brand))" : "hsl(var(--surface-2))", borderColor: activeTab === tab ? "hsl(var(--brand))" : "hsl(var(--border))", color: activeTab === tab ? "white" : "hsl(var(--text-2))" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((opp, i) => (
          <motion.div key={opp.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="t-card overflow-hidden" style={{ borderLeft: `4px solid ${opp.typeColor}` }}>
            {opp.type === "funded" && (
              <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: `linear-gradient(to right, ${opp.typeColor}, ${opp.typeColor}CC)` }}>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-black" /><span className="text-sm font-bold text-black">{opp.reward} reward</span></div>
                <span className="text-xs font-medium text-black">{opp.daysLeft}</span>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="micro-label" style={{ color: opp.typeColor }}>{opp.typeLabel}</span>
                {opp.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981] flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</span>}
              </div>
              <h3 className="text-base font-bold text-t1 mb-2">{opp.title}</h3>
              <p className="text-sm text-t2 mb-4">{opp.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="t-card p-3 text-xs"><span className="micro-label block mb-0.5">Posted by</span><span className="font-medium text-t1">{opp.postedBy}</span></div>
                <div className="t-card p-3 text-xs"><span className="micro-label block mb-0.5">Compensation</span><span className="font-bold text-[#F59E0B]">{opp.reward}</span></div>
                <div className="t-card p-3 text-xs"><span className="micro-label block mb-0.5">Deadline</span><span className="flex items-center gap-1 text-t1"><Clock className="w-3 h-3" /> {opp.deadline}</span></div>
                {opp.solutions > 0 && <div className="t-card p-3 text-xs"><span className="micro-label block mb-0.5">Solutions</span><span className="flex items-center gap-1 text-t1"><Users className="w-3 h-3" /> {opp.solutions}</span></div>}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => toast.success("Opening...")}>{ctaLabel[opp.type] || "View details"}</Button>
                {opp.type === "funded" && <Button variant="secondary" onClick={() => toast.success("Following updates")}>Follow updates</Button>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Opportunities;
