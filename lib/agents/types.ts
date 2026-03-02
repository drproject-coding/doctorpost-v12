// ── Agent Configuration ──

export type AgentRole =
  | "strategist"
  | "researcher"
  | "writer"
  | "scorer"
  | "formatter"
  | "learner";

export interface AgentConfig {
  role: AgentRole;
  model: "opus" | "sonnet" | "haiku";
  maxTokens: number;
  /** Which document categories this agent needs injected into its context */
  requiredKnowledge: string[];
}

export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  strategist: {
    role: "strategist",
    model: "sonnet",
    maxTokens: 4096,
    requiredKnowledge: [
      "rules/content-strategy",
      "references/content-matrix",
      "learned/winners",
      "learned/preferences",
    ],
  },
  researcher: {
    role: "researcher",
    model: "sonnet",
    maxTokens: 4096,
    requiredKnowledge: ["rules/content-strategy", "references/kpi-benchmarks"],
  },
  writer: {
    role: "writer",
    model: "opus",
    maxTokens: 8192,
    requiredKnowledge: [
      "rules/brand-voice",
      "rules/hard-rules",
      "rules/formatting-rules",
      "rules/scoring-rules",
      "rules/content-strategy",
      "references/tone-shifts",
      "references/vocabulary",
      "references/copy-techniques",
      "references/headline-formulas",
      "learned/style-patterns",
      "learned/calibration",
    ],
  },
  scorer: {
    role: "scorer",
    model: "sonnet",
    maxTokens: 4096,
    requiredKnowledge: [
      "rules/scoring-rules",
      "rules/hard-rules",
      "rules/brand-voice",
      "rules/formatting-rules",
    ],
  },
  formatter: {
    role: "formatter",
    model: "haiku",
    maxTokens: 4096,
    requiredKnowledge: ["rules/formatting-rules"],
  },
  learner: {
    role: "learner",
    model: "sonnet",
    maxTokens: 4096,
    requiredKnowledge: [
      "learned/preferences",
      "learned/style-patterns",
      "learned/hook-patterns",
      "learned/calibration",
      "learned/winners",
      "learned/changelog",
    ],
  },
};

// ── Model ID Mapping ──

export const MODEL_IDS: Record<AgentConfig["model"], string> = {
  opus: "claude-opus-4-5-20251101",
  sonnet: "claude-sonnet-4-5-20250929",
  haiku: "claude-haiku-4-5-20251001",
};
