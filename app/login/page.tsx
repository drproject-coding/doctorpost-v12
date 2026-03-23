"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Loader, Icon } from "@doctorproject/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Providers {
  email?: boolean;
  google?: boolean;
  emailOTP?: boolean;
}

export default function LoginPage() {
  const { isLoggedIn, loadingAuth, checkSession } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loadingAuth && isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, loadingAuth, router]);

  // Fetch available providers
  useEffect(() => {
    fetch("/api/auth-providers")
      .then((res) => res.json())
      .then((data: { providers?: Providers }) =>
        setProviders(data.providers || {}),
      )
      .catch(() => setProviders({ email: true }));
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Login failed.");
      }

      // Session cookie is now set, refresh auth state
      await checkSession();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
  };

  if (loadingAuth || !providers) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", background: "var(--drp-cream)" }}
      >
        <Loader size="sm" />
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-6">Welcome to DoctorPost</h1>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader size="sm" />
            <span className="font-medium" style={{ marginLeft: "8px" }}>
              Signing in...
            </span>
          </div>
        ) : (
          <>
            {providers.google && (
              <>
                <Button
                  onClick={handleGoogleLogin}
                  block
                  className="mb-4 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9s0 0 0 0a9 9 0 0 0 .96 4.04l3-2.33z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
                    />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span
                      className="px-2 text-gray-500"
                      style={{ background: "var(--drp-cream)" }}
                    >
                      or
                    </span>
                  </div>
                </div>
              </>
            )}

            {providers.email && (
              <>
                <form
                  onSubmit={(e) => void handleEmailSubmit(e)}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="email"
                      className="drp-input"
                      style={{ width: "100%" }}
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="drp-input pr-10"
                      style={{ width: "100%" }}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <Icon name="eye-off" size="sm" />
                      ) : (
                        <Icon name="eye" size="sm" />
                      )}
                    </button>
                  </div>
                  <Button type="submit" variant="primary" block>
                    Sign In
                  </Button>
                </form>

                <button
                  onClick={() => router.push("/signup")}
                  className="mt-4 text-sm text-drp-purple font-medium hover:underline"
                >
                  Don&apos;t have an account? <strong>Sign up</strong>
                </button>

                <button
                  onClick={() => router.push("/forgot-password")}
                  className="block mx-auto mt-2 text-sm text-gray-500 hover:text-drp-purple"
                >
                  Forgot password?
                </button>
              </>
            )}
          </>
        )}

        {error && (
          <div
            style={{
              marginTop: "var(--drp-text-h4)",
              padding: "var(--drp-text-sm)",
              background: "rgba(233,152,152,0.2)",
              border: "2px solid var(--drp-pink)",
              color: "#991B1B",
              fontSize: "var(--drp-text-md)",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </Card>
    </div>
  );
}
