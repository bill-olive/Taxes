"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { useTaxReturn } from "@/context/TaxReturnContext";

export default function ResidencyPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [fullYear, setFullYear] = useState(taxReturn.residency.fullYear);

  async function handleNext() {
    await updateSection("residency", { state: "GA", fullYear });
    await updateSection("currentStep", 3);
    router.push("/intake/w2-income");
  }

  return (
    <StepWrapper
      title="Georgia Residency"
      description="We need to confirm your state residency to prepare your Georgia state return."
      helpText="If you lived in Georgia for the entire tax year, you're a full-year resident. If you moved to or from Georgia during the year, you'd be a part-year resident."
      onNext={handleNext}
      onBack={() => router.push("/intake/filing-status")}
    >
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="residency"
            checked={fullYear}
            onChange={() => setFullYear(true)}
            className="mt-0.5 h-4 w-4 text-blue-600"
          />
          <div>
            <p className="font-medium text-gray-900">
              Full-year Georgia resident
            </p>
            <p className="text-sm text-gray-600 mt-1">
              I lived in Georgia for the entire 2025 tax year.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="residency"
            checked={!fullYear}
            onChange={() => setFullYear(false)}
            className="mt-0.5 h-4 w-4 text-blue-600"
          />
          <div>
            <p className="font-medium text-gray-900">
              Part-year Georgia resident
            </p>
            <p className="text-sm text-gray-600 mt-1">
              I moved to or from Georgia during 2025.
            </p>
          </div>
        </label>
      </div>

      {!fullYear && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Note:</strong> Part-year residents may need to allocate income
          between states. TaxReady currently handles full-year Georgia residents.
          You may want to consult a tax professional for your specific situation.
        </div>
      )}
    </StepWrapper>
  );
}
