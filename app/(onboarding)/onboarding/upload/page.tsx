"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Loader } from "@doctorproject/react";

type FileStatus = "pending" | "uploading" | "ready" | "error";

interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  extractedText?: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isAcceptedFile(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return (
    ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
  );
}

interface StatusBadgeProps {
  status: FileStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<
    FileStatus,
    { background: string; color: string; label: string }
  > = {
    pending: {
      background: "var(--drp-purple)",
      color: "white",
      label: "Pending",
    },
    uploading: { background: "#2563eb", color: "white", label: "Processing" },
    ready: { background: "#16a34a", color: "white", label: "Ready" },
    error: { background: "#dc2626", color: "white", label: "Error" },
  };

  const s = styles[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        fontSize: "var(--drp-text-xs, 11px)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: s.background,
        color: s.color,
        lineHeight: 1.5,
        flexShrink: 0,
      }}
    >
      {status === "uploading" && <span>⟳</span>}
      {status === "ready" && <span>✓</span>}
      {status === "error" && <span>⚠</span>}
      {s.label}
    </span>
  );
}

export default function OnboardingUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) return;

      const toAdd: UploadedFile[] = list
        .slice(0, remaining)
        .filter((f) => {
          if (!isAcceptedFile(f)) return false;
          if (f.size > MAX_FILE_SIZE) return false;
          if (
            files.some(
              (existing) =>
                existing.file.name === f.name && existing.file.size === f.size,
            )
          )
            return false;
          return true;
        })
        .map((f) => ({
          id: generateId(),
          file: f,
          status: "pending" as FileStatus,
        }));

      if (toAdd.length > 0) {
        setFiles((prev) => [...prev, ...toAdd]);
      }
    },
    [files],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the drop zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleContinue = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    // Mark all pending files as uploading, then ready after a short delay
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending"
          ? { ...f, status: "uploading" as FileStatus }
          : f,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "uploading" ? { ...f, status: "ready" as FileStatus } : f,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    router.push("/onboarding/review");
  }, [files, router]);

  const allReady = files.length > 0 && files.every((f) => f.status === "ready");
  const canContinue = files.length > 0 && !isProcessing;

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--drp-cream)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--drp-space-8, 32px) var(--drp-space-4, 16px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          {/* Header */}
          <div
            style={{
              marginBottom: "var(--drp-space-8, 32px)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "var(--drp-text-xs, 11px)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--drp-purple)",
                marginBottom: "var(--drp-space-2, 8px)",
              }}
            >
              Step 1 of 3 — Brand Setup
            </p>
            <h1
              style={{
                fontSize: "var(--drp-text-h2, 28px)",
                fontWeight: 800,
                color: "var(--drp-black)",
                margin: "0 0 var(--drp-space-3, 12px)",
                lineHeight: 1.15,
              }}
            >
              Upload your brand documents
            </h1>
            <p
              style={{
                fontSize: "var(--drp-text-base, 15px)",
                color: "var(--drp-grey)",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Drop in brand guidelines, style guides, or any documents that
              describe your voice. We'll extract what matters.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload files — click or drag and drop"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            style={{
              border: `2px dashed ${isDragging ? "var(--drp-purple)" : "var(--drp-grey, #999)"}`,
              background: isDragging
                ? "rgba(var(--drp-purple-rgb, 100, 50, 200), 0.04)"
                : "white",
              padding: "var(--drp-space-10, 40px) var(--drp-space-6, 24px)",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s ease, background 0.15s ease",
              marginBottom: "var(--drp-space-4, 16px)",
              userSelect: "none",
            }}
          >
            <span
              style={{
                fontSize: 32,
                color: isDragging
                  ? "var(--drp-purple)"
                  : "var(--drp-grey, #999)",
                marginBottom: "var(--drp-space-3, 12px)",
                transition: "color 0.15s ease",
                display: "block",
              }}
            >
              ⬆
            </span>
            <p
              style={{
                fontSize: "var(--drp-text-base, 15px)",
                fontWeight: 700,
                color: "var(--drp-black)",
                margin: "0 0 var(--drp-space-1, 4px)",
              }}
            >
              Drop files here or click to browse
            </p>
            <p
              style={{
                fontSize: "var(--drp-text-sm, 13px)",
                color: "var(--drp-grey)",
                margin: 0,
              }}
            >
              PDF, DOCX, TXT, MD — max 10 MB each — up to {MAX_FILES} files
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {/* File list */}
          {files.length > 0 && (
            <Card
              variant="flat"
              style={{
                marginBottom: "var(--drp-space-6, 24px)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "grid", gap: 0 }}>
                {files.map((uf, idx) => (
                  <div
                    key={uf.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--drp-space-3, 12px)",
                      padding:
                        "var(--drp-space-3, 12px) var(--drp-space-4, 16px)",
                      borderTop:
                        idx === 0
                          ? "none"
                          : "1px solid var(--drp-border-color, #e5e5e5)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--drp-grey)",
                        flexShrink: 0,
                        fontSize: 16,
                      }}
                    >
                      ▣
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "var(--drp-text-sm, 13px)",
                          fontWeight: 600,
                          color: "var(--drp-black)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {uf.file.name}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--drp-text-xs, 11px)",
                          color: "var(--drp-grey)",
                          margin: 0,
                        }}
                      >
                        {formatBytes(uf.file.size)}
                      </p>
                    </div>
                    <StatusBadge status={uf.status} />
                    {uf.status !== "uploading" && (
                      <Button
                        variant="ghost"
                        icon
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          removeFile(uf.id);
                        }}
                        aria-label={`Remove ${uf.file.name}`}
                        style={{
                          color: "var(--drp-grey)",
                          flexShrink: 0,
                          padding: 4,
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--drp-space-4, 16px)",
            }}
          >
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={!canContinue}
              style={{ width: "100%" }}
            >
              {isProcessing ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Loader size="sm" />
                  Processing…
                </span>
              ) : allReady ? (
                "Continue to Review →"
              ) : (
                "Continue to Review →"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push("/onboarding/wizard/1")}
              style={{
                fontSize: "var(--drp-text-sm, 13px)",
                color: "var(--drp-grey)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Build with wizard instead →
            </Button>
          </div>

          {/* File count warning */}
          {files.length >= MAX_FILES && (
            <p
              style={{
                marginTop: "var(--drp-space-3, 12px)",
                fontSize: "var(--drp-text-xs, 11px)",
                color: "var(--drp-grey)",
                textAlign: "center",
              }}
            >
              Maximum of {MAX_FILES} files reached.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
