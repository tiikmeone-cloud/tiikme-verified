import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Search, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterChips = ["All", "Students", "Professionals", "Doctors", "Government", "Skilled Trade", "Telangana", "AP", "Karnataka", "Tamil Nadu", "Active Projects", "Verified"];

const mockResults = [
  { type: "Profile", name: "Priya Menon", role: "Faculty", city: "Hyderabad", initials: "PM", color: "#FFB547", tags: ["ML Research", "DTU"] },
  { type: "Profile", name: "Ramesh Kumar", role: "Skilled Trade", city: "Chennai", initials: "RK", color: "#FFA726", tags: ["Electrician", "Solar Panels"] },
  { type: "Project", name: "WaterPure IoT", role: "Project", city: "Bangalore", initials: "WP", color: "#7C6FFF", tags: ["IoT", "Clean Water", "Open Source"] },
  { type: "Profile", name: "Dr. Anita Sharma", role: "Doctor", city: "Delhi", initials: "AS", color: "#26C6DA", tags: ["Telemedicine", "Public Health"] },
  { type: "Challenge", name: "Smart Traffic AI", role: "Challenge", city: "Mumbai", initials: "ST", color: "#FF6B6B", tags: ["₹30,000 reward", "AI/ML"] },
  { type: "Profile", name: "Suresh Reddy", role: "Government", city: "Warangal", initials: "SR", color: "#66BB6A", tags: ["Revenue Dept", "Digitization"] },
];

const Nexus = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Compass className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Nexus</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        The intersection of every builder, maker, and professional across India.
      </p>

      {/* Search */}
      <div className="glass-card rounded-2xl flex items-center gap-3 px-4 py-3 mb-4">
        <Compass className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, skill, work type, city..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filterChips.map(chip => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full glass-card transition-all shrink-0 ${
              activeFilter === chip
                ? "border-electric text-electric"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeFilter === chip ? { borderColor: "#7C6FFF", boxShadow: "0 0 10px rgba(124,111,255,0.2)" } : {}}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockResults.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover rounded-2xl p-5 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: result.color }}>
                {result.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{result.name}</span>
                  {result.type === "Profile" && <Shield className="w-3 h-3 text-neon shrink-0" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-bold" style={{ color: result.color }}>{result.role}</span>
                  <span>·</span>
                  <MapPin className="w-3 h-3" />
                  <span>{result.city}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {result.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full glass-card text-muted-foreground">{tag}</span>
              ))}
            </div>
            <div className="mt-3">
              <Button variant="outline" size="xs" className="w-full" onClick={() => toast.success("Connection request sent")}>
                {result.type === "Challenge" ? "View challenge" : "Connect"}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Nexus;
