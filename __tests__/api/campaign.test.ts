/**
 * Campaign API route tests.
 *
 * Tests the POST /api/campaign handler (Next.js App Router).
 * The handler streams SSE events — we test the Response object,
 * status codes, and stream content.
 *
 * All external I/O (NCB auth, NCB data API, campaignPlanner) is mocked.
 *
 * @jest-environment node
 */

// Node 24+ provides fetch, Request, Response, ReadableStream, TextEncoder, and
// TextDecoder natively on globalThis. No polyfills are needed when running
// with @jest-environment node on Node 24.

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

jest.mock("@/lib/ncb-utils", () => ({
  getSessionUser: jest.fn(),
  fetchUserProfile: jest.fn(),
  CONFIG: {
    instance: "test-instance",
    dataApiUrl: "https://data.example.com",
    authApiUrl: "https://auth.example.com",
    appUrl: "https://app.example.com",
  },
}));

jest.mock("@/lib/knowledge/fetch", () => ({
  fetchKnowledgeForUser: jest.fn(),
}));

jest.mock("@/lib/agents/campaignPlanner", () => ({
  planCampaign: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/campaign/route";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";
import { fetchKnowledgeForUser } from "@/lib/knowledge/fetch";
import { planCampaign } from "@/lib/agents/campaignPlanner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetSessionUser = getSessionUser as jest.MockedFunction<
  typeof getSessionUser
>;
const mockFetchUserProfile = fetchUserProfile as jest.MockedFunction<
  typeof fetchUserProfile
>;
const mockFetchKnowledgeForUser = fetchKnowledgeForUser as jest.MockedFunction<
  typeof fetchKnowledgeForUser
>;
const mockPlanCampaign = planCampaign as jest.MockedFunction<
  typeof planCampaign
>;

/** Collect all SSE events from a ReadableStream response into an array of {event, data} objects. */
async function collectSSEEvents(
  response: Response,
): Promise<Array<{ event: string; data: unknown }>> {
  if (!response.body) return [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: Array<{ event: string; data: unknown }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const lines = chunk.split("\n");
      let eventType = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        else if (line.startsWith("data: ")) dataStr = line.slice(6);
      }
      try {
        events.push({ event: eventType, data: JSON.parse(dataStr) });
      } catch {
        events.push({ event: eventType, data: dataStr });
      }
    }
  }
  return events;
}

/** Build a NextRequest with a JSON body and optional cookie. */
function buildRequest(
  body: unknown,
  cookie = "better-auth.session_token=tok123",
): NextRequest {
  return new NextRequest("http://localhost/api/campaign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Q1 Growth Campaign",
  durationWeeks: 2,
  postsPerWeek: 3,
  goals: "Increase brand awareness",
  pillarWeights: { education: 50, inspiration: 50 },
  startDate: "2026-04-01",
  keys: { claude: "sk-ant-test-key" },
};

const MOCK_USER = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
};

const MOCK_SLOT = {
  weekNumber: 1,
  slotOrder: 1,
  slotDate: "2026-04-01",
  topicCard: {
    title: "Why Education Matters",
    hook: "Here is a hook",
    pillar: "education",
    angle: "informative",
    cta: "Learn more",
  },
};

const MOCK_PLAN = {
  campaignId: "camp-456",
  slots: [MOCK_SLOT],
  pillarDistribution: { education: 3, inspiration: 3 },
};

/** Stub a successful createCampaignInDb fetch call. */
function stubCreateCampaignFetch(campaignId = "camp-456") {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: campaignId }),
    statusText: "OK",
  } as Response);
}

/** Stub both createCampaignInDb AND saveCampaignPost fetch calls (sequential). */
function stubAllDbFetches(campaignId = "camp-456") {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: campaignId }),
      statusText: "OK",
    } as Response)
    .mockResolvedValue({
      ok: true,
      json: async () => ({}),
      statusText: "OK",
    } as Response);
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("POST /api/campaign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchKnowledgeForUser.mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------

  describe("authentication", () => {
    it("returns 401 when no cookie is present", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const req = buildRequest(VALID_BODY, "");
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 401 when session cookie is invalid", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const req = buildRequest(VALID_BODY, "better-auth.session_token=bad");
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toHaveProperty("error", "Unauthorized");
    });

    it("proceeds when session is valid", async () => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Request body validation
  // -------------------------------------------------------------------------

  describe("request body validation", () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
    });

    it("returns 400 for malformed JSON body", async () => {
      const req = new NextRequest("http://localhost/api/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "better-auth.session_token=tok123",
        },
        body: "{ not valid json ::::",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body");
    });

    it("returns 400 when name is missing", async () => {
      const { name: _n, ...body } = VALID_BODY;
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing required fields");
    });

    it("returns 400 when durationWeeks is missing", async () => {
      const { durationWeeks: _d, ...body } = VALID_BODY;
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing required fields");
    });

    it("returns 400 when postsPerWeek is missing", async () => {
      const { postsPerWeek: _p, ...body } = VALID_BODY;
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing required fields");
    });

    it("returns 400 when keys.claude is missing", async () => {
      const body = { ...VALID_BODY, keys: {} };
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing required fields");
    });

    it("returns 400 when keys object is absent", async () => {
      const { keys: _k, ...body } = VALID_BODY;
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Missing required fields");
    });

    it("returns 400 when empty object is sent", async () => {
      const req = buildRequest({});
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // Server-resolved API key
  // -------------------------------------------------------------------------

  describe("__server_resolved__ sentinel key", () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
    });

    it("resolves key from user profile when sentinel value is used", async () => {
      mockFetchUserProfile.mockResolvedValue({
        claude_api_key: "sk-ant-from-profile",
      });
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const body = { ...VALID_BODY, keys: { claude: "__server_resolved__" } };
      const req = buildRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(200);
      // Drain the stream so the ReadableStream start() callback completes
      await collectSSEEvents(res);

      expect(mockFetchUserProfile).toHaveBeenCalledTimes(1);
      // planCampaign should receive the resolved key
      expect(mockPlanCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: "sk-ant-from-profile" }),
      );
    });

    it("returns 400 when sentinel key used but profile has no claude_api_key", async () => {
      mockFetchUserProfile.mockResolvedValue({});
      const body = { ...VALID_BODY, keys: { claude: "__server_resolved__" } };
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/No Claude API key/i);
    });

    it("returns 400 when sentinel key used but profile returns null", async () => {
      mockFetchUserProfile.mockResolvedValue(null);
      const body = { ...VALID_BODY, keys: { claude: "__server_resolved__" } };
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/No Claude API key/i);
    });
  });

  // -------------------------------------------------------------------------
  // Successful SSE stream
  // -------------------------------------------------------------------------

  describe("successful campaign creation (SSE stream)", () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);
    });

    it("returns 200 with SSE content-type headers", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
      expect(res.headers.get("Cache-Control")).toBe("no-cache");
      expect(res.headers.get("Connection")).toBe("keep-alive");
    });

    it("streams a 'status' creating event first", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const creating = events.find(
        (e) =>
          e.event === "status" &&
          (e.data as Record<string, unknown>).phase === "creating",
      );
      expect(creating).toBeDefined();
      expect((creating!.data as Record<string, unknown>).message).toBe(
        "Creating campaign...",
      );
    });

    it("streams a 'status' planning event with campaignId", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const planning = events.find(
        (e) =>
          e.event === "status" &&
          (e.data as Record<string, unknown>).phase === "planning",
      );
      expect(planning).toBeDefined();
      expect((planning!.data as Record<string, unknown>).campaignId).toBe(
        "camp-456",
      );
    });

    it("streams a 'status' saving event with slotsCount", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const saving = events.find(
        (e) =>
          e.event === "status" &&
          (e.data as Record<string, unknown>).phase === "saving",
      );
      expect(saving).toBeDefined();
      expect((saving!.data as Record<string, unknown>).slotsCount).toBe(1);
    });

    it("streams one 'slot' event per plan slot", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const slotEvents = events.filter((e) => e.event === "slot");
      expect(slotEvents).toHaveLength(1);
      expect(slotEvents[0].data).toMatchObject({
        weekNumber: 1,
        slotOrder: 1,
        slotDate: "2026-04-01",
      });
    });

    it("streams a 'complete' event as the final event", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const last = events[events.length - 1];
      expect(last.event).toBe("complete");
      const data = last.data as Record<string, unknown>;
      expect(data.campaignId).toBe("camp-456");
      expect(data.totalSlots).toBe(1);
      expect(data.pillarDistribution).toEqual({ education: 3, inspiration: 3 });
    });

    it("calls planCampaign with all expected fields", async () => {
      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      // Drain the stream so the ReadableStream start() callback completes
      await collectSSEEvents(res);
      expect(mockPlanCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: VALID_BODY.keys.claude,
          campaignId: "camp-456",
          durationWeeks: VALID_BODY.durationWeeks,
          postsPerWeek: VALID_BODY.postsPerWeek,
          goals: VALID_BODY.goals,
          pillarWeights: VALID_BODY.pillarWeights,
          startDate: VALID_BODY.startDate,
        }),
      );
    });

    it("calls fetchKnowledgeForUser with correct userId", async () => {
      const req = buildRequest(VALID_BODY);
      await POST(req);
      expect(mockFetchKnowledgeForUser).toHaveBeenCalledWith(
        "user-123",
        expect.any(String),
      );
    });

    it("handles multiple slots in the plan", async () => {
      const secondSlot: typeof MOCK_SLOT = {
        weekNumber: 1,
        slotOrder: 2,
        slotDate: "2026-04-03",
        topicCard: {
          ...MOCK_SLOT.topicCard,
          title: "Inspiration Post",
          pillar: "inspiration",
        },
      };
      mockPlanCampaign.mockResolvedValue({
        ...MOCK_PLAN,
        slots: [MOCK_SLOT, secondSlot],
      });
      // Extra fetch stub for the second saveCampaignPost call
      stubAllDbFetches();
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "camp-456" }),
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
          statusText: "OK",
        } as Response);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const slotEvents = events.filter((e) => e.event === "slot");
      expect(slotEvents).toHaveLength(2);
      const complete = events.find((e) => e.event === "complete");
      expect((complete!.data as Record<string, unknown>).totalSlots).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Error handling (SSE error events)
  // -------------------------------------------------------------------------

  describe("error handling via SSE error events", () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
    });

    it("streams an 'error' event when createCampaignInDb fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      } as Response);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      expect(res.status).toBe(200); // SSE always opens as 200
      const events = await collectSSEEvents(res);
      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(
        String((errorEvent!.data as Record<string, unknown>).message),
      ).toMatch(/Failed to create campaign/i);
    });

    it("streams an 'error' event when planCampaign throws", async () => {
      stubCreateCampaignFetch();
      mockPlanCampaign.mockRejectedValue(new Error("Anthropic API timeout"));

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(
        String((errorEvent!.data as Record<string, unknown>).message),
      ).toMatch(/Anthropic API timeout/);
    });

    it("streams an 'error' event when saveCampaignPost fails", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "camp-456" }),
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Bad Gateway",
        } as Response);
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(
        String((errorEvent!.data as Record<string, unknown>).message),
      ).toMatch(/Failed to save campaign post/i);
    });

    it("closes the stream even after error (no hanging streams)", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Service Unavailable",
      } as Response);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      // collectSSEEvents should resolve (not hang) — the stream must close
      const events = await Promise.race([
        collectSSEEvents(res),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Stream did not close")), 3000),
        ),
      ]);
      expect(Array.isArray(events)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe("edge cases", () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
    });

    it("handles empty pillarWeights object gracefully", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue({
        ...MOCK_PLAN,
        slots: [],
        pillarDistribution: {},
      });

      const body = { ...VALID_BODY, pillarWeights: {} };
      const req = buildRequest(body);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      expect(events.find((e) => e.event === "complete")).toBeDefined();
    });

    it("handles plan with zero slots", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue({ ...MOCK_PLAN, slots: [] });

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      const complete = events.find((e) => e.event === "complete");
      expect(complete).toBeDefined();
      expect((complete!.data as Record<string, unknown>).totalSlots).toBe(0);
      expect(events.filter((e) => e.event === "slot")).toHaveLength(0);
    });

    it("uses a literal API key (not sentinel) without fetching user profile", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const req = buildRequest(VALID_BODY);
      await POST(req);
      expect(mockFetchUserProfile).not.toHaveBeenCalled();
    });

    it("accepts name with special characters (not XSS-sanitized at route level)", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const body = { ...VALID_BODY, name: "<script>alert('xss')</script>" };
      const req = buildRequest(body);
      const res = await POST(req);
      // Route should pass through — sanitization is DB/render layer concern
      expect(res.status).toBe(200);
    });

    it("accepts very long goals string without error", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const body = { ...VALID_BODY, goals: "A".repeat(5000) };
      const req = buildRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("handles durationWeeks=1 postsPerWeek=1 (minimum valid campaign)", async () => {
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue({ ...MOCK_PLAN, slots: [MOCK_SLOT] });

      const body = { ...VALID_BODY, durationWeeks: 1, postsPerWeek: 1 };
      const req = buildRequest(body);
      const res = await POST(req);
      const events = await collectSSEEvents(res);
      expect(events.find((e) => e.event === "complete")).toBeDefined();
    });

    it("does not call planCampaign when createCampaignInDb fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Conflict",
      } as Response);

      const req = buildRequest(VALID_BODY);
      await POST(req);
      expect(mockPlanCampaign).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Response shape
  // -------------------------------------------------------------------------

  describe("response shape", () => {
    it("401 response has Content-Type application/json", async () => {
      mockGetSessionUser.mockResolvedValue(null);
      const req = buildRequest(VALID_BODY, "");
      const res = await POST(req);
      expect(res.headers.get("Content-Type")).toContain("application/json");
    });

    it("400 response has Content-Type application/json", async () => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
      const req = buildRequest({});
      const res = await POST(req);
      expect(res.headers.get("Content-Type")).toContain("application/json");
    });

    it("200 SSE response body is not null", async () => {
      mockGetSessionUser.mockResolvedValue(MOCK_USER);
      stubAllDbFetches();
      mockPlanCampaign.mockResolvedValue(MOCK_PLAN);

      const req = buildRequest(VALID_BODY);
      const res = await POST(req);
      expect(res.body).not.toBeNull();
    });
  });
});
