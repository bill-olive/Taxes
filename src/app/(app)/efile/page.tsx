"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { FILING_STATUS_LABELS } from "@/types";
import type { TaxResult } from "@/lib/tax/types";
import type { InvestmentIncome } from "@/types";

const EFILE_URL = "https://www.freefilefillableforms.com/home/default.php";

interface EFileField {
  line: string;
  label: string;
  value: string;
  raw: number | string;
}

function buildForm1040Fields(
  result: TaxResult,
  taxReturn: ReturnType<typeof useTaxReturn>["taxReturn"]
): EFileField[] {
  const { federal } = result;
  const w2Wages = taxReturn.w2s.reduce((s, w) => s + w.wages, 0);
  const filingLabel = FILING_STATUS_LABELS[taxReturn.filingStatus] || taxReturn.filingStatus;

  const aotc = federal.credits.find(
    (c) => c.name === "American Opportunity Tax Credit" && c.eligible
  );

  const fields: EFileField[] = [
    {
      line: "Top",
      label: "Filing Status",
      value: filingLabel,
      raw: filingLabel,
    },
    {
      line: "Top",
      label: "Your Name",
      value: `${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`,
      raw: `${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`,
    },
    {
      line: "Top",
      label: "SSN (last 4)",
      value: `***-**-${taxReturn.personalInfo.ssnLastFour}`,
      raw: taxReturn.personalInfo.ssnLastFour,
    },
    {
      line: "Top",
      label: "Address",
      value: `${taxReturn.personalInfo.address.street}, ${taxReturn.personalInfo.address.city}, ${taxReturn.personalInfo.address.state} ${taxReturn.personalInfo.address.zip}`,
      raw: `${taxReturn.personalInfo.address.street}, ${taxReturn.personalInfo.address.city}, ${taxReturn.personalInfo.address.state} ${taxReturn.personalInfo.address.zip}`,
    },
  ];

  // Dependents
  if (taxReturn.dependents && taxReturn.dependents.length > 0) {
    taxReturn.dependents.forEach((dep, idx) => {
      fields.push(
        {
          line: `Dep ${idx + 1}`,
          label: `Dependent name`,
          value: `${dep.firstName} ${dep.lastName}`,
          raw: `${dep.firstName} ${dep.lastName}`,
        },
        {
          line: `Dep ${idx + 1}`,
          label: `Relationship`,
          value: dep.relationship,
          raw: dep.relationship,
        },
        {
          line: `Dep ${idx + 1}`,
          label: `SSN (last 4)`,
          value: `***-**-${dep.ssnLastFour}`,
          raw: dep.ssnLastFour,
        }
      );
    });
  }

  fields.push(
    {
      line: "1a",
      label: "Wages, salaries, tips (from W-2 Box 1)",
      value: fmt(w2Wages),
      raw: w2Wages,
    }
  );

  // Investment income lines
  const inv = taxReturn.investmentIncome;
  const totalInterest = inv?.form1099INTs?.reduce((s, f) => s + f.interestIncome, 0) ?? 0;
  const totalOrdDividends = inv?.form1099DIVs?.reduce((s, f) => s + f.ordinaryDividends, 0) ?? 0;
  const totalQualDividends = inv?.form1099DIVs?.reduce((s, f) => s + f.qualifiedDividends, 0) ?? 0;
  const capitalGainFromDivs = inv?.form1099DIVs?.reduce((s, f) => s + f.totalCapitalGain, 0) ?? 0;
  const netBrokerGain = inv?.form1099Bs?.reduce((s, f) => s + (f.proceeds - f.costBasis), 0) ?? 0;
  const netCapital = netBrokerGain + capitalGainFromDivs;
  const capitalLossDeduction = netCapital < 0 ? Math.max(netCapital, -3000) : netCapital;

  if (totalInterest > 0) {
    fields.push(
      { line: "2b", label: "Taxable interest", value: fmt(totalInterest), raw: totalInterest }
    );
  }
  if (totalOrdDividends > 0) {
    fields.push(
      { line: "3a", label: "Qualified dividends", value: fmt(totalQualDividends), raw: totalQualDividends },
      { line: "3b", label: "Ordinary dividends", value: fmt(totalOrdDividends), raw: totalOrdDividends }
    );
  }
  if (netCapital !== 0) {
    fields.push(
      { line: "7", label: `Capital ${capitalLossDeduction >= 0 ? "gain" : "loss"}`, value: fmt(capitalLossDeduction), raw: capitalLossDeduction }
    );
  }

  fields.push({
    line: "9",
    label: "Total income",
    value: fmt(federal.grossIncome),
    raw: federal.grossIncome,
  });

  // IRA deduction (above-the-line, Schedule 1 Line 20 → Form 1040 Line 10)
  const iraDeductionLine = federal.lineItems.find((li) =>
    li.label.includes("IRA Deduction")
  );
  if (iraDeductionLine && iraDeductionLine.value > 0) {
    fields.push(
      {
        line: "S1-20",
        label: "IRA deduction (Schedule 1, Line 20)",
        value: fmt(iraDeductionLine.value),
        raw: iraDeductionLine.value,
      },
      {
        line: "10",
        label: "Adjustments to income (Schedule 1, Line 26)",
        value: fmt(iraDeductionLine.value),
        raw: iraDeductionLine.value,
      }
    );
  }

  fields.push({
    line: "11",
    label: "Adjusted gross income (AGI)",
    value: fmt(federal.adjustedGrossIncome),
    raw: federal.adjustedGrossIncome,
  },
    {
      line: "12",
      label: `${federal.deduction.recommendedMethod === "standard" ? "Standard" : "Itemized"} deduction`,
      value: fmt(
        federal.deduction.recommendedMethod === "standard"
          ? federal.deduction.standardDeduction
          : federal.deduction.itemizedDeduction
      ),
      raw:
        federal.deduction.recommendedMethod === "standard"
          ? federal.deduction.standardDeduction
          : federal.deduction.itemizedDeduction,
    },
    {
      line: "15",
      label: "Taxable income",
      value: fmt(federal.taxableIncome),
      raw: federal.taxableIncome,
    },
    {
      line: "16",
      label: "Tax (from Tax Table or Tax Computation)",
      value: fmt(federal.taxBeforeCredits),
      raw: federal.taxBeforeCredits,
    }
  );

  if (aotc) {
    fields.push(
      {
        line: "19",
        label: "Nonrefundable credits (AOTC nonrefundable portion)",
        value: fmt(aotc.nonRefundableAmount),
        raw: aotc.nonRefundableAmount,
      },
      {
        line: "22",
        label: "Tax after nonrefundable credits",
        value: fmt(Math.max(0, federal.taxBeforeCredits - aotc.nonRefundableAmount)),
        raw: Math.max(0, federal.taxBeforeCredits - aotc.nonRefundableAmount),
      },
      {
        line: "24",
        label: "Total tax (before payments)",
        value: fmt(Math.max(0, federal.taxBeforeCredits - aotc.nonRefundableAmount)),
        raw: Math.max(0, federal.taxBeforeCredits - aotc.nonRefundableAmount),
      }
    );
  } else {
    fields.push({
      line: "24",
      label: "Total tax",
      value: fmt(federal.taxBeforeCredits),
      raw: federal.taxBeforeCredits,
    });
  }

  fields.push({
    line: "25a",
    label: "Federal tax withheld (from W-2 Box 2)",
    value: fmt(federal.totalWithheld),
    raw: federal.totalWithheld,
  });

  if (aotc && aotc.refundableAmount > 0) {
    fields.push({
      line: "29",
      label: "American Opportunity Credit (refundable, from Form 8863)",
      value: fmt(aotc.refundableAmount),
      raw: aotc.refundableAmount,
    });
  }

  const totalPayments =
    federal.totalWithheld + (aotc?.refundableAmount ?? 0);
  fields.push({
    line: "33",
    label: "Total payments and credits",
    value: fmt(totalPayments),
    raw: totalPayments,
  });

  if (federal.refundOrOwed >= 0) {
    fields.push({
      line: "34",
      label: "Overpayment (refund amount)",
      value: fmt(federal.refundOrOwed),
      raw: federal.refundOrOwed,
    });
    fields.push({
      line: "35a",
      label: "Refunded to you",
      value: fmt(federal.refundOrOwed),
      raw: federal.refundOrOwed,
    });
  } else {
    fields.push({
      line: "37",
      label: "Amount you owe",
      value: fmt(Math.abs(federal.refundOrOwed)),
      raw: Math.abs(federal.refundOrOwed),
    });
  }

  return fields;
}

function buildW2Fields(
  taxReturn: ReturnType<typeof useTaxReturn>["taxReturn"]
): EFileField[][] {
  return taxReturn.w2s.map((w2, idx) => {
    const prefix = taxReturn.w2s.length > 1 ? `W-2 #${idx + 1}: ` : "";
    const fields: EFileField[] = [
      { line: "Box a", label: `${prefix}Employee SSN`, value: `***-**-${taxReturn.personalInfo.ssnLastFour}`, raw: taxReturn.personalInfo.ssnLastFour },
      { line: "Box b", label: `${prefix}Employer EIN`, value: w2.employerEIN, raw: w2.employerEIN },
      { line: "Box c", label: `${prefix}Employer Name`, value: w2.employerName, raw: w2.employerName },
      { line: "Box c", label: `${prefix}Employer Address`, value: w2.employerAddress || "", raw: w2.employerAddress || "" },
      { line: "Box 1", label: `${prefix}Wages, tips, other compensation`, value: fmt(w2.wages), raw: w2.wages },
      { line: "Box 2", label: `${prefix}Federal income tax withheld`, value: fmt(w2.federalWithheld), raw: w2.federalWithheld },
      { line: "Box 3", label: `${prefix}Social security wages`, value: fmt(w2.socialSecurityWages || 0), raw: w2.socialSecurityWages || 0 },
      { line: "Box 4", label: `${prefix}Social security tax withheld`, value: fmt(w2.socialSecurityWithheld || 0), raw: w2.socialSecurityWithheld || 0 },
      { line: "Box 5", label: `${prefix}Medicare wages and tips`, value: fmt(w2.medicareWages || 0), raw: w2.medicareWages || 0 },
      { line: "Box 6", label: `${prefix}Medicare tax withheld`, value: fmt(w2.medicareWithheld || 0), raw: w2.medicareWithheld || 0 },
    ];

    if (w2.socialSecurityTips) {
      fields.push({ line: "Box 7", label: `${prefix}Social security tips`, value: fmt(w2.socialSecurityTips), raw: w2.socialSecurityTips });
    }
    if (w2.allocatedTips) {
      fields.push({ line: "Box 8", label: `${prefix}Allocated tips`, value: fmt(w2.allocatedTips), raw: w2.allocatedTips });
    }
    if (w2.dependentCareBenefits) {
      fields.push({ line: "Box 10", label: `${prefix}Dependent care benefits`, value: fmt(w2.dependentCareBenefits), raw: w2.dependentCareBenefits });
    }

    if (w2.box12 && w2.box12.length > 0) {
      w2.box12.forEach((entry, bi) => {
        if (entry.code) {
          fields.push({
            line: `Box 12${String.fromCharCode(97 + bi)}`,
            label: `${prefix}Code ${entry.code}`,
            value: fmt(entry.amount),
            raw: entry.amount,
          });
        }
      });
    }

    if (w2.retirementPlan) {
      fields.push({ line: "Box 13", label: `${prefix}Retirement plan`, value: "Yes", raw: "Yes" });
    }

    if (w2.box14Other) {
      fields.push({ line: "Box 14", label: `${prefix}Other`, value: w2.box14Other, raw: w2.box14Other });
    }

    fields.push(
      { line: "Box 15", label: `${prefix}State`, value: w2.state || taxReturn.residency?.state || "", raw: w2.state || taxReturn.residency?.state || "" },
      { line: "Box 16", label: `${prefix}State wages`, value: fmt(w2.stateWages), raw: w2.stateWages },
      { line: "Box 17", label: `${prefix}State income tax withheld`, value: fmt(w2.stateWithheld), raw: w2.stateWithheld }
    );

    if (w2.localWages) {
      fields.push(
        { line: "Box 18", label: `${prefix}Local wages`, value: fmt(w2.localWages), raw: w2.localWages },
        { line: "Box 19", label: `${prefix}Local income tax`, value: fmt(w2.localWithheld || 0), raw: w2.localWithheld || 0 },
        { line: "Box 20", label: `${prefix}Locality name`, value: w2.localityName || "", raw: w2.localityName || "" }
      );
    }

    return fields;
  });
}

function buildInvestmentFields(
  inv: InvestmentIncome | undefined
): { intFields: EFileField[][]; divFields: EFileField[][]; bFields: EFileField[][] } {
  if (!inv) return { intFields: [], divFields: [], bFields: [] };

  const intFields = (inv.form1099INTs || []).map((f, idx) => {
    const prefix = (inv.form1099INTs || []).length > 1 ? `#${idx + 1}: ` : "";
    const fields: EFileField[] = [
      { line: "Payer", label: `${prefix}Payer Name`, value: f.payerName, raw: f.payerName },
      { line: "EIN", label: `${prefix}Payer EIN`, value: f.payerEIN, raw: f.payerEIN },
      { line: "Box 1", label: `${prefix}Interest income`, value: fmt(f.interestIncome), raw: f.interestIncome },
    ];
    if (f.earlyWithdrawalPenalty > 0)
      fields.push({ line: "Box 2", label: `${prefix}Early withdrawal penalty`, value: fmt(f.earlyWithdrawalPenalty), raw: f.earlyWithdrawalPenalty });
    if (f.federalWithheld > 0)
      fields.push({ line: "Box 4", label: `${prefix}Federal tax withheld`, value: fmt(f.federalWithheld), raw: f.federalWithheld });
    if (f.taxExemptInterest > 0)
      fields.push({ line: "Box 8", label: `${prefix}Tax-exempt interest`, value: fmt(f.taxExemptInterest), raw: f.taxExemptInterest });
    return fields;
  });

  const divFields = (inv.form1099DIVs || []).map((f, idx) => {
    const prefix = (inv.form1099DIVs || []).length > 1 ? `#${idx + 1}: ` : "";
    const fields: EFileField[] = [
      { line: "Payer", label: `${prefix}Payer Name`, value: f.payerName, raw: f.payerName },
      { line: "EIN", label: `${prefix}Payer EIN`, value: f.payerEIN, raw: f.payerEIN },
      { line: "Box 1a", label: `${prefix}Ordinary dividends`, value: fmt(f.ordinaryDividends), raw: f.ordinaryDividends },
      { line: "Box 1b", label: `${prefix}Qualified dividends`, value: fmt(f.qualifiedDividends), raw: f.qualifiedDividends },
    ];
    if (f.totalCapitalGain > 0)
      fields.push({ line: "Box 2a", label: `${prefix}Total capital gain dist.`, value: fmt(f.totalCapitalGain), raw: f.totalCapitalGain });
    if (f.federalWithheld > 0)
      fields.push({ line: "Box 4", label: `${prefix}Federal tax withheld`, value: fmt(f.federalWithheld), raw: f.federalWithheld });
    if (f.foreignTaxPaid > 0)
      fields.push({ line: "Box 7", label: `${prefix}Foreign tax paid`, value: fmt(f.foreignTaxPaid), raw: f.foreignTaxPaid });
    if (f.exemptInterestDividends > 0)
      fields.push({ line: "Box 12", label: `${prefix}Exempt-interest dividends`, value: fmt(f.exemptInterestDividends), raw: f.exemptInterestDividends });
    return fields;
  });

  const bFields = (inv.form1099Bs || []).map((f, idx) => {
    const prefix = (inv.form1099Bs || []).length > 1 ? `#${idx + 1}: ` : "";
    const gl = f.proceeds - f.costBasis;
    const fields: EFileField[] = [
      { line: "Broker", label: `${prefix}${f.brokerName || "Broker"}`, value: f.description || "—", raw: f.description },
      { line: "Acquired", label: `${prefix}Date acquired`, value: f.dateAcquired || "Various", raw: f.dateAcquired },
      { line: "Sold", label: `${prefix}Date sold`, value: f.dateSold || "Various", raw: f.dateSold },
      { line: "1d", label: `${prefix}Proceeds`, value: fmt(f.proceeds), raw: f.proceeds },
      { line: "1e", label: `${prefix}Cost basis`, value: fmt(f.costBasis), raw: f.costBasis },
      { line: "G/L", label: `${prefix}${gl >= 0 ? "Gain" : "Loss"} (${f.isShortTerm ? "Short" : "Long"}-term)`, value: fmt(gl), raw: gl },
    ];
    if (f.federalWithheld > 0)
      fields.push({ line: "Box 4", label: `${prefix}Federal tax withheld`, value: fmt(f.federalWithheld), raw: f.federalWithheld });
    return fields;
  });

  return { intFields, divFields, bFields };
}

function buildStateFields(
  result: TaxResult
): EFileField[] {
  return result.state.lineItems.map((item) => ({
    line: "",
    label: item.label,
    value: fmt(item.value),
    raw: item.value,
  }));
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function CopyableRow({
  field,
  onCopy,
  copied,
}: {
  field: EFileField;
  onCopy: (val: string, key: string) => void;
  copied: string | null;
}) {
  const copyVal =
    typeof field.raw === "number" ? field.raw.toString() : field.raw;
  const key = `${field.line}-${field.label}`;

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      {field.line && (
        <span className="shrink-0 w-14 text-xs font-mono text-gray-400 text-right">
          {field.line}
        </span>
      )}
      <span className="flex-1 text-sm text-gray-700 truncate">
        {field.label}
      </span>
      <span className="shrink-0 text-sm font-mono font-medium text-gray-900 text-right min-w-[90px]">
        {field.value}
      </span>
      <button
        onClick={() => onCopy(copyVal, key)}
        className={`shrink-0 px-2 py-1 text-xs rounded transition-colors ${
          copied === key
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
        }`}
        title={`Copy ${field.value}`}
      >
        {copied === key ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function EFilePage() {
  const router = useRouter();
  const { taxReturn } = useTaxReturn();
  const [copied, setCopied] = useState<string | null>(null);

  const result = taxReturn.calculationResult;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10">
        <Card variant="warning">
          <p className="text-sm text-amber-800">
            No tax calculation found. Please complete your return and calculate
            taxes first.
          </p>
        </Card>
        <Button onClick={() => router.push("/summary")}>
          Go to Summary
        </Button>
      </div>
    );
  }

  const form1040Fields = buildForm1040Fields(result, taxReturn);
  const w2FieldSets = buildW2Fields(taxReturn);
  const { intFields, divFields, bFields } = buildInvestmentFields(taxReturn.investmentIncome);
  const stateFields = buildStateFields(result);

  function handleCopy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function handleCopyAll(fields: EFileField[], sectionName: string) {
    const text = fields
      .map((f) => `${f.line ? f.line + "\t" : ""}${f.label}\t${f.value}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(`all-${sectionName}`);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          E-File Your Return
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Copy each value below and paste it into the corresponding field on{" "}
          <a
            href={EFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Free File Fillable Forms
          </a>
          . Click any Copy button to copy that value to your clipboard.
        </p>
      </div>

      <Disclaimer />

      {/* Open Free File */}
      <Card variant="info" className="text-center">
        <p className="text-sm text-gray-700 mb-3">
          Open Free File Fillable Forms in a new tab, then come back here to
          copy your values.
        </p>
        <a href={EFILE_URL} target="_blank" rel="noopener noreferrer">
          <Button>Open Free File Fillable Forms</Button>
        </a>
      </Card>

      {/* W-2 Data */}
      {w2FieldSets.map((fields, idx) => (
        <Card key={idx}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>
              {w2FieldSets.length > 1 ? `W-2 #${idx + 1}` : "W-2 Data"}
            </CardTitle>
            <button
              onClick={() => handleCopyAll(fields, `w2-${idx}`)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                copied === `all-w2-${idx}`
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {copied === `all-w2-${idx}` ? "Copied All" : "Copy All"}
            </button>
          </div>
          <CardDescription>
            Enter these on the W-2 form in Free File Fillable Forms
          </CardDescription>
          <div className="mt-3">
            {fields.map((field, i) => (
              <CopyableRow
                key={i}
                field={field}
                onCopy={handleCopy}
                copied={copied}
              />
            ))}
          </div>
        </Card>
      ))}

      {/* 1099-INT */}
      {intFields.map((fields, idx) => (
        <Card key={`int-${idx}`}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>
              1099-INT{intFields.length > 1 ? ` #${idx + 1}` : ""} — Interest Income
            </CardTitle>
            <button
              onClick={() => handleCopyAll(fields, `int-${idx}`)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                copied === `all-int-${idx}`
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {copied === `all-int-${idx}` ? "Copied All" : "Copy All"}
            </button>
          </div>
          <CardDescription>
            Enter on Schedule B, Part I (Interest)
          </CardDescription>
          <div className="mt-3">
            {fields.map((field, i) => (
              <CopyableRow key={i} field={field} onCopy={handleCopy} copied={copied} />
            ))}
          </div>
        </Card>
      ))}

      {/* 1099-DIV */}
      {divFields.map((fields, idx) => (
        <Card key={`div-${idx}`}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>
              1099-DIV{divFields.length > 1 ? ` #${idx + 1}` : ""} — Dividends
            </CardTitle>
            <button
              onClick={() => handleCopyAll(fields, `div-${idx}`)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                copied === `all-div-${idx}`
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {copied === `all-div-${idx}` ? "Copied All" : "Copy All"}
            </button>
          </div>
          <CardDescription>
            Enter on Schedule B, Part II (Dividends)
          </CardDescription>
          <div className="mt-3">
            {fields.map((field, i) => (
              <CopyableRow key={i} field={field} onCopy={handleCopy} copied={copied} />
            ))}
          </div>
        </Card>
      ))}

      {/* 1099-B */}
      {bFields.map((fields, idx) => (
        <Card key={`b-${idx}`}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>
              1099-B{bFields.length > 1 ? ` #${idx + 1}` : ""} — Brokerage Transaction
            </CardTitle>
            <button
              onClick={() => handleCopyAll(fields, `b-${idx}`)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                copied === `all-b-${idx}`
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {copied === `all-b-${idx}` ? "Copied All" : "Copy All"}
            </button>
          </div>
          <CardDescription>
            Enter on Form 8949 and Schedule D
          </CardDescription>
          <div className="mt-3">
            {fields.map((field, i) => (
              <CopyableRow key={i} field={field} onCopy={handleCopy} copied={copied} />
            ))}
          </div>
        </Card>
      ))}

      {/* Form 1040 */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Form 1040 — U.S. Individual Income Tax Return</CardTitle>
          <button
            onClick={() => handleCopyAll(form1040Fields, "1040")}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              copied === "all-1040"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            {copied === "all-1040" ? "Copied All" : "Copy All"}
          </button>
        </div>
        <CardDescription>
          Enter these values on Form 1040 in Free File Fillable Forms
        </CardDescription>
        <div className="mt-3">
          {form1040Fields.map((field, i) => (
            <CopyableRow
              key={i}
              field={field}
              onCopy={handleCopy}
              copied={copied}
            />
          ))}
        </div>
      </Card>

      {/* State Return */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>
            {result.state.stateName} Return
            {result.state.stateCode === "GA"
              ? " (Form 500)"
              : result.state.stateCode === "CA"
                ? " (Form 540)"
                : ""}
          </CardTitle>
          <button
            onClick={() => handleCopyAll(stateFields, "state")}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              copied === "all-state"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            {copied === "all-state" ? "Copied All" : "Copy All"}
          </button>
        </div>
        <CardDescription>
          Enter these values on your state return form
        </CardDescription>
        <div className="mt-3">
          {stateFields.map((field, i) => (
            <CopyableRow
              key={i}
              field={field}
              onCopy={handleCopy}
              copied={copied}
            />
          ))}
        </div>
      </Card>

      {/* Refund / Owed */}
      <Card
        variant={result.totalRefundOrOwed >= 0 ? "success" : "warning"}
        className="text-center"
      >
        <p className="text-sm text-gray-600 mb-1">
          {result.totalRefundOrOwed >= 0
            ? "Estimated Total Refund"
            : "Estimated Total Owed"}
        </p>
        <p className="text-3xl font-bold">
          ${Math.abs(result.totalRefundOrOwed).toLocaleString()}
        </p>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push("/summary")}>
          Back to Summary
        </Button>
        <a href={EFILE_URL} target="_blank" rel="noopener noreferrer">
          <Button>Open Free File Fillable Forms</Button>
        </a>
      </div>
    </div>
  );
}
