"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { useTaxReturn } from "@/context/TaxReturnContext";

export default function EducationPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [isStudent, setIsStudent] = useState(
    taxReturn.education.isFullTimeStudent
  );
  const [institution, setInstitution] = useState(
    taxReturn.education.institutionName
  );
  const [tuition, setTuition] = useState(taxReturn.education.tuitionPaid);
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    await updateSection("education", {
      isFullTimeStudent: isStudent,
      institutionName: institution,
      tuitionPaid: tuition,
    });
    await updateSection("currentStep", 7);
    setSaving(false);
    router.push("/intake/property");
  }

  return (
    <StepWrapper
      title="Education Status"
      description="Tell us about your education. This helps us check if you qualify for valuable education tax credits."
      helpText="Full-time students may qualify for the American Opportunity Tax Credit (AOTC), worth up to $2,500. This is one of the most valuable credits available!"
      onNext={handleNext}
      onBack={() => router.push("/intake/retirement")}
      isSubmitting={saving}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Were you a full-time student in 2025?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isStudent}
              onChange={() => setIsStudent(true)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isStudent}
              onChange={() => setIsStudent(false)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {isStudent && (
        <>
          <Input
            label="School or University Name"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g., Georgia State University"
          />

          <Input
            label="Qualified Tuition & Fees Paid"
            type="number"
            value={tuition || ""}
            onChange={(e) => setTuition(parseFloat(e.target.value) || 0)}
            helpText="Check your 1098-T form from your school. Enter the amount from Box 1 (or the amount you actually paid)."
            placeholder="0"
          />

          {tuition > 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              <strong>Good news!</strong> Based on your tuition of $
              {tuition.toLocaleString()}, you may qualify for the American
              Opportunity Tax Credit worth up to $
              {Math.min(
                2500,
                Math.min(tuition, 2000) +
                  Math.min(Math.max(tuition - 2000, 0), 2000) * 0.25
              ).toLocaleString()}
              . We&apos;ll calculate the exact amount on your summary.
            </div>
          )}

          {tuition === 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
              <strong>Tip:</strong> If you paid any tuition or fees, you could
              qualify for up to $2,500 in tax credits. Check if your school
              sent you a 1098-T form.
            </div>
          )}
        </>
      )}
    </StepWrapper>
  );
}
