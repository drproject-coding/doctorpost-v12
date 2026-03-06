/**
 * Tests for lib/ai/aiService.ts, claudeService.ts, oneforallService.ts, straicoService.ts
 *
 * All external fetch calls are mocked. No real API calls are made.
 *
 * Strategy for straicoService:
 *   - aiService.ts uses `await import("./straicoService")` (dynamic import) when
 *     activeProvider === "straico". We mock that module so the routing tests work.
 *   - For direct tests of straicoService functions we use jest.requireActual to get
 *     the real implementations and supply our own fetch mock.
 */

// Must be before any imports that use fetch.
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the straicoService module. This controls the dynamic-import path inside
// aiService.ts. We give every export a jest.fn() so the auto-mock doesn't
// turn them into `undefined`.
jest.mock("../../../lib/ai/straicoService", () => ({
  callStraico: jest.fn(),
  validateStraicoKey: jest.fn(),
  fetchStraicoModels: jest.fn(),
  fetchStraicoUserInfo: jest.fn(),
}));

// Pull in the MOCKED module reference (used for routing tests).
import * as straicoServiceMock from "../../../lib/ai/straicoService";

// Pull in the REAL implementations (used for straico unit tests).
const {
  callStraico: realCallStraico,
  validateStraicoKey: realValidateStraicoKey,
  fetchStraicoModels: realFetchStraicoModels,
  fetchStraicoUserInfo: realFetchStraicoUserInfo,
} = jest.requireActual(
  "../../../lib/ai/straicoService",
) as typeof import("../../../lib/ai/straicoService");

import { generateViaServer, generateWithAi } from "../../../lib/ai/aiService";
import { callClaude, validateClaudeKey } from "../../../lib/ai/claudeService";
import {
  callOneForAll,
  validateOneForAllKey,
} from "../../../lib/ai/oneforallService";
import { fetchModels } from "../../../lib/ai/modelService";
import type { AiRequest, AiSettings } from "../../../lib/ai/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockOkResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

function mockErrorResponse(status: number, body = "error body") {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error: body }),
    text: jest.fn().mockResolvedValue(body),
  };
}

const baseRequest: AiRequest = {
  systemPrompt: "You are a helpful assistant.",
  userMessage: "Write a LinkedIn post about AI.",
};

const claudeSettings: AiSettings = {
  activeProvider: "claude",
  claudeApiKey: "sk-ant-test",
  straicoApiKey: "",
  straicoModel: "openai/gpt-4o-mini",
  straicoImageModel: "",
  oneforallApiKey: "",
  oneforallModel: "anthropic/claude-4-sonnet",
  oneforallImageModel: "",
};

// ─── generateViaServer ───────────────────────────────────────────────────────

describe("generateViaServer", () => {
  beforeEach(() => mockFetch.mockReset());

  it("POSTs to /api/ai and returns parsed AiResponse", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: "Great post!", provider: "claude" }),
    );

    const result = await generateViaServer(baseRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: baseRequest }),
      }),
    );
    expect(result).toEqual({ content: "Great post!", provider: "claude" });
  });

  it("forwards an AbortSignal to fetch", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: "ok", provider: "claude" }),
    );
    const controller = new AbortController();
    await generateViaServer(baseRequest, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("throws with server error message when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
    });

    await expect(generateViaServer(baseRequest)).rejects.toThrow(
      "Internal server error",
    );
  });

  it("throws generic message when error body is not JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: jest.fn().mockRejectedValue(new SyntaxError("not JSON")),
    });

    await expect(generateViaServer(baseRequest)).rejects.toThrow(
      "AI request failed (503)",
    );
  });

  it("throws generic message when error JSON has no error field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ message: "rate limited" }),
    });

    await expect(generateViaServer(baseRequest)).rejects.toThrow(
      "AI request failed (429)",
    );
  });
});

// ─── generateWithAi – provider routing ──────────────────────────────────────

describe("generateWithAi – provider routing", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  it("routes 'claude' provider to callClaude", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "Claude response" }] }),
    );

    const result = await generateWithAi(baseRequest, claudeSettings);
    expect(result.provider).toBe("claude");
    expect(result.content).toBe("Claude response");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.any(Object),
    );
  });

  it("throws when claude provider has no API key", async () => {
    await expect(
      generateWithAi(baseRequest, { ...claudeSettings, claudeApiKey: "" }),
    ).rejects.toThrow("Claude API key is not configured");
  });

  it("routes '1forall' provider to callOneForAll (immediate response)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ response: "1ForAll response" }),
    );

    const settings: AiSettings = {
      ...claudeSettings,
      activeProvider: "1forall",
      oneforallApiKey: "ofa-key-123",
    };

    const result = await generateWithAi(baseRequest, settings);
    expect(result.provider).toBe("1forall");
    expect(result.content).toBe("1ForAll response");
  });

  it("throws when 1forall provider has no API key", async () => {
    await expect(
      generateWithAi(baseRequest, {
        ...claudeSettings,
        activeProvider: "1forall",
        oneforallApiKey: "",
      }),
    ).rejects.toThrow("1ForAll API key is not configured");
  });

  it("routes 'straico' provider via dynamic import to callStraico", async () => {
    const mockedCallStraico = straicoServiceMock.callStraico as jest.Mock;
    mockedCallStraico.mockResolvedValueOnce({
      content: "Straico response",
      provider: "straico",
    });

    const settings: AiSettings = {
      ...claudeSettings,
      activeProvider: "straico",
      straicoApiKey: "straico-key-123",
      straicoModel: "openai/gpt-4o-mini",
    };

    const result = await generateWithAi(baseRequest, settings);
    expect(result.provider).toBe("straico");
    expect(result.content).toBe("Straico response");
    expect(mockedCallStraico).toHaveBeenCalledWith(
      baseRequest,
      "straico-key-123",
      "openai/gpt-4o-mini",
      undefined,
      undefined,
    );
  });

  it("throws when straico provider has no API key", async () => {
    await expect(
      generateWithAi(baseRequest, {
        ...claudeSettings,
        activeProvider: "straico",
        straicoApiKey: "",
      }),
    ).rejects.toThrow("Straico API key is not configured");
  });

  it("throws for unsupported provider", async () => {
    await expect(
      generateWithAi(baseRequest, {
        ...claudeSettings,
        activeProvider: "unknown" as AiSettings["activeProvider"],
      }),
    ).rejects.toThrow("Unsupported AI provider: unknown");
  });

  it("passes onProgress and signal through to the provider", async () => {
    const onProgress = jest.fn();
    const controller = new AbortController();

    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "ok" }] }),
    );

    await generateWithAi(
      baseRequest,
      claudeSettings,
      onProgress,
      controller.signal,
    );
    expect(onProgress).toHaveBeenCalled();
  });
});

// ─── callClaude ──────────────────────────────────────────────────────────────

describe("callClaude", () => {
  beforeEach(() => mockFetch.mockReset());

  const API_KEY = "sk-ant-test-key";

  it("sends correct headers and body to Anthropic API", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "Hello!" }] }),
    );

    await callClaude(baseRequest, API_KEY);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(options.method).toBe("POST");
    expect(options.headers["x-api-key"]).toBe(API_KEY);
    expect(options.headers["anthropic-version"]).toBe("2023-06-01");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.system).toBe(baseRequest.systemPrompt);
    expect(body.messages).toEqual([
      { role: "user", content: baseRequest.userMessage },
    ]);
  });

  it("uses default max_tokens (4096) when not specified", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "ok" }] }),
    );
    await callClaude(baseRequest, API_KEY);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(4096);
  });

  it("uses request.maxTokens when provided", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "ok" }] }),
    );
    await callClaude({ ...baseRequest, maxTokens: 1024 }, API_KEY);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(1024);
  });

  it("returns AiResponse with provider=claude", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "Generated content" }] }),
    );
    const result = await callClaude(baseRequest, API_KEY);
    expect(result).toEqual({
      content: "Generated content",
      provider: "claude",
    });
  });

  it("calls onProgress at 0% first and 100% last", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "ok" }] }),
    );
    const onProgress = jest.fn();
    await callClaude(baseRequest, API_KEY, onProgress);

    const calls = onProgress.mock.calls.map((c) => c[0]);
    expect(calls[0].percent).toBe(0);
    expect(calls[calls.length - 1].percent).toBe(100);
  });

  it("throws on 401 unauthorised response", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(401, "Unauthorized"));
    await expect(callClaude(baseRequest, API_KEY)).rejects.toThrow(
      "Claude API error (401): Unauthorized",
    );
  });

  it("throws on rate limit (429)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockErrorResponse(429, "Rate limit exceeded"),
    );
    await expect(callClaude(baseRequest, API_KEY)).rejects.toThrow(
      "Claude API error (429): Rate limit exceeded",
    );
  });

  it("throws when content array is empty", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ content: [] }));
    await expect(callClaude(baseRequest, API_KEY)).rejects.toThrow(
      "Claude API returned an empty response",
    );
  });

  it("throws when content[0].text is missing", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ type: "text" }] }),
    );
    await expect(callClaude(baseRequest, API_KEY)).rejects.toThrow(
      "Claude API returned an empty response",
    );
  });

  it("forwards AbortSignal to fetch", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "ok" }] }),
    );
    const controller = new AbortController();
    await callClaude(baseRequest, API_KEY, undefined, controller.signal);
    expect(mockFetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("handles very long prompts without truncation", async () => {
    const longMessage = "A".repeat(100_000);
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "response to long prompt" }] }),
    );
    const result = await callClaude(
      { ...baseRequest, userMessage: longMessage },
      API_KEY,
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toBe(longMessage);
    expect(result.content).toBe("response to long prompt");
  });
});

// ─── validateClaudeKey ───────────────────────────────────────────────────────

describe("validateClaudeKey", () => {
  beforeEach(() => mockFetch.mockReset());

  it("resolves without error when key is valid (200)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ content: [{ text: "hi" }] }),
    );
    await expect(validateClaudeKey("valid-key")).resolves.toBeUndefined();
  });

  it("throws 'Invalid API key' on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(validateClaudeKey("bad-key")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws 'API key lacks permission' on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(validateClaudeKey("restricted-key")).rejects.toThrow(
      "API key lacks permission",
    );
  });

  it("throws generic message on other HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("Server error"),
    });
    await expect(validateClaudeKey("key")).rejects.toThrow(
      "Validation failed (500): Server error",
    );
  });
});

// ─── callOneForAll ───────────────────────────────────────────────────────────

describe("callOneForAll", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const API_KEY = "ofa-key";
  const MODEL = "anthropic/claude-4-sonnet";

  it("returns immediately when response has no code_ref but has response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ response: "Immediate result" }),
    );

    const result = await callOneForAll(baseRequest, API_KEY, MODEL);

    expect(result).toEqual({
      content: "Immediate result",
      provider: "1forall",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sends correct headers and body on submit", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ response: "ok" }));

    await callOneForAll(baseRequest, API_KEY, MODEL);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/oneforall?action=send-request");
    expect(options.method).toBe("POST");
    expect(options.headers["x-oneforall-key"]).toBe(API_KEY);
    const body = JSON.parse(options.body);
    expect(body.system_prompt).toBe(baseRequest.systemPrompt);
    expect(body.message).toBe(baseRequest.userMessage);
    expect(body.model).toBe(MODEL);
    expect(body.max_tokens).toBe(4096);
  });

  it("uses request.maxTokens when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ response: "ok" }));
    await callOneForAll({ ...baseRequest, maxTokens: 512 }, API_KEY, MODEL);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(512);
  });

  it("polls until status=completed and returns result", async () => {
    // Submit → returns code_ref
    mockFetch
      .mockResolvedValueOnce(mockOkResponse({ code_ref: "ref-123" }))
      // Poll 1 → pending
      .mockResolvedValueOnce(mockOkResponse({ status: "pending" }))
      // Poll 2 → completed
      .mockResolvedValueOnce(
        mockOkResponse({ status: "completed", response: "Polled result" }),
      );

    const promise = callOneForAll(baseRequest, API_KEY, MODEL);

    // Drain microtasks (submit fetch resolves) then advance timers for each poll sleep.
    await Promise.resolve();
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual({ content: "Polled result", provider: "1forall" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("includes code_ref in poll URL", async () => {
    mockFetch
      .mockResolvedValueOnce(mockOkResponse({ code_ref: "abc-xyz" }))
      .mockResolvedValueOnce(
        mockOkResponse({ status: "completed", response: "done" }),
      );

    const promise = callOneForAll(baseRequest, API_KEY, MODEL);
    await Promise.resolve();
    await jest.runAllTimersAsync();
    await promise;

    const pollUrl = mockFetch.mock.calls[1][0] as string;
    expect(pollUrl).toContain("action=check-status");
    expect(pollUrl).toContain("code_ref=abc-xyz");
  });

  it("throws on submit error", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(400, "Bad request"));
    await expect(callOneForAll(baseRequest, API_KEY, MODEL)).rejects.toThrow(
      "1ForAll submit error (400): Bad request",
    );
  });

  it("throws when code_ref missing and no immediate response", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ data: "unexpected" }));
    await expect(callOneForAll(baseRequest, API_KEY, MODEL)).rejects.toThrow(
      "1ForAll API did not return a code_ref or immediate response",
    );
  });

  it("throws on status=error during polling", async () => {
    mockFetch
      .mockResolvedValueOnce(mockOkResponse({ code_ref: "ref-err" }))
      .mockResolvedValueOnce(
        mockOkResponse({ status: "error", error: "Processing failed" }),
      );

    // Attach rejection handler immediately so it is never unhandled.
    const promise = callOneForAll(baseRequest, API_KEY, MODEL);
    const rejection = promise.catch((e: Error) => e);

    await Promise.resolve();
    await jest.runAllTimersAsync();

    const err = await rejection;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(
      "1ForAll processing error: Processing failed",
    );
  });

  it("throws after MAX_CONSECUTIVE_FAILURES (3) poll network errors", async () => {
    mockFetch
      .mockResolvedValueOnce(mockOkResponse({ code_ref: "ref-fail" }))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"));

    // Attach rejection handler immediately so it is never unhandled.
    const promise = callOneForAll(baseRequest, API_KEY, MODEL);
    const rejection = promise.catch((e: Error) => e);

    await Promise.resolve();
    await jest.runAllTimersAsync();

    const err = await rejection;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(
      "1ForAll polling failed after 3 consecutive errors",
    );
  });

  it("calls onProgress at submit (0%) and completion (100%) stages", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ response: "done" }));
    const onProgress = jest.fn();

    await callOneForAll(baseRequest, API_KEY, MODEL, onProgress);

    const calls = onProgress.mock.calls.map((c) => c[0]);
    expect(calls[0].percent).toBe(0);
    expect(calls[calls.length - 1].percent).toBe(100);
  });

  it("throws when AbortSignal is already aborted before fetch", async () => {
    const controller = new AbortController();
    controller.abort();
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

    await expect(
      callOneForAll(baseRequest, API_KEY, MODEL, undefined, controller.signal),
    ).rejects.toBeDefined();
  });
});

// ─── validateOneForAllKey ────────────────────────────────────────────────────

describe("validateOneForAllKey", () => {
  beforeEach(() => mockFetch.mockReset());

  it("resolves without error when key is valid", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ ok: true }));
    await expect(validateOneForAllKey("valid-key")).resolves.toBeUndefined();
  });

  it("throws 'Invalid API key' on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(validateOneForAllKey("bad")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws 'Invalid API key' on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(validateOneForAllKey("bad")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws generic message on other errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("Server broke"),
    });
    await expect(validateOneForAllKey("key")).rejects.toThrow(
      "Validation failed (500): Server broke",
    );
  });
});

// ─── callStraico (real implementation) ───────────────────────────────────────

describe("callStraico (real implementation)", () => {
  beforeEach(() => mockFetch.mockReset());

  const API_KEY = "straico-key";
  const MODEL = "openai/gpt-4o-mini";

  it("sends correct headers and body to Straico proxy", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: {
          completions: {
            [MODEL]: {
              completion: {
                choices: [{ message: { content: "Straico result" } }],
              },
            },
          },
        },
      }),
    );

    await realCallStraico(baseRequest, API_KEY, MODEL);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/straico?action=prompt");
    expect(options.method).toBe("POST");
    expect(options.headers["x-straico-key"]).toBe(API_KEY);
    const body = JSON.parse(options.body);
    expect(body.models).toEqual([MODEL]);
    expect(body.message).toContain(baseRequest.systemPrompt);
    expect(body.message).toContain(baseRequest.userMessage);
  });

  it("parses new completions format (keyed by model name)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: {
          completions: {
            "openai/gpt-4o-mini": {
              completion: {
                choices: [{ message: { content: "New format content" } }],
              },
            },
          },
        },
      }),
    );

    const result = await realCallStraico(baseRequest, API_KEY, MODEL);
    expect(result).toEqual({
      content: "New format content",
      provider: "straico",
    });
  });

  it("parses legacy format: data.completion.choices", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: {
          completion: {
            choices: [{ message: { content: "Legacy content" } }],
          },
        },
      }),
    );

    const result = await realCallStraico(baseRequest, API_KEY, MODEL);
    expect(result).toEqual({ content: "Legacy content", provider: "straico" });
  });

  it("parses fallback format: completion.choices (top-level)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        completion: {
          choices: [{ message: { content: "Top-level content" } }],
        },
      }),
    );

    const result = await realCallStraico(baseRequest, API_KEY, MODEL);
    expect(result).toEqual({
      content: "Top-level content",
      provider: "straico",
    });
  });

  it("parses fallback format: data.response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ data: { response: "Direct response" } }),
    );
    const result = await realCallStraico(baseRequest, API_KEY, MODEL);
    expect(result).toEqual({ content: "Direct response", provider: "straico" });
  });

  it("parses fallback format: top-level response field", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ response: "Top-level response" }),
    );
    const result = await realCallStraico(baseRequest, API_KEY, MODEL);
    expect(result).toEqual({
      content: "Top-level response",
      provider: "straico",
    });
  });

  it("includes max_tokens in body when provided", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ data: { response: "ok" } }),
    );
    await realCallStraico({ ...baseRequest, maxTokens: 2048 }, API_KEY, MODEL);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(2048);
  });

  it("omits max_tokens from body when not provided", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ data: { response: "ok" } }),
    );
    await realCallStraico(baseRequest, API_KEY, MODEL);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_tokens).toBeUndefined();
  });

  it("throws on non-ok HTTP response", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(500, "Straico down"));
    await expect(realCallStraico(baseRequest, API_KEY, MODEL)).rejects.toThrow(
      "Straico API error (500): Straico down",
    );
  });

  it("throws when no content can be extracted from response", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ data: {} }));
    await expect(realCallStraico(baseRequest, API_KEY, MODEL)).rejects.toThrow(
      "Straico API returned an empty response",
    );
  });

  it("calls onProgress at 0% first and 100% last", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ data: { response: "ok" } }),
    );
    const onProgress = jest.fn();
    await realCallStraico(baseRequest, API_KEY, MODEL, onProgress);

    const calls = onProgress.mock.calls.map((c) => c[0]);
    expect(calls[0].percent).toBe(0);
    expect(calls[calls.length - 1].percent).toBe(100);
  });

  it("forwards AbortSignal to fetch", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ data: { response: "ok" } }),
    );
    const controller = new AbortController();
    await realCallStraico(
      baseRequest,
      API_KEY,
      MODEL,
      undefined,
      controller.signal,
    );
    expect(mockFetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
});

// ─── validateStraicoKey (real implementation) ────────────────────────────────

describe("validateStraicoKey (real implementation)", () => {
  beforeEach(() => mockFetch.mockReset());

  it("resolves without error on success", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ ok: true }));
    await expect(realValidateStraicoKey("valid-key")).resolves.toBeUndefined();
  });

  it("throws 'Invalid API key' on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(realValidateStraicoKey("bad")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws 'Invalid API key' on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue(""),
    });
    await expect(realValidateStraicoKey("bad")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws generic message on other HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: jest.fn().mockResolvedValue("Service unavailable"),
    });
    await expect(realValidateStraicoKey("key")).rejects.toThrow(
      "Validation failed (503): Service unavailable",
    );
  });
});

// ─── fetchStraicoModels (real implementation) ────────────────────────────────

describe("fetchStraicoModels (real implementation)", () => {
  beforeEach(() => mockFetch.mockReset());

  const rawModels = [
    {
      model: "openai/gpt-4o",
      name: "GPT-4o",
      max_tokens: 8192,
      word_limit: 100000,
      pricing: { coins: 1.5, words: 100 },
      provider: "openai",
      model_type: "chat",
      editors_choice_level: 2,
    },
    {
      model: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
    },
  ];

  it("fetches and maps models from data-wrapped array", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ data: rawModels }));
    const models = await realFetchStraicoModels("key");

    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-4o",
      label: "GPT-4o",
      maxTokens: { min: 1, max: 8192 },
      wordLimit: 100000,
      pricing: { coins: 1.5, words: 100 },
      provider: "openai",
      modelType: "chat",
      editorsChoiceLevel: 2,
    });
  });

  it("accepts top-level array response (no data wrapper)", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(rawModels));
    const models = await realFetchStraicoModels("key");
    expect(models).toHaveLength(2);
  });

  it("returns empty array when response is not an array", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ data: null }));
    const models = await realFetchStraicoModels("key");
    expect(models).toEqual([]);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(401));
    await expect(realFetchStraicoModels("bad-key")).rejects.toThrow(
      "Failed to fetch models (401)",
    );
  });

  it("handles model with no pricing coins (pricing remains undefined)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: [{ model: "test", name: "Test Model", pricing: {} }],
      }),
    );
    const models = await realFetchStraicoModels("key");
    expect(models[0].pricing).toBeUndefined();
  });

  it("defaults pricing.words to 100 when coins present but words absent", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: [{ model: "test", name: "Test", pricing: { coins: 0.5 } }],
      }),
    );
    const models = await realFetchStraicoModels("key");
    expect(models[0].pricing).toEqual({ coins: 0.5, words: 100 });
  });
});

// ─── fetchStraicoUserInfo (real implementation) ──────────────────────────────

describe("fetchStraicoUserInfo (real implementation)", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns user info on success", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        data: {
          first_name: "Jane",
          last_name: "Doe",
          coins: "150.5",
          plan: "pro",
        },
      }),
    );

    const result = await realFetchStraicoUserInfo("key");
    expect(result).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      coins: 150.5,
      plan: "pro",
    });
  });

  it("accepts top-level user object without data wrapper", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        first_name: "Bob",
        last_name: "Smith",
        coins: 50,
        plan: "basic",
      }),
    );
    const result = await realFetchStraicoUserInfo("key");
    expect(result?.firstName).toBe("Bob");
    expect(result?.coins).toBe(50);
  });

  it("returns null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(401));
    const result = await realFetchStraicoUserInfo("bad-key");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));
    const result = await realFetchStraicoUserInfo("key");
    expect(result).toBeNull();
  });

  it("defaults empty strings for missing name/plan fields", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse({ data: { coins: 0 } }));
    const result = await realFetchStraicoUserInfo("key");
    expect(result?.firstName).toBe("");
    expect(result?.lastName).toBe("");
    expect(result?.plan).toBe("");
  });
});

// ─── fetchModels (modelService) ──────────────────────────────────────────────

describe("fetchModels", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns empty models with fallback source for claude provider (no fetch)", async () => {
    const result = await fetchModels("claude", "any-key");
    expect(result).toEqual({ models: [], source: "fallback" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns fallback ONEFORALL_MODELS when no apiKey for 1forall", async () => {
    const result = await fetchModels("1forall", "");
    expect(result.source).toBe("fallback");
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0]).toHaveProperty("id");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns fallback STRAICO_MODELS when no apiKey for straico", async () => {
    const result = await fetchModels("straico", "");
    expect(result.source).toBe("fallback");
    expect(result.models.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches models from API for 1forall and uses x-oneforall-key header", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        models: [{ id: "m1", label: "Model 1" }],
        source: "api",
      }),
    );

    const result = await fetchModels("1forall", "ofa-key");
    expect(result.source).toBe("api");
    expect(result.models).toEqual([{ id: "m1", label: "Model 1" }]);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/models?provider=1forall");
    expect(options.headers["x-oneforall-key"]).toBe("ofa-key");
  });

  it("fetches models from API for straico and uses x-straico-key header", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        models: [{ id: "s1", label: "Straico Model" }],
        source: "api",
      }),
    );

    const result = await fetchModels("straico", "straico-key");
    expect(result.source).toBe("api");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/models?provider=straico");
    expect(options.headers["x-straico-key"]).toBe("straico-key");
  });

  it("falls back to static models when API returns empty array", async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ models: [], source: "api" }),
    );
    const result = await fetchModels("1forall", "ofa-key");
    expect(result.source).toBe("fallback");
    expect(result.models.length).toBeGreaterThan(0);
  });

  it("falls back to static models when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchModels("straico", "straico-key");
    expect(result.source).toBe("fallback");
    expect(result.models.length).toBeGreaterThan(0);
  });

  it("falls back to static models on non-ok HTTP response", async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(500));
    const result = await fetchModels("1forall", "ofa-key");
    expect(result.source).toBe("fallback");
  });
});
