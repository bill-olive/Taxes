export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dob: string;
  ssnEncrypted: string;
  ssnLastFour: string;
  address: Address;
}

export interface Residency {
  state: string;
  fullYear: boolean;
}

export interface W2Entry {
  employerName: string;
  employerEIN: string;
  employerAddress: string;
  // Box 1 - Wages, tips, other compensation
  wages: number;
  // Box 2 - Federal income tax withheld
  federalWithheld: number;
  // Box 3 - Social security wages
  socialSecurityWages: number;
  // Box 4 - Social security tax withheld
  socialSecurityWithheld: number;
  // Box 5 - Medicare wages and tips
  medicareWages: number;
  // Box 6 - Medicare tax withheld
  medicareWithheld: number;
  // Box 7 - Social security tips
  socialSecurityTips: number;
  // Box 8 - Allocated tips
  allocatedTips: number;
  // Box 10 - Dependent care benefits
  dependentCareBenefits: number;
  // Box 11 - Nonqualified plans
  nonqualifiedPlans: number;
  // Box 12a-12d - Codes and amounts (e.g., DD for health insurance)
  box12: { code: string; amount: number }[];
  // Box 13 - Checkboxes
  isStatutoryEmployee: boolean;
  retirementPlan: boolean;
  thirdPartySickPay: boolean;
  // Box 14 - Other
  box14Other: string;
  // Box 15 - State
  state: string;
  // Box 16 - State wages
  stateWages: number;
  // Box 17 - State income tax withheld
  stateWithheld: number;
  // Box 18 - Local wages
  localWages: number;
  // Box 19 - Local income tax
  localWithheld: number;
  // Box 20 - Locality name
  localityName: string;
}

// 1099-INT: Interest income from banks/CDs
export interface Form1099INT {
  payerName: string;
  payerEIN: string;
  interestIncome: number;        // Box 1
  earlyWithdrawalPenalty: number; // Box 2
  federalWithheld: number;       // Box 4
  taxExemptInterest: number;     // Box 8
}

// 1099-DIV: Dividend income from stocks/mutual funds
export interface Form1099DIV {
  payerName: string;
  payerEIN: string;
  ordinaryDividends: number;     // Box 1a
  qualifiedDividends: number;    // Box 1b
  totalCapitalGain: number;      // Box 2a
  section1250Gain: number;       // Box 2b — unrecaptured §1250 gain
  federalWithheld: number;       // Box 4
  foreignTaxPaid: number;        // Box 7
  exemptInterestDividends: number; // Box 12
}

// 1099-B: Proceeds from broker transactions (stocks, crypto, etc.)
export interface Form1099B {
  brokerName: string;
  description: string;           // e.g., "100 shares AAPL"
  dateAcquired: string;
  dateSold: string;
  proceeds: number;              // Box 1d
  costBasis: number;             // Box 1e
  gainOrLoss: number;            // computed
  isShortTerm: boolean;          // held < 1 year
  federalWithheld: number;       // Box 4
}

export interface InvestmentIncome {
  form1099INTs: Form1099INT[];
  form1099DIVs: Form1099DIV[];
  form1099Bs: Form1099B[];
}

export interface Dependent {
  firstName: string;
  lastName: string;
  relationship: string;
  dob: string;
  ssnLastFour: string;
  monthsLived: number; // months lived with you in 2025
}

export interface Education {
  isFullTimeStudent: boolean;
  institutionName: string;
  tuitionPaid: number;
}

export interface Property {
  hasProperty: boolean;
  address: Address | null;
  propertyTaxPaid: number;
  mortgageInterest: number;
  hoaDues: number;
  insuranceCost: number;
}

export interface AdditionalDeductions {
  healthInsurancePremiums: number;
  charitableContributions: number;
  otherDeductions: number;
  otherDescription: string;
}

export interface DocumentMeta {
  fileName: string;
  type: "w2" | "1099int" | "1099div" | "1099b" | "property_tax" | "1098t" | "other";
  storagePath: string;
  uploadedAt: string;
}

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  | "qualifying_surviving_spouse";

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  married_filing_jointly: "Married Filing Jointly",
  married_filing_separately: "Married Filing Separately",
  head_of_household: "Head of Household",
  qualifying_surviving_spouse: "Qualifying Surviving Spouse",
};

export interface TaxReturn {
  status: "in_progress" | "completed";
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  personalInfo: PersonalInfo;
  filingStatus: FilingStatus;
  dependents: Dependent[];
  residency: Residency;
  w2s: W2Entry[];
  investmentIncome: InvestmentIncome;
  education: Education;
  property: Property;
  additionalDeductions: AdditionalDeductions;
  documents: DocumentMeta[];
  calculationResult: import("../lib/tax/types").TaxResult | null;
}

export const INTAKE_STEPS = [
  { id: "personal-info", label: "Personal Info" },
  { id: "filing-status", label: "Filing Status" },
  { id: "residency", label: "Residency" },
  { id: "w2-income", label: "W-2 Income" },
  { id: "investments", label: "Investments" },
  { id: "education", label: "Education" },
  { id: "property", label: "Property" },
  { id: "deductions", label: "Deductions" },
] as const;

export type IntakeStepId = (typeof INTAKE_STEPS)[number]["id"];

export function getDefaultTaxReturn(): TaxReturn {
  return {
    status: "in_progress",
    currentStep: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalInfo: {
      firstName: "",
      lastName: "",
      dob: "",
      ssnEncrypted: "",
      ssnLastFour: "",
      address: { street: "", city: "", state: "GA", zip: "" },
    },
    filingStatus: "single",
    dependents: [],
    residency: { state: "GA", fullYear: true },
    w2s: [],
    investmentIncome: {
      form1099INTs: [],
      form1099DIVs: [],
      form1099Bs: [],
    },
    education: { isFullTimeStudent: false, institutionName: "", tuitionPaid: 0 },
    property: {
      hasProperty: false,
      address: null,
      propertyTaxPaid: 0,
      mortgageInterest: 0,
      hoaDues: 0,
      insuranceCost: 0,
    },
    additionalDeductions: {
      healthInsurancePremiums: 0,
      charitableContributions: 0,
      otherDeductions: 0,
      otherDescription: "",
    },
    documents: [],
    calculationResult: null,
  };
}
