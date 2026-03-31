import { useState } from "react";
import { motion } from "framer-motion";
import { X, Clock, Users, Shield, MapPin, Briefcase, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Opportunity {
  type: string;
  typeLabel: string;
  typeColor: string;
  title: string;
  description: string;
  postedBy: string;
  verified: boolean;
  reward: string;
  deadline: string;
  daysLeft: string;
  solutions: number;
}

const mockWorkItems = [
  { id: "w1", title: "TelemedicineRx", domain: "HealthTech", status: "Active" },
  { id: "w2", title: "SmartGrid Monitor", domain: "IoT", status: "Completed" },
  { id: "w3", title: "AgriSense Dashboard", domain: "AgriTech", status: "Active" },
];

const fullJD = `We are looking for innovative solutions that address real-world problems in this domain. Ideal candidates will have hands-on experience with relevant technologies and a track record of delivering quality work.

Requirements:
• Strong understanding of the problem domain
• Demonstrated ability to build and ship products
• Experience with modern tech stacks (React, Node.js, Python, etc.)
• Ability to work independently or in small teams
• Portfolio of relevant work on Tiikme

What we offer:
• Competitive compensation as listed
• Mentorship from industry experts
• Opportunity to scale your solution nationally
• Tiik Verified badge on completion
• Letter of recommendation / experience certificate`;

export function OpportunityDetailDrawer({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const [showApply, setShowApply] = useState(false);
  const [selectedWork, setSelectedWork] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleWork = (id: string) => {
    setSelectedWork(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Application submitted successfully!");
      setSubmitting(false);
      setShowApply(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-xl h-full overflow-y-auto border-l border-border/30"
        style={{ background: "var(--surface)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border/30" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: opp.typeColor }}>{opp.typeLabel}</span>
            {opp.verified && <Shield className="w-3.5 h-3.5 text-[#10B981]" />}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 cursor-pointer active:scale-95 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-[22px] font-extrabold text-t1 mb-2">{opp.title}</h2>
            <p className="text-[14px] text-t2 leading-relaxed">{opp.description}</p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase, label: "Posted by", value: opp.postedBy },
              { icon: Clock, label: "Deadline", value: `${opp.deadline} (${opp.daysLeft})` },
              { icon: MapPin, label: "Compensation", value: opp.reward },
              ...(opp.solutions > 0 ? [{ icon: Users, label: "Applications", value: `${opp.solutions} submitted` }] : []),
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-border/30 p-3.5" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="w-3.5 h-3.5 text-t3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-t3">{m.label}</span>
                </div>
                <p className="text-[13px] font-semibold text-t1">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Full JD */}
          <div>
            <h3 className="text-[14px] font-bold text-t1 mb-3">Full Description</h3>
            <div className="text-[14px] text-t2 leading-[1.8] whitespace-pre-line">{fullJD}</div>
          </div>

          {/* Apply section */}
          {!showApply ? (
            <div className="flex gap-3">
              <Button className="flex-1 active:scale-95 transition-all duration-200" onClick={() => setShowApply(true)}>
                Apply via Tiikme
              </Button>
              {opp.type === "funded" && (
                <Button variant="secondary" className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Following updates")}>
                  Follow updates
                </Button>
              )}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/30 p-5 space-y-4" style={{ background: "var(--surface-2)" }}>
              <h3 className="text-[16px] font-bold text-t1">Apply to {opp.title}</h3>

              {/* Profile preview */}
              <div className="flex items-center gap-3 rounded-xl border border-border/30 p-3" style={{ background: "var(--surface)" }}>
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-[11px] font-bold text-white">AK</div>
                <div>
                  <p className="text-[13px] font-bold text-t1">Arjun Kumar</p>
                  <p className="text-[11px] text-t3">Student · DTU · Delhi</p>
                </div>
                <Shield className="w-3.5 h-3.5 ml-auto text-[#F59E0B]" />
              </div>

              {/* Attach work */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-t2" />
                  <p className="text-[13px] font-semibold text-t1">Attach relevant projects</p>
                </div>
                <div className="space-y-1.5">
                  {mockWorkItems.map(w => (
                    <label key={w.id} className="flex items-center gap-3 rounded-lg border border-border/30 p-3 cursor-pointer hover:bg-surface transition-all duration-200">
                      <Checkbox
                        checked={selectedWork.includes(w.id)}
                        onCheckedChange={() => toggleWork(w.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-t1">{w.title}</p>
                        <p className="text-[10px] text-t3">{w.domain} · {w.status}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 active:scale-95 transition-all duration-200" onClick={() => setShowApply(false)}>Cancel</Button>
                <Button className="flex-1 active:scale-95 transition-all duration-200" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
