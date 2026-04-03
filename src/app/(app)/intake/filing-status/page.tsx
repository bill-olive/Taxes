"use client";

import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { Card } from "@/components/ui/Card";

export default function FilingStatusPage() {
  const router = useRouter();
  const { updateSection } = useTaxReturn();

  async function handleNext() {
    await updateSection("filingStatus", "single");
    await updateSection("currentStep", 2);
    router.push("/intake/residency");
  }

  return (
    <StepWrapper
      title="What's your filing status?"
      description="Your filing status determines your tax rates and standard deduction amount."
      helpText="Most unmarried people without dependents file as 'Single.' This is the most straightforward filing status."
      onNext={handleNext}
      onBack={() => router.push("/intake/personal-info")}
    >
      <Card variant="info" className="cursor-pointer ring-2 ring-blue-500">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-5 w-5 rounded-full border-4 border-blue-600 bg-white" />
          <div>
            <p className="font-medium text-gray-900">Single</p>
            <p className="text-sm text-gray-600 mt-1">
              You are unmarried, divorced, or legally separated as of December
              31 of the tax year. This gives you a standard deduction of $14,600
              for 2024.
            </p>
          </div>
        </div>
      </Card>

      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> TaxReady currently supports the Single filing
          status. If your situation changes (e.g., you get married), you may
          need a different filing status in future years.
        </p>
      </div>
    </StepWrapper>
  );
}
