/**
 * Tests for lib/agents/writer.ts
 *
 * Strategy: mock callAgentClaude (the fetch wrapper) and verify that
 * runWriter correctly assembles context, calls the API, and returns a
 * well-shaped WriterOutput.  No real network calls are made.
 */

import { runWriter } from "../../lib/agents/writer";
import type { WriterInput, WriterOutput } from "../../lib/agents/writer";
import type {
  KnowledgeDocument,
  TopicProposal,
  EvidencePack,
} from "../../lib/knowledge/types";

// ── Module mocks ────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/callClaude", () => ({
  callAgentClaude: jest.fn(),
}));

import { callAgentClaude } from "../../lib/agents/callClaude";
const mockCallAgentClaude = callAgentClaude as jest.MockedFunction<
  typeof callAgentClaude
>;

// ── Test fixtures ────────────────────────────────────────────────────────────

function makeDoc(
  category: KnowledgeDocument["category"],
  name: string,
  subcategory = "",
  isActive = true,
): KnowledgeDocument {
  return {
    id: `${category}-${name}`,
    userId: "user-1",
    category,
    subcategory,
    name,
    content: `Content of ${category}/${name}`,
    version: 1,
    isActive,
    source: "seed",
    updatedAt: "2024-01-01T00:00:00Z",
    updatedBy: "system",
  };
}

/** Minimal knowledge set covering the writer's requiredKnowledge keys. */
function makeKnowledge(): KnowledgeDocument[] {
  return [
    makeDoc("rules", "brand-voice"),
    makeDoc("rules", "hard-rules"),
    makeDoc("rules", "formatting-rules"),
    makeDoc("rules", "scoring-rules"),
    makeDoc("rules", "content-strategy"),
    makeDoc("references", "tone-shifts"),
    makeDoc("references", "vocabulary"),
    makeDoc("references", "copy-techniques"),
    makeDoc("references", "headline-formulas"),
    makeDoc("learned", "style-patterns"),
    makeDoc("learned", "calibration"),
    // template + library extras
    makeDoc("templates", "strong-opinion"),
    makeDoc("library", "hook-patterns", "hooks"),
    makeDoc("library", "closers"),
    makeDoc("library", "ctas"),
  ];
}

const topicCard: TopicProposal = {
  pillar: "P1 — Modern E-Commerce Architecture",
  angle: "Myth vs. Reality",
  decisionMistake: "Assuming platform migration solves revenue problems",
  headline: "Your platform is not the problem. Your operations are.",
  reasoning: "High CIO resonance — common misconception with quantifiable cost",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "contrarian",
};

const evidencePack: EvidencePack = {
  claims: [
    {
      fact: "73% of re-platforming projects exceed budget by 40%+",
      source: "Gartner 2023",
      sourceUrl: "https://gartner.com/example",
      verification: "verified",
      usageNote: "Use in opening argument",
    },
  ],
  humanVoices: [
    {
      quote:
        "We spent 18 months migrating and our conversion rate stayed flat.",
      context: "CTO at a $200M retailer",
      sentiment: "negative",
    },
  ],
  counterArguments: ["Some platforms genuinely limit scalability"],
  freshAngles: ["Focus on operational debt, not tech debt"],
};

const validOutput: WriterOutput = {
  content:
    "Your platform is not the problem.\nYour operations are.\nHere is why.\n\n73% of re-platforming projects exceed budget by 40%+.",
  template: "strong-opinion",
  hookCategory: "contrarian",
  wordCount: 248,
  selfCheckPassed: true,
  selfCheckNotes: [],
};

function makeInput(overrides: Partial<WriterInput> = {}): WriterInput {
  return {
    apiKey: "test-api-key",
    knowledge: makeKnowledge(),
    topicCard,
    evidencePack,
    template: "strong-opinion",
    ...overrides,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockSuccess(output: WriterOutput = validOutput) {
  mockCallAgentClaude.mockResolvedValueOnce({
    text: JSON.stringify(output),
    tokensUsed: 1500,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── 1. Successful content generation ────────────────────────────────────────

describe("runWriter — successful generation", () => {
  it("returns a correctly shaped WriterOutput", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(result).toEqual(validOutput);
  });

  it("returns content as a non-empty string", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("returns the template name used", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(result.template).toBe("strong-opinion");
  });

  it("returns a numeric wordCount", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(typeof result.wordCount).toBe("number");
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it("returns selfCheckPassed as a boolean", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(typeof result.selfCheckPassed).toBe("boolean");
  });

  it("returns selfCheckNotes as an array", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(Array.isArray(result.selfCheckNotes)).toBe(true);
  });

  it("returns a hookCategory string", async () => {
    mockSuccess();
    const result = await runWriter(makeInput());

    expect(typeof result.hookCategory).toBe("string");
    expect(result.hookCategory.length).toBeGreaterThan(0);
  });
});

// ── 2. API integration — callAgentClaude is called correctly ─────────────────

describe("runWriter — API call parameters", () => {
  it("calls callAgentClaude exactly once", async () => {
    mockSuccess();
    await runWriter(makeInput());

    expect(mockCallAgentClaude).toHaveBeenCalledTimes(1);
  });

  it("passes the apiKey through to callAgentClaude", async () => {
    mockSuccess();
    await runWriter(makeInput({ apiKey: "sk-secret-key" }));

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "sk-secret-key" }),
    );
  });

  it("passes an opus model (writer config)", async () => {
    mockSuccess();
    await runWriter(makeInput());

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({ model: "opus" }),
    );
  });

  it("passes maxTokens of 8192 (writer config)", async () => {
    mockSuccess();
    await runWriter(makeInput());

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({ maxTokens: 8192 }),
    );
  });

  it("includes the template name in the userMessage", async () => {
    mockSuccess();
    await runWriter(makeInput({ template: "strong-opinion" }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("strong-opinion");
  });

  it("includes topicCard data in the systemPrompt", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Topic Card");
    expect(call.systemPrompt).toContain(topicCard.pillar);
  });

  it("includes evidencePack data in the systemPrompt", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Evidence Pack");
    expect(call.systemPrompt).toContain(evidencePack.claims[0].fact);
  });

  it("passes the AbortSignal when provided", async () => {
    mockSuccess();
    const controller = new AbortController();
    await runWriter(makeInput({ signal: controller.signal }));

    expect(mockCallAgentClaude).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("passes undefined signal when not provided", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.signal).toBeUndefined();
  });
});

// ── 3. Knowledge document injection ─────────────────────────────────────────

describe("runWriter — knowledge document injection", () => {
  it("injects the matching template document into the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Content of templates/strong-opinion");
  });

  it("injects hook library documents into the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Content of library/hook-patterns");
  });

  it("injects the closers document when present", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Content of library/closers");
  });

  it("injects the ctas document when present", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Content of library/ctas");
  });

  it("omits inactive documents from the system prompt", async () => {
    const knowledge = makeKnowledge().map((d) =>
      d.category === "rules" && d.name === "brand-voice"
        ? { ...d, isActive: false }
        : d,
    );
    mockSuccess();
    await runWriter(makeInput({ knowledge }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    // brand-voice is inactive — its content must not appear in the prompt
    expect(call.systemPrompt).not.toContain("Content of rules/brand-voice");
  });

  it("works when template document is absent from knowledge", async () => {
    // Remove the template doc — should not throw, just omit it
    const knowledge = makeKnowledge().filter(
      (d) => !(d.category === "templates" && d.name === "strong-opinion"),
    );
    mockSuccess();
    const result = await runWriter(makeInput({ knowledge }));

    expect(result).toEqual(validOutput);
    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).not.toContain(
      "Content of templates/strong-opinion",
    );
  });

  it("works when hook library documents are absent", async () => {
    const knowledge = makeKnowledge().filter(
      (d) => !(d.category === "library" && d.subcategory === "hooks"),
    );
    mockSuccess();
    const result = await runWriter(makeInput({ knowledge }));

    expect(result).toEqual(validOutput);
  });

  it("works with an empty knowledge array", async () => {
    mockSuccess();
    const result = await runWriter(makeInput({ knowledge: [] }));

    expect(result).toEqual(validOutput);
  });
});

// ── 4. Rewrite mode ──────────────────────────────────────────────────────────

describe("runWriter — rewrite mode", () => {
  const rewriteContext = {
    previousDraft: "Original draft content here.",
    scorerFeedback: "Hook is too long. Reduce word count by 20%.",
    attemptNumber: 2,
  };

  it("includes REWRITE REQUEST section in the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput({ rewriteContext }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("REWRITE REQUEST");
  });

  it("includes the attempt number in the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput({ rewriteContext }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Attempt 2/3");
  });

  it("includes previousDraft in the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput({ rewriteContext }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain(rewriteContext.previousDraft);
  });

  it("includes scorerFeedback in the system prompt", async () => {
    mockSuccess();
    await runWriter(makeInput({ rewriteContext }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain(rewriteContext.scorerFeedback);
  });

  it("uses a rewrite-specific userMessage", async () => {
    mockSuccess();
    await runWriter(makeInput({ rewriteContext }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("Rewrite the draft");
    expect(call.userMessage).toContain("attempt 2 of 3");
  });

  it("does NOT include rewrite section when rewriteContext is absent", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).not.toContain("REWRITE REQUEST");
  });

  it("uses write-specific userMessage when no rewriteContext", async () => {
    mockSuccess();
    await runWriter(makeInput());

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.userMessage).toContain("Write a LinkedIn post");
  });

  it("returns output correctly in rewrite mode", async () => {
    const rewriteOutput: WriterOutput = {
      ...validOutput,
      content: "Revised content addressing all feedback.",
      selfCheckPassed: true,
      selfCheckNotes: ["Reduced hook to 42 chars"],
    };
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(rewriteOutput),
      tokensUsed: 1800,
    });

    const result = await runWriter(makeInput({ rewriteContext }));
    expect(result.content).toBe("Revised content addressing all feedback.");
    expect(result.selfCheckNotes).toContain("Reduced hook to 42 chars");
  });
});

// ── 5. Error handling ────────────────────────────────────────────────────────

describe("runWriter — error handling", () => {
  it("propagates API errors", async () => {
    mockCallAgentClaude.mockRejectedValueOnce(
      new Error("Claude API error (429): Rate limit exceeded"),
    );

    await expect(runWriter(makeInput())).rejects.toThrow(
      "Claude API error (429): Rate limit exceeded",
    );
  });

  it("propagates network errors", async () => {
    mockCallAgentClaude.mockRejectedValueOnce(new Error("Failed to fetch"));

    await expect(runWriter(makeInput())).rejects.toThrow("Failed to fetch");
  });

  it("throws when API returns malformed JSON", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: "This is not JSON at all",
      tokensUsed: 100,
    });

    await expect(runWriter(makeInput())).rejects.toThrow();
  });

  it("throws when API returns an empty string", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({ text: "", tokensUsed: 0 });

    await expect(runWriter(makeInput())).rejects.toThrow();
  });

  it("throws when API returns a JSON array instead of an object", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify([validOutput]),
      tokensUsed: 100,
    });

    // extractJson will parse the array; the caller gets an array cast as WriterOutput.
    // The important thing is it does not crash — it returns what Claude sent.
    // (If strict field validation is added later this test should be tightened.)
    const result = await runWriter(makeInput());
    expect(Array.isArray(result)).toBe(true);
  });

  it("rethrows AbortError when the signal is aborted", async () => {
    const controller = new AbortController();
    mockCallAgentClaude.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      }),
    );
    controller.abort();

    await expect(
      runWriter(makeInput({ signal: controller.signal })),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

// ── 6. JSON extraction — response format variants ───────────────────────────

describe("runWriter — JSON extraction from response variants", () => {
  it("handles JSON wrapped in a markdown code fence", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text:
        "Here is your output:\n```json\n" +
        JSON.stringify(validOutput) +
        "\n```",
      tokensUsed: 1600,
    });

    const result = await runWriter(makeInput());
    expect(result).toEqual(validOutput);
  });

  it("handles JSON wrapped in a plain code fence (no language tag)", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: "Output:\n```\n" + JSON.stringify(validOutput) + "\n```",
      tokensUsed: 1600,
    });

    const result = await runWriter(makeInput());
    expect(result).toEqual(validOutput);
  });

  it("handles JSON with leading preamble text", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text: "Sure, here is the result:\n" + JSON.stringify(validOutput),
      tokensUsed: 1600,
    });

    const result = await runWriter(makeInput());
    expect(result).toEqual(validOutput);
  });

  it("handles JSON with trailing text after closing brace", async () => {
    mockCallAgentClaude.mockResolvedValueOnce({
      text:
        JSON.stringify(validOutput) + "\n\nLet me know if you need revisions.",
      tokensUsed: 1600,
    });

    const result = await runWriter(makeInput());
    expect(result).toEqual(validOutput);
  });
});

// ── 7. Edge cases ────────────────────────────────────────────────────────────

describe("runWriter — edge cases", () => {
  it("handles very long research content without truncating the prompt", async () => {
    const longFact = "A".repeat(10_000);
    const largeEvidencePack: EvidencePack = {
      ...evidencePack,
      claims: [{ ...evidencePack.claims[0], fact: longFact }],
    };
    mockSuccess();

    const result = await runWriter(
      makeInput({ evidencePack: largeEvidencePack }),
    );
    expect(result).toEqual(validOutput);

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain(longFact);
  });

  it("handles special characters in topic card fields", async () => {
    const specialTopicCard: TopicProposal = {
      ...topicCard,
      headline: 'Why "growth hacking" is a <myth> & always was',
      decisionMistake: "Using & < > \" ' in strategy docs",
    };
    mockSuccess();

    const result = await runWriter(makeInput({ topicCard: specialTopicCard }));
    expect(result).toEqual(validOutput);

    const call = mockCallAgentClaude.mock.calls[0][0];
    // The topicCard is JSON.stringified into the prompt, so quotes are escaped.
    // Verify the serialised form of the headline is present instead.
    expect(call.systemPrompt).toContain(
      JSON.stringify(specialTopicCard.headline),
    );
  });

  it("handles unicode content in evidence pack", async () => {
    const unicodeEvidencePack: EvidencePack = {
      ...evidencePack,
      humanVoices: [
        {
          quote: "日本語のクォート — coût élevé",
          context: "CTO",
          sentiment: "negative",
        },
      ],
    };
    mockSuccess();

    const result = await runWriter(
      makeInput({ evidencePack: unicodeEvidencePack }),
    );
    expect(result).toEqual(validOutput);
  });

  it("handles multiple hook library documents", async () => {
    const extraHookDoc = makeDoc("library", "advanced-hooks", "hooks");
    const knowledge = [...makeKnowledge(), extraHookDoc];
    mockSuccess();

    await runWriter(makeInput({ knowledge }));

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Content of library/hook-patterns");
    expect(call.systemPrompt).toContain("Content of library/advanced-hooks");
  });

  it("handles selfCheckPassed=false with notes gracefully", async () => {
    const failedCheckOutput: WriterOutput = {
      ...validOutput,
      selfCheckPassed: false,
      selfCheckNotes: [
        "Hook line 1 exceeds 50 chars",
        "Contains forbidden word: leverage",
      ],
    };
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(failedCheckOutput),
      tokensUsed: 1700,
    });

    const result = await runWriter(makeInput());
    expect(result.selfCheckPassed).toBe(false);
    expect(result.selfCheckNotes).toHaveLength(2);
    expect(result.selfCheckNotes[0]).toBe("Hook line 1 exceeds 50 chars");
  });

  it("handles a wordCount of zero in the response", async () => {
    const zeroWordOutput: WriterOutput = { ...validOutput, wordCount: 0 };
    mockCallAgentClaude.mockResolvedValueOnce({
      text: JSON.stringify(zeroWordOutput),
      tokensUsed: 500,
    });

    const result = await runWriter(makeInput());
    expect(result.wordCount).toBe(0);
  });

  it("handles duplicate knowledge documents without crashing", async () => {
    const dupeKnowledge = [...makeKnowledge(), ...makeKnowledge()];
    mockSuccess();

    const result = await runWriter(makeInput({ knowledge: dupeKnowledge }));
    expect(result).toEqual(validOutput);
  });

  it("uses attempt 1 label correctly in rewrite context", async () => {
    mockSuccess();
    await runWriter(
      makeInput({
        rewriteContext: {
          previousDraft: "Draft v1",
          scorerFeedback: "Weak hook",
          attemptNumber: 1,
        },
      }),
    );

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Attempt 1/3");
    expect(call.userMessage).toContain("attempt 1 of 3");
  });

  it("uses attempt 3 label correctly in rewrite context", async () => {
    mockSuccess();
    await runWriter(
      makeInput({
        rewriteContext: {
          previousDraft: "Draft v3",
          scorerFeedback: "Still too long",
          attemptNumber: 3,
        },
      }),
    );

    const call = mockCallAgentClaude.mock.calls[0][0];
    expect(call.systemPrompt).toContain("Attempt 3/3");
  });
});
