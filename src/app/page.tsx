"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">TaxReady</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push("/login")}>
            Sign In
          </Button>
          <Button onClick={() => router.push("/signup")}>Get Started</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          File your taxes with
          <br />
          <span className="text-blue-600">confidence</span>, not anxiety
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          TaxReady walks you through your tax return step by step, finds
          every deduction and credit you qualify for, and gives you a clear
          summary to file with. No jargon, no surprises.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => router.push("/signup")} className="px-8 py-3 text-base">
            Start Your Free Return
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <Card>
            <div className="text-3xl mb-3">1</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Answer simple questions
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We guide you through your personal info, income, education, and
              property details — one topic at a time, in plain English.
            </p>
          </Card>

          <Card>
            <div className="text-3xl mb-3">2</div>
            <h3 className="text-lg font-semibold text-gray-900">
              We find your savings
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              TaxReady automatically checks if you qualify for credits like the
              American Opportunity Tax Credit ($2,500) and compares standard vs.
              itemized deductions.
            </p>
          </Card>

          <Card>
            <div className="text-3xl mb-3">3</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Review and file
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Get a clear summary of your federal and Georgia return, then file
              for free through IRS Free File. Your data is saved for next year.
            </p>
          </Card>
        </div>

        <div className="mt-16 text-sm text-gray-500 max-w-xl mx-auto">
          <p>
            TaxReady is a tax preparation tool — not a filing service. It does
            not file taxes on your behalf or provide tax, legal, or financial
            advice. Always review your return before filing.
          </p>
        </div>
      </main>
    </div>
  );
}
