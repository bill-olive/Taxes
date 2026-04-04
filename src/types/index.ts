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
  wages: number;
  federalWithheld: number;
  stateWages: number;
  stateWithheld: number;
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
  type: "w2" | "property_tax" | "1098t" | "other";
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
  residency: Residency;
  w2s: W2Entry[];
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
    residency: { state: "GA", fullYear: true },
    w2s: [],
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
