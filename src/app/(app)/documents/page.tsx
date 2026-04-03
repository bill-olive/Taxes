"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { useAuth } from "@/context/AuthContext";
import { uploadDocument, deleteDocument } from "@/lib/firebase/storage";
import { getCurrentTaxYear } from "@/lib/utils";
import type { DocumentMeta } from "@/types";

const DOC_TYPES: { value: DocumentMeta["type"]; label: string }[] = [
  { value: "w2", label: "W-2" },
  { value: "property_tax", label: "Property Tax Statement" },
  { value: "1098t", label: "1098-T (Tuition)" },
  { value: "other", label: "Other" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taxReturn, updateSection } = useTaxReturn();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docType, setDocType] = useState<DocumentMeta["type"]>("w2");
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user || acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }

      setError("");
      setUploading(true);
      setProgress(0);

      try {
        const { storagePath } = await uploadDocument(
          user.uid,
          getCurrentTaxYear(),
          file,
          (pct) => setProgress(Math.round(pct))
        );

        const newDoc: DocumentMeta = {
          fileName: file.name,
          type: docType,
          storagePath,
          uploadedAt: new Date().toISOString(),
        };

        await updateSection("documents", [...taxReturn.documents, newDoc]);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [user, docType, taxReturn.documents, updateSection]
  );

  async function handleDelete(index: number) {
    const doc = taxReturn.documents[index];
    try {
      await deleteDocument(doc.storagePath);
    } catch {
      // File may already be deleted
    }
    const updated = taxReturn.documents.filter((_, i) => i !== index);
    await updateSection("documents", updated);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Upload Your Documents
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload copies of your tax documents for secure storage. This helps you
          keep everything organized and makes future filings easier.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) =>
                setDocType(e.target.value as DocumentMeta["type"])
              }
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto mb-2">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Uploading... {progress}%
                </p>
              </div>
            ) : isDragActive ? (
              <p className="text-sm text-blue-600">Drop your file here</p>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, PNG, or JPG — max 10 MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </Card>

      {taxReturn.documents.length > 0 && (
        <Card>
          <CardTitle>Uploaded Documents</CardTitle>
          <ul className="mt-4 divide-y divide-gray-100">
            {taxReturn.documents.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {DOC_TYPES.find((t) => t.value === doc.type)?.label} —{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(idx)}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/intake/deductions")}>
          Back to Intake
        </Button>
        <Button onClick={() => router.push("/summary")}>
          View Tax Summary
        </Button>
      </div>
    </div>
  );
}
