"use client";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Card,
  Heading,
  Loader,
  ProgressBar,
  Text,
} from "@doctorproject/react";
import { getAnalytics } from "@/lib/api";
import { AnalyticsData } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <Card
    variant="raised"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
    }}
  >
    <Text
      size="sm"
      weight="bold"
      style={{
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "var(--drp-space-1)",
      }}
    >
      {title}
    </Text>
    <Heading level="h2">{value}</Heading>
  </Card>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAnalytics(user?.id ?? "");
        setData(result);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{ padding: "var(--drp-space-6)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <Heading level="h1" style={{ marginBottom: "var(--drp-space-6)" }}>
            Analytics
          </Heading>
          <Card
            variant="raised"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--drp-space-12)",
            }}
          >
            <Loader label="Loading analytics dashboard..." />
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "var(--drp-space-6)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <Heading level="h1" style={{ marginBottom: "var(--drp-space-6)" }}>
            Analytics
          </Heading>
          <Alert variant="error" title="Failed to load analytics data">
            Please refresh the page to try again.
          </Alert>
        </div>
      </div>
    );
  }

  const maxImpressions = Math.max(
    ...data.performanceByPillar.map((p) => p.impressions),
    1,
  );

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <Heading level="h1" style={{ marginBottom: "var(--drp-space-6)" }}>
          Performance Analytics
        </Heading>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "var(--drp-space-6)",
            marginBottom: "var(--drp-space-8)",
          }}
        >
          <StatCard
            title="Total Impressions"
            value={data.totalImpressions.toLocaleString()}
          />
          <StatCard
            title="Total Reactions"
            value={data.totalReactions.toLocaleString()}
          />
          <StatCard
            title="Total Comments"
            value={data.totalComments.toLocaleString()}
          />
          <StatCard title="Avg. CTR" value={`${data.ctr}%`} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "var(--drp-space-6)",
          }}
        >
          <Card variant="raised">
            <Heading level="h2" style={{ marginBottom: "var(--drp-space-4)" }}>
              Top Performers &amp; Insights
            </Heading>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-4)",
              }}
            >
              <Text weight="bold">
                <strong>Top Content Pillar:</strong>{" "}
                {data.topPerformingPillar.name} (
                {data.topPerformingPillar.value.toLocaleString()} impressions)
              </Text>
              <Text weight="bold">
                <strong>Top Hook Pattern:</strong> {data.topPerformingHook.name}{" "}
                ({data.topPerformingHook.value.toLocaleString()} reactions)
              </Text>
              <div
                style={{
                  marginTop: "var(--drp-space-4)",
                  padding: "var(--drp-space-3)",
                  background: "var(--drp-purple-light, #ede9fe)",
                  border: "2px solid black",
                  color: "var(--drp-purple)",
                  fontWeight: 500,
                }}
              >
                <Text weight="bold">Creator Engagement Insight:</Text>
                <Text>
                  Posts with &quot;Educational/Framework&quot; hooks
                  consistently drive 15% higher comments. Consider creating more
                  how-to guides!
                </Text>
              </div>
            </div>
          </Card>

          <Card variant="raised">
            <Heading level="h2" style={{ marginBottom: "var(--drp-space-4)" }}>
              Impressions by Pillar
            </Heading>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-4)",
              }}
            >
              {data.performanceByPillar.map((pillar) => (
                <div key={pillar.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "var(--drp-space-1)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--drp-text-base)",
                        fontWeight: 700,
                        color: "var(--drp-text)",
                      }}
                    >
                      {pillar.name}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--drp-text-sm)",
                        fontWeight: 700,
                        color: "var(--drp-grey)",
                      }}
                    >
                      {pillar.impressions.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round(
                      (pillar.impressions / maxImpressions) * 100,
                    )}
                    color="mint"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
