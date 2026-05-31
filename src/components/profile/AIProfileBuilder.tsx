import { useState } from "react";
import { Sparkles, X, ChevronRight, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StructuredExperience {
  job_title: string;
  company_name: string;
  employment_type: string;
  start_month: string | null;
  start_year: number | null;
  end_month: string | null;
  end_year: number | null;
  is_current: boolean;
  description: string;
  work_location: string | null;
  skills_used: string[];
}

interface StructuredEducation {
  institution_name_edu: string;
  degree_type: string;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  grade_score: string | null;
}

interface StructuredProfile {
  headline: string;
  bio: string;
  experiences: StructuredExperience[];
  education: StructuredEducation[];
  skills: string[];
}

interface Props {
  onApplied: () => void;
}

type Step = "input" | "preview" | "applying" | "done";

export default function AIProfileBuilder({ onApplied }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [structured, setStructured] = useState<StructuredProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    setStep("input");
    setRawText("");
    setStructured(null);
    setError(null);
  };

  const handleStructure = async () => {
    if (!rawText.trim() || rawText.trim().length < 30) {
      setError("Please paste at least a few sentences about your work history.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("structure-profile", {
        body: { raw_text: rawText },
      });
      if (fnError || !data?.ok) {
        setError((data?.error as string) || fnError?.message || "Something went wrong — try again.");
        return;
      }
      setStructured(data.data as StructuredProfile);
      setStep("preview");
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!structured || !user) return;
    setStep("applying");
    try {
      // 1. Update profile headline + bio
      const profileUpdates: Record<string, unknown> = {};
      if (structured.headline) profileUpdates.headline = structured.headline;
      if (structured.bio) profileUpdates.bio = structured.bio;
      if (structured.skills?.length) profileUpdates.skills = structured.skills; // text[] column, pass array directly
      if (Object.keys(profileUpdates).length) {
        await supabase.from("profiles").update(profileUpdates as any).eq("id", user.id);
      }

      // 2. Insert work experiences
      if (structured.experiences?.length) {
        const expRows = structured.experiences.map((e, idx) => ({
          owner_id: user.id,
          type: "experience",
          item_type: "experience",
          job_title: e.job_title || null,
          company_name: e.company_name || null,
          employment_type: e.employment_type || "Full-time",
          start_month: e.start_month || null,
          start_year: e.start_year || null,
          end_month: e.is_current ? null : (e.end_month || null),
          end_year: e.is_current ? null : (e.end_year || null),
          is_current: e.is_current ?? false,
          description: e.description || null,
          work_location: e.work_location || null,
          skills_used: e.skills_used?.length ? e.skills_used : null,
          display_order: idx,
          visibility: "public",
          verification_status: "unverified",
        }));
        await supabase.from("work_items").insert(expRows as any);
      }

      // 3. Insert education
      if (structured.education?.length) {
        const eduRows = structured.education.map((e, idx) => ({
          owner_id: user.id,
          type: "education",
          item_type: "education",
          institution_name_edu: e.institution_name_edu || null,
          degree_type: e.degree_type || null,
          field_of_study: e.field_of_study || null,
          start_year: e.start_year || null,
          end_year: e.end_year || null,
          grade_score: e.grade_score || null,
          display_order: idx,
          visibility: "public",
          verification_status: "unverified",
        }));
        await supabase.from("work_items").insert(eduRows as any);
      }

      setStep("done");
      toast.success("Profile structured and saved!");
      setTimeout(() => {
        handleClose();
        onApplied();
      }, 1500);
    } catch (err) {
      console.error("[AIProfileBuilder] apply error:", err);
      setError("Failed to save — try again.");
      setStep("preview");
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 cursor-pointer"
        style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: "linear-gradient(135deg, rgba(232,115,58,0.12), rgba(255,107,157,0.12))",
          color: "#E8733A", border: "1px solid rgba(232,115,58,0.25)",
        }}
      >
        <Sparkles style={{ width: 14, height: 14 }} />
        Let AI structure my profile
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:pl-[220px]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        >
          <div
            className="w-full md:max-w-[560px] mx-auto md:mx-4"
            style={{
              background: "var(--bg-card)",
              borderRadius: "20px 20px 0 0",
              padding: 24,
              maxHeight: "90dvh",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <div className="flex items-center gap-2">
                <Sparkles style={{ width: 18, height: 18, color: "#E8733A" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
                  {step === "preview" ? "Review structured profile" :
                   step === "applying" ? "Applying…" :
                   step === "done" ? "Done!" :
                   "Let AI structure your profile"}
                </span>
              </div>
              <button type="button" onClick={handleClose} className="cursor-pointer" style={{ color: "var(--text-3)", padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Step: input */}
            {step === "input" && (
              <>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16, lineHeight: "20px" }}>
                  Paste your work history, LinkedIn summary, or old resume text below. Tiikme AI will extract your experience, education, and skills — you review before anything is saved.
                </p>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste your resume, work history, or LinkedIn About section here…"
                  style={{
                    width: "100%", minHeight: 220, padding: 14, borderRadius: 12, fontSize: 13,
                    border: "1.5px solid var(--border-glass)", background: "var(--surface-2)",
                    color: "var(--text-1)", resize: "vertical", lineHeight: "20px", outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, marginBottom: 16 }}>
                  {rawText.length} / 8000 characters
                </div>
                {error && (
                  <div className="flex items-center gap-2" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{error}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleStructure}
                  disabled={loading || rawText.trim().length < 30}
                  className="w-full cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    height: 48, borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
                    color: "#fff", border: "none", opacity: loading || rawText.trim().length < 30 ? 0.6 : 1,
                  }}
                >
                  {loading ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Analysing…</> : <><Sparkles style={{ width: 16, height: 16 }} /> Structure my profile</>}
                </button>
              </>
            )}

            {/* Step: preview */}
            {step === "preview" && structured && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Headline + bio */}
                  {(structured.headline || structured.bio) && (
                    <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border-glass)" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Profile summary</p>
                      {structured.headline && <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>{structured.headline}</p>}
                      {structured.bio && <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: "18px" }}>{structured.bio}</p>}
                    </div>
                  )}

                  {/* Experiences */}
                  {structured.experiences?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                        {structured.experiences.length} Experience{structured.experiences.length > 1 ? "s" : ""}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {structured.experiences.map((e, i) => (
                          <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-glass)" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{e.job_title}</p>
                            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                              {e.company_name} · {e.employment_type}
                              {e.start_year ? ` · ${e.start_month ? e.start_month + " " : ""}${e.start_year}` : ""}
                              {e.is_current ? " – Present" : e.end_year ? ` – ${e.end_month ? e.end_month + " " : ""}${e.end_year}` : ""}
                            </p>
                            {e.description && <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, lineHeight: "17px" }}>{e.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {structured.education?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                        {structured.education.length} Education entr{structured.education.length > 1 ? "ies" : "y"}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {structured.education.map((e, i) => (
                          <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-glass)" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{e.degree_type}{e.field_of_study ? ` in ${e.field_of_study}` : ""}</p>
                            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                              {e.institution_name_edu}
                              {e.start_year || e.end_year ? ` · ${e.start_year || ""}${e.start_year && e.end_year ? "–" : ""}${e.end_year || ""}` : ""}
                              {e.grade_score ? ` · ${e.grade_score}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {structured.skills?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                        {structured.skills.length} Skills
                      </p>
                      <div className="flex flex-wrap" style={{ gap: 6 }}>
                        {structured.skills.map((s, i) => (
                          <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 999, background: "rgba(232,115,58,0.10)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.18)" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2" style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{error}</span>
                  </div>
                )}

                <div className="flex gap-3" style={{ marginTop: 20 }}>
                  <button type="button" onClick={() => setStep("input")} className="cursor-pointer flex-1"
                    style={{ height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border-glass)" }}>
                    Edit input
                  </button>
                  <button type="button" onClick={handleApply} className="cursor-pointer flex-1 flex items-center justify-center gap-2"
                    style={{ height: 44, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
                    <ChevronRight style={{ width: 16, height: 16 }} /> Apply to profile
                  </button>
                </div>
              </>
            )}

            {/* Step: applying / done */}
            {(step === "applying" || step === "done") && (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: 160, gap: 16 }}>
                {step === "applying" ? (
                  <Loader2 style={{ width: 36, height: 36, color: "#E8733A", animation: "spin 1s linear infinite" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(52,199,89,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 24, height: 24, color: "#34C759" }} />
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                  {step === "applying" ? "Saving your profile…" : "Profile updated!"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
