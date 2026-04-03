"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { useTaxReturn } from "@/context/TaxReturnContext";

export default function PersonalInfoPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [form, setForm] = useState({
    firstName: taxReturn.personalInfo.firstName,
    lastName: taxReturn.personalInfo.lastName,
    dob: taxReturn.personalInfo.dob,
    ssn: "",
    street: taxReturn.personalInfo.address.street,
    city: taxReturn.personalInfo.address.city,
    state: taxReturn.personalInfo.address.state,
    zip: taxReturn.personalInfo.address.zip,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.dob) errs.dob = "Date of birth is required";
    if (!form.ssn && !taxReturn.personalInfo.ssnEncrypted)
      errs.ssn = "SSN is required";
    if (form.ssn && !/^\d{3}-?\d{2}-?\d{4}$/.test(form.ssn))
      errs.ssn = "Enter a valid SSN (XXX-XX-XXXX)";
    if (!form.street.trim()) errs.street = "Street address is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.zip || !/^\d{5}(-\d{4})?$/.test(form.zip))
      errs.zip = "Enter a valid ZIP code";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    setSaving(true);

    let ssnEncrypted = taxReturn.personalInfo.ssnEncrypted;
    let ssnLastFour = taxReturn.personalInfo.ssnLastFour;

    if (form.ssn) {
      try {
        const resp = await fetch("/api/encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ssn: form.ssn }),
        });
        const data = await resp.json();
        ssnEncrypted = data.encrypted;
        ssnLastFour = data.lastFour;
      } catch {
        setErrors({ ssn: "Failed to securely store SSN. Please try again." });
        setSaving(false);
        return;
      }
    }

    await updateSection("personalInfo", {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob,
      ssnEncrypted,
      ssnLastFour,
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state,
        zip: form.zip.trim(),
      },
    });
    await updateSection("currentStep", 1);
    setSaving(false);
    router.push("/intake/filing-status");
  }

  const ssnDisplay = taxReturn.personalInfo.ssnLastFour
    ? `***-**-${taxReturn.personalInfo.ssnLastFour}`
    : "";

  return (
    <StepWrapper
      title="Let's start with your basic information"
      description="We need your legal name and address exactly as they appear on your government documents."
      helpText="This information is used to identify you on your tax return. Your SSN is encrypted and never stored in plain text."
      onNext={handleNext}
      isFirst
      isSubmitting={saving}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Legal First Name"
          value={form.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          label="Legal Last Name"
          value={form.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <Input
        label="Date of Birth"
        type="date"
        value={form.dob}
        onChange={(e) => update("dob", e.target.value)}
        error={errors.dob}
        autoComplete="bday"
      />

      <Input
        label="Social Security Number"
        value={form.ssn}
        onChange={(e) => update("ssn", e.target.value)}
        error={errors.ssn}
        placeholder={ssnDisplay || "XXX-XX-XXXX"}
        helpText={
          ssnDisplay
            ? `Currently saved as ${ssnDisplay}. Leave blank to keep it, or enter a new one.`
            : "Your SSN is encrypted before being stored."
        }
        autoComplete="off"
      />

      <Input
        label="Street Address"
        value={form.street}
        onChange={(e) => update("street", e.target.value)}
        error={errors.street}
        autoComplete="street-address"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          error={errors.city}
          autoComplete="address-level2"
        />
        <Input
          label="State"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
          autoComplete="address-level1"
        />
        <Input
          label="ZIP Code"
          value={form.zip}
          onChange={(e) => update("zip", e.target.value)}
          error={errors.zip}
          autoComplete="postal-code"
        />
      </div>
    </StepWrapper>
  );
}
