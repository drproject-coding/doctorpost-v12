"use client";
import React, { useState, useEffect } from "react";
import { getScheduledPosts, getAnalytics } from "@/lib/api";
import { ScheduledPost, AnalyticsData } from "@/lib/types";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ProgressBar,
  Card,
  CardHeader,
  Container,
  Loader,
  EmptyState,
  Button,
  Heading,
  Text,
  Tag,
} from "@doctorproject/react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const fetchedPosts = await getScheduledPosts();
        const fetchedAnalytics = await getAnalytics(user.id);
        setPosts(fetchedPosts);
        setAnalyticsData(fetchedAnalytics);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <Loader label="Loading dashboard..." />
      </div>
    );
  }

  const now = new Date();
  const upcomingPosts = posts
    .filter(
      (post) => new Date(post.scheduledAt) > now && post.status === "scheduled",
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
    .slice(0, 3);

  const recentPosts = posts
    .filter(
      (post) =>
        new Date(post.scheduledAt) <= now &&
        (post.status === "published" || post.status === "scheduled"),
    )
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )
    .slice(0, 3);

  return (
    <Container>
      <div style={{ marginBottom: "var(--drp-space-6)" }}>
        <Heading level={1}>Dashboard</Heading>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--drp-space-6)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        {/* Performance Summary Card */}
        <Card variant="raised">
          <CardHeader title="Performance Overview" />
          <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--drp-space-2)",
                }}
              >
                <Text size="sm" weight="bold">
                  Impressions
                </Text>
                <Text size="sm" weight="bold">
                  <span style={{ color: "var(--drp-success)" }}>
                    {analyticsData?.totalImpressions.toLocaleString() ?? "N/A"}
                  </span>
                </Text>
              </div>
              <ProgressBar
                value={((analyticsData?.totalImpressions ?? 0) / 100000) * 100}
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--drp-space-2)",
                }}
              >
                <Text size="sm" weight="bold">
                  Engagement
                </Text>
                <Text size="sm" weight="bold">
                  <span style={{ color: "var(--drp-success)" }}>
                    {analyticsData?.ctr ? `${analyticsData.ctr}%` : "N/A"}
                  </span>
                </Text>
              </div>
              <ProgressBar value={(analyticsData?.ctr ?? 0) * 10} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--drp-space-2)",
                }}
              >
                <Text size="sm" weight="bold">
                  Top Pillar
                </Text>
                <Text size="sm" weight="bold">
                  <span style={{ color: "var(--drp-success)" }}>
                    {analyticsData?.topPerformingPillar.name ?? "N/A"}
                  </span>
                </Text>
              </div>
              <ProgressBar
                value={
                  ((analyticsData?.topPerformingPillar.value ?? 0) / 50000) *
                  100
                }
              />
            </div>
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card variant="raised">
          <CardHeader title="Quick Actions" />
          <div style={{ display: "grid", gap: "var(--drp-space-3)" }}>
            <Link href="/create" style={{ textDecoration: "none" }}>
              <Button
                variant="ghost"
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                Generate New Post
              </Button>
            </Link>
            <Link href="/calendar" style={{ textDecoration: "none" }}>
              <Button
                variant="ghost"
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                View Calendar
              </Button>
            </Link>
            <Link href="/settings" style={{ textDecoration: "none" }}>
              <Button
                variant="ghost"
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                Update Brand Profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Upcoming Posts Card — spans 2 cols on desktop */}
        <div style={{ gridColumn: "span 2" }}>
          <Card variant="raised" style={{ height: "100%" }}>
            <CardHeader
              title="Upcoming Posts"
              action={
                <Link href="/calendar">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              }
            />
            <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
              {upcomingPosts.length > 0 ? (
                upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "var(--drp-space-3)",
                      paddingBottom: "var(--drp-space-4)",
                      borderBottom:
                        "1px solid var(--drp-border-thin, rgba(0,0,0,0.08))",
                    }}
                  >
                    <div>
                      <Text weight="semibold">{post.title}</Text>
                      <Text size="sm">
                        {formatDate(post.scheduledAt)} at{" "}
                        {formatTime(post.scheduledAt)}
                      </Text>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="📅"
                  title="No upcoming posts"
                  description="Create and schedule a post to see it here."
                  action={
                    <Link href="/create">
                      <Button variant="primary" size="sm">
                        Create Post
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--drp-space-6)",
        }}
      >
        {/* Recent Posts Card */}
        <Card variant="raised">
          <CardHeader
            title="Recent Posts"
            action={
              <Link href="/library">
                <Button variant="ghost" size="sm">
                  View Library
                </Button>
              </Link>
            }
          />
          <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    paddingBottom: "var(--drp-space-4)",
                    borderBottom:
                      "1px solid var(--drp-border-thin, rgba(0,0,0,0.08))",
                  }}
                >
                  <Text weight="semibold">{post.title}</Text>
                  <Text size="sm">
                    Published: {formatDate(post.scheduledAt)}
                  </Text>
                </div>
              ))
            ) : (
              <EmptyState
                icon="📝"
                title="No recent posts"
                description="Published posts will appear here."
              />
            )}
          </div>
        </Card>

        {/* Trending Topics Card */}
        <Card variant="raised">
          <CardHeader
            title="Trending Topics"
            action={<Text size="sm">Last 7 Days</Text>}
          />
          <div style={{ display: "grid", gap: "var(--drp-space-3)" }}>
            {analyticsData?.trendingTopics.length ? (
              analyticsData.trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--drp-space-3) var(--drp-space-4)",
                    border: "var(--drp-border)",
                  }}
                >
                  <Text weight="medium">{topic}</Text>
                  <Tag color="mint" filled>
                    Trending
                  </Tag>
                </div>
              ))
            ) : (
              <EmptyState
                icon="📊"
                title="No trending topics"
                description="Analytics data will appear here."
              />
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}
