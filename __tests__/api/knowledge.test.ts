/**
 * @jest-environment node
 *
 * Integration tests for Knowledge API routes.
 *
 * Routes under test:
 *   GET/POST/PUT/DELETE /api/knowledge/[...path]  — CRUD proxy to NCB
 *   POST /api/knowledge/ingest                     — auto-classify content
 *   POST /api/knowledge/extract                    — template extraction via AI
 *
 * All external I/O (fetch, extractTemplate) is mocked.
 */

import { NextRequest } from "next/server";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("@/lib/ncb-utils", () => ({
  getSessionUser: jest.fn(),
  proxyToNCB: jest.fn(),
  CONFIG: {
    instance: "test-instance",
    dataApiUrl: "https://data.test",
    authApiUrl: "https://auth.test",
    appUrl: "https://app.test",
  },
  extractAuthCookies: jest.fn((c: string) => c),
}));

jest.mock("@/lib/agents/templateExtractor", () => ({
  extractTemplate: jest.fn(),
}));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { getSessionUser, proxyToNCB } from "@/lib/ncb-utils";
import { extractTemplate } from "@/lib/agents/templateExtractor";

import { GET, POST, PUT, DELETE } from "@/app/api/knowledge/[...path]/route";
import { POST as ingestPOST } from "@/app/api/knowledge/ingest/route";
import { POST as extractPOST } from "@/app/api/knowledge/extract/route";

import type { ExtractedTemplate } from "@/lib/agents/templateExtractor";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockGetSessionUser = getSessionUser as jest.MockedFunction<
  typeof getSessionUser
>;
const mockProxyToNCB = proxyToNCB as jest.MockedFunction<typeof proxyToNCB>;
const mockExtractTemplate = extractTemplate as jest.MockedFunction<
  typeof extractTemplate
>;

const MOCK_USER = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
};

const AUTH_COOKIE = "better-auth.session_token=abc123";

function makeRequest(
  method: string,
  pathname: string,
  body?: unknown,
  cookie = AUTH_COOKIE,
): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  return new NextRequest(url, init);
}

function makeNCBResponse(data: unknown, status = 200) {
  const { NextResponse } = require("next/server");
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Builds the params object the route handler receives (Next.js 15 style). */
function makeParams(segments: string[]): {
  params: Promise<{ path: string[] }>;
} {
  return { params: Promise.resolve({ path: segments }) };
}

// ─── Reset between tests ──────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// CRUD route: GET /api/knowledge/[...path]
// =============================================================================

describe("GET /api/knowledge/[...path]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "GET",
      "/api/knowledge/read/documents",
      undefined,
      "",
    );
    const res = await GET(req, makeParams(["read", "documents"]));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid operation", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("GET", "/api/knowledge/badop/documents");
    const res = await GET(req, makeParams(["badop", "documents"]));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid path or table/);
  });

  it("returns 400 for invalid table", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("GET", "/api/knowledge/read/hacked_table");
    const res = await GET(req, makeParams(["read", "hacked_table"]));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid path or table/);
  });

  it("returns 400 when path has fewer than 2 segments", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("GET", "/api/knowledge/read");
    const res = await GET(req, makeParams(["read"]));

    expect(res.status).toBe(400);
  });

  it("proxies read/documents to NCB and returns data", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    const mockDocs = [{ id: "doc-1", name: "Test Doc" }];
    mockProxyToNCB.mockResolvedValue(makeNCBResponse(mockDocs));

    const req = makeRequest("GET", "/api/knowledge/read/documents");
    const res = await GET(req, makeParams(["read", "documents"]));

    expect(mockProxyToNCB).toHaveBeenCalledWith(req, "read/documents");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockDocs);
  });

  it("proxies read/documents/123 with id segment", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({ id: "doc-123" }));

    const req = makeRequest("GET", "/api/knowledge/read/documents/123");
    const res = await GET(req, makeParams(["read", "documents", "123"]));

    expect(mockProxyToNCB).toHaveBeenCalledWith(req, "read/documents/123");
    expect(res.status).toBe(200);
  });

  it("returns 502 when NCB is unavailable", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(
      makeNCBResponse({ error: "Backend service unavailable" }, 502),
    );

    const req = makeRequest("GET", "/api/knowledge/read/signals");
    const res = await GET(req, makeParams(["read", "signals"]));

    expect(res.status).toBe(502);
  });

  it.each([
    "documents",
    "document_versions",
    "signals",
    "rule_proposals",
    "campaigns",
    "campaign_posts",
  ])("accepts allowed table: %s", async (table) => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse([]));

    const req = makeRequest("GET", `/api/knowledge/read/${table}`);
    const res = await GET(req, makeParams(["read", table]));

    expect(res.status).toBe(200);
    expect(mockProxyToNCB).toHaveBeenCalledWith(req, `read/${table}`);
  });
});

// =============================================================================
// CRUD route: POST /api/knowledge/[...path]
// =============================================================================

describe("POST /api/knowledge/[...path]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "POST",
      "/api/knowledge/create/documents",
      { name: "Doc" },
      "",
    );
    const res = await POST(req, makeParams(["create", "documents"]));

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid path", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/create/unknown_table", {
      name: "X",
    });
    const res = await POST(req, makeParams(["create", "unknown_table"]));

    expect(res.status).toBe(400);
  });

  it("injects authenticated user_id and strips client-supplied user_id", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({ id: "new-doc" }, 201));

    const req = makeRequest("POST", "/api/knowledge/create/documents", {
      name: "My Doc",
      content: "Hello",
      user_id: "attacker-id",
    });
    const res = await POST(req, makeParams(["create", "documents"]));

    expect(res.status).toBe(201);

    // Verify the body passed to proxyToNCB has the real user id, not attacker's
    const [, , bodyArg] = mockProxyToNCB.mock.calls[0];
    const parsed = JSON.parse(bodyArg as string);
    expect(parsed.user_id).toBe("user-123");
    expect(parsed.name).toBe("My Doc");
  });

  it("forwards request even with empty body", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({}));

    // No body on the request
    const url = "http://localhost:3000/api/knowledge/create/documents";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { cookie: AUTH_COOKIE },
    });
    const res = await POST(req, makeParams(["create", "documents"]));

    expect(mockProxyToNCB).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("forwards malformed JSON body as-is (not rejected)", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({}));

    const url = "http://localhost:3000/api/knowledge/create/documents";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { cookie: AUTH_COOKIE, "Content-Type": "application/json" },
      body: "not-valid-json",
    });
    await POST(req, makeParams(["create", "documents"]));

    // Should still proxy (fall-through path)
    expect(mockProxyToNCB).toHaveBeenCalled();
  });

  it.each(["create", "read", "update", "delete"])(
    "accepts allowed operation: %s",
    async (operation) => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
      mockProxyToNCB.mockResolvedValue(makeNCBResponse({}));

      const req = makeRequest("POST", `/api/knowledge/${operation}/documents`, {
        name: "X",
      });
      const res = await POST(req, makeParams([operation, "documents"]));

      // Not 400 (path validation passes)
      expect(res.status).not.toBe(400);
    },
  );
});

// =============================================================================
// CRUD route: PUT /api/knowledge/[...path]
// =============================================================================

describe("PUT /api/knowledge/[...path]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "PUT",
      "/api/knowledge/update/documents/doc-1",
      { name: "Updated" },
      "",
    );
    const res = await PUT(req, makeParams(["update", "documents", "doc-1"]));

    expect(res.status).toBe(401);
  });

  it("strips user_id from update body (cannot change ownership)", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({ id: "doc-1" }));

    const req = makeRequest("PUT", "/api/knowledge/update/documents/doc-1", {
      name: "Renamed",
      user_id: "another-user",
    });
    await PUT(req, makeParams(["update", "documents", "doc-1"]));

    const [, , bodyArg] = mockProxyToNCB.mock.calls[0];
    const parsed = JSON.parse(bodyArg as string);
    expect(parsed.user_id).toBeUndefined();
    expect(parsed.name).toBe("Renamed");
  });

  it("proxies valid update to NCB", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(
      makeNCBResponse({ id: "doc-1", name: "New Name" }),
    );

    const req = makeRequest("PUT", "/api/knowledge/update/documents/doc-1", {
      name: "New Name",
    });
    const res = await PUT(req, makeParams(["update", "documents", "doc-1"]));

    expect(mockProxyToNCB).toHaveBeenCalledWith(
      req,
      "update/documents/doc-1",
      expect.any(String),
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid table on PUT", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("PUT", "/api/knowledge/update/bad_table/1", {
      x: 1,
    });
    const res = await PUT(req, makeParams(["update", "bad_table", "1"]));

    expect(res.status).toBe(400);
  });

  it("handles empty body on PUT without crashing", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({}));

    const url = "http://localhost:3000/api/knowledge/update/documents/doc-1";
    const req = new NextRequest(url, {
      method: "PUT",
      headers: { cookie: AUTH_COOKIE },
    });
    const res = await PUT(req, makeParams(["update", "documents", "doc-1"]));
    expect(res.status).toBe(200);
  });
});

// =============================================================================
// CRUD route: DELETE /api/knowledge/[...path]
// =============================================================================

describe("DELETE /api/knowledge/[...path]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "DELETE",
      "/api/knowledge/delete/documents/doc-1",
      undefined,
      "",
    );
    const res = await DELETE(req, makeParams(["delete", "documents", "doc-1"]));

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid path", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("DELETE", "/api/knowledge/delete/evil_table/1");
    const res = await DELETE(req, makeParams(["delete", "evil_table", "1"]));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid path or table/);
  });

  it("proxies delete to NCB", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(makeNCBResponse({ deleted: true }));

    const req = makeRequest("DELETE", "/api/knowledge/delete/documents/doc-99");
    const res = await DELETE(
      req,
      makeParams(["delete", "documents", "doc-99"]),
    );

    expect(mockProxyToNCB).toHaveBeenCalledWith(req, "delete/documents/doc-99");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ deleted: true });
  });

  it("returns 404 when NCB returns 404", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);
    mockProxyToNCB.mockResolvedValue(
      makeNCBResponse({ error: "Not found" }, 404),
    );

    const req = makeRequest(
      "DELETE",
      "/api/knowledge/delete/documents/nonexistent",
    );
    const res = await DELETE(
      req,
      makeParams(["delete", "documents", "nonexistent"]),
    );

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Ingest route: POST /api/knowledge/ingest
// =============================================================================

describe("POST /api/knowledge/ingest", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "POST",
      "/api/knowledge/ingest",
      { content: "hello" },
      "",
    );
    const res = await ingestPOST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const url = "http://localhost:3000/api/knowledge/ingest";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { cookie: AUTH_COOKIE, "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "Invalid JSON" });
  });

  it("returns 400 when content field is missing", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {});
    const res = await ingestPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "content is required" });
  });

  it("returns 400 when content is not a string", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", { content: 42 });
    const res = await ingestPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "content is required" });
  });

  it("classifies template content correctly", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content:
        "# My Great Template\n## Structure\nThis is a template for posts.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("templates");
    expect(json.subcategory).toBe("templates");
    expect(json.name).toBe("My Great Template");
  });

  it("classifies hook content correctly", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content:
        "# Hook Examples\nHere are hook category examples for LinkedIn posts.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("library");
    expect(json.subcategory).toBe("hooks");
  });

  it("classifies closer content correctly", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "# Closers\nHere are my best closer lines for ending posts.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("library");
    expect(json.subcategory).toBe("closers");
  });

  it("classifies CTA content correctly", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "Call to action ideas for LinkedIn: follow, comment, share.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("library");
    expect(json.subcategory).toBe("ctas");
  });

  it("classifies hard rules content", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    // Content triggers rule branch but avoids hook/cta/closer/scoring/format/voice/tone keywords
    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content:
        "# Editorial Rules\nNever use passive sentences. Always write in first person. Forbidden: filler words. Must be concise.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("rules");
    expect(json.subcategory).toBe("hard-rules");
  });

  it("classifies scoring-rules content", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "Scoring rules: always evaluate hook strength first.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("rules");
    expect(json.subcategory).toBe("scoring-rules");
  });

  it("classifies brand-voice content", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "Voice and tone rules: always sound confident and direct.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("rules");
    expect(json.subcategory).toBe("brand-voice");
  });

  it("classifies reference/benchmark content", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "KPI benchmarks: average engagement rate is 3.5%.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("references");
    expect(json.subcategory).toBe("references");
  });

  it("defaults to references for unrecognised content", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "Some random text with no special keywords.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.category).toBe("references");
    expect(json).toHaveProperty("name");
    expect(json).toHaveProperty("subcategory");
  });

  it("uses first line as name when content has a heading", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "## My Special Reference\nSome benchmark data here.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    // Heading stripped of ## prefix
    expect(json.name).toBe("My Special Reference");
  });

  it("handles large content without error", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const largeContent = "This is a benchmark reference. ".repeat(1000);
    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: largeContent,
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("category");
  });

  it("returns correct response shape", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/ingest", {
      content: "Technique for storytelling in posts.",
    });
    const res = await ingestPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("category");
    expect(json).toHaveProperty("subcategory");
    expect(json).toHaveProperty("name");
    expect(typeof json.category).toBe("string");
    expect(typeof json.subcategory).toBe("string");
    expect(typeof json.name).toBe("string");
  });
});

// =============================================================================
// Extract route: POST /api/knowledge/extract
// =============================================================================

describe("POST /api/knowledge/extract", () => {
  const MOCK_TEMPLATE: ExtractedTemplate = {
    name: "contrarian-opener",
    structure: "1. Bold claim\n2. Evidence\n3. Takeaway",
    hookPattern: "Start with a counterintuitive statement",
    closerPattern: "End with an actionable question",
    estimatedLength: 250,
    toneNotes: "Confident, direct",
    exampleHooks: [
      "Most people think X. They're wrong.",
      "Unpopular opinion: Y works better.",
    ],
  };

  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const req = makeRequest(
      "POST",
      "/api/knowledge/extract",
      { content: "test post" },
      "",
    );
    const res = await extractPOST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const url = "http://localhost:3000/api/knowledge/extract";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { cookie: AUTH_COOKIE, "Content-Type": "application/json" },
      body: "{bad json",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "Invalid JSON" });
  });

  it("returns 400 when content is missing", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    const req = makeRequest("POST", "/api/knowledge/extract", {});
    const res = await extractPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "content is required" });
  });

  it("returns 400 when Claude API key is not configured", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    // fetch for brand_profiles returns empty list → no api key
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "A great LinkedIn post here.",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/No Claude API key/);
  });

  it("returns 400 when brand_profiles fetch fails", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    } as unknown as Response);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Some post content.",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/No Claude API key/);
  });

  it("extracts template successfully when API key is present", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ claude_api_key: "sk-ant-test" }],
    } as unknown as Response);

    mockExtractTemplate.mockResolvedValue(MOCK_TEMPLATE);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Contrarian LinkedIn post about sales.",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(MOCK_TEMPLATE);
    expect(mockExtractTemplate).toHaveBeenCalledWith(
      "Contrarian LinkedIn post about sales.",
      "sk-ant-test",
    );
  });

  it("reads api key from ai_settings.claudeApiKey when claude_api_key absent", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ ai_settings: { claudeApiKey: "sk-ant-nested" } }],
    } as unknown as Response);

    mockExtractTemplate.mockResolvedValue(MOCK_TEMPLATE);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Some post.",
    });
    await extractPOST(req);

    expect(mockExtractTemplate).toHaveBeenCalledWith(
      "Some post.",
      "sk-ant-nested",
    );
  });

  it("returns 500 when extractTemplate throws", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ claude_api_key: "sk-ant-test" }],
    } as unknown as Response);

    mockExtractTemplate.mockRejectedValue(new Error("AI upstream failure"));

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Some post.",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Extraction failed/);
    expect(json.error).toMatch(/AI upstream failure/);
  });

  it("returns correct ExtractedTemplate shape on success", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ claude_api_key: "sk-ant-abc" }],
    } as unknown as Response);

    mockExtractTemplate.mockResolvedValue(MOCK_TEMPLATE);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Post.",
    });
    const res = await extractPOST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("name");
    expect(json).toHaveProperty("structure");
    expect(json).toHaveProperty("hookPattern");
    expect(json).toHaveProperty("closerPattern");
    expect(json).toHaveProperty("estimatedLength");
    expect(json).toHaveProperty("toneNotes");
    expect(json).toHaveProperty("exampleHooks");
    expect(Array.isArray(json.exampleHooks)).toBe(true);
  });

  it("handles brand_profiles data wrapped in {data:[]} shape", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ claude_api_key: "sk-ant-wrapped" }] }),
    } as unknown as Response);

    mockExtractTemplate.mockResolvedValue(MOCK_TEMPLATE);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Test.",
    });
    await extractPOST(req);

    expect(mockExtractTemplate).toHaveBeenCalledWith("Test.", "sk-ant-wrapped");
  });

  it("handles brand_profiles data wrapped in {rows:[]} shape", async () => {
    mockGetSessionUser.mockResolvedValue(MOCK_USER);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [{ claude_api_key: "sk-ant-rows" }] }),
    } as unknown as Response);

    mockExtractTemplate.mockResolvedValue(MOCK_TEMPLATE);

    const req = makeRequest("POST", "/api/knowledge/extract", {
      content: "Test.",
    });
    await extractPOST(req);

    expect(mockExtractTemplate).toHaveBeenCalledWith("Test.", "sk-ant-rows");
  });
});
