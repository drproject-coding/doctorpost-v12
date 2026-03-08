import type { KnowledgeDocument } from "../knowledge/types";
import type { TopicProposal } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";
import { summarizeCoveredTopics } from "./topicDedup";

const config = AGENT_CONFIGS.strategist;

export interface StrategistInput {
  apiKey: string;
  provider?: "claude" | "straico" | "1forall";
  providerModel?: string;
  knowledge: KnowledgeDocument[];
  /** Optional: recent posts for pillar balance analysis */
  recentPosts?: { pillar: string; date: string }[];
  /** Optional: when refining after discovery, pass the discovery brief */
  discoveryBrief?: string;
  /** Optional: brand preferences to guide topic selection */
  brandContext?: {
    industry: string;
    audience: string[];
    tones: string[];
    contentStrategy: string;
    definition: string;
    copyGuideline: string;
  };
  /** Optional: session-level tone override */
  toneOverride?: string;
  /** Headlines already used — AI must not repeat these */
  usedHeadlines?: string[];
  signal?: AbortSignal;
}

export interface StrategistOutput {
  proposals: TopicProposal[];
  pillarAssessment: string;
  angleAssessment: string;
  currentPhase: string;
}

export async function runStrategist(
  input: StrategistInput,
): Promise<StrategistOutput> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  let extraContext = "";
  if (input.brandContext) {
    const bc = input.brandContext;
    const tone = input.toneOverride || bc.tones.join(", ");
    extraContext += `\n## Brand Preferences\n- Industry: ${bc.industry}\n- Target audience: ${bc.audience.join(", ")}\n- Tone/voice: ${tone}\n- Content strategy: ${bc.contentStrategy}\n- Brand definition: ${bc.definition}\n- Copy guidelines: ${bc.copyGuideline}\n\nUse these preferences to guide topic selection and angle framing.`;
  }
  if (input.recentPosts && input.recentPosts.length > 0) {
    extraContext += `\n## Recent Posts for Pillar Balance\n${JSON.stringify(input.recentPosts)}`;
  }
  if (input.usedHeadlines && input.usedHeadlines.length > 0) {
    const covered = summarizeCoveredTopics(input.usedHeadlines);
    extraContext += `\n## Already Covered Territory — Explore Different Ground\nThese topic areas have already been covered in past posts. Do NOT revisit them. Find fresh angles, different problems, or unexplored territory instead:\n${covered}`;
  }
  if (input.discoveryBrief) {
    extraContext += `\n## Discovery Brief (from Research)\n${input.discoveryBrief}\n\nUse this discovery data to sharpen your topic proposal. Return a single refined TopicProposal.`;
  }

  const systemPrompt = buildSystemPrompt("strategist", docs, extraContext);

  const userMessage = input.discoveryBrief
    ? "Refine the selected topic using the discovery brief data. Return a JSON object with: proposals (array with single sharpened TopicProposal), pillarAssessment (string), angleAssessment (string), currentPhase (string)."
    : "Analyze the current strategic context and propose 3-5 topic ideas. Return a JSON object with: proposals (TopicProposal[]), pillarAssessment (string), angleAssessment (string), currentPhase (string).";

  const { text } = await callAgentClaude({
    apiKey: input.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    userMessage,
    signal: input.signal,
    provider: input.provider,
    providerModel: input.providerModel,
  });

  return extractJson<StrategistOutput>(text);
}
