"use client";

import { useEffect, useState } from "react";
import { Button } from "@doctorproject/react";
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

// ─── Section colour palette ──────────────────────────────────────────────────
const SECTION_COLORS: Record<
  string,
  { bg: string; border: string; label: string }
> = {
  hook: { bg: "#7C3AED14", border: "#7C3AED", label: "Hook" },
  argument: { bg: "#DC262614", border: "#DC2626", label: "Argument" },
  evidence: { bg: "#2563EB14", border: "#2563EB", label: "Evidence" },
  takeaway: { bg: "#05966914", border: "#059669", label: "Takeaway" },
  steps: { bg: "#2563EB14", border: "#2563EB", label: "Steps" },
  protip: { bg: "#D9770614", border: "#D97706", label: "Pro Tip" },
  cta: { bg: "#05966914", border: "#059669", label: "CTA" },
  setup: { bg: "#DC262614", border: "#DC2626", label: "Setup" },
  observation: { bg: "#2563EB14", border: "#2563EB", label: "Observation" },
  insight: { bg: "#D9770614", border: "#D97706", label: "Insight" },
  question: { bg: "#05966914", border: "#059669", label: "Question" },
  "turning-point": {
    bg: "#D9770614",
    border: "#D97706",
    label: "Turning Point",
  },
  lesson: { bg: "#05966914", border: "#059669", label: "Lesson" },
  items: { bg: "#6366F114", border: "#6366F1", label: "Items" },
  closing: { bg: "#05966914", border: "#059669", label: "Closing" },
};

type SectionType = keyof typeof SECTION_COLORS;

interface PostSection {
  type: SectionType;
  lines: string[];
}

// ─── Static example posts per structure ─────────────────────────────────────
const EXAMPLES: Record<string, PostSection[]> = {
  opinionTake: [
    {
      type: "hook",
      lines: ["Nobody cares about your 10-year experience."],
    },
    {
      type: "argument",
      lines: [
        "What they care about is what you did with it.",
        "I've seen junior consultants outperform 20-year veterans.",
        "Not because they knew more.",
        "Because they showed up differently.",
      ],
    },
    {
      type: "evidence",
      lines: [
        "Three patterns I see in people who punch above their experience:",
        "→ They ask questions others are too proud to ask.",
        "→ They document everything — and share it.",
        "→ They treat every project like it's their portfolio.",
      ],
    },
    {
      type: "takeaway",
      lines: [
        "Your experience is table stakes.",
        "What you build with it is your brand.",
        "What are you building?",
      ],
    },
  ],

  howTo: [
    {
      type: "hook",
      lines: ["Most LinkedIn posts die in the first 3 seconds."],
    },
    {
      type: "steps",
      lines: [
        "Here's how to hook readers immediately:",
        "",
        "Step 1 — Lead with tension, not context.",
        "Don't explain who you are. Create a gap they need to close.",
        "",
        "Step 2 — Write your second line first.",
        "It must make them click 'see more.' Write it before anything else.",
        "",
        "Step 3 — One idea per line.",
        "Walls of text get scrolled. White space is engagement.",
      ],
    },
    {
      type: "protip",
      lines: [
        "Pro tip: The best hooks create a question the reader has to answer by reading on.",
      ],
    },
    {
      type: "cta",
      lines: [
        "Rewrite your last post's opening using these rules.",
        "Drop it in the comments — I'll give feedback.",
      ],
    },
  ],

  observation: [
    {
      type: "hook",
      lines: [
        "I watched someone get hired over 4 senior candidates yesterday.",
      ],
    },
    {
      type: "observation",
      lines: [
        "She had 2 years of experience. They averaged 12.",
        "The difference wasn't skill.",
        "The hiring manager told me afterward:",
        '"She was the only one who asked what success looks like in 90 days."',
      ],
    },
    {
      type: "insight",
      lines: [
        "Everyone else pitched themselves.",
        "She pitched her future impact.",
        "Preparing an answer is easy.",
        "Asking the right question is rare.",
      ],
    },
    {
      type: "question",
      lines: [
        "What question have you asked in an interview that changed the room?",
      ],
    },
  ],

  story: [
    {
      type: "hook",
      lines: [
        "I almost quit consulting after my third client fired me in a row.",
      ],
    },
    {
      type: "setup",
      lines: [
        "It was 2019. Three projects. Three failures.",
        "Not because of bad work.",
        "Because I was solving the wrong problem every time.",
        "I was answering what they asked — not what they needed.",
      ],
    },
    {
      type: "turning-point",
      lines: [
        "The fourth client saved me without knowing it.",
        "She interrupted my presentation in minute two.",
        '"I don\'t need a strategy. I need my team to believe in one."',
        "I stopped. I listened. I started over.",
      ],
    },
    {
      type: "lesson",
      lines: [
        "The best consultants aren't the smartest in the room.",
        "They're the ones who find the real question before answering.",
        "What's the question behind your client's question?",
      ],
    },
  ],

  list: [
    {
      type: "hook",
      lines: ["7 phrases that make you sound insecure in any meeting:"],
    },
    {
      type: "items",
      lines: [
        '1. "Sorry, this might be a dumb question..." → Just ask it.',
        '2. "I could be wrong, but..." → You undermine yourself before starting.',
        '3. "Does that make sense?" → It signals you don\'t trust your explanation.',
        '4. "Just to add to what [X] said..." → Lead with your point, not a disclaimer.',
        '5. "I was just thinking..." → "I think" is stronger.',
        '6. "Sorry to bother you..." → Your ideas have value. Own it.',
        '7. "This is probably obvious, but..." → If it were, someone else would have said it.',
      ],
    },
    {
      type: "closing",
      lines: [
        "Your language shapes how others see you.",
        "More importantly — it shapes how you see yourself.",
        "Which one are you dropping this week?",
      ],
    },
  ],
};

// ─── Preview panel ────────────────────────────────────────────────────────────
function PostPreview({ structureId }: { structureId: string }) {
  const sections = EXAMPLES[structureId];
  if (!sections) return null;

  return (
    <div
      style={{
        marginTop: 14,
        border: "1.5px solid rgba(0,0,0,0.08)",
        background: "#fafafa",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 12px",
          marginBottom: 10,
        }}
      >
        {sections.map((s) => {
          const c = SECTION_COLORS[s.type];
          return (
            <span
              key={s.type}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: c.border,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: c.border,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              {c.label}
            </span>
          );
        })}
      </div>

      {/* Sections */}
      {sections.map((section, i) => {
        const c = SECTION_COLORS[section.type];
        return (
          <div
            key={i}
            style={{
              borderLeft: `3px solid ${c.border}`,
              background: c.bg,
              padding: "8px 10px",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: c.border,
                marginBottom: 5,
              }}
            >
              {c.label}
            </div>
            {section.lines.map((line, j) =>
              line === "" ? (
                <div key={j} style={{ height: 6 }} />
              ) : (
                <p
                  key={j}
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#1a1a1a",
                    fontFamily: "var(--drp-font-mono, monospace)",
                  }}
                >
                  {line}
                </p>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface PostStructureCardsProps {
  selected: string;
  onChange: (value: string) => void;
}

export default function PostStructureCards({
  selected,
  onChange,
}: PostStructureCardsProps) {
  const [mounted, setMounted] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

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

  const togglePreview = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPreviewId((prev) => (prev === id ? null : id));
  };

  if (!mounted) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        {postStructureOptions.map((option) => {
          const isSelected = selected === option.value;
          const isPreviewing = previewId === option.id;

          return (
            <Button
              key={option.id}
              type="button"
              variant={isSelected ? "primary" : "ghost-bordered"}
              onClick={() => handleSelect(option.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px 10px",
                background: isSelected
                  ? "#631DED0D"
                  : isPreviewing
                    ? "#631DED05"
                    : "transparent",
                borderColor: isSelected
                  ? "var(--drp-purple, #631DED)"
                  : isPreviewing
                    ? "rgba(99,29,237,0.3)"
                    : "rgba(0,0,0,0.1)",
                textAlign: "center",
                height: "auto",
                position: "relative",
              }}
            >
              <span
                style={{
                  color: isSelected
                    ? "var(--drp-purple, #631DED)"
                    : "var(--drp-grey, #888)",
                }}
              >
                {ICONS[option.id] ?? <FileText size={20} />}
              </span>
              <span
                style={{
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: 13,
                  color: isSelected ? "var(--drp-purple, #631DED)" : "inherit",
                }}
              >
                {option.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--drp-grey, #888)",
                  lineHeight: 1.3,
                }}
              >
                {option.description}
              </span>

              {/* Preview toggle */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => togglePreview(e, option.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  togglePreview(e as unknown as React.MouseEvent, option.id)
                }
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: isPreviewing ? "#631DED" : "rgba(0,0,0,0.35)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                }}
              >
                {isPreviewing ? "▲ hide" : "▼ example"}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Inline preview — shown below all cards */}
      {previewId && <PostPreview structureId={previewId} />}
    </div>
  );
}
