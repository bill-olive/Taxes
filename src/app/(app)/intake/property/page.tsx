"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { useTaxReturn } from "@/context/TaxReturnContext";

export default function PropertyPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const p = taxReturn.property;
  const [hasProperty, setHasProperty] = useState(p.hasProperty);
  const [propertyTax, setPropertyTax] = useState(p.propertyTaxPaid);
  const [mortgage, setMortgage] = useState(p.mortgageInterest);
  const [hoa, setHoa] = useState(p.hoaDues);
  const [insurance, setInsurance] = useState(p.insuranceCost);
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    await updateSection("property", {
      hasProperty,
      address: hasProperty ? taxReturn.personalInfo.address : null,
      propertyTaxPaid: hasProperty ? propertyTax : 0,
      mortgageInterest: hasProperty ? mortgage : 0,
      hoaDues: hasProperty ? hoa : 0,
      insuranceCost: hasProperty ? insurance : 0,
    });
    await updateSection("currentStep", 6);
    setSaving(false);
    router.push("/intake/deductions");
  }

  return (
    <StepWrapper
      title="Property & Homeownership"
      description="Tell us about any property you own. Some property-related expenses may be tax deductible."
      helpText="Property taxes and mortgage interest can be deducted on your tax return. HOA fees and homeowner's insurance are generally not deductible for a primary residence, but we'll track them for your records."
      onNext={handleNext}
      onBack={() => router.push("/intake/education")}
      isSubmitting={saving}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Do you own a home, condo, or other property?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={hasProperty}
              onChange={() => setHasProperty(true)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!hasProperty}
              onChange={() => setHasProperty(false)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {hasProperty && (
        <>
          <Input
            label="Property Tax Paid in 2025"
            type="number"
            value={propertyTax || ""}
            onChange={(e) => setPropertyTax(parseFloat(e.target.value) || 0)}
            helpText="This is tax deductible (as part of your SALT deduction, up to $10,000 combined with state income tax)."
          />

          <Input
            label="Mortgage Interest Paid in 2025"
            type="number"
            value={mortgage || ""}
            onChange={(e) => setMortgage(parseFloat(e.target.value) || 0)}
            helpText="If you have a mortgage, check your 1098 form. Leave at 0 if you own outright."
          />

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Tracked expenses (not deductible, but good to have on record)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="HOA / Condo Fees (Annual)"
                type="number"
                value={hoa || ""}
                onChange={(e) => setHoa(parseFloat(e.target.value) || 0)}
                helpText="Not deductible for primary residence"
              />
              <Input
                label="Homeowner's Insurance (Annual)"
                type="number"
                value={insurance || ""}
                onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)}
                helpText="Not deductible for primary residence"
              />
            </div>
          </div>
        </>
      )}
    </StepWrapper>
  );
}
