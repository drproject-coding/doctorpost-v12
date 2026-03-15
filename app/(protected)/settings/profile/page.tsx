"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Alert,
  Loader as DSLoader,
} from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsProfilePage() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id || !displayName.trim()) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/data/update/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update profile (${res.status})`);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--drp-cream)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: "0 0 6px",
              color: "var(--drp-black)",
            }}
          >
            Profile
          </h1>
          <p style={{ margin: 0, color: "var(--drp-grey)", fontSize: 14 }}>
            Manage your personal information
          </p>
        </div>

        {/* Avatar card */}
        <Card variant="raised" style={{ marginBottom: 16 }}>
          <div style={{ padding: 24 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 15,
                margin: "0 0 20px",
                color: "var(--drp-black)",
              }}
            >
              Profile Picture
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: "var(--drp-purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: "3px solid var(--drp-black)",
                }}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "Profile"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}
                  >
                    {initials}
                  </span>
                )}
              </div>

              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--drp-black)",
                  }}
                >
                  {user?.name ?? "Your Name"}
                </p>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    color: "var(--drp-grey)",
                  }}
                >
                  {user?.email ?? ""}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    border: "2px solid #ccc",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--drp-grey)",
                    cursor: "not-allowed",
                  }}
                >
                  🖼 Change Photo (coming soon)
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Name + email card */}
        <Card variant="raised" style={{ marginBottom: 16 }}>
          <div style={{ padding: 24 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 15,
                margin: "0 0 20px",
                color: "var(--drp-black)",
              }}
            >
              Personal Information
            </h2>

            {/* Display name */}
            <div style={{ marginBottom: "var(--drp-space-5)" }}>
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={saving}
                placeholder="Your full name"
              />
            </div>

            {/* Email (readonly) */}
            <div style={{ marginBottom: "var(--drp-space-6)" }}>
              <Input
                label="Email Address"
                type="email"
                value={user?.email ?? ""}
                disabled
              />
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  color: "var(--drp-grey)",
                }}
              >
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: "var(--drp-space-4)" }}>
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            {/* Save button */}
            <Button
              variant={saved ? "outline" : "primary"}
              onClick={() => void handleSave()}
              disabled={
                saving || !displayName.trim() || displayName === user?.name
              }
            >
              {saving ? (
                <>
                  <DSLoader size="sm" />
                  Saving…
                </>
              ) : saved ? (
                "✓ Saved"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
