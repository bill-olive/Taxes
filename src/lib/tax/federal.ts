import { FEDERAL } from "./constants";
import type { TaxInput, FederalResult, BracketBreakdown } from "./types";
import { calculateDeductions } from "./deductions";
import { calculateAllCredits } from "./credits";

function calculateBracketTax(taxableIncome: number): {
  tax: number;
  breakdown: BracketBreakdown[];
} {
  const brackets = FEDERAL.brackets.single;
  const breakdown: BracketBreakdown[] = [];
  let remaining = taxableIncome;
  let totalTax = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableAtRate = Math.min(remaining, bracket.max - bracket.min);
    const tax = Math.round(taxableAtRate * bracket.rate * 100) / 100;
    breakdown.push({ rate: bracket.rate, taxableAtRate, tax });
    totalTax += tax;
    remaining -= taxableAtRate;
  }

  return { tax: Math.round(totalTax * 100) / 100, breakdown };
}

export function calculateFederalTax(input: TaxInput): FederalResult {
  const grossIncome = input.wages;
  const adjustedGrossIncome = grossIncome; // No adjustments for simple W-2 filer

  const deduction = calculateDeductions(input);
  const deductionAmount =
    deduction.recommendedMethod === "standard"
      ? deduction.standardDeduction
      : deduction.itemizedDeduction;

  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionAmount);
  const { tax: taxBeforeCredits, breakdown: bracketBreakdown } =
    calculateBracketTax(taxableIncome);

  const credits = calculateAllCredits(input);
  const nonRefundableCredits = credits.reduce(
    (sum, c) => sum + (c.eligible ? c.nonRefundableAmount : 0),
    0
  );
  const refundableCredits = credits.reduce(
    (sum, c) => sum + (c.eligible ? c.refundableAmount : 0),
    0
  );

  const taxAfterNonRefundable = Math.max(0, taxBeforeCredits - nonRefundableCredits);
  const taxAfterCredits = taxAfterNonRefundable - refundableCredits;

  const totalWithheld = input.federalWithheld;
  const refundOrOwed = totalWithheld - taxAfterCredits;

  return {
    grossIncome,
    adjustedGrossIncome,
    deduction,
    taxableIncome,
    bracketBreakdown,
    taxBeforeCredits,
    credits,
    totalCredits: nonRefundableCredits + refundableCredits,
    taxAfterCredits,
    totalWithheld,
    refundOrOwed: Math.round(refundOrOwed * 100) / 100,
  };
}
