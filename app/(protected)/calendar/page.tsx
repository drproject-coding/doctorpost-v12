"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@bruddle/react";
import { getScheduledPosts, updatePost } from "@/lib/api";
import { ScheduledPost, PostStatus } from "@/lib/types";
import CalendarView from "@/components/calendar/CalendarView";
import PostEditorModal from "@/components/PostEditorModal";
import { List, Calendar, Filter } from "lucide-react";
import { getStatusColorClasses, statusOptions } from "@/lib/calendarUtils";
import ScoreBadge from "@/components/calendar/ScoreBadge";

type FilterStatus = PostStatus | "all" | "past";

const ListView = ({
  posts,
  onPostClick,
}: {
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
}) => {
  return (
    <Card variant="raised">
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts
            .sort(
              (a, b) =>
                new Date(a.scheduledAt).getTime() -
                new Date(b.scheduledAt).getTime(),
            )
            .map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
              >
                <div>
                  <p className="font-bold">
                    {post.factoryScore != null && (
                      <ScoreBadge score={post.factoryScore} size="md" />
                    )}
                    {post.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Pillar: {post.pillar} | Scheduled:{" "}
                    {new Date(post.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`bru-tag bru-tag--filled ${getStatusColorClasses(post.status)}`}
                  >
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  <button
                    className="text-sm bg-gray-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-gray-200"
                    onClick={() => onPostClick(post)}
                  >
                    View/Edit
                  </button>
                </div>
              </div>
            ))
        ) : (
          <p className="text-center py-12 text-gray-600 font-medium">
            No posts found for this filter.
          </p>
        )}
      </div>
    </Card>
  );
};

export default function CalendarPage() {
  const [allPosts, setAllPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedDateFromPicker, setSelectedDateFromPicker] = useState<
    string | null
  >(null);

  // State for Post Editor Modal
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] =
    useState<ScheduledPost | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getScheduledPosts();
      setAllPosts(data);
    } catch (error) {
      console.error("Failed to load scheduled posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  const filteredPosts = React.useMemo(() => {
    const now = new Date();
    return allPosts.filter((post) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "past") {
        return new Date(post.scheduledAt) < now;
      }
      return post.status === filterStatus;
    });
  }, [allPosts, filterStatus]);

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPostForEdit(post);
    setIsEditorModalOpen(true);
  };

  const handleSaveEditedPost = async (updatedPost: ScheduledPost) => {
    await updatePost(updatedPost);
    await fetchPosts();
    setIsEditorModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Content Calendar</h1>
          <Card
            variant="raised"
            className="flex items-center justify-center p-12"
          >
            <p>Loading calendar...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Content Calendar</h1>

        {/* View Toggle, Date Picker and Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 p-1 bg-gray-200 rounded-bru-md border-2 border-black">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center px-3 py-1 rounded-bru-md text-sm font-bold transition-colors ${view === "calendar" ? "bg-white text-bru-purple shadow" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center px-3 py-1 rounded-bru-md text-sm font-bold transition-colors ${view === "list" ? "bg-white text-bru-purple shadow" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </button>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <label htmlFor="date-picker" className="sr-only">
              Select Date
            </label>
            <input
              type="date"
              id="date-picker"
              className="bru-input !py-2 !pl-3 !pr-8 text-sm font-bold appearance-none bg-white"
              value={selectedDateFromPicker ?? ""}
              onChange={(e) => setSelectedDateFromPicker(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="bru-input !py-2 !pl-3 !pr-8 text-sm font-bold appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="past">Past Posts</option>
              {statusOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Filter size={16} />
            </div>
          </div>
        </div>

        {/* Color Guide Legend */}
        <Card variant="raised" className="p-4 mb-6">
          <h3 className="text-md font-bold mb-2">Status Color Guide:</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {statusOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center text-sm text-gray-700"
              >
                <span
                  className={`w-3 h-3 rounded-full border-2 ${getStatusColorClasses(
                    option.value as PostStatus,
                  )
                    .split(" ")[0]
                    .replace(
                      "bg-",
                      "border-",
                    )} ${getStatusColorClasses(option.value as PostStatus).split(" ")[0]} mr-2`}
                ></span>
                {option.label}
              </div>
            ))}
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-3 h-3 rounded-full border-2 border-gray-300 bg-purple-50 mr-2"></span>
              Today&apos;s Date
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-3 h-3 rounded-full border-2 border-bru-yellow bg-yellow-100 mr-2"></span>
              Selected Date
            </div>
          </div>
        </Card>

        {view === "calendar" ? (
          <CalendarView
            posts={filteredPosts}
            onPostClick={handlePostClick}
            selectedDateFromPicker={selectedDateFromPicker}
          />
        ) : (
          <ListView posts={filteredPosts} onPostClick={handlePostClick} />
        )}
      </div>

      <PostEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        post={selectedPostForEdit}
        onSave={handleSaveEditedPost}
      />
    </div>
  );
}
