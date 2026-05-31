import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles, X, Upload, ChevronRight, Check, Loader2,
  Briefcase, GraduationCap, User, FileText, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ── types ── */
interface StructuredProfile {
  headline?: string;
  bio?: string;
  experiences: Array<{
    job_title: string;
    company_name: string;
    employment_type?: string;
    start_month?: string;
    start_year?: number;
    end_month?: string;
    end_year?: number;
    is_current?: boolean;
    description?: string;
    work_location?: string;
    skills_used?: string[];
  }>;
  education: Array<{
    degree_type?: string;
    field_of_study?: string;
    institution_name_edu: string;
    grade_score?: string;
    start_year?: number;
    end_year?: number;
  }>;
  skills: string[];
}

type BlockKind = "headline" | "bio" | "experience" | "education" | "skills";
type BlockState = "pending" | "approved" | "skipped";

interface Block {
  kind: BlockKind;
  value: any;
  state: BlockState;
}

/* ── ReviewBlock ── */
const ReviewBlock = ({ block, onApprove, onSkip }: { block: Block; onApprove: () => void; onSkip: () => void }) => {
  const approved = block.state === "approved";
  const skipped = block.state === "skipped";

  const borderColor = approved ? "#16A34A" : skipped ? "var(--border-subtle)" : "rgba(232,115,58,0.3)";
  const opacity = skipped ? 0.4 : 1;

  const icon =
    block.kind === "experience" ? <Briefcase style={{ width: 14, height: 14, color: "#FF5A1F" }} /> :
    block.kind === "education" ? <GraduationCap style={{ width: 14, height: 14, color: "#34C759" }} /> :
    block.kind === "skills" ? <Tag style={{ width: 14, height: 14, color: "#E8733A" }} /> :
    block.kind === "headline" ? <User style={{ width: 14, height: 14, color: "#6366F1" }} /> :
    <FileText style={{ width: 14, height: 14, color: "var(--text-3)" }} />;

  const label =
    block.kind === "experience" ? `${block.value.job_title || "Role"} at ${block.value.company_name}` :
    block.kind === "education" ? `${block.value.degree_type || "Degree"} · ${block.value.institution_name_edu}` :
    block.kind === "headline" ? "Professional Headline" :
    block.kind === "bio" ? "Summary" :
    "Skills";

  const sublabel =
    block.kind === "experience" ? [block.value.employment_type, block.value.work_location, block.value.start_year && `${block.value.start_month ? block.value.start_month + " " : ""}${block.value.start_year} – ${block.value.is_current ? "Present" : block.value.end_year || "?"}`].filter(Boolean).join(" · ") :
    block.kind === "education" ? [block.value.field_of_study, [block.value.start_year, block.value.end_year].filter(Boolean).join(" – "), block.value.grade_score].filter(Boolean).join(" · ") :
    block.kind === "headline" ? (block.value as string) :
    block.kind === "bio" ? (block.value as string).slice(0, 160) + ((block.value as string).length > 160 ? "…" : "") :
    null;

  return (
    <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: "12px 14px", opacity, transition: "all 0.15s" }}>
      <div className="flex items-start" style={{ gap: 10 }}>
        <div className="flex items-center" style={{ gap: 6, flex: 1, minWidth: 0 }}>
          {icon}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
            {sublabel && <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: "16px" }}>{sublabel}</p>}
            {block.kind === "experience" && block.value.description && (
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, lineHeight: "16px" }}>{block.value.description.slice(0, 120)}{block.value.description.length > 120 ? "…" : ""}</p>
            )}
            {block.kind === "skills" && (
              <div className="flex flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                {(block.value as string[]).slice(0, 8).map((s: string) => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "rgba(232,115,58,0.10)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.20)" }}>{s}</span>
                ))}
                {(block.value as string[]).length > 8 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>+{(block.value as string[]).length - 8} more</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(232,115,58,0.7)", background: "rgba(232,115,58,0.08)", padding: "2px 6px", borderRadius: 4 }}>AI draft</span>
          <button type="button" onClick={onSkip} title="Skip" style={{ width: 26, height: 26, borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border-glass)", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
          <button type="button" onClick={onApprove} title={approved ? "Approved" : "Approve"} style={{ width: 26, height: 26, borderRadius: 6, background: approved ? "#16A34A" : "var(--surface-2)", border: `1px solid ${approved ? "#16A34A" : "var(--border-glass)"}`, color: approved ? "white" : "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ── */
interface Props {
  onApplied: () => void;
}

export default function AIProfileBuilder({ onApplied }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "thinking" | "review" | "applying" | "done">("input");
  const [rawText, setRawText] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 600_000) { toast.error("File too large — max 600 KB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string) || "";
      // Keep printable characters from the file (works for text-based PDFs)
      const cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      const text = cleaned.length > 100 ? cleaned : raw.replace(/\s+/g, " ").trim();
      if (text.length < 80) {
        toast.error("Could not read text from this file. Please paste your resume text directly.");
      } else {
        setRawText(text.slice(0, 8000));
        toast.success("File loaded — review and click Build");
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const handleBuild = async () => {
    if (rawText.trim().length < 30) {
      toast.error("Please add at least a few lines of your career background");
      return;
    }
    setStep("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("structure-profile", {
        body: { raw_text: rawText.trim() },
      });
      if (error || !data?.ok) {
        toast.error(data?.error || error?.message || "AI builder failed — please try again");
        setStep("input");
        return;
      }
      const structured: StructuredProfile = data.data;
      const newBlocks: Block[] = [];
      if (structured.headline) newBlocks.push({ kind: "headline", value: structured.headline, state: "pending" });
      if (structured.bio) newBlocks.push({ kind: "bio", value: structured.bio, state: "pending" });
      for (const exp of structured.experiences || []) {
        if (exp.job_title || exp.company_name) newBlocks.push({ kind: "experience", value: exp, state: "pending" });
      }
      for (const edu of structured.education || []) {
        if (edu.institution_name_edu) newBlocks.push({ kind: "education", value: edu, state: "pending" });
      }
      if (structured.skills?.length) newBlocks.push({ kind: "skills", value: structured.skills, state: "pending" });
      if (newBlocks.length === 0) {
        toast.error("Nothing could be extracted. Try adding more detail to your text.");
        setStep("input");
        return;
      }
      setBlocks(newBlocks);
      setStep("review");
    } catch (e: any) {
      toast.error(e?.message || "Network error — check your connection");
      setStep("input");
    }
  };

  const toggle = (idx: number, to: BlockState) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, state: to } : b));
  };

  const approvedBlocks = blocks.filter(b => b.state === "approved");

  const handleApply = async () => {
    if (!user || approvedBlocks.length === 0) return;
    setStep("applying");
    try {
      const profileUpdates: Record<string, any> = {};
      const workItemsToInsert: any[] = [];
      for (const block of approvedBlocks) {
        if (block.kind === "headline") profileUpdates.headline = block.value;
        else if (block.kind === "bio") profileUpdates.bio = block.value;
        else if (block.kind === "skills") profileUpdates.skills = block.value as string[];
        else if (block.kind === "experience") {
          const exp = block.value;
          workItemsToInsert.push({
            owner_id: user.id,
            item_type: "experience",
            type: "experience",
            title: exp.job_title || "Role",
            job_title: exp.job_title || null,
            company_name: exp.company_name || null,
            institution_name: exp.company_name || null,
            employment_type: exp.employment_type || null,
            start_month: exp.start_month || null,
            start_year: exp.start_year ? Number(exp.start_year) : null,
            end_month: exp.is_current ? null : (exp.end_month || null),
            end_year: exp.is_current ? null : (exp.end_year ? Number(exp.end_year) : null),
            is_current: !!exp.is_current,
            description: exp.description || null,
            work_location: exp.work_location || null,
            skills_used: Array.isArray(exp.skills_used) ? exp.skills_used : [],
            status: "active",
            visibility: "public",
            verification_status: "unverified",
          });
        } else if (block.kind === "education") {
          const edu = block.value;
          workItemsToInsert.push({
            owner_id: user.id,
            item_type: "education",
            type: "education",
            title: [edu.degree_type, edu.field_of_study].filter(Boolean).join(" in ") || edu.institution_name_edu,
            degree_type: edu.degree_type || null,
            field_of_study: edu.field_of_study || null,
            institution_name_edu: edu.institution_name_edu,
            institution_name: edu.institution_name_edu,
            grade_score: edu.grade_score || null,
            start_year: edu.start_year ? Number(edu.start_year) : null,
            end_year: edu.end_year ? Number(edu.end_year) : null,
            start_date: edu.start_year ? `${edu.start_year}-01-01` : null,
            end_date: edu.end_year ? `${edu.end_year}-12-31` : null,
            is_current: !edu.end_year,
            status: "active",
            visibility: "public",
            verification_status: "unverified",
          });
        }
      }
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
        if (error) throw new Error(error.message);
      }
      if (workItemsToInsert.length > 0) {
        const { error } = await supabase.from("work_items").insert(workItemsToInsert as any);
        if (error) throw new Error(error.message);
      }
      // Trigger embedding (non-critical — don't fail if this errors)
      try {
        const embedText = [
          profileUpdates.headline,
          profileUpdates.bio,
          Array.isArray(profileUpdates.skills) ? profileUpdates.skills.join(", ") : "",
        ].filter(Boolean).join(" ");
        if (embedText) {
          await supabase.functions.invoke("embed-content", {
            body: { type: "profile", id: user.id, text: embedText },
          });
        }
      } catch (_) { /* non-critical */ }

      setStep("done");
      toast.success(`${approvedBlocks.length} block${approvedBlocks.length !== 1 ? "s" : ""} added to your profile`);
      setTimeout(() => { close(); onApplied(); }, 1500);
    } catch (e: any) {
      toast.error(e?.message || "Save failed — please try again");
      setStep("review");
    }
  };

  const close = () => {
    setOpen(false);
    setStep("input");
    setRawText("");
    setBlocks([]);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full cursor-pointer"
        style={{ background: "linear-gradient(135deg, rgba(255,90,31,0.12), rgba(232,115,58,0.08))", border: "1.5px solid rgba(232,115,58,0.30)", borderRadius: 12, padding: "10px 14px" }}
      >
        <Sparkles style={{ width: 18, height: 18, color: "#E8733A", flexShrink: 0 }} />
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#E8733A", lineHeight: "16px" }}>Build profile with AI</p>
          <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: "15px", marginTop: 2 }}>Paste your CV or LinkedIn text — AI structures it instantly</p>
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: "var(--text-3)", marginLeft: "auto", flexShrink: 0 }} />
      </button>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={close}
    >
      <div
        className="relative flex flex-col"
        style={{ background: "var(--bg-card)", borderRadius: 20, width: "min(580px,95vw)", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,0.40)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center shrink-0" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-glass)", gap: 10 }}>
          <Sparkles style={{ width: 18, height: 18, color: "#E8733A" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", flex: 1 }}>Build profile with AI</span>
          {step === "input" && <span style={{ fontSize: 11, color: "var(--text-3)" }}>Step 1 of 2</span>}
          {step === "review" && <span style={{ fontSize: 11, color: "var(--text-3)" }}>Step 2 of 2</span>}
          <button type="button" onClick={close} style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {step === "input" && (
            <>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14, lineHeight: "19px" }}>
                Paste your LinkedIn summary, resume text, or just describe your career background in a few sentences. AI will extract your experience, education, skills, and headline.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value.slice(0, 8000))}
                autoFocus
                placeholder={"e.g. I'm a software engineer with 5 years of experience. I worked at Google as a Senior SWE (2020–2023) building search infrastructure, and at Swiggy as a backend engineer (2018–2020). I studied Computer Science at IIT Bombay (2014–2018). Key skills: Python, Go, distributed systems…"}
                style={{ width: "100%", minHeight: 200, background: "var(--surface-2)", border: "1.5px solid var(--border-glass)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "var(--text-1)", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <div className="flex items-center" style={{ gap: 10, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{rawText.length}/8000</span>
                <div style={{ flex: 1 }} />
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={handleFileUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 cursor-pointer" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 12px" }}>
                  <Upload style={{ width: 13, height: 13 }} /> Upload file
                </button>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>PDF/TXT/DOC · 600 KB max</span>
              </div>
            </>
          )}

          {step === "thinking" && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "56px 0", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <Sparkles style={{ width: 36, height: 36, color: "#E8733A" }} />
                <Loader2 style={{ width: 52, height: 52, color: "rgba(232,115,58,0.3)", position: "absolute", top: -8, left: -8, animation: "spin 1.2s linear infinite" }} />
              </div>
              <p style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 600 }}>Reading your career story…</p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Usually takes 5–10 seconds</p>
            </div>
          )}

          {step === "review" && (
            <>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-2)", flex: 1, lineHeight: "18px" }}>
                  AI extracted {blocks.length} block{blocks.length !== 1 ? "s" : ""}. Approve what you want on your profile — skip the rest.
                </p>
                {approvedBlocks.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {approvedBlocks.length} approved
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocks.map((block, idx) => (
                  <ReviewBlock
                    key={idx}
                    block={block}
                    onApprove={() => toggle(idx, block.state === "approved" ? "pending" : "approved")}
                    onSkip={() => toggle(idx, block.state === "skipped" ? "pending" : "skipped")}
                  />
                ))}
              </div>
            </>
          )}

          {step === "applying" && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "56px 0", gap: 16 }}>
              <Loader2 style={{ width: 36, height: 36, color: "#E8733A", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Saving to your profile…</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "56px 0", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check style={{ width: 32, height: 32, color: "#16A34A" }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Profile updated!</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>Review each section and add any missing details to complete your profile.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "input" || step === "review") && (
          <div className="flex items-center shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid var(--border-glass)", gap: 10, justifyContent: "flex-end" }}>
            {step === "input" && (
              <>
                <button type="button" onClick={close} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--surface-2)", border: "1px solid var(--border-glass)", color: "var(--text-2)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBuild}
                  disabled={rawText.trim().length < 30}
                  style={{ padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: rawText.trim().length < 30 ? "var(--surface-2)" : "#E8733A", color: rawText.trim().length < 30 ? "var(--text-3)" : "white", border: "none", cursor: rawText.trim().length < 30 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Sparkles style={{ width: 14, height: 14 }} />
                  Build my profile
                </button>
              </>
            )}
            {step === "review" && (
              <>
                <button type="button" onClick={() => setStep("input")} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--surface-2)", border: "1px solid var(--border-glass)", color: "var(--text-2)", cursor: "pointer" }}>
                  ← Edit text
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={approvedBlocks.length === 0}
                  style={{ padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: approvedBlocks.length === 0 ? "var(--surface-2)" : "#16A34A", color: approvedBlocks.length === 0 ? "var(--text-3)" : "white", border: "none", cursor: approvedBlocks.length === 0 ? "not-allowed" : "pointer" }}
                >
                  Apply {approvedBlocks.length > 0 ? approvedBlocks.length : ""} block{approvedBlocks.length !== 1 ? "s" : ""} →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
