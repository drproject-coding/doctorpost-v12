import type { KnowledgeDocument } from "../knowledge/types";
import type { TopicProposal, EvidencePack } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";

const config = AGENT_CONFIGS.writer;

export interface WriterInput {
  apiKey: string;
  provider?: "claude" | "straico" | "1forall";
  providerModel?: string;
  knowledge: KnowledgeDocument[];
  topicCard: TopicProposal;
  evidencePack: EvidencePack;
  /** Template name to use (e.g. "strong-opinion") */
  template: string;
  /** If rewriting, the previous draft + scorer feedback */
  rewriteContext?: {
    previousDraft: string;
    scorerFeedback: string;
    attemptNumber: number;
  };
  signal?: AbortSignal;
}

export interface WriterOutput {
  content: string;
  template: string;
  hookCategory: string;
  wordCount: number;
  selfCheckPassed: boolean;
  selfCheckNotes: string[];
}

export async function runWriter(input: WriterInput): Promise<WriterOutput> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  // Also inject the specific template and hook library docs
  const templateDoc = input.knowledge.find(
    (d) => d.category === "templates" && d.name === input.template,
  );
  const hookDocs = input.knowledge.filter(
    (d) => d.category === "library" && d.subcategory === "hooks",
  );
  const closerDoc = input.knowledge.find(
    (d) => d.category === "library" && d.name === "closers",
  );
  const ctaDoc = input.knowledge.find(
    (d) => d.category === "library" && d.name === "ctas",
  );

  const extraDocs = [templateDoc, ...hookDocs, closerDoc, ctaDoc].filter(
    (d): d is KnowledgeDocument => d !== undefined,
  );

  const allDocs = [...docs, ...extraDocs];

  let extraContext = `## Topic Card\n${JSON.stringify(input.topicCard, null, 2)}\n\n## Evidence Pack\n${JSON.stringify(input.evidencePack, null, 2)}`;

  if (input.rewriteContext) {
    extraContext += `\n\n## REWRITE REQUEST (Attempt ${input.rewriteContext.attemptNumber}/3)\n\n### Previous Draft\n${input.rewriteContext.previousDraft}\n\n### Scorer Feedback\n${input.rewriteContext.scorerFeedback}\n\nAddress ALL feedback points. Improve the score while maintaining brand voice.`;
  }

  const systemPrompt = buildSystemPrompt("writer", allDocs, extraContext);

  const userMessage = input.rewriteContext
    ? `Rewrite the draft addressing all scorer feedback. This is attempt ${input.rewriteContext.attemptNumber} of 3. Return a JSON object with: content (string), template (string), hookCategory (string), wordCount (number), selfCheckPassed (boolean), selfCheckNotes (string[]).`
    : `Write a LinkedIn post using the "${input.template}" template for the given topic card and evidence pack. Embed evidence naturally. Run a self-check against all hard rules before outputting. Return a JSON object with: content (string), template (string), hookCategory (string), wordCount (number), selfCheckPassed (boolean), selfCheckNotes (string[]).`;

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

  return extractJson<WriterOutput>(text);
}
