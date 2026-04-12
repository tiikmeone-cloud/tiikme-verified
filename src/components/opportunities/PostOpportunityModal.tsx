import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const EMP_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Volunteer"];
const LOC_TYPES = ["On-site", "Remote", "Hybrid"];
const EXP_LEVELS = ["Fresher", "1–3 yrs", "3–5 yrs", "5–10 yrs", "10+ yrs"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (opp: any) => void;
}

export default function PostOpportunityModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const { isInstitution, org } = useOrgIdentity();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [locType, setLocType] = useState("Remote");
  const [city, setCity] = useState("");
  const [empType, setEmpType] = useState("Full-time");
  const [expLevel, setExpLevel] = useState("Fresher");
  const [includeSalary, setIncludeSalary] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPer, setSalaryPer] = useState("Month");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && skills.length < 15 && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillsInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const location = locType === "Remote" ? "Remote" : locType === "Hybrid" ? `Hybrid – ${city}` : city || "On-site";
      const comp = includeSalary && salaryMin ? `₹${salaryMin}${salaryMax ? ` – ₹${salaryMax}` : ""} per ${salaryPer}` : null;
      const { data, error } = await supabase.from("opportunities").insert({
        title: title.trim(),
        type: empType.toLowerCase().replace("-", ""),
        description: description.trim() || null,
        location,
        compensation: comp,
        deadline: deadline || null,
        poster_id: user.id,
        org_id: isInstitution && org ? org.id : null,
        domain: department.trim() || null,
        skills_required: skills.length ? skills : null,
        experience_min: expLevel === "Fresher" ? 0 : parseInt(expLevel) || 0,
        is_open: true,
        is_remote: locType === "Remote",
      }).select().single();
      if (error) throw error;
      toast.success(`${title} posted! 🎉`);
      onCreated(data);
      onClose();
      // Reset
      setTitle(""); setDepartment(""); setDescription(""); setSkills([]); setCity("");
      setDeadline(""); setSalaryMin(""); setSalaryMax("");
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
    setSubmitting(false);
  };

  if (!open) return null;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#E8580A" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#1A1A1A",
    border: active ? "1.5px solid #E8580A" : "1.5px solid #F0E8E0",
    borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[22px] font-bold" style={{ color: "#1A1A1A" }}>Post an Opportunity</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Job title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Frontend Developer" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Department</label>
            <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Location *</label>
            <div className="flex gap-2 flex-wrap">
              {LOC_TYPES.map(l => <button key={l} type="button" onClick={() => setLocType(l)} style={pillStyle(locType === l)}>{l}</button>)}
            </div>
            {(locType === "On-site" || locType === "Hybrid") && (
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-2" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
            )}
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Employment type</label>
            <div className="flex gap-2 flex-wrap">
              {EMP_TYPES.map(t => <button key={t} type="button" onClick={() => setEmpType(t)} style={pillStyle(empType === t)}>{t}</button>)}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Experience level</label>
            <div className="flex gap-2 flex-wrap">
              {EXP_LEVELS.map(e => <button key={e} type="button" onClick={() => setExpLevel(e)} style={pillStyle(expLevel === e)}>{e}</button>)}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer" style={{ color: "#1A1A1A" }}>
              <input type="checkbox" checked={includeSalary} onChange={e => setIncludeSalary(e.target.checked)} /> Include compensation
            </label>
            {includeSalary && (
              <div className="flex gap-2 mt-2 items-center">
                <span className="text-[14px]" style={{ color: "#6B6B6B" }}>₹</span>
                <Input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="From" style={{ height: 44, width: 120, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
                <span style={{ color: "#9CA3AF" }}>–</span>
                <Input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="To" style={{ height: 44, width: 120, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
                <select value={salaryPer} onChange={e => setSalaryPer(e.target.value)} className="h-[44px] rounded-lg px-3 text-[13px]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#1A1A1A" }}>
                  <option>Month</option><option>Year</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Application deadline</label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Description *</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Job description, responsibilities..." rows={5}
              style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14 }} />
          </div>

          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Skills required</label>
            <div className="flex gap-2">
              <Input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Type a skill + Enter"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                style={{ height: 44, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, flex: 1 }} />
            </div>
            {skills.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                    {s} <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {isInstitution && org && (
            <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Posting as <strong style={{ color: "#E8580A" }}>{org.name}</strong></p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} style={{ height: 52, borderRadius: 12, borderColor: "#F0E8E0" }}>Save as Draft</Button>
            <Button type="submit" className="flex-1" disabled={!title.trim() || submitting}
              style={{ height: 52, borderRadius: 12, background: "#E8580A", color: "#FFFFFF" }}>
              {submitting ? "Posting..." : "Post Opportunity →"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
