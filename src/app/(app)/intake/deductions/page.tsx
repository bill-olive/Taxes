"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { DeductionChat } from "@/components/intake/DeductionChat";

export default function DeductionsPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const d = taxReturn.additionalDeductions;
  const [health, setHealth] = useState(d.healthInsurancePremiums);
  const [charitable, setCharitable] = useState(d.charitableContributions);
  const [other, setOther] = useState(d.otherDeductions);
  const [otherDesc, setOtherDesc] = useState(d.otherDescription);
  const [saving, setSaving] = useState(false);

  // Build context from the full tax return for the AI chat
  const chatContext = {
    filingStatus: taxReturn.filingStatus,
    state: taxReturn.residency?.state || "GA",
    totalWages: taxReturn.w2s.reduce((s, w) => s + w.wages, 0),
    healthInsurance: health,
    charitable,
    propertyTax: taxReturn.property.propertyTaxPaid,
    mortgageInterest: taxReturn.property.mortgageInterest,
    isStudent: taxReturn.education.isFullTimeStudent,
    otherDeductions: other,
    otherDescription: otherDesc,
  };

  function handleDeductionsFromChat(total: number, description: string) {
    setOther(total);
    setOtherDesc(description);
  }

  async function handleNext() {
    setSaving(true);
    await updateSection("additionalDeductions", {
      healthInsurancePremiums: health,
      charitableContributions: charitable,
      otherDeductions: other,
      otherDescription: otherDesc,
    });
    await updateSection("currentStep", 8);
    setSaving(false);
    router.push("/documents");
  }

  return (
    <StepWrapper
      title="Additional Deductions & Expenses"
      description="Let's check for any other expenses that might help reduce your tax bill."
      helpText="Even if you're not sure whether something is deductible, go ahead and enter it. We'll sort out what qualifies and what doesn't."
      onNext={handleNext}
      onBack={() => router.push("/intake/property")}
      isLast
      isSubmitting={saving}
    >
      <Input
        label="Health Insurance Premiums Paid (out of pocket)"
        type="number"
        value={health || ""}
        onChange={(e) => setHealth(parseFloat(e.target.value) || 0)}
        helpText="Only include premiums you paid yourself — not amounts paid by your employer. If you had employer-provided insurance, this is often $0."
      />

      <Input
        label="Charitable Contributions"
        type="number"
        value={charitable || ""}
        onChange={(e) => setCharitable(parseFloat(e.target.value) || 0)}
        helpText="Cash or property donated to qualifying 501(c)(3) organizations. Keep your receipts!"
      />

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Other Deductible Expenses
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Use our AI advisor to discover business deductions you might be
          missing, or enter amounts manually below.
        </p>

        {/* AI Deduction Chat */}
        <DeductionChat
          context={chatContext}
          onDeductionsChange={handleDeductionsFromChat}
        />

        <div className="mt-4 space-y-3">
          <Input
            label="Total Other Deductible Expenses"
            type="number"
            value={other || ""}
            onChange={(e) => setOther(parseFloat(e.target.value) || 0)}
            helpText="This is auto-filled by the AI advisor, or you can enter/adjust manually."
          />
          {(other > 0 || otherDesc) && (
            <Input
              label="Description of Other Expenses"
              value={otherDesc}
              onChange={(e) => setOtherDesc(e.target.value)}
              placeholder="e.g., home office, mileage, software subscriptions"
            />
          )}
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
        <strong>What happens next:</strong> On the next screen you can upload
        your tax documents (W-2, property tax statements, etc.). After that,
        we&apos;ll calculate your taxes and show you a complete summary with all
        your deductions and credits.
      </div>
    </StepWrapper>
  );
}
