import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Briefcase, Target, Wrench, Star, Handshake, Shield, Clock,
  Users, MapPin, Bookmark, Share2, ArrowLeft, Plus, ChevronDown, X,
  Zap, Building2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const USER_ROLE = "Student";

const typeFilters = ["All", "Jobs", "Gigs", "Mentorship", "Challenges", "Research"];

const opportunities = [
  { id: "1", type: "funded", typeLabel: "CHALLENGE", typeColor: "#F59E0B", title: "Affordable cold storage for Telangana mango farmers", company: "TechMahindra CSR", companyInitials: "TM", companyColor: "#4F46E5", location: "Remote", compensation: "₹25,000", experience: "Any", mode: "Remote", deadline: "May 15, 2025", daysLeft: "12 days", solutions: 23, verified: true, postedBy: "Ravi Kumar", postedByRole: "CSR Lead", description: "Post-harvest losses reach up to 35% for mangoes due to lack of cold storage within 30km. Build an affordable, portable cold storage solution." },
  { id: "2", type: "job", typeLabel: "JOB", typeColor: "#3D5AF1", title: "Backend Engineer", company: "Zepto", companyInitials: "ZP", companyColor: "#6B21A8", location: "Hyderabad", compensation: "₹8-12 LPA", experience: "2-5 yrs", mode: "On-site", deadline: "Rolling", daysLeft: "Open", solutions: 34, verified: true, postedBy: "Kavita Rao", postedByRole: "HR Manager", description: "Looking for a backend engineer with experience in distributed systems, Go/Python. Strong DSA fundamentals required." },
  { id: "3", type: "collab", typeLabel: "COLLAB", typeColor: "#7C3AED", title: "React Native dev for healthcare app", company: "Dr. Riya Sharma", companyInitials: "RS", companyColor: "#0E7490", location: "Remote", compensation: "Equity + letter", experience: "Any", mode: "Remote", deadline: "3 months", daysLeft: "Ongoing", solutions: 0, verified: true, postedBy: "Dr. Riya Sharma", postedByRole: "Founder", description: "Building a patient management app for rural clinics. React Native + Supabase stack. Equity + experience letter offered." },
  { id: "4", type: "mentorship", typeLabel: "MENTORSHIP", typeColor: "#10B981", title: "Looking for mentor in IoT + AgriTech", company: "Arjun Kumar", companyInitials: "AK", companyColor: "#4F46E5", location: "Hyderabad", compensation: "Online / Hybrid", experience: "5+ yrs", mode: "Hybrid", deadline: "3-6 months", daysLeft: "Open", solutions: 0, verified: false, postedBy: "Arjun Kumar", postedByRole: "Student", description: "Final year student working on smart irrigation. Need guidance on sensor calibration and ML model deployment." },
  { id: "5", type: "gig", typeLabel: "GIG", typeColor: "#C2410C", title: "Electrical wiring for 3BHK apartment", company: "Verified homeowner", companyInitials: "VH", companyColor: "#C2410C", location: "Delhi", compensation: "₹8,000-12,000", experience: "3+ yrs", mode: "On-site", deadline: "This week", daysLeft: "Urgent", solutions: 0, verified: true, postedBy: "Mohan S.", postedByRole: "Homeowner", description: "Complete rewiring of a 3BHK flat in Dwarka. MCB panel upgrade + earthing. Must have valid license." },
  { id: "6", type: "funded", typeLabel: "CHALLENGE", typeColor: "#F59E0B", title: "AI-based crop disease detection — mobile first", company: "AgriTech India Foundation", companyInitials: "AI", companyColor: "#166534", location: "Remote", compensation: "₹50,000", experience: "Any", mode: "Remote", deadline: "Jul 10, 2025", daysLeft: "45 days", solutions: 31, verified: true, postedBy: "Prof. Sharma", postedByRole: "Director", description: "Build a mobile app for crop disease identification from photos. Must work offline in low-connectivity areas." },
  { id: "7", type: "job", typeLabel: "JOB", typeColor: "#3D5AF1", title: "Product Manager — Fintech", company: "Razorpay", companyInitials: "RP", companyColor: "#0369A1", location: "Bengaluru", compensation: "₹18-25 LPA", experience: "3-5 yrs", mode: "Hybrid", deadline: "Rolling", daysLeft: "Open", solutions: 12, verified: true, postedBy: "Sneha T.", postedByRole: "VP Product", description: "Own the payments dashboard experience. Work with engineering and design to ship features for 8M+ merchants." },
  { id: "8", type: "job", typeLabel: "JOB", typeColor: "#3D5AF1", title: "Frontend Developer — React", company: "CRED", companyInitials: "CR", companyColor: "#374151", location: "Bengaluru", compensation: "₹12-18 LPA", experience: "1-3 yrs", mode: "On-site", deadline: "Rolling", daysLeft: "Open", solutions: 45, verified: true, postedBy: "Anil M.", postedByRole: "Engineering Lead", description: "Build pixel-perfect UI components for CRED's consumer app. React, TypeScript, and motion design experience preferred." },
  { id: "9", type: "gig", typeLabel: "GIG", typeColor: "#C2410C", title: "Plumbing work — commercial building", company: "ABC Realty", companyInitials: "AB", companyColor: "#92400E", location: "Mumbai", compensation: "₹15,000-20,000", experience: "5+ yrs", mode: "On-site", deadline: "2 weeks", daysLeft: "10 days", solutions: 0, verified: true, postedBy: "Rajesh P.", postedByRole: "Site Manager", description: "Complete plumbing installation for a new commercial building. CPVC piping, water tank connections, drainage setup." },
  { id: "10", type: "mentorship", typeLabel: "MENTORSHIP", typeColor: "#10B981", title: "UPSC preparation guidance needed", company: "Aspirant", companyInitials: "AS", companyColor: "#374151", location: "Online", compensation: "Volunteer", experience: "Cleared UPSC", mode: "Online", deadline: "Ongoing", daysLeft: "Open", solutions: 0, verified: false, postedBy: "Meera K.", postedByRole: "Aspirant", description: "Looking for a mentor who has cleared UPSC CSE. Need guidance on optional subject selection and answer writing." },
];

const typeMap: Record<string, string> = { Jobs: "job", Gigs: "gig", Mentorship: "mentorship", Challenges: "funded", Research: "research", Collaboration: "collab" };

const typeIcons: Record<string, React.ElementType> = { job: Briefcase, funded: Target, gig: Wrench, mentorship: Star, collab: Handshake };

const Opportunities = () => {
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [mobileDetail, setMobileDetail] = useState(false);

  const filtered = opportunities.filter(o => {
    if (activeType !== "All" && o.type !== typeMap[activeType]) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.title.toLowerCase().includes(q) && !o.company.toLowerCase().includes(q) && !o.location.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = opportunities.find(o => o.id === selectedId);

  const toggleSave = (id: string) => {
    setSaved(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    toast.success(saved.includes(id) ? "Removed from saved" : "Saved for later");
  };

  const selectOpp = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left Panel — Job List */}
      <div className={`w-full md:w-[420px] md:shrink-0 flex flex-col ${mobileDetail ? "hidden md:flex" : "flex"}`}
        style={{ borderRight: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>Opportunities</h1>
            <Button size="sm" className="gap-1 active:scale-95" onClick={() => toast.info("Opening post form...")}>
              <Plus className="w-3.5 h-3.5" /> Post
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by role, company, location..."
              className="w-full h-10 glass-input pl-10 pr-9 text-[13px] outline-none" style={{ color: "var(--text-1)" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-3)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {typeFilters.map(f => (
              <button key={f} onClick={() => setActiveType(f)}
                className="shrink-0 h-[28px] px-3 rounded-full text-[11px] font-bold cursor-pointer active:scale-95"
                style={{
                  background: activeType === f ? "var(--brand)" : "var(--surface-2)",
                  color: activeType === f ? "white" : "var(--text-2)",
                  border: activeType === f ? "none" : "1px solid var(--border)",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="px-4 pb-2">
          <p className="text-[11px] px-3 py-1.5 rounded-lg" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
            Showing opportunities for {USER_ROLE} profiles · <button className="underline cursor-pointer" onClick={() => setActiveType("All")}>Show all</button>
          </p>
        </div>

        {/* Job cards list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No opportunities found</p>
              <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setActiveType("All"); }}>Clear filters</Button>
            </div>
          )}
          {filtered.map(opp => {
            const Icon = typeIcons[opp.type] || Briefcase;
            const isActive = selectedId === opp.id;
            return (
              <button key={opp.id} onClick={() => selectOpp(opp.id)}
                className="w-full text-left px-4 py-3 cursor-pointer transition-all duration-100"
                style={{
                  background: isActive ? "var(--brand-dim)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                  borderBottom: "1px solid var(--border)",
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: `${opp.companyColor}14`, color: opp.companyColor }}>
                    {opp.companyInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{opp.title}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: `${opp.typeColor}1A`, color: opp.typeColor }}>{opp.typeLabel}</span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                      {opp.company} · {opp.location} · {opp.compensation}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {opp.verified && (
                        <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: "#10B981" }}>
                          <Shield className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{opp.daysLeft}</span>
                      {opp.solutions > 0 && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>· {opp.solutions} applied</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className={`flex-1 overflow-y-auto ${mobileDetail ? "flex flex-col" : "hidden md:flex md:flex-col"}`}
        style={{ background: "var(--bg)" }}>
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <Briefcase className="w-14 h-14 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Select an opportunity</p>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Click any listing to view full details</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[640px] mx-auto w-full px-4 md:px-6 py-5">
            {/* Mobile back */}
            <button onClick={() => setMobileDetail(false)}
              className="md:hidden flex items-center gap-1 mb-4 text-[13px] font-semibold cursor-pointer"
              style={{ color: "var(--brand)" }}>
              <ArrowLeft className="w-4 h-4" /> Opportunities
            </button>

            {/* Company + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[16px] font-bold shrink-0"
                style={{ background: `${selected.companyColor}14`, color: selected.companyColor }}>
                {selected.companyInitials}
              </div>
              <div className="flex-1 min-w-0">
                <Link to="/app/institution/1" className="text-[13px] font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                  {selected.company}
                </Link>
                <h2 className="text-[20px] font-extrabold mt-0.5" style={{ color: "var(--text-1)" }}>{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${selected.typeColor}1A`, color: selected.typeColor }}>{selected.typeLabel}</span>
                  {selected.verified && (
                    <span className="text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Posted by */}
            <div className="flex items-center gap-2.5 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: selected.companyColor }}>
                {selected.postedBy.split(" ").map(w => w[0]).join("")}
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>{selected.postedBy}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{selected.postedByRole} · {selected.company}</p>
              </div>
            </div>

            {/* Key info chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {[
                { icon: MapPin, label: selected.location },
                { icon: Zap, label: selected.compensation },
                { icon: Clock, label: selected.mode },
                { icon: Building2, label: selected.experience },
                { icon: Users, label: `${selected.solutions} applied` },
                { icon: Clock, label: selected.daysLeft },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <c.icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                  <span className="text-[12px] font-medium truncate" style={{ color: "var(--text-1)" }}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-6">
              <Button className="flex-1 active:scale-95" onClick={() => toast.success("Application started — attach your portfolio")}>
                Apply via Tiikme
              </Button>
              <Button variant="secondary" className="active:scale-95 gap-1" onClick={() => toggleSave(selected.id)}>
                <Bookmark className={`w-4 h-4 ${saved.includes(selected.id) ? "fill-current" : ""}`} />
                {saved.includes(selected.id) ? "Saved" : "Save"}
              </Button>
              <Button variant="ghost" className="active:scale-95" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/app/opportunities?id=" + selected.id); toast.success("Link copied"); }}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Social proof */}
            {selected.solutions > 0 && (
              <p className="text-[12px] mb-5 px-1" style={{ color: "var(--text-3)" }}>
                {selected.solutions} people have applied · 3 from your college
              </p>
            )}

            {/* Description */}
            <div className="mb-6">
              <p className="micro-label mb-2">ABOUT THIS ROLE</p>
              <p className="text-[14px] leading-[1.75]" style={{ color: "var(--text-2)" }}>{selected.description}</p>
              <div className="mt-4 text-[14px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--text-2)" }}>
{`Requirements:
• Strong understanding of the problem domain
• Demonstrated ability to build and ship products
• Experience with modern tech stacks
• Portfolio of relevant work on Tiikme

What we offer:
• Competitive compensation as listed
• Mentorship from industry experts
• Tiik Verified badge on completion`}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <p className="micro-label mb-2">SKILLS REQUIRED</p>
              <div className="flex flex-wrap gap-1.5">
                {["React", "TypeScript", "Node.js", "Problem Solving", "Communication"].map(s => (
                  <span key={s} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Company info */}
            <div className="glass-liquid rounded-xl p-4 mb-6">
              <p className="micro-label mb-2">ABOUT THE COMPANY</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `${selected.companyColor}14`, color: selected.companyColor }}>{selected.companyInitials}</div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{selected.company}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{selected.location}</p>
                </div>
              </div>
              <Link to="/app/institution/1" className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--brand)" }}>
                View company page <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Similar */}
            <div>
              <p className="micro-label mb-3">SIMILAR OPPORTUNITIES</p>
              <div className="space-y-2">
                {opportunities.filter(o => o.id !== selected.id && o.type === selected.type).slice(0, 3).map(o => (
                  <button key={o.id} onClick={() => { setSelectedId(o.id); window.scrollTo(0, 0); }}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-100"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${o.companyColor}14`, color: o.companyColor }}>{o.companyInitials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{o.title}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{o.company} · {o.compensation}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities;
