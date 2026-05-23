import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

const TEXT_PRIMARY = "#FAFAF7";
const TEXT_SECONDARY = "rgba(250,250,247,0.68)";

// Flat category list — the value is what's stored in organizations.subtype.
// `type` is the underlying organizations.type bucket. Grouped by section.
const ORG_CATEGORIES: { value: string; type: string; label: string; group: string }[] = [
  // Companies
  { group: "Companies",       value: "Product Company",          type: "company",    label: "Product Company" },
  { group: "Companies",       value: "SaaS",                     type: "company",    label: "SaaS" },
  { group: "Companies",       value: "Service Company",          type: "company",    label: "Service Company" },
  { group: "Companies",       value: "Ad Agency",                type: "company",    label: "Ad Agency" },
  { group: "Companies",       value: "E-commerce",               type: "company",    label: "E-commerce" },
  // Startups
  { group: "Startups",        value: "Startup",                  type: "startup",    label: "Startup" },
  // Creators
  { group: "Creators",        value: "YouTube Channel",          type: "creator",    label: "YouTube Channel" },
  { group: "Creators",        value: "Podcast",                  type: "creator",    label: "Podcast" },
  { group: "Creators",        value: "Newsletter",               type: "creator",    label: "Newsletter" },
  { group: "Creators",        value: "Other Creator",            type: "creator",    label: "Other Creator" },
  // Communities (informal, user-run)
  { group: "Communities",     value: "Community",                type: "community",  label: "Community / User Group" },
  // Education / Healthcare / Public sector
  { group: "Institutions",    value: "Educational Institution",  type: "education",  label: "Educational Institution" },
  { group: "Institutions",    value: "Hospital/Healthcare",      type: "hospital",   label: "Hospital / Healthcare" },
  { group: "Institutions",    value: "Government",               type: "government", label: "Government Body" },
  { group: "Institutions",    value: "Non-Profit/NGO",           type: "ngo",        label: "Non-Profit / NGO" },
  // Fallback
  { group: "Other",           value: "Other",                    type: "company",    label: "Other" },
];

const GROUP_ORDER = ["Companies", "Startups", "Creators", "Communities", "Institutions", "Other"];

interface Props {
  form: InstitutionFormData;
  update: (p: Partial<InstitutionFormData>) => void;
  onNext: () => void;
}

export default function StepOrgType({ form, update, onNext }: Props) {
  const handleSelect = (value: string) => {
    const cat = ORG_CATEGORIES.find(c => c.value === value);
    if (!cat) return;
    update({ orgType: cat.type, orgSubtype: cat.value });
  };

  const handleNext = () => {
    if (!form.orgSubtype) { toast.info("Select your organisation category"); return; }
    onNext();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
          <Building2 className="w-5 h-5" style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ color: TEXT_PRIMARY }}>What type of organisation?</h1>
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>This helps us customise your page and features</p>
        </div>
      </div>

      <div className="mt-6 mb-6">
        <label className="text-[12px] font-bold mb-2 block" style={{ color: TEXT_PRIMARY }}>Organisation Category</label>
        <select
          value={form.orgSubtype}
          onChange={e => handleSelect(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 14,
            color: "#FAFAF7", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
            outline: "none",
            appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23FAFAF7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            cursor: "pointer",
          }}
        >
          <option value="">Select category…</option>
          {GROUP_ORDER.map(group => {
            const items = ORG_CATEGORIES.filter(c => c.group === group);
            if (!items.length) return null;
            return (
              <optgroup key={group} label={group}>
                {items.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </optgroup>
            );
          })}
        </select>
        <p className="text-[11px] mt-2" style={{ color: TEXT_SECONDARY }}>
          Used to surface your page in the right discovery sections.
        </p>
      </div>

      <Button onClick={handleNext} size="xl" className="w-full">Continue →</Button>
    </div>
  );
}
