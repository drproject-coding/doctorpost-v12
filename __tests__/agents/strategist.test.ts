/**
 * Tests for lib/agents/strategist.ts
 *
 * Strategy:
 * - Mock `callAgentClaude` (the HTTP boundary) to avoid real API calls
 * - Mock `promptBuilder` helpers to isolate strategist logic
 * - Test happy paths, error paths, input variations, and output shape
 */

import { runStrategist } from "../../lib/agents/strategist";
import type {
  StrategistInput,
  StrategistOutput,
} from "../../lib/agents/strategist";
import type { KnowledgeDocument } from "../../lib/knowledge/types";
import type { TopicProposal } from "../../lib/knowledge/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

jest.mock("../../lib/agents/promptBuilder", () => ({
  buildSystemPrompt: jest.fn().mockReturnValue("mocked-system-prompt"),
  resolveKnowledge: jest.fn().mockReturnValue([]),
}));

import { callAgentClaude } from "../../lib/agents/callClaude";
import {
  buildSystemPrompt,
  resolveKnowledge,
} from "../../lib/agents/promptBuilder";

const mockCallAgentClaude = callAgentClaude as jest.MockedFunction<
  typeof callAgentClaude
>;
const mockBuildSystemPrompt = buildSystemPrompt as jest.MockedFunction<
  typeof buildSystemPrompt
>;
const mockResolveKnowledge = resolveKnowledge as jest.MockedFunction<
  typeof resolveKnowledge
>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeDoc(
  category: KnowledgeDocument["category"],
  name: string,
  overrides?: Partial<KnowledgeDocument>,
): KnowledgeDocument {
  return {
    id: `doc-${name}`,
    userId: "user-1",
    category,
    subcategory: name,
    name,
    content: `Content for ${name}`,
    version: 1,
    isActive: true,
    source: "seed",
    updatedAt: "2024-01-01T00:00:00Z",
    updatedBy: "system",
    ...overrides,
  };
}

const MOCK_KNOWLEDGE: KnowledgeDocument[] = [
  makeDoc("rules", "content-strategy"),
  makeDoc("references", "content-matrix"),
  makeDoc("learned", "winners"),
  makeDoc("learned", "preferences"),
];

const MOCK_PROPOSAL: TopicProposal = {
  pillar: "P1 — Modern E-Commerce Architecture",
  angle: "Myth vs. Reality",
  decisionMistake: "Choosing a monolith because microservices feel too complex",
  headline: "Why Most E-Commerce Architectures Fail in Year Two",
  reasoning:
    "P1 is under-represented in recent posts and Month 1 targets positioning",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "contrarian",
};

const MOCK_OUTPUT: StrategistOutput = {
  proposals: [MOCK_PROPOSAL],
  pillarAssessment: "P1 under-represented at 20% vs 30% target",
  angleAssessment: "Myth vs. Reality not used in last 5 posts",
  currentPhase: "Month 1: Positioning",
};

const BASE_INPUT: StrategistInput = {
  apiKey: "sk-ant-test-key",
  knowledge: MOCK_KNOWLEDGE,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockApiSuccess(output: unknown): void {
  mockCallAgentClaude.mockResolvedValueOnce({
    text: JSON.stringify(output),
    tokensUsed: 500,
  });
}

function mockApiSuccessWithFence(output: unknown): void {
  mockCallAgentClaude.mockResolvedValueOnce({
    text: "Here is the analysis:\n```json\n" + JSON.stringify(output) + "\n```",
    tokensUsed: 600,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildSystemPrompt.mockReturnValue("mocked-system-prompt");
  mockResolveKnowledge.mockReturnValue([]);
});

// ── Happy Path ────────────────────────────────────────────────────────────────

describe("runStrategist — happy path", () => {
  it("returns a valid StrategistOutput with proposals, assessments, and phase", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(result).toEqual(MOCK_OUTPUT);
    expect(result.proposals).toHaveLength(1);
    expect(result.pillarAssessment).toBeDefined();
    expect(result.angleAssessment).toBeDefined();
    expect(result.currentPhase).toBeDefined();
  });

  it("calls callAgentClaude exactly once", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    expect(mockCallAgentClaude).toHaveBeenCalledTimes(1);
  });

  it("calls callAgentClaude with correct apiKey and model", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-ant-test-key",
        model: "sonnet",
        maxTokens: 4096,
        systemPrompt: "mocked-system-prompt",
      }),
    );
  });

  it("sends the standard strategy user message when no discoveryBrief", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("3-5 topic ideas");
    expect(call.userMessage).toContain("proposals");
  });

  it("returns multiple proposals", async () => {
    const multiOutput: StrategistOutput = {
      ...MOCK_OUTPUT,
      proposals: [
        MOCK_PROPOSAL,
        { ...MOCK_PROPOSAL, pillar: "P2 — Supply Chain" },
      ],
    };
    mockApiSuccess(multiOutput);

    const result = await runStrategist(BASE_INPUT);

    expect(result.proposals).toHaveLength(2);
  });

  it("each proposal contains all required TopicProposal fields", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    for (const proposal of result.proposals) {
      expect(proposal).toHaveProperty("pillar");
      expect(proposal).toHaveProperty("angle");
      expect(proposal).toHaveProperty("decisionMistake");
      expect(proposal).toHaveProperty("headline");
      expect(proposal).toHaveProperty("reasoning");
      expect(proposal).toHaveProperty("templateRecommendation");
      expect(proposal).toHaveProperty("hookCategoryRecommendation");
    }
  });

  it("parses JSON wrapped in markdown code fences", async () => {
    mockApiSuccessWithFence(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].pillar).toBe(MOCK_PROPOSAL.pillar);
  });

  it("resolves knowledge documents before building the system prompt", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    expect(mockResolveKnowledge).toHaveBeenCalledWith(
      expect.arrayContaining([
        "rules/content-strategy",
        "references/content-matrix",
        "learned/winners",
        "learned/preferences",
      ]),
      MOCK_KNOWLEDGE,
    );
    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "strategist",
      expect.any(Array),
      expect.any(String),
    );
  });
});

// ── recentPosts option ────────────────────────────────────────────────────────

describe("runStrategist — recentPosts option", () => {
  it("includes recentPosts JSON in the system prompt when provided", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const recentPosts = [
      { pillar: "P1", date: "2024-01-10" },
      { pillar: "P2", date: "2024-01-12" },
    ];

    await runStrategist({ ...BASE_INPUT, recentPosts });

    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).toContain("Recent Posts for Pillar Balance");
    expect(extraContext).toContain("P1");
  });

  it("does not add recentPosts section when array is empty", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist({ ...BASE_INPUT, recentPosts: [] });

    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).not.toContain("Recent Posts for Pillar Balance");
  });

  it("does not add recentPosts section when recentPosts is omitted", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).not.toContain("Recent Posts for Pillar Balance");
  });
});

// ── discoveryBrief option ─────────────────────────────────────────────────────

describe("runStrategist — discoveryBrief option", () => {
  const BRIEF =
    "Research found strong LinkedIn engagement on microservices migration pain.";

  const SINGLE_PROPOSAL_OUTPUT = {
    pillar: "P1 — Modern E-Commerce Architecture",
    angle: "Myth vs. Reality",
    decisionMistake: "Migrating to microservices without a strangler fig plan",
    headline: "The Migration Trap: Why Microservices Fail at Scale",
    reasoning: "Discovery data confirms high pain score on this decision",
    templateRecommendation: "strong-opinion",
    hookCategoryRecommendation: "contrarian",
  };

  it("sends the refinement user message when discoveryBrief is provided", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(SINGLE_PROPOSAL_OUTPUT),
      tokensUsed: 400,
    });

    await runStrategist({ ...BASE_INPUT, discoveryBrief: BRIEF });

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("Refine the selected topic");
    expect(call.userMessage).toContain("single sharpened TopicProposal");
  });

  it("includes the discoveryBrief in the system prompt extra context", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(SINGLE_PROPOSAL_OUTPUT),
      tokensUsed: 400,
    });

    await runStrategist({ ...BASE_INPUT, discoveryBrief: BRIEF });

    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).toContain("Discovery Brief (from Research)");
    expect(extraContext).toContain(BRIEF);
  });

  it("does not include discovery brief context when discoveryBrief is omitted", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist(BASE_INPUT);

    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).not.toContain("Discovery Brief");
  });

  it("returns the single refined TopicProposal returned by the API", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(SINGLE_PROPOSAL_OUTPUT),
      tokensUsed: 400,
    });

    const result = await runStrategist({
      ...BASE_INPUT,
      discoveryBrief: BRIEF,
    });

    // extractJson returns whatever shape the AI returns; in discovery mode it
    // returns a single TopicProposal object cast as StrategistOutput
    expect(result).toEqual(SINGLE_PROPOSAL_OUTPUT);
  });
});

// ── AbortSignal ───────────────────────────────────────────────────────────────

describe("runStrategist — AbortSignal", () => {
  it("forwards the signal to callAgentClaude", async () => {
    mockApiSuccess(MOCK_OUTPUT);
    const controller = new AbortController();

    await runStrategist({ ...BASE_INPUT, signal: controller.signal });

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("propagates AbortError when the request is aborted", async () => {
    const controller = new AbortController();
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    mockCallAgentClaude.mockRejectedValueOnce(abortError);

    controller.abort();

    await expect(
      runStrategist({ ...BASE_INPUT, signal: controller.signal }),
    ).rejects.toThrow("The operation was aborted.");
  });
});

// ── API Error Handling ────────────────────────────────────────────────────────

describe("runStrategist — API errors", () => {
  it("throws when the API returns a non-OK status", async () => {
    mockCallAgentClaude.mockRejectedValueOnce(
      new Error("Claude API error (401): Unauthorized"),
    );

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow(
      "Claude API error (401)",
    );
  });

  it("throws when the API returns a 500 error", async () => {
    mockCallAgentClaude.mockRejectedValueOnce(
      new Error("Claude API error (500): Internal Server Error"),
    );

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow(
      "Claude API error (500)",
    );
  });

  it("throws when the API returns an empty response", async () => {
    mockCallAgentClaude.mockRejectedValueOnce(
      new Error("Claude API returned an empty response"),
    );

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow(
      "Claude API returned an empty response",
    );
  });

  it("throws when the response text is not parseable JSON", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: "Sorry, I cannot help with that.",
      tokensUsed: 50,
    });

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow(
      "Failed to extract JSON from agent response",
    );
  });

  it("throws when the response is an empty string", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({ text: "", tokensUsed: 0 });

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow();
  });

  it("throws when the response is truncated/malformed JSON", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: '{"proposals": [{"pillar": "P1"',
      tokensUsed: 100,
    });

    await expect(runStrategist(BASE_INPUT)).rejects.toThrow();
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe("runStrategist — edge cases", () => {
  it("handles empty knowledge array gracefully", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist({ ...BASE_INPUT, knowledge: [] });

    expect(result).toEqual(MOCK_OUTPUT);
    expect(mockResolveKnowledge).toHaveBeenCalledWith(expect.any(Array), []);
  });

  it("handles special characters in discovery brief without throwing", async () => {
    const specialBrief =
      'Brief with "quotes", <tags>, & ampersands, and emoji 🚀';
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(MOCK_OUTPUT),
      tokensUsed: 300,
    });

    const result = await runStrategist({
      ...BASE_INPUT,
      discoveryBrief: specialBrief,
    });

    expect(result).toEqual(MOCK_OUTPUT);
    const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
    expect(extraContext).toContain(specialBrief);
  });

  it("handles large proposals array (5 proposals)", async () => {
    const fiveProposals: StrategistOutput = {
      ...MOCK_OUTPUT,
      proposals: Array.from({ length: 5 }, (_, i) => ({
        ...MOCK_PROPOSAL,
        pillar: `P${i + 1} — Pillar ${i + 1}`,
      })),
    };
    mockApiSuccess(fiveProposals);

    const result = await runStrategist(BASE_INPUT);

    expect(result.proposals).toHaveLength(5);
  });

  it("handles response JSON embedded in surrounding prose", async () => {
    const embeddedJson =
      "Based on my analysis, here is my strategic recommendation:\n" +
      JSON.stringify(MOCK_OUTPUT) +
      "\n\nLet me know if you need clarification.";

    mockCallAgentClaude.mockResolvedValueOnce({
      text: embeddedJson,
      tokensUsed: 700,
    });

    const result = await runStrategist(BASE_INPUT);

    expect(result.proposals).toHaveLength(1);
    expect(result.pillarAssessment).toBe(MOCK_OUTPUT.pillarAssessment);
  });

  it("handles inactive knowledge documents (resolveKnowledge filters them)", async () => {
    const inactiveDocs: KnowledgeDocument[] = [
      makeDoc("rules", "content-strategy", { isActive: false }),
    ];
    // resolveKnowledge is mocked; confirm it is called with the provided docs
    mockApiSuccess(MOCK_OUTPUT);

    await runStrategist({ ...BASE_INPUT, knowledge: inactiveDocs });

    expect(mockResolveKnowledge).toHaveBeenCalledWith(
      expect.any(Array),
      inactiveDocs,
    );
  });

  it("handles unicode in proposal fields", async () => {
    const unicodeProposal: TopicProposal = {
      ...MOCK_PROPOSAL,
      headline: "Comment réussir l'intégration: 失败 vs 成功",
      reasoning: "Análisis del mercado español & 日本語",
    };
    mockApiSuccess({ ...MOCK_OUTPUT, proposals: [unicodeProposal] });

    const result = await runStrategist(BASE_INPUT);

    expect(result.proposals[0].headline).toBe(unicodeProposal.headline);
    expect(result.proposals[0].reasoning).toBe(unicodeProposal.reasoning);
  });

  it("does not mutate the input object", async () => {
    mockApiSuccess(MOCK_OUTPUT);
    const inputCopy = JSON.parse(JSON.stringify(BASE_INPUT)) as StrategistInput;

    await runStrategist(BASE_INPUT);

    expect(BASE_INPUT).toEqual(inputCopy);
  });
});

// ── Output Shape Contract ─────────────────────────────────────────────────────

describe("runStrategist — output shape contract", () => {
  it("output has exactly the expected top-level keys", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(Object.keys(result).sort()).toEqual(
      [
        "angleAssessment",
        "currentPhase",
        "pillarAssessment",
        "proposals",
      ].sort(),
    );
  });

  it("proposals is always an array", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(Array.isArray(result.proposals)).toBe(true);
  });

  it("pillarAssessment is a non-empty string", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(typeof result.pillarAssessment).toBe("string");
    expect(result.pillarAssessment.length).toBeGreaterThan(0);
  });

  it("angleAssessment is a non-empty string", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(typeof result.angleAssessment).toBe("string");
    expect(result.angleAssessment.length).toBeGreaterThan(0);
  });

  it("currentPhase is a non-empty string", async () => {
    mockApiSuccess(MOCK_OUTPUT);

    const result = await runStrategist(BASE_INPUT);

    expect(typeof result.currentPhase).toBe("string");
    expect(result.currentPhase.length).toBeGreaterThan(0);
  });
});
