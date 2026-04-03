"use client";

import { ProgressStepper } from "@/components/intake/ProgressStepper";
import { useTaxReturn } from "@/context/TaxReturnContext";

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { taxReturn } = useTaxReturn();

  return (
    <div>
      <ProgressStepper currentStep={taxReturn.currentStep} />
      {children}
    </div>
  );
}
