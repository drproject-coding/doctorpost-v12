"use client";

import { contentAngleOptions } from "@/lib/dropdownData";

interface ContentAngleChipsProps {
  selected: string;
  suggested?: string | null;
  onChange: (value: string) => void;
}

export default function ContentAngleChips({
  selected,
  suggested,
  onChange,
}: ContentAngleChipsProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {contentAngleOptions.map((option) => {
        const isSelected = selected === option.value;
        const isSuggested = suggested === option.value && !isSelected;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.description}
            style={{
              padding: "6px 14px",
              fontSize: "var(--drp-text-sm)",
              fontWeight: isSelected ? 700 : 500,
              border: isSelected
                ? "2px solid var(--drp-purple, #631DED)"
                : isSuggested
                  ? "2px dashed var(--drp-purple, #631DED)"
                  : "2px solid rgba(0,0,0,0.12)",
              background: isSelected
                ? "var(--drp-purple, #631DED)"
                : "transparent",
              color: isSelected ? "#fff" : "inherit",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.15s ease",
            }}
          >
            {option.label}
            {isSuggested && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -6,
                  fontSize: "var(--drp-text-xs)",
                  fontWeight: 800,
                  background: "var(--drp-purple, #631DED)",
                  color: "#fff",
                  padding: "1px 5px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                AI
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
