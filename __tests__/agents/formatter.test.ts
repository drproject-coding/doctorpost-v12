/**
 * Tests for lib/agents/formatter.ts
 *
 * Strategy: mock callAgentClaude and verify that runFormatter
 * correctly orchestrates knowledge resolution, prompt building,
 * Claude invocation, and JSON extraction into a FormattedPost.
 * extractJson is tested independently for all parsing branches.
 */

import { runFormatter, type FormatterInput } from "../../lib/agents/formatter";
import { extractJson } from "../../lib/agents/structuredOutput";
import type {
  KnowledgeDocument,
  FormattedPost,
  TopicProposal,
} from "../../lib/knowledge/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

jest.mock("../../lib/agents/promptBuilder", () => ({
  buildSystemPrompt: jest.fn(() => "mock-system-prompt"),
  resolveKnowledge: jest.fn((keys: string[], docs: KnowledgeDocument[]) =>
    docs.filter((d) => keys.includes(`${d.category}/${d.name}`)),
  ),
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
  isActive = true,
): KnowledgeDocument {
  return {
    id: `doc-${category}-${name}`,
    userId: "user-1",
    category,
    subcategory: category,
    name,
    content: `Content for ${category}/${name}`,
    version: 1,
    isActive,
    source: "seed",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "system",
  };
}

const formattingRulesDoc = makeDoc("rules", "formatting-rules");
const templateDoc = makeDoc("templates", "strong-opinion");

const baseTopicCard: TopicProposal = {
  pillar: "P1 — Modern E-Commerce Architecture",
  angle: "Myth vs. Reality",
  decisionMistake: "Choosing the wrong architecture early",
  headline: "Why your e-commerce platform will fail in year 3",
  reasoning: "Evergreen concern for CTOs",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "contrarian",
};

const baseFormattedPost: FormattedPost = {
  content:
    "Most e-commerce platforms are already dead.\n\nThey just don't know it yet.\n\nHere's why.",
  characterCount: 1250,
  hookBeforeFold: { mobile: true, desktop: true },
  suggestedPinnedComment:
    "If you want the full framework I use to audit platform decisions, drop a comment.",
  metadata: {
    template: "strong-opinion",
    pillar: "P1 — Modern E-Commerce Architecture",
    angle: "Myth vs. Reality",
    score: 85,
  },
};

function makeInput(overrides: Partial<FormatterInput> = {}): FormatterInput {
  return {
    apiKey: "test-api-key",
    knowledge: [formattingRulesDoc, templateDoc],
    draft:
      "Most e-commerce platforms are already dead.\n\nThey just don't know it yet.",
    score: 85,
    topicCard: baseTopicCard,
    template: "strong-opinion",
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockClaudeReturns(post: FormattedPost) {
  mockCallAgentClaude.mockResolvedValueOnce({
    text: JSON.stringify(post),
    tokensUsed: 500,
  });
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe("runFormatter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveKnowledge.mockImplementation((keys, docs) =>
      docs.filter((d) => keys.includes(`${d.category}/${d.name}`)),
    );
    mockBuildSystemPrompt.mockReturnValue("mock-system-prompt");
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  describe("successful formatting", () => {
    it("returns a well-formed FormattedPost", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());

      expect(result).toEqual(baseFormattedPost);
    });

    it("passes the correct model and maxTokens to callAgentClaude", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput());

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "haiku",
          maxTokens: 4096,
          apiKey: "test-api-key",
        }),
      );
    });

    it("injects score and draft into the extra context string", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput({ score: 92, draft: "My draft text" }));

      // extraContext is the 3rd arg passed to buildSystemPrompt
      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("92");
      expect(extraContext).toContain("My draft text");
    });

    it("injects template, pillar, and angle into extra context", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput());

      // extraContext is the 3rd arg passed to buildSystemPrompt
      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("strong-opinion");
      expect(extraContext).toContain("P1 — Modern E-Commerce Architecture");
      expect(extraContext).toContain("Myth vs. Reality");
    });

    it("passes the abort signal through to callAgentClaude", async () => {
      const controller = new AbortController();
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput({ signal: controller.signal }));

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it("includes the formatting user message instruction", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput());

      const call = mockCallAgentClaude.mock.calls[0][0];
      expect(call.userMessage).toMatch(
        /Format this approved draft for LinkedIn/i,
      );
      expect(call.userMessage).toMatch(/FormattedPost JSON/i);
    });
  });

  // ── Knowledge resolution ────────────────────────────────────────────────────

  describe("knowledge resolution", () => {
    it("calls resolveKnowledge with formatter required keys", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput());

      expect(mockResolveKnowledge).toHaveBeenCalledWith(
        ["rules/formatting-rules"],
        expect.any(Array),
      );
    });

    it("appends the matching template skill doc when found", async () => {
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(makeInput());

      // buildSystemPrompt should receive docs including the template doc
      const docsArg = mockBuildSystemPrompt.mock
        .calls[0][1] as KnowledgeDocument[];
      expect(
        docsArg.some(
          (d) => d.category === "templates" && d.name === "strong-opinion",
        ),
      ).toBe(true);
    });

    it("does not fail when no matching template doc exists", async () => {
      mockClaudeReturns(baseFormattedPost);
      // knowledge has no template doc for "strong-opinion"
      const input = makeInput({
        knowledge: [formattingRulesDoc],
        template: "strong-opinion",
      });
      const result = await runFormatter(input);

      expect(result).toEqual(baseFormattedPost);
    });

    it("handles an empty knowledge array without throwing", async () => {
      mockClaudeReturns(baseFormattedPost);
      mockResolveKnowledge.mockReturnValueOnce([]);
      const result = await runFormatter(makeInput({ knowledge: [] }));

      expect(result).toEqual(baseFormattedPost);
    });

    it("uses only the template doc matching input.template name", async () => {
      const otherTemplate = makeDoc("templates", "listicle");
      const input = makeInput({
        knowledge: [formattingRulesDoc, templateDoc, otherTemplate],
        template: "strong-opinion",
      });
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(input);

      const docsArg = mockBuildSystemPrompt.mock
        .calls[0][1] as KnowledgeDocument[];
      // listicle should NOT be in the docs
      expect(docsArg.some((d) => d.name === "listicle")).toBe(false);
    });
  });

  // ── Output shape ────────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("result has content as a string", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());
      expect(typeof result.content).toBe("string");
    });

    it("result has characterCount as a number", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());
      expect(typeof result.characterCount).toBe("number");
    });

    it("result.hookBeforeFold has mobile and desktop booleans", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());
      expect(typeof result.hookBeforeFold.mobile).toBe("boolean");
      expect(typeof result.hookBeforeFold.desktop).toBe("boolean");
    });

    it("result has suggestedPinnedComment as a string", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());
      expect(typeof result.suggestedPinnedComment).toBe("string");
    });

    it("result.metadata contains template, pillar, angle, score", async () => {
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput());
      expect(result.metadata).toMatchObject({
        template: expect.any(String),
        pillar: expect.any(String),
        angle: expect.any(String),
        score: expect.any(Number),
      });
    });

    it("preserves exact metadata values returned by Claude", async () => {
      const post: FormattedPost = {
        ...baseFormattedPost,
        metadata: {
          template: "listicle",
          pillar: "P3",
          angle: "How-To",
          score: 77,
        },
      };
      mockClaudeReturns(post);
      const result = await runFormatter(makeInput());
      expect(result.metadata).toEqual({
        template: "listicle",
        pillar: "P3",
        angle: "How-To",
        score: 77,
      });
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  describe("error handling", () => {
    it("propagates Claude API errors", async () => {
      mockCallAgentClaude.mockRejectedValueOnce(
        new Error("Claude API error (401): Unauthorized"),
      );
      await expect(runFormatter(makeInput())).rejects.toThrow(
        "Claude API error (401): Unauthorized",
      );
    });

    it("throws when Claude returns empty text", async () => {
      mockCallAgentClaude.mockRejectedValueOnce(
        new Error("Claude API returned an empty response"),
      );
      await expect(runFormatter(makeInput())).rejects.toThrow(
        "Claude API returned an empty response",
      );
    });

    it("throws when Claude returns unparseable JSON", async () => {
      mockCallAgentClaude.mockResolvedValueOnce({
        text: "Sorry, I cannot format this content.",
        tokensUsed: 50,
      });
      await expect(runFormatter(makeInput())).rejects.toThrow(
        /Failed to extract JSON/i,
      );
    });

    it("throws when Claude returns malformed JSON", async () => {
      mockCallAgentClaude.mockResolvedValueOnce({
        text: "{ content: missing quotes }",
        tokensUsed: 50,
      });
      await expect(runFormatter(makeInput())).rejects.toThrow(
        /Failed to extract JSON/i,
      );
    });

    it("propagates abort signal cancellation", async () => {
      const controller = new AbortController();
      mockCallAgentClaude.mockRejectedValueOnce(
        new DOMException("Aborted", "AbortError"),
      );
      controller.abort();
      await expect(
        runFormatter(makeInput({ signal: controller.signal })),
      ).rejects.toThrow("Aborted");
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles very long draft text (4000 chars)", async () => {
      const longDraft = "A".repeat(4000);
      mockClaudeReturns({ ...baseFormattedPost, characterCount: 4000 });
      const result = await runFormatter(makeInput({ draft: longDraft }));
      expect(result.characterCount).toBe(4000);
    });

    it("handles draft with special characters and unicode", async () => {
      const specialDraft = 'Café & "smart quotes" — em dashes… 中文 🚀';
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput({ draft: specialDraft }));
      expect(result).toEqual(baseFormattedPost);
    });

    it("handles draft with newlines and multiple blank lines", async () => {
      const multilineDraft = "Line one.\n\n\nLine two.\n\nLine three.";
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(makeInput({ draft: multilineDraft }));
      expect(result.content).toBeDefined();
    });

    it("handles score of exactly 75 (minimum passing)", async () => {
      mockClaudeReturns({
        ...baseFormattedPost,
        metadata: { ...baseFormattedPost.metadata, score: 75 },
      });
      const result = await runFormatter(makeInput({ score: 75 }));
      expect(result.metadata.score).toBe(75);
    });

    it("handles score of 100 (perfect)", async () => {
      mockClaudeReturns({
        ...baseFormattedPost,
        metadata: { ...baseFormattedPost.metadata, score: 100 },
      });
      const result = await runFormatter(makeInput({ score: 100 }));
      expect(result.metadata.score).toBe(100);
    });

    it("handles hookBeforeFold with mobile false, desktop false", async () => {
      const post: FormattedPost = {
        ...baseFormattedPost,
        hookBeforeFold: { mobile: false, desktop: false },
      };
      mockClaudeReturns(post);
      const result = await runFormatter(makeInput());
      expect(result.hookBeforeFold).toEqual({ mobile: false, desktop: false });
    });

    it("handles hookBeforeFold mixed (mobile true, desktop false)", async () => {
      const post: FormattedPost = {
        ...baseFormattedPost,
        hookBeforeFold: { mobile: true, desktop: false },
      };
      mockClaudeReturns(post);
      const result = await runFormatter(makeInput());
      expect(result.hookBeforeFold).toEqual({ mobile: true, desktop: false });
    });

    it("handles template name with hyphens and underscores", async () => {
      const weirdTemplate = makeDoc("templates", "my-template_v2");
      mockClaudeReturns(baseFormattedPost);
      await runFormatter(
        makeInput({
          knowledge: [formattingRulesDoc, weirdTemplate],
          template: "my-template_v2",
        }),
      );
      const docsArg = mockBuildSystemPrompt.mock
        .calls[0][1] as KnowledgeDocument[];
      expect(docsArg.some((d) => d.name === "my-template_v2")).toBe(true);
    });

    it("handles inactive knowledge documents being filtered by resolveKnowledge", async () => {
      const inactiveDoc = makeDoc("rules", "formatting-rules", false);
      mockResolveKnowledge.mockReturnValueOnce([]); // inactive docs filtered out
      mockClaudeReturns(baseFormattedPost);
      const result = await runFormatter(
        makeInput({ knowledge: [inactiveDoc] }),
      );
      expect(result).toEqual(baseFormattedPost);
    });
  });
});

// ── extractJson unit tests ────────────────────────────────────────────────────

describe("extractJson (used by formatter)", () => {
  const validPost: FormattedPost = {
    content: "Plain text post",
    characterCount: 15,
    hookBeforeFold: { mobile: true, desktop: false },
    suggestedPinnedComment: "Drop a comment if you want more.",
    metadata: {
      template: "strong-opinion",
      pillar: "P1",
      angle: "How-To",
      score: 80,
    },
  };

  it("parses a plain JSON string directly", () => {
    const result = extractJson<FormattedPost>(JSON.stringify(validPost));
    expect(result).toEqual(validPost);
  });

  it("extracts JSON from a markdown json code fence", () => {
    const fenced = `Here is the result:\n\`\`\`json\n${JSON.stringify(validPost)}\n\`\`\``;
    const result = extractJson<FormattedPost>(fenced);
    expect(result).toEqual(validPost);
  });

  it("extracts JSON from a plain markdown code fence (no language tag)", () => {
    const fenced = `\`\`\`\n${JSON.stringify(validPost)}\n\`\`\``;
    const result = extractJson<FormattedPost>(fenced);
    expect(result).toEqual(validPost);
  });

  it("extracts JSON embedded in preamble text", () => {
    const raw = `Sure! Here you go: ${JSON.stringify(validPost)} Hope that helps.`;
    const result = extractJson<FormattedPost>(raw);
    expect(result).toEqual(validPost);
  });

  it("throws when input is plain prose with no JSON", () => {
    expect(() =>
      extractJson("I cannot format this content at the moment."),
    ).toThrow(/Failed to extract JSON/i);
  });

  it("throws when input is empty string", () => {
    expect(() => extractJson("")).toThrow(/Failed to extract JSON/i);
  });

  it("throws when JSON is incomplete / truncated", () => {
    expect(() => extractJson('{"content": "truncated')).toThrow(
      /Failed to extract JSON/i,
    );
  });

  it("handles nested objects correctly", () => {
    const raw = JSON.stringify(validPost);
    const result = extractJson<FormattedPost>(raw);
    expect(result.hookBeforeFold).toEqual({ mobile: true, desktop: false });
    expect(result.metadata.score).toBe(80);
  });

  it("handles JSON with escaped unicode in strings", () => {
    const post = { ...validPost, content: "Caf\u00e9 post" };
    const result = extractJson<FormattedPost>(JSON.stringify(post));
    expect(result.content).toBe("Café post");
  });

  it("handles JSON with escaped quotes inside strings", () => {
    const post = { ...validPost, content: 'He said \\"hello\\"' };
    const result = extractJson<FormattedPost>(JSON.stringify(post));
    expect(result.content).toContain("hello");
  });

  it("parses JSON array when formatter returns array-wrapped object", () => {
    const arr = [validPost];
    const result = extractJson<FormattedPost[]>(JSON.stringify(arr));
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toEqual(validPost);
  });
});
