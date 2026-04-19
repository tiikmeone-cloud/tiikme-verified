import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, GraduationCap, Briefcase, Stethoscope, UserCheck, BookOpen, Building2, Wrench, Rocket, Target } from "lucide-react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { SUBTYPE_OPTIONS, hasSubtypes } from "@/lib/roleSubtypes";

const roles = [
  { id: "student", icon: GraduationCap, label: "Student", desc: "College, university or school", color: "#4F46E5" },
  { id: "professional", icon: Briefcase, label: "Professional", desc: "Working in any industry", color: "#0369A1" },
  { id: "doctor", icon: Stethoscope, label: "Doctor / Health", desc: "Healthcare professional", color: "#0E7490" },
  { id: "hr", icon: UserCheck, label: "HR / Recruiter", desc: "Hiring or talent acquisition", color: "#6B21A8" },
  { id: "faculty", icon: BookOpen, label: "Faculty", desc: "Teaching or guiding others", color: "#92400E" },
  { id: "government", icon: Building2, label: "Government", desc: "Public sector or schemes", color: "#166534" },
  { id: "skilled_trade", icon: Wrench, label: "Skilled Trade", desc: "Electrician, plumber, carpenter...", color: "#C2410C" },
  { id: "builder", icon: Rocket, label: "Builder / Founder", desc: "Startup or product builder", color: "#7C3AED" },
  { id: "aspirant", icon: Target, label: "Aspirant", desc: "Preparing for exams or jobs", color: "#374151" },
];

export default function OnboardingRole() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [subtype, setSubtype] = useState<string>("");

  const subtypeRequired = selected ? hasSubtypes(selected) : false;
  const canContinue = !!selected && (!subtypeRequired || !!subtype);

  const handleContinue = () => {
    if (!canContinue) return;
    sessionStorage.setItem("ob_role", selected!);
    if (subtypeRequired && subtype) sessionStorage.setItem("ob_role_subtype", subtype);
    else sessionStorage.removeItem("ob_role_subtype");
    navigate("/onboarding/details");
  };

  return (
    <OnboardingShell step={3} showBack backTo="/verify-email">
      <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827" }}>Who are you?</h1>
        <p className="text-center text-[14px] mb-7" style={{ color: "#6B7280" }}>Pick your role — you can update this anytime</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {roles.map(r => {
            const isSelected = selected === r.id;
            const Icon = r.icon;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{
                  border: `2px solid ${isSelected ? "#E8580A" : "#E5E7EB"}`,
                  background: isSelected ? "#FFF8F2" : "#fff",
                  minHeight: 130,
                }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E8580A" }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${r.color}15` }}>
                  <Icon className="w-[22px] h-[22px]" style={{ color: isSelected ? r.color : "#9CA3AF" }} />
                </div>
                <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.label}</span>
                <span className="text-[11px] text-center mt-0.5" style={{ color: "#9CA3AF" }}>{r.desc}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue} disabled={!selected}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-7"
          style={{ background: "#E8580A" }}
        >
          Continue →
        </button>

        <p className="text-center text-[13px] mt-5" style={{ color: "#6B7280" }}>
          Registering for a company or institution?{" "}
          <Link to="/join-as-institution" className="font-semibold hover:underline" style={{ color: "#E8580A" }}>Create an Institution Page</Link>
        </p>
      </div>
    </OnboardingShell>
  );
}
