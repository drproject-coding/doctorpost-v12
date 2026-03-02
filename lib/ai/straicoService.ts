import type {
  AiModel,
  AiRequest,
  AiResponse,
  OnProgress,
  StraicoUserInfo,
} from "./types";

const PROXY_URL = "/api/straico";

export async function validateStraicoKey(apiKey: string): Promise<void> {
  const response = await fetch(`${PROXY_URL}?action=user`, {
    method: "GET",
    headers: { "x-straico-key": apiKey },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid API key");
    }
    const body = await response.text();
    throw new Error(`Validation failed (${response.status}): ${body}`);
  }
}

interface StraicoRawModel {
  model?: string;
  name?: string;
  max_tokens?: number;
  word_limit?: number;
  pricing?: { coins?: number; words?: number };
  provider?: string;
  model_type?: string;
  editors_choice_level?: number;
  applications?: string[];
  features?: string[];
  pros?: string[];
  cons?: string[];
  icon?: string;
  model_date?: string;
}

export async function fetchStraicoModels(apiKey: string): Promise<AiModel[]> {
  const response = await fetch(`${PROXY_URL}?action=models`, {
    method: "GET",
    headers: { "x-straico-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }

  const data = await response.json();
  const models = data.data || data;

  if (!Array.isArray(models)) return [];

  return models.map((m: StraicoRawModel) => ({
    id: m.model || m.name || "",
    label: m.name || m.model || "",
    maxTokens: m.max_tokens ? { min: 1, max: m.max_tokens } : undefined,
    wordLimit: m.word_limit,
    pricing:
      m.pricing?.coins != null
        ? { coins: m.pricing.coins, words: m.pricing.words ?? 100 }
        : undefined,
    provider: m.provider,
    modelType: m.model_type,
    editorsChoiceLevel: m.editors_choice_level,
    applications: m.applications,
    features: m.features,
    pros: m.pros,
    cons: m.cons,
    icon: m.icon,
    modelDate: m.model_date,
  }));
}

export async function callStraico(
  request: AiRequest,
  apiKey: string,
  model: string,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<AiResponse> {
  onProgress?.({ step: "Preparing request...", percent: 0 });

  onProgress?.({ step: "Sending to Straico...", percent: 20 });

  const response = await fetch(`${PROXY_URL}?action=prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-straico-key": apiKey,
    },
    body: JSON.stringify({
      models: [model],
      message: `${request.systemPrompt}\n\n${request.userMessage}`,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
    }),
    signal,
  });

  onProgress?.({ step: "Processing response...", percent: 80 });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Straico API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  // Straico v1 response format (models array):
  // { data: { completions: { "model-name": { completion: { choices: [{ message: { content } }] } } } } }
  // Legacy format: { data: { completion: { choices: [{ message: { content } }] } } }
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

  onProgress?.({ step: "Response received", percent: 100 });
  return { content, provider: "straico" };
}

export async function fetchStraicoUserInfo(
  apiKey: string,
): Promise<StraicoUserInfo | null> {
  try {
    const response = await fetch(`${PROXY_URL}?action=user-info`, {
      method: "GET",
      headers: { "x-straico-key": apiKey },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const user = data.data || data;

    return {
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      coins: Number(user.coins) || 0,
      plan: user.plan || "",
    };
  } catch {
    return null;
  }
}
