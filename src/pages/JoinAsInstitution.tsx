import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import StepAccount from "@/components/institution-onboarding/StepAccount";
import StepOTP from "@/components/institution-onboarding/StepOTP";
import StepOrgType from "@/components/institution-onboarding/StepOrgType";
import StepRepresentative from "@/components/institution-onboarding/StepRepresentative";
import StepPageSetup from "@/components/institution-onboarding/StepPageSetup";

export interface InstitutionFormData {
  email: string;
  password: string;
  orgType: string;
  orgSubtype: string;
  repName: string;
  repRole: string;
  orgName: string;
  tagline: string;
  logoFile: File | null;
  logoPreview: string;
  city: string;
  state: string;
  website: string;
  phone: string;
  isPersonalEmail: boolean;
}

const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com", "proton.me", "icloud.com", "live.com", "aol.com"];

export default function JoinAsInstitution() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<InstitutionFormData>({
    email: "", password: "", orgType: "", orgSubtype: "",
    repName: "", repRole: "", orgName: "", tagline: "",
    logoFile: null, logoPreview: "", city: "", state: "",
    website: "", phone: "", isPersonalEmail: false,
  });

  const update = (partial: Partial<InstitutionFormData>) =>
    setForm(prev => ({ ...prev, ...partial }));

  const emailDomain = form.email.includes("@") ? form.email.split("@")[1].toLowerCase() : "";
  const isPersonal = PERSONAL_DOMAINS.includes(emailDomain);

  useEffect(() => {
    update({ isPersonalEmail: isPersonal });
  }, [isPersonal]);

  return (
    <>
    <PageSEO title="Join as Institution | Tiikme" description="Register your institution on Tiikme's verified professional network for India." noIndex />
    <OnboardingShell step={step} totalSteps={5} showBack={step > 1} backTo={undefined}>
      {step > 1 && (
        <button
          onClick={() => setStep(s => s - 1)}
          className="mb-4 text-[13px] font-medium cursor-pointer hover:opacity-70"
          style={{ color: "var(--text-3)" }}
        >
          ← Back
        </button>
      )}

      {step === 1 && (
        <StepAccount form={form} update={update} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepOTP form={form} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <StepOrgType form={form} update={update} onNext={() => setStep(4)} />
      )}
      {step === 4 && (
        <StepRepresentative form={form} update={update} onNext={() => setStep(5)} />
      )}
      {step === 5 && (
        <StepPageSetup form={form} update={update} onComplete={(slug) => navigate(`/org/${slug}`, { replace: true })} />
      )}
    </OnboardingShell>
    </>
  );
}
