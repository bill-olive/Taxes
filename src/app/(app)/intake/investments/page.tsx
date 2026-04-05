"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { StepWrapper } from "@/components/intake/StepWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type {
  Form1099INT,
  Form1099DIV,
  Form1099B,
  DocumentMeta,
} from "@/types";

const empty1099INT: Form1099INT = {
  payerName: "",
  payerEIN: "",
  interestIncome: 0,
  earlyWithdrawalPenalty: 0,
  federalWithheld: 0,
  taxExemptInterest: 0,
};

const empty1099DIV: Form1099DIV = {
  payerName: "",
  payerEIN: "",
  ordinaryDividends: 0,
  qualifiedDividends: 0,
  totalCapitalGain: 0,
  section1250Gain: 0,
  federalWithheld: 0,
  foreignTaxPaid: 0,
  exemptInterestDividends: 0,
};

const empty1099B: Form1099B = {
  brokerName: "",
  description: "",
  dateAcquired: "",
  dateSold: "",
  proceeds: 0,
  costBasis: 0,
  gainOrLoss: 0,
  isShortTerm: true,
  federalWithheld: 0,
};

type ActiveTab = "1099-INT" | "1099-DIV" | "1099-B";

export default function InvestmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taxReturn, updateSection } = useTaxReturn();
  const inv = taxReturn.investmentIncome ?? {
    form1099INTs: [],
    form1099DIVs: [],
    form1099Bs: [],
  };

  const [ints, setInts] = useState<Form1099INT[]>(inv.form1099INTs);
  const [divs, setDivs] = useState<Form1099DIV[]>(inv.form1099DIVs);
  const [bs, setBs] = useState<Form1099B[]>(inv.form1099Bs);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("1099-INT");

  const onDropForm = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || !user) return;
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        setParseError("File must be under 10 MB.");
        return;
      }

      setParsing(true);
      setParseError("");
      setParseSuccess("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch("/api/parse-investment", {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Parse failed");
        }

        const { data } = await resp.json();

        // Save document metadata
        const docType =
          data.formType === "1099-INT"
            ? "1099int"
            : data.formType === "1099-DIV"
              ? "1099div"
              : "1099b";
        const newDoc: DocumentMeta = {
          fileName: file.name,
          type: docType as DocumentMeta["type"],
          storagePath: `investment-uploads/${Date.now()}_${file.name}`,
          uploadedAt: new Date().toISOString(),
        };
        await updateSection("documents", [...taxReturn.documents, newDoc]);

        if (data.formType === "1099-INT" && data.form1099INT) {
          setInts((prev) => [...prev, data.form1099INT]);
          setActiveTab("1099-INT");
          setParseSuccess(
            `Imported 1099-INT from ${data.form1099INT.payerName || "your institution"}.`
          );
        } else if (data.formType === "1099-DIV" && data.form1099DIV) {
          setDivs((prev) => [...prev, data.form1099DIV]);
          setActiveTab("1099-DIV");
          setParseSuccess(
            `Imported 1099-DIV from ${data.form1099DIV.payerName || "your broker"}.`
          );
        } else if (data.formType === "1099-B" && data.form1099B) {
          setBs((prev) => [...prev, data.form1099B]);
          setActiveTab("1099-B");
          setParseSuccess(
            `Imported 1099-B from ${data.form1099B.brokerName || "your broker"}.`
          );
        } else {
          setParseSuccess(
            "Document parsed. Please verify or add the data manually below."
          );
        }
      } catch (err) {
        setParseError(
          err instanceof Error
            ? err.message
            : "Failed to parse. You can enter data manually."
        );
      } finally {
        setParsing(false);
      }
    },
    [user, taxReturn.documents, updateSection]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropForm,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: parsing,
  });

  async function handleNext() {
    setSaving(true);
    // Compute gain/loss for 1099-B entries
    const bsWithGain = bs.map((b) => ({
      ...b,
      gainOrLoss: b.proceeds - b.costBasis,
    }));
    await updateSection("investmentIncome", {
      form1099INTs: ints,
      form1099DIVs: divs,
      form1099Bs: bsWithGain,
    });
    await updateSection("currentStep", 5);
    setSaving(false);
    router.push("/intake/retirement");
  }

  const totalInterest = ints.reduce((s, i) => s + i.interestIncome, 0);
  const totalDividends = divs.reduce((s, d) => s + d.ordinaryDividends, 0);
  const totalGains = bs.reduce((s, b) => s + (b.proceeds - b.costBasis), 0);

  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "1099-INT", label: "Interest (1099-INT)", count: ints.length },
    { key: "1099-DIV", label: "Dividends (1099-DIV)", count: divs.length },
    { key: "1099-B", label: "Brokerage (1099-B)", count: bs.length },
  ];

  return (
    <StepWrapper
      title="Investment & Interest Income"
      description="Enter income from savings accounts, dividends, and stock/crypto sales. Upload your 1099 forms or enter manually."
      helpText="Common forms: 1099-INT (interest from banks/CDs), 1099-DIV (dividends from stocks/funds), 1099-B (stock/crypto sales). If you didn't receive any, skip this step."
      onNext={handleNext}
      onBack={() => router.push("/intake/w2-income")}
      isSubmitting={saving}
    >
      {/* Upload */}
      <Card variant="info">
        <CardTitle className="text-base">
          Import from 1099 form
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1 mb-3">
          Upload a photo or PDF of your 1099-INT, 1099-DIV, or 1099-B and
          we&apos;ll extract the data automatically.
        </p>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-blue-200 hover:border-blue-300 bg-white"
          } ${parsing ? "opacity-50 cursor-wait" : ""}`}
        >
          <input {...getInputProps()} />
          {parsing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-sm text-blue-700">Reading your form...</span>
            </div>
          ) : (
            <p className="text-sm text-blue-700">
              Drop a 1099 form here, or click to upload (JPG, PNG, PDF)
            </p>
          )}
        </div>
        {parseError && (
          <p className="text-sm text-red-600 mt-2">{parseError}</p>
        )}
        {parseSuccess && (
          <p className="text-sm text-green-700 mt-2">{parseSuccess}</p>
        )}
      </Card>

      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">
            or enter manually
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1099-INT */}
      {activeTab === "1099-INT" && (
        <div className="space-y-4">
          {ints.map((form, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  1099-INT #{idx + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setInts((p) => p.filter((_, i) => i !== idx))}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Payer Name"
                  value={form.payerName}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], payerName: e.target.value };
                    setInts(u);
                  }}
                  placeholder="e.g., Chase Bank"
                />
                <Input
                  label="Payer EIN"
                  value={form.payerEIN}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], payerEIN: e.target.value };
                    setInts(u);
                  }}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 1 — Interest Income"
                  type="number"
                  value={form.interestIncome || ""}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], interestIncome: parseFloat(e.target.value) || 0 };
                    setInts(u);
                  }}
                />
                <Input
                  label="Box 2 — Early Withdrawal Penalty"
                  type="number"
                  value={form.earlyWithdrawalPenalty || ""}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], earlyWithdrawalPenalty: parseFloat(e.target.value) || 0 };
                    setInts(u);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 4 — Federal Tax Withheld"
                  type="number"
                  value={form.federalWithheld || ""}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], federalWithheld: parseFloat(e.target.value) || 0 };
                    setInts(u);
                  }}
                />
                <Input
                  label="Box 8 — Tax-Exempt Interest"
                  type="number"
                  value={form.taxExemptInterest || ""}
                  onChange={(e) => {
                    const u = [...ints];
                    u[idx] = { ...u[idx], taxExemptInterest: parseFloat(e.target.value) || 0 };
                    setInts(u);
                  }}
                />
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setInts((p) => [...p, { ...empty1099INT }])}>
            + Add 1099-INT
          </Button>
        </div>
      )}

      {/* 1099-DIV */}
      {activeTab === "1099-DIV" && (
        <div className="space-y-4">
          {divs.map((form, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  1099-DIV #{idx + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setDivs((p) => p.filter((_, i) => i !== idx))}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Payer Name"
                  value={form.payerName}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], payerName: e.target.value };
                    setDivs(u);
                  }}
                  placeholder="e.g., Vanguard"
                />
                <Input
                  label="Payer EIN"
                  value={form.payerEIN}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], payerEIN: e.target.value };
                    setDivs(u);
                  }}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 1a — Ordinary Dividends"
                  type="number"
                  value={form.ordinaryDividends || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], ordinaryDividends: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
                <Input
                  label="Box 1b — Qualified Dividends"
                  type="number"
                  value={form.qualifiedDividends || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], qualifiedDividends: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 2a — Total Capital Gain Distributions"
                  type="number"
                  value={form.totalCapitalGain || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], totalCapitalGain: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
                <Input
                  label="Box 4 — Federal Tax Withheld"
                  type="number"
                  value={form.federalWithheld || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], federalWithheld: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 7 — Foreign Tax Paid"
                  type="number"
                  value={form.foreignTaxPaid || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], foreignTaxPaid: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
                <Input
                  label="Box 12 — Exempt-Interest Dividends"
                  type="number"
                  value={form.exemptInterestDividends || ""}
                  onChange={(e) => {
                    const u = [...divs];
                    u[idx] = { ...u[idx], exemptInterestDividends: parseFloat(e.target.value) || 0 };
                    setDivs(u);
                  }}
                />
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setDivs((p) => [...p, { ...empty1099DIV }])}>
            + Add 1099-DIV
          </Button>
        </div>
      )}

      {/* 1099-B */}
      {activeTab === "1099-B" && (
        <div className="space-y-4">
          {bs.map((form, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  1099-B #{idx + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setBs((p) => p.filter((_, i) => i !== idx))}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Broker Name"
                  value={form.brokerName}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], brokerName: e.target.value };
                    setBs(u);
                  }}
                  placeholder="e.g., Fidelity, Robinhood"
                />
                <Input
                  label="Description"
                  value={form.description}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], description: e.target.value };
                    setBs(u);
                  }}
                  placeholder="e.g., 100 shares AAPL"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Date Acquired"
                  type="date"
                  value={form.dateAcquired}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], dateAcquired: e.target.value };
                    setBs(u);
                  }}
                />
                <Input
                  label="Date Sold"
                  type="date"
                  value={form.dateSold}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], dateSold: e.target.value };
                    setBs(u);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Box 1d — Proceeds"
                  type="number"
                  value={form.proceeds || ""}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], proceeds: parseFloat(e.target.value) || 0 };
                    setBs(u);
                  }}
                />
                <Input
                  label="Box 1e — Cost Basis"
                  type="number"
                  value={form.costBasis || ""}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], costBasis: parseFloat(e.target.value) || 0 };
                    setBs(u);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isShortTerm}
                      onChange={(e) => {
                        const u = [...bs];
                        u[idx] = { ...u[idx], isShortTerm: e.target.checked };
                        setBs(u);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Short-term (held &lt; 1 year)
                  </label>
                </div>
                <Input
                  label="Box 4 — Federal Tax Withheld"
                  type="number"
                  value={form.federalWithheld || ""}
                  onChange={(e) => {
                    const u = [...bs];
                    u[idx] = { ...u[idx], federalWithheld: parseFloat(e.target.value) || 0 };
                    setBs(u);
                  }}
                />
              </div>
              {form.proceeds > 0 && (
                <div
                  className={`text-sm font-medium ${form.proceeds - form.costBasis >= 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {form.proceeds - form.costBasis >= 0 ? "Gain" : "Loss"}:{" "}
                  {formatCurrency(Math.abs(form.proceeds - form.costBasis))}
                </div>
              )}
            </Card>
          ))}
          <Button variant="outline" onClick={() => setBs((p) => [...p, { ...empty1099B }])}>
            + Add 1099-B Transaction
          </Button>
        </div>
      )}

      {/* Summary */}
      {(totalInterest > 0 || totalDividends > 0 || bs.length > 0) && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 space-y-1">
          {totalInterest > 0 && (
            <p>
              <strong>Total interest income:</strong>{" "}
              {formatCurrency(totalInterest)}
            </p>
          )}
          {totalDividends > 0 && (
            <p>
              <strong>Total dividends:</strong>{" "}
              {formatCurrency(totalDividends)}
            </p>
          )}
          {bs.length > 0 && (
            <p>
              <strong>Net capital {totalGains >= 0 ? "gains" : "losses"}:</strong>{" "}
              {formatCurrency(Math.abs(totalGains))}
            </p>
          )}
        </div>
      )}

      {ints.length === 0 && divs.length === 0 && bs.length === 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
          <strong>No investment income?</strong> That&apos;s fine — most first-time
          filers don&apos;t have any. Click Continue to move on.
        </div>
      )}
    </StepWrapper>
  );
}
