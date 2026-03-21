"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, Button, Card } from "@doctorproject/react";
import { Loader } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reset email.");
      }

      setMessage("Check your email for a password reset link.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        throw new Error("Failed to reset password.");
      }

      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "var(--drp-cream)" }}
    >
      <Card
        variant="raised"
        className="text-center"
        style={{ padding: "32px", maxWidth: "420px", width: "100%" }}
      >
        <h1 className="text-2xl font-bold mb-6">
          {token ? "Set New Password" : "Reset Password"}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader size={24} className="animate-spin text-drp-purple" />
          </div>
        ) : token ? (
          <form
            onSubmit={(e) => void handleResetPassword(e)}
            className="space-y-4"
          >
            <input
              type="password"
              className="drp-input"
              style={{ width: "100%" }}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" block>
              Reset Password
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => void handleRequestReset(e)}
            className="space-y-4"
          >
            <input
              type="email"
              className="drp-input"
              style={{ width: "100%" }}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" block>
              Send Reset Link
            </Button>
          </form>
        )}

        {message && (
          <div style={{ marginTop: "var(--drp-space-4)" }}>
            <Alert variant="success">{message}</Alert>
          </div>
        )}
        {error && (
          <div style={{ marginTop: "var(--drp-space-4)" }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-sm text-drp-purple font-medium hover:underline"
        >
          Back to login
        </button>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: "var(--drp-cream)" }}
        >
          <Loader size={24} className="animate-spin text-drp-purple" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
