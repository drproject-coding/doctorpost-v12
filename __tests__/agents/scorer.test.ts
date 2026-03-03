/**
 * Tests for lib/agents/scorer.ts
 *
 * Strategy:
 * - Mock callAgentClaude (HTTP) and extractJson (JSON parsing) at module level
 * - Mock promptBuilder helpers to keep tests isolated
 * - Test all branches: success, previousScore, API errors, empty draft, abort signal
 * - Verify that the ScoreResult shape is passed through untouched from extractJson
 */

import { runScorer, type ScorerInput } from "../../lib/agents/scorer";
import type {
  ScoreResult,
  KnowledgeDocument,
  TopicProposal,
} from "../../lib/knowledge/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

jest.mock("../../lib/agents/structuredOutput", () => ({
  extractJson: jest.fn(),
}));

jest.mock("../../lib/agents/promptBuilder", () => ({
  buildSystemPrompt: jest.fn(() => "mocked-system-prompt"),
  resolveKnowledge: jest.fn(() => []),
}));

// ── Typed handles to mocks ────────────────────────────────────────────────────

import { callAgentClaude } from "../../lib/agents/callClaude";
import { extractJson } from "../../lib/agents/structuredOutput";
import {
  buildSystemPrompt,
  resolveKnowledge,
} from "../../lib/agents/promptBuilder";

const mockCallAgentClaude = callAgentClaude as jest.MockedFunction<
  typeof callAgentClaude
>;
const mockExtractJson = extractJson as jest.MockedFunction<typeof extractJson>;
const mockBuildSystemPrompt = buildSystemPrompt as jest.MockedFunction<
  typeof buildSystemPrompt
>;
const mockResolveKnowledge = resolveKnowledge as jest.MockedFunction<
  typeof resolveKnowledge
>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeKnowledgeDoc = (
  overrides: Partial<KnowledgeDocument> = {},
): KnowledgeDocument => ({
  id: "doc-1",
  userId: "user-1",
  category: "rules",
  subcategory: "scoring-rules",
  name: "scoring-rules",
  content: "Score content on 100-point grid.",
  version: 1,
  isActive: true,
  source: "seed",
  updatedAt: "2024-01-01T00:00:00Z",
  updatedBy: "system",
  ...overrides,
});

const topicCard: TopicProposal = {
  pillar: "P1 — Modern E-Commerce Architecture",
  angle: "Myth vs. Reality",
  decisionMistake: "Choosing a monolith when composable is needed",
  headline: "Why your platform decision will haunt you in 18 months",
  reasoning: "CIOs underestimate switching costs",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "contrarian",
};

const minimalScoreResult: ScoreResult = {
  totalScore: 82,
  criteriaScores: {
    hook: { score: 16, max: 20, feedback: "Strong opener, good tension." },
    strategicRelevance: { score: 18, max: 20, feedback: "On-pillar." },
    structureRhythm: { score: 12, max: 15, feedback: "Good rhythm." },
    toneStyle: { score: 13, max: 15, feedback: "Tone is correct." },
    contentValue: { score: 12, max: 15, feedback: "Solid evidence." },
    conclusionCTA: { score: 8, max: 10, feedback: "CTA is clear." },
    bonusPenalty: {
      score: 3,
      details: ["Memorable punch line: +2", "Suggested pinned comment: +1"],
    },
  },
  checklist: [
    {
      stage: "Strategic Fit",
      items: [
        { check: "Mapped to one pillar", pass: true },
        { check: "Clear decision mistake", pass: true },
      ],
    },
  ],
  checklistScore: 36,
  verdict: "minor-tweaks",
};

const baseInput: ScorerInput = {
  apiKey: "sk-test-key",
  knowledge: [makeKnowledgeDoc()],
  draft: "Three short lines.\nSecond line here.\nThird.",
  topicCard,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupSuccessfulCall(result: ScoreResult = minimalScoreResult): void {
  mockCallAgentClaude.mockResolvedValue({
    text: JSON.stringify(result),
    tokensUsed: 1200,
  });
  mockExtractJson.mockReturnValue(result);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildSystemPrompt.mockReturnValue("mocked-system-prompt");
  mockResolveKnowledge.mockReturnValue([]);
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe("runScorer — successful scoring", () => {
  it("returns the ScoreResult produced by extractJson", async () => {
    setupSuccessfulCall();

    const result = await runScorer(baseInput);

    expect(result).toEqual(minimalScoreResult);
  });

  it("calls callAgentClaude with the correct apiKey and model", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    expect(mockCallAgentClaude).toHaveBeenCalledTimes(1);
    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.apiKey).toBe("sk-test-key");
    expect(callArgs.model).toBe("sonnet");
  });

  it("calls callAgentClaude with correct maxTokens from AGENT_CONFIGS.scorer", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.maxTokens).toBe(4096);
  });

  it("passes the system prompt returned by buildSystemPrompt", async () => {
    mockBuildSystemPrompt.mockReturnValue("custom-system-prompt");
    setupSuccessfulCall();

    await runScorer(baseInput);

    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.systemPrompt).toBe("custom-system-prompt");
  });

  it("passes userMessage containing scoring instruction keywords", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.userMessage).toMatch(/100-point grid/);
    expect(callArgs.userMessage).toMatch(/40-point pre-publish checklist/);
    expect(callArgs.userMessage).toMatch(/ScoreResult JSON/);
  });

  it("calls resolveKnowledge with scorer requiredKnowledge keys", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    expect(mockResolveKnowledge).toHaveBeenCalledWith(
      expect.arrayContaining([
        "rules/scoring-rules",
        "rules/hard-rules",
        "rules/brand-voice",
        "rules/formatting-rules",
      ]),
      baseInput.knowledge,
    );
  });

  it("passes the resolved docs to buildSystemPrompt", async () => {
    const resolvedDocs = [makeKnowledgeDoc({ name: "scoring-rules" })];
    mockResolveKnowledge.mockReturnValue(resolvedDocs);
    setupSuccessfulCall();

    await runScorer(baseInput);

    expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
      "scorer",
      resolvedDocs,
      expect.any(String),
    );
  });

  it("includes the draft text in the extraContext passed to buildSystemPrompt", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).toContain(baseInput.draft);
  });

  it("includes the serialised topicCard in extraContext", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).toContain("P1 — Modern E-Commerce Architecture");
    expect(extraContext).toContain("strong-opinion");
  });

  it("passes signal through to callAgentClaude when provided", async () => {
    setupSuccessfulCall();
    const signal = new AbortController().signal;

    await runScorer({ ...baseInput, signal });

    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.signal).toBe(signal);
  });

  it("does not include signal in callAgentClaude when omitted", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput); // no signal

    const callArgs = mockCallAgentClaude.mock.calls[0][0];
    expect(callArgs.signal).toBeUndefined();
  });
});

// ── ScoreResult output shape ──────────────────────────────────────────────────

describe("runScorer — ScoreResult output shape", () => {
  it("returns a result with totalScore", async () => {
    setupSuccessfulCall();
    const result = await runScorer(baseInput);
    expect(typeof result.totalScore).toBe("number");
  });

  it("returns criteriaScores with all 7 keys", async () => {
    setupSuccessfulCall();
    const result = await runScorer(baseInput);
    expect(result.criteriaScores).toHaveProperty("hook");
    expect(result.criteriaScores).toHaveProperty("strategicRelevance");
    expect(result.criteriaScores).toHaveProperty("structureRhythm");
    expect(result.criteriaScores).toHaveProperty("toneStyle");
    expect(result.criteriaScores).toHaveProperty("contentValue");
    expect(result.criteriaScores).toHaveProperty("conclusionCTA");
    expect(result.criteriaScores).toHaveProperty("bonusPenalty");
  });

  it("returns a checklist array", async () => {
    setupSuccessfulCall();
    const result = await runScorer(baseInput);
    expect(Array.isArray(result.checklist)).toBe(true);
  });

  it("returns a numeric checklistScore", async () => {
    setupSuccessfulCall();
    const result = await runScorer(baseInput);
    expect(typeof result.checklistScore).toBe("number");
  });

  it("returns a valid verdict string", async () => {
    setupSuccessfulCall();
    const result = await runScorer(baseInput);
    expect(["publish", "minor-tweaks", "rework", "rewrite", "scrap"]).toContain(
      result.verdict,
    );
  });

  it("returns rewriteInstructions when verdict is rewrite", async () => {
    const rewriteResult: ScoreResult = {
      ...minimalScoreResult,
      totalScore: 58,
      verdict: "rewrite",
      rewriteInstructions: "Rewrite the hook to create immediate tension.",
    };
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(rewriteResult),
      tokensUsed: 900,
    });
    mockExtractJson.mockReturnValue(rewriteResult);

    const result = await runScorer(baseInput);
    expect(result.rewriteInstructions).toBe(
      "Rewrite the hook to create immediate tension.",
    );
  });

  it("returns rewriteInstructions when verdict is scrap", async () => {
    const scrapResult: ScoreResult = {
      ...minimalScoreResult,
      totalScore: 45,
      verdict: "scrap",
      rewriteInstructions:
        "This post cannot be salvaged. Start over with a new angle.",
    };
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(scrapResult),
      tokensUsed: 900,
    });
    mockExtractJson.mockReturnValue(scrapResult);

    const result = await runScorer(baseInput);
    expect(result.verdict).toBe("scrap");
    expect(result.rewriteInstructions).toBeDefined();
  });

  it("does not require rewriteInstructions when verdict is publish", async () => {
    const publishResult: ScoreResult = {
      ...minimalScoreResult,
      totalScore: 92,
      verdict: "publish",
    };
    mockCallAgentClaude.mockResolvedValue({
      text: JSON.stringify(publishResult),
      tokensUsed: 900,
    });
    mockExtractJson.mockReturnValue(publishResult);

    const result = await runScorer(baseInput);
    expect(result.verdict).toBe("publish");
    expect(result.rewriteInstructions).toBeUndefined();
  });
});

// ── previousScore (re-score) path ─────────────────────────────────────────────

describe("runScorer — previousScore re-score path", () => {
  const previousScore: ScoreResult = {
    ...minimalScoreResult,
    totalScore: 68,
    verdict: "rework",
  };

  it("includes previousScore total in the extraContext when provided", async () => {
    setupSuccessfulCall();

    await runScorer({ ...baseInput, previousScore });

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).toContain("68/100");
  });

  it("includes re-score comparison note in extraContext", async () => {
    setupSuccessfulCall();

    await runScorer({ ...baseInput, previousScore });

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).toContain("Compare improvements");
  });

  it("does NOT include previousScore note when previousScore is omitted", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput); // no previousScore

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).not.toContain("Previous Score");
  });
});

// ── API error handling ────────────────────────────────────────────────────────

describe("runScorer — API error handling", () => {
  it("propagates errors thrown by callAgentClaude", async () => {
    mockCallAgentClaude.mockRejectedValue(
      new Error("Claude API error (429): rate limited"),
    );

    await expect(runScorer(baseInput)).rejects.toThrow(
      "Claude API error (429): rate limited",
    );
  });

  it("propagates errors for 5xx responses", async () => {
    mockCallAgentClaude.mockRejectedValue(
      new Error("Claude API error (500): internal server error"),
    );

    await expect(runScorer(baseInput)).rejects.toThrow("500");
  });

  it("propagates errors for 401 unauthorised", async () => {
    mockCallAgentClaude.mockRejectedValue(
      new Error("Claude API error (401): invalid api key"),
    );

    await expect(runScorer(baseInput)).rejects.toThrow("401");
  });

  it("propagates empty response errors from callAgentClaude", async () => {
    mockCallAgentClaude.mockRejectedValue(
      new Error("Claude API returned an empty response"),
    );

    await expect(runScorer(baseInput)).rejects.toThrow("empty response");
  });

  it("propagates JSON extraction errors from extractJson", async () => {
    mockCallAgentClaude.mockResolvedValue({
      text: "not valid json at all",
      tokensUsed: 100,
    });
    mockExtractJson.mockImplementation(() => {
      throw new Error("Failed to extract JSON from agent response");
    });

    await expect(runScorer(baseInput)).rejects.toThrow(
      "Failed to extract JSON",
    );
  });

  it("propagates AbortError when signal is aborted", async () => {
    const controller = new AbortController();
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    mockCallAgentClaude.mockRejectedValue(abortError);

    controller.abort();
    await expect(
      runScorer({ ...baseInput, signal: controller.signal }),
    ).rejects.toThrow("aborted");
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("runScorer — edge cases", () => {
  it("handles an empty draft string without throwing before API call", async () => {
    setupSuccessfulCall();

    // Empty draft is passed through — scorer agent decides how to handle it
    await expect(runScorer({ ...baseInput, draft: "" })).resolves.toEqual(
      minimalScoreResult,
    );

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    expect(extraContext).toContain("## Draft to Score");
  });

  it("handles a very long draft (10 000 chars) without throwing", async () => {
    setupSuccessfulCall();
    const longDraft = "word ".repeat(2000); // ~10 000 chars

    await expect(
      runScorer({ ...baseInput, draft: longDraft }),
    ).resolves.toEqual(minimalScoreResult);
  });

  it("handles an empty knowledge array (no resolved docs)", async () => {
    mockResolveKnowledge.mockReturnValue([]);
    setupSuccessfulCall();

    await expect(runScorer({ ...baseInput, knowledge: [] })).resolves.toEqual(
      minimalScoreResult,
    );
  });

  it("handles multiple knowledge documents without error", async () => {
    const docs = [
      makeKnowledgeDoc({ id: "doc-1", name: "scoring-rules" }),
      makeKnowledgeDoc({ id: "doc-2", name: "hard-rules" }),
      makeKnowledgeDoc({ id: "doc-3", name: "brand-voice" }),
      makeKnowledgeDoc({ id: "doc-4", name: "formatting-rules" }),
    ];
    mockResolveKnowledge.mockReturnValue(docs);
    setupSuccessfulCall();

    await expect(runScorer({ ...baseInput, knowledge: docs })).resolves.toEqual(
      minimalScoreResult,
    );
  });

  it("handles draft with special characters and unicode", async () => {
    setupSuccessfulCall();
    const unicodeDraft =
      "This post uses «French quotes» and em-dashes — and even 中文 characters.";

    await expect(
      runScorer({ ...baseInput, draft: unicodeDraft }),
    ).resolves.toEqual(minimalScoreResult);
  });

  it("handles topicCard with minimal fields (no optional fields)", async () => {
    setupSuccessfulCall();
    const minimalTopicCard: TopicProposal = {
      pillar: "P2",
      angle: "How-to",
      decisionMistake: "Ignoring data",
      headline: "Stop ignoring your data",
      reasoning: "Data literacy gap",
      templateRecommendation: "how-to",
      hookCategoryRecommendation: "question",
    };

    await expect(
      runScorer({ ...baseInput, topicCard: minimalTopicCard }),
    ).resolves.toEqual(minimalScoreResult);
  });

  it("serialises topicCard as JSON in extraContext", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    const extraContext: string = mockBuildSystemPrompt.mock
      .calls[0][2] as string;
    // Should be valid JSON representation of the topicCard
    expect(extraContext).toContain('"pillar"');
    expect(extraContext).toContain('"angle"');
  });

  it("calls extractJson with the exact text returned by callAgentClaude", async () => {
    const rawText = '{"totalScore":90}';
    mockCallAgentClaude.mockResolvedValue({ text: rawText, tokensUsed: 500 });
    mockExtractJson.mockReturnValue(minimalScoreResult);

    await runScorer(baseInput);

    expect(mockExtractJson).toHaveBeenCalledWith(rawText);
  });

  it("only calls callAgentClaude once per runScorer invocation", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    expect(mockCallAgentClaude).toHaveBeenCalledTimes(1);
  });

  it("only calls buildSystemPrompt once per runScorer invocation", async () => {
    setupSuccessfulCall();

    await runScorer(baseInput);

    expect(mockBuildSystemPrompt).toHaveBeenCalledTimes(1);
  });
});
