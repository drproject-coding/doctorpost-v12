"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@bruddle/react";
import { getScheduledPosts, updatePost, deletePost } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ScheduledPost } from "@/lib/types";
import { FileText, Save, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PostEditorModal from "@/components/PostEditorModal";

function getSource(post: ScheduledPost): "Studio" | "Factory" | "Create" {
  if (post.strategyOutput ?? post.format) return "Studio";
  if (post.status === "scheduled") return "Factory";
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

export default function LibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "generated" | "saved" | "drafts"
  >("all");
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

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    if (filter === "generated")
      return post.status === "scheduled" || post.status === "published";
    if (filter === "saved") return post.status === "draft";
    if (filter === "drafts") return post.status === "draft";
    return true;
  });

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

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`py-2 px-4 text-sm font-bold border-2 border-black rounded-bru-md ${filter === "all" ? "bg-bru-purple text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFilter("generated")}
            className={`py-2 px-4 text-sm font-bold border-2 border-black rounded-bru-md ${filter === "generated" ? "bg-bru-purple text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
          >
            <FileText size={16} className="inline-block mr-2" /> My Generated
            Posts
          </button>
          <button
            onClick={() => setFilter("saved")}
            className={`py-2 px-4 text-sm font-bold border-2 border-black rounded-bru-md ${filter === "saved" ? "bg-bru-purple text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
          >
            <Save size={16} className="inline-block mr-2" /> Saved Posts
          </button>
          <button
            onClick={() => setFilter("drafts")}
            className={`py-2 px-4 text-sm font-bold border-2 border-black rounded-bru-md ${filter === "drafts" ? "bg-bru-purple text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
          >
            <Edit size={16} className="inline-block mr-2" /> Drafts
          </button>
        </div>

        <Card variant="raised">
          {filteredPosts.length === 0 ? (
            <p className="text-center py-12 text-gray-600 font-medium">
              No posts found for this filter.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                >
                  <div>
                    <p className="font-bold" style={{ marginBottom: 4 }}>
                      {post.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      {/* Source tag */}
                      {(() => {
                        const src = getSource(post);
                        const s = SOURCE_STYLE[src];
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
                            {src}
                          </span>
                        );
                      })()}
                      {/* Format tag */}
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
                    </div>
                    <p className="text-sm text-gray-600">
                      {post.pillar && <>Pillar: {post.pillar} · </>}
                      {post.scheduledAt &&
                      new Date(post.scheduledAt).getFullYear() > 2000
                        ? new Date(post.scheduledAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`bru-tag bru-tag--filled ${post.status}`}>
                      {post.status.charAt(0).toUpperCase() +
                        post.status.slice(1)}
                    </span>
                    <a
                      href={`/library/${post.uuid ?? post.id}`}
                      className="text-sm bg-gray-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-gray-200"
                      style={{ textDecoration: "none" }}
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-sm bg-gray-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-sm bg-red-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-red-200 text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
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
