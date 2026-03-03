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

// ── Agent Handoff Protocol ──
/**
 * Output contracts between agents. Each agent's output must match the next agent's input schema.
 * This ensures type-safe handoffs and early detection of contract violations.
 */

/**
 * Strategist Output → Researcher Input
 * Strategist proposes topics; Researcher uses headline + angle for discovery.
 */
export interface StrategistToResearcherHandoff {
  proposals: Array<{
    headline: string;
    angle: string;
    pillarAssessment: string;
    angleAssessment: string;
    templateRecommendation?: string;
    currentPhase: string;
  }>;
}

/**
 * Researcher Output (Discovery) → Writer Input
 * Researcher discovers subtopic angles; Writer uses these to contextualize evidence.
 */
export interface ResearcherToWriterHandoff {
  subtopicAngles?: Array<{
    subtopic: string;
    angle: string;
    relevance: string;
  }>;
  claims?: Array<{
    claim: string;
    source: string;
    strength: "weak" | "moderate" | "strong";
  }>;
}

/**
 * Writer Output → Scorer Input
 * Writer produces draft; Scorer evaluates draft + metadata.
 */
export interface WriterToScorerHandoff {
  content: string;
  wordCount: number;
  template: string;
  selfCheckPassed?: boolean;
  selfCheckNotes?: string;
  hookCategory?: string;
}

/**
 * Scorer Output → Formatter Input
 * Scorer validates and scores; Formatter applies platform-specific formatting.
 */
export interface ScorerToFormatterHandoff {
  totalScore: number;
  criteriaScores: Record<string, number>;
  verdict: "publish" | "rewrite" | "scrap";
  checklist: Array<{
    criterion: string;
    passed: boolean;
    notes?: string;
  }>;
  checklistScore: number;
  rewriteInstructions?: string;
}

/**
 * Formatter Output → Learner Input
 * Formatter produces platform-ready post; Learner analyzes for pattern learning.
 */
export interface FormatterToLearnerHandoff {
  hookBeforeFold: {
    mobile: string;
    desktop: string;
  };
  suggestedPinnedComment?: string;
  metadata: {
    likelyOutcomes: string[];
    targetAudience: string;
    estimatedEngagement: string;
  };
}

/**
 * Handoff validation ensures agent outputs match next agent's input schema.
 * Use this to validate contracts before passing state between agents.
 */
export interface HandoffValidator {
  validateStrategistOutput(
    output: unknown,
  ): output is StrategistToResearcherHandoff;
  validateResearcherOutput(
    output: unknown,
  ): output is ResearcherToWriterHandoff;
  validateWriterOutput(output: unknown): output is WriterToScorerHandoff;
  validateScorerOutput(output: unknown): output is ScorerToFormatterHandoff;
  validateFormatterOutput(output: unknown): output is FormatterToLearnerHandoff;
}

/**
 * Validates that strategist output has required fields.
 */
export function validateStrategistOutput(
  output: unknown,
): output is StrategistToResearcherHandoff {
  if (!output || typeof output !== "object") return false;
  const obj = output as any;
  return (
    Array.isArray(obj.proposals) &&
    obj.proposals.every(
      (p: any) =>
        typeof p.headline === "string" &&
        typeof p.angle === "string" &&
        typeof p.pillarAssessment === "string" &&
        typeof p.angleAssessment === "string" &&
        typeof p.currentPhase === "string",
    )
  );
}

/**
 * Validates that researcher output has optional but expected fields.
 */
export function validateResearcherOutput(
  output: unknown,
): output is ResearcherToWriterHandoff {
  if (!output || typeof output !== "object") return false;
  const obj = output as any;
  // Researcher output can be partial; validate shape if fields exist
  if (obj.subtopicAngles && !Array.isArray(obj.subtopicAngles)) return false;
  if (obj.claims && !Array.isArray(obj.claims)) return false;
  return true;
}

/**
 * Validates that writer output has required fields.
 */
export function validateWriterOutput(
  output: unknown,
): output is WriterToScorerHandoff {
  if (!output || typeof output !== "object") return false;
  const obj = output as any;
  return (
    typeof obj.content === "string" &&
    typeof obj.wordCount === "number" &&
    typeof obj.template === "string"
  );
}

/**
 * Validates that scorer output has required fields.
 */
export function validateScorerOutput(
  output: unknown,
): output is ScorerToFormatterHandoff {
  if (!output || typeof output !== "object") return false;
  const obj = output as any;
  return (
    typeof obj.totalScore === "number" &&
    typeof obj.criteriaScores === "object" &&
    ["publish", "rewrite", "scrap"].includes(obj.verdict) &&
    Array.isArray(obj.checklist) &&
    typeof obj.checklistScore === "number"
  );
}

/**
 * Validates that formatter output has expected fields.
 */
export function validateFormatterOutput(
  output: unknown,
): output is FormatterToLearnerHandoff {
  if (!output || typeof output !== "object") return false;
  const obj = output as any;
  return (
    typeof obj.hookBeforeFold === "object" &&
    typeof obj.hookBeforeFold.mobile === "string" &&
    typeof obj.hookBeforeFold.desktop === "string" &&
    typeof obj.metadata === "object"
  );
}
