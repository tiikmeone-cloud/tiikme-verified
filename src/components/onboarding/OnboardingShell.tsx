import { ReactNode } from "react";
import AuthLayout from "@/components/layouts/AuthLayout";

interface Props {
  step: number;
  totalSteps?: number;
  showBack?: boolean;
  backTo?: string;
  children: ReactNode;
}

/**
 * Compatibility shim — onboarding pages now render inside the unified
 * Tiikme AuthLayout (Glass on Midnight). The inner "white card"
 * wrappers used by individual steps should be dropped over time;
 * AuthLayout already provides the glossy frosted card.
 */
export default function OnboardingShell({ step, totalSteps = 5, showBack = false, backTo, children }: Props) {
  return (
    <AuthLayout step={step} totalSteps={totalSteps} showBack={showBack} backTo={backTo} maxWidth={620}>
      {children}
    </AuthLayout>
  );
}
