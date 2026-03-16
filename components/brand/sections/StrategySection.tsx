"use client";
import React from "react";
import { Textarea } from "@doctorproject/react";
import { BrandProfile } from "@/lib/types";

interface StrategySectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const TEAL = "#00A896";
const MAX_STRATEGY = 2000;
const MAX_DEFINITION = 1000;

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="drp-field__label"
    style={{
      display: "block",
      fontFamily: "var(--drp-font-primary)",
      fontWeight: "var(--drp-weight-bold)",
      fontSize: "var(--drp-text-sm)",
      letterSpacing: "var(--drp-tracking-caps)",
      textTransform: "uppercase" as const,
      color: "var(--drp-black)",
      marginBottom: "6px",
    }}
  >
    {children}
  </label>
);

const ViewValue: React.FC<{ value: string }> = ({ value }) =>
  value.trim() ? (
    <p
      style={{
        fontFamily: "var(--drp-font-primary)",
        fontSize: "var(--drp-text-md)",
        color: "var(--drp-black)",
        lineHeight: 1.6,
        margin: 0,
        whiteSpace: "pre-wrap",
      }}
    >
      {value}
    </p>
  ) : (
    <p
      style={{
        fontFamily: "var(--drp-font-primary)",
        fontSize: "var(--drp-text-md)",
        color: "var(--drp-grey)",
        margin: 0,
        fontStyle: "italic",
      }}
    >
      Not set
    </p>
  );

const CharCount: React.FC<{ current: number; max: number }> = ({
  current,
  max,
}) => (
  <span
    style={{
      display: "block",
      textAlign: "right" as const,
      fontSize: "var(--drp-text-xs)",
      color: current > max * 0.9 ? TEAL : "var(--drp-grey)",
      marginTop: "var(--drp-space-1)",
    }}
  >
    {current} / {max}
  </span>
);

const StrategySection: React.FC<StrategySectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--drp-space-6)",
      }}
    >
      {/* Content Strategy */}
      <div>
        <FieldLabel>Content Strategy</FieldLabel>
        {editing ? (
          <>
            <Textarea
              rows={4}
              maxLength={MAX_STRATEGY}
              value={profile.contentStrategy}
              onChange={(e) => onChange({ contentStrategy: e.target.value })}
              placeholder="Describe your content strategy — what topics you cover, what formats you use, and how you show up for your audience."
              style={{
                width: "100%",
                resize: "vertical" as const,
                minHeight: "100px",
              }}
            />
            <CharCount
              current={profile.contentStrategy.length}
              max={MAX_STRATEGY}
            />
          </>
        ) : (
          <ViewValue value={profile.contentStrategy} />
        )}
      </div>

      {/* Brand Definition */}
      <div>
        <FieldLabel>Brand Definition</FieldLabel>
        {editing ? (
          <>
            <Textarea
              rows={3}
              maxLength={MAX_DEFINITION}
              value={profile.definition}
              onChange={(e) => onChange({ definition: e.target.value })}
              placeholder="Define your brand mission — what you stand for and why you exist."
              style={{
                width: "100%",
                resize: "vertical" as const,
                minHeight: "76px",
              }}
            />
            <CharCount
              current={profile.definition.length}
              max={MAX_DEFINITION}
            />
          </>
        ) : (
          <ViewValue value={profile.definition} />
        )}
      </div>
    </div>
  );
};

export default StrategySection;
