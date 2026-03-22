"use client";
import React, { useState } from "react";
import { Button, Card, Loader } from "@doctorproject/react";
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
        padding: "1rem",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: 0,
          padding: "2rem",
        }}
      >
        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "var(--drp-purple)",
              }}
            >
              Check your inbox
            </h1>
            <p style={{ marginBottom: "1.5rem", color: "#555" }}>
              If that email is registered, you&apos;ll receive a reset link
              shortly.
            </p>
            <Button
              variant="primary"
              style={{ borderRadius: 0, width: "100%" }}
              onClick={() => void router.push("/login")}
            >
              ← Back to login
            </Button>
          </div>
        ) : (
          <>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "var(--drp-purple)",
              }}
            >
              Reset your password
            </h1>
            <p style={{ marginBottom: "1.5rem", color: "#555" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    marginBottom: "0.375rem",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="drp-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ borderRadius: 0, width: "100%" }}
                />
              </div>

              {error && (
                <p
                  style={{
                    color: "#c00",
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ borderRadius: 0, width: "100%", marginBottom: "1rem" }}
              >
                {loading ? <Loader size="sm" /> : "Send Reset Link"}
              </Button>
            </form>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => void router.push("/login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--drp-purple)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                ← Back to login
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
