"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Alert,
  Loader,
  Divider,
} from "@doctorproject/react";
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--drp-cream)",
        padding: "var(--drp-space-4)",
      }}
    >
      <Card
        variant="raised"
        style={{
          padding: "var(--drp-space-8)",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "var(--drp-text-h4)",
            fontWeight: "var(--drp-weight-bold)",
            marginBottom: "var(--drp-space-6)",
            color: "var(--drp-purple)",
            textAlign: "center",
          }}
        >
          Create your account
        </h1>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--drp-space-4)",
          }}
        >
          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div style={{ position: "relative" }}>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ position: "absolute", right: 6, bottom: 6 }}
            >
              {showPassword ? "⊘" : "⊙"}
            </Button>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" variant="primary" disabled={loading} block>
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--drp-space-2)",
                }}
              >
                <Loader size="sm" /> Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div style={{ margin: "var(--drp-space-5) 0" }}>
          <Divider />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "var(--drp-text-md)",
            color: "var(--drp-text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </p>
      </Card>
    </div>
  );
}
