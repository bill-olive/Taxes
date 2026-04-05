import { FEDERAL, CITATIONS } from "./constants";
import type { TaxInput, FederalResult, BracketBreakdown, LineItem } from "./types";
import { calculateDeductions } from "./deductions";
import { calculateAllCredits } from "./credits";

function calculateBracketTax(
  taxableIncome: number,
  filingStatus: TaxInput["filingStatus"]
): {
  tax: number;
  breakdown: BracketBreakdown[];
} {
  const brackets = FEDERAL.brackets[filingStatus];
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
  // Capital loss deduction limited to $3,000 per year (IRC §1211)
  const netCapitalGainLoss =
    input.capitalGains - Math.min(input.capitalLosses, input.capitalGains + 3000);
  const grossIncome =
    input.wages +
    (input.interestIncome || 0) +
    (input.ordinaryDividends || 0) +
    Math.max(0, netCapitalGainLoss);
  const aboveTheLineDeductions = input.iraDeduction || 0;
  const adjustedGrossIncome = grossIncome - aboveTheLineDeductions;

  const deduction = calculateDeductions(input);
  const deductionAmount =
    deduction.recommendedMethod === "standard"
      ? deduction.standardDeduction
      : deduction.itemizedDeduction;

  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionAmount);
  const { tax: taxBeforeCredits, breakdown: bracketBreakdown } =
    calculateBracketTax(taxableIncome, input.filingStatus);

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

  const lineItems: LineItem[] = [
    { label: "Wages (Line 1a)", value: input.wages },
  ];
  if (input.interestIncome > 0)
    lineItems.push({ label: "Interest Income (Line 2b)", value: input.interestIncome });
  if (input.ordinaryDividends > 0)
    lineItems.push({ label: "Ordinary Dividends (Line 3b)", value: input.ordinaryDividends });
  if (input.capitalGains > 0 || input.capitalLosses > 0)
    lineItems.push({
      label: `Capital ${netCapitalGainLoss >= 0 ? "Gain" : "Loss"} (Line 7)`,
      value: netCapitalGainLoss,
    });
  lineItems.push(
    { label: "Total Income (Line 9)", value: grossIncome },
  );
  if (aboveTheLineDeductions > 0) {
    lineItems.push({
      label: "IRA Deduction (Schedule 1, Line 20)",
      value: aboveTheLineDeductions,
      citation: CITATIONS.iraDeduction,
    });
    lineItems.push({
      label: "Total Adjustments (Line 10)",
      value: aboveTheLineDeductions,
    });
  }
  lineItems.push(
    { label: "Adjusted Gross Income (Line 11)", value: adjustedGrossIncome },
    {
      label: `Deduction — ${deduction.recommendedMethod === "standard" ? "Standard" : "Itemized"}`,
      value: deductionAmount,
      citation:
        deduction.recommendedMethod === "standard"
          ? CITATIONS.federalStandardDeduction
          : undefined,
    },
    {
      label: "Taxable Income (Line 15)",
      value: taxableIncome,
      citation: CITATIONS.federalBrackets,
    },
    {
      label: "Tax Before Credits",
      value: taxBeforeCredits,
      citation: CITATIONS.federalBrackets,
    },
    ...credits
      .filter((c) => c.eligible)
      .map((credit) => ({
        label: credit.name,
        value: credit.amount,
        citation: credit.citation,
      })),
    { label: "Tax After Credits", value: taxAfterCredits },
    { label: "Federal Tax Withheld", value: totalWithheld },
    {
      label: refundOrOwed >= 0 ? "Federal Refund" : "Federal Owed",
      value: Math.abs(refundOrOwed),
    }
  );

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
    lineItems,
  };
}
