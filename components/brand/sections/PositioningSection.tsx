"use client";
import React from "react";
import { BrandProfile } from "@/lib/types";

interface PositioningSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const ACCENT = "#E99898";
const ACCENT_BG = "#E9989820";

const PositioningSection: React.FC<PositioningSectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  if (editing) {
    return (
      <div>
        <textarea
          value={profile.positioning ?? ""}
          onChange={(e) => onChange({ positioning: e.target.value })}
          placeholder="e.g. The only LinkedIn coach who teaches engineers to write without sounding like a LinkedIn post."
          rows={5}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "10px 12px",
            fontFamily: "var(--bru-font-primary)",
            fontSize: "var(--bru-text-sm)",
            color: "var(--bru-black)",
            background: "var(--bru-white)",
            border: "1px solid rgba(0,0,0,0.18)",
            borderRadius: 0,
            outline: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            marginTop: "6px",
            fontFamily: "var(--bru-font-primary)",
            fontSize: "var(--bru-text-xs)",
            color: "rgba(18,18,18,0.5)",
          }}
        >
          Describe how you&apos;re different from others in your space.
          What&apos;s your unique angle?
        </p>
      </div>
    );
  }

  const hasContent =
    profile.positioning && profile.positioning.trim().length > 0;

  return (
    <div
      style={{
        background: ACCENT_BG,
        borderLeft: `3px solid ${ACCENT}`,
        padding: "12px 16px",
      }}
    >
      {hasContent ? (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--bru-font-primary)",
            fontSize: "var(--bru-text-sm)",
            color: "var(--bru-black)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {profile.positioning}
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--bru-font-primary)",
            fontSize: "var(--bru-text-sm)",
            color: "rgba(18,18,18,0.45)",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          Your brand positioning statement defines how you differentiate from
          others in your space. Add yours.
        </p>
      )}
    </div>
  );
};

export default PositioningSection;
