"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  EmptyState,
  Loader,
  Select,
  Tabs,
  Tag,
} from "@doctorproject/react";
import { getScheduledPosts, updatePost } from "@/lib/api";
import { ScheduledPost, PostStatus } from "@/lib/types";
import CalendarView from "@/components/calendar/CalendarView";
import PostEditorModal from "@/components/PostEditorModal";
import { getStatusColorClasses, statusOptions } from "@/lib/calendarUtils";
import ScoreBadge from "@/components/calendar/ScoreBadge";

type FilterStatus = PostStatus | "all" | "past";

function getStatusTagColor(
  status: PostStatus,
): "mint" | "purple" | "yellow" | "pink" | "grey" {
  switch (status) {
    case "published":
      return "mint";
    case "scheduled":
      return "purple";
    case "to-review":
      return "yellow";
    case "to-publish":
      return "pink";
    case "draft":
    case "to-plan":
    default:
      return "grey";
  }
}

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
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--drp-space-4)",
                  borderBottom: "1px solid var(--drp-border)",
                }}
              >
                <div>
                  <p className="font-bold">
                    {post.factoryScore != null && (
                      <ScoreBadge score={post.factoryScore} size="md" />
                    )}
                    {post.title}
                  </p>
                  <p
                    style={{
                      fontSize: "var(--drp-text-sm)",
                      color: "var(--drp-grey)",
                    }}
                  >
                    Pillar: {post.pillar} | Scheduled:{" "}
                    {new Date(post.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--drp-space-4)",
                  }}
                >
                  <Tag color={getStatusTagColor(post.status)} filled>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </Tag>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPostClick(post)}
                  >
                    View/Edit
                  </Button>
                </div>
              </div>
            ))
        ) : (
          <EmptyState
            title="No posts found"
            description="No posts match the selected filter."
          />
        )}
      </div>
    </Card>
  );
};

const viewTabItems = [
  { key: "calendar", label: "Calendar" },
  { key: "list", label: "List" },
];

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
            <Loader label="Loading calendar..." />
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
          <Tabs
            items={viewTabItems}
            activeKey={view}
            onChange={(id) => setView(id as "calendar" | "list")}
          />

          {/* Date Picker */}
          <div className="relative">
            <label htmlFor="date-picker" className="sr-only">
              Select Date
            </label>
            <input
              type="date"
              id="date-picker"
              className="drp-input !py-2 !pl-3 !pr-8 text-sm font-bold appearance-none bg-white"
              value={selectedDateFromPicker ?? ""}
              onChange={(e) => setSelectedDateFromPicker(e.target.value)}
            />
          </div>

          <Select
            label=""
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                (e as React.ChangeEvent<HTMLSelectElement>).target
                  .value as FilterStatus,
              )
            }
          >
            <option value="all">All Statuses</option>
            <option value="past">Past Posts</option>
            {statusOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Color Guide Legend */}
        <Card variant="raised" className="p-4 mb-6">
          <h3 className="text-md font-bold mb-2">Status Color Guide:</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {statusOptions.map((option) => (
              <div key={option.id} className="flex items-center text-sm">
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
            <div className="flex items-center text-sm">
              <span
                style={{
                  width: "0.75rem",
                  height: "0.75rem",
                  borderRadius: "9999px",
                  border: "2px solid var(--drp-border)",
                  background: "var(--drp-purple-light, #ede9fe)",
                  marginRight: "var(--drp-space-2)",
                  display: "inline-block",
                }}
              ></span>
              Today&apos;s Date
            </div>
            <div className="flex items-center text-sm">
              <span
                style={{
                  width: "0.75rem",
                  height: "0.75rem",
                  borderRadius: "9999px",
                  border: "2px solid var(--drp-yellow)",
                  background: "var(--drp-yellow-light, #fef9c3)",
                  marginRight: "var(--drp-space-2)",
                  display: "inline-block",
                }}
              ></span>
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
