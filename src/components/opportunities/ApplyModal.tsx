import { useState } from "react";
import { X, Upload, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { storageImageUrl } from "@/lib/imageTransform";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ActivityScoreRing from "@/components/ActivityScoreRing";

interface Props {
  open: boolean;
  onClose: () => void;
  opportunity: any;
  orgName?: string;
  onApplied: () => void;
}

export default function ApplyModal({ open, onClose, opportunity, orgName, onApplied }: Props) {
  const { user, profile } = useAuth();
  const [whyFit, setWhyFit] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const customQuestions: any[] = opportunity?.screening_questions || opportunity?.custom_questions || [];

  const handleResumeUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Only PDF files are accepted"); return; }
    setResumeFile(file);
    setResumeUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
      if (error) { toast.error(error.message); setResumeUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(data.path);
      setResumeUrl(publicUrl);
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    setResumeUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !consent) return;
    setSubmitting(true);
    try {
      // Check eliminatory questions for auto-reject
      let autoRejected = false;
      if (customQuestions.length > 0) {
        for (let i = 0; i < customQuestions.length; i++) {
          const q = customQuestions[i];
          if (!q.is_eliminatory) continue;
          const userAnswer = answers[i];
          if (q.type === "yes_no" || q.type === "yesno" || q.type === "Yes or No") {
            // For yes/no eliminatory: if correct answers specified, check match
            if (q.correct?.length > 0 && !q.correct.includes(userAnswer)) {
              autoRejected = true; break;
            }
          } else if (q.type === "multiple_choice") {
            if (q.correct?.length > 0 && !q.correct.includes(userAnswer)) {
              autoRejected = true; break;
            }
          }
        }
      }

      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: opportunity.id,
        applicant_id: user.id,
        why_good_fit: whyFit.trim() || null,
        resume_url: resumeUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        cover_letter: coverLetter.trim() || null,
        custom_answers: Object.keys(answers).length > 0 ? answers : null,
        status: autoRejected ? "auto_rejected" : "reviewing",
      });
      if (error) {
        if (error.code === "23505") toast.error("You already applied");
        else throw error;
        setSubmitting(false);
        return;
      }
      // Increment applicant count
      try {
        await supabase.from("opportunities")
          .update({ responses_count: (opportunity.responses_count || 0) + 1 })
          .eq("id", opportunity.id);
      } catch {}
      // Send alert to poster
      if (opportunity.poster_id) {
        await supabase.from("alerts").insert({
          user_id: opportunity.poster_id, type: "opportunity",
          title: `New application for "${opportunity.title}"`,
          body: `${profile?.full_name || "Someone"} applied.`,
          action_url: `/app/opportunities`,
        });
      }
      setSuccess(true);
      onApplied();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    }
    setSubmitting(false);
  };

  if (!open) return null;

  const displayOrg = orgName || "this organization";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}>

        {success ? (
          <div className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
              <CheckCircle className="w-6 h-6" style={{ color: "#16A34A" }} />
            </motion.div>
            <h3 className="text-[22px] font-bold mb-2" style={{ color: "#1A1A1A" }}>Application submitted! 🎉</h3>
            <p className="text-[14px] mb-6" style={{ color: "#9CA3AF" }}>You'll hear back in your Alerts and Pings.</p>
            <Button type="button" variant="outline" onClick={onClose} style={{ borderRadius: 12, height: 44 }}>View Opportunity</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-bold" style={{ color: "#1A1A1A" }}>{opportunity.title}</h2>
                <p className="text-[14px]" style={{ color: "#9CA3AF" }}>{displayOrg}</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "#9CA3AF" }}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Profile preview */}
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #ECECEA" }}>
                <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "U"} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-bold" style={{ color: "#1A1A1A" }}>{profile?.full_name || "You"}</p>
                  <p className="text-[13px]" style={{ color: "#6B6B6B" }}>{profile?.headline || profile?.role || ""}</p>
                </div>
                <ActivityScoreRing score={profile?.activity_score || 0} size={40} />
              </div>
              <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Your profile will be shared with {displayOrg}</p>

              {/* Section 2: Why good fit */}
              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Why are you the right person for this role?</label>
                <Textarea value={whyFit} onChange={e => setWhyFit(e.target.value)} placeholder="Tell them what makes you stand out..." rows={3}
                  style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14, minHeight: 96 }} />
              </div>

              {/* Section 3: Resume */}
              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Resume / CV</label>
                <label className="flex flex-col items-center justify-center cursor-pointer rounded-xl p-4" style={{ border: "2px dashed #E5E7EB", minHeight: 80, background: "#FAFAFA" }}>
                  {resumeFile ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" style={{ color: "#FA903E" }} />
                      <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>{resumeFile.name}</span>
                      {resumeUploading && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>Uploading...</span>}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mb-1" style={{ color: "#9CA3AF" }} />
                      <span className="text-[13px]" style={{ color: "#9CA3AF" }}>Upload your resume (PDF only, max 10MB)</span>
                    </>
                  )}
                  <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
                </label>
                <div className="text-center text-[12px] my-2" style={{ color: "#9CA3AF" }}>— or —</div>
                <Input value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="Paste a link (Google Drive, Dropbox, etc.)"
                  style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
              </div>

              {/* Section 4: Portfolio */}
              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Portfolio (optional)</label>
                <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="Your portfolio, GitHub, Behance, or work samples link"
                  style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
              </div>

              {/* Section 5: Cover letter */}
              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Cover letter (optional)</label>
                <Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={2}
                  style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14, minHeight: 80 }} />
              </div>

              {/* Section 6: Screening questions */}
              {customQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Screening Questions</p>
                  {customQuestions.map((q: any, i: number) => (
                    <div key={i}>
                      <p className="text-[13px] mb-1.5" style={{ color: "#6B6B6B" }}>
                        {q.question || q.text || q}
                        {q.is_eliminatory && <span className="text-[10px] ml-1" style={{ color: "#DC2626" }}>*</span>}
                      </p>
                      {(q.type === "yes_no" || q.type === "yesno" || q.type === "Yes or No") ? (
                        <div className="flex gap-2">
                          {["Yes", "No"].map(opt => (
                            <button key={opt} type="button" onClick={() => setAnswers(prev => ({ ...prev, [i]: opt }))}
                              className="px-4 py-2 rounded-full text-[13px] font-semibold"
                              style={{ background: answers[i] === opt ? "#FA903E" : "#fff", color: answers[i] === opt ? "#fff" : "#1A1A1A", border: answers[i] === opt ? "1.5px solid #FA903E" : "1.5px solid #E5E7EB" }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : q.type === "multiple_choice" && q.options?.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {q.options.map((opt: string) => (
                            <button key={opt} type="button" onClick={() => setAnswers(prev => ({ ...prev, [i]: opt }))}
                              className="px-4 py-2 rounded-full text-[13px] font-semibold"
                              style={{ background: answers[i] === opt ? "#FA903E" : "#fff", color: answers[i] === opt ? "#fff" : "#1A1A1A", border: answers[i] === opt ? "1.5px solid #FA903E" : "1.5px solid #E5E7EB" }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Input value={answers[i] || ""} onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))} placeholder="Your answer"
                          style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Section 7: Consent */}
              <label className="flex items-start gap-2 text-[13px] cursor-pointer" style={{ color: "#1A1A1A" }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
                I agree that my Tiikme profile will be shared with {displayOrg}
              </label>

              <Button type="submit" className="w-full" disabled={!consent || submitting || resumeUploading}
                style={{ height: 52, borderRadius: 12, background: "#FA903E", color: "#FFFFFF" }}>
                {submitting ? "Submitting..." : "Submit Application →"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}