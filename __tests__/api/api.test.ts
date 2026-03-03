/**
 * @jest-environment node
 *
 * API route handler unit tests.
 * Calls Next.js App Router route handlers directly (no HTTP server needed).
 * External dependencies are mocked.
 */

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — declared before any imports that pull them in
// ---------------------------------------------------------------------------

jest.mock("@/lib/ncb-utils", () => ({
  getSessionUser: jest.fn(),
  fetchUserProfile: jest.fn(),
  proxyToNCB: jest.fn(),
  CONFIG: {
    instance: "test-instance",
    dataApiUrl: "http://localhost:9999",
    authApiUrl: "http://localhost:9999",
    appUrl: "http://localhost:3000",
  },
  extractAuthCookies: jest.fn((h: string) => h),
  extractRows: jest.fn((j: unknown) => (Array.isArray(j) ? j : [])),
}));

jest.mock("@/lib/ai/aiService", () => ({
  generateWithAi: jest.fn(),
}));

jest.mock("@/lib/knowledge/fetch", () => ({
  fetchKnowledgeForUser: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/agents/orchestrator", () => ({
  createPipelineState: jest.fn().mockReturnValue({
    sessionId: "test-session",
    phase: "done",
    error: null,
    selectedTopic: null,
    refinedTopic: null,
    selectedTemplate: null,
    evidencePack: null,
    writerOutput: null,
    scoreResult: null,
    formattedPost: null,
    finalVersion: null,
    userFeedback: [],
    knowledge: [],
    keys: {},
  }),
  runDirection: jest.fn().mockResolvedValue(undefined),
  runDiscovery: jest.fn().mockResolvedValue(undefined),
  runEvidence: jest.fn().mockResolvedValue(undefined),
  runWriteAndScore: jest.fn().mockResolvedValue(undefined),
  runFormat: jest.fn().mockResolvedValue(undefined),
  runLearn: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/agents/campaignPlanner", () => ({
  planCampaign: jest.fn().mockResolvedValue({
    slots: [],
    pillarDistribution: {},
  }),
}));

// ---------------------------------------------------------------------------
// Imports — after jest.mock calls
// ---------------------------------------------------------------------------

import { getSessionUser, fetchUserProfile, proxyToNCB } from "@/lib/ncb-utils";
import { generateWithAi } from "@/lib/ai/aiService";

// Route handlers
import { POST as aiPost } from "@/app/api/ai/route";
import { GET as modelsGet } from "@/app/api/models/route";
import {
  GET as knowledgeGet,
  POST as knowledgePost,
  PUT as knowledgePut,
} from "@/app/api/knowledge/[...path]/route";
import { POST as pipelinePost } from "@/app/api/pipeline/stream/route";

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockGetSessionUser = getSessionUser as jest.MockedFunction<
  typeof getSessionUser
>;
const mockFetchUserProfile = fetchUserProfile as jest.MockedFunction<
  typeof fetchUserProfile
>;
const mockProxyToNCB = proxyToNCB as jest.MockedFunction<typeof proxyToNCB>;
const mockGenerateWithAi = generateWithAi as jest.MockedFunction<
  typeof generateWithAi
>;

// ---------------------------------------------------------------------------
// Helper — build a NextRequest
// ---------------------------------------------------------------------------

function makeRequest(
  method: string,
  url: string,
  options: { body?: unknown; headers?: Record<string, string> } = {},
): NextRequest {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...options.headers,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  init.headers = headers;
  return new NextRequest(
    url,
    init as ConstructorParameters<typeof NextRequest>[1],
  );
}

// ---------------------------------------------------------------------------
// POST /api/ai
// ---------------------------------------------------------------------------

describe("POST /api/ai", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no valid session cookie", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest("POST", "http://localhost/api/ai", {
      body: { request: { systemPrompt: "sys", userMessage: "msg" } },
    });

    const res = await aiPost(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when JSON body is invalid", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });

    // Send a request with invalid JSON (non-parseable body)
    const req = new NextRequest("http://localhost/api/ai", {
      method: "POST",
      body: "{ not json",
      headers: { "content-type": "application/json", cookie: "auth=valid" },
    });

    const res = await aiPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 when request.userMessage is missing", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockFetchUserProfile.mockResolvedValue({
      ai_provider: "claude",
      claude_api_key: "sk-test",
    });

    const req = makeRequest("POST", "http://localhost/api/ai", {
      body: { request: { systemPrompt: "sys" } },
      headers: { cookie: "auth=valid" },
    });

    const res = await aiPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing or invalid request");
  });

  it("returns 200 with AI result when request is valid", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockFetchUserProfile.mockResolvedValue({
      ai_provider: "claude",
      claude_api_key: "sk-test",
    });
    mockGenerateWithAi.mockResolvedValue({ content: "AI response" } as never);

    const req = makeRequest("POST", "http://localhost/api/ai", {
      body: { request: { systemPrompt: "sys", userMessage: "msg" } },
      headers: { cookie: "auth=valid" },
    });

    const res = await aiPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.content).toBe("AI response");
  });

  it("returns 400 when profile is not found", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockFetchUserProfile.mockResolvedValue(null);

    const req = makeRequest("POST", "http://localhost/api/ai", {
      body: { request: { systemPrompt: "sys", userMessage: "msg" } },
      headers: { cookie: "auth=valid" },
    });

    const res = await aiPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("No profile found");
  });
});

// ---------------------------------------------------------------------------
// GET /api/models
// ---------------------------------------------------------------------------

describe("GET /api/models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when no provider query param", async () => {
    const req = makeRequest("GET", "http://localhost/api/models");
    const res = await modelsGet(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid or missing provider");
  });

  it("returns 400 when provider is invalid", async () => {
    const req = makeRequest(
      "GET",
      "http://localhost/api/models?provider=invalid",
    );
    const res = await modelsGet(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid or missing provider");
  });

  it("returns 200 with fallback models for 1forall when no API key provided", async () => {
    // No x-oneforall-key header → throws → falls back to ONEFORALL_FALLBACK
    const req = makeRequest(
      "GET",
      "http://localhost/api/models?provider=1forall",
    );
    const res = await modelsGet(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("provider", "1forall");
    expect(Array.isArray(json.models)).toBe(true);
    expect(json.models.length).toBeGreaterThan(0);
    expect(json.source).toBe("fallback");
  });

  it("returns 200 with fallback models for straico when no API key provided", async () => {
    const req = makeRequest(
      "GET",
      "http://localhost/api/models?provider=straico",
    );
    const res = await modelsGet(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("provider", "straico");
    expect(Array.isArray(json.models)).toBe(true);
    expect(json.source).toBe("fallback");
  });
});

// ---------------------------------------------------------------------------
// Knowledge Base API — GET /api/knowledge/read/documents
// ---------------------------------------------------------------------------

describe("Knowledge Base API", () => {
  const proxyOkResponse = new Response(JSON.stringify([{ id: "doc-1" }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for unauthenticated GET", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "GET",
      "http://localhost/api/knowledge/read/documents",
    );
    const res = await knowledgeGet(req, {
      params: Promise.resolve({ path: ["read", "documents"] }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 for authenticated GET read/documents", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockProxyToNCB.mockResolvedValue(proxyOkResponse as never);

    const req = makeRequest(
      "GET",
      "http://localhost/api/knowledge/read/documents",
      {
        headers: { cookie: "auth=valid" },
      },
    );
    const res = await knowledgeGet(req, {
      params: Promise.resolve({ path: ["read", "documents"] }),
    });

    expect(res.status).toBe(200);
    expect(mockProxyToNCB).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for invalid table name", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });

    const req = makeRequest(
      "GET",
      "http://localhost/api/knowledge/read/not_a_table",
      {
        headers: { cookie: "auth=valid" },
      },
    );
    const res = await knowledgeGet(req, {
      params: Promise.resolve({ path: ["read", "not_a_table"] }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid path");
  });

  it("returns 200 for authenticated POST create/documents", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockProxyToNCB.mockResolvedValue(proxyOkResponse as never);

    const req = makeRequest(
      "POST",
      "http://localhost/api/knowledge/create/documents",
      {
        headers: { cookie: "auth=valid" },
        body: {
          category: "rules",
          name: "Test Doc",
          content: "Test content",
        },
      },
    );
    const res = await knowledgePost(req, {
      params: Promise.resolve({ path: ["create", "documents"] }),
    });

    expect(res.status).toBe(200);
  });

  it("returns 200 for authenticated PUT update/documents/id", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    mockProxyToNCB.mockResolvedValue(proxyOkResponse as never);

    const req = makeRequest(
      "PUT",
      "http://localhost/api/knowledge/update/documents/test-id",
      {
        headers: { cookie: "auth=valid" },
        body: { content: "Updated", updated_by: "user-1", version: 2 },
      },
    );
    const res = await knowledgePut(req, {
      params: Promise.resolve({ path: ["update", "documents", "test-id"] }),
    });

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/pipeline/stream
// ---------------------------------------------------------------------------

describe("Pipeline Stream API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest("POST", "http://localhost/api/pipeline/stream", {
      body: {
        action: "start",
        sessionId: "sess-1",
        keys: { claude: "sk-test" },
      },
    });

    const res = await pipelinePost(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });

    // Missing sessionId and keys
    const req = makeRequest("POST", "http://localhost/api/pipeline/stream", {
      body: { action: "start" },
      headers: { cookie: "auth=valid" },
    });

    const res = await pipelinePost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns SSE stream with content-type text/event-stream when valid", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });

    const req = makeRequest("POST", "http://localhost/api/pipeline/stream", {
      body: {
        action: "start",
        sessionId: "sess-1",
        keys: { claude: "sk-test" },
      },
      headers: { cookie: "auth=valid" },
    });

    const res = await pipelinePost(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });
});

// ---------------------------------------------------------------------------
// API Utilities (documented expected behaviour)
// ---------------------------------------------------------------------------

describe("API Utilities", () => {
  describe("getSessionUser", () => {
    it("returns null for a request with no auth cookie", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const result = await getSessionUser("");
      expect(result).toBeNull();
    });
  });

  describe("fetchUserProfile", () => {
    it("returns null when backend is unreachable", async () => {
      mockFetchUserProfile.mockResolvedValue(null);
      const result = await fetchUserProfile("auth=bad");
      expect(result).toBeNull();
    });
  });
});
