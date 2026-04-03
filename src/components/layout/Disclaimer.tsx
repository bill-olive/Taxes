import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800",
        className
      )}
      role="note"
    >
      <strong>Important:</strong> TaxReady is a tax preparation assistant, not a
      tax filing service. It does not constitute tax, legal, or financial advice.
      Always verify your information against IRS instructions before filing. You
      are responsible for the accuracy of your tax return.
    </div>
  );
}
