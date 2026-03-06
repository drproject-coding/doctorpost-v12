import type { AiModel, AiProviderType } from "./types";
import {
  ONEFORALL_MODELS,
  STRAICO_MODELS,
  ONEFORALL_IMAGE_MODELS,
  STRAICO_IMAGE_MODELS,
} from "./constants";

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
      const fallback =
        provider === "1forall" ? ONEFORALL_MODELS : STRAICO_MODELS;
      return { models: [...fallback], source: "fallback" };
    }

    const headerKey =
      provider === "1forall" ? "x-oneforall-key" : "x-straico-key";

    const typeParam = provider === "straico" ? "&type=all" : "";
    const response = await fetch(
      `/api/models?provider=${provider}${typeParam}`,
      { method: "GET", headers: { [headerKey]: apiKey } },
    );

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

export async function fetchImageModels(
  provider: "straico" | "1forall",
  apiKey: string,
): Promise<{ models: AiModel[]; source: "api" | "fallback" }> {
  const fallback =
    provider === "1forall" ? ONEFORALL_IMAGE_MODELS : STRAICO_IMAGE_MODELS;

  if (!apiKey) {
    return { models: [...fallback], source: "fallback" };
  }

  try {
    const headerKey =
      provider === "1forall" ? "x-oneforall-key" : "x-straico-key";

    const response = await fetch(
      `/api/models?provider=${provider}&type=image`,
      { method: "GET", headers: { [headerKey]: apiKey } },
    );

    if (!response.ok) {
      throw new Error(`Image models fetch failed (${response.status})`);
    }

    const data = await response.json();
    const models: AiModel[] = data.models || [];
    return models.length > 0
      ? { models, source: data.source || "api" }
      : { models: [...fallback], source: "fallback" };
  } catch {
    return { models: [...fallback], source: "fallback" };
  }
}
