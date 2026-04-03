"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface StepWrapperProps {
  title: string;
  description?: string;
  helpText?: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isValid?: boolean;
  isSubmitting?: boolean;
}

export function StepWrapper({
  title,
  description,
  helpText,
  children,
  onNext,
  onBack,
  isFirst = false,
  isLast = false,
  isValid = true,
  isSubmitting = false,
}: StepWrapperProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
          </div>

          {helpText && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
              {helpText}
            </div>
          )}

          <div className="space-y-4">{children}</div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            {!isFirst && onBack ? (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={onNext}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isLast
                  ? "Review Summary"
                  : "Continue"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
