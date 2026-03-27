import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Zap, Clock, Users, Trophy, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterTabs = ["All", "Open", "Closing soon", "My submissions", "Completed"];

const challenges = [
  {
    title: "Affordable cold storage for Telangana mango and tomato farmers",
    description: "Post-harvest losses reach up to 35% for mangoes due to lack of cold storage within 30km. We need a hardware/software solution that works on 2G connectivity and requires zero tech literacy.",
    postedBy: "TechMahindra CSR",
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
    title: "Rural school attendance — offline first",
    description: "Build an attendance tracking system for schools with no internet. Must sync when connectivity returns and work on basic Android phones.",
    postedBy: "State Education Dept",
    reward: "State Grant + Mentorship",
    deadline: "June 5, 2025",
    daysLeft: "20 days left",
    solutions: 8,
    featured: false,
    topSolvers: [],
  },
  {
    title: "AI-based crop disease detection — mobile first",
    description: "Build a mobile app that can identify crop diseases from photos taken by farmers. Must work offline and support Telugu and Hindi.",
    postedBy: "AgriTech India Foundation",
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

const Challenges = () => {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-7 h-7 text-coral" />
          <h1 className="text-[28px] font-bold">Challenges</h1>
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => toast.info("Opening challenge form...")}>
          <Plus className="w-4 h-4" /> Post a challenge
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Real problems. Real rewards. Submit your work as the solution.
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
        {challenges.map((ch, i) => (
          <motion.div
            key={ch.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl overflow-hidden"
            style={ch.featured ? { borderTop: "4px solid #FFB547" } : {}}
          >
            {/* Reward strip */}
            <div className="bg-gradient-to-r from-[#FFB547] to-[#FFA726] px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#050510]" />
                <span className="text-sm font-bold text-[#050510]">{ch.reward} reward</span>
              </div>
              <span className="text-xs font-medium text-[#050510]">{ch.postedBy} · {ch.daysLeft}</span>
            </div>

            <div className="p-5">
              <h3 className={`${ch.featured ? "text-[22px]" : "text-lg"} font-bold mb-2`}>{ch.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{ch.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Posted by</span>
                  <span className="font-medium">{ch.postedBy}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Reward</span>
                  <span className="font-bold text-amber">{ch.reward}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Deadline</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ch.deadline}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Solutions</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ch.solutions} submitted</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Button variant="default" className={ch.featured ? "flex-1" : ""} onClick={() => toast.success("Opening submission form...")}>
                  Submit my project as solution
                </Button>
                <Button variant="secondary" onClick={() => toast.success("Following challenge updates")}>
                  Follow updates
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Solutions leaderboard */}
      {challenges[0].topSolvers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Top solutions for Cold Storage Challenge</h2>
          <div className="space-y-2">
            {challenges[0].topSolvers.map((solver, i) => (
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

export default Challenges;
