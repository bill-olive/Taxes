import { CALIFORNIA, CITATIONS } from "./constants";
import type { TaxInput, BracketBreakdown, LineItem } from "./types";
import type { FilingStatus } from "@/types";

// Re-use GeorgiaResult shape — it's generic enough for any state
export interface CaliforniaResult {
  federalAGI: number;
  californiaAGI: number;
  standardDeduction: number;
  exemptionCredit: number;
  californiaTaxableIncome: number;
  bracketBreakdown: BracketBreakdown[];
  baseTax: number;
  mentalHealthTax: number;
  totalTaxBeforeCredits: number;
  californiaTax: number;
  stateWithheld: number;
  refundOrOwed: number;
  lineItems: LineItem[];
}

function calculateCABracketTax(
  taxableIncome: number,
  filingStatus: FilingStatus
): {
  tax: number;
  breakdown: BracketBreakdown[];
} {
  const brackets = CALIFORNIA.brackets[filingStatus];
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

export function calculateCaliforniaTax(input: TaxInput): CaliforniaResult {
  const federalAGI = input.wages;
  const californiaAGI = federalAGI; // Simplified — no CA-specific adjustments for W-2 filers

  const standardDeduction = CALIFORNIA.standardDeduction[input.filingStatus];
  const exemptionCredit = CALIFORNIA.exemptionCredit[input.filingStatus];

  const californiaTaxableIncome = Math.max(0, californiaAGI - standardDeduction);

  const { tax: baseTax, breakdown: bracketBreakdown } =
    calculateCABracketTax(californiaTaxableIncome, input.filingStatus);

  // Mental Health Services Tax: 1% on taxable income over $1M
  const mentalHealthTax =
    californiaTaxableIncome > CALIFORNIA.mentalHealthTaxThreshold
      ? Math.round(
          (californiaTaxableIncome - CALIFORNIA.mentalHealthTaxThreshold) *
            CALIFORNIA.mentalHealthTaxRate *
            100
        ) / 100
      : 0;

  const totalTaxBeforeCredits = baseTax + mentalHealthTax;
  const californiaTax = Math.max(0, Math.round((totalTaxBeforeCredits - exemptionCredit) * 100) / 100);

  const stateWithheld = input.stateWithheld;
  const refundOrOwed = stateWithheld - californiaTax;

  const lineItems: LineItem[] = [
    { label: "Federal AGI", value: federalAGI },
    { label: "California AGI", value: californiaAGI },
    {
      label: "CA Standard Deduction",
      value: standardDeduction,
      citation: CITATIONS.californiaStandardDeduction,
    },
    { label: "California Taxable Income", value: californiaTaxableIncome },
    {
      label: "California Income Tax (9 brackets)",
      value: baseTax,
      citation: CITATIONS.californiaRate,
    },
    ...(mentalHealthTax > 0
      ? [
          {
            label: "Mental Health Services Tax (1% over $1M)",
            value: mentalHealthTax,
            citation: CITATIONS.californiaRate,
          },
        ]
      : []),
    {
      label: "Personal Exemption Credit",
      value: exemptionCredit,
      citation: CITATIONS.californiaExemptionCredit,
    },
    {
      label: "California Tax After Credits",
      value: californiaTax,
      citation: CITATIONS.californiaRate,
    },
    { label: "State Tax Withheld", value: stateWithheld },
    {
      label: refundOrOwed >= 0 ? "State Refund" : "State Owed",
      value: Math.abs(refundOrOwed),
    },
  ];

  return {
    federalAGI,
    californiaAGI,
    standardDeduction,
    exemptionCredit,
    californiaTaxableIncome,
    bracketBreakdown,
    baseTax,
    mentalHealthTax,
    totalTaxBeforeCredits,
    californiaTax,
    stateWithheld,
    refundOrOwed: Math.round(refundOrOwed * 100) / 100,
    lineItems,
  };
}
