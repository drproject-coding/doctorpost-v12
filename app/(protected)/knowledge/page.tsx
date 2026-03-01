"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { FileText, Plus, Upload, Scissors, Search, Loader } from "lucide-react";
import type {
  KnowledgeDocument,
  DocumentCategory,
  DocumentVersion,
  NcbDocumentRow,
} from "@/lib/knowledge/types";
import { mapDocumentFromNcb } from "@/lib/knowledge/types";
import { DocumentEditor } from "@/components/knowledge/DocumentEditor";
import { VersionHistory } from "@/components/knowledge/VersionHistory";
import { ImportFlow } from "@/components/knowledge/ImportFlow";
import { ExtractFlow } from "@/components/knowledge/ExtractFlow";

const CATEGORIES: { value: DocumentCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "rules", label: "Rules" },
  { value: "references", label: "References" },
  { value: "library", label: "Library" },
  { value: "templates", label: "Templates" },
  { value: "learned", label: "Learned" },
];

type View = "list" | "editor" | "history" | "import" | "extract";

export default function KnowledgePage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<
    DocumentCategory | "all"
  >("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path =
        filterCategory === "all"
          ? "/api/knowledge/read/documents"
          : `/api/knowledge/read/documents?category=${filterCategory}`;
      const res = await fetch(path, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.data || data.rows || [];
        setDocuments(rows.map((r: NcbDocumentRow) => mapDocumentFromNcb(r)));
      }
    } catch (err) {
      setError("Failed to load documents. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filtered = documents.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.subcategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setView("editor");
  };

  const handleSave = async (content: string, reason: string) => {
    if (!selectedDoc) return;
    const res = await fetch(
      `/api/knowledge/update/documents/${selectedDoc.id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          updated_by: user?.name || "user",
          version: selectedDoc.version + 1,
        }),
      },
    );
    if (!res.ok) throw new Error("Failed to save");
    // Also create version snapshot via the knowledge api
    const versionRes = await fetch("/api/knowledge/create/document_versions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: selectedDoc.id,
        version: selectedDoc.version,
        content: selectedDoc.content,
        change_reason: reason,
        changed_by: user?.name || "user",
      }),
    });
    if (!versionRes.ok) throw new Error("Failed to create version snapshot");
    // Refresh
    await fetchDocs();
    setSelectedDoc((prev) =>
      prev ? { ...prev, content, version: prev.version + 1 } : null,
    );
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!selectedDoc) return;
    await handleSave(version.content, `Restored from v${version.version}`);
    setView("editor");
  };

  // Import/Extract callbacks
  const handleImportComplete = () => {
    setView("list");
    fetchDocs();
  };

  if (view === "import") {
    return (
      <ImportFlow
        onComplete={handleImportComplete}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "extract") {
    return (
      <ExtractFlow
        onComplete={handleImportComplete}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "editor" && selectedDoc) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "var(--bru-space-6)",
        }}
      >
        <DocumentEditor
          documentId={selectedDoc.id}
          name={selectedDoc.name}
          category={selectedDoc.category}
          content={selectedDoc.content}
          version={selectedDoc.version}
          onSave={handleSave}
          onClose={() => setView("list")}
          onShowHistory={() => setView("history")}
        />
      </div>
    );
  }

  if (view === "history" && selectedDoc) {
    return (
      <VersionHistory
        documentId={selectedDoc.id}
        currentVersion={selectedDoc.version}
        onRestore={handleRestore}
        onClose={() => setView("editor")}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <h1
          style={{ fontSize: "var(--bru-text-h3)", fontWeight: 700, margin: 0 }}
        >
          Knowledge Base
        </h1>
        <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
          <button className="bru-btn" onClick={() => setView("import")}>
            <Upload size={14} />
            Import
          </button>
          <button className="bru-btn" onClick={() => setView("extract")}>
            <Scissors size={14} />
            Extract Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bru-card bru-card--flat"
        style={{
          display: "flex",
          gap: "var(--bru-space-3)",
          alignItems: "center",
          marginBottom: "var(--bru-space-4)",
          flexWrap: "wrap",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`bru-btn ${filterCategory === cat.value ? "bru-btn--primary" : ""}`}
            style={{ padding: "4px 12px", fontSize: "var(--bru-text-sm)" }}
            onClick={() => setFilterCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--bru-grey)",
              }}
            />
            <input
              className="bru-input"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="bru-alert bru-alert--error"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <span className="bru-alert__icon">!</span>
          <div className="bru-alert__content">
            <div className="bru-alert__text">{error}</div>
          </div>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            color: "var(--bru-grey)",
          }}
        >
          <Loader size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="bru-card bru-card--raised"
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            color: "var(--bru-grey)",
          }}
        >
          No documents found. Import brand files to get started.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--bru-space-4)",
          }}
        >
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bru-card bru-card--raised bru-card--interactive"
              style={{ cursor: "pointer" }}
              onClick={() => handleEdit(doc)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--bru-space-3)",
                }}
              >
                <FileText size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: "var(--bru-text-md)",
                      fontWeight: 700,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--bru-space-2)",
                      marginTop: "var(--bru-space-1)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--bru-text-xs)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "1px 6px",
                        background: "var(--bru-purple)",
                        color: "white",
                      }}
                    >
                      {doc.category}
                    </span>
                    {doc.subcategory && (
                      <span
                        style={{
                          fontSize: "var(--bru-text-xs)",
                          color: "var(--bru-grey)",
                        }}
                      >
                        {doc.subcategory}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      color: "var(--bru-grey)",
                      margin: "var(--bru-space-2) 0 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {doc.content.slice(0, 150)}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "var(--bru-space-3)",
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-grey)",
                }}
              >
                <span>v{doc.version}</span>
                <span>{doc.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
