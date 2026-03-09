"use client";
import React, { useState, useEffect } from "react";
import { getScheduledPosts, getAnalytics } from "@/lib/api";
import { ScheduledPost, AnalyticsData } from "@/lib/types";
import {
  BarChart2,
  ArrowUpRight,
  Calendar,
  Clock,
  PlusSquare,
  TrendingUp,
  Book,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ProgressBar, Card, Loader, EmptyState, Button } from "@bruddle/react";

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
    <div>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {/* Performance Summary Card */}
          <Card variant="raised">
            <div className="flex items-center mb-4">
              <div
                style={{
                  background: "var(--bru-purple)",
                  padding: "8px",
                }}
                className="mr-3"
              >
                <BarChart2 className="text-white" size={24} />
              </div>
              <h2 className="text-lg font-bold">Performance Overview</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: "var(--bru-grey)",
                      fontSize: "var(--bru-text-sm)",
                      fontWeight: 700,
                    }}
                  >
                    Impressions
                  </span>
                  <span
                    className="text-sm font-bold flex items-center"
                    style={{ color: "var(--bru-success)" }}
                  >
                    {analyticsData?.totalImpressions.toLocaleString() ?? "N/A"}
                  </span>
                </div>
                <ProgressBar
                  value={
                    ((analyticsData?.totalImpressions ?? 0) / 100000) * 100
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: "var(--bru-grey)",
                      fontSize: "var(--bru-text-sm)",
                      fontWeight: 700,
                    }}
                  >
                    Engagement
                  </span>
                  <span
                    className="text-sm font-bold flex items-center"
                    style={{ color: "var(--bru-success)" }}
                  >
                    {analyticsData?.ctr ? `${analyticsData.ctr}%` : "N/A"}
                  </span>
                </div>
                <ProgressBar value={(analyticsData?.ctr ?? 0) * 10} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: "var(--bru-grey)",
                      fontSize: "var(--bru-text-sm)",
                      fontWeight: 700,
                    }}
                  >
                    Top Pillar
                  </span>
                  <span
                    className="text-sm font-bold flex items-center"
                    style={{ color: "var(--bru-success)" }}
                  >
                    {analyticsData?.topPerformingPillar.name ?? "N/A"}
                  </span>
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
            <div className="flex items-center mb-4">
              <div
                style={{
                  background: "var(--bru-yellow)",
                  padding: "8px",
                }}
                className="mr-3"
              >
                <PlusSquare className="text-white" size={24} />
              </div>
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/create"
                className="flex items-center font-bold hover:underline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--bru-purple)",
                  fontWeight: 700,
                }}
              >
                <ArrowUpRight size={16} /> Generate New Post
              </Link>
              <Link
                href="/calendar"
                className="flex items-center font-bold hover:underline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--bru-purple)",
                  fontWeight: 700,
                }}
              >
                <Calendar size={16} /> View Calendar
              </Link>
              <Link
                href="/settings"
                className="flex items-center font-bold hover:underline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--bru-purple)",
                  fontWeight: 700,
                }}
              >
                <Settings size={16} /> Update Brand Profile
              </Link>
            </div>
          </Card>

          {/* Upcoming Posts Card */}
          <Card variant="raised" className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upcoming Posts</h2>
              <Link
                href="/calendar"
                className="text-sm font-bold hover:underline"
                style={{ color: "var(--bru-purple)" }}
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingPosts.length > 0 ? (
                upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start space-x-3 pb-4 last:pb-0"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <div className="pt-1">
                      <Clock
                        className="w-4 h-4"
                        style={{ color: "var(--bru-grey)" }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--bru-grey)" }}
                      >
                        {formatDate(post.scheduledAt)} at{" "}
                        {formatTime(post.scheduledAt)}
                      </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts Card */}
          <Card variant="raised">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Posts</h2>
              <Link
                href="/library"
                className="text-sm font-bold hover:underline"
                style={{ color: "var(--bru-purple)" }}
              >
                View Library
              </Link>
            </div>
            <div className="space-y-4">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start space-x-3 pb-4 last:pb-0"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <div className="pt-1">
                      <Book
                        className="w-4 h-4"
                        style={{ color: "var(--bru-grey)" }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--bru-grey)" }}
                      >
                        Published: {formatDate(post.scheduledAt)}
                      </p>
                    </div>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Trending Topics</h2>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--bru-grey)" }}
              >
                Last 7 Days
              </span>
            </div>
            <div className="space-y-3">
              {analyticsData?.trendingTopics.length ? (
                analyticsData.trendingTopics.map((topic, index) => (
                  <Card
                    key={index}
                    variant="flat"
                    className="flex items-center justify-between"
                    style={{ padding: "8px" }}
                  >
                    <span className="font-medium">{topic}</span>
                    <TrendingUp
                      size={16}
                      style={{ color: "var(--bru-success)" }}
                    />
                  </Card>
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
      </div>
    </div>
  );
}
