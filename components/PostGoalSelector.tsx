"use client";

import { Button } from "@doctorproject/react";
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
          <Button
            key={goal.id}
            type="button"
            variant={isSelected ? "primary" : "ghost-bordered"}
            title={goal.description}
            onClick={() => onChange(goal.id)}
          >
            {goal.label}
          </Button>
        );
      })}
    </div>
  );
}
