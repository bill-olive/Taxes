"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { useTaxReturn } from "@/context/TaxReturnContext";
import { useAuth } from "@/context/AuthContext";
import { getAllTaxYears, updateTaxReturn } from "@/lib/firebase/firestore";
import { INTAKE_STEPS } from "@/types";
import { formatCurrency, getCurrentTaxYear } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taxReturn, taxYear, loading, error: firestoreError } = useTaxReturn();
  const [priorYears, setPriorYears] = useState<
    { year: number; status: string }[]
  >([]);

  useEffect(() => {
    if (user) {
      getAllTaxYears(user.uid).then((years) => {
        setPriorYears(years.filter((y) => y.year !== getCurrentTaxYear()));
      }).catch(() => {
        // Firestore not available — skip prior years
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (firestoreError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Welcome</h2>
          <p className="mt-1 text-sm text-gray-600">Tax Year {taxYear} Dashboard</p>
        </div>
        <Card variant="warning">
          <p className="text-sm text-amber-800">{firestoreError}</p>
          <p className="text-xs text-amber-600 mt-2">
            Make sure Firestore is enabled in your Firebase project and your environment variables are configured correctly.
          </p>
        </Card>
      </div>
    );
  }

  const step = taxReturn.currentStep;
  const isComplete = taxReturn.status === "completed";
  const hasW2 = taxReturn.w2s.length > 0 && taxReturn.w2s[0].wages > 0;
  const currentStepLabel = step < INTAKE_STEPS.length ? INTAKE_STEPS[step].label : "Documents & Review";

  function getResumeLink(): string {
    if (step >= INTAKE_STEPS.length) return "/documents";
    return `/intake/${INTAKE_STEPS[step].id}`;
  }

  async function handleMarkComplete() {
    if (!user) return;
    await updateTaxReturn(user.uid, taxYear, { status: "completed" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome{taxReturn.personalInfo.firstName ? `, ${taxReturn.personalInfo.firstName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Tax Year {taxYear} Dashboard
        </p>
      </div>

      {/* Current return status */}
      <Card variant={isComplete ? "success" : "info"}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {taxYear} Tax Return —{" "}
              {isComplete ? "Completed" : "In Progress"}
            </CardTitle>
            <CardDescription>
              {isComplete
                ? "Your return is prepared. Visit the summary or handoff page to file."
                : `Next step: ${currentStepLabel} (Step ${Math.min(step + 1, INTAKE_STEPS.length)} of ${INTAKE_STEPS.length})`}
            </CardDescription>
          </div>
          <div className="flex gap-3">
            {isComplete ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push("/summary")}
                >
                  View Summary
                </Button>
                <Button onClick={() => router.push("/handoff")}>
                  File Now
                </Button>
              </>
            ) : (
              <Button onClick={() => router.push(getResumeLink())}>
                {step === 0 && !hasW2 ? "Start Return" : "Continue"}
              </Button>
            )}
          </div>
        </div>

        {!isComplete && step > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {step} of {INTAKE_STEPS.length + 1} steps
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${(step / (INTAKE_STEPS.length + 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Quick summary if calculation exists */}
      {taxReturn.calculationResult && (
        <Card>
          <CardTitle>Latest Calculation</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  taxReturn.calculationResult.federal.grossIncome
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Federal</p>
              <p
                className={`text-lg font-semibold ${taxReturn.calculationResult.federal.refundOrOwed >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {taxReturn.calculationResult.federal.refundOrOwed >= 0
                  ? "+"
                  : "-"}
                {formatCurrency(
                  Math.abs(
                    taxReturn.calculationResult.federal.refundOrOwed
                  )
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Georgia</p>
              <p
                className={`text-lg font-semibold ${taxReturn.calculationResult.georgia.refundOrOwed >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {taxReturn.calculationResult.georgia.refundOrOwed >= 0
                  ? "+"
                  : "-"}
                {formatCurrency(
                  Math.abs(
                    taxReturn.calculationResult.georgia.refundOrOwed
                  )
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" >
          <div onClick={() => router.push("/intake/personal-info")}>
            <CardTitle className="text-base">Edit Return</CardTitle>
            <CardDescription>Review or update your information</CardDescription>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div onClick={() => router.push("/documents")}>
            <CardTitle className="text-base">Documents</CardTitle>
            <CardDescription>
              {taxReturn.documents.length} document
              {taxReturn.documents.length !== 1 ? "s" : ""} uploaded
            </CardDescription>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div onClick={() => router.push("/summary")}>
            <CardTitle className="text-base">Tax Summary</CardTitle>
            <CardDescription>View your calculated return</CardDescription>
          </div>
        </Card>
      </div>

      {/* Mark complete */}
      {!isComplete && taxReturn.calculationResult && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Done filing?</CardTitle>
              <CardDescription>
                Mark this return as completed to lock in your data for next
                year&apos;s pre-fill.
              </CardDescription>
            </div>
            <Button variant="secondary" onClick={handleMarkComplete}>
              Mark as Completed
            </Button>
          </div>
        </Card>
      )}

      {/* Prior years */}
      {priorYears.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Prior Years
          </h3>
          <div className="space-y-2">
            {priorYears.map((py) => (
              <Card key={py.year}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {py.year} Tax Return
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {py.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
