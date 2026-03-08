"use client";

import { useEffect, useState } from "react";
import { FileText, BookOpen, Eye, MessageSquare, List } from "lucide-react";
import { postStructureOptions } from "@/lib/dropdownData";

const STORAGE_KEY = "doctorpost:lastPostStructure";

const ICONS: Record<string, React.ReactNode> = {
  opinionTake: <MessageSquare size={20} />,
  howTo: <BookOpen size={20} />,
  observation: <Eye size={20} />,
  story: <FileText size={20} />,
  list: <List size={20} />,
};

interface PostStructureCardsProps {
  selected: string;
  onChange: (value: string) => void;
}

export default function PostStructureCards({
  selected,
  onChange,
}: PostStructureCardsProps) {
  const [mounted, setMounted] = useState(false);

  // Restore last-used from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (!selected) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && postStructureOptions.some((o) => o.value === stored)) {
        onChange(stored);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (value: string) => {
    onChange(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 10,
      }}
    >
      {postStructureOptions.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "14px 10px",
              border: isSelected
                ? "2px solid var(--bru-purple, #631DED)"
                : "2px solid rgba(0,0,0,0.1)",
              background: isSelected ? "#631DED0D" : "transparent",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                color: isSelected
                  ? "var(--bru-purple, #631DED)"
                  : "var(--bru-grey, #888)",
              }}
            >
              {ICONS[option.id] ?? <FileText size={20} />}
            </span>
            <span
              style={{
                fontWeight: isSelected ? 700 : 600,
                fontSize: 13,
                color: isSelected ? "var(--bru-purple, #631DED)" : "inherit",
              }}
            >
              {option.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--bru-grey, #888)",
                lineHeight: 1.3,
              }}
            >
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
