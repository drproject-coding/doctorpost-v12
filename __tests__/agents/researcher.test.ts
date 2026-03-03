/**
 * Comprehensive tests for lib/agents/researcher.ts
 *
 * Mocks:
 *   - global fetch  (Claude API, Perplexity API, Reddit OAuth + search)
 *   - ./promptBuilder  (buildSystemPrompt, resolveKnowledge)
 *   - ./structuredOutput (extractJson)
 *   - ./callClaude (callAgentClaude)
 *   - ./integrations/perplexity (searchPerplexity)
 *   - ./integrations/reddit (searchReddit)
 */

import {
  runResearcher,
  type ResearcherInput,
} from "../../lib/agents/researcher";
import type { KnowledgeDocument } from "../../lib/knowledge/types";
import type { DiscoveryBrief, EvidencePack } from "../../lib/knowledge/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/promptBuilder", () => ({
  buildSystemPrompt: jest.fn(() => "mocked-system-prompt"),
  resolveKnowledge: jest.fn(
    (keys: string[], docs: KnowledgeDocument[]) => docs,
  ),
}));

jest.mock("../../lib/agents/structuredOutput", () => ({
  extractJson: jest.fn((text: string) => JSON.parse(text)),
}));

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

jest.mock("../../lib/agents/integrations/perplexity", () => ({
  searchPerplexity: jest.fn(),
}));

jest.mock("../../lib/agents/integrations/reddit", () => ({
  searchReddit: jest.fn(),
}));

// ── Import mocked modules for type-safe access ────────────────────────────────

import {
  buildSystemPrompt,
  resolveKnowledge,
} from "../../lib/agents/promptBuilder";
import { extractJson } from "../../lib/agents/structuredOutput";
import { callAgentClaude } from "../../lib/agents/callClaude";
import { searchPerplexity } from "../../lib/agents/integrations/perplexity";
import { searchReddit } from "../../lib/agents/integrations/reddit";

const mockBuildSystemPrompt = buildSystemPrompt as jest.MockedFunction<
  typeof buildSystemPrompt
>;
const mockResolveKnowledge = resolveKnowledge as jest.MockedFunction<
  typeof resolveKnowledge
>;
const mockExtractJson = extractJson as jest.MockedFunction<typeof extractJson>;
const mockCallAgentClaude = callAgentClaude as jest.MockedFunction<
  typeof callAgentClaude
>;
const mockSearchPerplexity = searchPerplexity as jest.MockedFunction<
  typeof searchPerplexity
>;
const mockSearchReddit = searchReddit as jest.MockedFunction<
  typeof searchReddit
>;

// ── Test fixtures ─────────────────────────────────────────────────────────────

function makeKnowledgeDoc(
  overrides: Partial<KnowledgeDocument> = {},
): KnowledgeDocument {
  return {
    id: "doc-1",
    userId: "user-1",
    category: "rules",
    subcategory: "content-strategy",
    name: "content-strategy",
    content: "Brand content strategy content",
    version: 1,
    isActive: true,
    source: "seed",
    updatedAt: "2024-01-01T00:00:00Z",
    updatedBy: "system",
    ...overrides,
  };
}

const DISCOVERY_BRIEF: DiscoveryBrief = {
  subtopicAngles: [
    {
      angle: "Vendor lock-in risks",
      source: "Reddit",
      relevance: "High enterprise concern",
    },
  ],
  painPoints: [
    {
      quote: "Migration costs are underestimated",
      source: "Practitioner forum",
      context: "CTO perspective",
    },
  ],
  currentDebates: ["Cloud-native vs hybrid approach"],
  questionsAsked: ["How do you avoid vendor lock-in?"],
};

const EVIDENCE_PACK: EvidencePack = {
  claims: [
    {
      fact: "78% of enterprises cite migration cost as blocker",
      source: "Gartner 2023",
      sourceUrl: "https://gartner.com/report",
      verification: "verified",
      usageNote: "Use in opening argument",
    },
  ],
  humanVoices: [
    {
      quote: "We spent 18 months on a migration that could have been 6",
      context: "Fortune 500 CTO",
      sentiment: "frustrated",
    },
  ],
  counterArguments: [
    "Cloud-native benefits outweigh migration costs for greenfield",
  ],
  freshAngles: ["Frame migration as organisational change, not technical"],
};

function baseDiscoveryInput(
  overrides: Partial<ResearcherInput> = {},
): ResearcherInput {
  return {
    apiKey: "test-api-key",
    knowledge: [makeKnowledgeDoc()],
    mode: "discovery",
    topic: "Enterprise cloud migration",
    ...overrides,
  };
}

function baseEvidenceInput(
  overrides: Partial<ResearcherInput> = {},
): ResearcherInput {
  return {
    apiKey: "test-api-key",
    knowledge: [makeKnowledgeDoc()],
    mode: "evidence",
    topic: "Enterprise cloud migration",
    angle: "Vendor lock-in as the real risk",
    ...overrides,
  };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Sensible defaults — tests override as needed
  mockResolveKnowledge.mockImplementation((_keys, docs) => docs);
  mockBuildSystemPrompt.mockReturnValue("mocked-system-prompt");
  mockCallAgentClaude.mockResolvedValue({
    text: JSON.stringify(DISCOVERY_BRIEF),
    tokensUsed: 500,
  });
  mockExtractJson.mockImplementation((text) => JSON.parse(text));
});

// ── Discovery mode ────────────────────────────────────────────────────────────

describe("runResearcher — discovery mode", () => {
  it("returns a DiscoveryBrief on success", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 500,
    });

    const result = await runResearcher(baseDiscoveryInput());

    expect(result).toEqual(DISCOVERY_BRIEF);
  });

  it("calls resolveKnowledge with researcher required keys", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const docs = [makeKnowledgeDoc()];
    await runResearcher(baseDiscoveryInput({ knowledge: docs }));

    expect(mockResolveKnowledge).toHaveBeenCalledWith(
      ["rules/content-strategy", "references/kpi-benchmarks"],
      docs,
    );
  });

  it("calls buildSystemPrompt with role 'researcher'", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "researcher",
      expect.any(Array),
      expect.any(String),
    );
  });

  it("sends discovery-mode user message to Claude", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ topic: "AI in healthcare" }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("AI in healthcare");
    expect(call.userMessage).toContain("DISCOVERY");
    expect(call.userMessage).toContain("DiscoveryBrief");
  });

  it("passes the correct Claude model and maxTokens", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.model).toBe("sonnet");
    expect(call.maxTokens).toBe(4096);
    expect(call.apiKey).toBe("test-api-key");
  });

  it("forwards AbortSignal to callAgentClaude", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });
    const controller = new AbortController();

    await runResearcher(baseDiscoveryInput({ signal: controller.signal }));

    expect(mockCallAgentClaude.mock.calls[0][0].signal).toBe(controller.signal);
  });
});

// ── Evidence mode ─────────────────────────────────────────────────────────────

describe("runResearcher — evidence mode", () => {
  it("returns an EvidencePack on success", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 600,
    });

    const result = await runResearcher(baseEvidenceInput());

    expect(result).toEqual(EVIDENCE_PACK);
  });

  it("sends evidence-mode user message including angle", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    await runResearcher(
      baseEvidenceInput({ angle: "Total cost of ownership" }),
    );

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("EVIDENCE GATHERING");
    expect(call.userMessage).toContain("Total cost of ownership");
    expect(call.userMessage).toContain("EvidencePack");
  });

  it("uses empty string for angle when none provided", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    await runResearcher(baseEvidenceInput({ angle: undefined }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain('Angle: ""');
  });
});

// ── Perplexity integration ────────────────────────────────────────────────────

describe("runResearcher — Perplexity integration", () => {
  it("calls searchPerplexity when perplexityKey is provided", async () => {
    mockSearchPerplexity.mockResolvedValue({
      answer: "Cloud migration stats",
      citations: ["https://source.com"],
    });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ perplexityKey: "pplx-key" }));

    expect(mockSearchPerplexity).toHaveBeenCalledTimes(1);
  });

  it("uses 'internet' focus for discovery mode", async () => {
    mockSearchPerplexity.mockResolvedValue({ answer: "result", citations: [] });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ perplexityKey: "pplx-key" }));

    expect(mockSearchPerplexity).toHaveBeenCalledWith(
      expect.any(String),
      "pplx-key",
      { focus: "internet" },
    );
  });

  it("uses 'scholar' focus for evidence mode", async () => {
    mockSearchPerplexity.mockResolvedValue({ answer: "result", citations: [] });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    await runResearcher(baseEvidenceInput({ perplexityKey: "pplx-key" }));

    expect(mockSearchPerplexity).toHaveBeenCalledWith(
      expect.any(String),
      "pplx-key",
      { focus: "scholar" },
    );
  });

  it("builds discovery query containing topic and pain-point keywords", async () => {
    mockSearchPerplexity.mockResolvedValue({ answer: "result", citations: [] });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(
      baseDiscoveryInput({
        topic: "DevOps tooling",
        perplexityKey: "pplx-key",
      }),
    );

    const query = (
      mockSearchPerplexity.mock.calls[0] as unknown[]
    )[0] as string;
    expect(query).toContain("DevOps tooling");
    expect(query).toContain("challenges");
  });

  it("builds evidence query containing topic and angle", async () => {
    mockSearchPerplexity.mockResolvedValue({ answer: "result", citations: [] });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    await runResearcher(
      baseEvidenceInput({
        topic: "DevOps tooling",
        angle: "ROI metrics",
        perplexityKey: "pplx-key",
      }),
    );

    const query = (
      mockSearchPerplexity.mock.calls[0] as unknown[]
    )[0] as string;
    expect(query).toContain("DevOps tooling");
    expect(query).toContain("ROI metrics");
    expect(query).toContain("statistics");
  });

  it("injects Perplexity answer and citations into extraContext passed to buildSystemPrompt", async () => {
    mockSearchPerplexity.mockResolvedValue({
      answer: "Key finding here",
      citations: ["https://cite1.com", "https://cite2.com"],
    });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ perplexityKey: "pplx-key" }));

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).toContain("Key finding here");
    expect(extraContext).toContain("https://cite1.com");
  });

  it("does NOT call searchPerplexity when perplexityKey is absent", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    expect(mockSearchPerplexity).not.toHaveBeenCalled();
  });

  it("continues and records failure message when Perplexity throws", async () => {
    mockSearchPerplexity.mockRejectedValue(new Error("Rate limit exceeded"));
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    // Should not throw — error is swallowed and noted in context
    const result = await runResearcher(
      baseDiscoveryInput({ perplexityKey: "pplx-key" }),
    );

    expect(result).toEqual(DISCOVERY_BRIEF);

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).toContain("Search failed");
    expect(extraContext).toContain("Rate limit exceeded");
  });
});

// ── Reddit integration ────────────────────────────────────────────────────────

describe("runResearcher — Reddit integration", () => {
  const redditCredentials = { clientId: "cid", clientSecret: "csec" };

  const redditResultWithPosts = {
    posts: [
      {
        title: "How we handled cloud migration",
        selftext: "Detailed post content here...",
        subreddit: "sysadmin",
        score: 342,
        numComments: 87,
        url: "https://reddit.com/r/sysadmin/comments/abc123",
        created: 1700000000,
      },
    ],
  };

  it("calls searchReddit when redditCredentials are provided", async () => {
    mockSearchReddit.mockResolvedValue(redditResultWithPosts);
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ redditCredentials }));

    expect(mockSearchReddit).toHaveBeenCalledTimes(1);
  });

  it("searches the expected subreddits", async () => {
    mockSearchReddit.mockResolvedValue(redditResultWithPosts);
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ redditCredentials }));

    const opts = (mockSearchReddit.mock.calls[0] as unknown[])[2] as {
      subreddits: string[];
      limit: number;
    };
    expect(opts.subreddits).toEqual(
      expect.arrayContaining([
        "ecommerce",
        "sysadmin",
        "ITManagers",
        "CTO",
        "datascience",
      ]),
    );
    expect(opts.limit).toBe(5);
  });

  it("injects Reddit post data into extraContext when posts are found", async () => {
    mockSearchReddit.mockResolvedValue(redditResultWithPosts);
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ redditCredentials }));

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).toContain("Reddit Results");
    expect(extraContext).toContain("How we handled cloud migration");
    expect(extraContext).toContain("sysadmin");
  });

  it("does not inject Reddit section when posts array is empty", async () => {
    mockSearchReddit.mockResolvedValue({ posts: [] });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput({ redditCredentials }));

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).not.toContain("Reddit Results");
  });

  it("does NOT call searchReddit when redditCredentials are absent", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    expect(mockSearchReddit).not.toHaveBeenCalled();
  });

  it("continues and records failure message when Reddit throws", async () => {
    mockSearchReddit.mockRejectedValue(new Error("Reddit auth failed (401)"));
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const result = await runResearcher(
      baseDiscoveryInput({ redditCredentials }),
    );

    expect(result).toEqual(DISCOVERY_BRIEF);

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).toContain("Search failed");
    expect(extraContext).toContain("Reddit auth failed (401)");
  });
});

// ── Both integrations active ──────────────────────────────────────────────────

describe("runResearcher — both integrations active", () => {
  it("includes both Perplexity and Reddit data in extraContext", async () => {
    mockSearchPerplexity.mockResolvedValue({
      answer: "Perplexity answer text",
      citations: ["https://pplx-source.com"],
    });
    mockSearchReddit.mockResolvedValue({
      posts: [
        {
          title: "Reddit post title",
          selftext: "Reddit content",
          subreddit: "CTO",
          score: 100,
          numComments: 20,
          url: "https://reddit.com/r/CTO/comments/xyz",
          created: 1700000000,
        },
      ],
    });
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(
      baseDiscoveryInput({
        perplexityKey: "pplx-key",
        redditCredentials: { clientId: "cid", clientSecret: "csec" },
      }),
    );

    const extraContext = (
      mockBuildSystemPrompt.mock.calls[0] as unknown[]
    )[2] as string;
    expect(extraContext).toContain("Perplexity Results");
    expect(extraContext).toContain("Perplexity answer text");
    expect(extraContext).toContain("Reddit Results");
    expect(extraContext).toContain("Reddit post title");
  });
});

// ── Claude API error handling ─────────────────────────────────────────────────

describe("runResearcher — Claude API error handling", () => {
  it("propagates Claude API errors", async () => {
    mockCallAgentClaude.mockRejectedValue(
      new Error("Claude API error (429): Too many requests"),
    );

    await expect(runResearcher(baseDiscoveryInput())).rejects.toThrow(
      "Claude API error (429): Too many requests",
    );
  });

  it("propagates AbortError when signal is aborted", async () => {
    const controller = new AbortController();
    mockCallAgentClaude.mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );

    const promise = runResearcher(
      baseDiscoveryInput({ signal: controller.signal }),
    );
    controller.abort();

    await expect(promise).rejects.toThrow("Aborted");
  });
});

// ── JSON extraction / malformed response handling ────────────────────────────

describe("runResearcher — JSON extraction", () => {
  it("calls extractJson with Claude response text", async () => {
    const rawText = JSON.stringify(DISCOVERY_BRIEF);
    mockCallAgentClaude.mockResolvedValue({ text: rawText, tokensUsed: 100 });

    await runResearcher(baseDiscoveryInput());

    expect(mockExtractJson).toHaveBeenCalledWith(rawText);
  });

  it("handles response wrapped in markdown code fence", async () => {
    // Real extractJson handles this — replace mock to use real implementation
    jest.resetModules();
    const { extractJson: realExtractJson } = jest.requireActual<
      typeof import("../../lib/agents/structuredOutput")
    >("../../lib/agents/structuredOutput");
    mockExtractJson.mockImplementation(realExtractJson);

    const fencedText = "```json\n" + JSON.stringify(DISCOVERY_BRIEF) + "\n```";
    mockCallAgentClaude.mockResolvedValue({
      text: fencedText,
      tokensUsed: 100,
    });

    const result = await runResearcher(baseDiscoveryInput());
    expect(result).toEqual(DISCOVERY_BRIEF);
  });

  it("throws when extractJson cannot parse the response", async () => {
    mockExtractJson.mockImplementation(() => {
      throw new Error(
        'Failed to extract JSON from agent response. Raw output starts with: "Not JSON at all..."',
      );
    });
    mockCallAgentClaude.mockResolvedValue({
      text: "Not JSON at all",
      tokensUsed: 100,
    });

    await expect(runResearcher(baseDiscoveryInput())).rejects.toThrow(
      "Failed to extract JSON from agent response",
    );
  });
});

// ── Knowledge resolution ──────────────────────────────────────────────────────

describe("runResearcher — knowledge resolution", () => {
  it("passes resolved docs to buildSystemPrompt", async () => {
    const resolvedDocs = [
      makeKnowledgeDoc({ category: "rules", name: "content-strategy" }),
      makeKnowledgeDoc({ category: "references", name: "kpi-benchmarks" }),
    ];
    mockResolveKnowledge.mockReturnValue(resolvedDocs);
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "researcher",
      resolvedDocs,
      expect.any(String),
    );
  });

  it("works correctly with an empty knowledge array", async () => {
    mockResolveKnowledge.mockReturnValue([]);
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const result = await runResearcher(baseDiscoveryInput({ knowledge: [] }));

    expect(result).toEqual(DISCOVERY_BRIEF);
    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "researcher",
      [],
      expect.any(String),
    );
  });

  it("filters out inactive documents via resolveKnowledge", async () => {
    const activeDocs = [makeKnowledgeDoc({ isActive: true })];
    const inactiveDocs = [makeKnowledgeDoc({ isActive: false })];
    mockResolveKnowledge.mockReturnValue(activeDocs); // simulates real filter behaviour
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(
      baseDiscoveryInput({ knowledge: [...activeDocs, ...inactiveDocs] }),
    );

    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "researcher",
      activeDocs,
      expect.any(String),
    );
  });
});

// ── Output shape validation ───────────────────────────────────────────────────

describe("runResearcher — output shape", () => {
  it("DiscoveryBrief has required top-level keys", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const result = (await runResearcher(
      baseDiscoveryInput(),
    )) as DiscoveryBrief;

    expect(result).toHaveProperty("subtopicAngles");
    expect(result).toHaveProperty("painPoints");
    expect(result).toHaveProperty("currentDebates");
    expect(result).toHaveProperty("questionsAsked");
  });

  it("subtopicAngles items have angle, source, relevance", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const result = (await runResearcher(
      baseDiscoveryInput(),
    )) as DiscoveryBrief;

    result.subtopicAngles.forEach((item) => {
      expect(item).toHaveProperty("angle");
      expect(item).toHaveProperty("source");
      expect(item).toHaveProperty("relevance");
    });
  });

  it("EvidencePack has required top-level keys", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    const result = (await runResearcher(baseEvidenceInput())) as EvidencePack;

    expect(result).toHaveProperty("claims");
    expect(result).toHaveProperty("humanVoices");
    expect(result).toHaveProperty("counterArguments");
    expect(result).toHaveProperty("freshAngles");
  });

  it("EvidencePack claims have all required fields", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    const result = (await runResearcher(baseEvidenceInput())) as EvidencePack;

    result.claims.forEach((claim) => {
      expect(claim).toHaveProperty("fact");
      expect(claim).toHaveProperty("source");
      expect(claim).toHaveProperty("sourceUrl");
      expect(claim).toHaveProperty("verification");
      expect(claim).toHaveProperty("usageNote");
      expect(["verified", "estimate", "anecdotal"]).toContain(
        claim.verification,
      );
    });
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("runResearcher — edge cases", () => {
  it("handles topic with special characters", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    const result = await runResearcher(
      baseDiscoveryInput({
        topic: 'AI & ML: "Deep Learning" — state of the art',
      }),
    );

    expect(result).toEqual(DISCOVERY_BRIEF);
    const userMessage = mockCallAgentClaude.mock.calls[0][0].userMessage;
    expect(userMessage).toContain("AI & ML");
  });

  it("handles very long topic string without error", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });
    const longTopic = "A".repeat(2000);

    await expect(
      runResearcher(baseDiscoveryInput({ topic: longTopic })),
    ).resolves.toEqual(DISCOVERY_BRIEF);
  });

  it("passes systemPrompt from buildSystemPrompt to callAgentClaude", async () => {
    mockBuildSystemPrompt.mockReturnValue("custom-system-prompt-xyz");
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    await runResearcher(baseDiscoveryInput());

    expect(mockCallAgentClaude.mock.calls[0][0].systemPrompt).toBe(
      "custom-system-prompt-xyz",
    );
  });

  it("Perplexity and Reddit errors do not prevent valid Claude response from being returned", async () => {
    mockSearchPerplexity.mockRejectedValue(new Error("Timeout"));
    mockSearchReddit.mockRejectedValue(new Error("Network error"));
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(EVIDENCE_PACK),
      tokensUsed: 100,
    });

    const result = await runResearcher(
      baseEvidenceInput({
        perplexityKey: "pplx-key",
        redditCredentials: { clientId: "cid", clientSecret: "csec" },
      }),
    );

    expect(result).toEqual(EVIDENCE_PACK);
  });

  it("returns discovery result (not evidence pack) in discovery mode even when angle is provided", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(DISCOVERY_BRIEF),
      tokensUsed: 100,
    });

    // mode='discovery' overrides presence of angle
    const result = await runResearcher(
      baseDiscoveryInput({ angle: "Should be ignored in discovery mode" }),
    );

    // extractJson should have been called with the discovery brief text
    expect(mockExtractJson).toHaveBeenCalledWith(
      JSON.stringify(DISCOVERY_BRIEF),
    );
    expect(result).toEqual(DISCOVERY_BRIEF);
  });
});
