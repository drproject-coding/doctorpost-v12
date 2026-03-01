import type { AiRequest, AiResponse, AiSettings, OnProgress } from "./types";
import { callClaude } from "./claudeService";
import { callOneForAll } from "./oneforallService";

/**
 * Server-side AI call. Sends the request to the /api/ai route
 * which resolves API keys from the user's profile.
 * Use this from client-side code to avoid exposing keys in the browser.
 */
export async function generateViaServer(
  request: AiRequest,
  signal?: AbortSignal,
): Promise<AiResponse> {
  const res = await fetch("/api/ai", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
    signal,
  });
  if (!res.ok) {
    let msg = `AI request failed (${res.status})`;
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {
      // not JSON
    }
    throw new Error(msg);
  }
  return res.json() as Promise<AiResponse>;
}

export async function generateWithAi(
  request: AiRequest,
  settings: AiSettings,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<AiResponse> {
  switch (settings.activeProvider) {
    case "claude": {
      if (!settings.claudeApiKey) {
        throw new Error(
          "Claude API key is not configured. Please add your Claude API key in Settings.",
        );
      }
      return callClaude(request, settings.claudeApiKey, onProgress, signal);
    }

    case "1forall": {
      if (!settings.oneforallApiKey) {
        throw new Error(
          "1ForAll API key is not configured. Please add your 1ForAll API key in Settings.",
        );
      }
      return callOneForAll(
        request,
        settings.oneforallApiKey,
        settings.oneforallModel,
        onProgress,
        signal,
      );
    }

    case "straico": {
      if (!settings.straicoApiKey) {
        throw new Error(
          "Straico API key is not configured. Please add your Straico API key in Settings.",
        );
      }
      const { callStraico } = await import("./straicoService");
      return callStraico(
        request,
        settings.straicoApiKey,
        settings.straicoModel,
        onProgress,
        signal,
      );
    }

    default:
      throw new Error(`Unsupported AI provider: ${settings.activeProvider}`);
  }
}
