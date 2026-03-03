/**
 * Tests for lib/agents/learner.ts
 *
 * Strategy: mock callAgentClaude (API boundary) and verify that runLearner
 * correctly assembles the system prompt, passes the right arguments, and
 * returns the parsed LearnerOutput from the Claude response.
 */

import { runLearner } from "../../lib/agents/learner";
import type {
  LearnerInput,
  LearnerOutput,
  LearnerSignal,
} from "../../lib/agents/learner";
import type { KnowledgeDocument } from "../../lib/knowledge/types";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

jest.mock("../../lib/agents/promptBuilder", () => ({
  buildSystemPrompt: jest.fn(
    (_role: string, _docs: unknown[], extra: string) => `SYSTEM:${extra ?? ""}`,
  ),
  resolveKnowledge: jest.fn(
    (_keys: string[], docs: KnowledgeDocument[]) => docs,
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeKnowledgeDoc(
  overrides: Partial<KnowledgeDocument> = {},
): KnowledgeDocument {
  return {
    id: "doc-1",
    userId: "user-1",
    category: "learned",
    subcategory: "patterns",
    name: "preferences",
    content: "Prefer direct tone.",
    version: 1,
    isActive: true,
    source: "agent-learned",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "system",
    ...overrides,
  };
}

function makeInput(overrides: Partial<LearnerInput> = {}): LearnerInput {
  return {
    apiKey: "test-api-key",
    knowledge: [makeKnowledgeDoc()],
    originalDraft:
      "Consultants are expensive.\nThey delay decisions.\nHere is why.",
    finalVersion:
      "Consultants slow decisions.\nThey cost more than advertised.\nHere is why.",
    userFeedback: ["Tightened hook line 1", "Rephrased line 2"],
    sessionContext: {
      topic: "Consulting pitfalls",
      angle: "Myth vs. Reality",
      template: "strong-opinion",
      score: 85,
    },
    ...overrides,
  };
}

function makeSignal(overrides: Partial<LearnerSignal> = {}): LearnerSignal {
  return {
    signalType: "edit",
    category: "hook-patterns",
    context: {
      topic: "Consulting pitfalls",
      angle: "Myth vs. Reality",
      template: "strong-opinion",
    },
    observation: "User shortened hook line 1 from 40 to 32 chars",
    ...overrides,
  };
}

function makeOutput(overrides: Partial<LearnerOutput> = {}): LearnerOutput {
  return {
    signals: [makeSignal()],
    patternDetected: null,
    rulePromotionReady: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: make callAgentClaude resolve with a JSON string
// ---------------------------------------------------------------------------

function resolveWith(output: LearnerOutput): void {
  mockCallAgentClaude.mockResolvedValueOnce({
    text: JSON.stringify(output),
    tokensUsed: 500,
  });
}

function resolveWithText(text: string): void {
  mockCallAgentClaude.mockResolvedValueOnce({ text, tokensUsed: 200 });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveKnowledge.mockImplementation((_keys, docs) => docs);
  mockBuildSystemPrompt.mockImplementation(
    (_role, _docs, extra) => `SYSTEM:${extra ?? ""}`,
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runLearner", () => {
  // --- Happy path -----------------------------------------------------------

  describe("successful learning from feedback", () => {
    it("returns parsed LearnerOutput on valid response", async () => {
      const output = makeOutput();
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result).toEqual(output);
    });

    it("returns multiple signals when Claude identifies several changes", async () => {
      const output = makeOutput({
        signals: [
          makeSignal({ signalType: "edit", category: "hook-patterns" }),
          makeSignal({
            signalType: "tone-feedback",
            category: "style-patterns",
          }),
          makeSignal({ signalType: "hook-rewrite", category: "hook-patterns" }),
        ],
      });
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result.signals).toHaveLength(3);
      expect(result.signals[1].signalType).toBe("tone-feedback");
    });

    it("returns patternDetected when a pattern is identified", async () => {
      const output = makeOutput({
        patternDetected:
          "User consistently shortens hook line 1 below 40 chars",
        rulePromotionReady: false,
      });
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result.patternDetected).toBe(
        "User consistently shortens hook line 1 below 40 chars",
      );
    });

    it("sets rulePromotionReady true when pattern threshold is reached", async () => {
      const output = makeOutput({
        patternDetected: "Hook brevity pattern — 10 signals observed",
        rulePromotionReady: true,
      });
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result.rulePromotionReady).toBe(true);
    });

    it("returns empty signals array when no learnable changes detected", async () => {
      const output = makeOutput({ signals: [], patternDetected: null });
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result.signals).toHaveLength(0);
      expect(result.patternDetected).toBeNull();
      expect(result.rulePromotionReady).toBe(false);
    });

    it("handles all valid signalType values", async () => {
      const signalTypes: LearnerSignal["signalType"][] = [
        "approval",
        "rejection",
        "edit",
        "hook-rewrite",
        "tone-feedback",
        "score-override",
      ];

      for (const signalType of signalTypes) {
        const output = makeOutput({ signals: [makeSignal({ signalType })] });
        resolveWith(output);

        const result = await runLearner(makeInput());
        expect(result.signals[0].signalType).toBe(signalType);
      }
    });
  });

  // --- Output shape ---------------------------------------------------------

  describe("output shape", () => {
    it("output has all required fields", async () => {
      resolveWith(makeOutput());

      const result = await runLearner(makeInput());

      expect(result).toHaveProperty("signals");
      expect(result).toHaveProperty("patternDetected");
      expect(result).toHaveProperty("rulePromotionReady");
      expect(Array.isArray(result.signals)).toBe(true);
      expect(typeof result.rulePromotionReady).toBe("boolean");
    });

    it("each signal has the correct shape", async () => {
      const signal = makeSignal({
        signalType: "edit",
        category: "hook-patterns",
        context: { topic: "T", angle: "A", template: "T1" },
        observation: "User made an edit",
      });
      resolveWith(makeOutput({ signals: [signal] }));

      const result = await runLearner(makeInput());
      const s = result.signals[0];

      expect(s).toHaveProperty("signalType");
      expect(s).toHaveProperty("category");
      expect(s).toHaveProperty("context");
      expect(s).toHaveProperty("observation");
      expect(typeof s.context).toBe("object");
      expect(typeof s.observation).toBe("string");
    });

    it("signal context can hold arbitrary key-value pairs", async () => {
      const signal = makeSignal({
        context: {
          topic: "Cloud migration",
          angle: "Risk",
          template: "list",
          extraKey: 42,
          nested: { deep: true },
        },
      });
      resolveWith(makeOutput({ signals: [signal] }));

      const result = await runLearner(makeInput());

      expect(result.signals[0].context).toMatchObject({
        extraKey: 42,
        nested: { deep: true },
      });
    });

    it("patternDetected can be null", async () => {
      resolveWith(makeOutput({ patternDetected: null }));

      const result = await runLearner(makeInput());

      expect(result.patternDetected).toBeNull();
    });

    it("patternDetected can be a descriptive string", async () => {
      resolveWith(
        makeOutput({ patternDetected: "Approval pattern confirmed" }),
      );

      const result = await runLearner(makeInput());

      expect(typeof result.patternDetected).toBe("string");
    });
  });

  // --- Prompt construction --------------------------------------------------

  describe("prompt construction", () => {
    it("calls resolveKnowledge with learner required knowledge keys", async () => {
      resolveWith(makeOutput());

      await runLearner(makeInput());

      expect(mockResolveKnowledge).toHaveBeenCalledWith(
        expect.arrayContaining([
          "learned/preferences",
          "learned/style-patterns",
          "learned/hook-patterns",
          "learned/calibration",
          "learned/winners",
          "learned/changelog",
        ]),
        expect.any(Array),
      );
    });

    it("calls buildSystemPrompt with role 'learner'", async () => {
      resolveWith(makeOutput());

      await runLearner(makeInput());

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        "learner",
        expect.any(Array),
        expect.any(String),
      );
    });

    it("includes originalDraft in the system prompt context", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ originalDraft: "DRAFT_CONTENT_UNIQUE_STRING" });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("DRAFT_CONTENT_UNIQUE_STRING");
    });

    it("includes finalVersion in the system prompt context", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ finalVersion: "FINAL_VERSION_UNIQUE_STRING" });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("FINAL_VERSION_UNIQUE_STRING");
    });

    it("includes session context topic, angle, template, score", async () => {
      resolveWith(makeOutput());
      const input = makeInput({
        sessionContext: {
          topic: "UNIQUE_TOPIC_XYZ",
          angle: "UNIQUE_ANGLE_ABC",
          template: "UNIQUE_TEMPLATE_DEF",
          score: 77,
        },
      });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("UNIQUE_TOPIC_XYZ");
      expect(extraContext).toContain("UNIQUE_ANGLE_ABC");
      expect(extraContext).toContain("UNIQUE_TEMPLATE_DEF");
      expect(extraContext).toContain("77");
    });

    it("includes userFeedback items in the system prompt context", async () => {
      resolveWith(makeOutput());
      const input = makeInput({
        userFeedback: ["FEEDBACK_ITEM_ONE", "FEEDBACK_ITEM_TWO"],
      });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("FEEDBACK_ITEM_ONE");
      expect(extraContext).toContain("FEEDBACK_ITEM_TWO");
    });

    it("omits user feedback section when userFeedback is undefined", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ userFeedback: undefined });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).not.toContain("User Feedback");
    });

    it("omits user feedback section when userFeedback is empty array", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ userFeedback: [] });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).not.toContain("User Feedback");
    });

    it("calls callAgentClaude with correct model (sonnet) and maxTokens", async () => {
      resolveWith(makeOutput());

      await runLearner(makeInput());

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "sonnet",
          maxTokens: 4096,
        }),
      );
    });

    it("passes the apiKey to callAgentClaude", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ apiKey: "MY_UNIQUE_API_KEY" });

      await runLearner(input);

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: "MY_UNIQUE_API_KEY" }),
      );
    });

    it("passes the AbortSignal to callAgentClaude when provided", async () => {
      resolveWith(makeOutput());
      const controller = new AbortController();
      const input = makeInput({ signal: controller.signal });

      await runLearner(input);

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it("does not pass signal field when not provided", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ signal: undefined });

      await runLearner(input);

      expect(mockCallAgentClaude).toHaveBeenCalledWith(
        expect.objectContaining({ signal: undefined }),
      );
    });
  });

  // --- JSON parsing (extractJson integration) --------------------------------

  describe("JSON parsing from Claude response", () => {
    it("parses JSON wrapped in markdown code fence", async () => {
      const output = makeOutput({ rulePromotionReady: true });
      resolveWithText("```json\n" + JSON.stringify(output) + "\n```");

      const result = await runLearner(makeInput());

      expect(result.rulePromotionReady).toBe(true);
    });

    it("parses JSON wrapped in plain code fence", async () => {
      const output = makeOutput({ patternDetected: "fence-test" });
      resolveWithText("```\n" + JSON.stringify(output) + "\n```");

      const result = await runLearner(makeInput());

      expect(result.patternDetected).toBe("fence-test");
    });

    it("parses JSON preceded by preamble text", async () => {
      const output = makeOutput();
      resolveWithText("Here is the analysis:\n\n" + JSON.stringify(output));

      const result = await runLearner(makeInput());

      expect(result).toHaveProperty("signals");
    });

    it("throws when Claude response contains no valid JSON", async () => {
      resolveWithText("I cannot analyze this content.");

      await expect(runLearner(makeInput())).rejects.toThrow(
        /Failed to extract JSON/,
      );
    });

    it("throws when Claude returns an empty response", async () => {
      mockCallAgentClaude.mockRejectedValueOnce(
        new Error("Claude API returned an empty response"),
      );

      await expect(runLearner(makeInput())).rejects.toThrow(
        "Claude API returned an empty response",
      );
    });
  });

  // --- Error handling -------------------------------------------------------

  describe("error handling", () => {
    it("propagates Claude API errors", async () => {
      mockCallAgentClaude.mockRejectedValueOnce(
        new Error("Claude API error (429): rate limit exceeded"),
      );

      await expect(runLearner(makeInput())).rejects.toThrow(
        "Claude API error (429): rate limit exceeded",
      );
    });

    it("propagates network errors from callAgentClaude", async () => {
      mockCallAgentClaude.mockRejectedValueOnce(new Error("fetch failed"));

      await expect(runLearner(makeInput())).rejects.toThrow("fetch failed");
    });

    it("propagates AbortError when signal is aborted", async () => {
      const controller = new AbortController();
      mockCallAgentClaude.mockRejectedValueOnce(
        new DOMException("The operation was aborted.", "AbortError"),
      );

      controller.abort();

      await expect(
        runLearner(makeInput({ signal: controller.signal })),
      ).rejects.toThrow("The operation was aborted.");
    });

    it("throws on malformed JSON response from Claude", async () => {
      resolveWithText("{not: valid json}}}");

      await expect(runLearner(makeInput())).rejects.toThrow();
    });
  });

  // --- Knowledge integration ------------------------------------------------

  describe("knowledge integration", () => {
    it("passes all provided knowledge documents to resolveKnowledge", async () => {
      resolveWith(makeOutput());
      const docs = [
        makeKnowledgeDoc({ id: "d1", name: "preferences" }),
        makeKnowledgeDoc({ id: "d2", name: "style-patterns" }),
        makeKnowledgeDoc({ id: "d3", name: "hook-patterns" }),
      ];
      const input = makeInput({ knowledge: docs });

      await runLearner(input);

      expect(mockResolveKnowledge).toHaveBeenCalledWith(
        expect.any(Array),
        docs,
      );
    });

    it("works with empty knowledge array", async () => {
      resolveWith(makeOutput());
      mockResolveKnowledge.mockReturnValueOnce([]);

      const result = await runLearner(makeInput({ knowledge: [] }));

      expect(result).toHaveProperty("signals");
    });

    it("inactive documents are filtered out by buildSystemPrompt", async () => {
      // resolveKnowledge returns the docs, buildSystemPrompt filters by isActive.
      // We verify buildSystemPrompt receives resolved docs (filter happens inside it).
      const activeDocs = [makeKnowledgeDoc({ isActive: true })];
      mockResolveKnowledge.mockReturnValueOnce(activeDocs);
      resolveWith(makeOutput());

      await runLearner(makeInput());

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        "learner",
        activeDocs,
        expect.any(String),
      );
    });
  });

  // --- Edge cases -----------------------------------------------------------

  describe("edge cases", () => {
    it("handles originalDraft identical to finalVersion (no changes)", async () => {
      const sameContent = "Nothing changed here.";
      resolveWith(makeOutput({ signals: [], patternDetected: null }));

      const result = await runLearner(
        makeInput({ originalDraft: sameContent, finalVersion: sameContent }),
      );

      expect(result.signals).toHaveLength(0);
      expect(result.patternDetected).toBeNull();
    });

    it("handles very long drafts without truncating context", async () => {
      const longDraft = "A".repeat(5000);
      resolveWith(makeOutput());

      await runLearner(makeInput({ originalDraft: longDraft }));

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("A".repeat(100));
    });

    it("handles score of 0 in sessionContext", async () => {
      resolveWith(makeOutput());
      const input = makeInput({
        sessionContext: {
          topic: "T",
          angle: "A",
          template: "tmpl",
          score: 0,
        },
      });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("0/100");
    });

    it("handles score of 100 in sessionContext", async () => {
      resolveWith(makeOutput());
      const input = makeInput({
        sessionContext: {
          topic: "T",
          angle: "A",
          template: "tmpl",
          score: 100,
        },
      });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("100/100");
    });

    it("handles a single userFeedback item", async () => {
      resolveWith(makeOutput());
      const input = makeInput({ userFeedback: ["Single feedback item"] });

      await runLearner(input);

      const extraContext = mockBuildSystemPrompt.mock.calls[0][2] as string;
      expect(extraContext).toContain("Single feedback item");
    });

    it("rulePromotionReady is false when patternDetected is null", async () => {
      resolveWith(
        makeOutput({ patternDetected: null, rulePromotionReady: false }),
      );

      const result = await runLearner(makeInput());

      expect(result.patternDetected).toBeNull();
      expect(result.rulePromotionReady).toBe(false);
    });

    it("handles conflicting signal types (approval and rejection together)", async () => {
      const output = makeOutput({
        signals: [
          makeSignal({
            signalType: "approval",
            category: "style-patterns",
            observation: "User approved tone",
          }),
          makeSignal({
            signalType: "rejection",
            category: "hook-patterns",
            observation: "User rejected hook",
          }),
        ],
        patternDetected: null,
        rulePromotionReady: false,
      });
      resolveWith(output);

      const result = await runLearner(makeInput());

      expect(result.signals).toHaveLength(2);
      expect(result.signals[0].signalType).toBe("approval");
      expect(result.signals[1].signalType).toBe("rejection");
    });
  });
});
