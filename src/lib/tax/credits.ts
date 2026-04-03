import { FEDERAL } from "./constants";
import type { TaxInput, CreditResult } from "./types";

export function calculateAOTC(input: TaxInput): CreditResult {
  const { aotc } = FEDERAL;

  if (!input.isFullTimeStudent || input.tuitionPaid <= 0) {
    return {
      name: "American Opportunity Tax Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation: input.isFullTimeStudent
        ? "You didn't report any tuition expenses. If you paid tuition, enter the amount from your 1098-T to potentially claim up to $2,500."
        : "This credit is available for students enrolled at least half-time in a degree program. Since you indicated you're not a full-time student, you may not qualify.",
    };
  }

  if (input.wages > aotc.incomePhaseoutEnd) {
    return {
      name: "American Opportunity Tax Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation: `Your income exceeds the $${aotc.incomePhaseoutEnd.toLocaleString()} phase-out limit for this credit.`,
    };
  }

  // Calculate base credit: 100% of first $2,000 + 25% of next $2,000
  const fullPortion = Math.min(input.tuitionPaid, aotc.fullCreditUpTo);
  const partialPortion = Math.min(
    Math.max(input.tuitionPaid - aotc.fullCreditUpTo, 0),
    aotc.partialCreditUpTo - aotc.fullCreditUpTo
  );
  let credit = fullPortion + partialPortion * aotc.partialRate;
  credit = Math.min(credit, aotc.maxCredit);

  // Apply phase-out if income is in the phase-out range
  if (input.wages > aotc.incomePhaseoutStart) {
    const phaseoutRange = aotc.incomePhaseoutEnd - aotc.incomePhaseoutStart;
    const overAmount = input.wages - aotc.incomePhaseoutStart;
    const reductionRate = overAmount / phaseoutRange;
    credit = credit * (1 - reductionRate);
  }

  credit = Math.round(credit * 100) / 100;
  const refundableAmount = Math.min(
    Math.round(credit * aotc.refundablePercent * 100) / 100,
    aotc.maxRefundable
  );
  const nonRefundableAmount = Math.round((credit - refundableAmount) * 100) / 100;

  return {
    name: "American Opportunity Tax Credit",
    eligible: true,
    amount: credit,
    refundableAmount,
    nonRefundableAmount,
    explanation: `Great news! Because you're a full-time student who paid $${input.tuitionPaid.toLocaleString()} in tuition, you qualify for a $${credit.toLocaleString()} tax credit. Of this, $${refundableAmount.toLocaleString()} is refundable — meaning you could get it back even if you owe no taxes.`,
  };
}

export function calculateAllCredits(input: TaxInput): CreditResult[] {
  return [calculateAOTC(input)];
}
