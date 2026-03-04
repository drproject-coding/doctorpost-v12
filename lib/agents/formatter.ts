import type { KnowledgeDocument } from "../knowledge/types";
import type { FormattedPost, TopicProposal } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";

const config = AGENT_CONFIGS.formatter;

export interface FormatterInput {
  apiKey: string;
  provider?: "claude" | "straico" | "1forall";
  providerModel?: string;
  knowledge: KnowledgeDocument[];
  draft: string;
  score: number;
  topicCard: TopicProposal;
  template: string;
  signal?: AbortSignal;
}

export async function runFormatter(
  input: FormatterInput,
): Promise<FormattedPost> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  // Also inject the linkedin-post skill template for formatting specs
  const skillDoc = input.knowledge.find(
    (d) => d.category === "templates" && d.name === input.template,
  );
  const allDocs = skillDoc ? [...docs, skillDoc] : docs;

  const extraContext = `## Approved Draft (Score: ${input.score}/100)\n\n${input.draft}\n\n## Metadata\nTemplate: ${input.template}\nPillar: ${input.topicCard.pillar}\nAngle: ${input.topicCard.angle}`;

  const systemPrompt = buildSystemPrompt("formatter", allDocs, extraContext);

  const userMessage = `Format this approved draft for LinkedIn. Strip all markdown, verify see-more fold compliance, apply visual rhythm, count characters, and generate a suggested pinned comment. Return a FormattedPost JSON with: content (plain text), characterCount, hookBeforeFold ({mobile: bool, desktop: bool}), suggestedPinnedComment, metadata ({template, pillar, angle, score}).`;

  let text: string;
  try {
    const response = await callAgentClaude({
      apiKey: input.apiKey,
      model: config.model,
      maxTokens: config.maxTokens,
      systemPrompt,
      userMessage,
      signal: input.signal,
      provider: input.provider,
      providerModel: input.providerModel,
    });
    text = response.text;
  } catch (err) {
    throw new Error(
      `Formatter failed to call Claude API: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  try {
    return extractJson<FormattedPost>(text);
  } catch (err) {
    // If extraction fails, log the actual response for debugging
    const responsePreview = text.slice(0, 500);
    throw new Error(
      `Formatter extraction failed. Response preview: "${responsePreview}..." Error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
