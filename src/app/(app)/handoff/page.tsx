"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { useRouter } from "next/navigation";

export default function HandoffPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Ready to File Your Return
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ve completed your tax preparation. Now it&apos;s time to file
          your return using a free e-filing service. TaxReady has organized all
          your data — just transfer it to the filing platform.
        </p>
      </div>

      <Disclaimer />

      <Card variant="info">
        <CardTitle>Before You File — Checklist</CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          {[
            "Review your Tax Summary for accuracy",
            "Have your W-2 form(s) handy",
            "Have your SSN ready (you'll need to re-enter it on the filing site)",
            "Have your bank account info ready for direct deposit of your refund",
            "If you're claiming the AOTC, have your 1098-T from your school",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Federal Return</CardTitle>
        <CardDescription>
          File your federal return for free through IRS Free File
        </CardDescription>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            The IRS Free File program lets you file your federal return at no
            cost if your AGI is $84,000 or less (2025). Use the prepared data
            from your TaxReady summary to fill in the forms.
          </p>
          <a
            href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="mt-2">Go to IRS Free File</Button>
          </a>
        </div>
      </Card>

      <Card>
        <CardTitle>Georgia State Return</CardTitle>
        <CardDescription>
          File your Georgia return through the Georgia Tax Center
        </CardDescription>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            Georgia residents can file their state return through the Georgia Tax
            Center. Use the Georgia section of your TaxReady summary to fill in
            Form 500.
          </p>
          <a
            href="https://gtc.dor.ga.gov"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="mt-2">
              Go to Georgia Tax Center
            </Button>
          </a>
        </div>
      </Card>

      <Card>
        <CardTitle>After You File</CardTitle>
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <p>
            Once you&apos;ve successfully filed, you can mark your return as
            completed in TaxReady. Your data and documents will be saved for next
            year, making your 2025 return even easier.
          </p>
          <p>
            Federal refunds typically arrive within 21 days if you file
            electronically and choose direct deposit. You can track your refund
            at{" "}
            <a
              href="https://www.irs.gov/refunds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              IRS Where&apos;s My Refund
            </a>
            .
          </p>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push("/summary")}>
          Back to Summary
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
