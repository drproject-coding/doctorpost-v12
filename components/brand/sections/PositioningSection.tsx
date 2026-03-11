"use client";
import React, { useState } from "react";
import { Textarea, Button } from "@doctorproject/react";
import { BrandProfile } from "@/lib/types";

const TRUNCATE_AT = 200;

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
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <div>
        <Textarea
          value={profile.positioning ?? ""}
          onChange={(e) => onChange({ positioning: e.target.value })}
          placeholder="e.g. The only LinkedIn coach who teaches engineers to write without sounding like a LinkedIn post."
          rows={5}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "var(--drp-space-2) var(--drp-space-3)",
            fontFamily: "var(--drp-font-primary)",
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-black)",
            background: "var(--drp-white)",
            border: "1px solid rgba(0,0,0,0.18)",
            borderRadius: 0,
            outline: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            marginTop: "var(--drp-space-1)",
            fontFamily: "var(--drp-font-primary)",
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-text-muted)",
          }}
        >
          Describe how you&apos;re different from others in your space.
          What&apos;s your unique angle?
        </p>
      </div>
    );
  }

  const text = profile.positioning ?? "";
  const hasContent = text.trim().length > 0;
  const isLong = text.length > TRUNCATE_AT;
  const displayed =
    isLong && !expanded ? text.slice(0, TRUNCATE_AT).trimEnd() + "…" : text;

  return (
    <div
      style={{
        background: ACCENT_BG,
        borderLeft: `3px solid ${ACCENT}`,
        padding: "var(--drp-space-3) var(--drp-space-4)",
      }}
    >
      {hasContent ? (
        <>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--drp-font-primary)",
              fontSize: "var(--drp-text-sm)",
              color: "var(--drp-black)",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {displayed}
          </p>
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              style={{
                marginTop: "var(--drp-space-2)",
                padding: 0,
                color: ACCENT,
                textDecoration: "underline",
                fontWeight: 700,
                fontSize: "var(--drp-text-xs)",
                letterSpacing: "0.03em",
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </Button>
          )}
        </>
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--drp-font-primary)",
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-text-muted)",
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
