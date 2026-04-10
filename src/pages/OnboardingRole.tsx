import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

const roles = [
  { id: "student", icon: "🎓", label: "Student", desc: "College, university or school" },
  { id: "professional", icon: "💼", label: "Professional", desc: "Working in any industry" },
  { id: "doctor", icon: "🩺", label: "Doctor / Health", desc: "Healthcare professional" },
  { id: "hr", icon: "👥", label: "HR / Recruiter", desc: "Hiring or talent acquisition" },
  { id: "faculty", icon: "📚", label: "Faculty", desc: "Teaching or guiding others" },
  { id: "government", icon: "🏛", label: "Government", desc: "Public sector or schemes" },
  { id: "skilled_trade", icon: "🔧", label: "Skilled Trade", desc: "Electrician, plumber, carpenter..." },
  { id: "builder", icon: "🚀", label: "Builder / Founder", desc: "Startup or product builder" },
  { id: "aspirant", icon: "🎯", label: "Aspirant", desc: "Preparing for exams or jobs" },
];

export default function OnboardingRole() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    sessionStorage.setItem("ob_role", selected);
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
            return (
              <button
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
                <span className="text-[28px] mb-2">{r.icon}</span>
                <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{r.label}</span>
                <span className="text-[11px] text-center mt-0.5" style={{ color: "#9CA3AF" }}>{r.desc}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue} disabled={!selected}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-7"
          style={{ background: "#E8580A" }}
        >
          Continue →
        </button>
      </div>
    </OnboardingShell>
  );
}
