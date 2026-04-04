"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { type FilingStatus, FILING_STATUS_LABELS } from "@/types";

const FILING_STATUS_OPTIONS: {
  value: FilingStatus;
  description: string;
}[] = [
  {
    value: "single",
    description:
      "You are unmarried, divorced, or legally separated as of December 31, 2025 and do not qualify for another filing status.",
  },
  {
    value: "married_filing_jointly",
    description:
      "You are married and both you and your spouse agree to file a joint return. You combine your income and deductions.",
  },
  {
    value: "married_filing_separately",
    description:
      "You are married but choose to file separately. Each spouse reports their own income and deductions. This may result in a higher tax but keeps liability separate.",
  },
  {
    value: "head_of_household",
    description:
      "You are unmarried, paid more than half the cost of keeping up a home, and have a qualifying dependent. This status gives you a larger standard deduction and lower tax rates than Single.",
  },
  {
    value: "qualifying_surviving_spouse",
    description:
      "Your spouse died in 2023 or 2024 and you have a dependent child. You can use the same rates and standard deduction as Married Filing Jointly for up to 2 years after your spouse's death.",
  },
];

export default function FilingStatusPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [selected, setSelected] = useState<FilingStatus>(
    taxReturn.filingStatus
  );

  async function handleNext() {
    await updateSection("filingStatus", selected);
    await updateSection("currentStep", 2);
    router.push("/intake/residency");
  }

  return (
    <StepWrapper
      title="What's your filing status?"
      description="Your filing status determines your tax rates, standard deduction amount, and eligibility for certain credits."
      helpText="Choose the status that best matches your situation as of December 31, 2025. If you're unsure, Single is the most common for unmarried filers."
      onNext={handleNext}
      onBack={() => router.push("/intake/personal-info")}
    >
      <div className="space-y-3">
        {FILING_STATUS_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${
              selected === option.value
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="filing-status"
              checked={selected === option.value}
              onChange={() => setSelected(option.value)}
              className="mt-0.5 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="font-medium text-gray-900">
                {FILING_STATUS_LABELS[option.value]}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </StepWrapper>
  );
}
