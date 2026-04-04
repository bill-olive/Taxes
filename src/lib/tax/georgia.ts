import { GEORGIA, CITATIONS } from "./constants";
import type { TaxInput, GeorgiaResult, LineItem } from "./types";

export function calculateGeorgiaTax(input: TaxInput): GeorgiaResult {
  const federalAGI = input.wages;
  const georgiaAdjustments = 0;
  const georgiaAGI = federalAGI + georgiaAdjustments;

  const standardDeduction = GEORGIA.standardDeduction.single;
  const personalExemption = GEORGIA.personalExemption;

  const georgiaTaxableIncome = Math.max(
    0,
    georgiaAGI - standardDeduction - personalExemption
  );

  // 2025: Flat tax rate under HB 1015
  const georgiaTax = Math.round(georgiaTaxableIncome * GEORGIA.flatRate * 100) / 100;

  // Single bracket breakdown for display consistency
  const bracketBreakdown = georgiaTaxableIncome > 0
    ? [{ rate: GEORGIA.flatRate, taxableAtRate: georgiaTaxableIncome, tax: georgiaTax }]
    : [];

  const stateWithheld = input.stateWithheld;
  const refundOrOwed = stateWithheld - georgiaTax;

  // Build line items with citations
  const lineItems: LineItem[] = [
    {
      label: "Federal AGI",
      value: federalAGI,
    },
    {
      label: "Georgia AGI",
      value: georgiaAGI,
    },
    {
      label: "GA Standard Deduction",
      value: standardDeduction,
      citation: CITATIONS.georgiaStandardDeduction,
    },
    {
      label: "GA Personal Exemption",
      value: personalExemption,
      citation: CITATIONS.georgiaPersonalExemption,
    },
    {
      label: "Georgia Taxable Income",
      value: georgiaTaxableIncome,
    },
    {
      label: `Georgia Tax (${(GEORGIA.flatRate * 100).toFixed(2)}% flat rate)`,
      value: georgiaTax,
      citation: CITATIONS.georgiaFlatTax,
    },
    {
      label: "State Tax Withheld",
      value: stateWithheld,
    },
    {
      label: refundOrOwed >= 0 ? "State Refund" : "State Owed",
      value: Math.abs(refundOrOwed),
    },
  ];

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
    lineItems,
  };
}
