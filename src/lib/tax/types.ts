import type { Citation } from "./constants";

export interface TaxInput {
  filingStatus: import("@/types").FilingStatus;
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
  citations: Record<string, Citation>;
}

export interface CreditResult {
  name: string;
  eligible: boolean;
  amount: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  explanation: string;
  citation: Citation;
}

export interface LineItem {
  label: string;
  value: number;
  citation?: Citation;
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
  lineItems: LineItem[];
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
  lineItems: LineItem[];
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
