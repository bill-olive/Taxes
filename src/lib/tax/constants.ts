// 2024 Tax Year Constants
// Sources: IRS Rev. Proc. 2023-34, Georgia DOR

export const TAX_YEAR = 2024;

export const FEDERAL = {
  standardDeduction: {
    single: 14600,
  },
  brackets: {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
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
    incomePhaseoutStart: 80000,
    incomePhaseoutEnd: 90000,
  },
} as const;

export const GEORGIA = {
  standardDeduction: {
    single: 5400,
  },
  personalExemption: 2700,
  brackets: [
    { min: 0, max: 750, rate: 0.01 },
    { min: 750, max: 2250, rate: 0.02 },
    { min: 2250, max: 3750, rate: 0.03 },
    { min: 3750, max: 5250, rate: 0.04 },
    { min: 5250, max: 7000, rate: 0.05 },
    { min: 7000, max: Infinity, rate: 0.0549 },
  ],
} as const;
