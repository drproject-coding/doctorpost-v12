"use client";
import React, { useState, useEffect } from "react";
import { Button, Alert } from "@bruddle/react";
import { ScheduledPost, PostStatus, DropdownOption } from "@/lib/types";
import { X, Save, Loader, Calendar } from "lucide-react";

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost | null;
  onSave: (updatedPost: ScheduledPost) => Promise<void>;
}

const statusOptions: DropdownOption[] = [
  {
    id: "draft",
    value: "draft",
    label: "Draft",
    category: "Status",
    description: "Post is a work in progress.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-review",
    value: "to-review",
    label: "To Review",
    category: "Status",
    description: "Post is ready for review.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-plan",
    value: "to-plan",
    label: "To Plan",
    category: "Status",
    description: "Post is ready for planning.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-publish",
    value: "to-publish",
    label: "To Publish",
    category: "Status",
    description: "Post is ready to be published.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "scheduled",
    value: "scheduled",
    label: "Scheduled",
    category: "Status",
    description: "Post is scheduled for a future date.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "published",
    value: "published",
    label: "Published",
    category: "Status",
    description: "Post has been published.",
    exampleSnippet: "",
    useCases: [],
  },
];

const DATED_STATUSES = new Set([
  "to-plan",
  "to-publish",
  "scheduled",
  "published",
]);

/** Convert ISO string to YYYY-MM-DD for <input type="date"> */
function toDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Convert YYYY-MM-DD back to ISO midnight UTC */
function fromDateInputValue(val: string): string {
  if (!val) return "";
  return new Date(val + "T00:00:00").toISOString();
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PostEditorModal: React.FC<PostEditorModalProps> = ({
  isOpen,
  onClose,
  post,
  onSave,
}) => {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedStatus, setEditedStatus] = useState<PostStatus>("draft");
  const [editedDate, setEditedDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && post) {
      setEditedTitle(post.title);
      setEditedContent(post.content);
      setEditedStatus(post.status);
      setEditedDate(toDateInputValue(post.scheduledAt));
      setSaveError(null);
      setSaveSuccess(null);
    }
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const showDatePicker = DATED_STATUSES.has(editedStatus);
  const dateLabel =
    editedStatus === "published" ? "Published Date" : "Planned Date";

  const handleSave = async () => {
    if (!post) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const updatedPost: ScheduledPost = {
      ...post,
      title: editedTitle,
      content: editedContent,
      status: editedStatus,
      scheduledAt:
        showDatePicker && editedDate
          ? fromDateInputValue(editedDate)
          : post.scheduledAt,
    };

    try {
      await onSave(updatedPost);
      setSaveSuccess("Post saved successfully!");
      setTimeout(() => {
        setSaveSuccess(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to save post:", error);
      setSaveError("Failed to save post. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bru-overlay">
      <div className="bru-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bru-modal__header">
          <h2 className="bru-modal__title">Edit Post: {post.title}</h2>
          <button onClick={onClose} className="bru-modal__close">
            <X size={20} />
          </button>
        </div>

        <div className="bru-modal__body">
          {saveError && (
            <Alert
              variant="error"
              style={{ marginBottom: "var(--bru-space-4)" }}
            >
              {saveError}
            </Alert>
          )}
          {saveSuccess && (
            <Alert
              variant="success"
              style={{ marginBottom: "var(--bru-space-4)" }}
            >
              {saveSuccess}
            </Alert>
          )}

          {/* Read-only metadata */}
          {(post.createdAt ?? post.updatedAt) && (
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 11,
                color: "#888",
                marginBottom: 16,
                padding: "6px 10px",
                background: "#f8f8f8",
                border: "1px solid #e0e0e0",
              }}
            >
              {post.createdAt && (
                <span>Created {formatDateTime(post.createdAt)}</span>
              )}
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span>Updated {formatDateTime(post.updatedAt)}</span>
              )}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-2">
            <label htmlFor="edit-title" className="bru-field__label block">
              Title
            </label>
            <input
              type="text"
              id="edit-title"
              className="bru-input w-full"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <label htmlFor="edit-content" className="bru-field__label block">
              Content
            </label>
            <textarea
              id="edit-content"
              className="bru-input w-full h-48 resize-y"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isSaving}
            ></textarea>
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <label htmlFor="edit-status" className="bru-field__label block">
              Status
            </label>
            <select
              id="edit-status"
              className="bru-input w-full"
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value as PostStatus)}
              disabled={isSaving}
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showDatePicker && (
            <div className="mb-4 flex flex-col gap-2">
              <label
                htmlFor="edit-date"
                className="bru-field__label block"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Calendar size={14} />
                {dateLabel}
              </label>
              <input
                type="date"
                id="edit-date"
                className="bru-input w-full"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                disabled={isSaving}
              />
            </div>
          )}
        </div>

        <div className="bru-modal__footer">
          <Button onClick={onClose} variant="secondary" disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSave()}
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center">
                <Loader size={16} className="animate-spin mr-2" /> Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={16} className="mr-2" /> Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostEditorModal;
