import { TAX_YEAR, FEDERAL } from "./constants";
import type { TaxInput, TaxResult, StateResult, Recommendation } from "./types";
import { calculateFederalTax } from "./federal";
import { calculateGeorgiaTax } from "./georgia";
import { calculateCaliforniaTax } from "./california";

function calculateStateTax(input: TaxInput, stateCode: string): StateResult {
  switch (stateCode) {
    case "CA": {
      const ca = calculateCaliforniaTax(input);
      return {
        stateCode: "CA",
        stateName: "California",
        refundOrOwed: ca.refundOrOwed,
        lineItems: ca.lineItems,
      };
    }
    case "GA":
    default: {
      const ga = calculateGeorgiaTax(input);
      return {
        stateCode: "GA",
        stateName: "Georgia",
        refundOrOwed: ga.refundOrOwed,
        lineItems: ga.lineItems,
      };
    }
  }
}

function generateRecommendations(
  input: TaxInput,
  result: { federal: TaxResult["federal"]; state: StateResult }
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
  const totalRefund = result.federal.refundOrOwed + result.state.refundOrOwed;
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

export function calculateTaxes(input: TaxInput, stateCode: string = "GA"): TaxResult {
  const federal = calculateFederalTax(input);
  const state = calculateStateTax(input, stateCode);

  const partial = { federal, state };
  const recommendations = generateRecommendations(input, partial);
  const totalRefundOrOwed =
    Math.round((federal.refundOrOwed + state.refundOrOwed) * 100) / 100;

  return {
    taxYear: TAX_YEAR,
    federal,
    state,
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

  // Investment income
  const inv = taxReturn.investmentIncome ?? {
    form1099INTs: [],
    form1099DIVs: [],
    form1099Bs: [],
  };
  const interestIncome = inv.form1099INTs.reduce(
    (s, f) => s + f.interestIncome,
    0
  );
  const ordinaryDividends = inv.form1099DIVs.reduce(
    (s, f) => s + f.ordinaryDividends,
    0
  );
  const qualifiedDividends = inv.form1099DIVs.reduce(
    (s, f) => s + f.qualifiedDividends,
    0
  );
  const capitalGainFromDivs = inv.form1099DIVs.reduce(
    (s, f) => s + f.totalCapitalGain,
    0
  );
  const netBrokerGain = inv.form1099Bs.reduce(
    (s, f) => s + (f.proceeds - f.costBasis),
    0
  );
  const totalCapitalGains = Math.max(0, netBrokerGain + capitalGainFromDivs);
  const totalCapitalLosses = Math.max(
    0,
    -(netBrokerGain + capitalGainFromDivs)
  );
  // Additional federal withholding from 1099s
  const invFedWithheld =
    inv.form1099INTs.reduce((s, f) => s + f.federalWithheld, 0) +
    inv.form1099DIVs.reduce((s, f) => s + f.federalWithheld, 0) +
    inv.form1099Bs.reduce((s, f) => s + f.federalWithheld, 0);

  // IRA deduction calculation
  const ira = taxReturn.iraContributions ?? {
    hasTraditionalIRA: false,
    traditionalContribution: 0,
    coveredByEmployerPlan: false,
    age50OrOlder: false,
  };
  let iraDeduction = 0;
  if (ira.hasTraditionalIRA && ira.traditionalContribution > 0) {
    const limit =
      FEDERAL.ira.maxContribution +
      (ira.age50OrOlder ? FEDERAL.ira.catchUpContribution : 0);
    const contribution = Math.min(ira.traditionalContribution, limit);

    // Check if employer plan coverage triggers a phaseout
    const coveredByPlan =
      ira.coveredByEmployerPlan ||
      taxReturn.w2s.some((w) => w.retirementPlan);

    if (coveredByPlan) {
      const phaseout =
        FEDERAL.ira.deductionPhaseout_covered[taxReturn.filingStatus];
      // Estimate gross income for phaseout check (wages + investment)
      const estGross =
        totalWages +
        interestIncome +
        ordinaryDividends +
        Math.max(0, totalCapitalGains - totalCapitalLosses);

      if (estGross <= phaseout.start) {
        iraDeduction = contribution;
      } else if (estGross >= phaseout.end) {
        iraDeduction = 0;
      } else {
        const ratio =
          (phaseout.end - estGross) / (phaseout.end - phaseout.start);
        iraDeduction = Math.round(contribution * ratio / 10) * 10; // IRS rounds to nearest $10
      }
    } else {
      // Not covered by employer plan — full deduction
      iraDeduction = contribution;
    }
  }

  return {
    filingStatus: taxReturn.filingStatus,
    wages: totalWages,
    interestIncome,
    ordinaryDividends,
    qualifiedDividends,
    capitalGains: totalCapitalGains,
    capitalLosses: totalCapitalLosses,
    federalWithheld: totalFedWithheld + invFedWithheld,
    stateWithheld: totalStateWithheld,
    tuitionPaid: taxReturn.education.tuitionPaid,
    isFullTimeStudent: taxReturn.education.isFullTimeStudent,
    propertyTaxPaid: taxReturn.property.propertyTaxPaid,
    mortgageInterest: taxReturn.property.mortgageInterest,
    charitableContributions:
      taxReturn.additionalDeductions.charitableContributions,
    stateIncomeTaxPaid: totalStateWithheld,
    iraDeduction,
    // Dependents
    numChildrenUnder17: countChildrenUnder17(taxReturn.dependents ?? []),
    numOtherDependents: countOtherDependents(taxReturn.dependents ?? []),
    childcareExpenses: taxReturn.childcareExpenses ?? 0,
  };
}

function countChildrenUnder17(dependents: import("@/types").Dependent[]): number {
  const cutoff = new Date(2025 - 17, 0, 2); // Born after Jan 1, 2009 = under 17 at end of 2025
  return dependents.filter((d) => {
    if (!d.dob) return false;
    return new Date(d.dob) > cutoff;
  }).length;
}

function countOtherDependents(dependents: import("@/types").Dependent[]): number {
  const cutoff = new Date(2025 - 17, 0, 2);
  return dependents.filter((d) => {
    if (!d.dob) return true; // If no DOB, assume other dependent
    return new Date(d.dob) <= cutoff;
  }).length;
}
