"use client";
import React, { useState } from "react";
import { Button, Icon } from "@doctorproject/react";
import type { FormattedPost } from "@/lib/knowledge/types";

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPost: FormattedPost;
  onSave: (post: FormattedPost) => void;
  isSaving?: boolean;
}

export function PostEditorModal({
  isOpen,
  onClose,
  initialPost,
  onSave,
  isSaving = false,
}: PostEditorModalProps) {
  const [post, setPost] = useState<FormattedPost>(initialPost);
  const [editingField, setEditingField] = useState<keyof FormattedPost | null>(
    null,
  );

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof FormattedPost, value: unknown) => {
    setPost((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(post);
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
          borderRadius: 8,
          padding: "var(--drp-space-4)",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
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
            Edit Post
          </h2>
          <button
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
            <Icon name="x" size={20} />
          </button>
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
          <textarea
            value={post.content}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            style={{
              width: "100%",
              minHeight: 150,
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              fontFamily: "inherit",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: "var(--drp-text-xs)", color: "var(--drp-grey)", marginTop: "var(--drp-space-1)" }}>
            {post.content?.length || 0} characters
          </div>
        </div>

        {/* Suggested Pinned Comment */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Suggested Pinned Comment
          </label>
          <textarea
            value={post.suggestedPinnedComment || ""}
            onChange={(e) =>
              handleFieldChange("suggestedPinnedComment", e.target.value)
            }
            style={{
              width: "100%",
              minHeight: 80,
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              fontFamily: "inherit",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Hook Position Override */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Hook Position
          </label>
          <div
            style={{
              display: "flex",
              gap: "var(--drp-space-2)",
              alignItems: "center",
            }}
          >
            <div>
              <label style={{ marginRight: "var(--drp-space-2)" }}>
                <input
                  type="checkbox"
                  checked={post.hookBeforeFold?.mobile ?? false}
                  onChange={(e) =>
                    handleFieldChange("hookBeforeFold", {
                      ...post.hookBeforeFold,
                      mobile: e.target.checked,
                    })
                  }
                  style={{ marginRight: 4 }}
                />
                Mobile
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={post.hookBeforeFold?.desktop ?? false}
                  onChange={(e) =>
                    handleFieldChange("hookBeforeFold", {
                      ...post.hookBeforeFold,
                      desktop: e.target.checked,
                    })
                  }
                  style={{ marginRight: 4 }}
                />
                Desktop
              </label>
            </div>
          </div>
        </div>

        {/* Metadata Fields */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Template
          </label>
          <input
            type="text"
            value={post.metadata?.template || ""}
            onChange={(e) =>
              handleFieldChange("metadata", {
                ...post.metadata,
                template: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Pillar
          </label>
          <input
            type="text"
            value={post.metadata?.pillar || ""}
            onChange={(e) =>
              handleFieldChange("metadata", {
                ...post.metadata,
                pillar: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Score
          </label>
          <input
            type="number"
            value={post.metadata?.score || 0}
            onChange={(e) =>
              handleFieldChange("metadata", {
                ...post.metadata,
                score: Number(e.target.value),
              })
            }
            style={{
              width: "100%",
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Date Picker */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <Icon name="calendar" size={14} />
            {" "}Publish Date
          </label>
          <input
            type="date"
            style={{
              width: "100%",
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              border: "var(--drp-border)",
              boxSizing: "border-box",
            }}
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
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-2)",
            }}
          >
            {isSaving ? (
              <>
                <Icon name="loader" size={16} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="save" size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
