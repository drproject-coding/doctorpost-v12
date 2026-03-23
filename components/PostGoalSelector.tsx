"use client";

import { POST_GOALS } from "@/lib/post-goals";

interface PostGoalSelectorProps {
  selected: string;
  onChange: (goalId: string) => void;
}

export default function PostGoalSelector({
  selected,
  onChange,
}: PostGoalSelectorProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {POST_GOALS.map((goal) => {
        const isSelected = selected === goal.id;
        return (
          <button
            key={goal.id}
            type="button"
            title={goal.description}
            onClick={() => onChange(goal.id)}
            style={{
              padding: "5px 12px",
              fontSize: "var(--drp-text-sm)",
              fontWeight: isSelected ? 700 : 500,
              border: isSelected
                ? "2px solid var(--drp-purple, #631DED)"
                : "2px solid rgba(0,0,0,0.12)",
              background: isSelected
                ? "var(--drp-purple, #631DED)"
                : "transparent",
              color: isSelected ? "#fff" : "inherit",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--drp-font-primary)",
            }}
          >
            {goal.label}
          </button>
        );
      })}
    </div>
  );
}
