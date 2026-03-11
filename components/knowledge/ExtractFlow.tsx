"use client";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Loader,
  Textarea,
} from "@doctorproject/react";
import { ArrowLeft, Check, Scissors } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { DocumentCategory } from "@/lib/knowledge/types";

interface ExtractedTemplate {
  name: string;
  structure: string;
  hookPattern: string;
  closerPattern: string;
  estimatedLength: number;
  toneNotes: string;
  exampleHooks: string[];
}

interface ExtractFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type ExtractStep = "paste" | "extracting" | "preview" | "saving";

export function ExtractFlow({ onComplete, onCancel }: ExtractFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<ExtractStep>("paste");
  const [postContent, setPostContent] = useState("");
  const [template, setTemplate] = useState<ExtractedTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!postContent.trim()) return;
    setStep("extracting");
    setFeedback(null);

    try {
      // API key is resolved server-side from the user's brand profile
      const res = await fetch("/api/knowledge/extract", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Extraction failed");
      }

      const data: ExtractedTemplate = await res.json();
      setTemplate(data);
      setTemplateName(data.name);
      setStep("preview");
    } catch (err) {
      setFeedback(`Error: ${String(err)}`);
      setStep("paste");
    }
  };

  const handleSave = async () => {
    if (!template) return;
    setStep("saving");

    try {
      // Build markdown content from template
      const content = `# ${templateName}

## Structure
${template.structure}

## Hook Pattern
${template.hookPattern}

## Closer Pattern
${template.closerPattern}

## Estimated Length
~${template.estimatedLength} characters

## Tone Notes
${template.toneNotes}

## Example Hooks
${template.exampleHooks.map((h) => `- ${h}`).join("\n")}
`;

      const res = await fetch("/api/knowledge/create/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "templates",
          subcategory: "templates",
          name: templateName,
          content,
          version: 1,
          is_active: true,
          source: "import",
          updated_by: user?.name || "user",
        }),
      });

      if (!res.ok) throw new Error("Failed to save template");
      setFeedback("Template saved!");
      setTimeout(onComplete, 1500);
    } catch (err) {
      setFeedback(`Error: ${String(err)}`);
      setStep("preview");
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
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={16} />
        </Button>
        <h2
          style={{
            fontSize: "var(--drp-text-h4)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Extract Template
        </h2>
      </div>

      {step === "paste" && (
        <Card variant="raised">
          <h3
            style={{
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-4)",
            }}
          >
            Paste an admired LinkedIn post
          </h3>
          <p
            style={{
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-grey)",
              marginBottom: "var(--drp-space-4)",
            }}
          >
            AI will deconstruct the post into a reusable template with hook
            patterns, structure, and closer patterns.
          </p>
          <Textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Paste the full LinkedIn post here..."
            style={{ minHeight: 250, fontFamily: "monospace" }}
          />
          <div
            className="drp-form-actions"
            style={{ marginTop: "var(--drp-space-4)" }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleExtract}
              disabled={!postContent.trim()}
            >
              <Scissors size={14} />
              Extract Template
            </Button>
          </div>
          {feedback && (
            <div style={{ marginTop: "var(--drp-space-3)" }}>
              <Alert variant="error" onClose={() => setFeedback(null)}>
                {feedback}
              </Alert>
            </div>
          )}
        </Card>
      )}

      {step === "extracting" && (
        <Card
          variant="raised"
          style={{
            textAlign: "center",
            padding: "var(--drp-space-8)",
          }}
        >
          <div
            style={{
              margin: "0 auto var(--drp-space-4)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Loader size="lg" />
          </div>
          <h3 style={{ fontSize: "var(--drp-text-h5)", fontWeight: 700 }}>
            Analyzing post structure...
          </h3>
          <p
            style={{ color: "var(--drp-grey)", fontSize: "var(--drp-text-md)" }}
          >
            AI is deconstructing the post into a reusable template
          </p>
        </Card>
      )}

      {step === "preview" && template && (
        <Card variant="raised">
          <h3
            style={{
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-4)",
            }}
          >
            Template Preview
          </h3>

          <div className="drp-form-stack">
            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />

            <div className="drp-form-row">
              <div>
                <label
                  className="drp-field__label"
                  style={{
                    marginBottom: "var(--drp-space-2)",
                    display: "block",
                  }}
                >
                  Hook Pattern
                </label>
                <div
                  style={{
                    padding: "var(--drp-space-3)",
                    background: "var(--drp-cream)",
                    border: "var(--drp-border)",
                    fontSize: "var(--drp-text-sm)",
                  }}
                >
                  {template.hookPattern}
                </div>
              </div>
              <div>
                <label
                  className="drp-field__label"
                  style={{
                    marginBottom: "var(--drp-space-2)",
                    display: "block",
                  }}
                >
                  Closer Pattern
                </label>
                <div
                  style={{
                    padding: "var(--drp-space-3)",
                    background: "var(--drp-cream)",
                    border: "var(--drp-border)",
                    fontSize: "var(--drp-text-sm)",
                  }}
                >
                  {template.closerPattern}
                </div>
              </div>
            </div>

            <div>
              <label
                className="drp-field__label"
                style={{ marginBottom: "var(--drp-space-2)", display: "block" }}
              >
                Structure
              </label>
              <pre
                style={{
                  fontSize: "var(--drp-text-xs)",
                  background: "var(--drp-cream)",
                  padding: "var(--drp-space-3)",
                  border: "var(--drp-border)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {template.structure}
              </pre>
            </div>

            <div>
              <label
                className="drp-field__label"
                style={{ marginBottom: "var(--drp-space-2)", display: "block" }}
              >
                Example Hooks
              </label>
              <ul
                style={{
                  padding: "var(--drp-space-3)",
                  background: "var(--drp-cream)",
                  border: "var(--drp-border)",
                  fontSize: "var(--drp-text-sm)",
                  listStyle: "disc",
                  paddingLeft: "var(--drp-space-6)",
                }}
              >
                {template.exampleHooks.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: "var(--drp-space-3)",
                background: "var(--drp-cream)",
                border: "var(--drp-border)",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              <strong>Tone:</strong> {template.toneNotes}
              <br />
              <strong>Length:</strong> ~{template.estimatedLength} chars
            </div>
          </div>

          <div
            className="drp-form-actions"
            style={{ marginTop: "var(--drp-space-4)" }}
          >
            <Button onClick={() => setStep("paste")}>Back</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!templateName.trim()}
            >
              <Check size={14} />
              Save Template
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

      {step === "saving" && (
        <Card
          variant="raised"
          style={{
            textAlign: "center",
            padding: "var(--drp-space-8)",
          }}
        >
          <div
            style={{
              margin: "0 auto var(--drp-space-4)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Loader size="lg" />
          </div>
          <h3 style={{ fontSize: "var(--drp-text-h5)", fontWeight: 700 }}>
            Saving template...
          </h3>
        </Card>
      )}
    </div>
  );
}
