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
import type { W2Entry, DocumentMeta } from "@/types";

const emptyW2: W2Entry = {
  employerName: "",
  employerEIN: "",
  wages: 0,
  federalWithheld: 0,
  stateWages: 0,
  stateWithheld: 0,
};

export default function W2IncomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taxReturn, updateSection } = useTaxReturn();
  const [w2s, setW2s] = useState<W2Entry[]>(
    taxReturn.w2s.length > 0 ? taxReturn.w2s : [{ ...emptyW2 }]
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState("");

  function updateW2(index: number, field: keyof W2Entry, value: string | number) {
    setW2s((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors({});
  }

  function addW2() {
    setW2s((prev) => [...prev, { ...emptyW2 }]);
  }

  function removeW2(index: number) {
    if (w2s.length === 1) return;
    setW2s((prev) => prev.filter((_, i) => i !== index));
  }

  const onDropW2Image = useCallback(
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
        // Send to our API route for parsing (avoids Firebase Storage CORS issues)
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch("/api/parse-w2", {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Parse failed");
        }

        const { data } = await resp.json();

        // Save document metadata to Firestore
        const newDoc: DocumentMeta = {
          fileName: file.name,
          type: "w2",
          storagePath: `w2-uploads/${Date.now()}_${file.name}`,
          uploadedAt: new Date().toISOString(),
        };
        await updateSection("documents", [...taxReturn.documents, newDoc]);

        // Add parsed W-2 data
        const newW2: W2Entry = {
          employerName: data.employerName || "",
          employerEIN: data.employerEIN || "",
          wages: data.wages || 0,
          federalWithheld: data.federalWithheld || 0,
          stateWages: data.stateWages || 0,
          stateWithheld: data.stateWithheld || 0,
        };

        // Replace the first empty W-2, or add a new one
        setW2s((prev) => {
          const firstEmpty = prev.findIndex(
            (w) => !w.employerName && w.wages === 0
          );
          if (firstEmpty >= 0) {
            const updated = [...prev];
            updated[firstEmpty] = newW2;
            return updated;
          }
          return [...prev, newW2];
        });

        setParseSuccess(
          `Imported W-2 from ${data.employerName || "your employer"}. Please verify the numbers below.`
        );
      } catch (err) {
        setParseError(
          err instanceof Error
            ? err.message
            : "Failed to parse W-2. You can enter the data manually below."
        );
      } finally {
        setParsing(false);
      }
    },
    [user, taxReturn.documents, updateSection]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropW2Image,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: parsing,
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    w2s.forEach((w2, i) => {
      if (!w2.employerName.trim()) errs[`${i}-employerName`] = "Required";
      if (w2.wages <= 0) errs[`${i}-wages`] = "Enter your wages from Box 1";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    setSaving(true);
    await updateSection("w2s", w2s);
    await updateSection("currentStep", 4);
    setSaving(false);
    router.push("/intake/education");
  }

  return (
    <StepWrapper
      title="W-2 Income"
      description="Enter the information from your W-2 form(s), or upload an image and we'll read it for you."
      helpText="Look at your W-2 form: Box 1 is your wages, Box 2 is federal tax withheld, Box 16 is state wages, and Box 17 is state tax withheld."
      onNext={handleNext}
      onBack={() => router.push("/intake/residency")}
      isSubmitting={saving}
    >
      {/* W-2 Image Upload */}
      <Card variant="info">
        <CardTitle className="text-base">Import W-2 from photo</CardTitle>
        <p className="text-sm text-gray-600 mt-1 mb-3">
          Take a photo or upload an image of your W-2 and we&apos;ll extract the data automatically. The document will also be saved to your files.
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
              <span className="text-sm text-blue-700">
                Reading your W-2...
              </span>
            </div>
          ) : (
            <p className="text-sm text-blue-700">
              Drop a W-2 image here, or click to upload (JPG, PNG, PDF)
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

      {w2s.map((w2, index) => (
        <Card key={index} className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              {w2s.length > 1 ? `W-2 #${index + 1}` : "Your W-2"}
            </CardTitle>
            {w2s.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => removeW2(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>

          <Input
            label="Employer Name"
            value={w2.employerName}
            onChange={(e) => updateW2(index, "employerName", e.target.value)}
            error={errors[`${index}-employerName`]}
          />

          <Input
            label="Employer EIN"
            value={w2.employerEIN}
            onChange={(e) => updateW2(index, "employerEIN", e.target.value)}
            helpText="Found in Box b of your W-2 (XX-XXXXXXX)"
            placeholder="XX-XXXXXXX"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Wages (Box 1)"
              type="number"
              value={w2.wages || ""}
              onChange={(e) =>
                updateW2(index, "wages", parseFloat(e.target.value) || 0)
              }
              error={errors[`${index}-wages`]}
              helpText="Your total taxable wages"
            />
            <Input
              label="Federal Tax Withheld (Box 2)"
              type="number"
              value={w2.federalWithheld || ""}
              onChange={(e) =>
                updateW2(
                  index,
                  "federalWithheld",
                  parseFloat(e.target.value) || 0
                )
              }
              helpText="Tax already paid to the IRS"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State Wages (Box 16)"
              type="number"
              value={w2.stateWages || ""}
              onChange={(e) =>
                updateW2(index, "stateWages", parseFloat(e.target.value) || 0)
              }
              helpText="Usually same as Box 1"
            />
            <Input
              label="State Tax Withheld (Box 17)"
              type="number"
              value={w2.stateWithheld || ""}
              onChange={(e) =>
                updateW2(
                  index,
                  "stateWithheld",
                  parseFloat(e.target.value) || 0
                )
              }
              helpText="Tax already paid to your state"
            />
          </div>
        </Card>
      ))}

      <Button variant="outline" onClick={addW2}>
        + Add another W-2
      </Button>

      {w2s.length > 0 && w2s[0].wages > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <strong>Total wages:</strong>{" "}
          {formatCurrency(w2s.reduce((sum, w) => sum + w.wages, 0))} |{" "}
          <strong>Total federal withheld:</strong>{" "}
          {formatCurrency(
            w2s.reduce((sum, w) => sum + w.federalWithheld, 0)
          )}
        </div>
      )}
    </StepWrapper>
  );
}
