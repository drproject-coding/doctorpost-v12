import type { AiModel, AiProviderType } from "./types";
import { ONEFORALL_MODELS, STRAICO_MODELS } from "./constants";

export async function fetchModels(
  provider: AiProviderType,
  apiKey: string,
): Promise<{ models: AiModel[]; source: "api" | "fallback" }> {
  if (provider === "claude") {
    return { models: [], source: "fallback" };
  }

  // Both Straico and 1ForAll use the server-side /api/models endpoint
  // which hits the real upstream APIs (Straico v2, 1ForAll models API)
  try {
    if (!apiKey) {
      const fallback = provider === "1forall" ? ONEFORALL_MODELS : STRAICO_MODELS;
      return { models: [...fallback], source: "fallback" };
    }

    const headerKey =
      provider === "1forall" ? "x-oneforall-key" : "x-straico-key";

    const response = await fetch(`/api/models?provider=${provider}`, {
      method: "GET",
      headers: { [headerKey]: apiKey },
    });

    if (!response.ok) {
      throw new Error(`Models fetch failed (${response.status})`);
    }

    const data = await response.json();
    const models: AiModel[] = data.models || [];

    if (models.length > 0) {
      return { models, source: data.source || "api" };
    }

    const fallback = provider === "1forall" ? ONEFORALL_MODELS : STRAICO_MODELS;
    return { models: [...fallback], source: "fallback" };
  } catch {
    const fallback = provider === "1forall" ? ONEFORALL_MODELS : STRAICO_MODELS;
    return { models: [...fallback], source: "fallback" };
  }
}
