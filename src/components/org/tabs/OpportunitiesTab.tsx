import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, MapPin, Clock, DollarSign, Users, Bookmark, X, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface OpportunitiesTabProps {
  org: any;
  isAdmin: boolean;
}

const TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract", "Volunteer"];
const EXP_OPTIONS = [
  { label: "Fresher", value: 0 },
  { label: "1–3 yrs", value: 1 },
  { label: "3–5 yrs", value: 3 },
  { label: "5+ yrs", value: 5 },
];

export default function OpportunitiesTab({ org, isAdmin }: OpportunitiesTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [showApply, setShowApply] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ title: "", description: "", type: "Full-time", location: "", is_remote: false, experience_min: 0, salary_min: "", salary_max: "", skills: "" as string, deadline: "" });
  const [submitting, setSubmitting] = useState(false);

  // Apply state
  const [applyForm, setApplyForm] = useState({ why_good_fit: "", portfolio_url: "", cover_letter: "" });
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOpportunities();
  }, [org.id]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("opportunities").select("*").eq("org_id", org.id).eq("is_open", true).order("created_at", { ascending: false });
      if (error) console.warn("[Opps] fetch failed:", error.message);
      setOpportunities(data || []);

      if (user) {
        const { data: apps } = await supabase.from("opportunity_applications").select("opportunity_id").eq("applicant_id", user.id);
        if (apps) setAppliedIds(new Set(apps.map(a => a.opportunity_id)));
      }
    } catch (e) { console.warn("[Opps] exception:", e); }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!user || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from("opportunities").insert({
        title: form.title, description: form.description, type: form.type,
        location: form.location, is_remote: form.is_remote,
        experience_min: form.experience_min,
        skills_required: skills.length > 0 ? skills : null,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        deadline: form.deadline || null,
        org_id: org.id, poster_id: user.id, is_open: true,
      });
      if (error) { toast.error(error.message); } else {
        toast.success("Opportunity posted!");
        setShowForm(false);
        setForm({ title: "", description: "", type: "Full-time", location: "", is_remote: false, experience_min: 0, salary_min: "", salary_max: "", skills: "", deadline: "" });
        fetchOpportunities();
      }
    } catch (e) { console.warn("[Opps] post failed:", e); }
    setSubmitting(false);
  };

  const handleApply = async (oppId: string) => {
    if (!user) return;
    setApplying(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: oppId, applicant_id: user.id,
        why_good_fit: applyForm.why_good_fit || null,
        portfolio_url: applyForm.portfolio_url || null,
        cover_letter: applyForm.cover_letter || null,
      });
      if (error) { toast.error(error.message); } else {
        toast.success("Application sent! 🎉");
        setAppliedIds(prev => new Set([...prev, oppId]));
        setShowApply(null);
        setApplyForm({ why_good_fit: "", portfolio_url: "", cover_letter: "" });
      }
    } catch (e) { console.warn("[Opps] apply failed:", e); }
    setApplying(false);
  };

  const filtered = filter === "All"
    ? opportunities
    : filter === "Remote"
      ? opportunities.filter(o => o.is_remote === true)
      : opportunities.filter(o => o.type === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {["All", ...TYPE_OPTIONS, "Remote"].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0"
              style={{ background: filter === f ? "rgba(232,88,10,0.1)" : "#F3F4F6", color: filter === f ? "#E8580A" : "#6B6B6B" }}>
              {f}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-1" onClick={() => setShowForm(true)} style={{ background: "#E8580A", color: "#fff" }}>
            <Plus className="w-3.5 h-3.5" /> Post Opportunity
          </Button>
        )}
      </div>

      {/* Post form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-xl p-6" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>Post Opportunity</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handlePost(); }} className="space-y-4">
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Job title *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 h-12" /></div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Type</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">{TYPE_OPTIONS.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))} className="text-[12px] px-3 py-1.5 rounded-full font-medium"
                    style={{ background: form.type === t ? "rgba(232,88,10,0.1)" : "#F3F4F6", color: form.type === t ? "#E8580A" : "#6B6B6B" }}>{t}</button>
                ))}</div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Location</label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="mt-1 h-12" placeholder="City" /></div>
                <label className="flex items-center gap-2 self-end pb-2 cursor-pointer"><input type="checkbox" checked={form.is_remote} onChange={e => setForm(p => ({ ...p, is_remote: e.target.checked }))} /><span className="text-[13px]" style={{ color: "#6B6B6B" }}>Remote</span></label>
              </div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Experience level</label>
                <div className="flex gap-1.5 mt-1">{EXP_OPTIONS.map(e => (
                  <button key={e.label} type="button" onClick={() => setForm(p => ({ ...p, experience_min: e.value }))} className="text-[12px] px-3 py-1.5 rounded-full font-medium"
                    style={{ background: form.experience_min === e.value ? "rgba(232,88,10,0.1)" : "#F3F4F6", color: form.experience_min === e.value ? "#E8580A" : "#6B6B6B" }}>{e.label}</button>
                ))}</div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Salary min (₹)</label><Input type="number" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))} className="mt-1 h-12" /></div>
                <div className="flex-1"><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Salary max (₹)</label><Input type="number" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))} className="mt-1 h-12" /></div>
              </div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Description *</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 min-h-[120px]" /></div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Skills (comma separated)</label><Input value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} className="mt-1 h-12" placeholder="React, TypeScript, Node.js" /></div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Deadline</label><Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="mt-1 h-12" /></div>
              <Button type="submit" disabled={!form.title.trim() || submitting} className="w-full h-[52px] text-[15px]" style={{ background: "#E8580A", color: "#fff" }}>
                {submitting ? "Posting..." : "Post Opportunity →"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-t-xl md:rounded-xl p-6" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>Apply</h2>
              <button type="button" onClick={() => setShowApply(null)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleApply(showApply); }} className="space-y-4">
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Why are you a good fit?</label><Textarea value={applyForm.why_good_fit} onChange={e => setApplyForm(p => ({ ...p, why_good_fit: e.target.value }))} className="mt-1 min-h-[80px]" /></div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Portfolio link</label><Input value={applyForm.portfolio_url} onChange={e => setApplyForm(p => ({ ...p, portfolio_url: e.target.value }))} className="mt-1 h-12" placeholder="https://..." /></div>
              <div><label className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>Cover letter</label><Textarea value={applyForm.cover_letter} onChange={e => setApplyForm(p => ({ ...p, cover_letter: e.target.value }))} className="mt-1 min-h-[80px]" /></div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required className="mt-1" />
                <span className="text-[12px]" style={{ color: "#6B6B6B" }}>I agree my profile will be shared with {org.name}</span>
              </label>
              <Button type="submit" disabled={applying} className="w-full h-[52px] text-[15px]" style={{ background: "#E8580A", color: "#fff" }}>
                {applying ? "Submitting..." : "Submit Application →"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Listings */}
      {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="rounded-xl h-[140px] animate-pulse" style={{ background: "#F3F4F6" }} />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
          <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No active opportunities</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Jobs and opportunities will appear here</p>
        </div>
      )}

      {!loading && filtered.map(opp => (
        <div key={opp.id} className="rounded-xl p-5 mb-3 hover:-translate-y-0.5 transition-transform" style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden"
              style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff", border: org.logo_url ? "1px solid #F0E8E0" : "none" }}>
              {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : org.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>{org.name}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}</p>
            </div>
          </div>
          <h3 className="text-[18px] font-semibold mb-2" style={{ color: "#1A1A1A" }}>{opp.title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {opp.type && <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#6B6B6B" }}>{opp.type}</span>}
            {opp.location && <span className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "#F3F4F6", color: "#6B6B6B" }}><MapPin className="w-3 h-3" /> {opp.location}</span>}
            {opp.is_remote && <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#6B6B6B" }}>Remote</span>}
            {(opp.salary_min || opp.salary_max) && (
              <span className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "#F3F4F6", color: "#6B6B6B" }}>
                <DollarSign className="w-3 h-3" /> {opp.salary_min ? `₹${opp.salary_min.toLocaleString()}` : ""}{opp.salary_min && opp.salary_max ? " – " : ""}{opp.salary_max ? `₹${opp.salary_max.toLocaleString()}` : ""}
              </span>
            )}
          </div>
          {opp.description && <p className="text-[14px] line-clamp-2 mb-2" style={{ color: "#4B5563" }}>{opp.description}</p>}
          {opp.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {opp.skills_required.slice(0, 5).map((s: string) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>{s}</span>
              ))}
              {opp.skills_required.length > 5 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>+{opp.skills_required.length - 5} more</span>}
            </div>
          )}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #F0E8E0" }}>
            <div className="flex items-center gap-3 text-[12px]" style={{ color: "#9CA3AF" }}>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {opp.responses_count || 0} applicants</span>
              {opp.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.max(0, Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000))} days left</span>}
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" className="h-10 gap-1" onClick={() => navigate(`/app/applications/${opp.id}`)}
                  style={{ borderColor: "#F0E8E0", color: "#6B6B6B" }}>
                  <BarChart3 className="w-3.5 h-3.5" /> Applications
                </Button>
              )}
              <button type="button" className="p-2 rounded-lg hover:bg-gray-50" onClick={() => toast.success("Opportunity saved")}>
                <Bookmark className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
              {appliedIds.has(opp.id) ? (
                <Button size="sm" disabled className="h-10" style={{ background: "#16A34A", color: "#fff" }}>Applied</Button>
              ) : (
                <Button size="sm" className="h-10" onClick={() => setShowApply(opp.id)} style={{ background: "#E8580A", color: "#fff" }}>Apply Now</Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}