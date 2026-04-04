import { FEDERAL, CITATIONS } from "./constants";
import type { TaxInput, DeductionResult } from "./types";

export function calculateItemizedDeductions(input: TaxInput): {
  total: number;
  saltDeduction: number;
  mortgageInterest: number;
  charitableContributions: number;
} {
  const saltTotal = input.propertyTaxPaid + input.stateIncomeTaxPaid;
  const saltDeduction = Math.min(saltTotal, FEDERAL.saltCap);
  const mortgageInterest = input.mortgageInterest;
  const charitableContributions = input.charitableContributions;

  return {
    total: saltDeduction + mortgageInterest + charitableContributions,
    saltDeduction,
    mortgageInterest,
    charitableContributions,
  };
}

export function calculateDeductions(input: TaxInput): DeductionResult {
  const standardDeduction = FEDERAL.standardDeduction[input.filingStatus];
  const itemized = calculateItemizedDeductions(input);

  const useItemized = itemized.total > standardDeduction + 100;

  const citations: Record<string, typeof CITATIONS[string]> = {
    standardDeduction: CITATIONS.federalStandardDeduction,
    saltCap: CITATIONS.saltCap,
  };

  if (input.propertyTaxPaid > 0) {
    citations.propertyTax = CITATIONS.propertyTaxDeduction;
  }
  if (input.mortgageInterest > 0) {
    citations.mortgageInterest = CITATIONS.mortgageInterest;
  }
  if (input.charitableContributions > 0) {
    citations.charitableContributions = CITATIONS.charitableContributions;
  }

  return {
    standardDeduction,
    itemizedDeduction: itemized.total,
    recommendedMethod: useItemized ? "itemized" : "standard",
    itemizedBreakdown: {
      saltDeduction: itemized.saltDeduction,
      mortgageInterest: itemized.mortgageInterest,
      charitableContributions: itemized.charitableContributions,
    },
    explanation: useItemized
      ? `Itemizing saves you ${formatDiff(itemized.total - standardDeduction)} more than the standard deduction. Your itemized deductions total ${fmt(itemized.total)}, compared to the ${fmt(standardDeduction)} standard deduction.`
      : itemized.total > standardDeduction
        ? `Your itemized deductions (${fmt(itemized.total)}) are only slightly more than the standard deduction (${fmt(standardDeduction)}). We recommend the standard deduction for simplicity — the difference is minimal.`
        : `The standard deduction of ${fmt(standardDeduction)} gives you a larger deduction than itemizing (${fmt(itemized.total)}). This is the simpler and more beneficial option.`,
    citations,
  };
}

function fmt(n: number): string {
  return `$${n.toLocaleString()}`;
}

function formatDiff(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
