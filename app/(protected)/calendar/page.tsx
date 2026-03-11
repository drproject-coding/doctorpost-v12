"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  EmptyState,
  Input,
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
      <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
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
                  <p style={{ fontWeight: 700 }}>
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
      <div style={{ padding: "var(--drp-space-6)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "var(--drp-text-h2)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-6)",
            }}
          >
            Content Calendar
          </h1>
          <Card
            variant="raised"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--drp-space-10)",
            }}
          >
            <Loader label="Loading calendar..." />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--drp-space-6)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "var(--drp-text-h2)",
            fontWeight: 700,
            marginBottom: "var(--drp-space-6)",
          }}
        >
          Content Calendar
        </h1>

        {/* View Toggle, Date Picker and Filter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--drp-space-4)",
            marginBottom: "var(--drp-space-6)",
          }}
        >
          <Tabs
            items={viewTabItems}
            activeKey={view}
            onChange={(id) => setView(id as "calendar" | "list")}
          />

          {/* Date Picker */}
          <Input
            type="date"
            label="Select Date"
            id="date-picker"
            value={selectedDateFromPicker ?? ""}
            onChange={(e) =>
              setSelectedDateFromPicker(
                (e as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />

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
        <Card
          variant="raised"
          style={{
            padding: "var(--drp-space-4)",
            marginBottom: "var(--drp-space-6)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--drp-text-md)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-2)",
            }}
          >
            Status Color Guide:
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--drp-space-4) var(--drp-space-3)",
            }}
          >
            {statusOptions.map((option) => (
              <div
                key={option.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "var(--drp-text-sm)",
                }}
              >
                <span
                  className={`w-3 h-3 border-2 ${getStatusColorClasses(
                    option.value as PostStatus,
                  )
                    .split(" ")[0]
                    .replace(
                      "bg-",
                      "border-",
                    )} ${getStatusColorClasses(option.value as PostStatus).split(" ")[0]}`}
                  style={{
                    marginRight: "var(--drp-space-2)",
                    display: "inline-block",
                  }}
                ></span>
                {option.label}
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              <span
                style={{
                  width: "0.75rem",
                  height: "0.75rem",
                  border: "2px solid var(--drp-border)",
                  background: "var(--drp-purple-light, #ede9fe)",
                  marginRight: "var(--drp-space-2)",
                  display: "inline-block",
                }}
              ></span>
              Today&apos;s Date
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              <span
                style={{
                  width: "0.75rem",
                  height: "0.75rem",
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
