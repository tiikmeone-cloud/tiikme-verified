import { useState } from "react";
import { X, Plus, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const EMP_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Volunteer"];
const LOC_TYPES = ["On-site", "Remote", "Hybrid"];
const EXP_LEVELS = ["Fresher", "1–3 yrs", "3–5 yrs", "5–10 yrs", "10+ yrs"];
const EDU_LEVELS = ["Any", "10th Pass", "12th Pass", "Diploma", "Bachelor's", "Master's", "PhD"];
const VIS_OPTIONS = [
  { value: "public", label: "Public — all Tiikme users" },
  { value: "org_page", label: "Org page only — visible on your profile" },
  { value: "workspace", label: "Workspace only — team members only" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (opp: any) => void;
}

export default function PostOpportunityModal({ open, onClose, onCreated }: Props) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [locType, setLocType] = useState("Remote");
  const [city, setCity] = useState("");
  const [empTypes, setEmpTypes] = useState<string[]>(["Full-time"]);
  const [expLevel, setExpLevel] = useState("Fresher");
  const [includeSalary, setIncludeSalary] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPer, setSalaryPer] = useState("Month");
  const [unpaid, setUnpaid] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<{ text: string; type: string; required: boolean }[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [submitting, setSubmitting] = useState(false);

  // Qualification criteria
  const [minEducation, setMinEducation] = useState("Any");
  const [minActivityScore, setMinActivityScore] = useState("");
  const [requireProfile, setRequireProfile] = useState(true);
  const [showQualification, setShowQualification] = useState(false);

  const toggleEmpType = (t: string) => {
    setEmpTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && skills.length < 20 && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillsInput("");
    }
  };

  const addReq = () => {
    const r = reqInput.trim();
    if (r) { setRequirements([...requirements, r]); setReqInput(""); }
  };

  const addQuestion = () => {
    if (questions.length < 5) setQuestions([...questions, { text: "", type: "Short text", required: false }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const location = locType === "Remote" ? "Remote" : locType === "Hybrid" ? `Hybrid – ${city}` : city || "On-site";
      const comp = unpaid ? "Unpaid" : includeSalary && salaryMin ? `₹${salaryMin}${salaryMax ? ` – ₹${salaryMax}` : ""} per ${salaryPer}` : null;

      const qualificationCriteria: Record<string, any> = {};
      if (minEducation !== "Any") qualificationCriteria.min_education = minEducation;
      if (minActivityScore) qualificationCriteria.min_activity_score = parseInt(minActivityScore);
      if (requireProfile) qualificationCriteria.require_profile = true;
      if (questions.length > 0) qualificationCriteria.screening_questions = questions;
      if (requirements.length > 0) qualificationCriteria.requirements = requirements;

      const { data, error } = await supabase.from("opportunities").insert({
        title: title.trim(),
        type: empTypes[0]?.toLowerCase().replace("-", "") || "fulltime",
        description: description.trim() || null,
        location,
        compensation: comp,
        deadline: deadline || null,
        poster_id: user.id,
        org_id: profile?.org_id || null,
        domain: department.trim() || null,
        skills_required: skills.length ? skills : null,
        experience_min: expLevel === "Fresher" ? 0 : parseInt(expLevel) || 0,
        is_open: true,
        is_remote: locType === "Remote",
        qualification_criteria: Object.keys(qualificationCriteria).length > 0 ? qualificationCriteria : null,
      } as any).select().single();
      if (error) throw error;
      toast.success("Opportunity posted!");
      onCreated(data);
      onClose();
      setTitle(""); setDepartment(""); setDescription(""); setSkills([]); setCity("");
      setDeadline(""); setSalaryMin(""); setSalaryMax(""); setRequirements([]); setQuestions([]);
      setMinEducation("Any"); setMinActivityScore(""); setRequireProfile(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
    setSubmitting(false);
  };

  if (!open) return null;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#FF5A1F" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#1A1A1A",
    border: active ? "1.5px solid #FF5A1F" : "1.5px solid #ECECEA",
    borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-0 md:px-4 md:pl-[230px]" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full md:max-w-[640px] max-h-[90vh] md:max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[22px] font-bold" style={{ color: "#1A1A1A" }}>Post an Opportunity</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-5 h-5" /></button>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Job title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Frontend Developer Intern" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          {/* Department */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Department *</label>
            <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          {/* Location */}
          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Work location</label>
            <div className="flex gap-2 flex-wrap">
              {LOC_TYPES.map(l => <button key={l} type="button" onClick={() => setLocType(l)} style={pillStyle(locType === l)}>{l}</button>)}
            </div>
            {(locType === "On-site" || locType === "Hybrid") && (
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-2" style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
            )}
          </div>

          {/* Employment type (multi) */}
          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Employment type</label>
            <div className="flex gap-2 flex-wrap">
              {EMP_TYPES.map(t => <button key={t} type="button" onClick={() => toggleEmpType(t)} style={pillStyle(empTypes.includes(t))}>{t}</button>)}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Experience required</label>
            <div className="flex gap-2 flex-wrap">
              {EXP_LEVELS.map(e => <button key={e} type="button" onClick={() => setExpLevel(e)} style={pillStyle(expLevel === e)}>{e}</button>)}
            </div>
          </div>

          {/* Compensation */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer" style={{ color: "#1A1A1A" }}>
              <input type="checkbox" checked={includeSalary} onChange={e => { setIncludeSalary(e.target.checked); if (e.target.checked) setUnpaid(false); }} /> Include salary details
            </label>
            {includeSalary && !unpaid && (
              <div className="flex gap-2 mt-2 items-center flex-wrap">
                <span className="text-[14px]" style={{ color: "#6B6B6B" }}>₹</span>
                <Input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} type="number" placeholder="From" style={{ height: 44, width: 120, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
                <span style={{ color: "#9CA3AF" }}>–</span>
                <Input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} type="number" placeholder="To" style={{ height: 44, width: 120, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
                <select value={salaryPer} onChange={e => setSalaryPer(e.target.value)} className="h-[44px] rounded-lg px-3 text-[13px]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#1A1A1A" }}>
                  <option>Month</option><option>Year</option>
                </select>
              </div>
            )}
            {includeSalary && (
              <label className="flex items-center gap-2 text-[12px] mt-2 cursor-pointer" style={{ color: "#6B6B6B" }}>
                <input type="checkbox" checked={unpaid} onChange={e => setUnpaid(e.target.checked)} /> Unpaid
              </label>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Application deadline</label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Job description *</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and why it's exciting..." rows={5}
              style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14, minHeight: 160 }} />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Requirements</label>
            {requirements.length > 0 && (
              <ul className="mb-2 space-y-1">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] py-1 px-2 rounded-lg" style={{ background: "#F9FAFB", color: "#1A1A1A" }}>
                    <span className="flex-1">• {r}</span>
                    <button type="button" onClick={() => setRequirements(requirements.filter((_, j) => j !== i))} className="cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-3 h-3" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input value={reqInput} onChange={e => setReqInput(e.target.value)} placeholder="Add a requirement..."
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addReq(); } }}
                style={{ height: 44, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, flex: 1 }} />
              <Button type="button" variant="outline" onClick={addReq} style={{ height: 44, borderRadius: 8 }}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Skills required</label>
            <Input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Type a skill + Enter"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              style={{ height: 44, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
            {skills.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                    {s} <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {skills.length >= 20 && <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Maximum 20 skills</p>}
          </div>

          {/* Qualification Criteria */}
          <div>
            <button type="button" onClick={() => setShowQualification(!showQualification)} className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer" style={{ color: "#1A1A1A" }}>
              {showQualification ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Qualification criteria
            </button>
            {showQualification && (
              <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #ECECEA" }}>
                <div>
                  <label className="text-[12px] font-semibold block mb-1" style={{ color: "#6B6B6B" }}>Minimum education</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EDU_LEVELS.map(e => (
                      <button key={e} type="button" onClick={() => setMinEducation(e)} style={pillStyle(minEducation === e)} className="text-[11px]">{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold block mb-1" style={{ color: "#6B6B6B" }}>Minimum activity score</label>
                  <Input value={minActivityScore} onChange={e => setMinActivityScore(e.target.value)} type="number" placeholder="e.g. 50 (optional)"
                    style={{ height: 40, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, width: 200 }} />
                </div>
                <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: "#6B6B6B" }}>
                  <input type="checkbox" checked={requireProfile} onChange={e => setRequireProfile(e.target.checked)} />
                  Require profile sharing with application
                </label>
              </div>
            )}
          </div>

          {/* Screening questions */}
          <div>
            <button type="button" onClick={() => setShowQuestions(!showQuestions)} className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer" style={{ color: "#6B6B6B" }}>
              {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Add screening questions
            </button>
            {showQuestions && (
              <div className="mt-2 space-y-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input value={q.text} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], text: e.target.value }; setQuestions(nq); }}
                      placeholder={`Question ${i + 1}`} style={{ height: 44, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, flex: 1 }} />
                    <select value={q.type} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], type: e.target.value }; setQuestions(nq); }}
                      className="h-[44px] rounded-lg px-2 text-[12px]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#1A1A1A", width: 110 }}>
                      <option>Short text</option><option>Yes or No</option>
                    </select>
                    <label className="flex items-center gap-1 text-[10px] shrink-0 self-center cursor-pointer" style={{ color: "#6B6B6B" }}>
                      <input type="checkbox" checked={q.required} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], required: e.target.checked }; setQuestions(nq); }} />
                      Req
                    </label>
                    <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="p-2 cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {questions.length < 5 && (
                  <button type="button" onClick={addQuestion} className="flex items-center gap-1 text-[12px] font-semibold cursor-pointer" style={{ color: "#FF5A1F" }}>
                    <Plus className="w-3.5 h-3.5" /> Add question
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[13px] font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Who can see this?</label>
            <div className="space-y-1.5">
              {VIS_OPTIONS.map(v => (
                <label key={v.value} className="flex items-center gap-2 text-[13px] cursor-pointer p-2 rounded-lg" style={{ background: visibility === v.value ? "#FEF3E8" : "transparent", color: "#1A1A1A" }}>
                  <input type="radio" name="vis" checked={visibility === v.value} onChange={() => setVisibility(v.value)} />
                  {v.label}
                </label>
              ))}
            </div>
          </div>


          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} style={{ height: 40, borderRadius: 12, borderColor: "#ECECEA" }}>Save as Draft</Button>
            <Button type="submit" className="flex-1" disabled={!title.trim() || submitting}
              style={{ height: 52, borderRadius: 12, background: "#FF5A1F", color: "#FFFFFF" }}>
              {submitting ? "Posting..." : "Post Opportunity →"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
