import type { AiRequest, AiResponse, OnProgress } from "./types";

const PROXY_URL = "/api/oneforall";
const DEFAULT_MAX_TOKENS = 4096;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;
const MAX_CONSECUTIVE_FAILURES = 3;

export async function validateOneForAllKey(apiKey: string): Promise<void> {
  const response = await fetch(`${PROXY_URL}?action=send-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oneforall-key": apiKey,
    },
    body: JSON.stringify({
      title: "Key validation",
      system_prompt: "Reply with ok",
      message: "ok",
      model: "gpt-4.1-nano",
      max_tokens: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid API key");
    }
    throw new Error(`Validation failed (${response.status}): ${body}`);
  }
}

export async function callOneForAll(
  request: AiRequest,
  apiKey: string,
  model: string,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<AiResponse> {
  // Step 1: Submit the request
  onProgress?.({ step: "Submitting request to 1ForAll...", percent: 0 });

  const submitResponse = await fetch(`${PROXY_URL}?action=send-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oneforall-key": apiKey,
    },
    body: JSON.stringify({
      title: "DoctorPost content generation",
      system_prompt: request.systemPrompt,
      message: request.userMessage,
      model: model,
      max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
    }),
    signal,
  });

  if (!submitResponse.ok) {
    const errorBody = await submitResponse.text();
    throw new Error(
      `1ForAll submit error (${submitResponse.status}): ${errorBody}`,
    );
  }

  const submitData = await submitResponse.json();

  // Some models respond immediately without a code_ref
  if (!submitData.code_ref && submitData.response) {
    onProgress?.({ step: "Response received", percent: 100 });
    return { content: submitData.response, provider: "1forall" };
  }

  const codeRef = submitData.code_ref;
  if (!codeRef) {
    throw new Error(
      "1ForAll API did not return a code_ref or immediate response",
    );
  }

  // Step 2: Poll for completion
  onProgress?.({
    step: "Request submitted. Polling for result...",
    percent: 10,
  });

  const startTime = Date.now();
  let consecutiveFailures = 0;

  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS, signal);

    let statusResult;
    try {
      const statusResponse = await fetch(
        `${PROXY_URL}?action=check-status&code_ref=${encodeURIComponent(codeRef)}`,
        {
          method: "GET",
          headers: { "x-oneforall-key": apiKey },
          signal,
        },
      );

      if (!statusResponse.ok) {
        throw new Error(`Poll request failed (${statusResponse.status})`);
      }

      statusResult = await statusResponse.json();
      consecutiveFailures = 0;

      // Log raw response to browser console for debugging
      console.log("[1forall] Poll response:", JSON.stringify(statusResult));
    } catch (error) {
      if (signal?.aborted) throw error;
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        throw new Error(
          `1ForAll polling failed after ${MAX_CONSECUTIVE_FAILURES} consecutive errors: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = Math.min(90, 10 + (elapsed / (POLL_TIMEOUT_MS / 1000)) * 80);
      onProgress?.({
        step: `Poll attempt failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}), retrying...`,
        percent: pct,
      });
      continue;
    }

    // Normalise status — API may return "completed", "complete", "done", "success"
    const rawStatus = (statusResult.status ?? "").toString().toLowerCase();
    const isSuccess = ["completed", "complete", "done", "success"].includes(
      rawStatus,
    );
    const isError = ["error", "failed", "failure"].includes(rawStatus);

    if (isSuccess) {
      // Response may live under several field names depending on model/version
      const content: string =
        statusResult.response ??
        statusResult.result ??
        statusResult.output ??
        statusResult.content ??
        statusResult.text ??
        statusResult.message;
      if (!content) {
        throw new Error(
          `1ForAll returned success status but no response content. Full response: ${JSON.stringify(statusResult)}`,
        );
      }
      onProgress?.({ step: "Response received", percent: 100 });
      return { content, provider: "1forall" };
    }

    if (isError) {
      throw new Error(
        `1ForAll processing error: ${statusResult.error ?? statusResult.message ?? "Unknown error"}`,
      );
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const pct = Math.min(90, 10 + (elapsed / (POLL_TIMEOUT_MS / 1000)) * 80);
    onProgress?.({
      step: `Processing... (${elapsed}s elapsed)`,
      percent: pct,
    });
  }

  throw new Error(
    `1ForAll polling timed out after ${POLL_TIMEOUT_MS / 1000} seconds`,
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
