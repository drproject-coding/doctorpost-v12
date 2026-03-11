"use client";
import React, { useState } from "react";
import { Button, Card, Input, Alert, Loader } from "@doctorproject/react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Swallow network errors — always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--drp-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--drp-space-4)",
      }}
    >
      <Card
        variant="raised"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "var(--drp-space-8)",
        }}
      >
        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "var(--drp-text-h4)",
                fontWeight: "var(--drp-weight-bold)",
                marginBottom: "var(--drp-space-4)",
                color: "var(--drp-purple)",
              }}
            >
              Check your inbox
            </h1>
            <p
              style={{
                marginBottom: "var(--drp-space-6)",
                color: "var(--drp-text-secondary)",
              }}
            >
              If that email is registered, you&apos;ll receive a reset link
              shortly.
            </p>
            <Button
              variant="primary"
              block
              onClick={() => void router.push("/login")}
            >
              ← Back to login
            </Button>
          </div>
        ) : (
          <>
            <h1
              style={{
                fontSize: "var(--drp-text-h4)",
                fontWeight: "var(--drp-weight-bold)",
                marginBottom: "var(--drp-space-2)",
                color: "var(--drp-purple)",
              }}
            >
              Reset your password
            </h1>
            <p
              style={{
                marginBottom: "var(--drp-space-6)",
                color: "var(--drp-text-secondary)",
              }}
            >
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form
              onSubmit={(e) => void handleSubmit(e)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-4)",
              }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              {error && <Alert variant="error">{error}</Alert>}

              <Button type="submit" variant="primary" disabled={loading} block>
                {loading ? <Loader size="sm" /> : "Send Reset Link"}
              </Button>
            </form>

            <div
              style={{ textAlign: "center", marginTop: "var(--drp-space-4)" }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void router.push("/login")}
              >
                ← Back to login
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
