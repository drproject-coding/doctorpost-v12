import type { KnowledgeDocument } from "../knowledge/types";
import type { ScoreResult, TopicProposal } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";

const config = AGENT_CONFIGS.scorer;

export interface ScorerInput {
  apiKey: string;
  knowledge: KnowledgeDocument[];
  draft: string;
  topicCard: TopicProposal;
  /** If re-scoring after rewrite, pass the previous score */
  previousScore?: ScoreResult;
  signal?: AbortSignal;
}

export async function runScorer(input: ScorerInput): Promise<ScoreResult> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  let extraContext = `## Draft to Score\n\n${input.draft}\n\n## Topic Card\n${JSON.stringify(input.topicCard, null, 2)}`;

  if (input.previousScore) {
    extraContext += `\n\n## Previous Score: ${input.previousScore.totalScore}/100\nThis is a re-score after rewrite. Compare improvements.`;
  }

  const systemPrompt = buildSystemPrompt("scorer", docs, extraContext);

  const userMessage = `Score this draft against the 100-point grid and 40-point pre-publish checklist. Count hook character lengths precisely. Return a ScoreResult JSON with: totalScore, criteriaScores (hook, strategicRelevance, structureRhythm, toneStyle, contentValue, conclusionCTA, bonusPenalty), checklist, checklistScore, verdict ("publish"|"minor-tweaks"|"rework"|"rewrite"|"scrap"), and rewriteInstructions if verdict is "rewrite" or "scrap".`;

  const { text } = await callAgentClaude({
    apiKey: input.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    userMessage,
    signal: input.signal,
  });

  return extractJson<ScoreResult>(text);
}
