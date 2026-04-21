import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Clock, Code, GraduationCap, Hammer, Trophy, Users, MapPin, Zap, ChevronDown, ChevronUp, Plus, X, DollarSign, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GlassBox from "@/components/ui/GlassBox";

/* ─── Type definitions ─── */
const OPP_TYPES = [
  { value: "full_time", label: "Full-time", icon: Briefcase, color: "#2563EB", desc: "Permanent full-time position" },
  { value: "part_time", label: "Part-time", icon: Clock, color: "#7C3AED", desc: "Part-time or flexible hours" },
  { value: "internship", label: "Internship", icon: GraduationCap, color: "#10B981", desc: "Internship opportunity" },
  { value: "freelance", label: "Freelance", icon: Code, color: "#F59E0B", desc: "Freelance project-based work" },
  { value: "contract", label: "Contract", icon: Hammer, color: "#0E7490", desc: "Fixed-term contract role" },
  { value: "gig", label: "Gig", icon: Zap, color: "#EC4899", desc: "Short-term gig work" },
  { value: "hackathon", label: "Hackathon", icon: Trophy, color: "#8B5CF6", desc: "Competition or hackathon event" },
  { value: "walk_in_interview", label: "Walk-in Interview", icon: Users, color: "#EF4444", desc: "Walk-in interview event" },
  { value: "campus_recruitment", label: "Campus Drive", icon: GraduationCap, color: "#14B8A6", desc: "Campus recruitment drive" },
  { value: "apprenticeship", label: "Apprenticeship", icon: Hammer, color: "#6366F1", desc: "Apprenticeship or training" },
];

const isJobType = (t: string) => ["full_time", "part_time", "contract"].includes(t);
const isFreelanceType = (t: string) => ["freelance", "gig"].includes(t);

export default function OpportunityCreate() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [oppType, setOppType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Job-specific
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");
  const [experienceMin, setExperienceMin] = useState("");
  const [activityScoreMin, setActivityScoreMin] = useState("");

  // Internship
  const [durationMonths, setDurationMonths] = useState("");
  const [stipend, setStipend] = useState("");
  const [canConvert, setCanConvert] = useState(false);

  // Freelance/Gig
  const [projectDuration, setProjectDuration] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [pricingModel, setPricingModel] = useState("fixed");

  // Hackathon
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamSizeMin, setTeamSizeMin] = useState("");
  const [teamSizeMax, setTeamSizeMax] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [themesInput, setThemesInput] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [eventMode, setEventMode] = useState("offline");

  // Walk-in
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [docsInput, setDocsInput] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [positionsAvailable, setPositionsAvailable] = useState("");

  // Screening
  const [showScreening, setShowScreening] = useState(false);
  const [questions, setQuestions] = useState<{ question: string; type: string; options: string[]; correct: string[]; is_eliminatory: boolean }[]>([]);

  // Application requirements
  const [requireResume, setRequireResume] = useState(true);
  const [askPortfolio, setAskPortfolio] = useState(false);
  const [customAttachmentLabel, setCustomAttachmentLabel] = useState("");

  // HR delegation
  const [hrContactId, setHrContactId] = useState("");
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && !skills.includes(s) && skills.length < 20) { setSkills([...skills, s]); setSkillsInput(""); }
  };
  const addTheme = () => {
    const t = themesInput.trim();
    if (t && !themes.includes(t)) { setThemes([...themes, t]); setThemesInput(""); }
  };
  const addDoc = () => {
    const d = docsInput.trim();
    if (d && !documents.includes(d)) { setDocuments([...documents, d]); setDocsInput(""); }
  };

  const addQuestion = () => {
    if (questions.length < 10) setQuestions([...questions, { question: "", type: "text", options: [], correct: [], is_eliminatory: false }]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const compensation = salaryMin ? `${salaryCurrency === "INR" ? "₹" : "$"}${salaryMin}${salaryMax ? ` – ${salaryCurrency === "INR" ? "₹" : "$"}${salaryMax}` : ""}` : stipend || null;

      const qualCriteria: Record<string, any> = {};
      if (activityScoreMin) qualCriteria.min_activity_score = parseInt(activityScoreMin);
      if (experienceMin) qualCriteria.min_experience = parseInt(experienceMin);

      const insertData: Record<string, any> = {
        title: title.trim(),
        type: oppType,
        description: description.trim() || null,
        domain: domain.trim() || null,
        location: isRemote ? "Remote" : location.trim() || null,
        is_remote: isRemote,
        deadline: deadline || null,
        skills_required: skills.length ? skills : [],
        compensation,
        poster_id: user.id,
        org_id: profile?.org_id || null,
        is_open: true,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        salary_currency: salaryCurrency,
        experience_min: experienceMin ? parseInt(experienceMin) : 0,
        activity_score_min: activityScoreMin ? parseInt(activityScoreMin) : 0,
        qualification_criteria: Object.keys(qualCriteria).length > 0 ? qualCriteria : {},
        screening_questions: questions.length > 0 ? questions : [],
        require_resume: requireResume,
        ask_portfolio: askPortfolio,
        custom_attachment_label: customAttachmentLabel.trim() || null,
        hr_contact_id: hrContactId || null,
      };

      // Type-specific fields
      if (oppType === "internship") {
        insertData.duration_months = durationMonths ? parseInt(durationMonths) : null;
        insertData.stipend = stipend || null;
        insertData.can_convert_fulltime = canConvert;
      }
      if (isFreelanceType(oppType)) {
        insertData.project_duration = projectDuration || null;
        insertData.budget_min = budgetMin ? parseInt(budgetMin) : null;
        insertData.budget_max = budgetMax ? parseInt(budgetMax) : null;
        insertData.pricing_model = pricingModel;
      }
      if (oppType === "hackathon") {
        insertData.start_date = startDate || null;
        insertData.end_date = endDate || null;
        insertData.team_size_min = teamSizeMin ? parseInt(teamSizeMin) : null;
        insertData.team_size_max = teamSizeMax ? parseInt(teamSizeMax) : null;
        insertData.prize_pool = prizePool || null;
        insertData.themes = themes;
        insertData.registration_deadline = registrationDeadline || null;
        insertData.event_mode = eventMode;
      }
      if (oppType === "walk_in_interview" || oppType === "campus_recruitment") {
        insertData.event_date = eventDate || null;
        insertData.event_time = eventTime || null;
        insertData.venue = venue || null;
        insertData.documents_to_bring = documents;
        insertData.positions_available = positionsAvailable ? parseInt(positionsAvailable) : null;
      }

      const { error } = await supabase.from("opportunities").insert(insertData as any).select().single();
      if (error) throw error;

      await supabase.rpc("increment_score", { uid: user.id, amount: 3 });
      toast.success("Opportunity posted!");
      navigate("/app/opportunities");
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
    setSubmitting(false);
  };

  const typeColor = OPP_TYPES.find(t => t.value === oppType)?.color || "#FA903E";

  const sectionLabel = (text: string) => (
    <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "var(--text-1)" }}>{text}</label>
  );

  const inputStyle: React.CSSProperties = { height: 48, background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12 };

  return (
    <main className="max-w-[720px] mx-auto px-4 py-6">
      <button type="button" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer mb-5 min-h-[44px]" style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-5 h-5" /> {step === 1 ? "Back" : "Previous Step"}
      </button>

      {/* Step 1: Type Selection */}
      {step === 1 && (
        <>
          <h1 className="text-[24px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Post an Opportunity</h1>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-3)" }}>Choose what type of opportunity you're posting</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {OPP_TYPES.map(t => {
              const Icon = t.icon;
              const selected = oppType === t.value;
              return (
                <GlassBox key={t.value} accent={t.color} onClick={() => setOppType(t.value)}
                  className={selected ? "ring-2 ring-current" : ""}
                  style={selected ? { borderLeftColor: t.color } : {}}>
                  <div className="flex flex-col items-center text-center gap-2 py-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}14` }}>
                      <Icon className="w-5 h-5" style={{ color: t.color }} />
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{t.label}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{t.desc}</span>
                  </div>
                </GlassBox>
              );
            })}
          </div>
          <Button onClick={() => { if (oppType) setStep(2); else toast.error("Select a type"); }} disabled={!oppType}
            className="w-full mt-6" style={{ height: 52, borderRadius: 14, background: typeColor }}>
            Continue →
          </Button>
        </>
      )}

      {/* Step 2: Details Form */}
      {step === 2 && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full" style={{ background: `${typeColor}14`, color: typeColor }}>
              {OPP_TYPES.find(t => t.value === oppType)?.label}
            </span>
            <h1 className="text-[22px] font-bold" style={{ color: "var(--text-1)" }}>Opportunity Details</h1>
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>{sectionLabel("Title *")}<Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Developer" style={inputStyle} /></div>

            {/* Description */}
            <div>{sectionLabel("Description")}<Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role, responsibilities..." rows={4} className="rounded-xl" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", borderRadius: 12, minHeight: 120 }} /></div>

            {/* Domain */}
            <div>{sectionLabel("Domain / Industry")}<Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. Engineering, Design" style={inputStyle} /></div>

            {/* Location */}
            <div>
              {sectionLabel("Location")}
              <div className="flex items-center gap-3 mb-2">
                <Switch checked={isRemote} onCheckedChange={setIsRemote} />
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Remote</span>
              </div>
              {!isRemote && <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State" style={inputStyle} />}
            </div>

            {/* Deadline */}
            <div>{sectionLabel("Application Deadline")}<Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} /></div>

            {/* Skills */}
            <div>
              {sectionLabel("Skills Required")}
              <div className="flex gap-2">
                <Input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Type skill + Enter"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} style={{ ...inputStyle, flex: 1 }} />
                <Button type="button" variant="outline" onClick={addSkill} style={{ height: 48, borderRadius: 12 }}><Plus className="w-4 h-4" /></Button>
              </div>
              {skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${typeColor}14`, color: typeColor }}>
                      {s} <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ─── JOB-SPECIFIC ─── */}
            {isJobType(oppType) && (
              <GlassBox accent={typeColor}>
                <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                  <DollarSign className="w-4 h-4 inline mr-1" />Compensation & Experience
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>{sectionLabel("Min Salary")}<Input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="e.g. 500000" style={inputStyle} /></div>
                  <div>{sectionLabel("Max Salary")}<Input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="e.g. 1200000" style={inputStyle} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    {sectionLabel("Currency")}
                    <select value={salaryCurrency} onChange={e => setSalaryCurrency(e.target.value)} className="w-full h-[48px] rounded-xl px-3 text-[14px]" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}>
                      <option value="INR">INR (₹)</option><option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>{sectionLabel("Min Experience (years)")}<Input type="number" value={experienceMin} onChange={e => setExperienceMin(e.target.value)} placeholder="0" style={inputStyle} /></div>
                </div>
                <div className="mt-3">{sectionLabel("Min Activity Score")}<Input type="number" value={activityScoreMin} onChange={e => setActivityScoreMin(e.target.value)} placeholder="0 (no minimum)" style={{ ...inputStyle, width: 200 }} /></div>
              </GlassBox>
            )}

            {/* ─── INTERNSHIP ─── */}
            {oppType === "internship" && (
              <GlassBox accent="#10B981">
                <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                  <GraduationCap className="w-4 h-4 inline mr-1" />Internship Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>{sectionLabel("Duration (months)")}<Input type="number" value={durationMonths} onChange={e => setDurationMonths(e.target.value)} placeholder="3" style={inputStyle} /></div>
                  <div>{sectionLabel("Stipend")}<Input value={stipend} onChange={e => setStipend(e.target.value)} placeholder="₹10,000/month" style={inputStyle} /></div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Switch checked={canConvert} onCheckedChange={setCanConvert} />
                  <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Can convert to full-time</span>
                </div>
              </GlassBox>
            )}

            {/* ─── FREELANCE/GIG ─── */}
            {isFreelanceType(oppType) && (
              <GlassBox accent="#F59E0B">
                <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                  <Code className="w-4 h-4 inline mr-1" />Project Details
                </p>
                <div>{sectionLabel("Project Duration")}<Input value={projectDuration} onChange={e => setProjectDuration(e.target.value)} placeholder="e.g. 2 months" style={inputStyle} /></div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>{sectionLabel("Budget Min")}<Input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="₹" style={inputStyle} /></div>
                  <div>{sectionLabel("Budget Max")}<Input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="₹" style={inputStyle} /></div>
                </div>
                <div className="mt-3">
                  {sectionLabel("Pricing Model")}
                  <div className="flex gap-2">
                    {["fixed", "hourly"].map(m => (
                      <button key={m} type="button" onClick={() => setPricingModel(m)}
                        className="px-4 py-2 rounded-full text-[13px] font-semibold"
                        style={{ background: pricingModel === m ? "#F59E0B" : "var(--surface-2)", color: pricingModel === m ? "#fff" : "var(--text-1)", border: pricingModel === m ? "none" : "1.5px solid var(--border-2)" }}>
                        {m === "fixed" ? "Fixed Price" : "Per Hour"}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassBox>
            )}

            {/* ─── HACKATHON ─── */}
            {oppType === "hackathon" && (
              <GlassBox accent="#8B5CF6">
                <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                  <Trophy className="w-4 h-4 inline mr-1" />Hackathon Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>{sectionLabel("Start Date")}<Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></div>
                  <div>{sectionLabel("End Date")}<Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>{sectionLabel("Team Min")}<Input type="number" value={teamSizeMin} onChange={e => setTeamSizeMin(e.target.value)} placeholder="1" style={inputStyle} /></div>
                  <div>{sectionLabel("Team Max")}<Input type="number" value={teamSizeMax} onChange={e => setTeamSizeMax(e.target.value)} placeholder="5" style={inputStyle} /></div>
                </div>
                <div className="mt-3">{sectionLabel("Prize Pool")}<Input value={prizePool} onChange={e => setPrizePool(e.target.value)} placeholder="e.g. ₹1,00,000" style={inputStyle} /></div>
                <div className="mt-3">{sectionLabel("Registration Deadline")}<Input type="date" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} style={inputStyle} /></div>
                <div className="mt-3">
                  {sectionLabel("Mode")}
                  <div className="flex gap-2">
                    {["offline", "online", "hybrid"].map(m => (
                      <button key={m} type="button" onClick={() => setEventMode(m)}
                        className="px-4 py-2 rounded-full text-[13px] font-semibold capitalize"
                        style={{ background: eventMode === m ? "#8B5CF6" : "var(--surface-2)", color: eventMode === m ? "#fff" : "var(--text-1)", border: eventMode === m ? "none" : "1.5px solid var(--border-2)" }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  {sectionLabel("Themes / Tracks")}
                  <div className="flex gap-2">
                    <Input value={themesInput} onChange={e => setThemesInput(e.target.value)} placeholder="Add theme + Enter"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTheme(); } }} style={{ ...inputStyle, flex: 1 }} />
                    <Button type="button" variant="outline" onClick={addTheme} style={{ height: 48, borderRadius: 12 }}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {themes.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {themes.map(t => (
                        <span key={t} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#8B5CF614", color: "#8B5CF6" }}>
                          {t} <button type="button" onClick={() => setThemes(themes.filter(x => x !== t))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </GlassBox>
            )}

            {/* ─── WALK-IN / CAMPUS ─── */}
            {(oppType === "walk_in_interview" || oppType === "campus_recruitment") && (
              <GlassBox accent="#EF4444">
                <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>
                  <CalendarDays className="w-4 h-4 inline mr-1" />Event Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>{sectionLabel("Date")}<Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle} /></div>
                  <div>{sectionLabel("Time")}<Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={inputStyle} /></div>
                </div>
                <div className="mt-3">{sectionLabel("Venue")}<Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Full address" style={inputStyle} /></div>
                <div className="mt-3">{sectionLabel("Positions Available")}<Input type="number" value={positionsAvailable} onChange={e => setPositionsAvailable(e.target.value)} placeholder="e.g. 10" style={{ ...inputStyle, width: 200 }} /></div>
                <div className="mt-3">
                  {sectionLabel("Documents to Bring")}
                  <div className="flex gap-2">
                    <Input value={docsInput} onChange={e => setDocsInput(e.target.value)} placeholder="e.g. Resume, ID proof + Enter"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDoc(); } }} style={{ ...inputStyle, flex: 1 }} />
                    <Button type="button" variant="outline" onClick={addDoc} style={{ height: 48, borderRadius: 12 }}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {documents.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {documents.map(d => (
                        <span key={d} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#EF444414", color: "#EF4444" }}>
                          {d} <button type="button" onClick={() => setDocuments(documents.filter(x => x !== d))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </GlassBox>
            )}

            <Button onClick={() => setStep(3)} disabled={!title.trim()} className="w-full" style={{ height: 52, borderRadius: 14, background: typeColor }}>
              Continue to Screening →
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Screening & Application Requirements */}
      {step === 3 && (
        <>
          <h1 className="text-[22px] font-bold mb-5" style={{ color: "var(--text-1)" }}>Screening & Requirements</h1>

          <div className="space-y-5">
            {/* Screening Questions */}
            <GlassBox accent={typeColor}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Screening Questions</p>
                <button type="button" onClick={() => setShowScreening(!showScreening)} className="cursor-pointer">
                  {showScreening ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />}
                </button>
              </div>
              {showScreening && (
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <Input value={q.question} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], question: e.target.value }; setQuestions(nq); }}
                        placeholder="Question text" style={inputStyle} />
                      <div className="flex gap-2 items-center">
                        <select value={q.type} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], type: e.target.value }; setQuestions(nq); }}
                          className="h-[40px] rounded-lg px-2 text-[12px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-1)" }}>
                          <option value="text">Short Text</option>
                          <option value="yes_no">Yes / No</option>
                          <option value="multiple_choice">Multiple Choice</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-3)" }}>
                          <input type="checkbox" checked={q.is_eliminatory} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], is_eliminatory: e.target.checked }; setQuestions(nq); }} />
                          Eliminatory
                        </label>
                        <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="ml-auto cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
                      </div>
                      {q.type === "multiple_choice" && (
                        <div className="space-y-1">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex gap-2 items-center">
                              <input type="checkbox" checked={q.correct.includes(opt)} onChange={e => {
                                const nq = [...questions];
                                nq[i] = { ...nq[i], correct: e.target.checked ? [...nq[i].correct, opt] : nq[i].correct.filter(c => c !== opt) };
                                setQuestions(nq);
                              }} />
                              <Input value={opt} onChange={e => { const nq = [...questions]; nq[i] = { ...nq[i], options: nq[i].options.map((o, j) => j === oi ? e.target.value : o) }; setQuestions(nq); }}
                                placeholder={`Option ${oi + 1}`} style={{ height: 36, borderRadius: 8, flex: 1, background: "var(--surface-2)", border: "1px solid var(--border-2)" }} />
                              <button type="button" onClick={() => { const nq = [...questions]; nq[i] = { ...nq[i], options: nq[i].options.filter((_, j) => j !== oi), correct: nq[i].correct.filter(c => c !== opt) }; setQuestions(nq); }} className="cursor-pointer"><X className="w-3 h-3" style={{ color: "var(--text-3)" }} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => { const nq = [...questions]; nq[i] = { ...nq[i], options: [...nq[i].options, ""] }; setQuestions(nq); }}
                            className="text-[12px] font-semibold cursor-pointer" style={{ color: typeColor }}><Plus className="w-3 h-3 inline" /> Add option</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {questions.length < 10 && (
                    <button type="button" onClick={addQuestion} className="flex items-center gap-1 text-[13px] font-semibold cursor-pointer" style={{ color: typeColor }}>
                      <Plus className="w-4 h-4" /> Add screening question
                    </button>
                  )}
                </div>
              )}
            </GlassBox>

            {/* Application Requirements */}
            <GlassBox accent="contact">
              <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Application Requirements</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Require Resume (PDF)</span>
                  <Switch checked={requireResume} onCheckedChange={setRequireResume} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Ask for Portfolio URL</span>
                  <Switch checked={askPortfolio} onCheckedChange={setAskPortfolio} />
                </div>
                <div>
                  {sectionLabel("Custom Attachment Label (optional)")}
                  <Input value={customAttachmentLabel} onChange={e => setCustomAttachmentLabel(e.target.value)} placeholder="e.g. Upload your design portfolio" style={inputStyle} />
                </div>
              </div>
            </GlassBox>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" style={{ height: 52, borderRadius: 14 }}>Back</Button>
              <Button onClick={handleSubmit} disabled={submitting || !title.trim()} className="flex-1" style={{ height: 52, borderRadius: 14, background: typeColor }}>
                {submitting ? "Posting..." : "Post Opportunity"}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
