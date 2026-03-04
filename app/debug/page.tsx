"use client";

import { useState } from "react";

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  const testPostCreation = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/debug/create-post", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Debug: Post Creation</h1>

      <button
        onClick={testPostCreation}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Testing..." : "Test Post Creation"}
      </button>

      {error && (
        <div
          style={{ color: "red", marginTop: "20px", whiteSpace: "pre-wrap" }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            whiteSpace: "pre-wrap",
            backgroundColor: "#f0f0f0",
            padding: "10px",
          }}
        >
          <strong>Response:</strong>
          {"\n"}
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
