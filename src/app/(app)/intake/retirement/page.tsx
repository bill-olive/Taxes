"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { useTaxReturn } from "@/context/TaxReturnContext";

const MAX_CONTRIBUTION = 7000;
const CATCH_UP = 1000;

export default function RetirementPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const ira = taxReturn.iraContributions;

  const [hasTraditional, setHasTraditional] = useState(ira.hasTraditionalIRA);
  const [traditionalAmount, setTraditionalAmount] = useState(
    ira.traditionalContribution
  );
  const [hasRoth, setHasRoth] = useState(ira.hasRothIRA);
  const [rothAmount, setRothAmount] = useState(ira.rothContribution);
  const [provider, setProvider] = useState(ira.providerName);
  const [coveredByPlan, setCoveredByPlan] = useState(
    ira.coveredByEmployerPlan ||
      taxReturn.w2s.some((w) => w.retirementPlan)
  );
  const [age50, setAge50] = useState(ira.age50OrOlder);
  const [saving, setSaving] = useState(false);

  const limit = MAX_CONTRIBUTION + (age50 ? CATCH_UP : 0);
  const totalContributions =
    (hasTraditional ? traditionalAmount : 0) + (hasRoth ? rothAmount : 0);
  const overLimit = totalContributions > limit;

  async function handleNext() {
    setSaving(true);
    await updateSection("iraContributions", {
      hasTraditionalIRA: hasTraditional,
      traditionalContribution: hasTraditional ? traditionalAmount : 0,
      hasRothIRA: hasRoth,
      rothContribution: hasRoth ? rothAmount : 0,
      providerName: provider,
      coveredByEmployerPlan: coveredByPlan,
      age50OrOlder: age50,
    });
    await updateSection("currentStep", 6);
    setSaving(false);
    router.push("/intake/education");
  }

  return (
    <StepWrapper
      title="Retirement Contributions (IRA)"
      description="Tell us about any IRA contributions you made for the 2025 tax year. Traditional IRA contributions may be tax-deductible."
      helpText={`For 2025, the IRA contribution limit is $${MAX_CONTRIBUTION.toLocaleString()} (or $${(MAX_CONTRIBUTION + CATCH_UP).toLocaleString()} if you're age 50 or older). This limit is shared between Traditional and Roth IRAs combined.`}
      onNext={handleNext}
      onBack={() => router.push("/intake/investments")}
      isSubmitting={saving}
    >
      {/* Age 50+ */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Were you age 50 or older by December 31, 2025?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={age50}
              onChange={() => setAge50(true)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!age50}
              onChange={() => setAge50(false)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {/* Traditional IRA */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Did you contribute to a Traditional IRA for 2025?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={hasTraditional}
              onChange={() => setHasTraditional(true)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!hasTraditional}
              onChange={() => setHasTraditional(false)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {hasTraditional && (
        <Input
          label="Traditional IRA Contribution Amount"
          type="number"
          value={traditionalAmount || ""}
          onChange={(e) =>
            setTraditionalAmount(parseFloat(e.target.value) || 0)
          }
          helpText={`Maximum: $${limit.toLocaleString()} (shared with Roth). Traditional IRA contributions may reduce your taxable income.`}
          placeholder="0"
        />
      )}

      {/* Roth IRA */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Did you contribute to a Roth IRA for 2025?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={hasRoth}
              onChange={() => setHasRoth(true)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!hasRoth}
              onChange={() => setHasRoth(false)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {hasRoth && (
        <Input
          label="Roth IRA Contribution Amount"
          type="number"
          value={rothAmount || ""}
          onChange={(e) => setRothAmount(parseFloat(e.target.value) || 0)}
          helpText="Roth contributions are NOT tax-deductible, but grow tax-free. We track them here for your records."
          placeholder="0"
        />
      )}

      {/* Over-limit warning */}
      {overLimit && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <strong>Warning:</strong> Your combined IRA contributions ($
          {totalContributions.toLocaleString()}) exceed the 2025 limit of $
          {limit.toLocaleString()}. Excess contributions may be subject to a 6%
          penalty tax. Consider reducing your contributions or withdrawing the
          excess before the tax filing deadline.
        </div>
      )}

      {/* Provider */}
      {(hasTraditional || hasRoth) && (
        <Input
          label="IRA Provider / Custodian (optional)"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g., Fidelity, Vanguard, Charles Schwab"
        />
      )}

      {/* Employer plan coverage */}
      {hasTraditional && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Are you (or your spouse) covered by an employer retirement plan?
          </p>
          <p className="text-xs text-gray-500">
            Check your W-2, Box 13 &mdash; if &quot;Retirement plan&quot; is
            checked, you are covered. This affects whether your Traditional IRA
            contribution is deductible.
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={coveredByPlan}
                onChange={() => setCoveredByPlan(true)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!coveredByPlan}
                onChange={() => setCoveredByPlan(false)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
      )}

      {/* Info boxes */}
      {hasTraditional && !coveredByPlan && traditionalAmount > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <strong>Good news!</strong> Since you&apos;re not covered by an
          employer plan, your full Traditional IRA contribution of $
          {Math.min(traditionalAmount, limit).toLocaleString()} is deductible.
          This will reduce your adjusted gross income (AGI).
        </div>
      )}

      {hasTraditional && coveredByPlan && traditionalAmount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Note:</strong> Since you&apos;re covered by an employer
          retirement plan, your Traditional IRA deduction may be reduced or
          eliminated based on your income. We&apos;ll calculate the exact
          deductible amount on your summary.
        </div>
      )}

      {!hasTraditional && !hasRoth && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
          <strong>Tip:</strong> You have until the tax filing deadline (April 15,
          2026) to make IRA contributions for the 2025 tax year. A Traditional
          IRA contribution could lower your tax bill, while a Roth IRA lets your
          savings grow tax-free.
        </div>
      )}
    </StepWrapper>
  );
}
