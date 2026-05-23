/**
 * In-app org creation flow for already-authenticated users.
 * Skips the email/password and OTP steps (user is already signed in)
 * and goes straight to org type → representative → page setup.
 * Lives at /app/organizations/create.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSEO } from "@/hooks/usePageSEO";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import StepOrgType from "@/components/institution-onboarding/StepOrgType";
import StepRepresentative from "@/components/institution-onboarding/StepRepresentative";
import StepPageSetup from "@/components/institution-onboarding/StepPageSetup";
import type { InstitutionFormData } from "./JoinAsInstitution";

const TOTAL_STEPS = 3;

export default function OrganizationCreate() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<InstitutionFormData>({
    email: user?.email || "",
    password: "",
    orgType: "",
    orgSubtype: "",
    repName: profile?.full_name || "",
    repRole: profile?.designation || "",
    orgName: "",
    tagline: "",
    logoFile: null,
    logoPreview: "",
    city: profile?.location_city || "",
    state: profile?.location_state || "",
    website: "",
    phone: "",
    isPersonalEmail: false,
  });

  const update = (partial: Partial<InstitutionFormData>) =>
    setForm(prev => ({ ...prev, ...partial }));

  return (
    <>
      <PageSEO title="Create Organization | Tiikme" description="Set up your organization page on Tiikme." noIndex />
      <OnboardingShell step={step} totalSteps={TOTAL_STEPS} showBack={step > 1} backTo={undefined}>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="mb-4 text-[13px] font-medium cursor-pointer hover:opacity-70"
            style={{ color: "var(--text-3)", background: "none", border: "none" }}
          >
            ← Back
          </button>
        )}

        {step === 1 && (
          <StepOrgType form={form} update={update} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepRepresentative form={form} update={update} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <StepPageSetup
            form={form}
            update={update}
            onComplete={(slug) => navigate(`/org/${slug}`, { replace: true })}
          />
        )}
      </OnboardingShell>
    </>
  );
}
