import type { AiRequest, AiResponse, OnProgress } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 4096;

export async function validateClaudeKey(apiKey: string): Promise<void> {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) throw new Error("Invalid API key");
    if (response.status === 403) throw new Error("API key lacks permission");
    throw new Error(`Validation failed (${response.status}): ${body}`);
  }
}

export async function callClaude(
  request: AiRequest,
  apiKey: string,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<AiResponse> {
  onProgress?.({ step: "Preparing request...", percent: 0 });

  onProgress?.({ step: "Sending to Claude...", percent: 20 });

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.userMessage }],
    }),
    signal,
  });

  onProgress?.({ step: "Processing response...", percent: 80 });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error("Claude API returned an empty response");
  }

  onProgress?.({ step: "Response received", percent: 100 });
  return { content: text, provider: "claude" };
}
