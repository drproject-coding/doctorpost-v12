"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@doctorproject/react";
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

const SOURCE_STYLE: Record<string, { bg: string; color: string }> = {
  Studio: { bg: "#631DED1A", color: "#631DED" },
  Factory: { bg: "#00A8961A", color: "#00A896" },
  Create: { bg: "#FF6C011A", color: "#FF6C01" },
};

const FORMAT_STYLE: Record<string, { bg: string; color: string }> = {
  carousel: { bg: "#631DED1A", color: "#631DED" },
  visual: { bg: "#D4A8001A", color: "#D4A800" },
  simple: { bg: "#1212120D", color: "#666" },
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

        {/* Status filter chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {STATUS_FILTERS.map((f) => {
            const count = statusCounts[f.id] ?? 0;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "2px solid #000",
                  cursor: "pointer",
                  background: active ? "#000" : "#f5f5f5",
                  color: active ? "#fff" : "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {f.label}
                {count > 0 && (
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#ddd",
                      color: active ? "#fff" : "#555",
                      borderRadius: 8,
                      padding: "0 5px",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
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
            <p className="text-center py-12 text-gray-600 font-medium">
              No posts found.
            </p>
          ) : (
            <div className="space-y-4">
              {pagedPosts.map((post) => {
                const src = getSource(post);
                const srcStyle = SOURCE_STYLE[src];
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
                        <span
                          style={{
                            background: srcStyle.bg,
                            color: srcStyle.color,
                            padding: "1px 7px",
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                          }}
                        >
                          {src}
                        </span>
                        {post.format &&
                          (() => {
                            const s =
                              FORMAT_STYLE[post.format] ?? FORMAT_STYLE.simple;
                            return (
                              <span
                                style={{
                                  background: s.bg,
                                  color: s.color,
                                  padding: "1px 7px",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.8,
                                }}
                              >
                                {post.format}
                              </span>
                            );
                          })()}
                        {post.pillar && (
                          <span style={{ fontSize: 11, color: "#666" }}>
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
                          color: "#888",
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
                                  ? "#00A896"
                                  : "#631DED",
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
                      <a
                        href={`/library/${post.uuid ?? post.id}`}
                        className="text-sm bg-gray-100 py-1 px-3 rounded-drp-md border-2 border-black font-bold hover:bg-gray-200"
                        style={{ textDecoration: "none" }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="text-sm bg-gray-100 py-1 px-3 rounded-drp-md border-2 border-black font-bold hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-sm bg-red-100 py-1 px-3 rounded-drp-md border-2 border-black font-bold hover:bg-red-200 text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: "6px 16px",
                fontWeight: 700,
                border: "2px solid #000",
                cursor: page === 1 ? "not-allowed" : "pointer",
                background: page === 1 ? "#f5f5f5" : "#fff",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {page} / {totalPages} &nbsp;({filteredPosts.length} posts)
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "6px 16px",
                fontWeight: 700,
                border: "2px solid #000",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                background: page === totalPages ? "#f5f5f5" : "#fff",
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
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
