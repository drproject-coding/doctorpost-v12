import type { AiModel, AiProviderType } from "./types";
import { ONEFORALL_MODELS, STRAICO_MODELS } from "./constants";
import { fetchStraicoModels } from "./straicoService";

export async function fetchModels(
  provider: AiProviderType,
  apiKey: string,
): Promise<{ models: AiModel[]; source: "api" | "fallback" }> {
  if (provider === "claude") {
    return { models: [], source: "fallback" };
  }

  if (provider === "1forall") {
    // 1ForAll has no model listing endpoint — use static list
    return { models: [...ONEFORALL_MODELS], source: "fallback" };
  }

  // Straico: fetch enriched models from API
  try {
    if (!apiKey) {
      return { models: [...STRAICO_MODELS], source: "fallback" };
    }
    const models = await fetchStraicoModels(apiKey);
    if (models.length > 0) {
      return { models, source: "api" };
    }
    return { models: [...STRAICO_MODELS], source: "fallback" };
  } catch {
    return { models: [...STRAICO_MODELS], source: "fallback" };
  }
}
