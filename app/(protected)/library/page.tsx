"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Tabs,
  Tag,
  EmptyState,
  Pagination,
  Button,
} from "@doctorproject/react";
import { getScheduledPosts, updatePost, deletePost } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ScheduledPost } from "@/lib/types";
import { Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PostEditorModal from "@/components/PostEditorModal";

function getSource(post: ScheduledPost): "Studio" | "Factory" | "Create" {
  if (post.strategyOutput ?? post.format) return "Studio";
  if (post.factoryScore !== undefined) return "Factory";
  return "Create";
}

const SOURCE_TAG_COLOR: Record<string, "purple" | "mint" | "yellow"> = {
  Studio: "purple",
  Factory: "mint",
  Create: "yellow",
};

const FORMAT_TAG_COLOR: Record<string, "purple" | "yellow" | "grey"> = {
  carousel: "purple",
  visual: "yellow",
  simple: "grey",
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "to-review", label: "To Review" },
  { id: "to-plan", label: "To Plan" },
  { id: "to-publish", label: "To Publish" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
] as const;

type FilterId = (typeof STATUS_FILTERS)[number]["id"];

const DATED_STATUSES = new Set([
  "to-plan",
  "to-publish",
  "scheduled",
  "published",
]);

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const POSTS_PER_PAGE = 20;

export default function LibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getScheduledPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load posts for library:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchPosts();
  }, [user?.id]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: posts.length };
    for (const post of posts) {
      counts[post.status] = (counts[post.status] ?? 0) + 1;
    }
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter !== "all" && post.status !== filter) return false;
      if (q) {
        return (
          post.title.toLowerCase().includes(q) ||
          post.content.toLowerCase().includes(q) ||
          (post.pillar ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, filter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const pagedPosts = filteredPosts.slice(
    (page - 1) * POSTS_PER_PAGE,
    page * POSTS_PER_PAGE,
  );

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
      showToast("Failed to delete post. Please try again.", "error");
    }
  };

  const handleSavePost = async (updatedPost: ScheduledPost) => {
    try {
      await updatePost(updatedPost);
      setPosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
      setIsModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error("Failed to save post:", error);
      throw error;
    }
  };

  const tabItems = STATUS_FILTERS.map((f) => ({
    key: f.id,
    label: f.label,
    count: statusCounts[f.id] ?? 0,
  }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Content Library</h1>
          <Card
            variant="raised"
            className="flex items-center justify-center p-12"
          >
            <p>Loading content library...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Content Library</h1>

        {/* Status filter tabs */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <Tabs
            items={tabItems}
            activeKey={filter}
            onChange={(id) => setFilter(id as FilterId)}
          />
        </div>

        {/* Search */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <input
            type="text"
            placeholder="Search by title, content or pillar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "2px solid #000",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <Card variant="raised">
          {pagedPosts.length === 0 ? (
            <div style={{ padding: "var(--drp-space-12) 0" }}>
              <EmptyState
                icon="📚"
                title="No posts found"
                description="Try a different filter or create your first post."
                action={
                  <Link href="/create">
                    <Button variant="primary" size="sm">
                      Create Post
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {pagedPosts.map((post) => {
                const src = getSource(post);
                const showDate = DATED_STATUSES.has(post.status);
                const dateLabel =
                  post.status === "published" ? "Published" : "Planned";
                const scheduledFmt = fmtDate(post.scheduledAt);
                const createdFmt = fmtDate(post.createdAt);
                const updatedFmt = fmtDate(post.updatedAt);
                const showUpdated = updatedFmt && updatedFmt !== createdFmt;

                return (
                  <div
                    key={post.id}
                    className="flex items-start justify-between p-4 border-b border-gray-200 last:border-b-0"
                    style={{ gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-bold" style={{ marginBottom: 4 }}>
                        {post.title}
                      </p>
                      {/* Badge row */}
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Tag color={SOURCE_TAG_COLOR[src] ?? "grey"} filled>
                          {src}
                        </Tag>
                        {post.format && (
                          <Tag
                            color={FORMAT_TAG_COLOR[post.format] ?? "grey"}
                            filled
                          >
                            {post.format}
                          </Tag>
                        )}
                        {post.pillar && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--drp-color-text-muted, #666)",
                            }}
                          >
                            {post.pillar}
                          </span>
                        )}
                      </div>
                      {/* Date metadata row */}
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          fontSize: 11,
                          color: "var(--drp-color-text-muted, #888)",
                        }}
                      >
                        {createdFmt && <span>Created {createdFmt}</span>}
                        {showUpdated && <span>Updated {updatedFmt}</span>}
                        {showDate && scheduledFmt && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              color:
                                post.status === "published"
                                  ? "var(--drp-color-mint, #00A896)"
                                  : "var(--drp-color-purple, #631DED)",
                              fontWeight: 700,
                            }}
                          >
                            <Calendar size={11} />
                            {dateLabel} {scheduledFmt}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className={`drp-tag drp-tag--filled ${post.status}`}
                      >
                        {post.status.charAt(0).toUpperCase() +
                          post.status.slice(1)}
                      </span>
                      <Link
                        href={`/library/${post.uuid ?? post.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost-bordered"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: "var(--drp-space-6)" }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <PostEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        post={editingPost}
        onSave={handleSavePost}
      />
    </div>
  );
}
