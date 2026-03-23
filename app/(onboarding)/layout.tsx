"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { Loader } from "@doctorproject/react";

const stepLabels: Record<number, string> = {
  1: "Identity",
  2: "Voice & Tone",
  3: "Content Pillars",
  4: "ICP",
  5: "Bio & Positioning",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loadingAuth && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, loadingAuth, router]);

  const wizardMatch = pathname.match(/\/wizard\/(\d+)/);
  const step = wizardMatch ? parseInt(wizardMatch[1], 10) : null;
  const showProgressBar = step !== null && step >= 1 && step <= 5;

  if (loadingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--drp-cream)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader size="sm" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--drp-cream)" }}>
      {/* Top bar */}
      <div
        style={{
          background: "var(--drp-black)",
          color: "white",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "var(--drp-text-h6)" }}>DoctorPost</span>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            color: "var(--drp-grey)",
            fontSize: "var(--drp-text-md)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Exit
        </button>
      </div>

      {/* Progress bar (wizard steps only) */}
      {showProgressBar && (
        <div
          style={{
            padding: "16px 24px",
            background: "white",
            borderBottom: "2px solid var(--drp-black)",
          }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: "var(--drp-text-sm)", fontWeight: 600 }}>
                Step {step} of 5
              </span>
              <span style={{ fontSize: "var(--drp-text-sm)", color: "var(--drp-grey)" }}>
                {stepLabels[step!]}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--drp-cream)",
                border: "2px solid var(--drp-black)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--drp-purple)",
                  width: `${(step! / 5) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        style={{
          padding: "40px 24px",
          minHeight: "calc(100vh - 120px)",
          background: "var(--drp-cream)",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
