// SSE event types sent to client
export interface SSEToken {
  type: "token";
  content: string;
}

export interface SSEStageComplete {
  type: "stage_complete";
  stage: string;
  metadata?: Record<string, unknown>;
}

export interface SSEDone {
  type: "done";
  metadata?: Record<string, unknown>;
}

export interface SSEError {
  type: "error";
  message: string;
  code?: string;
}

export type SSEEvent = SSEToken | SSEStageComplete | SSEDone | SSEError;

// Send function type
export type SSESendFn = (event: SSEEvent) => void;

const SSE_HEADERS: HeadersInit = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/**
 * Creates a streaming SSE Response.
 * The handler receives a send function and should call it for each event.
 * A final `done` event is automatically sent when the handler completes.
 */
export function createSSEResponse(
  handler: (send: SSESendFn) => Promise<void>,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SSESendFn = (event: SSEEvent): void => {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        await handler(send);
        send({ type: "done" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

/**
 * Parses an SSE stream on the client side.
 * Returns an async generator that yields SSEEvent objects.
 * Stops when a `done` event is received or the stream ends.
 */
export async function* parseSSEStream(
  response: Response,
): AsyncGenerator<SSEEvent> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush any remaining buffer content
        if (buffer.trim()) {
          const event = parseSSEChunk(buffer);
          if (event !== null) {
            yield event;
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split on double newlines (SSE message separator)
      const parts = buffer.split("\n\n");

      // The last element may be an incomplete message — keep it in the buffer
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const event = parseSSEChunk(trimmed);
        if (event === null) continue;

        yield event;

        if (event.type === "done") {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parses a single SSE message chunk into an SSEEvent.
 * Returns null if the chunk cannot be parsed.
 */
function parseSSEChunk(chunk: string): SSEEvent | null {
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      const jsonStr = trimmed.slice("data: ".length);
      try {
        return JSON.parse(jsonStr) as SSEEvent;
      } catch {
        return null;
      }
    }
  }
  return null;
}
