"use client";
import React, { useState, useEffect } from "react";
import { Alert, Card } from "@bruddle/react";
import { getAnalytics } from "@/lib/api";
import { AnalyticsData } from "@/lib/types";
import { BarChart2, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <Card variant="raised" className="flex flex-col items-start">
    <div className="flex items-center mb-2">
      <div className="p-2 bg-bru-purple rounded-bru-md border-2 border-black mr-2">
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          className: "text-white",
        })}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
    </div>
    <p className="mt-1 text-3xl font-bold">{value}</p>
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
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Analytics</h1>
          <Card
            variant="raised"
            className="flex items-center justify-center p-12"
          >
            <p>Loading analytics dashboard...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Analytics</h1>
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
        <h1 className="text-3xl font-bold mb-6">Performance Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Impressions"
            value={data.totalImpressions.toLocaleString()}
            icon={<BarChart2 />}
          />
          <StatCard
            title="Total Reactions"
            value={data.totalReactions.toLocaleString()}
            icon={<ThumbsUp />}
          />
          <StatCard
            title="Total Comments"
            value={data.totalComments.toLocaleString()}
            icon={<MessageSquare />}
          />
          <StatCard
            title="Avg. CTR"
            value={`${data.ctr}%`}
            icon={<TrendingUp />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="raised">
            <h2 className="text-xl font-bold mb-4">
              Top Performers &amp; Insights
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 font-medium">
                <span className="font-bold">Top Content Pillar:</span>{" "}
                {data.topPerformingPillar.name} (
                {data.topPerformingPillar.value.toLocaleString()} impressions)
              </p>
              <p className="text-gray-700 font-medium">
                <span className="font-bold">Top Hook Pattern:</span>{" "}
                {data.topPerformingHook.name} (
                {data.topPerformingHook.value.toLocaleString()} reactions)
              </p>
              <div className="mt-4 p-3 bg-blue-50 border-2 border-black rounded-bru-md text-blue-800 font-medium">
                <p className="font-bold">Creator Engagement Insight:</p>
                <p>
                  Posts with &quot;Educational/Framework&quot; hooks
                  consistently drive 15% higher comments. Consider creating more
                  how-to guides!
                </p>
              </div>
            </div>
          </Card>

          <Card variant="raised">
            <h2 className="text-xl font-bold mb-4">Impressions by Pillar</h2>
            <div className="space-y-4">
              {data.performanceByPillar.map((pillar) => (
                <div key={pillar.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-base font-bold text-gray-700">
                      {pillar.name}
                    </span>
                    <span className="text-sm font-bold text-gray-500">
                      {pillar.impressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-bru-md border border-black h-3">
                    <div
                      className="bg-bru-purple h-3 rounded-bru-md"
                      style={{
                        width: `${(pillar.impressions / maxImpressions) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
