"use client";
import React, { useState, useCallback } from "react";
import { Alert, Badge, Button, Card, Input, Textarea } from "@bruddle/react";
import { Save, X, History, Lock, GitFork } from "lucide-react";

interface DocumentEditorProps {
  documentId: string;
  name: string;
  category: string;
  content: string;
  version: number;
  onSave: (content: string, reason: string) => Promise<void>;
  onClose: () => void;
  onShowHistory: () => void;
  readOnly?: boolean;
  onFork?: () => void;
}

export function DocumentEditor({
  documentId,
  name,
  category,
  content: initialContent,
  version,
  onSave,
  onClose,
  onShowHistory,
  readOnly,
  onFork,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasChanges = content !== initialContent;

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(content, reason || "Manual edit");
      setFeedback("Saved successfully");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [content, reason, hasChanges, onSave]);

  return (
    <Card variant="raised" style={{ height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {name}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--bru-space-2)",
              fontSize: "var(--bru-text-sm)",
              color: "var(--bru-grey)",
            }}
          >
            <span>
              {category} &middot; v{version}
            </span>
            {readOnly && (
              <Badge variant="primary">
                <Lock size={9} style={{ marginRight: 3 }} /> System
              </Badge>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
          {readOnly && onFork && (
            <Button variant="primary" onClick={onFork}>
              <GitFork size={14} />
              Fork & Customise
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="ghost"
              onClick={onShowHistory}
              title="Version history"
            >
              <History size={16} />
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        readOnly={readOnly}
        style={{
          width: "100%",
          minHeight: 400,
          fontFamily: "monospace",
          fontSize: "var(--bru-text-sm)",
          resize: "vertical",
          ...(readOnly
            ? {
                background: "var(--bru-bg-subtle, #f5f5f5)",
                cursor: "default",
                opacity: 0.85,
              }
            : {}),
        }}
      />

      {/* Save bar (hidden in read-only mode) */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-3)",
            marginTop: "var(--bru-space-4)",
          }}
        >
          <Input
            placeholder="Change reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{ marginTop: "var(--bru-space-3)" }}>
          <Alert
            variant={feedback.startsWith("Error") ? "error" : "success"}
            onClose={() => setFeedback(null)}
          >
            {feedback}
          </Alert>
        </div>
      )}
    </Card>
  );
}
