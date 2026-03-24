"use client";

import React, { useState } from "react";
import { Button, Card, Loader, Icon, Input } from "@doctorproject/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { checkSession } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string; error?: string };
        setError(
          data.message ?? data.error ?? "Signup failed. Please try again.",
        );
        return;
      }

      await checkSession();
      router.push("/onboarding/start");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "100vh", background: "var(--drp-cream)" }}
    >
      <Card
        variant="raised"
        className="text-center"
        style={{ padding: "32px", maxWidth: "420px", width: "100%" }}
      >
        <h1
          style={{
            fontSize: "var(--drp-text-h4)",
            fontWeight: 700,
            marginBottom: "var(--drp-text-h4)",
            color: "var(--drp-purple)",
          }}
        >
          Create your account
        </h1>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ textAlign: "left" }}
        >
          <div style={{ marginBottom: "var(--drp-space-4)" }}>
            <Input
              id="name"
              type="text"
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "var(--drp-space-4)" }}>
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "var(--drp-space-6)" }}>
            <div style={{ position: "relative" }}>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "var(--drp-text-xs)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "inherit",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Icon name="eye-off" size="sm" />
                ) : (
                  <Icon name="eye" size="sm" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "var(--drp-text-lg)",
                padding: "10px 14px",
                background: "rgba(255, 68, 68, 0.12)",
                border: "2px solid var(--drp-error)",
                borderRadius: 0,
                color: "var(--drp-error)",
                fontSize: "var(--drp-text-md)",
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: "100%", borderRadius: 0 }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Loader size="sm" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p
          style={{
            marginTop: "var(--drp-text-h5)",
            fontSize: "var(--drp-text-md)",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "var(--drp-purple)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
