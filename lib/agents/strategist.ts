import type { KnowledgeDocument } from "../knowledge/types";
import type { TopicProposal } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";

const config = AGENT_CONFIGS.strategist;

export interface StrategistInput {
  apiKey: string;
  knowledge: KnowledgeDocument[];
  /** Optional: recent posts for pillar balance analysis */
  recentPosts?: { pillar: string; date: string }[];
  /** Optional: when refining after discovery, pass the discovery brief */
  discoveryBrief?: string;
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
  if (input.recentPosts && input.recentPosts.length > 0) {
    extraContext += `\n## Recent Posts for Pillar Balance\n${JSON.stringify(input.recentPosts)}`;
  }
  if (input.discoveryBrief) {
    extraContext += `\n## Discovery Brief (from Research)\n${input.discoveryBrief}\n\nUse this discovery data to sharpen your topic proposal. Return a single refined TopicProposal.`;
  }

  const systemPrompt = buildSystemPrompt("strategist", docs, extraContext);

  const userMessage = input.discoveryBrief
    ? "Refine the selected topic using the discovery brief data. Return a JSON object with: proposals (array with one sharpened TopicProposal), pillarAssessment (string), angleAssessment (string), currentPhase (string)."
    : "Analyze the current strategic context and propose 3-5 topic ideas. Return a JSON object with: proposals (TopicProposal[]), pillarAssessment (string), angleAssessment (string), currentPhase (string).";

  const { text } = await callAgentClaude({
    apiKey: input.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    userMessage,
    signal: input.signal,
  });

  return extractJson<StrategistOutput>(text);
}
