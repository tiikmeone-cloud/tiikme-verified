import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Briefcase, Target, Wrench, Star, Handshake, Clock,
  MapPin, Bookmark, ArrowLeft, Plus, X, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const typeFilters = ["All", "Jobs", "Internships", "Freelance", "Research", "Mentorship", "Collaboration"];
const typeMap: Record<string, string> = { Jobs: "job", Internships: "internship", Freelance: "freelance", Research: "research", Mentorship: "mentorship", Collaboration: "collaboration" };
const typeIcons: Record<string, React.ElementType> = { job: Briefcase, internship: Building2, freelance: Wrench, research: Search, mentorship: Star, collaboration: Handshake };
const typeColors: Record<string, string> = { job: "#3D5AF1", internship: "#7C3AED", freelance: "#C2410C", research: "#0E7490", mentorship: "#10B981", collaboration: "#F59E0B" };
const oppTypes = ["Job", "Internship", "Freelance", "Research", "Mentorship", "Collaboration"];
const locationTypes = ["Remote", "On-site", "Hybrid"];

interface Opp {
  id: string; title: string; description: string | null; type: string | null;
  location: string | null; compensation: string | null; deadline: string | null;
  is_open: boolean | null; created_at: string | null; poster_id: string | null;
  responses_count: number | null; domain: string | null;
}

const Opportunities = () => {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [cTitle, setCTitle] = useState("");
  const [cType, setCType] = useState("Job");
  const [cDesc, setCDesc] = useState("");
  const [cSkills, setCSkills] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cLocType, setCLocType] = useState("Remote");
  const [cComp, setCComp] = useState("");
  const [cDeadline, setCDeadline] = useState("");

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("opportunities")
      .select("id, title, description, type, location, compensation, deadline, is_open, created_at, poster_id, responses_count, domain")
      .eq("is_open", true)
      .order("created_at", { ascending: false })
      .limit(30);
    if (search.trim()) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    if (activeType !== "All" && typeMap[activeType]) query = query.eq("type", typeMap[activeType]);
    const { data } = await query;
    setOpps(data || []);
    setLoading(false);
  }, [search, activeType]);

  useEffect(() => { const t = setTimeout(fetchOpps, 300); return () => clearTimeout(t); }, [fetchOpps]);

  const selected = opps.find(o => o.id === selectedId);
  const toggleSave = (id: string) => { setSaved(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); toast.success(saved.includes(id) ? "Removed from saved" : "Saved for later"); };
  const selectOpp = (id: string) => { setSelectedId(id); setMobileDetail(true); };

  const handleCreate = async () => {
    if (!cTitle.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase.from("opportunities").insert({
      title: cTitle.trim(), type: cType.toLowerCase(), description: cDesc.trim() || null,
      location: cLocType === "On-site" ? cLocation.trim() : cLocType === "Hybrid" ? `Hybrid – ${cLocation.trim()}` : "Remote",
      compensation: cComp.trim() || null, deadline: cDeadline || null, poster_id: user.id,
      domain: cSkills.trim() || null, is_open: true,
    }).select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    if (data) { setOpps(prev => [data, ...prev]); }
    toast.success("Opportunity posted ✓");
    setShowCreate(false);
    setCTitle(""); setCDesc(""); setCSkills(""); setCLocation(""); setCComp(""); setCDeadline("");
  };

  const OppCard = ({ o }: { o: Opp }) => {
    const color = typeColors[o.type || ""] || "#6B7280";
    const Icon = typeIcons[o.type || ""] || Briefcase;
    return (
      <button onClick={() => selectOpp(o.id)}
        className={`w-full text-left p-4 transition-all duration-150 cursor-pointer ${selectedId === o.id ? "" : "hover:bg-[var(--surface-2)]"}`}
        style={{ borderBottom: "1px solid var(--border)", background: selectedId === o.id ? "var(--brand-dim)" : "transparent", borderLeft: selectedId === o.id ? "3px solid var(--brand)" : "3px solid transparent" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold line-clamp-1" style={{ color: "var(--text-1)" }}>{o.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}1A`, color }}>{(o.type || "job").toUpperCase()}</span>
              {o.location && <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-3)" }}><MapPin className="w-3 h-3" />{o.location}</span>}
            </div>
            {o.description && <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--text-2)" }}>{o.description}</p>}
            {o.compensation && <p className="text-[12px] font-bold mt-1" style={{ color: "#F59E0B" }}>{o.compensation}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleSave(o.id); }} className="p-1 cursor-pointer">
            <Bookmark className="w-4 h-4" style={{ color: saved.includes(o.id) ? "var(--brand)" : "var(--text-3)", fill: saved.includes(o.id) ? "var(--brand)" : "none" }} />
          </button>
        </div>
      </button>
    );
  };

  const inputStyle: React.CSSProperties = { background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, color: "var(--text-1)", height: 44 };

  return (
    <main className="max-w-[1100px] mx-auto">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left panel */}
        <div className={`w-full md:w-[420px] md:border-r flex flex-col shrink-0 ${mobileDetail ? "hidden md:flex" : "flex"}`} style={{ borderColor: "var(--border)" }}>
          <div className="p-4 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6" style={{ color: "var(--brand)" }} />
                <h1 className="text-[20px] text-emboss">Opportunities</h1>
              </div>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer active:scale-95" style={{ background: "var(--brand)", color: "white" }}>
                <Plus className="w-3 h-3" /> Post
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..."
                className="w-full h-10 glass-input pl-10 pr-4 text-[13px] outline-none" style={{ color: "var(--text-1)" }} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {typeFilters.map(f => (
                <button key={f} onClick={() => setActiveType(f)}
                  className="shrink-0 h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer active:scale-95"
                  style={{ background: activeType === f ? "var(--brand)" : "var(--surface-2)", color: activeType === f ? "white" : "var(--text-2)", border: activeType === f ? "none" : "1px solid var(--border)" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse p-4"><div className="flex gap-3"><div className="w-10 h-10 rounded-xl" style={{ background: "var(--surface-2)" }} /><div className="flex-1 space-y-2"><div className="h-4 w-3/4 rounded" style={{ background: "var(--surface-2)" }} /><div className="h-3 w-1/2 rounded" style={{ background: "var(--surface-2)" }} /></div></div></div>
              ))}</div>
            ) : opps.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Target className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                <p className="text-[15px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No opportunities yet</p>
                <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Be the first to post one.</p>
                <Button onClick={() => setShowCreate(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Post Opportunity</Button>
              </div>
            ) : opps.map(o => <OppCard key={o.id} o={o} />)}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className={`flex-1 overflow-y-auto ${!mobileDetail && !selectedId ? "hidden md:flex" : "flex"} flex-col`}>
          {selected ? (
            <div className="p-6">
              <button onClick={() => setMobileDetail(false)} className="md:hidden flex items-center gap-1 mb-4 text-[13px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${typeColors[selected.type || ""] || "#6B7280"}1A`, color: typeColors[selected.type || ""] || "#6B7280" }}>{(selected.type || "job").toUpperCase()}</span>
              <h2 className="text-[22px] font-extrabold mt-3" style={{ color: "var(--text-1)" }}>{selected.title}</h2>
              <div className="flex flex-wrap gap-3 mt-3">
                {selected.location && <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-3)" }}><MapPin className="w-3.5 h-3.5" /> {selected.location}</span>}
                {selected.compensation && <span className="text-[12px] font-bold" style={{ color: "#F59E0B" }}>{selected.compensation}</span>}
                {selected.deadline && <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-3)" }}><Clock className="w-3.5 h-3.5" /> Deadline: {selected.deadline}</span>}
              </div>
              {selected.domain && (
                <div className="flex flex-wrap gap-1 mt-3">{selected.domain.split(",").map(s => <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{s.trim()}</span>)}</div>
              )}
              {selected.description && (
                <div className="mt-5"><p className="micro-label mb-2">DESCRIPTION</p><p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{selected.description}</p></div>
              )}
              <div className="flex gap-3 mt-6">
                <Button className="flex-1">Apply now</Button>
                <Button variant="secondary" onClick={() => toggleSave(selected.id)}><Bookmark className="w-4 h-4 mr-1" /> {saved.includes(selected.id) ? "Saved" : "Save"}</Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>Select an opportunity</p>
                <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Click on an item to see details.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Opportunity Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>Post Opportunity</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Title *" value={cTitle} onChange={e => setCTitle(e.target.value)} style={inputStyle} />
                <div>
                  <label className="micro-label block mb-1.5">Type *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {oppTypes.map(t => (
                      <button key={t} onClick={() => setCType(t)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer active:scale-95"
                        style={{ background: cType === t ? "var(--brand)" : "var(--surface-2)", color: cType === t ? "white" : "var(--text-2)", border: cType === t ? "none" : "1px solid var(--border)" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="micro-label block mb-1.5">Description *</label>
                  <textarea value={cDesc} onChange={e => setCDesc(e.target.value.slice(0, 500))} placeholder="What's the role about?" rows={3} maxLength={500}
                    className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                  <p className="text-[10px] text-right" style={{ color: "var(--text-3)" }}>{cDesc.length}/500</p>
                </div>
                <Input placeholder="Skills required (comma separated)" value={cSkills} onChange={e => setCSkills(e.target.value)} style={inputStyle} />
                <div>
                  <label className="micro-label block mb-1.5">Location</label>
                  <div className="flex gap-1.5 mb-2">
                    {locationTypes.map(l => (
                      <button key={l} onClick={() => setCLocType(l)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer"
                        style={{ background: cLocType === l ? "var(--brand-dim)" : "var(--surface-2)", color: cLocType === l ? "var(--brand)" : "var(--text-2)", border: `1px solid ${cLocType === l ? "var(--brand)" : "var(--border)"}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {cLocType !== "Remote" && <Input placeholder="City" value={cLocation} onChange={e => setCLocation(e.target.value)} style={inputStyle} />}
                </div>
                <Input placeholder="Stipend / Salary (optional)" value={cComp} onChange={e => setCComp(e.target.value)} style={inputStyle} />
                <div>
                  <label className="micro-label block mb-1.5">Application deadline</label>
                  <input type="date" value={cDeadline} onChange={e => setCDeadline(e.target.value)}
                    className="w-full h-11 rounded-xl px-3 text-[14px] outline-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleCreate} disabled={creating || !cTitle.trim()}>{creating ? "Posting..." : "Post opportunity"}</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Opportunities;
