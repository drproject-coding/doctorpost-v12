/**
 * Template Extractor agent — deconstructs admired posts into templates.
 * Uses Haiku for speed (simple extraction task).
 */

import { callAgentClaude } from "./callClaude";
import { extractJson, validateFields } from "./structuredOutput";

export interface ExtractedTemplate {
  name: string;
  structure: string;
  hookPattern: string;
  closerPattern: string;
  estimatedLength: number;
  toneNotes: string;
  exampleHooks: string[];
}

export async function extractTemplate(
  postContent: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ExtractedTemplate> {
  const systemPrompt = `You are a LinkedIn content analyst. Your job is to deconstruct a LinkedIn post into a reusable template.

Analyze the structure, hook pattern, closer pattern, and tone. Output a template that could be used to write similar posts on different topics.

Return a JSON object with:
- name: short template name (e.g. "contrarian-opener", "data-driven-story")
- structure: the post structure as a numbered outline with placeholder descriptions
- hookPattern: describe the hook pattern used (e.g. "bold contrarian claim + supporting context + curiosity gap")
- closerPattern: describe how the post ends (e.g. "personal experience callback + one-liner takeaway")
- estimatedLength: approximate character count
- toneNotes: notes on the tone and voice style
- exampleHooks: 2-3 example hooks that follow the same pattern but on different topics`;

  const userMessage = `Deconstruct this LinkedIn post into a reusable template:\n\n${postContent}`;

  const { text } = await callAgentClaude({
    apiKey,
    model: "haiku",
    maxTokens: 2048,
    systemPrompt,
    userMessage,
    signal,
  });

  const result = extractJson<ExtractedTemplate>(text);
  validateFields(result as unknown as Record<string, unknown>, [
    "name",
    "structure",
    "hookPattern",
    "closerPattern",
    "estimatedLength",
    "toneNotes",
    "exampleHooks",
  ]);
  return result;
}
