"use client";
import React, { useState, useEffect } from "react";
import { getScheduledPosts, getAnalytics } from "@/lib/api";
import { ScheduledPost, AnalyticsData } from "@/lib/types";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Alert, Card, Icon, Loader, Button } from "@doctorproject/react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

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
      } catch {
        setFetchError(true);
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
          <h1
            style={{
              fontSize: "var(--drp-text-h3)",
              fontWeight: "var(--drp-weight-bold)",
              marginBottom: "var(--drp-space-6)",
            }}
          >
            Dashboard
          </h1>
          <Card
            variant="raised"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--drp-space-12)",
            }}
          >
            <Loader size="sm" />
          </Card>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <div className="max-w-6xl mx-auto">
          <h1
            style={{
              fontSize: "var(--drp-text-h3)",
              fontWeight: "var(--drp-weight-bold)",
              marginBottom: "var(--drp-space-6)",
            }}
          >
            Dashboard
          </h1>
          <Alert variant="error">
            Failed to load dashboard data. Please refresh the page.
          </Alert>
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
        <h1
          style={{
            fontSize: "var(--drp-text-h3)",
            fontWeight: "var(--drp-weight-bold)",
            marginBottom: "var(--drp-space-6)",
          }}
        >
          Dashboard
        </h1>

        <Link href="/create" style={{ textDecoration: "none" }}>
          <Button
            variant="primary"
            style={{ marginBottom: "var(--drp-space-6)" }}
          >
            Generate New Post
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {/* Performance Summary Card */}
          <Card variant="raised">
            <h2
              style={{
                fontSize: "var(--drp-text-h5)",
                fontWeight: "var(--drp-weight-bold)",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              Performance Overview
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-6)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-text-muted)",
                    marginBottom: "var(--drp-space-2)",
                  }}
                >
                  Impressions
                </p>
                <p
                  style={{
                    fontSize: "var(--drp-text-h4)",
                    fontWeight: "var(--drp-weight-bold)",
                    color: "var(--drp-text-primary)",
                  }}
                >
                  {analyticsData?.totalImpressions.toLocaleString() ?? "—"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-text-muted)",
                    marginBottom: "var(--drp-space-2)",
                  }}
                >
                  Engagement
                </p>
                <p
                  style={{
                    fontSize: "var(--drp-text-h4)",
                    fontWeight: "var(--drp-weight-bold)",
                    color: "var(--drp-text-primary)",
                  }}
                >
                  {analyticsData?.ctr ? `${analyticsData.ctr}%` : "—"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-text-muted)",
                    marginBottom: "var(--drp-space-2)",
                  }}
                >
                  Top Pillar
                </p>
                <p
                  style={{
                    fontSize: "var(--drp-text-h4)",
                    fontWeight: "var(--drp-weight-bold)",
                    color: "var(--drp-text-primary)",
                  }}
                >
                  {analyticsData?.topPerformingPillar.name ?? "—"}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card variant="raised">
            <h2
              style={{
                fontSize: "var(--drp-text-h5)",
                fontWeight: "var(--drp-weight-bold)",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-3)",
              }}
            >
              <Link
                href="/create"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-2)",
                  color: "var(--drp-purple)",
                  fontWeight: "var(--drp-weight-bold)",
                  textDecoration: "none",
                }}
                className="hover:underline"
              >
                <Icon name="arrow-right" size="sm" />
                Generate New Post
              </Link>
              <Link
                href="/calendar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-2)",
                  color: "var(--drp-purple)",
                  fontWeight: "var(--drp-weight-bold)",
                  textDecoration: "none",
                }}
                className="hover:underline"
              >
                <Icon name="calendar" size="sm" />
                View Calendar
              </Link>
              <Link
                href="/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-2)",
                  color: "var(--drp-purple)",
                  fontWeight: "var(--drp-weight-bold)",
                  textDecoration: "none",
                }}
                className="hover:underline"
              >
                <Icon name="settings" size="sm" />
                Update Brand Profile
              </Link>
            </div>
          </Card>

          {/* Upcoming Posts Card */}
          <Card variant="raised" className="md:col-span-2">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              <h2
                style={{
                  fontSize: "var(--drp-text-h5)",
                  fontWeight: "var(--drp-weight-bold)",
                }}
              >
                Upcoming Posts
              </h2>
              <Link
                href="/calendar"
                className="hover:underline"
                style={{
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: "var(--drp-weight-bold)",
                  color: "var(--drp-purple)",
                  textDecoration: "none",
                }}
              >
                View All
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-4)",
              }}
            >
              {upcomingPosts.length > 0 ? (
                upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      paddingBottom: "var(--drp-space-4)",
                      borderBottom: "var(--drp-border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: "var(--drp-weight-bold)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--drp-text-sm)",
                          color: "var(--drp-text-secondary)",
                        }}
                      >
                        {formatDate(post.scheduledAt)} at{" "}
                        {formatTime(post.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--drp-space-6)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--drp-text-sm)",
                      color: "var(--drp-text-secondary)",
                      marginBottom: "var(--drp-space-4)",
                    }}
                  >
                    Nothing scheduled yet.
                  </p>
                  <Link href="/create" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="sm">
                      Generate your first post →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts Card */}
          <Card variant="raised">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              <h2
                style={{
                  fontSize: "var(--drp-text-h5)",
                  fontWeight: "var(--drp-weight-bold)",
                }}
              >
                Recent Posts
              </h2>
              <Link
                href="/library"
                className="hover:underline"
                style={{
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: "var(--drp-weight-bold)",
                  color: "var(--drp-purple)",
                  textDecoration: "none",
                }}
              >
                View Library
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-4)",
              }}
            >
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      paddingBottom: "var(--drp-space-4)",
                      borderBottom: "var(--drp-border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: "var(--drp-weight-bold)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--drp-text-sm)",
                          color: "var(--drp-text-secondary)",
                        }}
                      >
                        Published: {formatDate(post.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--drp-space-6)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--drp-text-sm)",
                      color: "var(--drp-text-secondary)",
                      marginBottom: "var(--drp-space-4)",
                    }}
                  >
                    No posts yet.
                  </p>
                  <Link href="/create" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="sm">
                      Create your first post →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Trending Topics Card */}
          <Card variant="raised">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              <h2
                style={{
                  fontSize: "var(--drp-text-h5)",
                  fontWeight: "var(--drp-weight-bold)",
                }}
              >
                Trending Topics
              </h2>
              <span
                style={{
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: "var(--drp-weight-bold)",
                  color: "var(--drp-text-secondary)",
                }}
              >
                Last 7 Days
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--drp-space-3)",
              }}
            >
              {analyticsData?.trendingTopics.length ? (
                analyticsData.trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--drp-space-2)",
                      border: "var(--drp-border)",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "var(--drp-weight-medium)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {topic}
                    </span>
                    <Link
                      href={`/create?topic=${encodeURIComponent(topic)}`}
                      className="hover:underline"
                      style={{
                        fontSize: "var(--drp-text-sm)",
                        fontWeight: "var(--drp-weight-bold)",
                        color: "var(--drp-purple)",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        marginLeft: "var(--drp-space-3)",
                      }}
                    >
                      Create →
                    </Link>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    fontWeight: "var(--drp-weight-medium)",
                    padding: "var(--drp-space-4) 0",
                    color: "var(--drp-text-secondary)",
                  }}
                >
                  Topics appear after your first generated post.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
