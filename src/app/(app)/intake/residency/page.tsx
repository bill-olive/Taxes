"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { useTaxReturn } from "@/context/TaxReturnContext";

const SUPPORTED_STATES = [
  { code: "GA", name: "Georgia" },
  { code: "CA", name: "California" },
] as const;

export default function ResidencyPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [state, setState] = useState(taxReturn.residency.state || "GA");
  const [fullYear, setFullYear] = useState(taxReturn.residency.fullYear);

  async function handleNext() {
    await updateSection("residency", { state, fullYear });
    await updateSection("currentStep", 3);
    router.push("/intake/w2-income");
  }

  const stateName =
    SUPPORTED_STATES.find((s) => s.code === state)?.name || state;

  return (
    <StepWrapper
      title="State Residency"
      description="We need to know your state to prepare the correct state return alongside your federal return."
      helpText="Select the state you lived in during the tax year. If you lived in more than one state, choose the one where you lived for the majority of the year."
      onNext={handleNext}
      onBack={() => router.push("/intake/filing-status")}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          What state did you live in during 2025?
        </p>
        <div className="space-y-2">
          {SUPPORTED_STATES.map((s) => (
            <label
              key={s.code}
              className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${
                state === s.code
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="state"
                checked={state === s.code}
                onChange={() => setState(s.code)}
                className="mt-0.5 h-4 w-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <p className="text-sm font-medium text-gray-700">
          Were you a full-year {stateName} resident?
        </p>
        <div className="space-y-2">
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
                Full-year {stateName} resident
              </p>
              <p className="text-sm text-gray-600 mt-1">
                I lived in {stateName} for the entire 2025 tax year.
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
                Part-year {stateName} resident
              </p>
              <p className="text-sm text-gray-600 mt-1">
                I moved to or from {stateName} during 2025.
              </p>
            </div>
          </label>
        </div>
      </div>

      {!fullYear && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Note:</strong> Part-year residents may need to allocate income
          between states. TaxReady currently handles full-year residents. You may
          want to consult a tax professional for your specific situation.
        </div>
      )}
    </StepWrapper>
  );
}
