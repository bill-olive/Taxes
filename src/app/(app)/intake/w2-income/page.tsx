"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTaxReturn } from "@/context/TaxReturnContext";
import type { W2Entry } from "@/types";
import { formatCurrency } from "@/lib/utils";

const emptyW2: W2Entry = {
  employerName: "",
  employerEIN: "",
  wages: 0,
  federalWithheld: 0,
  stateWages: 0,
  stateWithheld: 0,
};

export default function W2IncomePage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [w2s, setW2s] = useState<W2Entry[]>(
    taxReturn.w2s.length > 0 ? taxReturn.w2s : [{ ...emptyW2 }]
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateW2(index: number, field: keyof W2Entry, value: string | number) {
    setW2s((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors({});
  }

  function addW2() {
    setW2s((prev) => [...prev, { ...emptyW2 }]);
  }

  function removeW2(index: number) {
    if (w2s.length === 1) return;
    setW2s((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    w2s.forEach((w2, i) => {
      if (!w2.employerName.trim()) errs[`${i}-employerName`] = "Required";
      if (w2.wages <= 0) errs[`${i}-wages`] = "Enter your wages from Box 1";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    setSaving(true);
    await updateSection("w2s", w2s);
    await updateSection("currentStep", 4);
    setSaving(false);
    router.push("/intake/education");
  }

  return (
    <StepWrapper
      title="W-2 Income"
      description="Enter the information from your W-2 form(s). You should have received one from each employer you worked for in 2025."
      helpText="Look at your W-2 form: Box 1 is your wages, Box 2 is federal tax withheld, Box 16 is state wages, and Box 17 is state tax withheld."
      onNext={handleNext}
      onBack={() => router.push("/intake/residency")}
      isSubmitting={saving}
    >
      {w2s.map((w2, index) => (
        <Card key={index} className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              {w2s.length > 1 ? `W-2 #${index + 1}` : "Your W-2"}
            </CardTitle>
            {w2s.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => removeW2(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>

          <Input
            label="Employer Name"
            value={w2.employerName}
            onChange={(e) => updateW2(index, "employerName", e.target.value)}
            error={errors[`${index}-employerName`]}
          />

          <Input
            label="Employer EIN"
            value={w2.employerEIN}
            onChange={(e) => updateW2(index, "employerEIN", e.target.value)}
            helpText="Found in Box b of your W-2 (XX-XXXXXXX)"
            placeholder="XX-XXXXXXX"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Wages (Box 1)"
              type="number"
              value={w2.wages || ""}
              onChange={(e) =>
                updateW2(index, "wages", parseFloat(e.target.value) || 0)
              }
              error={errors[`${index}-wages`]}
              helpText="Your total taxable wages"
            />
            <Input
              label="Federal Tax Withheld (Box 2)"
              type="number"
              value={w2.federalWithheld || ""}
              onChange={(e) =>
                updateW2(
                  index,
                  "federalWithheld",
                  parseFloat(e.target.value) || 0
                )
              }
              helpText="Tax already paid to the IRS"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State Wages (Box 16)"
              type="number"
              value={w2.stateWages || ""}
              onChange={(e) =>
                updateW2(index, "stateWages", parseFloat(e.target.value) || 0)
              }
              helpText="Usually same as Box 1"
            />
            <Input
              label="State Tax Withheld (Box 17)"
              type="number"
              value={w2.stateWithheld || ""}
              onChange={(e) =>
                updateW2(
                  index,
                  "stateWithheld",
                  parseFloat(e.target.value) || 0
                )
              }
              helpText="Tax already paid to Georgia"
            />
          </div>
        </Card>
      ))}

      <Button variant="outline" onClick={addW2}>
        + Add another W-2
      </Button>

      {w2s.length > 0 && w2s[0].wages > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <strong>Total wages:</strong>{" "}
          {formatCurrency(w2s.reduce((sum, w) => sum + w.wages, 0))} |{" "}
          <strong>Total federal withheld:</strong>{" "}
          {formatCurrency(
            w2s.reduce((sum, w) => sum + w.federalWithheld, 0)
          )}
        </div>
      )}
    </StepWrapper>
  );
}
