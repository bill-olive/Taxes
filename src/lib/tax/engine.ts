import { TAX_YEAR } from "./constants";
import type { TaxInput, TaxResult, Recommendation } from "./types";
import { calculateFederalTax } from "./federal";
import { calculateGeorgiaTax } from "./georgia";

function generateRecommendations(
  input: TaxInput,
  result: Omit<TaxResult, "recommendations" | "totalRefundOrOwed" | "calculatedAt" | "taxYear">
): Recommendation[] {
  const recs: Recommendation[] = [];

  // AOTC recommendation
  const aotcCredit = result.federal.credits.find(
    (c) => c.name === "American Opportunity Tax Credit"
  );
  if (aotcCredit?.eligible) {
    recs.push({
      id: "aotc-eligible",
      type: "credit",
      title: "You qualify for the American Opportunity Tax Credit!",
      description: aotcCredit.explanation,
      estimatedBenefit: aotcCredit.amount,
      actionRequired: false,
    });
  } else if (input.isFullTimeStudent && input.tuitionPaid === 0) {
    recs.push({
      id: "aotc-missing-tuition",
      type: "info",
      title: "Did you pay tuition this year?",
      description:
        "As a full-time student, you may qualify for the American Opportunity Tax Credit worth up to $2,500. Check your 1098-T form from your school and enter your tuition amount.",
      estimatedBenefit: 2500,
      actionRequired: true,
    });
  }

  // Deduction recommendation
  const { deduction } = result.federal;
  if (deduction.recommendedMethod === "standard") {
    recs.push({
      id: "standard-deduction",
      type: "deduction",
      title: "Standard deduction recommended",
      description: deduction.explanation,
      estimatedBenefit: deduction.standardDeduction,
      actionRequired: false,
    });
  } else {
    recs.push({
      id: "itemized-deduction",
      type: "deduction",
      title: "Itemizing could save you more",
      description: deduction.explanation,
      estimatedBenefit: deduction.itemizedDeduction - deduction.standardDeduction,
      actionRequired: false,
    });
  }

  // Refund info
  const totalRefund = result.federal.refundOrOwed + result.georgia.refundOrOwed;
  if (totalRefund > 0) {
    recs.push({
      id: "refund-expected",
      type: "info",
      title: `You may be getting a refund of $${Math.round(totalRefund).toLocaleString()}`,
      description: `Based on your withholdings and tax liability, you're on track for a combined federal and state refund.`,
      estimatedBenefit: totalRefund,
      actionRequired: false,
    });
  } else if (totalRefund < 0) {
    recs.push({
      id: "taxes-owed",
      type: "warning",
      title: `You may owe $${Math.round(Math.abs(totalRefund)).toLocaleString()}`,
      description: `Based on your withholdings, you may owe additional taxes. Consider adjusting your W-4 withholding for next year.`,
      estimatedBenefit: 0,
      actionRequired: true,
    });
  }

  return recs;
}

export function calculateTaxes(input: TaxInput): TaxResult {
  const federal = calculateFederalTax(input);
  const georgia = calculateGeorgiaTax(input);

  const partial = { federal, georgia };
  const recommendations = generateRecommendations(input, partial);
  const totalRefundOrOwed =
    Math.round((federal.refundOrOwed + georgia.refundOrOwed) * 100) / 100;

  return {
    taxYear: TAX_YEAR,
    federal,
    georgia,
    recommendations,
    totalRefundOrOwed,
    calculatedAt: new Date().toISOString(),
  };
}

export function taxReturnToInput(
  taxReturn: import("@/types").TaxReturn
): TaxInput {
  const totalWages = taxReturn.w2s.reduce((sum, w) => sum + w.wages, 0);
  const totalFedWithheld = taxReturn.w2s.reduce(
    (sum, w) => sum + w.federalWithheld,
    0
  );
  const totalStateWithheld = taxReturn.w2s.reduce(
    (sum, w) => sum + w.stateWithheld,
    0
  );

  return {
    filingStatus: "single",
    wages: totalWages,
    federalWithheld: totalFedWithheld,
    stateWithheld: totalStateWithheld,
    tuitionPaid: taxReturn.education.tuitionPaid,
    isFullTimeStudent: taxReturn.education.isFullTimeStudent,
    propertyTaxPaid: taxReturn.property.propertyTaxPaid,
    mortgageInterest: taxReturn.property.mortgageInterest,
    charitableContributions:
      taxReturn.additionalDeductions.charitableContributions,
    stateIncomeTaxPaid: totalStateWithheld,
  };
}
