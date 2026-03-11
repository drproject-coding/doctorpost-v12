"use client";
import React, { useState } from "react";
import { Button, Card, Input, Textarea } from "@doctorproject/react";
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
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--drp-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-4)",
        }}
      >
        Review & Approve
      </h3>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "var(--drp-space-2)",
          marginBottom: "var(--drp-space-4)",
          flexWrap: "wrap",
        }}
      >
        <Button variant="primary" onClick={handleApprove}>
          <ThumbsUp size={14} />
          Approve
        </Button>
        <Button
          onClick={() => setAction(action === "editing" ? "idle" : "editing")}
          style={{
            border:
              action === "editing" ? "2px solid var(--drp-purple)" : undefined,
          }}
        >
          <Edit3 size={14} />
          Edit Before Approve
        </Button>
        <Button
          onClick={() => setAction(action === "feedback" ? "idle" : "feedback")}
          style={{
            border:
              action === "feedback" ? "2px solid var(--drp-purple)" : undefined,
          }}
        >
          <MessageSquare size={14} />
          Add Feedback
        </Button>
        <Button onClick={handleReject} style={{ marginLeft: "auto" }}>
          <ThumbsDown size={14} />
          Reject
        </Button>
      </div>

      {/* Edit mode */}
      {action === "editing" && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <Textarea
            label="Edit Post"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ minHeight: 300, fontFamily: "monospace" }}
          />
          <div
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
              marginTop: "var(--drp-space-1)",
            }}
          >
            {editedContent.length} characters
            {editedContent !== content && " (modified)"}
          </div>
        </div>
      )}

      {/* Feedback mode */}
      {action === "feedback" && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <div
            style={{
              display: "flex",
              gap: "var(--drp-space-2)",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1 }}>
              <Input
                label="Feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Type feedback and press Add..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") addFeedback();
                }}
              />
            </div>
            <Button onClick={addFeedback}>Add</Button>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {feedbackList.length > 0 && (
        <div style={{ marginBottom: "var(--drp-space-3)" }}>
          <h4
            style={{
              fontSize: "var(--drp-text-sm)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-1)",
            }}
          >
            Feedback ({feedbackList.length})
          </h4>
          <div style={{ display: "grid", gap: "var(--drp-space-1)" }}>
            {feedbackList.map((fb, i) => (
              <div
                key={i}
                style={{
                  padding: "var(--drp-space-1) var(--drp-space-2)",
                  background: "var(--drp-cream)",
                  border: "var(--drp-border)",
                  fontSize: "var(--drp-text-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{fb}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setFeedbackList((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
