import { FEDERAL, CITATIONS } from "./constants";
import type { TaxInput, CreditResult } from "./types";

export function calculateAOTC(input: TaxInput): CreditResult {
  const { aotc } = FEDERAL;
  const citation = CITATIONS.aotcCredit;
  const phaseoutStart = aotc.incomePhaseoutStart[input.filingStatus];
  const phaseoutEnd = aotc.incomePhaseoutEnd[input.filingStatus];

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
      citation,
    };
  }

  if (input.wages > phaseoutEnd) {
    return {
      name: "American Opportunity Tax Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation: `Your income exceeds the $${phaseoutEnd.toLocaleString()} phase-out limit for this credit.`,
      citation,
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
  if (input.wages > phaseoutStart) {
    const phaseoutRange = phaseoutEnd - phaseoutStart;
    const overAmount = input.wages - phaseoutStart;
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
    citation,
  };
}

export function calculateChildTaxCredit(input: TaxInput): CreditResult {
  const { ctc } = FEDERAL;
  const citation = CITATIONS.childTaxCredit;
  const numChildren = input.numChildrenUnder17 || 0;

  if (numChildren === 0) {
    return {
      name: "Child Tax Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation:
        "No qualifying children under 17 were listed. The Child Tax Credit requires a qualifying child under age 17 with a valid SSN.",
      citation,
    };
  }

  // Base credit
  let credit = numChildren * ctc.creditPerChild;

  // Phase-out: $50 reduction per $1,000 (or fraction thereof) over threshold
  const totalIncome = input.wages + (input.interestIncome || 0) + (input.ordinaryDividends || 0);
  const phaseoutStart = ctc.incomePhaseoutStart[input.filingStatus];
  if (totalIncome > phaseoutStart) {
    const overAmount = totalIncome - phaseoutStart;
    const reductionSteps = Math.ceil(overAmount / 1000);
    const reduction = reductionSteps * ctc.phaseoutRate;
    credit = Math.max(0, credit - reduction);
  }

  if (credit === 0) {
    return {
      name: "Child Tax Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation: `Your income exceeds the phase-out threshold of $${phaseoutStart.toLocaleString()}. The credit has been fully phased out.`,
      citation,
    };
  }

  // Refundable portion (Additional Child Tax Credit)
  // 15% of earned income above $2,500, up to $1,700 per child
  const maxRefundable = numChildren * ctc.refundableMax;
  let refundableAmount = 0;
  if (input.wages > ctc.earnedIncomeThreshold) {
    refundableAmount = Math.min(
      (input.wages - ctc.earnedIncomeThreshold) * ctc.refundableRate,
      maxRefundable,
      credit
    );
  }
  refundableAmount = Math.round(refundableAmount * 100) / 100;
  const nonRefundableAmount = Math.round((credit - refundableAmount) * 100) / 100;

  credit = Math.round(credit * 100) / 100;

  return {
    name: "Child Tax Credit",
    eligible: true,
    amount: credit,
    refundableAmount,
    nonRefundableAmount,
    explanation: `You have ${numChildren} qualifying child${numChildren > 1 ? "ren" : ""} under 17, qualifying for a $${credit.toLocaleString()} Child Tax Credit. Of this, $${refundableAmount.toLocaleString()} is refundable (Additional Child Tax Credit).`,
    citation,
  };
}

export function calculateOtherDependentCredit(input: TaxInput): CreditResult {
  const { ctc } = FEDERAL;
  const citation = CITATIONS.otherDependentCredit;
  const numOther = input.numOtherDependents || 0;

  if (numOther === 0) {
    return {
      name: "Credit for Other Dependents",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation:
        "No dependents age 17 or older were listed.",
      citation,
    };
  }

  let credit = numOther * ctc.otherDependentCredit;

  // Same phase-out as CTC
  const totalIncome = input.wages + (input.interestIncome || 0) + (input.ordinaryDividends || 0);
  const phaseoutStart = ctc.incomePhaseoutStart[input.filingStatus];
  if (totalIncome > phaseoutStart) {
    const overAmount = totalIncome - phaseoutStart;
    const reductionSteps = Math.ceil(overAmount / 1000);
    const reduction = reductionSteps * ctc.phaseoutRate;
    credit = Math.max(0, credit - reduction);
  }

  if (credit === 0) {
    return {
      name: "Credit for Other Dependents",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation: `Your income exceeds the phase-out threshold. The credit has been fully phased out.`,
      citation,
    };
  }

  return {
    name: "Credit for Other Dependents",
    eligible: true,
    amount: Math.round(credit * 100) / 100,
    refundableAmount: 0, // Non-refundable
    nonRefundableAmount: Math.round(credit * 100) / 100,
    explanation: `You have ${numOther} dependent${numOther > 1 ? "s" : ""} age 17 or older, qualifying for a $${Math.round(credit).toLocaleString()} non-refundable credit.`,
    citation,
  };
}

export function calculateChildCareCredit(input: TaxInput): CreditResult {
  const { cdcc } = FEDERAL;
  const citation = CITATIONS.childDependentCareCredit;
  const expenses = input.childcareExpenses || 0;
  const numQualifying = (input.numChildrenUnder17 || 0) + (input.numOtherDependents || 0);

  if (expenses === 0 || numQualifying === 0) {
    return {
      name: "Child and Dependent Care Credit",
      eligible: false,
      amount: 0,
      refundableAmount: 0,
      nonRefundableAmount: 0,
      explanation:
        expenses === 0
          ? "No childcare or dependent care expenses were reported. If you paid for daycare, after-school care, or a caretaker for a dependent so you could work, enter those expenses."
          : "No qualifying dependents were listed.",
      citation,
    };
  }

  // Cap expenses based on number of qualifying individuals
  const maxExpenses =
    numQualifying >= 2 ? cdcc.maxExpensesTwoPlus : cdcc.maxExpensesOneChild;
  const qualifyingExpenses = Math.min(expenses, maxExpenses);

  // Determine rate based on AGI
  const agi = input.wages + (input.interestIncome || 0) + (input.ordinaryDividends || 0);
  let rate: number = cdcc.maxCreditRate; // 35%
  if (agi > cdcc.rateReductionStart) {
    const stepsOver = Math.floor(
      (agi - cdcc.rateReductionStart) / cdcc.rateReductionPerStep
    );
    rate = Math.max(cdcc.minCreditRate, cdcc.maxCreditRate - stepsOver * 0.01);
  }

  const credit = Math.round(qualifyingExpenses * rate * 100) / 100;

  return {
    name: "Child and Dependent Care Credit",
    eligible: true,
    amount: credit,
    refundableAmount: 0, // Non-refundable for 2025
    nonRefundableAmount: credit,
    explanation: `Based on $${qualifyingExpenses.toLocaleString()} in qualifying care expenses at a ${(rate * 100).toFixed(0)}% rate, you qualify for a $${credit.toLocaleString()} non-refundable credit. (Form 2441)`,
    citation,
  };
}

export function calculateAllCredits(input: TaxInput): CreditResult[] {
  return [
    calculateAOTC(input),
    calculateChildTaxCredit(input),
    calculateOtherDependentCredit(input),
    calculateChildCareCredit(input),
  ];
}
