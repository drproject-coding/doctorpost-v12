/**
 * lib/providers/image.ts
 *
 * Server-side image generation SDK.
 * All API shapes taken directly from the official specs:
 *   - Straico-Spec-API.json  →  POST /v1/image/generation
 *   - 1forall.ai-api.yaml    →  POST /v1/external/image/text-to-image/
 *
 * Use this from API routes — never call provider image APIs directly.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageRequest {
  /** The image description / prompt text */
  prompt: string;
  /** Desired aspect ratio — providers map this to their own size format */
  aspectRatio?: "1:1" | "2:3" | "3:2" | "9:16" | "16:9";
  /** Optional title used by 1ForAll (required by their API) */
  title?: string;
}

export interface ImageResult {
  imageUrl: string;
  provider: "straico" | "1forall";
  modelUsed: string;
}

export type ImageProvider = "straico" | "1forall";

// ---------------------------------------------------------------------------
// Defaults (confirmed model IDs from provider specs)
// ---------------------------------------------------------------------------

/** Straico image model — confirmed from v2/models endpoint, model_type: "image" */
export const STRAICO_DEFAULT_IMAGE_MODEL = "flux/1.1";

/** 1ForAll image model — confirmed code from /v1/external/image/models/ */
export const ONEFORALL_DEFAULT_IMAGE_MODEL = "dall-e";

// ---------------------------------------------------------------------------
// Endpoints (from specs)
// ---------------------------------------------------------------------------

const STRAICO_IMAGE_URL = "https://api.straico.com/v1/image/generation";
const ONEFORALL_IMAGE_SUBMIT_URL =
  "https://api.1forall.ai/v1/external/image/text-to-image/";
const ONEFORALL_IMAGE_STATUS_BASE =
  "https://api.1forall.ai/v1/external/image/check-status/";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------

/**
 * Generate an image using the specified provider.
 *
 * @param provider   - "straico" or "1forall"
 * @param apiKey     - Provider API key
 * @param model      - Provider-specific model ID (from their models list)
 * @param request    - Image request (prompt + optional aspect ratio)
 * @param onProgress - Optional callback: (step: string, percent: number) => void
 */
export async function generateImage(
  provider: ImageProvider,
  apiKey: string,
  model: string,
  request: ImageRequest,
  onProgress?: (step: string, percent: number) => void,
): Promise<ImageResult> {
  if (provider === "straico") {
    return generateStraicoImage(apiKey, model, request, onProgress);
  }
  return generateOneForAllImage(apiKey, model, request, onProgress);
}

// ---------------------------------------------------------------------------
// Straico image generation
// ---------------------------------------------------------------------------
// Spec: POST /v1/image/generation
// Auth: Authorization: Bearer <apiKey>
// Body: { model, description, size, variations }
//   - description  = prompt text (NOT "prompt")
//   - size         = "square" | "landscape" | "portrait"
//   - variations   = integer (NOT "n")
// Response: { data: { images: string[], zip?: string }, success: boolean }

function toStraicoSize(ratio: string): "square" | "landscape" | "portrait" {
  if (ratio === "1:1") return "square";
  if (ratio === "16:9") return "landscape";
  // 2:3, 3:2, 9:16 → portrait
  return "portrait";
}

async function generateStraicoImage(
  apiKey: string,
  model: string,
  request: ImageRequest,
  onProgress?: (step: string, percent: number) => void,
): Promise<ImageResult> {
  // Strip Midjourney-style flags (--ar, --style, etc.) — not understood by Straico
  const cleanPrompt = request.prompt
    .replace(/--\w[\w-]*(?:\s+\S+)?/g, "")
    .trim();
  const size = toStraicoSize(request.aspectRatio ?? "2:3");

  onProgress?.("Sending to Straico...", 50);

  const response = await fetch(STRAICO_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      description: cleanPrompt, // spec field name: "description"
      size,
      variations: 1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(
      `[providers/image] Straico error (${response.status}):`,
      errText,
    );
    throw new Error(`Straico image error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    data?: { images?: string[]; url?: string };
    success?: boolean;
  };
  console.log("[providers/image] Straico response:", JSON.stringify(data));

  const url = data?.data?.images?.[0] ?? data?.data?.url;
  if (!url) {
    throw new Error(
      `Straico returned no image URL. Response: ${JSON.stringify(data)}`,
    );
  }

  onProgress?.("Image generated!", 95);
  return { imageUrl: url, provider: "straico", modelUsed: model };
}

// ---------------------------------------------------------------------------
// 1ForAll image generation (async — poll for result)
// ---------------------------------------------------------------------------
// Spec: POST /v1/external/image/text-to-image/
// Auth: Authorization: Api-Key <apiKey>
// Body: { title, text, model, size }
//   - text  = prompt text (NOT "prompt" or "description")
//   - model = model code (e.g. "dall-e", "leonardo-phoenix-fast")
//   - size  = ratio string (e.g. "1:1", "2:3", "9:16")
// Response: { code_ref } → poll /check-status/{code_ref}/ → { status, image_url? }

async function generateOneForAllImage(
  apiKey: string,
  model: string,
  request: ImageRequest,
  onProgress?: (step: string, percent: number) => void,
): Promise<ImageResult> {
  const cleanPrompt = request.prompt
    .replace(/--\w[\w-]*(?:\s+\S+)?/g, "")
    .trim();
  const size = request.aspectRatio ?? "1:1";

  onProgress?.("Sending to 1ForAll...", 45);

  const submitRes = await fetch(ONEFORALL_IMAGE_SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${apiKey}`,
    },
    body: JSON.stringify({
      title: request.title ?? "DoctorPost image",
      text: cleanPrompt, // spec field name: "text"
      model,
      size,
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    console.error(
      `[providers/image] 1ForAll submit error (${submitRes.status}):`,
      errText,
    );
    throw new Error(
      `1ForAll image submit error (${submitRes.status}): ${errText}`,
    );
  }

  const submitData = (await submitRes.json()) as {
    code_ref?: string;
    image_url?: string;
    url?: string;
    images?: string[];
  };

  // Some models respond immediately (no polling needed)
  const immediate =
    submitData.image_url ?? submitData.url ?? submitData.images?.[0];
  if (immediate) {
    onProgress?.("Image generated!", 95);
    return { imageUrl: immediate, provider: "1forall", modelUsed: model };
  }

  const codeRef = submitData.code_ref;
  if (!codeRef) {
    throw new Error(
      `1ForAll image API returned no code_ref. Response: ${JSON.stringify(submitData)}`,
    );
  }

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const pct = Math.min(90, 50 + (elapsed / (POLL_TIMEOUT_MS / 1000)) * 40);
    onProgress?.(`Processing image... (${elapsed}s)`, Math.round(pct));

    const statusRes = await fetch(
      `${ONEFORALL_IMAGE_STATUS_BASE}${encodeURIComponent(codeRef)}/`,
      { headers: { Authorization: `Api-Key ${apiKey}` } },
    );

    if (!statusRes.ok) continue;

    const statusData = (await statusRes.json()) as {
      status?: string;
      image_url?: string;
      url?: string;
      images?: string[];
      output?: string;
    };

    const rawStatus = (statusData.status ?? "").toLowerCase();

    if (["completed", "complete", "done", "success"].includes(rawStatus)) {
      const url =
        statusData.image_url ??
        statusData.url ??
        statusData.images?.[0] ??
        statusData.output;
      if (!url) {
        throw new Error(
          `1ForAll image succeeded but no URL found. Response: ${JSON.stringify(statusData)}`,
        );
      }
      onProgress?.("Image generated!", 95);
      return { imageUrl: url, provider: "1forall", modelUsed: model };
    }

    if (["error", "failed", "failure"].includes(rawStatus)) {
      throw new Error(
        `1ForAll image generation failed: ${JSON.stringify(statusData)}`,
      );
    }
  }

  throw new Error("1ForAll image generation timed out after 120 seconds");
}
