import { z } from "zod/v4";

export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  ssn: z
    .string()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, "Enter a valid SSN (XXX-XX-XXXX)"),
  address: addressSchema,
});

export const filingStatusSchema = z.object({
  filingStatus: z.literal("single"),
});

export const residencySchema = z.object({
  state: z.literal("GA"),
  fullYear: z.boolean(),
});

export const w2Schema = z.object({
  employerName: z.string().min(1, "Employer name is required"),
  employerEIN: z
    .string()
    .regex(/^\d{2}-?\d{7}$/, "Enter a valid EIN (XX-XXXXXXX)"),
  wages: z.number().min(0, "Wages must be 0 or more"),
  federalWithheld: z.number().min(0, "Must be 0 or more"),
  stateWages: z.number().min(0, "Must be 0 or more"),
  stateWithheld: z.number().min(0, "Must be 0 or more"),
});

export const educationSchema = z.object({
  isFullTimeStudent: z.boolean(),
  institutionName: z.string().optional(),
  tuitionPaid: z.number().min(0).optional(),
});

export const propertySchema = z.object({
  hasProperty: z.boolean(),
  address: addressSchema.optional().nullable(),
  propertyTaxPaid: z.number().min(0).optional(),
  mortgageInterest: z.number().min(0).optional(),
  hoaDues: z.number().min(0).optional(),
  insuranceCost: z.number().min(0).optional(),
});

export const additionalDeductionsSchema = z.object({
  healthInsurancePremiums: z.number().min(0).optional(),
  charitableContributions: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  otherDescription: z.string().optional(),
});
