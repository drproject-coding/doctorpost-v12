"use client";
import React, { useState, useEffect } from "react";
import { Button, Card } from "@doctorproject/react";
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
          marginBottom: "var(--drp-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--drp-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Version History
        </h3>
        <Button variant="ghost" iconLeft="✕" onClick={onClose} />
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--drp-space-8)",
            color: "var(--drp-grey)",
          }}
        >
          Loading versions...
        </div>
      ) : versions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--drp-space-8)",
            color: "var(--drp-grey)",
            fontSize: "var(--drp-text-md)",
          }}
        >
          No version history yet. Edits will create version snapshots.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--drp-space-2)",
          }}
        >
          {versions.map((v) => (
            <div
              key={v.id}
              style={{
                border: "var(--drp-border)",
                padding: "var(--drp-space-3)",
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
                      fontSize: "var(--drp-text-md)",
                    }}
                  >
                    v{v.version}
                  </span>
                  <span
                    style={{
                      marginLeft: "var(--drp-space-2)",
                      color: "var(--drp-grey)",
                      fontSize: "var(--drp-text-sm)",
                    }}
                  >
                    {v.changeReason}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--drp-space-2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--drp-text-xs)",
                      color: "var(--drp-grey)",
                    }}
                  >
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  <span>{expanded === v.id ? "▼" : "›"}</span>
                </div>
              </div>

              {expanded === v.id && (
                <div style={{ marginTop: "var(--drp-space-3)" }}>
                  <pre
                    style={{
                      fontSize: "var(--drp-text-xs)",
                      background: "var(--drp-cream)",
                      padding: "var(--drp-space-3)",
                      border: "var(--drp-border)",
                      maxHeight: 300,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {v.content}
                  </pre>
                  {v.version < currentVersion && (
                    <Button
                      style={{ marginTop: "var(--drp-space-2)" }}
                      iconLeft="↻"
                      onClick={() => onRestore(v)}
                    >
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
