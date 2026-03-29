import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Zap, Clock, Users, Trophy, Shield, Plus, Briefcase, Handshake, Star, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterTabs = ["All", "Jobs", "Projects", "Mentorship", "Freelance / Gig", "Funded challenges", "Collaboration"];

const opportunities = [
  {
    type: "funded",
    icon: Target,
    typeLabel: "Funded Challenge",
    typeColor: "#FFB547",
    title: "Affordable cold storage for Telangana mango and tomato farmers",
    description: "Post-harvest losses reach up to 35% for mangoes due to lack of cold storage within 30km. We need a hardware/software solution that works on 2G connectivity and requires zero tech literacy.",
    postedBy: "TechMahindra CSR",
    verified: true,
    reward: "₹25,000",
    deadline: "May 15, 2025",
    daysLeft: "12 days left",
    solutions: 23,
    featured: true,
    topSolvers: [
      { name: "Priya M.", initials: "PM", color: "#FFB547", project: "ColdChain IoT" },
      { name: "Rahul K.", initials: "RK", color: "#4FC3F7", project: "FarmFrost" },
      { name: "Sunita D.", initials: "SD", color: "#FFA726", project: "Solar Cooler" },
    ],
  },
  {
    type: "job",
    icon: Briefcase,
    typeLabel: "Job Opening",
    typeColor: "#FF6B6B",
    title: "Backend Engineer — Zepto, Hyderabad",
    description: "Looking for a backend engineer with experience in distributed systems, Go/Python, and high-throughput APIs. Must be comfortable with on-call rotations.",
    postedBy: "Zepto",
    verified: true,
    reward: "₹8-12 LPA",
    deadline: "Rolling basis",
    daysLeft: "Open",
    solutions: 0,
    featured: false,
    topSolvers: [],
  },
  {
    type: "collab",
    icon: Handshake,
    typeLabel: "Collaboration",
    typeColor: "#7C6FFF",
    title: "Need React Native dev for healthcare app",
    description: "Building a patient management app for rural clinics. Need a React Native developer who can work part-time for 3 months. Equity + experience letter provided.",
    postedBy: "Dr. Riya Sharma",
    verified: true,
    reward: "Equity + experience letter",
    deadline: "3 months",
    daysLeft: "Ongoing",
    solutions: 0,
    featured: false,
    topSolvers: [],
  },
  {
    type: "mentorship",
    icon: Star,
    typeLabel: "Mentorship",
    typeColor: "#00FFB2",
    title: "Looking for mentor in IoT + AgriTech",
    description: "Final year student working on a smart irrigation project. Looking for an experienced professional in IoT or AgriTech for guidance over 3-6 months.",
    postedBy: "Arjun Kumar",
    verified: false,
    reward: "Online / Hyderabad",
    deadline: "3-6 months",
    daysLeft: "Open",
    solutions: 0,
    featured: false,
    topSolvers: [],
  },
  {
    type: "gig",
    icon: Wrench,
    typeLabel: "Gig",
    typeColor: "#FFA726",
    title: "Electrical wiring for 3BHK apartment",
    description: "Complete rewiring of a 3BHK flat in Dwarka, Delhi. Including MCB panel upgrade, earthing, and light fixture installation.",
    postedBy: "Verified homeowner",
    verified: true,
    reward: "₹8,000-12,000",
    deadline: "This week",
    daysLeft: "Urgent",
    solutions: 0,
    featured: false,
    topSolvers: [],
  },
  {
    type: "funded",
    icon: Target,
    typeLabel: "Funded Challenge",
    typeColor: "#FFB547",
    title: "AI-based crop disease detection — mobile first",
    description: "Build a mobile app that can identify crop diseases from photos taken by farmers. Must work offline and support Telugu and Hindi.",
    postedBy: "AgriTech India Foundation",
    verified: true,
    reward: "₹50,000",
    deadline: "July 10, 2025",
    daysLeft: "45 days left",
    solutions: 31,
    featured: false,
    topSolvers: [
      { name: "Arjun K.", initials: "AK", color: "#7C6FFF", project: "CropScan AI" },
    ],
  },
];

const ctaLabel: Record<string, string> = {
  funded: "Submit my work",
  job: "Apply via Tiikme",
  collab: "Express interest",
  mentorship: "Offer mentorship",
  gig: "I can do this",
};

const Opportunities = () => {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All" ? opportunities : opportunities.filter(o => {
    const map: Record<string, string> = { "Jobs": "job", "Projects": "collab", "Mentorship": "mentorship", "Freelance / Gig": "gig", "Funded challenges": "funded", "Collaboration": "collab" };
    return o.type === map[activeTab];
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Target className="w-7 h-7 text-electric" />
          <h1 className="text-[28px] font-bold">Opportunities</h1>
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => toast.info("Opening opportunity form...")}>
          <Plus className="w-4 h-4" /> Post an opportunity
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Jobs, projects, gigs, mentorships, and collaborations — all in one place.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0"
            style={{
              background: activeTab === tab ? "#7C6FFF" : "rgba(255,255,255,0.06)",
              border: `1px solid ${activeTab === tab ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: activeTab === tab ? "white" : "rgba(240,240,255,0.6)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filtered.map((opp, i) => (
          <motion.div
            key={opp.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl overflow-hidden"
            style={{ borderLeft: `4px solid ${opp.typeColor}` }}
          >
            {/* Reward strip for funded challenges */}
            {opp.type === "funded" && (
              <div className="bg-gradient-to-r from-[#FFB547] to-[#FFA726] px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#050510]" />
                  <span className="text-sm font-bold text-[#050510]">{opp.reward} reward</span>
                </div>
                <span className="text-xs font-medium text-[#050510]">{opp.postedBy} · {opp.daysLeft}</span>
              </div>
            )}

            <div className="p-5">
              {/* Type label */}
              <div className="flex items-center gap-2 mb-2">
                <opp.icon className="w-4 h-4" style={{ color: opp.typeColor }} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${opp.typeColor}22`, color: opp.typeColor }}>
                  {opp.typeLabel}
                </span>
                {opp.verified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,255,178,0.15)] text-neon flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <h3 className={`${opp.featured ? "text-[22px]" : "text-lg"} font-bold mb-2`}>{opp.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{opp.description}</p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Posted by</span>
                  <span className="font-medium">{opp.postedBy}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">{opp.type === "job" ? "Compensation" : opp.type === "gig" ? "Budget" : "Reward"}</span>
                  <span className="font-bold text-amber">{opp.reward}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">{opp.type === "job" ? "Timeline" : "Deadline"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {opp.deadline}</span>
                </div>
                {opp.solutions > 0 && (
                  <div className="glass-card rounded-xl p-3 text-xs">
                    <span className="micro-label text-muted-foreground/50 block mb-0.5">Solutions</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {opp.solutions} submitted</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="default" className={opp.featured ? "flex-1" : ""} onClick={() => toast.success("Opening submission...")}>
                  {ctaLabel[opp.type] || "View details"}
                </Button>
                {opp.type === "funded" && (
                  <Button variant="secondary" onClick={() => toast.success("Following updates")}>
                    Follow updates
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Solutions leaderboard for first funded challenge */}
      {opportunities[0].topSolvers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Top solutions for Cold Storage Challenge</h2>
          <div className="space-y-2">
            {opportunities[0].topSolvers.map((solver, i) => (
              <motion.div
                key={solver.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
                style={i === 0 ? { boxShadow: "0 0 20px rgba(0,255,178,0.15)", borderColor: "rgba(0,255,178,0.3)" } : {}}
              >
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: solver.color }}>
                  {solver.initials}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold">{solver.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{solver.project}</span>
                </div>
                {i === 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,255,178,0.2)] text-neon flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Top solution
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
