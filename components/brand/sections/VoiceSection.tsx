"use client";
import React from "react";
import { Input, Textarea, Select, Checkbox } from "@doctorproject/react";
import { BrandProfile } from "@/lib/types";

interface VoiceSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const VoiceSection: React.FC<VoiceSectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  const handleTonesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ tones: values });
  };

  const handleTaboosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ taboos: values });
  };

  const handleCopyGuidelineChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChange({ copyGuideline: e.target.value });
  };

  const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      styleGuide: { ...profile.styleGuide, emoji: e.target.checked },
    });
  };

  const handleHashtagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(10, Math.max(0, parseInt(e.target.value, 10) || 0));
    onChange({ styleGuide: { ...profile.styleGuide, hashtags: val } });
  };

  const handleLinksChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ styleGuide: { ...profile.styleGuide, links: e.target.value } });
  };

  if (editing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--drp-space-4)",
        }}
      >
        {/* Tones */}
        <div>
          <Input
            label="Voice Tones"
            type="text"
            defaultValue={profile.tones.join(", ")}
            onChange={handleTonesChange}
            placeholder="e.g. professional, friendly, bold"
          />
          <p
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-text-muted)",
              marginTop: "var(--drp-space-1)",
            }}
          >
            Comma-separated list of tones
          </p>
        </div>

        {/* Copy Guideline */}
        <Textarea
          label="Copy Guideline"
          rows={4}
          defaultValue={profile.copyGuideline}
          onChange={handleCopyGuidelineChange}
          placeholder="Describe your writing style..."
          style={{ resize: "vertical", width: "100%" }}
        />

        {/* Style Guide */}
        <div>
          <label
            className="drp-field__label"
            style={{ display: "block", marginBottom: "var(--drp-space-2)" }}
          >
            Style Guide
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--drp-space-2)",
            }}
          >
            {/* Emoji */}
            <Checkbox
              label="Use Emoji"
              defaultChecked={profile.styleGuide.emoji}
              onChange={handleEmojiChange}
            />

            {/* Hashtags */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-2)",
              }}
            >
              <span
                className="drp-field__label"
                style={{ minWidth: "80px", margin: 0 }}
              >
                Hashtags
              </span>
              <Input
                type="number"
                min={0}
                max={10}
                defaultValue={profile.styleGuide.hashtags}
                onChange={handleHashtagsChange}
                style={{ width: "80px" }}
              />
            </div>

            {/* Links */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-2)",
              }}
            >
              <span
                className="drp-field__label"
                style={{ minWidth: "80px", margin: 0 }}
              >
                Links
              </span>
              <Select
                defaultValue={profile.styleGuide.links}
                onChange={handleLinksChange}
                style={{ width: "160px" }}
              >
                <option value="end">End of post</option>
                <option value="inline">Inline</option>
                <option value="none">None</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Taboos */}
        <div>
          <Input
            label="Taboos"
            type="text"
            defaultValue={profile.taboos.join(", ")}
            onChange={handleTaboosChange}
            placeholder="e.g. politics, competitor names"
          />
          <p
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-text-muted)",
              marginTop: "var(--drp-space-1)",
            }}
          >
            Comma-separated list of words or topics to avoid
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--drp-space-4)",
      }}
    >
      {/* Tones */}
      <div>
        <p
          className="drp-field__label"
          style={{ marginBottom: "var(--drp-space-2)" }}
        >
          Voice Tones
        </p>
        {profile.tones.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {profile.tones.map((tone) => (
              <span
                key={tone}
                style={{
                  backgroundColor: "rgba(255, 108, 1, 0.15)",
                  color: "#FF6C01",
                  padding: "3px 10px",
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: 500,
                  borderRadius: 0,
                }}
              >
                {tone}
              </span>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--drp-text-muted)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Not set
          </span>
        )}
      </div>

      {/* Copy Guideline */}
      <div>
        <p
          className="drp-field__label"
          style={{ marginBottom: "var(--drp-space-1)" }}
        >
          Copy Guideline
        </p>
        {profile.copyGuideline ? (
          <p
            style={{
              fontSize: "var(--drp-text-sm)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {profile.copyGuideline}
          </p>
        ) : (
          <span
            style={{
              color: "var(--drp-text-muted)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Not set
          </span>
        )}
      </div>

      {/* Style Guide */}
      <div>
        <p
          className="drp-field__label"
          style={{ marginBottom: "var(--drp-space-2)" }}
        >
          Style Guide
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--drp-space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Emoji:
            </span>
            <span style={{ fontSize: "var(--drp-text-sm)", fontWeight: 500 }}>
              {profile.styleGuide.emoji ? "Yes" : "No"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Hashtags:
            </span>
            <span style={{ fontSize: "var(--drp-text-sm)", fontWeight: 500 }}>
              {profile.styleGuide.hashtags}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Links:
            </span>
            <span style={{ fontSize: "var(--drp-text-sm)", fontWeight: 500 }}>
              {profile.styleGuide.links === "end"
                ? "End of post"
                : profile.styleGuide.links === "inline"
                  ? "Inline"
                  : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Taboos */}
      <div>
        <p
          className="drp-field__label"
          style={{ marginBottom: "var(--drp-space-2)" }}
        >
          Taboos
        </p>
        {profile.taboos.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {profile.taboos.map((taboo) => (
              <span
                key={taboo}
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.12)",
                  color: "#dc2626",
                  padding: "3px 10px",
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: 500,
                  borderRadius: 0,
                }}
              >
                {taboo}
              </span>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--drp-text-muted)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            Not set
          </span>
        )}
      </div>
    </div>
  );
};

export default VoiceSection;
