import { motion } from "framer-motion";
import { AlertCircle, Zap, Clock, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const challenges = [
  {
    title: "Rural Water Monitoring IoT System",
    description: "Design a low-cost IoT system to monitor water quality in rural wells across Telangana. Must work with intermittent power and connectivity.",
    postedBy: "Telangana Water Board",
    reward: "₹25,000",
    deadline: "12 days left",
    solutions: 8,
    topSolver: "Priya M.",
  },
  {
    title: "AI-based Crop Disease Detection",
    description: "Build a mobile app that can identify crop diseases from photos taken by farmers. Must work offline and support Telugu and Hindi.",
    postedBy: "AgriTech India Foundation",
    reward: "₹50,000",
    deadline: "20 days left",
    solutions: 14,
    topSolver: "Rahul K.",
  },
  {
    title: "Smart Traffic Management Dashboard",
    description: "Create a real-time dashboard for traffic flow optimization using existing CCTV feeds. Focus on reducing congestion at 5 major junctions.",
    postedBy: "Kavita Rao, HR",
    reward: "₹15,000",
    deadline: "30 days left",
    solutions: 3,
    topSolver: null,
  },
];

const Challenges = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <AlertCircle className="w-7 h-7 text-coral" />
        <h1 className="text-[28px] font-bold">Challenges</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Real problems. Real rewards. Submit your work as the solution.
      </p>

      <div className="space-y-5">
        {challenges.map((ch, i) => (
          <motion.div
            key={ch.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            {/* Reward strip */}
            <div className="bg-gradient-to-r from-[#FFB547] to-[#FFA726] px-5 py-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-background" />
              <span className="text-sm font-bold text-background">Reward: {ch.reward}</span>
            </div>

            <div className="p-5">
              <h3 className="text-xl font-bold mb-2">{ch.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{ch.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Posted by</span>
                  <span className="font-medium">{ch.postedBy}</span>
                </div>
                <div className="text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Reward</span>
                  <span className="font-bold text-amber">{ch.reward}</span>
                </div>
                <div className="text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Deadline</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ch.deadline}</span>
                </div>
                <div className="text-xs">
                  <span className="micro-label text-muted-foreground/50 block mb-0.5">Solutions</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ch.solutions} submitted</span>
                </div>
              </div>

              {ch.topSolver && (
                <div className="glass-card rounded-xl p-3 flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-neon" />
                  <span className="text-xs font-bold text-neon">Top solution</span>
                  <span className="text-xs text-muted-foreground">by {ch.topSolver}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button variant="default" size="sm" onClick={() => toast.success("Opening submission form...")}>
                  Submit my work as solution
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toast.success("Following challenge updates")}>
                  Follow updates
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;
