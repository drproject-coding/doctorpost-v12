"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Icon,
  Loader,
  Input,
  Textarea,
  Select,
} from "@doctorproject/react";
import type { ScheduledPost } from "@/lib/types";

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost | null;
  onSave: (post: ScheduledPost) => void | Promise<void>;
  isSaving?: boolean;
}

export function PostEditorModal({
  isOpen,
  onClose,
  post,
  onSave,
  isSaving = false,
}: PostEditorModalProps) {
  const [editedPost, setEditedPost] = useState<ScheduledPost | null>(post);

  useEffect(() => {
    if (isOpen && post) {
      setEditedPost(post);
    }
  }, [isOpen, post]);

  if (!isOpen || !editedPost) return null;

  const handleFieldChange = <K extends keyof ScheduledPost>(
    field: K,
    value: ScheduledPost[K],
  ) => {
    setEditedPost((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (editedPost) {
      await onSave(editedPost);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "var(--drp-space-4)",
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--drp-shadow-lg)",
          border: "var(--drp-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              fontWeight: 700,
              margin: 0,
            }}
          >
            Edit Post: {editedPost.title}
          </h2>
          <button
            className="bru-modal__close"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Title Field */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Title
          </label>
          <Input
            type="text"
            value={editedPost.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
          />
        </div>

        {/* Content Field */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Post Content
          </label>
          <Textarea
            value={editedPost.content}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            style={{ minHeight: 150 }}
          />
          <div
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-text-muted)",
              marginTop: "var(--drp-space-1)",
            }}
          >
            {editedPost.content?.length ?? 0} characters
          </div>
        </div>

        {/* Status Field */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Status
          </label>
          <Select
            value={editedPost.status}
            onChange={(e) =>
              handleFieldChange(
                "status",
                (e as React.ChangeEvent<HTMLSelectElement>).target
                  .value as ScheduledPost["status"],
              )
            }
            options={[
              { value: "draft", label: "Draft" },
              { value: "to-review", label: "To Review" },
              { value: "to-plan", label: "To Plan" },
              { value: "to-publish", label: "To Publish" },
              { value: "scheduled", label: "Scheduled" },
              { value: "published", label: "Published" },
            ]}
          />
        </div>

        {/* Publish Date */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <Icon name="calendar" size="sm" /> Publish Date
          </label>
          <Input
            type="date"
            value={
              editedPost.scheduledAt ? editedPost.scheduledAt.slice(0, 10) : ""
            }
            onChange={(e) => handleFieldChange("scheduledAt", e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-2)",
            }}
          >
            {isSaving ? (
              <>
                <Loader size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="download" size="sm" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PostEditorModal;
