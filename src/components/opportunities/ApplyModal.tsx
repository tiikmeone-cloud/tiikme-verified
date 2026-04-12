import { useState } from "react";
import { X, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { storageImageUrl } from "@/lib/imageTransform";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !consent) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: opportunity.id,
        applicant_id: user.id,
        why_good_fit: whyFit.trim() || null,
        resume_url: resumeUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        cover_letter: coverLetter.trim() || null,
        status: "reviewing",
      });
      if (error) {
        if (error.code === "23505") toast.error("You already applied");
        else throw error;
        setSubmitting(false);
        return;
      }
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
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}>

        {success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
              <CheckCircle className="w-6 h-6" style={{ color: "#16A34A" }} />
            </div>
            <h3 className="text-[20px] font-bold mb-2" style={{ color: "#1A1A1A" }}>Application submitted! 🎉</h3>
            <p className="text-[14px] mb-6" style={{ color: "#9CA3AF" }}>You'll receive an update in your Alerts</p>
            <Button onClick={onClose} style={{ background: "#E8580A", color: "#fff", borderRadius: 12, height: 44 }}>Close</Button>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FFF8F2", border: "1px solid #F0E8E0" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white overflow-hidden" style={{ background: "#E8580A" }}>
                  {profile?.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (profile?.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold" style={{ color: "#1A1A1A" }}>{profile?.full_name || "You"}</p>
                  <p className="text-[13px]" style={{ color: "#6B6B6B" }}>{profile?.headline || profile?.role || ""}</p>
                </div>
                <ActivityScoreRing score={profile?.activity_score || 0} size={40} />
              </div>
              <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Your profile will be shared with {displayOrg}</p>

              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Why are you a good fit? (optional)</label>
                <Textarea value={whyFit} onChange={e => setWhyFit(e.target.value)} placeholder="What makes you the right person for this role?" rows={3}
                  style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14 }} />
              </div>

              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Resume/CV link</label>
                <Input value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="Google Drive / Dropbox link"
                  style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
              </div>

              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Portfolio (optional)</label>
                <Input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="GitHub, portfolio, work samples"
                  style={{ height: 48, background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8 }} />
              </div>

              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Cover letter (optional)</label>
                <Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={2}
                  style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 8, color: "#1A1A1A", fontSize: 14 }} />
              </div>

              <label className="flex items-start gap-2 text-[13px] cursor-pointer" style={{ color: "#1A1A1A" }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
                I agree my Tiikme profile will be shared with {displayOrg}
              </label>

              <Button type="submit" className="w-full" disabled={!consent || submitting}
                style={{ height: 52, borderRadius: 12, background: "#E8580A", color: "#FFFFFF" }}>
                {submitting ? "Submitting..." : "Submit Application →"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
