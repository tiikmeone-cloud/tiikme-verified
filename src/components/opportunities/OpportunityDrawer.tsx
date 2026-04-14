import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Clock, Users, Shield, MapPin, Briefcase, CheckSquare, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Opportunity {
  type: string; typeLabel: string; typeColor: string; title: string;
  description: string; postedBy: string; verified: boolean; reward: string;
  deadline: string; daysLeft: string; solutions: number;
}

const screeningQuestions = [
  { id: "q1", question: "Do you have prior experience in this domain?", type: "toggle" as const },
  { id: "q2", question: "Briefly describe your relevant experience", type: "text" as const },
];

export function OpportunityDetailDrawer({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [showApply, setShowApply] = useState(false);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [selectedWork, setSelectedWork] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string | boolean>>({ q1: false, q2: "" });
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch real work items
  useEffect(() => {
    if (!user) return;
    supabase.from("work_items").select("id, title, domain, status").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setWorkItems(data || []));
  }, [user]);

  const toggleWork = (id: string) => {
    setSelectedWork(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Application submitted successfully!");
      setSubmitting(false); setShowApply(false); setShowConfirm(false);
      onClose();
    }, 800);
  };

  const displayName = profile?.full_name || "You";
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const roleColor = "#4F46E5";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-md h-full overflow-y-auto shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderLeft: "1px solid rgba(255,255,255,0.50)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.60)",
          backdropFilter: "blur(20px)",
        }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: opp.typeColor }}>{opp.typeLabel}</span>
            {opp.verified && <Shield className="w-3.5 h-3.5" style={{ color: "#10B981" }} />}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-[22px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>{opp.title}</h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{opp.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase, label: "Posted by", value: opp.postedBy },
              { icon: Clock, label: "Deadline", value: `${opp.deadline} (${opp.daysLeft})` },
              { icon: MapPin, label: "Compensation", value: opp.reward },
              ...(opp.solutions > 0 ? [{ icon: Users, label: "Applications", value: `${opp.solutions} submitted` }] : []),
            ].map(m => (
              <div key={m.label} className="glass-liquid rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{m.label}</span>
                </div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{m.value}</p>
              </div>
            ))}
          </div>

          {!showApply ? (
            <div className="flex gap-3">
              <Button className="flex-1 active:scale-95" onClick={() => setShowConfirm(true)}>
                Apply via Tiikme
              </Button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Apply to {opp.title}</h3>

              <div className="glass-liquid rounded-xl flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold text-white overflow-hidden" style={{ background: roleColor }}>
                  {profile?.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{displayName}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{profile?.role || "User"} · {profile?.institution_name || ""}</p>
                </div>
              </div>

              {workItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4" style={{ color: "var(--text-2)" }} />
                    <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>Attach your work</p>
                  </div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {workItems.map(w => (
                      <label key={w.id} className="flex items-center gap-3 glass-liquid rounded-lg p-3 cursor-pointer">
                        <Checkbox checked={selectedWork.includes(w.id)} onCheckedChange={() => toggleWork(w.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{w.title}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.domain || ""} · {w.status || ""}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-1)" }}>Screening Questions</p>
                <div className="space-y-3">
                  {screeningQuestions.map(q => (
                    <div key={q.id} className="glass-liquid rounded-xl p-3.5">
                      <p className="text-[13px] mb-2" style={{ color: "var(--text-1)" }}>{q.question}</p>
                      {q.type === "toggle" ? (
                        <button type="button" onClick={() => setScreeningAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))} className="flex items-center gap-2 cursor-pointer active:scale-95">
                          {screeningAnswers[q.id] ? <ToggleRight className="w-6 h-6" style={{ color: "var(--brand)" }} /> : <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-3)" }} />}
                          <span className="text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>{screeningAnswers[q.id] ? "Yes" : "No"}</span>
                        </button>
                      ) : (
                        <Input value={(screeningAnswers[q.id] as string) || ""} onChange={e => setScreeningAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Type your answer..." />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 active:scale-95" onClick={() => setShowApply(false)}>Cancel</Button>
                <Button className="flex-1 active:scale-95" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </motion.div>
          )}

          {showConfirm && !showApply && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-liquid rounded-2xl p-6 text-center space-y-4">
              <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Attach your verified portfolio?</p>
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Your Tiikme-verified work items will be shared with the poster.</p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 active:scale-95" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1 active:scale-95" onClick={() => { setShowConfirm(false); setShowApply(true); }}>Yes, continue</Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
