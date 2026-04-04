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
  employerAddress: "",
  wages: 0,
  federalWithheld: 0,
  socialSecurityWages: 0,
  socialSecurityWithheld: 0,
  medicareWages: 0,
  medicareWithheld: 0,
  socialSecurityTips: 0,
  allocatedTips: 0,
  dependentCareBenefits: 0,
  nonqualifiedPlans: 0,
  box12: [],
  isStatutoryEmployee: false,
  retirementPlan: false,
  thirdPartySickPay: false,
  box14Other: "",
  state: "",
  stateWages: 0,
  stateWithheld: 0,
  localWages: 0,
  localWithheld: 0,
  localityName: "",
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
  const [showAllBoxes, setShowAllBoxes] = useState<Record<number, boolean>>({});

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

        // Add parsed W-2 data with all boxes
        const newW2: W2Entry = {
          employerName: data.employerName || "",
          employerEIN: data.employerEIN || "",
          employerAddress: data.employerAddress || "",
          wages: data.wages || 0,
          federalWithheld: data.federalWithheld || 0,
          socialSecurityWages: data.socialSecurityWages || 0,
          socialSecurityWithheld: data.socialSecurityWithheld || 0,
          medicareWages: data.medicareWages || 0,
          medicareWithheld: data.medicareWithheld || 0,
          socialSecurityTips: data.socialSecurityTips || 0,
          allocatedTips: data.allocatedTips || 0,
          dependentCareBenefits: data.dependentCareBenefits || 0,
          nonqualifiedPlans: data.nonqualifiedPlans || 0,
          box12: Array.isArray(data.box12) ? data.box12 : [],
          isStatutoryEmployee: data.isStatutoryEmployee || false,
          retirementPlan: data.retirementPlan || false,
          thirdPartySickPay: data.thirdPartySickPay || false,
          box14Other: data.box14Other || "",
          state: data.state || "",
          stateWages: data.stateWages || 0,
          stateWithheld: data.stateWithheld || 0,
          localWages: data.localWages || 0,
          localWithheld: data.localWithheld || 0,
          localityName: data.localityName || "",
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
    router.push("/intake/investments");
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
            <div className="flex gap-2">
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
          </div>

          {/* Employer Info */}
          <Input
            label="Employer Name (Box c)"
            value={w2.employerName}
            onChange={(e) => updateW2(index, "employerName", e.target.value)}
            error={errors[`${index}-employerName`]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employer EIN (Box b)"
              value={w2.employerEIN}
              onChange={(e) => updateW2(index, "employerEIN", e.target.value)}
              placeholder="XX-XXXXXXX"
            />
            <Input
              label="Employer Address (Box c)"
              value={w2.employerAddress}
              onChange={(e) => updateW2(index, "employerAddress", e.target.value)}
              placeholder="123 Main St, City, ST 12345"
            />
          </div>

          {/* Core boxes: 1, 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Box 1 — Wages, tips, other compensation"
              type="number"
              value={w2.wages || ""}
              onChange={(e) =>
                updateW2(index, "wages", parseFloat(e.target.value) || 0)
              }
              error={errors[`${index}-wages`]}
            />
            <Input
              label="Box 2 — Federal income tax withheld"
              type="number"
              value={w2.federalWithheld || ""}
              onChange={(e) =>
                updateW2(index, "federalWithheld", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          {/* Boxes 3-6: Social Security & Medicare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Box 3 — Social security wages"
              type="number"
              value={w2.socialSecurityWages || ""}
              onChange={(e) =>
                updateW2(index, "socialSecurityWages", parseFloat(e.target.value) || 0)
              }
            />
            <Input
              label="Box 4 — Social security tax withheld"
              type="number"
              value={w2.socialSecurityWithheld || ""}
              onChange={(e) =>
                updateW2(index, "socialSecurityWithheld", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Box 5 — Medicare wages and tips"
              type="number"
              value={w2.medicareWages || ""}
              onChange={(e) =>
                updateW2(index, "medicareWages", parseFloat(e.target.value) || 0)
              }
            />
            <Input
              label="Box 6 — Medicare tax withheld"
              type="number"
              value={w2.medicareWithheld || ""}
              onChange={(e) =>
                updateW2(index, "medicareWithheld", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          {/* Expandable: Boxes 7-20 */}
          <button
            type="button"
            onClick={() =>
              setShowAllBoxes((prev) => ({ ...prev, [index]: !prev[index] }))
            }
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            {showAllBoxes[index]
              ? "Hide additional boxes (7–20)"
              : "Show additional boxes (7–20)"}
          </button>

          {showAllBoxes[index] && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Box 7 — Social security tips"
                  type="number"
                  value={w2.socialSecurityTips || ""}
                  onChange={(e) =>
                    updateW2(index, "socialSecurityTips", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Box 8 — Allocated tips"
                  type="number"
                  value={w2.allocatedTips || ""}
                  onChange={(e) =>
                    updateW2(index, "allocatedTips", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Box 10 — Dependent care benefits"
                  type="number"
                  value={w2.dependentCareBenefits || ""}
                  onChange={(e) =>
                    updateW2(index, "dependentCareBenefits", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Box 11 — Nonqualified plans"
                  type="number"
                  value={w2.nonqualifiedPlans || ""}
                  onChange={(e) =>
                    updateW2(index, "nonqualifiedPlans", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              {/* Box 12 entries */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Box 12 — Coded entries (e.g., DD = health insurance, W = HSA)
                </p>
                {(w2.box12 && w2.box12.length > 0 ? w2.box12 : []).map(
                  (entry, bi) => (
                    <div key={bi} className="grid grid-cols-3 gap-2 mb-2">
                      <Input
                        label={`Code (12${String.fromCharCode(97 + bi)})`}
                        value={entry.code}
                        onChange={(e) => {
                          const updated = [...(w2.box12 || [])];
                          updated[bi] = { ...updated[bi], code: e.target.value };
                          updateW2(index, "box12", updated as never);
                        }}
                        placeholder="DD"
                      />
                      <div className="col-span-2">
                        <Input
                          label="Amount"
                          type="number"
                          value={entry.amount || ""}
                          onChange={(e) => {
                            const updated = [...(w2.box12 || [])];
                            updated[bi] = {
                              ...updated[bi],
                              amount: parseFloat(e.target.value) || 0,
                            };
                            updateW2(index, "box12", updated as never);
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    const updated = [...(w2.box12 || []), { code: "", amount: 0 }];
                    updateW2(index, "box12", updated as never);
                  }}
                  className="text-xs"
                >
                  + Add Box 12 entry
                </Button>
              </div>

              {/* Box 13 checkboxes */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Box 13 — Checkboxes
                </p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={w2.isStatutoryEmployee || false}
                      onChange={(e) =>
                        updateW2(index, "isStatutoryEmployee", e.target.checked as never)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Statutory employee
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={w2.retirementPlan || false}
                      onChange={(e) =>
                        updateW2(index, "retirementPlan", e.target.checked as never)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Retirement plan
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={w2.thirdPartySickPay || false}
                      onChange={(e) =>
                        updateW2(index, "thirdPartySickPay", e.target.checked as never)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Third-party sick pay
                  </label>
                </div>
              </div>

              {/* Box 14 */}
              <Input
                label="Box 14 — Other"
                value={w2.box14Other || ""}
                onChange={(e) => updateW2(index, "box14Other", e.target.value)}
                placeholder="Additional info from your employer"
              />

              {/* Boxes 15-17: State */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Box 15 — State"
                  value={w2.state || ""}
                  onChange={(e) => updateW2(index, "state", e.target.value)}
                  placeholder="GA"
                />
                <Input
                  label="Box 16 — State wages"
                  type="number"
                  value={w2.stateWages || ""}
                  onChange={(e) =>
                    updateW2(index, "stateWages", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Box 17 — State tax withheld"
                  type="number"
                  value={w2.stateWithheld || ""}
                  onChange={(e) =>
                    updateW2(index, "stateWithheld", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              {/* Boxes 18-20: Local */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Box 18 — Local wages"
                  type="number"
                  value={w2.localWages || ""}
                  onChange={(e) =>
                    updateW2(index, "localWages", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Box 19 — Local tax withheld"
                  type="number"
                  value={w2.localWithheld || ""}
                  onChange={(e) =>
                    updateW2(index, "localWithheld", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Box 20 — Locality name"
                  value={w2.localityName || ""}
                  onChange={(e) => updateW2(index, "localityName", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Always-visible state fields when additional boxes are hidden */}
          {!showAllBoxes[index] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Box 16 — State wages"
                type="number"
                value={w2.stateWages || ""}
                onChange={(e) =>
                  updateW2(index, "stateWages", parseFloat(e.target.value) || 0)
                }
                helpText="Usually same as Box 1"
              />
              <Input
                label="Box 17 — State tax withheld"
                type="number"
                value={w2.stateWithheld || ""}
                onChange={(e) =>
                  updateW2(index, "stateWithheld", parseFloat(e.target.value) || 0)
                }
                helpText="Tax already paid to your state"
              />
            </div>
          )}
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
