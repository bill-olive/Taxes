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
  childTaxCredit: {
    rule: "Child Tax Credit",
    source: "IRC § 24",
    section: "Tax Cuts and Jobs Act of 2017",
    url: "https://www.irs.gov/credits-deductions/individuals/child-tax-credit",
    note: "$2,000 per qualifying child under 17. Up to $1,700 refundable (Additional Child Tax Credit) for 2025. Phase-out begins at $200,000 ($400,000 MFJ).",
  },
  otherDependentCredit: {
    rule: "Credit for Other Dependents",
    source: "IRC § 24(h)(4)",
    section: "Tax Cuts and Jobs Act of 2017",
    url: "https://www.irs.gov/credits-deductions/individuals/child-tax-credit",
    note: "$500 non-refundable credit for dependents who don't qualify for CTC (age 17+, elderly parents, etc.).",
  },
  childDependentCareCredit: {
    rule: "Child and Dependent Care Credit",
    source: "IRC § 21",
    section: "Form 2441",
    url: "https://www.irs.gov/forms-pubs/about-form-2441",
    note: "20-35% of up to $3,000 in care expenses for one qualifying individual, $6,000 for two or more. Non-refundable.",
  },
  iraDeduction: {
    rule: "IRA Deduction",
    source: "IRC § 219",
    section: "Schedule 1, Part II, Line 20",
    url: "https://www.irs.gov/retirement-plans/ira-deduction-limits",
    note: "Traditional IRA contributions may be deductible as an above-the-line adjustment to income. Limit: $7,000 ($8,000 if age 50+). Deductibility may be reduced if covered by an employer retirement plan above certain AGI thresholds.",
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
  californiaRate: {
    rule: "California Income Tax Rates",
    source: "California Revenue & Taxation Code § 17041",
    section: "FTB Tax Rate Schedules",
    url: "https://www.ftb.ca.gov/forms/2025/2025-540-tax-rate-schedules.html",
    note: "9 graduated brackets from 1% to 12.3%, plus 1% Mental Health Services Tax on income over $1M (Proposition 63). Total top rate: 13.3%.",
  },
  californiaStandardDeduction: {
    rule: "California Standard Deduction",
    source: "California Revenue & Taxation Code § 17073.5",
    section: "FTB Form 540 Instructions",
    url: "https://www.ftb.ca.gov",
    note: "$5,540 for single/MFS, $11,080 for MFJ/QSS. Far below federal standard deduction.",
  },
  californiaExemptionCredit: {
    rule: "California Personal Exemption Credit",
    source: "California Revenue & Taxation Code § 17054",
    section: "FTB Form 540",
    url: "https://www.ftb.ca.gov",
    note: "$144 credit per taxpayer (single), $288 for MFJ. $433 per dependent.",
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
  // Child Tax Credit — IRC § 24
  ctc: {
    creditPerChild: 2000,
    refundableMax: 1700, // Additional Child Tax Credit refundable portion for 2025
    earnedIncomeThreshold: 2500, // Must earn above this for refundable portion
    refundableRate: 0.15, // 15% of earned income above threshold
    incomePhaseoutStart: {
      single: 200000,
      married_filing_jointly: 400000,
      married_filing_separately: 200000,
      head_of_household: 200000,
      qualifying_surviving_spouse: 400000,
    },
    phaseoutRate: 50, // $50 reduction per $1,000 over threshold
    maxChildAge: 17, // Must be under 17 at end of tax year
    otherDependentCredit: 500, // Credit for dependents 17+ (non-refundable)
  },
  // IRA Contribution Limits — IRC § 219 (2025)
  ira: {
    maxContribution: 7000,
    catchUpContribution: 1000, // Additional if age 50+
    // Deduction phaseout for filers COVERED by employer plan
    deductionPhaseout_covered: {
      single: { start: 79000, end: 89000 },
      married_filing_jointly: { start: 126000, end: 146000 },
      married_filing_separately: { start: 0, end: 10000 },
      head_of_household: { start: 79000, end: 89000 },
      qualifying_surviving_spouse: { start: 126000, end: 146000 },
    },
    // Phaseout for filer NOT covered, but spouse IS covered (MFJ only)
    deductionPhaseout_spouseCovered: {
      married_filing_jointly: { start: 236000, end: 246000 },
    },
    // Roth IRA income limits (for informational display)
    rothPhaseout: {
      single: { start: 150000, end: 165000 },
      married_filing_jointly: { start: 236000, end: 246000 },
      married_filing_separately: { start: 0, end: 10000 },
      head_of_household: { start: 150000, end: 165000 },
      qualifying_surviving_spouse: { start: 236000, end: 246000 },
    },
  },
  // Child and Dependent Care Credit — IRC § 21
  cdcc: {
    maxExpensesOneChild: 3000,
    maxExpensesTwoPlus: 6000,
    maxCreditRate: 0.35, // 35% for AGI up to $15,000
    minCreditRate: 0.20, // 20% for AGI over $43,000
    rateReductionStart: 15000,
    rateReductionPerStep: 2000, // Rate drops 1% for every $2,000 above $15,000
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

// California tax rules — R&TC § 17041, FTB publications
export const CALIFORNIA = {
  standardDeduction: {
    single: 5540,
    married_filing_jointly: 11080,
    married_filing_separately: 5540,
    head_of_household: 5540,
    qualifying_surviving_spouse: 11080,
  },
  exemptionCredit: {
    single: 144,
    married_filing_jointly: 288,
    married_filing_separately: 144,
    head_of_household: 144,
    qualifying_surviving_spouse: 288,
  },
  mentalHealthTaxThreshold: 1000000,
  mentalHealthTaxRate: 0.01,
  brackets: {
    single: [
      { min: 0, max: 10756, rate: 0.01 },
      { min: 10756, max: 25499, rate: 0.02 },
      { min: 25499, max: 40245, rate: 0.04 },
      { min: 40245, max: 55866, rate: 0.06 },
      { min: 55866, max: 70612, rate: 0.08 },
      { min: 70612, max: 360659, rate: 0.093 },
      { min: 360659, max: 432787, rate: 0.103 },
      { min: 432787, max: 721314, rate: 0.113 },
      { min: 721314, max: Infinity, rate: 0.123 },
    ],
    married_filing_jointly: [
      { min: 0, max: 21512, rate: 0.01 },
      { min: 21512, max: 50998, rate: 0.02 },
      { min: 50998, max: 80490, rate: 0.04 },
      { min: 80490, max: 111732, rate: 0.06 },
      { min: 111732, max: 141224, rate: 0.08 },
      { min: 141224, max: 721318, rate: 0.093 },
      { min: 721318, max: 865574, rate: 0.103 },
      { min: 865574, max: 1442628, rate: 0.113 },
      { min: 1442628, max: Infinity, rate: 0.123 },
    ],
    married_filing_separately: [
      { min: 0, max: 10756, rate: 0.01 },
      { min: 10756, max: 25499, rate: 0.02 },
      { min: 25499, max: 40245, rate: 0.04 },
      { min: 40245, max: 55866, rate: 0.06 },
      { min: 55866, max: 70612, rate: 0.08 },
      { min: 70612, max: 360659, rate: 0.093 },
      { min: 360659, max: 432787, rate: 0.103 },
      { min: 432787, max: 721314, rate: 0.113 },
      { min: 721314, max: Infinity, rate: 0.123 },
    ],
    head_of_household: [
      { min: 0, max: 21527, rate: 0.01 },
      { min: 21527, max: 50998, rate: 0.02 },
      { min: 50998, max: 65744, rate: 0.04 },
      { min: 65744, max: 81365, rate: 0.06 },
      { min: 81365, max: 96111, rate: 0.08 },
      { min: 96111, max: 490158, rate: 0.093 },
      { min: 490158, max: 588189, rate: 0.103 },
      { min: 588189, max: 980316, rate: 0.113 },
      { min: 980316, max: Infinity, rate: 0.123 },
    ],
    qualifying_surviving_spouse: [
      { min: 0, max: 21512, rate: 0.01 },
      { min: 21512, max: 50998, rate: 0.02 },
      { min: 50998, max: 80490, rate: 0.04 },
      { min: 80490, max: 111732, rate: 0.06 },
      { min: 111732, max: 141224, rate: 0.08 },
      { min: 141224, max: 721318, rate: 0.093 },
      { min: 721318, max: 865574, rate: 0.103 },
      { min: 865574, max: 1442628, rate: 0.113 },
      { min: 1442628, max: Infinity, rate: 0.123 },
    ],
  },
} as const;
