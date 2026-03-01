"use client";
import React, { useState } from "react";
import { Upload, FileText, Check, ArrowLeft, Loader } from "lucide-react";
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
          gap: "var(--bru-space-3)",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <button className="bru-btn bru-btn--ghost" onClick={onCancel}>
          <ArrowLeft size={16} />
        </button>
        <h2
          style={{
            fontSize: "var(--bru-text-h4)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Import Knowledge
        </h2>
      </div>

      {step === "input" && (
        <div className="bru-card bru-card--raised">
          <h3
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-4)",
            }}
          >
            Paste text or upload a file
          </h3>

          {/* File upload */}
          <div
            className="bru-field"
            style={{ marginBottom: "var(--bru-space-4)" }}
          >
            <label className="bru-field__label">Upload .md file</label>
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="bru-input"
              style={{ padding: "var(--bru-space-2)" }}
            />
            {fileName && (
              <span
                style={{
                  fontSize: "var(--bru-text-sm)",
                  color: "var(--bru-grey)",
                  marginTop: "var(--bru-space-1)",
                }}
              >
                Selected: {fileName}
              </span>
            )}
          </div>

          {/* Text paste */}
          <div className="bru-field">
            <label className="bru-field__label">Or paste content</label>
            <textarea
              className="bru-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste markdown content here..."
              style={{ minHeight: 200, fontFamily: "monospace" }}
            />
          </div>

          <div
            className="bru-form-actions"
            style={{ marginTop: "var(--bru-space-4)" }}
          >
            <button className="bru-btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="bru-btn bru-btn--primary"
              onClick={handleClassify}
              disabled={!text.trim()}
            >
              Next: Classify
            </button>
          </div>
        </div>
      )}

      {step === "classify" && (
        <div className="bru-card bru-card--raised">
          <h3
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-4)",
            }}
          >
            Classify & Name
          </h3>

          <div className="bru-form-stack">
            <div className="bru-field">
              <label className="bru-field__label">Document Name</label>
              <input
                className="bru-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. brand-voice"
              />
            </div>

            <div className="bru-form-row">
              <div className="bru-field">
                <label className="bru-field__label">Category</label>
                <select
                  className="bru-select"
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
                </select>
              </div>
              <div className="bru-field">
                <label className="bru-field__label">Subcategory</label>
                <input
                  className="bru-input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. hooks, closers"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bru-field">
              <label className="bru-field__label">Content Preview</label>
              <pre
                style={{
                  fontSize: "var(--bru-text-xs)",
                  background: "var(--bru-cream)",
                  padding: "var(--bru-space-3)",
                  border: "var(--bru-border)",
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
            className="bru-form-actions"
            style={{ marginTop: "var(--bru-space-4)" }}
          >
            <button className="bru-btn" onClick={() => setStep("input")}>
              Back
            </button>
            <button
              className="bru-btn bru-btn--primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={14} /> Import Document
                </>
              )}
            </button>
          </div>

          {feedback && (
            <div
              style={{
                marginTop: "var(--bru-space-3)",
                padding: "var(--bru-space-3)",
                border: "var(--bru-border)",
                fontSize: "var(--bru-text-md)",
                fontWeight: 500,
                background: feedback.startsWith("Error")
                  ? "rgba(255, 68, 68, 0.12)"
                  : "rgba(0, 170, 0, 0.12)",
                color: feedback.startsWith("Error")
                  ? "var(--bru-error-dark)"
                  : "var(--bru-success-dark)",
              }}
            >
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
