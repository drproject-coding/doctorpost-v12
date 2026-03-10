"use client";

import { useState, useEffect } from "react";
import { Card } from "@doctorproject/react";
import { CheckCircle, Zap, Loader, AlertCircle, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface UserSettings {
  id?: string;
  tier?: string | null;
  monthly_usage_count?: number | null;
  monthly_usage_reset_date?: string | null;
}

const TIER_LIMITS: Record<string, number | null> = {
  free: 5,
  pro: 30,
  power: null,
};

const PLAN_FEATURES: Record<
  string,
  { label: string; color: string; limit: string; features: string[] }
> = {
  free: {
    label: "Free",
    color: "#888",
    limit: "5 posts/month",
    features: [
      "5 AI-generated posts per month",
      "Basic brand profile",
      "Content library",
      "LinkedIn formatting",
    ],
  },
  pro: {
    label: "Pro",
    color: "var(--drp-purple)",
    limit: "30 posts/month",
    features: [
      "30 AI-generated posts per month",
      "Full brand voice & pillars",
      "Post scoring & feedback",
      "Carousel & visual formats",
      "Learning loop",
    ],
  },
  power: {
    label: "Power",
    color: "#FF6C01",
    limit: "Unlimited",
    features: [
      "Unlimited AI-generated posts",
      "All Pro features",
      "Priority support",
      "Early access to new features",
      "Custom AI model settings",
    ],
  },
};

export default function SettingsSubscriptionPage() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/data/read/user_settings", {
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as UserSettings | UserSettings[];
          const row = Array.isArray(data) ? (data[0] ?? null) : data;
          setSettings(row);
        } else {
          // No settings row yet — treat as free tier with 0 usage
          setSettings({ tier: "free", monthly_usage_count: 0 });
        }
      } catch {
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontWeight: 600 }}>Loading…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tier = settings?.tier ?? "free";
  const limit = TIER_LIMITS[tier] ?? 5;
  const used = settings?.monthly_usage_count ?? 0;
  const resetDate = settings?.monthly_usage_reset_date;
  const planMeta = PLAN_FEATURES[tier] ?? PLAN_FEATURES.free;

  const usagePct = limit !== null ? Math.min(100, (used / limit) * 100) : 0;
  const usageColor =
    limit === null
      ? "#00A896"
      : usagePct >= 90
        ? "#E99898"
        : usagePct >= 70
          ? "#FF6C01"
          : "#00A896";

  const formattedReset = resetDate
    ? new Date(resetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--drp-cream)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: "0 0 6px",
              color: "var(--drp-black)",
            }}
          >
            Subscription
          </h1>
          <p style={{ margin: 0, color: "var(--drp-grey)", fontSize: 14 }}>
            Your current plan and usage
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              background: "rgba(233,152,152,0.1)",
              border: "1px solid #E99898",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={15} color="#E99898" />
            <span style={{ fontSize: 13 }}>{error}</span>
          </div>
        )}

        {/* Current plan card */}
        <Card variant="raised" style={{ marginBottom: 16 }}>
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--drp-grey)",
                  }}
                >
                  Current Plan
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: planMeta.color,
                    }}
                  >
                    {planMeta.label}
                  </span>
                  {tier === "power" && (
                    <Crown size={20} color="#FF6C01" fill="#FF6C01" />
                  )}
                </div>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 14,
                    color: "var(--drp-grey)",
                  }}
                >
                  {planMeta.limit}
                </p>
              </div>

              <div
                style={{
                  padding: "6px 16px",
                  border: `2px solid ${planMeta.color}`,
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: planMeta.color,
                }}
              >
                Active
              </div>
            </div>

            {/* Usage bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Posts This Month
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: usageColor,
                  }}
                >
                  {used}
                  {limit !== null ? ` / ${limit}` : " (unlimited)"}
                </span>
              </div>

              {limit !== null && (
                <div
                  style={{
                    height: 10,
                    background: "#eee",
                    position: "relative",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${usagePct}%`,
                      background: usageColor,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              )}

              {formattedReset && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--drp-grey)",
                  }}
                >
                  Resets on {formattedReset}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Plan comparison */}
        <Card variant="raised" style={{ marginBottom: 16 }}>
          <div style={{ padding: 24 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 15,
                margin: "0 0 20px",
                color: "var(--drp-black)",
              }}
            >
              Plan Comparison
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {(["free", "pro", "power"] as const).map((planKey) => {
                const plan = PLAN_FEATURES[planKey];
                const isCurrent = tier === planKey;
                return (
                  <div
                    key={planKey}
                    style={{
                      padding: 16,
                      border: isCurrent
                        ? `2px solid ${plan.color}`
                        : "2px solid #e5e5e5",
                      background: isCurrent
                        ? `${plan.color}08`
                        : "var(--drp-cream)",
                      position: "relative",
                    }}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          position: "absolute",
                          top: -1,
                          right: 12,
                          transform: "translateY(-50%)",
                          background: plan.color,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Current
                      </div>
                    )}

                    <div style={{ marginBottom: 10 }}>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontWeight: 800,
                          fontSize: 16,
                          color: plan.color,
                        }}
                      >
                        {plan.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "var(--drp-grey)",
                          fontWeight: 600,
                        }}
                      >
                        {plan.limit}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                          }}
                        >
                          <CheckCircle
                            size={12}
                            color={plan.color}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <span
                            style={{ fontSize: 12, color: "var(--drp-black)" }}
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Upgrade CTA */}
        {tier !== "power" && (
          <Card variant="raised">
            <div
              style={{
                padding: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 800,
                    fontSize: 16,
                    color: "var(--drp-black)",
                  }}
                >
                  Ready to upgrade?
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--drp-grey)",
                  }}
                >
                  Get more posts, advanced features, and unlimited creation.
                </p>
              </div>

              <a
                href="mailto:support@doctorpost.ai?subject=Upgrade%20Request"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "var(--drp-purple)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <Zap size={15} />
                {tier === "free" ? "Upgrade to Pro" : "Upgrade to Power"}
              </a>
            </div>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
