import type { KnowledgeDocument } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";

const config = AGENT_CONFIGS.learner;

export interface LearnerInput {
  apiKey: string;
  knowledge: KnowledgeDocument[];
  /** The original draft from the writer */
  originalDraft: string;
  /** The final approved version (after user edits) */
  finalVersion: string;
  /** User feedback during the session */
  userFeedback?: string[];
  /** Topic/angle context */
  sessionContext: {
    topic: string;
    angle: string;
    template: string;
    score: number;
  };
  signal?: AbortSignal;
}

export interface LearnerSignal {
  signalType:
    | "approval"
    | "rejection"
    | "edit"
    | "hook-rewrite"
    | "tone-feedback"
    | "score-override";
  category: string;
  context: Record<string, unknown>;
  observation: string;
}

export interface LearnerOutput {
  signals: LearnerSignal[];
  patternDetected: string | null;
  rulePromotionReady: boolean;
}

export async function runLearner(input: LearnerInput): Promise<LearnerOutput> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  const extraContext = `## Session Data

### Original Draft (v1)
${input.originalDraft}

### Final Approved Version
${input.finalVersion}

### Session Context
Topic: ${input.sessionContext.topic}
Angle: ${input.sessionContext.angle}
Template: ${input.sessionContext.template}
Score: ${input.sessionContext.score}/100

${input.userFeedback?.length ? `### User Feedback\n${input.userFeedback.map((f) => `- ${f}`).join("\n")}` : ""}`;

  const systemPrompt = buildSystemPrompt("learner", docs, extraContext);

  const userMessage = `Analyze the delta between the original draft and the final approved version. Classify each change as a signal. Check if any pattern has reached the 10-signal threshold for rule promotion. Return a JSON object with: signals (LearnerSignal[]), patternDetected (string|null), rulePromotionReady (boolean).`;

  const { text } = await callAgentClaude({
    apiKey: input.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    userMessage,
    signal: input.signal,
  });

  return extractJson<LearnerOutput>(text);
}
