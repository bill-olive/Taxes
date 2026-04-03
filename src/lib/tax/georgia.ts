import { GEORGIA } from "./constants";
import type { TaxInput, GeorgiaResult, BracketBreakdown } from "./types";

function calculateGABracketTax(taxableIncome: number): {
  tax: number;
  breakdown: BracketBreakdown[];
} {
  const brackets = GEORGIA.brackets;
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

export function calculateGeorgiaTax(input: TaxInput): GeorgiaResult {
  const federalAGI = input.wages;
  const georgiaAdjustments = 0; // No adjustments for simple filer
  const georgiaAGI = federalAGI + georgiaAdjustments;

  const standardDeduction = GEORGIA.standardDeduction.single;
  const personalExemption = GEORGIA.personalExemption;

  const georgiaTaxableIncome = Math.max(
    0,
    georgiaAGI - standardDeduction - personalExemption
  );

  const { tax: georgiaTax, breakdown: bracketBreakdown } =
    calculateGABracketTax(georgiaTaxableIncome);

  const stateWithheld = input.stateWithheld;
  const refundOrOwed = stateWithheld - georgiaTax;

  return {
    federalAGI,
    georgiaAdjustments,
    georgiaAGI,
    standardDeduction,
    personalExemption,
    georgiaTaxableIncome,
    bracketBreakdown,
    georgiaTax,
    stateWithheld,
    refundOrOwed: Math.round(refundOrOwed * 100) / 100,
  };
}
