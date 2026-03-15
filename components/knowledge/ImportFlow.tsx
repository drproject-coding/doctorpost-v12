"use client";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";
import type { DocumentCategory } from "@/lib/knowledge/types";

interface ImportFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type ImportStep = "input" | "classify" | "confirm";

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "rules", label: "Rules" },
  { value: "references", label: "References" },
  { value: "library", label: "Library" },
  { value: "templates", label: "Templates" },
  { value: "learned", label: "Learned" },
];

export function ImportFlow({ onComplete, onCancel }: ImportFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<ImportStep>("input");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("rules");
  const [subcategory, setSubcategory] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    // Auto-detect name from filename
    setName(file.name.replace(/\.md$/, "").replace(/[_-]/g, " "));

    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleClassify = async () => {
    if (!text.trim()) return;

    // Auto-classify via API
    try {
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) setCategory(data.category);
        if (data.subcategory) setSubcategory(data.subcategory);
        if (data.name && !name) setName(data.name);
      }
    } catch {
      // Auto-classify failed, user will manually classify
    }
    setStep("classify");
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/knowledge/create/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subcategory: subcategory || category,
          name: name || "Imported document",
          content: text,
          version: 1,
          is_active: true,
          source: "import",
          updated_by: user?.name || "user",
        }),
      });
      if (!res.ok) throw new Error("Failed to save document");
      setFeedback("Document imported successfully!");
      setTimeout(onComplete, 1500);
    } catch (err) {
      setFeedback(`Error: ${String(err)}`);
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--drp-space-3)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <Button variant="ghost" iconLeft="‹" onClick={onCancel} />
        <h2
          style={{
            fontSize: "var(--drp-text-h4)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Import Knowledge
        </h2>
      </div>

      {step === "input" && (
        <Card variant="raised">
          <h3
            style={{
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-4)",
            }}
          >
            Paste text or upload a file
          </h3>

          {/* File upload */}
          <div
            className="drp-field"
            style={{ marginBottom: "var(--drp-space-4)" }}
          >
            <label className="drp-field__label">Upload .md file</label>
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="drp-input"
              style={{ padding: "var(--drp-space-2)" }}
            />
            {fileName && (
              <span
                style={{
                  fontSize: "var(--drp-text-sm)",
                  color: "var(--drp-grey)",
                  marginTop: "var(--drp-space-1)",
                }}
              >
                Selected: {fileName}
              </span>
            )}
          </div>

          {/* Text paste */}
          <Textarea
            label="Or paste content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste markdown content here..."
            style={{ minHeight: 200, fontFamily: "monospace" }}
          />

          <div
            className="drp-form-actions"
            style={{ marginTop: "var(--drp-space-4)" }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleClassify}
              disabled={!text.trim()}
            >
              Next: Classify
            </Button>
          </div>
        </Card>
      )}

      {step === "classify" && (
        <Card variant="raised">
          <h3
            style={{
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-4)",
            }}
          >
            Classify &amp; Name
          </h3>

          <div className="drp-form-stack">
            <Input
              label="Document Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. brand-voice"
            />

            <div className="drp-form-row">
              <Select
                label="Category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DocumentCategory)
                }
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. hooks, closers"
              />
            </div>

            {/* Preview */}
            <div className="drp-field">
              <label className="drp-field__label">Content Preview</label>
              <pre
                style={{
                  fontSize: "var(--drp-text-xs)",
                  background: "var(--drp-cream)",
                  padding: "var(--drp-space-3)",
                  border: "var(--drp-border)",
                  maxHeight: 200,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {text.slice(0, 1000)}
                {text.length > 1000 ? "\n..." : ""}
              </pre>
            </div>
          </div>

          <div
            className="drp-form-actions"
            style={{ marginTop: "var(--drp-space-4)" }}
          >
            <Button onClick={() => setStep("input")}>Back</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? "Saving..." : "✓ Import Document"}
            </Button>
          </div>

          {feedback && (
            <div style={{ marginTop: "var(--drp-space-3)" }}>
              <Alert
                variant={feedback.startsWith("Error") ? "error" : "success"}
                onClose={() => setFeedback(null)}
              >
                {feedback}
              </Alert>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
