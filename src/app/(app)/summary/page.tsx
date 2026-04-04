"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { CitationTooltip } from "@/components/ui/CitationTooltip";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { formatCurrency } from "@/lib/utils";
import { CITATIONS } from "@/lib/tax/constants";
import type { TaxResult, LineItem } from "@/lib/tax/types";

export default function SummaryPage() {
  const router = useRouter();
  const { taxReturn, updateSection } = useTaxReturn();
  const [result, setResult] = useState<TaxResult | null>(
    taxReturn.calculationResult
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (result) return;
    calculateTaxes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function calculateTaxes() {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/tax-calculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taxReturn),
      });
      if (!resp.ok) throw new Error("Calculation failed");
      const data: TaxResult = await resp.json();
      setResult(data);
      await updateSection("calculationResult", data);
    } catch {
      setError("Could not calculate your taxes. Please check your W-2 data.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Calculating your taxes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card variant="warning">
          <p className="text-sm text-amber-800">{error}</p>
        </Card>
        <Button onClick={() => router.push("/intake/w2-income")}>
          Review W-2 Data
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const { federal, georgia, recommendations } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Your Tax Summary
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Tax Year {result.taxYear} — Review your complete return data below.
          Click the <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">i</span> icons to see the tax rule and source for each line item.
        </p>
      </div>

      <Disclaimer />

      {/* Total Refund/Owed */}
      <Card
        variant={result.totalRefundOrOwed >= 0 ? "success" : "warning"}
        className="text-center"
      >
        <p className="text-sm text-gray-600 mb-1">
          {result.totalRefundOrOwed >= 0
            ? "Estimated Total Refund"
            : "Estimated Total Owed"}
        </p>
        <p className="text-4xl font-bold">
          {formatCurrency(Math.abs(result.totalRefundOrOwed))}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Federal: {formatCurrency(Math.abs(federal.refundOrOwed))}{" "}
          {federal.refundOrOwed >= 0 ? "refund" : "owed"} | Georgia:{" "}
          {formatCurrency(Math.abs(georgia.refundOrOwed))}{" "}
          {georgia.refundOrOwed >= 0 ? "refund" : "owed"}
        </p>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Recommendations
          </h3>
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              variant={
                rec.type === "warning"
                  ? "warning"
                  : rec.type === "credit"
                    ? "success"
                    : "info"
              }
            >
              <p className="font-medium text-gray-900">{rec.title}</p>
              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              {rec.estimatedBenefit > 0 && (
                <p className="text-sm font-medium mt-2">
                  Estimated benefit: {formatCurrency(rec.estimatedBenefit)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Federal Summary — using lineItems with citations */}
      <Card>
        <CardTitle>Federal Return (Form 1040)</CardTitle>
        <CardDescription>
          Key line items from your federal return
        </CardDescription>
        <dl className="mt-4 space-y-3">
          {federal.lineItems.map((item, idx) => (
            <LineItemRow key={idx} item={item} />
          ))}
        </dl>
      </Card>

      {/* Georgia Summary — using lineItems with citations */}
      <Card>
        <CardTitle>Georgia Return (Form 500)</CardTitle>
        <CardDescription>
          Key line items from your Georgia state return
        </CardDescription>
        <dl className="mt-4 space-y-3">
          {georgia.lineItems.map((item, idx) => (
            <LineItemRow key={idx} item={item} />
          ))}
        </dl>
      </Card>

      {/* Deduction Detail */}
      <Card>
        <CardTitle>Deduction Comparison</CardTitle>
        <CardDescription>{federal.deduction.explanation}</CardDescription>
        <dl className="mt-4 space-y-3">
          <SummaryRow
            label="Standard Deduction"
            value={federal.deduction.standardDeduction}
            highlight={federal.deduction.recommendedMethod === "standard"}
            citation={CITATIONS.federalStandardDeduction}
          />
          <SummaryRow
            label="Itemized Deductions Total"
            value={federal.deduction.itemizedDeduction}
            highlight={federal.deduction.recommendedMethod === "itemized"}
          />
          {federal.deduction.itemizedDeduction > 0 && (
            <>
              <SummaryRow
                label="  SALT (State/Local Tax + Property Tax)"
                value={federal.deduction.itemizedBreakdown.saltDeduction}
                sub
                citation={CITATIONS.saltCap}
              />
              <SummaryRow
                label="  Mortgage Interest"
                value={federal.deduction.itemizedBreakdown.mortgageInterest}
                sub
                citation={federal.deduction.itemizedBreakdown.mortgageInterest > 0 ? CITATIONS.mortgageInterest : undefined}
              />
              <SummaryRow
                label="  Charitable Contributions"
                value={federal.deduction.itemizedBreakdown.charitableContributions}
                sub
                citation={federal.deduction.itemizedBreakdown.charitableContributions > 0 ? CITATIONS.charitableContributions : undefined}
              />
            </>
          )}
        </dl>
      </Card>

      {/* Property tracking */}
      {taxReturn.property.hasProperty && (
        <Card>
          <CardTitle>Property Records (For Your Files)</CardTitle>
          <CardDescription>
            These expenses are tracked for your records but may not all be
            deductible.
          </CardDescription>
          <dl className="mt-4 space-y-3">
            <SummaryRow
              label="Property Tax Paid"
              value={taxReturn.property.propertyTaxPaid}
              citation={CITATIONS.propertyTaxDeduction}
            />
            <SummaryRow
              label="HOA / Condo Fees"
              value={taxReturn.property.hoaDues}
              citation={CITATIONS.hoaNotDeductible}
            />
            <SummaryRow
              label="Homeowner's Insurance"
              value={taxReturn.property.insuranceCost}
              citation={CITATIONS.insuranceNotDeductible}
            />
          </dl>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push("/documents")}>
          Back to Documents
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={calculateTaxes}>
            Recalculate
          </Button>
          <Button onClick={() => router.push("/handoff")}>
            Ready to File
          </Button>
        </div>
      </div>
    </div>
  );
}

function LineItemRow({ item }: { item: LineItem }) {
  const isResult = item.label.includes("Refund") || item.label.includes("Owed");
  return (
    <div className={`flex justify-between items-baseline ${isResult ? "border-t border-gray-200 pt-3" : ""}`}>
      <dt className={`text-sm ${isResult ? "font-medium text-gray-900" : "text-gray-600"}`}>
        {item.label}
        {item.citation && <CitationTooltip citation={item.citation} />}
      </dt>
      <dd className={`text-sm font-mono ${isResult ? "font-semibold text-gray-900" : "text-gray-700"}`}>
        {formatCurrency(item.value)}
      </dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
  sub = false,
  citation,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  sub?: boolean;
  citation?: import("@/lib/tax/constants").Citation;
}) {
  return (
    <div className="flex justify-between items-baseline">
      <dt
        className={`text-sm ${sub ? "text-gray-500 pl-2" : highlight ? "font-medium text-gray-900" : "text-gray-600"}`}
      >
        {label}
        {citation && <CitationTooltip citation={citation} />}
      </dt>
      <dd
        className={`text-sm font-mono ${highlight ? "font-semibold text-gray-900" : "text-gray-700"}`}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
