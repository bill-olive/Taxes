"use client";

import { cn } from "@/lib/utils";
import { INTAKE_STEPS } from "@/types";

interface ProgressStepperProps {
  currentStep: number;
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <nav aria-label="Tax return progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {INTAKE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted && "bg-green-600 text-white",
                    isCurrent && "bg-blue-600 text-white",
                    !isCompleted && !isCurrent && "bg-gray-200 text-gray-500"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1 text-xs text-center hidden sm:block",
                    isCurrent ? "font-medium text-blue-600" : "text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < INTAKE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mt-[-1rem]",
                    isCompleted ? "bg-green-600" : "bg-gray-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
