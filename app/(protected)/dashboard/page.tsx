"use client";
import React, { useState, useEffect } from "react";
import { getScheduledPosts, getAnalytics } from "@/lib/api";
import { ScheduledPost, AnalyticsData } from "@/lib/types";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ProgressBar, Card, Icon, Loader } from "@doctorproject/react";

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
      <div>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <Card
            variant="raised"
            className="flex items-center justify-center p-12"
          >
            <p>Loading dashboard data...</p>
          </Card>
        </div>
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
                  background: "var(--drp-purple)",
                  padding: "8px",
                  borderRadius: "var(--drp-radius-md)",
                }}
                className="mr-3"
              >
                <Icon name="analytics" size="lg" className="text-white" />
              </div>
              <h2 className="text-lg font-bold">Performance Overview</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-bold">
                    Impressions
                  </span>
                  <span className="text-sm font-bold flex items-center text-green-600">
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
                  <span className="text-sm text-gray-600 font-bold">
                    Engagement
                  </span>
                  <span className="text-sm font-bold flex items-center text-green-600">
                    {analyticsData?.ctr ? `${analyticsData.ctr}%` : "N/A"}
                  </span>
                </div>
                <ProgressBar value={(analyticsData?.ctr ?? 0) * 10} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-bold">
                    Top Pillar
                  </span>
                  <span className="text-sm font-bold flex items-center text-green-600">
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
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/create"
                className="flex items-center font-bold hover:underline"
                style={{ color: "var(--drp-purple)" }}
              >
                Generate New Post
              </Link>
              <Link
                href="/calendar"
                className="flex items-center font-bold hover:underline"
                style={{ color: "var(--drp-purple)" }}
              >
                <Icon name="calendar" size="sm" className="mr-2" /> View
                Calendar
              </Link>
              <Link
                href="/settings"
                className="flex items-center font-bold hover:underline"
                style={{ color: "var(--drp-purple)" }}
              >
                <Icon name="settings" size="sm" className="mr-2" /> Update Brand
                Profile
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
                style={{ color: "var(--drp-purple)" }}
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
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(post.scheduledAt)} at{" "}
                        {formatTime(post.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">
                  No upcoming scheduled posts.
                </p>
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
                style={{ color: "var(--drp-purple)" }}
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
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-sm text-gray-600">
                        Published: {formatDate(post.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">
                  No recent posts found.
                </p>
              )}
            </div>
          </Card>

          {/* Trending Topics Card */}
          <Card variant="raised">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Trending Topics</h2>
              <span className="text-sm font-bold text-gray-600">
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
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">
                  No trending topics available.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
