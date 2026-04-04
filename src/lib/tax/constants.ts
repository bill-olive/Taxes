// 2025 Tax Year Constants
// See TAX_RULES_2025.md for full citations and source documents.

export const TAX_YEAR = 2025;

export interface Citation {
  rule: string;
  source: string;
  section: string;
  url?: string;
  note?: string;
}

export const CITATIONS: Record<string, Citation> = {
  federalStandardDeduction: {
    rule: "Federal Standard Deduction — Single",
    source: "IRS Revenue Procedure 2024-40",
    section: "Section 3.01",
    url: "https://www.irs.gov/irb/2024-41_IRB#REV-PROC-2024-40",
    note: "IRC § 63(c), adjusted for inflation under IRC § 1(f)(3)",
  },
  federalBrackets: {
    rule: "Federal Income Tax Brackets — Single",
    source: "IRS Revenue Procedure 2024-40",
    section: "Section 3.02, Table 1",
    url: "https://www.irs.gov/irb/2024-41_IRB#REV-PROC-2024-40",
    note: "IRC § 1(a)-(d), adjusted for inflation under IRC § 1(f)",
  },
  aotcCredit: {
    rule: "American Opportunity Tax Credit",
    source: "IRC § 25A(b), (d), and (i)",
    section: "American Taxpayer Relief Act of 2012",
    url: "https://www.irs.gov/credits-deductions/individuals/aotc",
    note: "Amounts and phase-out thresholds are statutory and not indexed for inflation. Form 8863.",
  },
  saltCap: {
    rule: "SALT Deduction Cap",
    source: "IRC § 164(b)(6)",
    section: "Tax Cuts and Jobs Act of 2017 (P.L. 115-97)",
    url: "https://www.irs.gov/newsroom/tax-cuts-and-jobs-act-provision-11011-section-164-background",
    note: "Cap is $10,000 for all filing statuses. Not indexed for inflation. Applies through 2025 tax year.",
  },
  personalExemption: {
    rule: "Personal Exemption (Suspended)",
    source: "IRS Revenue Procedure 2024-40",
    section: "Section 3.24",
    url: "https://www.irs.gov/irb/2024-41_IRB#REV-PROC-2024-40",
    note: "IRC § 151(d)(5). Suspended by TCJA through 2025.",
  },
  georgiaFlatTax: {
    rule: "Georgia Flat Income Tax Rate — 5.39%",
    source: "Georgia HB 1015 (2024)",
    section: "O.C.G.A. § 48-7-20",
    url: "https://dor.georgia.gov/income-tax",
    note: "Effective January 1, 2025. Replaces graduated brackets (1%–5.49%). Rate decreases 0.10%/year contingent on revenue triggers, floor of 4.99%.",
  },
  georgiaStandardDeduction: {
    rule: "Georgia Standard Deduction — Single",
    source: "Georgia HB 1015 (2024)",
    section: "O.C.G.A. § 48-7-20",
    url: "https://dor.georgia.gov/income-tax",
    note: "Increased from $5,400 to $12,000 for single filers as part of flat tax transition.",
  },
  georgiaPersonalExemption: {
    rule: "Georgia Personal Exemption",
    source: "O.C.G.A. § 48-7-26",
    section: "O.C.G.A. § 48-7-26",
    url: "https://dor.georgia.gov/income-tax",
    note: "Not eliminated by HB 1015 for 2025.",
  },
  propertyTaxDeduction: {
    rule: "Property Tax Deduction",
    source: "IRC § 164(a)(1) and IRC § 164(b)(6)",
    section: "Deductible as part of SALT, subject to $10,000 cap",
    url: "https://www.irs.gov/publications/p530",
    note: "Combined with state income tax under the SALT cap.",
  },
  mortgageInterest: {
    rule: "Mortgage Interest Deduction",
    source: "IRC § 163(h)(3)",
    section: "As amended by TCJA",
    url: "https://www.irs.gov/publications/p936",
    note: "Limit of $750,000 in mortgage debt for loans after December 15, 2017.",
  },
  charitableContributions: {
    rule: "Charitable Contribution Deduction",
    source: "IRC § 170",
    section: "Schedule A, Itemized Deductions",
    url: "https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contribution-deductions",
    note: "Cash contributions to qualifying 501(c)(3) organizations. Generally limited to 60% of AGI.",
  },
  hoaNotDeductible: {
    rule: "HOA Fees — Not Deductible",
    source: "IRS Publication 530",
    section: "Tax Information for Homeowners",
    url: "https://www.irs.gov/publications/p530",
    note: "HOA and condo fees are not deductible for a primary residence.",
  },
  insuranceNotDeductible: {
    rule: "Homeowner's Insurance — Not Deductible",
    source: "IRS Publication 530",
    section: "Tax Information for Homeowners",
    url: "https://www.irs.gov/publications/p530",
    note: "Homeowner's insurance premiums are not deductible for a primary residence.",
  },
  eitc: {
    rule: "Earned Income Tax Credit — Single, No Dependents",
    source: "IRS Revenue Procedure 2024-40",
    section: "Section 3.07(1), Table 5",
    url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc",
    note: "IRC § 32. Max credit $649. Phase-out begins at $10,620 AGI, ends at $19,104.",
  },
} as const;

// All values from Rev. Proc. 2024-40 for 2025 tax year
export const FEDERAL = {
  standardDeduction: {
    single: 15000,
    married_filing_jointly: 30000,
    married_filing_separately: 15000,
    head_of_household: 22500,
    qualifying_surviving_spouse: 30000,
  },
  brackets: {
    single: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250525, rate: 0.32 },
      { min: 250525, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 },
    ],
    married_filing_jointly: [
      { min: 0, max: 23850, rate: 0.10 },
      { min: 23850, max: 96950, rate: 0.12 },
      { min: 96950, max: 206700, rate: 0.22 },
      { min: 206700, max: 394600, rate: 0.24 },
      { min: 394600, max: 501050, rate: 0.32 },
      { min: 501050, max: 751600, rate: 0.35 },
      { min: 751600, max: Infinity, rate: 0.37 },
    ],
    married_filing_separately: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250525, rate: 0.32 },
      { min: 250525, max: 375800, rate: 0.35 },
      { min: 375800, max: Infinity, rate: 0.37 },
    ],
    head_of_household: [
      { min: 0, max: 17000, rate: 0.10 },
      { min: 17000, max: 64850, rate: 0.12 },
      { min: 64850, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250500, rate: 0.32 },
      { min: 250500, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 },
    ],
    qualifying_surviving_spouse: [
      { min: 0, max: 23850, rate: 0.10 },
      { min: 23850, max: 96950, rate: 0.12 },
      { min: 96950, max: 206700, rate: 0.22 },
      { min: 206700, max: 394600, rate: 0.24 },
      { min: 394600, max: 501050, rate: 0.32 },
      { min: 501050, max: 751600, rate: 0.35 },
      { min: 751600, max: Infinity, rate: 0.37 },
    ],
  },
  saltCap: 10000,
  aotc: {
    maxCredit: 2500,
    fullCreditUpTo: 2000,
    partialCreditUpTo: 4000,
    partialRate: 0.25,
    refundablePercent: 0.40,
    maxRefundable: 1000,
    incomePhaseoutStart: {
      single: 80000,
      married_filing_jointly: 160000,
      married_filing_separately: 80000,
      head_of_household: 80000,
      qualifying_surviving_spouse: 160000,
    },
    incomePhaseoutEnd: {
      single: 90000,
      married_filing_jointly: 180000,
      married_filing_separately: 90000,
      head_of_household: 90000,
      qualifying_surviving_spouse: 180000,
    },
  },
} as const;

// Georgia transitioned to a flat tax for 2025 under HB 1015
export const GEORGIA = {
  standardDeduction: {
    single: 12000,
    married_filing_jointly: 24000,
    married_filing_separately: 12000,
    head_of_household: 12000,
    qualifying_surviving_spouse: 24000,
  },
  personalExemption: {
    single: 3700,
    married_filing_jointly: 7400,
    married_filing_separately: 3700,
    head_of_household: 3700,
    qualifying_surviving_spouse: 7400,
  },
  // Flat rate — no brackets for 2025
  flatRate: 0.0539,
} as const;
