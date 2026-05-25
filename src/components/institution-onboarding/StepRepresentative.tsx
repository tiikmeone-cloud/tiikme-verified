import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

const TEXT_PRIMARY = "#FAFAF7";
const TEXT_SECONDARY = "rgba(250,250,247,0.68)";

const ROLES_BY_TYPE: Record<string, string[]> = {
  company:     ["Founder / CEO", "CTO", "CMO", "CXO", "HR Head", "Manager", "Admin", "Other"],
  startup:     ["Founder / CEO", "Co-founder", "CTO", "Head of Product", "Head of Growth", "Operator", "Other"],
  creator:     ["Owner / Creator", "Co-host", "Producer", "Editor", "Manager", "Other"],
  community:   ["Organizer", "Co-organizer", "Moderator", "Volunteer", "Other"],
  educational: ["Principal", "Dean", "HOD", "Professor", "Admin", "Other"],
  education:   ["Principal", "Dean", "HOD", "Professor", "Admin", "Other"],
  hospital:    ["Director", "Chief Medical Officer", "Admin", "HOD", "Other"],
  government:  ["Department Head", "Director", "Officer", "Admin", "Other"],
  ngo:         ["Founder", "Director", "Trustee", "Manager", "Other"],
  individual:  ["Owner", "Founder", "Other"],
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 14,
  color: "#FAFAF7", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none",
};

interface Props {
  form: InstitutionFormData;
  update: (p: Partial<InstitutionFormData>) => void;
  onNext: () => void;
}

export default function StepRepresentative({ form, update, onNext }: Props) {
  const { profile } = useAuth();
  const roles = ROLES_BY_TYPE[form.orgType] || ROLES_BY_TYPE.company;

  // Pre-fill name from existing logged-in profile
  useEffect(() => {
    if (profile?.full_name && !form.repName) {
      update({ repName: profile.full_name });
    }
  }, [profile?.full_name]);

  const handleNext = () => {
    if (!form.repName.trim()) { toast.info("Enter your name"); return; }
    if (!form.repRole) { toast.info("Select your role in the organisation"); return; }
    onNext();
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: TEXT_PRIMARY }}>About you</h1>
      <p className="text-[13px] mb-6" style={{ color: TEXT_SECONDARY }}>You'll be the owner of this organisation page</p>

      <div className="space-y-4">
        <div>
          <label className="text-[12px] font-bold mb-1 block" style={{ color: TEXT_PRIMARY }}>Your Full Name</label>
          <input
            type="text" placeholder="e.g. Rajesh Kumar"
            value={form.repName} onChange={e => update({ repName: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-[12px] font-bold mb-2 block" style={{ color: TEXT_PRIMARY }}>Your Role in the Organisation</label>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <button
                key={r} type="button"
                onClick={() => update({ repRole: r })}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                style={{
                  background: form.repRole === r ? "var(--brand)" : "rgba(255,255,255,0.06)",
                  color: form.repRole === r ? "#fff" : "rgba(250,250,247,0.85)",
                  border: form.repRole === r ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleNext} size="xl" className="w-full mt-2">Continue →</Button>
      </div>
    </div>
  );
}
