import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Briefcase, MapPin, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_OPTIONS = ["Full-time", "Internship", "Freelance", "Remote", "Hackathon"];
const LOCATION_TYPES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: any;
  onSaved?: () => void;
}

export default function OpenToWorkModal({ open, onClose, existing, onSaved }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [roleTypes, setRoleTypes] = useState<string[]>(existing?.role_types || []);
  const [locationType, setLocationType] = useState(existing?.location_type || "onsite");
  const [preferredLocation, setPreferredLocation] = useState(existing?.preferred_location || "");
  const [desiredTitle, setDesiredTitle] = useState(existing?.desired_title || "");
  const [pitch, setPitch] = useState(existing?.pitch || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setRoleTypes(existing.role_types || []);
      setLocationType(existing.location_type || "onsite");
      setPreferredLocation(existing.preferred_location || "");
      setDesiredTitle(existing.desired_title || "");
      setPitch(existing.pitch || "");
    }
  }, [existing]);

  if (!open) return null;

  const toggleRole = (r: string) => {
    setRoleTypes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const canNext = () => {
    if (step === 1) return roleTypes.length > 0;
    if (step === 2) return true;
    if (step === 3) return desiredTitle.trim().length > 0;
    if (step === 4) return pitch.trim().length > 0;
    return true;
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      role_types: roleTypes,
      preferred_location: preferredLocation || null,
      location_type: locationType,
      desired_title: desiredTitle.trim(),
      pitch: pitch.trim().slice(0, 150),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("open_to_work_profiles").update(payload as any).eq("user_id", user.id)
      : await supabase.from("open_to_work_profiles").insert(payload as any);

    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        // Duplicate — try upsert
        await supabase.from("open_to_work_profiles").update(payload as any).eq("user_id", user.id);
      } else {
        toast.error(error.message);
        return;
      }
    }
    toast.success("Open to Work profile saved");
    onSaved?.();
    onClose();
  };

  const steps = [
    { icon: Briefcase, title: "What are you looking for?", subtitle: "Select all that apply" },
    { icon: MapPin, title: "Where do you want to work?", subtitle: "Location preference" },
    { icon: User, title: "Your desired role", subtitle: "What title fits you best?" },
    { icon: Sparkles, title: "Why choose you?", subtitle: "Your elevator pitch (max 150 chars)" },
  ];

  const currentStep = steps[step - 1];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-[420px] mx-4 rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <StepIcon className="w-5 h-5" style={{ color: "#E8733A" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{currentStep.title}</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          </button>
        </div>
        <p className="px-5 text-[13px] mb-4" style={{ color: "var(--text-3)" }}>{currentStep.subtitle}</p>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 mb-5">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? "#E8733A" : "var(--surface-2)", transition: "background 200ms" }} />
          ))}
        </div>

        <div className="px-5 pb-5 min-h-[180px]">
          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(r => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200"
                  style={roleTypes.includes(r)
                    ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }
                    : { background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }
                  }>
                  {r}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {LOCATION_TYPES.map(lt => (
                  <button key={lt.value} type="button" onClick={() => setLocationType(lt.value)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all"
                    style={locationType === lt.value
                      ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }
                      : { background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)" }
                    }>
                    {lt.label}
                  </button>
                ))}
              </div>
              {locationType !== "remote" && (
                <input
                  value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)}
                  placeholder="Preferred city (e.g. Mumbai, Bangalore)"
                  className="w-full h-11 rounded-xl px-4 text-[14px] outline-none glass-input"
                />
              )}
            </div>
          )}

          {step === 3 && (
            <input
              value={desiredTitle} onChange={e => setDesiredTitle(e.target.value)}
              placeholder="e.g. Frontend Developer, Marketing Intern"
              className="w-full h-11 rounded-xl px-4 text-[14px] outline-none glass-input"
              maxLength={80}
            />
          )}

          {step === 4 && (
            <div>
              <textarea
                value={pitch} onChange={e => setPitch(e.target.value.slice(0, 150))}
                placeholder="Tell recruiters why they should pick you..."
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-none glass-input"
                rows={4}
                maxLength={150}
              />
              <p className="text-right text-[11px] mt-1" style={{ color: pitch.length >= 140 ? "#EF4444" : "var(--text-3)" }}>
                {pitch.length}/150
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(s => s - 1)} className="h-10 px-4 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "none" }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < 4 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="h-10 px-5 rounded-xl text-[13px] font-bold cursor-pointer flex items-center gap-1 btn-liquid-primary disabled:opacity-40"
              style={{ border: "none" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={save} disabled={!canNext() || saving}
              className="h-10 px-6 rounded-xl text-[13px] font-bold cursor-pointer btn-liquid-primary disabled:opacity-40"
              style={{ border: "none" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
