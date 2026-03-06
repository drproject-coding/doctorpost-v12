import { MODEL_IDS, type AgentConfig } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const STRAICO_API_URL = "https://api.straico.com/v1/prompt/completion";
const ONEFORALL_SUBMIT_URL =
  "https://api.1forall.ai/v1/external/llm/send-request/";
const ONEFORALL_STATUS_URL =
  "https://api.1forall.ai/v1/external/llm/check-status/";

const ONEFORALL_POLL_INTERVAL_MS = 2000;
const ONEFORALL_POLL_TIMEOUT_MS = 120000;
const ONEFORALL_MAX_POLL_FAILURES = 3;

interface ClaudeApiResponse {
  content: { type: string; text: string }[];
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Shared AI API call for all pipeline agents.
 * Routes to Claude, Straico, or 1ForAll based on provider param.
 * Defaults to Claude for backwards compatibility.
 */
export async function callAgentClaude(params: {
  apiKey: string;
  model: AgentConfig["model"];
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  /** AI provider to use. Defaults to "claude". */
  provider?: "claude" | "straico" | "1forall";
  /** Model ID for non-Claude providers (e.g. "openai/gpt-4o-mini"). */
  providerModel?: string;
}): Promise<{ text: string; tokensUsed: number }> {
  const provider = params.provider || "claude";

  switch (provider) {
    case "straico":
      return callStraicoDirect(params);
    case "1forall":
      return callOneForAllDirect(params);
    default:
      return callClaudeDirect(params);
  }
}

// ── Claude (Anthropic) ──

async function callClaudeDirect(params: {
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

// ── Straico ──

async function callStraicoDirect(params: {
  apiKey: string;
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  providerModel?: string;
}): Promise<{ text: string; tokensUsed: number }> {
  const model = params.providerModel || "openai/gpt-4o-mini";

  const response = await fetch(STRAICO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      models: [model],
      message: `${params.systemPrompt}\n\n${params.userMessage}`,
      max_tokens: params.maxTokens,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Straico API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  // Parse response - handle both new and legacy formats
  let content: string | undefined;

  // New format: completions keyed by model name
  const completions = data.data?.completions;
  if (completions && typeof completions === "object") {
    const firstModel = Object.values(completions)[0] as
      | Record<string, unknown>
      | undefined;
    const completion = firstModel?.completion as
      | Record<string, unknown>
      | undefined;
    const choices = completion?.choices as
      | { message?: { content?: string } }[]
      | undefined;
    content = choices?.[0]?.message?.content;
  }

  // Fallback: legacy format
  if (!content) {
    content =
      data.data?.completion?.choices?.[0]?.message?.content ||
      data.completion?.choices?.[0]?.message?.content ||
      data.data?.completion?.response ||
      data.completion?.response ||
      data.response ||
      data.data?.response;
  }

  if (!content) {
    throw new Error("Straico API returned an empty response");
  }

  return { text: content, tokensUsed: 0 };
}

// ── 1ForAll ──

async function callOneForAllDirect(params: {
  apiKey: string;
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  providerModel?: string;
}): Promise<{ text: string; tokensUsed: number }> {
  const model = params.providerModel || "anthropic/claude-4-sonnet";

  // Validate required fields
  if (!params.systemPrompt) {
    throw new Error("systemPrompt is required but empty");
  }
  if (!params.userMessage) {
    throw new Error("userMessage is required but empty");
  }
  if (!model) {
    throw new Error("model is required but empty");
  }

  const requestBody = {
    title: "DoctorPost content generation",
    system_prompt: params.systemPrompt,
    message: params.userMessage,
    model,
    max_tokens: params.maxTokens,
  };

  // Log request for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log("[1forall] Sending request:", {
      model,
      max_tokens: params.maxTokens,
      systemPromptLength: params.systemPrompt.length,
      messageLength: params.userMessage.length,
    });
  }

  // Step 1: Submit request
  const submitResponse = await fetch(ONEFORALL_SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${params.apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: params.signal,
  });

  if (!submitResponse.ok) {
    const errBody = await submitResponse.text();
    throw new Error(
      `1ForAll submit error (${submitResponse.status}): ${errBody}`,
    );
  }

  const submitData = await submitResponse.json();

  // Some models respond immediately
  if (!submitData.code_ref && submitData.response) {
    return { text: submitData.response, tokensUsed: 0 };
  }

  const codeRef = submitData.code_ref;
  if (!codeRef) {
    throw new Error(
      "1ForAll API did not return a code_ref or immediate response",
    );
  }

  // Step 2: Poll for completion
  const startTime = Date.now();
  let consecutiveFailures = 0;

  while (Date.now() - startTime < ONEFORALL_POLL_TIMEOUT_MS) {
    await sleep(ONEFORALL_POLL_INTERVAL_MS, params.signal);

    let statusResult;
    try {
      const statusResponse = await fetch(
        `${ONEFORALL_STATUS_URL}${encodeURIComponent(codeRef)}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Api-Key ${params.apiKey}`,
          },
          signal: params.signal,
        },
      );

      if (!statusResponse.ok) {
        throw new Error(`Poll request failed (${statusResponse.status})`);
      }

      statusResult = await statusResponse.json();
      consecutiveFailures = 0;
    } catch (error) {
      if (params.signal?.aborted) throw error;
      consecutiveFailures++;
      if (consecutiveFailures >= ONEFORALL_MAX_POLL_FAILURES) {
        throw new Error(
          `1ForAll polling failed after ${ONEFORALL_MAX_POLL_FAILURES} consecutive errors: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      continue;
    }

    // Log raw response for debugging
    console.log("[1forall] Poll response:", JSON.stringify(statusResult));

    // Normalise status — API may return "completed", "complete", "done", "success"
    const rawStatus = (statusResult.status ?? "").toString().toLowerCase();
    const isSuccess = ["completed", "complete", "done", "success"].includes(
      rawStatus,
    );
    const isError = ["error", "failed", "failure"].includes(rawStatus);

    if (isSuccess) {
      const text: string =
        statusResult.response ??
        statusResult.result ??
        statusResult.output ??
        statusResult.content ??
        statusResult.text ??
        statusResult.message;
      if (!text) {
        throw new Error(
          `1ForAll returned success but no response content. Full response: ${JSON.stringify(statusResult)}`,
        );
      }
      return { text, tokensUsed: 0 };
    }

    if (isError) {
      throw new Error(
        `1ForAll processing error: ${statusResult.error ?? statusResult.message ?? "Unknown error"}`,
      );
    }
  }

  throw new Error(
    `1ForAll polling timed out after ${ONEFORALL_POLL_TIMEOUT_MS / 1000} seconds`,
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
