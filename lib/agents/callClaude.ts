import { MODEL_IDS, type AgentConfig } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeApiResponse {
  content: { type: string; text: string }[];
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Shared Claude API call for all agents.
 * Returns the raw text response from Claude.
 */
export async function callAgentClaude(params: {
  apiKey: string;
  model: AgentConfig["model"];
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
}): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL_IDS[params.model],
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.userMessage }],
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errBody}`);
  }

  const data = (await response.json()) as ClaudeApiResponse;
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error("Claude API returned an empty response");
  }

  const tokensUsed =
    (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

  return { text, tokensUsed };
}
