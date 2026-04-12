import { Building2, GraduationCap, HeartPulse, Landmark, Heart, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

const ORG_TYPES = [
  { value: "company", label: "Company / Business", icon: Briefcase, desc: "Private or public company" },
  { value: "educational", label: "Educational Institution", icon: GraduationCap, desc: "College, university, school" },
  { value: "hospital", label: "Hospital / Healthcare", icon: HeartPulse, desc: "Hospital, clinic, lab" },
  { value: "government", label: "Government Body", icon: Landmark, desc: "Govt department or agency" },
  { value: "ngo", label: "NGO / Non-Profit", icon: Heart, desc: "Charitable or social org" },
  { value: "individual", label: "Individual Business", icon: Building2, desc: "Freelance, solo practice" },
];

const SUBTYPES: Record<string, string[]> = {
  company: ["Startup", "MNC", "SME", "Agency", "Consultancy", "Other"],
  educational: ["University", "College", "School", "Training Institute", "Coaching", "Other"],
  hospital: ["Multi-specialty Hospital", "Clinic", "Diagnostic Lab", "Pharmacy", "Other"],
  government: ["Central Govt", "State Govt", "PSU", "Municipal", "Defence", "Other"],
  ngo: ["Charitable Trust", "Foundation", "Social Enterprise", "Other"],
  individual: ["Freelancer", "Consultant", "Solo Practice", "Other"],
};

interface Props {
  form: InstitutionFormData;
  update: (p: Partial<InstitutionFormData>) => void;
  onNext: () => void;
}

export default function StepOrgType({ form, update, onNext }: Props) {
  const subtypes = SUBTYPES[form.orgType] || [];

  const handleNext = () => {
    if (!form.orgType) { toast.info("Select your organisation type"); return; }
    onNext();
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "var(--text-1)" }}>What type of organisation?</h1>
      <p className="text-[13px] mb-6" style={{ color: "var(--text-3)" }}>This helps us customise your page and features</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {ORG_TYPES.map(t => {
          const selected = form.orgType === t.value;
          return (
            <button
              key={t.value} type="button"
              onClick={() => update({ orgType: t.value, orgSubtype: "" })}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: selected ? "var(--brand-dim)" : "#fff",
                border: selected ? "2px solid var(--brand)" : "1.5px solid #E5E7EB",
              }}
            >
              <t.icon className="w-6 h-6" style={{ color: selected ? "var(--brand)" : "var(--text-3)" }} strokeWidth={1.8} />
              <span className="text-[13px] font-bold" style={{ color: selected ? "var(--brand)" : "var(--text-1)" }}>{t.label}</span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{t.desc}</span>
            </button>
          );
        })}
      </div>

      {subtypes.length > 0 && (
        <div className="mb-6">
          <label className="text-[12px] font-bold mb-2 block" style={{ color: "var(--text-2)" }}>Sub-type</label>
          <div className="flex flex-wrap gap-2">
            {subtypes.map(s => (
              <button
                key={s} type="button"
                onClick={() => update({ orgSubtype: s })}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                style={{
                  background: form.orgSubtype === s ? "var(--brand)" : "#fff",
                  color: form.orgSubtype === s ? "#fff" : "var(--text-2)",
                  border: form.orgSubtype === s ? "none" : "1.5px solid #E5E7EB",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleNext} size="xl" className="w-full">Continue →</Button>
    </div>
  );
}
