"use client";
import React, { useState, useEffect } from "react";
import { Button, Card } from "@bruddle/react";
import { RotateCcw, X, ChevronDown, ChevronRight } from "lucide-react";
import type {
  DocumentVersion,
  NcbDocumentVersionRow,
} from "@/lib/knowledge/types";
import { mapDocumentVersionFromNcb } from "@/lib/knowledge/types";

interface VersionHistoryProps {
  documentId: string;
  currentVersion: number;
  onRestore: (version: DocumentVersion) => void;
  onClose: () => void;
}

export function VersionHistory({
  documentId,
  currentVersion,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/knowledge/read/document_versions?document_id=${documentId}`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          const rows = Array.isArray(data)
            ? data
            : data.data || data.rows || [];
          const mapped = rows.map((r: NcbDocumentVersionRow) =>
            mapDocumentVersionFromNcb(r),
          );
          mapped.sort(
            (a: DocumentVersion, b: DocumentVersion) => b.version - a.version,
          );
          setVersions(mapped);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [documentId]);

  return (
    <Card variant="raised" style={{ height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Version History
        </h3>
        <Button variant="ghost" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            color: "var(--bru-grey)",
          }}
        >
          Loading versions...
        </div>
      ) : versions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            color: "var(--bru-grey)",
            fontSize: "var(--bru-text-md)",
          }}
        >
          No version history yet. Edits will create version snapshots.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--bru-space-2)",
          }}
        >
          {versions.map((v) => (
            <div
              key={v.id}
              style={{
                border: "var(--bru-border)",
                padding: "var(--bru-space-3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
                onClick={() => setExpanded(expanded === v.id ? null : v.id)}
              >
                <div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "var(--bru-text-md)",
                    }}
                  >
                    v{v.version}
                  </span>
                  <span
                    style={{
                      marginLeft: "var(--bru-space-2)",
                      color: "var(--bru-grey)",
                      fontSize: "var(--bru-text-sm)",
                    }}
                  >
                    {v.changeReason}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      color: "var(--bru-grey)",
                    }}
                  >
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  {expanded === v.id ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </div>
              </div>

              {expanded === v.id && (
                <div style={{ marginTop: "var(--bru-space-3)" }}>
                  <pre
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      background: "var(--bru-cream)",
                      padding: "var(--bru-space-3)",
                      border: "var(--bru-border)",
                      maxHeight: 300,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {v.content}
                  </pre>
                  {v.version < currentVersion && (
                    <Button
                      style={{ marginTop: "var(--bru-space-2)" }}
                      onClick={() => onRestore(v)}
                    >
                      <RotateCcw size={14} />
                      Restore v{v.version}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
