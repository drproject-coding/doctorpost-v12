"use client";

import { Button } from "@doctorproject/react";
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
          <span key={option.id} style={{ position: "relative" }}>
            <Button
              type="button"
              variant={isSelected ? "primary" : "ghost-bordered"}
              onClick={() => onChange(option.value)}
              title={option.description}
              style={
                isSuggested
                  ? {
                      borderStyle: "dashed",
                      borderColor: "var(--drp-purple, #631DED)",
                    }
                  : undefined
              }
            >
              {option.label}
            </Button>
            {isSuggested && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -6,
                  fontSize: 9,
                  fontWeight: 800,
                  background: "var(--drp-purple, #631DED)",
                  color: "#fff",
                  padding: "1px 5px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  pointerEvents: "none",
                }}
              >
                AI
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
