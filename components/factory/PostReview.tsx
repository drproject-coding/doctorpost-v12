"use client";
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Edit3, MessageSquare } from "lucide-react";

interface PostReviewProps {
  content: string;
  onApprove: (finalVersion: string, feedback: string[]) => void;
  onReject: (feedback: string[]) => void;
}

type ReviewAction = "idle" | "editing" | "feedback";

export function PostReview({ content, onApprove, onReject }: PostReviewProps) {
  const [action, setAction] = useState<ReviewAction>("idle");
  const [editedContent, setEditedContent] = useState(content);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState<string[]>([]);

  const addFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackList((prev) => [...prev, feedbackText.trim()]);
    setFeedbackText("");
  };

  const handleApprove = () => {
    onApprove(editedContent, feedbackList);
  };

  const handleReject = () => {
    onReject(feedbackList);
  };

  return (
    <div className="bru-card bru-card--raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Review & Approve
      </h3>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "var(--bru-space-2)",
          marginBottom: "var(--bru-space-4)",
          flexWrap: "wrap",
        }}
      >
        <button className="bru-btn bru-btn--primary" onClick={handleApprove}>
          <ThumbsUp size={14} />
          Approve
        </button>
        <button
          className="bru-btn"
          onClick={() => setAction(action === "editing" ? "idle" : "editing")}
          style={{
            border:
              action === "editing" ? "2px solid var(--bru-purple)" : undefined,
          }}
        >
          <Edit3 size={14} />
          Edit Before Approve
        </button>
        <button
          className="bru-btn"
          onClick={() => setAction(action === "feedback" ? "idle" : "feedback")}
          style={{
            border:
              action === "feedback" ? "2px solid var(--bru-purple)" : undefined,
          }}
        >
          <MessageSquare size={14} />
          Add Feedback
        </button>
        <button
          className="bru-btn"
          onClick={handleReject}
          style={{ marginLeft: "auto" }}
        >
          <ThumbsDown size={14} />
          Reject
        </button>
      </div>

      {/* Edit mode */}
      {action === "editing" && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <label
            className="bru-field__label"
            style={{
              marginBottom: "var(--bru-space-2)",
              display: "block",
            }}
          >
            Edit Post
          </label>
          <textarea
            className="bru-input"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ minHeight: 300, fontFamily: "monospace" }}
          />
          <div
            style={{
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
              marginTop: "var(--bru-space-1)",
            }}
          >
            {editedContent.length} characters
            {editedContent !== content && " (modified)"}
          </div>
        </div>
      )}

      {/* Feedback mode */}
      {action === "feedback" && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <label
            className="bru-field__label"
            style={{
              marginBottom: "var(--bru-space-2)",
              display: "block",
            }}
          >
            Feedback
          </label>
          <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
            <input
              className="bru-input"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type feedback and press Add..."
              onKeyDown={(e) => {
                if (e.key === "Enter") addFeedback();
              }}
              style={{ flex: 1 }}
            />
            <button className="bru-btn" onClick={addFeedback}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {feedbackList.length > 0 && (
        <div style={{ marginBottom: "var(--bru-space-3)" }}>
          <h4
            style={{
              fontSize: "var(--bru-text-sm)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-1)",
            }}
          >
            Feedback ({feedbackList.length})
          </h4>
          <div style={{ display: "grid", gap: "var(--bru-space-1)" }}>
            {feedbackList.map((fb, i) => (
              <div
                key={i}
                style={{
                  padding: "var(--bru-space-1) var(--bru-space-2)",
                  background: "var(--bru-cream)",
                  border: "var(--bru-border)",
                  fontSize: "var(--bru-text-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{fb}</span>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                  }}
                  onClick={() =>
                    setFeedbackList((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
