"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@bruddle/react";
import { getScheduledPosts } from "@/lib/api";
import { ScheduledPost } from "@/lib/types";
import { FileText, Save, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LibraryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "generated" | "saved" | "drafts"
  >("all");

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
                    <p className="font-bold">{post.title}</p>
                    <p className="text-sm text-gray-600">
                      Pillar: {post.pillar} | Scheduled:{" "}
                      {new Date(post.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`bru-tag bru-tag--filled ${post.status}`}>
                      {post.status.charAt(0).toUpperCase() +
                        post.status.slice(1)}
                    </span>
                    <button className="text-sm bg-gray-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-gray-200">
                      View/Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
