/**
 * @jest-environment node
 *
 * Comprehensive tests for POST /api/pipeline/stream
 *
 * Tests cover:
 *  1. SSE streaming (content-type, format, close)
 *  2. Request validation (auth, body schema)
 *  3. Pipeline initialization (state creation, key resolution)
 *  4. Event streaming order per action
 *  5. Checkpoint application
 *  6. Error handling
 *  7. Authentication & authorization
 *  8. SSE event format
 */

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

const mockGetSessionUser = jest.fn();
const mockFetchUserProfile = jest.fn();
const mockFetchKnowledgeForUser = jest.fn();
const mockCreatePipelineState = jest.fn();
const mockRunDirection = jest.fn();
const mockRunDiscovery = jest.fn();
const mockRunEvidence = jest.fn();
const mockRunWriteAndScore = jest.fn();
const mockRunFormat = jest.fn();
const mockRunLearn = jest.fn();

jest.mock("@/lib/ncb-utils", () => ({
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
  fetchUserProfile: (...args: unknown[]) => mockFetchUserProfile(...args),
  CONFIG: {
    instance: "test-instance",
    dataApiUrl: "http://localhost:9999",
    authApiUrl: "http://localhost:9999",
    appUrl: "http://localhost:3000",
  },
  extractAuthCookies: jest.fn((h: string) => h),
  extractRows: jest.fn((j: unknown) => (Array.isArray(j) ? j : [])),
}));

jest.mock("@/lib/knowledge/fetch", () => ({
  fetchKnowledgeForUser: (...args: unknown[]) =>
    mockFetchKnowledgeForUser(...args),
}));

jest.mock("@/lib/agents/orchestrator", () => ({
  createPipelineState: (...args: unknown[]) => mockCreatePipelineState(...args),
  runDirection: (...args: unknown[]) => mockRunDirection(...args),
  runDiscovery: (...args: unknown[]) => mockRunDiscovery(...args),
  runEvidence: (...args: unknown[]) => mockRunEvidence(...args),
  runWriteAndScore: (...args: unknown[]) => mockRunWriteAndScore(...args),
  runFormat: (...args: unknown[]) => mockRunFormat(...args),
  runLearn: (...args: unknown[]) => mockRunLearn(...args),
}));

// ---------------------------------------------------------------------------
// Import handler — after jest.mock calls
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/pipeline/stream/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_USER = { id: "user-123", email: "test@example.com" };

const VALID_KEYS = { claude: "sk-ant-test-key" };

const MINIMAL_STATE = {
  phase: "idle",
  sessionId: "sess-1",
  knowledge: [],
  keys: VALID_KEYS,
  rewriteCount: 0,
};

const SAMPLE_TOPIC = {
  pillar: "leadership",
  angle: "contrarian",
  decisionMistake: "hiring too fast",
  headline: "Why I stopped promoting my best engineers",
  reasoning: "Counterintuitive take that drives engagement",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "bold-claim",
};

const SAMPLE_KNOWLEDGE = [
  {
    id: "doc-1",
    userId: "user-123",
    category: "rules",
    subcategory: "voice",
    name: "Voice Rules",
    content: "Always write in first person",
    version: 1,
    isActive: true,
    source: "seed",
    updatedAt: "2024-01-01T00:00:00Z",
    updatedBy: "system",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  body: unknown,
  options: { cookie?: string; contentType?: string } = {},
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": options.contentType ?? "application/json",
  };
  if (options.cookie) {
    headers["cookie"] = options.cookie;
  }
  return new NextRequest("http://localhost/api/pipeline/stream", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

/**
 * Consume a ReadableStream and return all SSE chunks as raw strings.
 */
async function consumeStream(res: Response): Promise<string[]> {
  const chunks: string[] = [];
  if (!res.body) return chunks;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value));
  }
  return chunks;
}

/**
 * Parse SSE data lines from raw chunks into JSON objects.
 */
function parseSseEvents(chunks: string[]): unknown[] {
  const events: unknown[] = [];
  const raw = chunks.join("");
  const lines = raw.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // ignore malformed lines
      }
    }
  }
  return events;
}

/**
 * Make runDirection emit one event then resolve.
 */
function mockDirectionSuccess(emit?: (ev: unknown) => void) {
  mockRunDirection.mockImplementation(
    async (state: typeof MINIMAL_STATE, emitFn: (ev: unknown) => void) => {
      emitFn({ step: "direction", status: "running", percent: 0 });
      emitFn({
        step: "direction",
        status: "waiting-for-user",
        percent: 100,
        data: { proposals: [SAMPLE_TOPIC] },
      });
      state.phase = "direction";
    },
  );
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Safe defaults
  mockGetSessionUser.mockResolvedValue(VALID_USER);
  mockFetchUserProfile.mockResolvedValue(null);
  mockFetchKnowledgeForUser.mockResolvedValue([]);
  mockCreatePipelineState.mockReturnValue({ ...MINIMAL_STATE });
  mockRunDirection.mockResolvedValue(undefined);
  mockRunDiscovery.mockResolvedValue(undefined);
  mockRunEvidence.mockResolvedValue(undefined);
  mockRunWriteAndScore.mockResolvedValue(undefined);
  mockRunFormat.mockResolvedValue(undefined);
  mockRunLearn.mockResolvedValue(undefined);
});

// ===========================================================================
// 1. POST /api/pipeline/stream — SSE Streaming
// ===========================================================================

describe("POST /api/pipeline/stream — SSE Streaming", () => {
  it("accepts POST with JSON body and returns 200", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns Content-Type: text/event-stream", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("sets Cache-Control: no-cache header", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("sets Connection: keep-alive header", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.headers.get("connection")).toBe("keep-alive");
  });

  it("streams SSE-formatted events containing data: lines", async () => {
    mockDirectionSuccess();
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const raw = chunks.join("");
    expect(raw).toContain("data: ");
  });

  it("closes stream when pipeline action completes", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    // consumeStream resolves only when stream is closed
    const chunks = await consumeStream(res);
    expect(Array.isArray(chunks)).toBe(true);
  });

  it("emits a final pipeline:done event at end of stream", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
    }>;
    const finalEvent = events[events.length - 1];
    expect(finalEvent).toBeDefined();
    expect(finalEvent.step).toBe("pipeline");
  });

  it("response body is a ReadableStream", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.body).not.toBeNull();
  });

  it("emits events from pipeline action before final summary event", async () => {
    mockDirectionSuccess();
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ step: string }>;
    // Should have at least the two direction events + final pipeline event
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("handles request cancellation gracefully (AbortSignal)", async () => {
    const controller = new AbortController();
    const req = new NextRequest("http://localhost/api/pipeline/stream", {
      method: "POST",
      body: JSON.stringify({
        action: "start",
        sessionId: "sess-1",
        keys: VALID_KEYS,
      }),
      headers: {
        "content-type": "application/json",
        cookie: "better-auth.session_token=abc",
      },
      signal: controller.signal,
    });
    // Abort after setup but before consuming
    controller.abort();
    // Route should still return a Response (not throw)
    const res = await POST(req);
    expect(res).toBeDefined();
  });
});

// ===========================================================================
// 2. Request Validation
// ===========================================================================

describe("Request Validation", () => {
  it("returns 401 when no cookie header is present", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest({
      action: "start",
      sessionId: "sess-1",
      keys: VALID_KEYS,
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when session cookie is invalid", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=invalid" },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/pipeline/stream", {
      method: "POST",
      body: "{ not valid json !!!",
      headers: {
        "content-type": "application/json",
        cookie: "better-auth.session_token=abc",
      },
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid JSON");
  });

  it("returns 400 when action field is missing", async () => {
    const req = makeRequest(
      { sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns 400 when sessionId field is missing", async () => {
    const req = makeRequest(
      { action: "start", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns 400 when keys field is missing entirely", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1" },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns 400 when keys.claude is missing", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: { perplexity: "px-key" } },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns 400 when __server_resolved__ key but no profile configured", async () => {
    mockFetchUserProfile.mockResolvedValue({ claude_api_key: "" });
    const req = makeRequest(
      {
        action: "start",
        sessionId: "sess-1",
        keys: { claude: "__server_resolved__" },
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("No Claude API key configured");
  });

  it("accepts all valid action values without validation error", async () => {
    const actions = [
      "start",
      "discover",
      "evidence",
      "write",
      "format",
      "learn",
    ] as const;
    for (const action of actions) {
      jest.clearAllMocks();
      mockGetSessionUser.mockResolvedValue(VALID_USER);
      mockFetchKnowledgeForUser.mockResolvedValue([]);
      mockCreatePipelineState.mockReturnValue({ ...MINIMAL_STATE });
      // Set up appropriate mock for each action
      mockRunDirection.mockResolvedValue(undefined);
      mockRunDiscovery.mockResolvedValue(undefined);
      mockRunEvidence.mockResolvedValue(undefined);
      mockRunWriteAndScore.mockResolvedValue(undefined);
      mockRunFormat.mockResolvedValue(undefined);
      mockRunLearn.mockResolvedValue(undefined);

      const req = makeRequest(
        { action, sessionId: "sess-1", keys: VALID_KEYS },
        { cookie: "better-auth.session_token=abc" },
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
  });
});

// ===========================================================================
// 3. Pipeline Initialization
// ===========================================================================

describe("Pipeline Initialization", () => {
  it("calls createPipelineState with sessionId from request body", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "my-session-42", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    await consumeStream(await POST(req));
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "my-session-42" }),
    );
  });

  it("calls createPipelineState with resolved keys", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({ claude: "sk-ant-test-key" }),
      }),
    );
  });

  it("calls fetchKnowledgeForUser with the authenticated user id", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockFetchKnowledgeForUser).toHaveBeenCalledWith(
      "user-123",
      expect.any(String),
    );
  });

  it("passes knowledge documents to createPipelineState", async () => {
    mockFetchKnowledgeForUser.mockResolvedValue(SAMPLE_KNOWLEDGE);
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({ knowledge: SAMPLE_KNOWLEDGE }),
    );
  });

  it("resolves __server_resolved__ claude key from user profile", async () => {
    mockFetchUserProfile.mockResolvedValue({
      claude_api_key: "sk-from-profile",
    });
    const req = makeRequest(
      {
        action: "start",
        sessionId: "sess-1",
        keys: { claude: "__server_resolved__" },
      },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({ claude: "sk-from-profile" }),
      }),
    );
  });

  it("resolves perplexity key from profile when __server_resolved__", async () => {
    mockFetchUserProfile.mockResolvedValue({
      claude_api_key: "sk-from-profile",
      perplexity_api_key: "px-from-profile",
    });
    const req = makeRequest(
      {
        action: "start",
        sessionId: "sess-1",
        keys: { claude: "__server_resolved__" },
      },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({ perplexity: "px-from-profile" }),
      }),
    );
  });
});

// ===========================================================================
// 4. Event Streaming Order
// ===========================================================================

describe("Event Streaming Order", () => {
  it("calls runDirection for action=start", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunDirection).toHaveBeenCalledTimes(1);
    expect(mockRunDiscovery).not.toHaveBeenCalled();
  });

  it("calls runDiscovery for action=discover", async () => {
    const req = makeRequest(
      {
        action: "discover",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunDiscovery).toHaveBeenCalledTimes(1);
    expect(mockRunDirection).not.toHaveBeenCalled();
  });

  it("calls runEvidence for action=evidence", async () => {
    const req = makeRequest(
      {
        action: "evidence",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunEvidence).toHaveBeenCalledTimes(1);
  });

  it("calls runWriteAndScore for action=write", async () => {
    const req = makeRequest(
      {
        action: "write",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunWriteAndScore).toHaveBeenCalledTimes(1);
  });

  it("calls runFormat for action=format", async () => {
    const req = makeRequest(
      {
        action: "format",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunFormat).toHaveBeenCalledTimes(1);
  });

  it("calls runLearn for action=learn", async () => {
    const req = makeRequest(
      {
        action: "learn",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        finalVersion: "My final post text",
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunLearn).toHaveBeenCalledTimes(1);
  });

  it("each emitted event has step, status, and percent fields", async () => {
    mockRunDirection.mockImplementation(
      async (_state: unknown, emit: (ev: unknown) => void) => {
        emit({ step: "direction", status: "running", percent: 0 });
        emit({
          step: "direction",
          status: "waiting-for-user",
          percent: 100,
          data: {},
        });
      },
    );

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
      percent: number;
    }>;

    for (const event of events) {
      expect(typeof event.step).toBe("string");
      expect(typeof event.status).toBe("string");
      expect(typeof event.percent).toBe("number");
    }
  });

  it("status values are valid pipeline status strings", async () => {
    mockRunDirection.mockImplementation(
      async (_state: unknown, emit: (ev: unknown) => void) => {
        emit({ step: "direction", status: "running", percent: 0 });
        emit({
          step: "direction",
          status: "waiting-for-user",
          percent: 100,
          data: {},
        });
      },
    );
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ status: string }>;
    const validStatuses = new Set([
      "running",
      "done",
      "waiting-for-user",
      "error",
    ]);
    for (const event of events) {
      expect(validStatuses.has(event.status)).toBe(true);
    }
  });

  it("percent values are numeric 0-100", async () => {
    mockRunDirection.mockImplementation(
      async (_state: unknown, emit: (ev: unknown) => void) => {
        emit({ step: "direction", status: "running", percent: 0 });
        emit({
          step: "direction",
          status: "waiting-for-user",
          percent: 100,
          data: {},
        });
      },
    );
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ percent: number }>;
    for (const event of events) {
      expect(event.percent).toBeGreaterThanOrEqual(0);
      expect(event.percent).toBeLessThanOrEqual(100);
    }
  });

  it("final pipeline event has percent=100", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      percent: number;
    }>;
    const pipelineEvent = events.find((e) => e.step === "pipeline");
    expect(pipelineEvent).toBeDefined();
    expect(pipelineEvent!.percent).toBe(100);
  });
});

// ===========================================================================
// 5. Checkpoint Application
// ===========================================================================

describe("Checkpoint Application", () => {
  it("applies selectedTopic from request body to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);

    const req = makeRequest(
      {
        action: "discover",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    // runDiscovery should have been called with a state that has selectedTopic
    expect(mockRunDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTopic: SAMPLE_TOPIC }),
      expect.any(Function),
      expect.anything(),
    );
  });

  it("applies refinedTopic from request body to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);
    const refinedTopic = { ...SAMPLE_TOPIC, headline: "Refined headline" };

    const req = makeRequest(
      {
        action: "evidence",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
        refinedTopic,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    expect(mockRunEvidence).toHaveBeenCalledWith(
      expect.objectContaining({ refinedTopic }),
      expect.any(Function),
      expect.anything(),
    );
  });

  it("applies selectedTemplate from request body to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);

    const req = makeRequest(
      {
        action: "write",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
        selectedTemplate: "listicle",
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    expect(mockRunWriteAndScore).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTemplate: "listicle" }),
      expect.any(Function),
      expect.anything(),
    );
  });

  it("applies finalVersion from request body to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);

    const req = makeRequest(
      {
        action: "learn",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        finalVersion: "This is my final post.",
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    expect(mockRunLearn).toHaveBeenCalledWith(
      expect.objectContaining({ finalVersion: "This is my final post." }),
      expect.any(Function),
      expect.anything(),
    );
  });

  it("applies userFeedback array from request body to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);
    const feedback = ["Too long", "Needs more data"];

    const req = makeRequest(
      {
        action: "learn",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        finalVersion: "Post text",
        userFeedback: feedback,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    expect(mockRunLearn).toHaveBeenCalledWith(
      expect.objectContaining({ userFeedback: feedback }),
      expect.any(Function),
      expect.anything(),
    );
  });

  it("optional fields not in body are not applied to state", async () => {
    const state = { ...MINIMAL_STATE };
    mockCreatePipelineState.mockReturnValue(state);

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);

    // selectedTopic was not in body; state should not have it set
    expect(state.selectedTopic).toBeUndefined();
  });
});

// ===========================================================================
// 6. Error Handling in Pipeline
// ===========================================================================

describe("Error Handling in Pipeline", () => {
  it("emits error event when runDirection throws", async () => {
    mockRunDirection.mockRejectedValue(new Error("Strategist API failed"));

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
      data?: { error?: string };
    }>;
    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent).toBeDefined();
    expect(errorEvent!.data?.error).toContain("Strategist API failed");
  });

  it("stream closes after error event", async () => {
    mockRunDirection.mockRejectedValue(new Error("Network timeout"));

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    // consumeStream resolving means stream is closed
    const chunks = await consumeStream(res);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("emits pipeline:error event when runDiscovery throws", async () => {
    mockRunDiscovery.mockRejectedValue(new Error("Discovery failed"));

    const req = makeRequest(
      {
        action: "discover",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
    }>;
    const pipelineEvent = events.find((e) => e.step === "pipeline");
    expect(pipelineEvent?.status).toBe("error");
  });

  it("error event data includes error message string", async () => {
    mockRunEvidence.mockRejectedValue(
      new Error("Evidence gathering timed out"),
    );

    const req = makeRequest(
      {
        action: "evidence",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      status: string;
      data?: { error?: string };
    }>;
    const errorEvent = events.find((e) => e.status === "error");
    expect(typeof errorEvent?.data?.error).toBe("string");
    expect(errorEvent?.data?.error).toContain("Evidence gathering timed out");
  });

  it("non-Error thrown values are stringified in error data", async () => {
    mockRunFormat.mockRejectedValue("string error message");

    const req = makeRequest(
      {
        action: "format",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      status: string;
      data?: { error?: string };
    }>;
    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent?.data?.error).toContain("string error message");
  });

  it("pipeline state phase=error produces pipeline:error final event", async () => {
    const errorState = { ...MINIMAL_STATE, phase: "error", error: "boom" };
    mockCreatePipelineState.mockReturnValue(errorState);
    // runDirection sets state.phase to 'error' without throwing
    mockRunDirection.mockImplementation(async (state: { phase: string }) => {
      state.phase = "error";
    });

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
    }>;
    const pipelineEvent = events.find((e) => e.step === "pipeline");
    expect(pipelineEvent?.status).toBe("error");
  });

  it("returns 200 (SSE) even when pipeline errors mid-stream (not 500)", async () => {
    mockRunDirection.mockRejectedValue(new Error("mid-stream error"));
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    // SSE streaming errors are delivered in-band; HTTP status is 200
    expect(res.status).toBe(200);
  });

  it("runLearn error still emits error event with step=pipeline", async () => {
    mockRunLearn.mockRejectedValue(new Error("Learner DB write failed"));

    const req = makeRequest(
      {
        action: "learn",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        finalVersion: "Final text",
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      status: string;
    }>;
    const pipelineEvent = events.find((e) => e.step === "pipeline");
    expect(pipelineEvent?.status).toBe("error");
  });
});

// ===========================================================================
// 7. Authentication & Authorization
// ===========================================================================

describe("Authentication & Authorization", () => {
  it("returns 401 with JSON error when Authorization cookie is absent", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest({
      action: "start",
      sessionId: "sess-1",
      keys: VALID_KEYS,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 401 Content-Type application/json (not SSE) for auth failure", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest({
      action: "start",
      sessionId: "sess-1",
      keys: VALID_KEYS,
    });
    const res = await POST(req);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("does not call createPipelineState when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest({
      action: "start",
      sessionId: "sess-1",
      keys: VALID_KEYS,
    });
    await POST(req);
    expect(mockCreatePipelineState).not.toHaveBeenCalled();
  });

  it("does not call fetchKnowledgeForUser when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const req = makeRequest({
      action: "start",
      sessionId: "sess-1",
      keys: VALID_KEYS,
    });
    await POST(req);
    expect(mockFetchKnowledgeForUser).not.toHaveBeenCalled();
  });

  it("calls getSessionUser with the cookie header from the request", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=my-token" },
    );
    await POST(req);
    expect(mockGetSessionUser).toHaveBeenCalledWith(
      expect.stringContaining("better-auth.session_token=my-token"),
    );
  });

  it("proceeds to pipeline when valid user session is returned", async () => {
    mockGetSessionUser.mockResolvedValue({
      id: "user-abc",
      email: "user@test.com",
    });
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=good-token" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockCreatePipelineState).toHaveBeenCalled();
  });
});

// ===========================================================================
// 8. SSE Event Format
// ===========================================================================

describe("SSE Event Format", () => {
  it("each SSE data line starts with 'data: '", async () => {
    mockRunDirection.mockImplementation(
      async (_state: unknown, emit: (ev: unknown) => void) => {
        emit({ step: "direction", status: "running", percent: 0 });
      },
    );

    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const raw = chunks.join("");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const dataLines = lines.filter((l) => l.startsWith("data: "));
    expect(dataLines.length).toBeGreaterThan(0);
    for (const line of dataLines) {
      expect(line.startsWith("data: ")).toBe(true);
    }
  });

  it("SSE messages are separated by double newline (\\n\\n)", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const raw = chunks.join("");
    // At least one double-newline separator present
    expect(raw).toContain("\n\n");
  });

  it("data payload is valid JSON parseable by JSON.parse", async () => {
    mockRunDirection.mockImplementation(
      async (_state: unknown, emit: (ev: unknown) => void) => {
        emit({ step: "direction", status: "running", percent: 25 });
      },
    );
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const raw = chunks.join("");
    const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const jsonStr = line.slice(6);
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    }
  });

  it("parsed events contain step field as string", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ step: string }>;
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].step).toBe("string");
  });

  it("parsed events contain status field", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ status: string }>;
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.status).toBeDefined();
    }
  });

  it("parsed events contain numeric percent field", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{ percent: number }>;
    for (const event of events) {
      expect(typeof event.percent).toBe("number");
    }
  });

  it("final pipeline event JSON contains phase field in data", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    const chunks = await consumeStream(res);
    const events = parseSseEvents(chunks) as Array<{
      step: string;
      data?: { phase?: string };
    }>;
    const pipelineEvent = events.find((e) => e.step === "pipeline");
    expect(pipelineEvent).toBeDefined();
    expect(pipelineEvent!.data).toBeDefined();
    expect(pipelineEvent!.data).toHaveProperty("phase");
  });
});

// ===========================================================================
// 9. Additional edge cases
// ===========================================================================

describe("Edge Cases", () => {
  it("handles empty knowledge documents array gracefully", async () => {
    mockFetchKnowledgeForUser.mockResolvedValue([]);
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("handles large knowledge document set without error", async () => {
    const largeKnowledge = Array.from({ length: 100 }, (_, i) => ({
      ...SAMPLE_KNOWLEDGE[0],
      id: `doc-${i}`,
      name: `Document ${i}`,
    }));
    mockFetchKnowledgeForUser.mockResolvedValue(largeKnowledge);
    mockCreatePipelineState.mockReturnValue({
      ...MINIMAL_STATE,
      knowledge: largeKnowledge,
    });
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("handles sessionId with special characters", async () => {
    const req = makeRequest(
      {
        action: "start",
        sessionId: "sess/with/slashes-and_underscores.123",
        keys: VALID_KEYS,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("ignores unknown fields in request body without error", async () => {
    const req = makeRequest(
      {
        action: "start",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        unknownField: "should be ignored",
        anotherUnknown: { nested: true },
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("passes reddit credentials from keys to pipeline state", async () => {
    const redditCreds = {
      clientId: "reddit-client-id",
      clientSecret: "reddit-secret",
    };
    const keysWithReddit = { ...VALID_KEYS, reddit: redditCreds };
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: keysWithReddit },
      { cookie: "better-auth.session_token=abc" },
    );
    await POST(req);
    expect(mockCreatePipelineState).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({ reddit: redditCreds }),
      }),
    );
  });

  it("does not call runDirection when action is not start", async () => {
    const req = makeRequest(
      {
        action: "evidence",
        sessionId: "sess-1",
        keys: VALID_KEYS,
        selectedTopic: SAMPLE_TOPIC,
      },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunDirection).not.toHaveBeenCalled();
  });

  it("does not call runLearn when action is start", async () => {
    const req = makeRequest(
      { action: "start", sessionId: "sess-1", keys: VALID_KEYS },
      { cookie: "better-auth.session_token=abc" },
    );
    const res = await POST(req);
    await consumeStream(res);
    expect(mockRunLearn).not.toHaveBeenCalled();
  });
});
