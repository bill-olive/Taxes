export interface TaxInput {
  filingStatus: "single";
  wages: number;
  federalWithheld: number;
  stateWithheld: number;
  tuitionPaid: number;
  isFullTimeStudent: boolean;
  propertyTaxPaid: number;
  mortgageInterest: number;
  charitableContributions: number;
  stateIncomeTaxPaid: number;
}

export interface BracketBreakdown {
  rate: number;
  taxableAtRate: number;
  tax: number;
}

export interface DeductionResult {
  standardDeduction: number;
  itemizedDeduction: number;
  recommendedMethod: "standard" | "itemized";
  itemizedBreakdown: {
    saltDeduction: number;
    mortgageInterest: number;
    charitableContributions: number;
  };
  explanation: string;
}

export interface CreditResult {
  name: string;
  eligible: boolean;
  amount: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  explanation: string;
}

export interface FederalResult {
  grossIncome: number;
  adjustedGrossIncome: number;
  deduction: DeductionResult;
  taxableIncome: number;
  bracketBreakdown: BracketBreakdown[];
  taxBeforeCredits: number;
  credits: CreditResult[];
  totalCredits: number;
  taxAfterCredits: number;
  totalWithheld: number;
  refundOrOwed: number;
}

export interface GeorgiaResult {
  federalAGI: number;
  georgiaAdjustments: number;
  georgiaAGI: number;
  standardDeduction: number;
  personalExemption: number;
  georgiaTaxableIncome: number;
  bracketBreakdown: BracketBreakdown[];
  georgiaTax: number;
  stateWithheld: number;
  refundOrOwed: number;
}

export interface Recommendation {
  id: string;
  type: "credit" | "deduction" | "info" | "warning";
  title: string;
  description: string;
  estimatedBenefit: number;
  actionRequired: boolean;
}

export interface TaxResult {
  taxYear: number;
  federal: FederalResult;
  georgia: GeorgiaResult;
  recommendations: Recommendation[];
  totalRefundOrOwed: number;
  calculatedAt: string;
}
