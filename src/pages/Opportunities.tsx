import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, Clock, Users, Shield, Plus, Briefcase, Handshake, Star, Wrench, LayoutGrid, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OpportunityDetailDrawer } from "@/components/opportunities/OpportunityDrawer";

const USER_ROLE: string = "Student";

const allFilterTabs = ["All", "Jobs", "Gigs", "Mentorship", "Collaboration", "Challenges", "Research"];
const govFilterTabs = ["All", "Mentorship", "Community Service", "Internal Deputations"];

const opportunities = [
  { type: "funded", icon: Target, typeLabel: "FUNDED CHALLENGE", typeColor: "#F59E0B", title: "Affordable cold storage for Telangana mango and tomato farmers", description: "Post-harvest losses reach up to 35% for mangoes due to lack of cold storage within 30km.", postedBy: "TechMahindra CSR", verified: true, reward: "₹25,000", deadline: "May 15, 2025", daysLeft: "12 days left", solutions: 23, featured: true },
  { type: "job", icon: Briefcase, typeLabel: "JOB OPENING", typeColor: "#DC2626", title: "Backend Engineer — Zepto, Hyderabad", description: "Looking for a backend engineer with experience in distributed systems, Go/Python.", postedBy: "Zepto", verified: true, reward: "₹8-12 LPA", deadline: "Rolling", daysLeft: "Open", solutions: 0, featured: false },
  { type: "collab", icon: Handshake, typeLabel: "COLLABORATION", typeColor: "#5B4FFF", title: "Need React Native dev for healthcare app", description: "Building a patient management app for rural clinics. Equity + experience letter.", postedBy: "Dr. Riya Sharma", verified: true, reward: "Equity + letter", deadline: "3 months", daysLeft: "Ongoing", solutions: 0, featured: false },
  { type: "mentorship", icon: Star, typeLabel: "MENTORSHIP", typeColor: "#10B981", title: "Looking for mentor in IoT + AgriTech", description: "Final year student working on smart irrigation. Guidance over 3-6 months.", postedBy: "Arjun Kumar", verified: false, reward: "Online / Hyderabad", deadline: "3-6 months", daysLeft: "Open", solutions: 0, featured: false },
  { type: "gig", icon: Wrench, typeLabel: "GIG", typeColor: "#C2410C", title: "Electrical wiring for 3BHK apartment", description: "Complete rewiring of a 3BHK flat in Dwarka. MCB panel upgrade + earthing.", postedBy: "Verified homeowner", verified: true, reward: "₹8,000-12,000", deadline: "This week", daysLeft: "Urgent", solutions: 0, featured: false },
  { type: "funded", icon: Target, typeLabel: "FUNDED CHALLENGE", typeColor: "#F59E0B", title: "AI-based crop disease detection — mobile first", description: "Build a mobile app for crop disease identification from photos. Must work offline.", postedBy: "AgriTech India Foundation", verified: true, reward: "₹50,000", deadline: "July 10, 2025", daysLeft: "45 days left", solutions: 31, featured: false },
  { type: "community", icon: Handshake, typeLabel: "COMMUNITY SERVICE", typeColor: "#10B981", title: "Digital literacy drive — Government schools, Rajasthan", description: "Volunteer to teach basic computer skills across 15 government schools in Jaipur district.", postedBy: "District Administration, Jaipur", verified: true, reward: "Certificate + commendation", deadline: "Aug 2025", daysLeft: "Open", solutions: 4, featured: false },
  { type: "deputation", icon: Briefcase, typeLabel: "INTERNAL DEPUTATION", typeColor: "#0369A1", title: "IT Cell — State Police Modernisation Unit", description: "Deputation opportunity for officers with tech background. 2-year posting.", postedBy: "DGP Office, Telangana", verified: true, reward: "Pay protection", deadline: "Jun 30, 2025", daysLeft: "30 days left", solutions: 0, featured: false },
];

const ctaLabel: Record<string, string> = { funded: "Submit my work", job: "Apply via Tiikme", collab: "Express interest", mentorship: "Offer mentorship", gig: "I can do this", community: "Volunteer", deputation: "View details" };

const mockApplicants = [
  { name: "Priya M.", role: "Student", status: "new" },
  { name: "Rahul K.", role: "Professional", status: "new" },
  { name: "Neha S.", role: "Student", status: "shortlisted" },
  { name: "Amit T.", role: "Professional", status: "rejected" },
  { name: "Sunita D.", role: "Student", status: "new" },
];

const KanbanBoard = () => {
  const columns = [
    { title: "New", color: "#3D5AF1", items: mockApplicants.filter(a => a.status === "new") },
    { title: "Shortlisted", color: "#10B981", items: mockApplicants.filter(a => a.status === "shortlisted") },
    { title: "Rejected", color: "#DC2626", items: mockApplicants.filter(a => a.status === "rejected") },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
      {columns.map(col => (
        <div key={col.title} className="rounded-3xl border border-dashed p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border-2)" }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
            <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{col.title}</span>
            <span className="text-[11px] ml-auto" style={{ color: "var(--text-3)" }}>{col.items.length}</span>
          </div>
          <div className="space-y-2 min-h-[200px]">
            {col.items.map((item, i) => (
              <div key={i} className="glass-liquid rounded-xl p-3 cursor-grab hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{item.name}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{item.role}</p>
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="flex items-center justify-center h-[120px] text-[12px] rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                Drag applicants here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const isGovRole = USER_ROLE === "Government" || USER_ROLE === "Police";

const Opportunities = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedOpp, setSelectedOpp] = useState<typeof opportunities[0] | null>(null);
  const [view, setView] = useState<"browse" | "manage">("browse");

  const filterTabs = isGovRole ? govFilterTabs : allFilterTabs;

  const filtered = (() => {
    let list = opportunities;
    if (isGovRole) list = list.filter(o => o.type !== "job" && o.type !== "gig");
    if (activeTab === "All") return list;
    const map: Record<string, string> = {
      Jobs: "job", Gigs: "gig", Mentorship: "mentorship", Collaboration: "collab",
      Challenges: "funded", Research: "research",
      "Community Service": "community", "Internal Deputations": "deputation",
    };
    return list.filter(o => o.type === map[activeTab]);
  })();

  return (
    <main className="max-w-4xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Opportunities</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("browse")}
              className="text-[11px] font-bold px-3.5 py-1.5 transition-all duration-200 cursor-pointer active:scale-95"
              style={{ background: view === "browse" ? "var(--brand)" : "var(--surface-2)", color: view === "browse" ? "white" : "var(--text-2)" }}>
              Browse
            </button>
            <button onClick={() => setView("manage")}
              className="text-[11px] font-bold px-3.5 py-1.5 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
              style={{ background: view === "manage" ? "var(--brand)" : "var(--surface-2)", color: view === "manage" ? "white" : "var(--text-2)" }}>
              <LayoutGrid className="w-3 h-3" /> Manage
            </button>
          </div>
          <Button size="sm" className="gap-1.5 active:scale-95" onClick={() => toast.info("Opening opportunity form...")}><Plus className="w-4 h-4" /> Post</Button>
        </div>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Jobs, gigs, mentorships, collaborations, and funded challenges.</p>

      {isGovRole && (
        <div className="glass-liquid rounded-xl p-4 mb-5 flex items-center gap-3" style={{ borderLeft: "3px solid #F59E0B" }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#F59E0B" }} />
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Opportunities filtered for Government Conduct Rule compliance.</p>
        </div>
      )}

      {view === "manage" ? (
        <div>
          <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>Applicant Pipeline</p>
          <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>Drag and drop applicants between columns.</p>
          <KanbanBoard />
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
            {filterTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0 cursor-pointer active:scale-95"
                style={{ background: activeTab === tab ? "var(--brand)" : "var(--surface-2)", border: `1px solid ${activeTab === tab ? "var(--brand)" : "var(--border)"}`, color: activeTab === tab ? "white" : "var(--text-2)" }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="glass-liquid rounded-2xl p-8 text-center">
                <p className="text-[14px]" style={{ color: "var(--text-2)" }}>No opportunities in this category yet.</p>
              </div>
            )}
            {filtered.map((opp, i) => (
              <motion.div key={opp.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer"
                style={{ borderLeft: `4px solid ${opp.typeColor}` }}
                onClick={() => setSelectedOpp(opp)}
              >
                {opp.type === "funded" && (
                  <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: `linear-gradient(to right, ${opp.typeColor}, ${opp.typeColor}CC)` }}>
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-black" /><span className="text-sm font-bold text-black">{opp.reward} reward</span></div>
                    <span className="text-xs font-medium text-black">{opp.daysLeft}</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: opp.typeColor }}>{opp.typeLabel}</span>
                    {opp.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}><Shield className="w-3 h-3" /> Verified</span>}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-1)" }}>{opp.title}</h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-2)" }}>{opp.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="glass-liquid rounded-xl p-3 text-xs"><span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--text-3)" }}>Posted by</span><span className="font-medium" style={{ color: "var(--text-1)" }}>{opp.postedBy}</span></div>
                    <div className="glass-liquid rounded-xl p-3 text-xs"><span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--text-3)" }}>Compensation</span><span className="font-bold" style={{ color: "#F59E0B" }}>{opp.reward}</span></div>
                    <div className="glass-liquid rounded-xl p-3 text-xs"><span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--text-3)" }}>Deadline</span><span className="flex items-center gap-1" style={{ color: "var(--text-1)" }}><Clock className="w-3 h-3" /> {opp.deadline}</span></div>
                    {opp.solutions > 0 && <div className="glass-liquid rounded-xl p-3 text-xs"><span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--text-3)" }}>Solutions</span><span className="flex items-center gap-1" style={{ color: "var(--text-1)" }}><Users className="w-3 h-3" /> {opp.solutions}</span></div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={e => { e.stopPropagation(); setSelectedOpp(opp); }} className="active:scale-95">{ctaLabel[opp.type] || "View details"}</Button>
                    {opp.type === "funded" && <Button variant="secondary" onClick={e => { e.stopPropagation(); toast.success("Following updates"); }} className="active:scale-95">Follow updates</Button>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedOpp && <OpportunityDetailDrawer opp={selectedOpp} onClose={() => setSelectedOpp(null)} />}
      </AnimatePresence>
    </main>
  );
};

export default Opportunities;
