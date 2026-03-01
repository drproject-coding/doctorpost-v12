import React from "react";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const fontSize = size === "sm" ? 9 : 10;
  const padding = size === "sm" ? "0 3px" : "0 4px";
  const marginRight = size === "sm" ? 4 : 6;

  return (
    <span
      style={{
        display: "inline-block",
        marginRight,
        padding,
        fontSize,
        fontWeight: 700,
        background:
          score >= 75
            ? "var(--bru-success, #2ecc71)"
            : score >= 50
              ? "var(--bru-warning, #f39c12)"
              : "var(--bru-error, #e74c3c)",
        color: "white",
      }}
    >
      {score}
    </span>
  );
}
