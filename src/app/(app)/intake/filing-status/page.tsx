"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { type FilingStatus, type Dependent, FILING_STATUS_LABELS } from "@/types";

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

const NEEDS_DEPENDENTS: FilingStatus[] = [
  "head_of_household",
  "qualifying_surviving_spouse",
  "married_filing_jointly",
];

const emptyDependent: Dependent = {
  firstName: "",
  lastName: "",
  relationship: "",
  dob: "",
  ssnLastFour: "",
  monthsLived: 12,
};

export default function FilingStatusPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [selected, setSelected] = useState<FilingStatus>(
    taxReturn.filingStatus
  );
  const [dependents, setDependents] = useState<Dependent[]>(
    taxReturn.dependents?.length > 0 ? taxReturn.dependents : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showDependents = NEEDS_DEPENDENTS.includes(selected);
  const requiresDependents =
    selected === "head_of_household" ||
    selected === "qualifying_surviving_spouse";

  function updateDependent(
    idx: number,
    field: keyof Dependent,
    value: string | number
  ) {
    setDependents((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
    setErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (requiresDependents && dependents.length === 0) {
      errs.dependents =
        `${FILING_STATUS_LABELS[selected]} requires at least one qualifying dependent.`;
    }
    dependents.forEach((dep, i) => {
      if (!dep.firstName.trim()) errs[`${i}-firstName`] = "Required";
      if (!dep.lastName.trim()) errs[`${i}-lastName`] = "Required";
      if (!dep.relationship.trim()) errs[`${i}-relationship`] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    await updateSection("filingStatus", selected);
    await updateSection("dependents", showDependents ? dependents : []);
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

      {/* Dependents section */}
      {showDependents && (
        <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Dependents
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {requiresDependents
                ? `${FILING_STATUS_LABELS[selected]} requires at least one qualifying dependent. Please enter their information below.`
                : "If you have dependents, enter their information below. This may qualify you for additional credits."}
            </p>
          </div>

          {errors.dependents && (
            <p className="text-sm text-red-600">{errors.dependents}</p>
          )}

          {dependents.map((dep, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Dependent #{idx + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setDependents((p) => p.filter((_, i) => i !== idx))
                  }
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={dep.firstName}
                  onChange={(e) =>
                    updateDependent(idx, "firstName", e.target.value)
                  }
                  error={errors[`${idx}-firstName`]}
                />
                <Input
                  label="Last Name"
                  value={dep.lastName}
                  onChange={(e) =>
                    updateDependent(idx, "lastName", e.target.value)
                  }
                  error={errors[`${idx}-lastName`]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Relationship"
                  value={dep.relationship}
                  onChange={(e) =>
                    updateDependent(idx, "relationship", e.target.value)
                  }
                  error={errors[`${idx}-relationship`]}
                  placeholder="e.g., Son, Daughter, Parent"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={dep.dob}
                  onChange={(e) =>
                    updateDependent(idx, "dob", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="SSN (last 4 digits)"
                  value={dep.ssnLastFour}
                  onChange={(e) =>
                    updateDependent(idx, "ssnLastFour", e.target.value)
                  }
                  placeholder="1234"
                  helpText="We only store the last 4 digits for your security"
                />
                <Input
                  label="Months Lived With You in 2025"
                  type="number"
                  value={dep.monthsLived || ""}
                  onChange={(e) =>
                    updateDependent(
                      idx,
                      "monthsLived",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helpText="Must be more than 6 months to qualify"
                />
              </div>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={() =>
              setDependents((p) => [...p, { ...emptyDependent }])
            }
          >
            + Add Dependent
          </Button>

          {dependents.length > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
              <strong>Note:</strong> Each qualifying dependent under age 17 may
              entitle you to a Child Tax Credit of up to $2,000. Dependents
              must have a valid SSN and have lived with you for more than half
              the year.
            </div>
          )}
        </div>
      )}
    </StepWrapper>
  );
}
