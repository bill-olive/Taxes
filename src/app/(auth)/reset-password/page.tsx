"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("Could not send reset email. Please check your email address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TaxReady</h1>
        </div>

        <Card>
          {sent ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Check your email
              </h2>
              <p className="text-sm text-gray-600">
                We sent a password reset link to <strong>{email}</strong>.
                Follow the instructions in the email to reset your password.
              </p>
              <Link href="/login">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Reset your password
              </h2>
              <p className="text-sm text-gray-600">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline"
                >
                  Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
