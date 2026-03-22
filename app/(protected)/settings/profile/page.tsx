"use client";

import { useState, useEffect } from "react";
import { Card, Button, Icon } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";
import "@doctorproject/react/styles";

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
          <p
            style={{ margin: 0, color: "var(--drp-text-muted)", fontSize: 14 }}
          >
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
                    color: "var(--drp-text-muted)",
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
                    border: "2px solid var(--drp-border)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--drp-text-muted)",
                    cursor: "not-allowed",
                  }}
                >
                  <Icon name="camera" size="sm" />
                  Change Photo (coming soon)
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
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  color: "var(--drp-black)",
                }}
              >
                <Icon name="user" size="sm" />
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={saving}
                placeholder="Your full name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "2px solid var(--drp-black)",
                  background: "var(--drp-cream)",
                  fontFamily: "inherit",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  color: "var(--drp-black)",
                }}
              />
            </div>

            {/* Email (readonly) */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  color: "var(--drp-black)",
                }}
              >
                <Icon name="mail" size="sm" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "2px solid var(--drp-border)",
                  background: "var(--drp-surface)",
                  fontFamily: "inherit",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  color: "var(--drp-text-muted)",
                  cursor: "not-allowed",
                }}
              />
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  color: "var(--drp-text-muted)",
                }}
              >
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(233,152,152,0.1)",
                  border: "1px solid var(--drp-pink)",
                  marginBottom: 16,
                }}
              >
                <Icon
                  name="close"
                  size="sm"
                  style={{ color: "var(--drp-pink)" }}
                />
                <span style={{ fontSize: 13, color: "var(--drp-black)" }}>
                  {error}
                </span>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={() => void handleSave()}
              disabled={
                saving || !displayName.trim() || displayName === user?.name
              }
              style={{
                padding: "11px 28px",
                background: saved
                  ? "var(--drp-mint)"
                  : saving || !displayName.trim() || displayName === user?.name
                    ? "var(--drp-text-muted)"
                    : "var(--drp-purple)",
                color: "var(--drp-white)",
                border: "none",
                fontWeight: 800,
                fontSize: 14,
                cursor:
                  saving || !displayName.trim() || displayName === user?.name
                    ? "not-allowed"
                    : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              {saving ? (
                <>
                  <Icon
                    name="loader"
                    size="sm"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <Icon name="check" size="sm" />
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
