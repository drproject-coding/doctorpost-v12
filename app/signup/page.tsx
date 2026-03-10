"use client";

import React, { useState } from "react";
import { Button, Card } from "@doctorproject/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader, Eye, EyeOff } from "lucide-react";

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
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "24px",
            color: "var(--drp-purple)",
          }}
        >
          Create your account
        </h1>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ textAlign: "left" }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
                fontSize: "14px",
              }}
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              className="drp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              style={{ width: "100%", borderRadius: 0 }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
                fontSize: "14px",
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
              required
              autoComplete="email"
              style={{ width: "100%", borderRadius: 0 }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
                fontSize: "14px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="drp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ width: "100%", borderRadius: 0, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "10px",
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                background: "#fee2e2",
                border: "2px solid #ef4444",
                borderRadius: 0,
                color: "#b91c1c",
                fontSize: "14px",
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
                <Loader size={16} className="animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "14px" }}>
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
