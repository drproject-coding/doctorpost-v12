/**
 * Comprehensive integration tests for lib/agents/orchestrator.ts
 *
 * Tests cover:
 *   - runPipeline() — all 8 phases in sequence
 *   - Phase sequencing (correct outputs flow between phases)
 *   - User checkpoint handling (required/optional fields)
 *   - Error handling with early exit
 *   - AbortSignal cancellation
 *   - Event emission (step, status, percent, data)
 *   - State accumulation across phases
 *   - Individual phase functions (runDirection, runDiscovery, etc.)
 *
 * Strategy:
 *   - Mock ALL agent functions (runStrategist, runResearcher, etc.)
 *   - Mock guardrails (runGuardrails, quickKillCheck)
 *   - NO real API calls
 */

import {
  runPipeline,
  runDirection,
  runDiscovery,
  runEvidence,
  runWriteAndScore,
  runFormat,
  runReview,
  runLearn,
  createPipelineState,
  MAX_REWRITES,
  REWRITE_THRESHOLD,
  type PipelineState,
  type PipelineCheckpoint,
  type EventCallback,
} from "../../lib/agents/orchestrator";

import type { PipelineEvent } from "../../lib/knowledge/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../lib/agents/strategist", () => ({
  runStrategist: jest.fn(),
}));

jest.mock("../../lib/agents/researcher", () => ({
  runResearcher: jest.fn(),
}));

jest.mock("../../lib/agents/writer", () => ({
  runWriter: jest.fn(),
}));

jest.mock("../../lib/agents/scorer", () => ({
  runScorer: jest.fn(),
}));

jest.mock("../../lib/agents/formatter", () => ({
  runFormatter: jest.fn(),
}));

jest.mock("../../lib/agents/learner", () => ({
  runLearner: jest.fn(),
}));

jest.mock("../../lib/agents/guardrails", () => ({
  runGuardrails: jest.fn(() => []),
  quickKillCheck: jest.fn(() => ({ passed: true, failures: [] })),
}));

// ── Import mocked functions ───────────────────────────────────────────────────

import { runStrategist } from "../../lib/agents/strategist";
import { runResearcher } from "../../lib/agents/researcher";
import { runWriter } from "../../lib/agents/writer";
import { runScorer } from "../../lib/agents/scorer";
import { runFormatter } from "../../lib/agents/formatter";
import { runLearner } from "../../lib/agents/learner";
import { runGuardrails, quickKillCheck } from "../../lib/agents/guardrails";

const mockRunStrategist = runStrategist as jest.MockedFunction<
  typeof runStrategist
>;
const mockRunResearcher = runResearcher as jest.MockedFunction<
  typeof runResearcher
>;
const mockRunWriter = runWriter as jest.MockedFunction<typeof runWriter>;
const mockRunScorer = runScorer as jest.MockedFunction<typeof runScorer>;
const mockRunFormatter = runFormatter as jest.MockedFunction<
  typeof runFormatter
>;
const mockRunLearner = runLearner as jest.MockedFunction<typeof runLearner>;
const mockRunGuardrails = runGuardrails as jest.MockedFunction<
  typeof runGuardrails
>;
const mockQuickKillCheck = quickKillCheck as jest.MockedFunction<
  typeof quickKillCheck
>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeKnowledgeDoc(name: string) {
  return {
    id: `doc-${name}`,
    userId: "user-1",
    category: "rules" as const,
    subcategory: name,
    name,
    content: `Content for ${name}`,
    version: 1,
    isActive: true,
    source: "seed" as const,
    updatedAt: "2024-01-01T00:00:00Z",
    updatedBy: "system",
  };
}

const MOCK_KNOWLEDGE = [
  makeKnowledgeDoc("hard-rules"),
  makeKnowledgeDoc("formatting-rules"),
];

const MOCK_TOPIC = {
  pillar: "P1 — Modern E-Commerce",
  angle: "Myth vs. Reality",
  decisionMistake: "Choosing wrong architecture",
  headline: "Why E-Commerce Architectures Fail",
  reasoning: "P1 under-represented",
  templateRecommendation: "strong-opinion",
  hookCategoryRecommendation: "contrarian",
};

const MOCK_REFINED_TOPIC = {
  ...MOCK_TOPIC,
  headline: "The Real Reason E-Commerce Architectures Fail in Year Two",
  angle: "Refined: Root Cause Analysis",
};

const MOCK_STRATEGIST_OUTPUT = {
  proposals: [MOCK_TOPIC],
  pillarAssessment: "P1 under-represented at 20% vs 30% target",
  angleAssessment: "Myth vs. Reality not used in last 5 posts",
  currentPhase: "Month 1: Positioning",
};

const MOCK_DISCOVERY_BRIEF = {
  subtopicAngles: [
    { angle: "Cost overruns", source: "Reddit", relevance: "high" },
  ],
  painPoints: [
    {
      quote: "We spent 6 months rebuilding",
      source: "r/ecommerce",
      context: "migration",
    },
  ],
  currentDebates: ["Monolith vs microservices"],
  questionsAsked: ["How to avoid replatforming?"],
};

const MOCK_EVIDENCE_PACK = {
  claims: [
    {
      fact: "67% of replatforming projects fail",
      source: "Gartner",
      sourceUrl: "https://gartner.com",
      verification: "verified" as const,
      usageNote: "Use in hook",
    },
  ],
  humanVoices: [
    {
      quote: "We lost $2M on our migration",
      context: "CTO interview",
      sentiment: "negative",
    },
  ],
  counterArguments: ["Microservices do scale better long-term"],
  freshAngles: ["The strangler-fig pattern as an alternative"],
};

const MOCK_WRITER_OUTPUT = {
  content:
    "Most e-commerce architectures fail in year two.\n\nNot because of bad code.\n\nBecause of a decision made on day one that nobody questioned.\n\nHere is the mistake: choosing a monolith because microservices felt too complex.\n\nThe real cost shows up 18 months later when you cannot scale a single product category without redeploying the entire application.\n\n67% of replatforming projects fail (Gartner, 2023).\n\nThe alternative is not microservices from day one — it is the strangler-fig pattern.\n\nStart with the monolith. Extract services only when a boundary becomes painful.\n\nThis is not a technical decision. It is a business decision about when complexity is worth the cost.\n\nThe CTO who told me they lost $2M on their migration wished they had known this in month one.",
  template: "strong-opinion",
  hookCategory: "contrarian",
  wordCount: 145,
  selfCheckPassed: true,
  selfCheckNotes: [],
};

const MOCK_SCORE_PASSING = {
  totalScore: 80,
  criteriaScores: {
    hook: { score: 18, max: 20 as const, feedback: "Strong contrarian hook" },
    strategicRelevance: { score: 17, max: 20 as const, feedback: "On-pillar" },
    structureRhythm: { score: 12, max: 15 as const, feedback: "Good rhythm" },
    toneStyle: { score: 13, max: 15 as const, feedback: "Expert tone" },
    contentValue: { score: 12, max: 15 as const, feedback: "Strong evidence" },
    conclusionCTA: { score: 8, max: 10 as const, feedback: "Clear CTA" },
    bonusPenalty: { score: 0, details: [] },
  },
  checklist: [
    {
      stage: "pre-publish",
      items: [{ check: "Hook within fold", pass: true }],
    },
  ],
  checklistScore: 40,
  verdict: "publish" as const,
};

const MOCK_SCORE_FAILING = {
  ...MOCK_SCORE_PASSING,
  totalScore: 60,
  verdict: "rewrite" as const,
  rewriteInstructions: "Strengthen the hook and add more specific data points.",
};

const MOCK_FORMATTED_POST = {
  content:
    "Most e-commerce architectures fail in year two.\n\nNot because of bad code.\n\nBecause of a decision made on day one.",
  characterCount: 950,
  hookBeforeFold: { mobile: true, desktop: true },
  suggestedPinnedComment:
    "Full breakdown of the strangler-fig pattern in the comments.",
  metadata: {
    template: "strong-opinion",
    pillar: "P1 — Modern E-Commerce",
    angle: "Myth vs. Reality",
    score: 80,
  },
};

const MOCK_LEARNER_OUTPUT = {
  signals: [
    {
      signalType: "approval" as const,
      category: "hook",
      context: {},
      observation: "User approved hook without changes",
    },
  ],
  patternDetected: null,
  rulePromotionReady: false,
};

function makeBaseState(): PipelineState {
  return createPipelineState({
    sessionId: "session-test-123",
    knowledge: MOCK_KNOWLEDGE,
    keys: { claude: "sk-ant-test-key", perplexity: "pplx-test-key" },
    recentPosts: [{ pillar: "P2", date: "2024-01-10" }],
  });
}

function makeFullCheckpoints(): PipelineCheckpoint {
  return {
    selectedTopic: MOCK_TOPIC,
    refinedTopic: MOCK_REFINED_TOPIC,
    selectedTemplate: "strong-opinion",
    finalVersion:
      "Most e-commerce architectures fail in year two. (edited by user)",
    userFeedback: ["Great hook", "Evidence is compelling"],
  };
}

/** Capture all events emitted during a pipeline run */
function makeEmitSpy(): { emit: EventCallback; events: PipelineEvent[] } {
  const events: PipelineEvent[] = [];
  const emit: EventCallback = (event) => events.push(event);
  return { emit, events };
}

/** Wire up all mocks for a full happy-path pipeline run */
function setupFullHappyPath(): void {
  // Full reset first to clear any prior mock state from previous tests
  mockRunStrategist.mockReset();
  mockRunResearcher.mockReset();
  mockRunWriter.mockReset();
  mockRunScorer.mockReset();
  mockRunFormatter.mockReset();
  mockRunLearner.mockReset();
  mockQuickKillCheck.mockReset();
  mockRunGuardrails.mockReset();

  mockRunStrategist
    .mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT) // Phase 1: direction
    .mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    }); // Phase 2: refinement
  mockRunResearcher
    .mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF) // Phase 2: broad research
    .mockResolvedValueOnce(MOCK_EVIDENCE_PACK); // Phase 3: evidence
  mockRunWriter.mockResolvedValue(MOCK_WRITER_OUTPUT);
  mockRunScorer.mockResolvedValue(MOCK_SCORE_PASSING);
  mockRunFormatter.mockResolvedValue(MOCK_FORMATTED_POST);
  mockRunLearner.mockResolvedValue(MOCK_LEARNER_OUTPUT);
  mockQuickKillCheck.mockReturnValue({ passed: true, failures: [] });
  mockRunGuardrails.mockReturnValue([]);
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Use mockReset to clear all mock state including queued return values,
  // preventing leakage of mockResolvedValueOnce calls between tests.
  mockRunStrategist.mockReset();
  mockRunResearcher.mockReset();
  mockRunWriter.mockReset();
  mockRunScorer.mockReset();
  mockRunFormatter.mockReset();
  mockRunLearner.mockReset();
  mockQuickKillCheck.mockReset();
  mockRunGuardrails.mockReset();

  // Safe defaults for synchronous mocks used throughout
  mockRunGuardrails.mockReturnValue([]);
  mockQuickKillCheck.mockReturnValue({ passed: true, failures: [] });
});

// ═════════════════════════════════════════════════════════════════════════════
// createPipelineState
// ═════════════════════════════════════════════════════════════════════════════

describe("createPipelineState", () => {
  it("returns state with phase=idle and rewriteCount=0", () => {
    const state = makeBaseState();
    expect(state.phase).toBe("idle");
    expect(state.rewriteCount).toBe(0);
  });

  it("stores sessionId, knowledge, and keys on the state", () => {
    const state = makeBaseState();
    expect(state.sessionId).toBe("session-test-123");
    expect(state.knowledge).toBe(MOCK_KNOWLEDGE);
    expect(state.keys.claude).toBe("sk-ant-test-key");
  });

  it("stores recentPosts when provided", () => {
    const state = makeBaseState();
    expect(state.recentPosts).toEqual([{ pillar: "P2", date: "2024-01-10" }]);
  });

  it("leaves all phase outputs undefined initially", () => {
    const state = makeBaseState();
    expect(state.strategistOutput).toBeUndefined();
    expect(state.selectedTopic).toBeUndefined();
    expect(state.discoveryBrief).toBeUndefined();
    expect(state.evidencePack).toBeUndefined();
    expect(state.writerOutput).toBeUndefined();
    expect(state.scoreResult).toBeUndefined();
    expect(state.formattedPost).toBeUndefined();
    expect(state.learnerOutput).toBeUndefined();
    expect(state.finalVersion).toBeUndefined();
    expect(state.error).toBeUndefined();
  });

  it("works without optional recentPosts", () => {
    const state = createPipelineState({
      sessionId: "s1",
      knowledge: [],
      keys: { claude: "key" },
    });
    expect(state.recentPosts).toBeUndefined();
    expect(state.phase).toBe("idle");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runDirection — Phase 1
// ═════════════════════════════════════════════════════════════════════════════

describe("runDirection — Phase 1", () => {
  it("sets phase to direction and emits running event at 0%", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const { emit, events } = makeEmitSpy();
    const state = makeBaseState();

    await runDirection(state, emit);

    const first = events[0];
    expect(first.step).toBe("direction");
    expect(first.status).toBe("running");
    expect(first.percent).toBe(0);
  });

  it("emits waiting-for-user event at 100% with strategist output as data", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const { emit, events } = makeEmitSpy();
    await runDirection(makeBaseState(), emit);

    const last = events[events.length - 1];
    expect(last.step).toBe("direction");
    expect(last.status).toBe("waiting-for-user");
    expect(last.percent).toBe(100);
    expect(last.data).toEqual(MOCK_STRATEGIST_OUTPUT);
  });

  it("stores strategistOutput on state", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const state = makeBaseState();
    await runDirection(state, jest.fn());

    expect(state.strategistOutput).toEqual(MOCK_STRATEGIST_OUTPUT);
  });

  it("calls runStrategist with api key, knowledge, and recentPosts", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const state = makeBaseState();
    await runDirection(state, jest.fn());

    expect(mockRunStrategist).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-ant-test-key",
        knowledge: MOCK_KNOWLEDGE,
        recentPosts: [{ pillar: "P2", date: "2024-01-10" }],
      }),
    );
  });

  it("forwards AbortSignal to runStrategist", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const controller = new AbortController();
    await runDirection(makeBaseState(), jest.fn(), controller.signal);

    expect(mockRunStrategist).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("sets phase=error and emits error event when runStrategist throws", async () => {
    mockRunStrategist.mockRejectedValueOnce(new Error("API failure"));
    const { emit, events } = makeEmitSpy();
    const state = makeBaseState();

    const result = await runDirection(state, emit);

    expect(result.phase).toBe("error");
    expect(result.error).toBe("API failure");
    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.step).toBe("direction");
    expect((errorEvent?.data as Record<string, unknown>)?.error).toBe(
      "API failure",
    );
  });

  it("handles non-Error throws and converts to string", async () => {
    mockRunStrategist.mockRejectedValueOnce("raw string error");
    const state = makeBaseState();
    const result = await runDirection(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("raw string error");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runDiscovery — Phase 2
// ═════════════════════════════════════════════════════════════════════════════

describe("runDiscovery — Phase 2", () => {
  function makeStateWithTopic(): PipelineState {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    return state;
  }

  it("throws synchronously if selectedTopic is not set", async () => {
    const state = makeBaseState(); // no selectedTopic
    await expect(runDiscovery(state, jest.fn())).rejects.toThrow(
      "No topic selected for discovery",
    );
  });

  it("sets phase=discovery and emits running events in sequence", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const { emit, events } = makeEmitSpy();

    await runDiscovery(makeStateWithTopic(), emit);

    expect(events[0]).toMatchObject({
      step: "discovery",
      status: "running",
      percent: 0,
    });
    expect(
      events.find(
        (e) => e.step === "discovery-research" && e.status === "running",
      ),
    ).toBeDefined();
    expect(
      events.find(
        (e) => e.step === "discovery-research" && e.status === "done",
      ),
    ).toBeDefined();
    expect(
      events.find(
        (e) => e.step === "discovery-refine" && e.status === "running",
      ),
    ).toBeDefined();
  });

  it("emits waiting-for-user at 100% with discoveryBrief and refinedTopic", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const { emit, events } = makeEmitSpy();

    await runDiscovery(makeStateWithTopic(), emit);

    const last = events[events.length - 1];
    expect(last.step).toBe("discovery");
    expect(last.status).toBe("waiting-for-user");
    expect(last.percent).toBe(100);
    expect((last.data as Record<string, unknown>).discoveryBrief).toEqual(
      MOCK_DISCOVERY_BRIEF,
    );
    expect((last.data as Record<string, unknown>).refinedTopic).toEqual(
      MOCK_REFINED_TOPIC,
    );
  });

  it("stores discoveryBrief and refinedTopic on state", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const state = makeStateWithTopic();
    await runDiscovery(state, jest.fn());

    expect(state.discoveryBrief).toEqual(MOCK_DISCOVERY_BRIEF);
    expect(state.refinedTopic).toEqual(MOCK_REFINED_TOPIC);
  });

  it("falls back to selectedTopic when strategist returns empty proposals", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const state = makeStateWithTopic();
    await runDiscovery(state, jest.fn());

    expect(state.refinedTopic).toEqual(MOCK_TOPIC);
  });

  it("calls runResearcher in discovery mode with selectedTopic headline", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const state = makeStateWithTopic();
    await runDiscovery(state, jest.fn());

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "discovery",
        topic: MOCK_TOPIC.headline,
      }),
    );
  });

  it("passes perplexity and reddit credentials to runResearcher", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const state = makeStateWithTopic();
    state.keys.reddit = { clientId: "rid", clientSecret: "rsec" };
    await runDiscovery(state, jest.fn());

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({
        perplexityKey: "pplx-test-key",
        redditCredentials: { clientId: "rid", clientSecret: "rsec" },
      }),
    );
  });

  it("sets phase=error when runResearcher throws", async () => {
    mockRunResearcher.mockRejectedValueOnce(new Error("Perplexity down"));
    const state = makeStateWithTopic();
    const result = await runDiscovery(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Perplexity down");
  });

  it("sets phase=error when runStrategist (refinement) throws", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockRejectedValueOnce(new Error("Claude timeout"));
    const state = makeStateWithTopic();
    const result = await runDiscovery(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Claude timeout");
  });

  it("forwards AbortSignal to both runResearcher and runStrategist", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF);
    mockRunStrategist.mockResolvedValueOnce({
      proposals: [MOCK_REFINED_TOPIC],
      pillarAssessment: "",
      angleAssessment: "",
      currentPhase: "",
    });
    const controller = new AbortController();
    const state = makeStateWithTopic();
    await runDiscovery(state, jest.fn(), controller.signal);

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mockRunStrategist).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runEvidence — Phase 3
// ═════════════════════════════════════════════════════════════════════════════

describe("runEvidence — Phase 3", () => {
  function makeStateForEvidence(): PipelineState {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    state.refinedTopic = MOCK_REFINED_TOPIC;
    return state;
  }

  it("throws if no topic is available", async () => {
    const state = makeBaseState();
    await expect(runEvidence(state, jest.fn())).rejects.toThrow(
      "No topic available for evidence gathering",
    );
  });

  it("sets phase=evidence and emits running at 0%", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const { emit, events } = makeEmitSpy();

    await runEvidence(makeStateForEvidence(), emit);

    expect(events[0]).toMatchObject({
      step: "evidence",
      status: "running",
      percent: 0,
    });
  });

  it("emits waiting-for-user at 100% with evidencePack as data", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const { emit, events } = makeEmitSpy();

    await runEvidence(makeStateForEvidence(), emit);

    const last = events[events.length - 1];
    expect(last.step).toBe("evidence");
    expect(last.status).toBe("waiting-for-user");
    expect(last.percent).toBe(100);
    expect(last.data).toEqual(MOCK_EVIDENCE_PACK);
  });

  it("stores evidencePack on state", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const state = makeStateForEvidence();
    await runEvidence(state, jest.fn());

    expect(state.evidencePack).toEqual(MOCK_EVIDENCE_PACK);
  });

  it("prefers refinedTopic over selectedTopic for the evidence query", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const state = makeStateForEvidence();
    await runEvidence(state, jest.fn());

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "evidence",
        topic: MOCK_REFINED_TOPIC.headline,
        angle: MOCK_REFINED_TOPIC.angle,
      }),
    );
  });

  it("uses selectedTopic when refinedTopic is not set", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    await runEvidence(state, jest.fn());

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: MOCK_TOPIC.headline,
        angle: MOCK_TOPIC.angle,
      }),
    );
  });

  it("sets phase=error when runResearcher throws", async () => {
    mockRunResearcher.mockRejectedValueOnce(new Error("Reddit API down"));
    const state = makeStateForEvidence();
    const result = await runEvidence(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Reddit API down");
  });

  it("forwards AbortSignal to runResearcher", async () => {
    mockRunResearcher.mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    const controller = new AbortController();
    const state = makeStateForEvidence();
    await runEvidence(state, jest.fn(), controller.signal);

    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runWriteAndScore — Phases 4 + 5
// ═════════════════════════════════════════════════════════════════════════════

describe("runWriteAndScore — Phases 4+5", () => {
  function makeStateForWriting(): PipelineState {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    state.refinedTopic = MOCK_REFINED_TOPIC;
    state.evidencePack = MOCK_EVIDENCE_PACK;
    return state;
  }

  it("throws if no topic is available", async () => {
    const state = makeBaseState();
    state.evidencePack = MOCK_EVIDENCE_PACK;
    await expect(runWriteAndScore(state, jest.fn())).rejects.toThrow(
      "No topic for writing",
    );
  });

  it("throws if evidencePack is missing", async () => {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    await expect(runWriteAndScore(state, jest.fn())).rejects.toThrow(
      "No evidence pack for writing",
    );
  });

  it("defaults selectedTemplate from topic recommendation when not set", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const state = makeStateForWriting();
    expect(state.selectedTemplate).toBeUndefined();

    await runWriteAndScore(state, jest.fn());

    expect(state.selectedTemplate).toBe(
      MOCK_REFINED_TOPIC.templateRecommendation,
    );
  });

  it("emits writing running event with percent=10 on first attempt", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const { emit, events } = makeEmitSpy();

    await runWriteAndScore(makeStateForWriting(), emit);

    const writingRunning = events.find(
      (e) => e.step === "writing" && e.status === "running",
    );
    expect(writingRunning).toBeDefined();
    expect(writingRunning?.percent).toBe(10);
  });

  it("emits writing done, guardrails done, scoring running, scoring done events", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const { emit, events } = makeEmitSpy();

    await runWriteAndScore(makeStateForWriting(), emit);

    expect(
      events.find((e) => e.step === "writing" && e.status === "done"),
    ).toBeDefined();
    expect(
      events.find((e) => e.step === "guardrails" && e.status === "done"),
    ).toBeDefined();
    expect(
      events.find((e) => e.step === "scoring" && e.status === "running"),
    ).toBeDefined();
    expect(
      events.find((e) => e.step === "scoring" && e.status === "done"),
    ).toBeDefined();
  });

  it("stores writerOutput and scoreResult on state", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const state = makeStateForWriting();

    await runWriteAndScore(state, jest.fn());

    expect(state.writerOutput).toEqual(MOCK_WRITER_OUTPUT);
    expect(state.scoreResult).toEqual(MOCK_SCORE_PASSING);
  });

  it("calls runWriter with topic, evidencePack, template, and api key", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const state = makeStateForWriting();
    state.selectedTemplate = "strong-opinion";

    await runWriteAndScore(state, jest.fn());

    expect(mockRunWriter).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-ant-test-key",
        topicCard: MOCK_REFINED_TOPIC,
        evidencePack: MOCK_EVIDENCE_PACK,
        template: "strong-opinion",
      }),
    );
  });

  it("does not rewrite when score meets threshold on first attempt", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING); // 80 >= 75 threshold

    await runWriteAndScore(makeStateForWriting(), jest.fn());

    expect(mockRunWriter).toHaveBeenCalledTimes(1);
    expect(mockRunScorer).toHaveBeenCalledTimes(1);
  });

  it("rewrites once when first score is below threshold", async () => {
    mockRunWriter
      .mockResolvedValueOnce(MOCK_WRITER_OUTPUT)
      .mockResolvedValueOnce({
        ...MOCK_WRITER_OUTPUT,
        content: "rewritten content",
      });
    mockRunScorer
      .mockResolvedValueOnce(MOCK_SCORE_FAILING) // below threshold
      .mockResolvedValueOnce(MOCK_SCORE_PASSING); // passes on rewrite

    await runWriteAndScore(makeStateForWriting(), jest.fn());

    expect(mockRunWriter).toHaveBeenCalledTimes(2);
    expect(mockRunScorer).toHaveBeenCalledTimes(2);
  });

  it("stops after MAX_REWRITES attempts even if score never passes", async () => {
    for (let i = 0; i <= MAX_REWRITES; i++) {
      mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
      mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_FAILING);
    }

    await runWriteAndScore(makeStateForWriting(), jest.fn());

    expect(mockRunWriter).toHaveBeenCalledTimes(MAX_REWRITES + 1);
  });

  it("passes rewriteContext on second attempt with previous draft and scorer feedback", async () => {
    mockRunWriter
      .mockResolvedValueOnce(MOCK_WRITER_OUTPUT)
      .mockResolvedValueOnce({ ...MOCK_WRITER_OUTPUT });
    mockRunScorer
      .mockResolvedValueOnce(MOCK_SCORE_FAILING)
      .mockResolvedValueOnce(MOCK_SCORE_PASSING);

    await runWriteAndScore(makeStateForWriting(), jest.fn());

    const secondWriterCall = mockRunWriter.mock.calls[1][0];
    expect(secondWriterCall.rewriteContext).toBeDefined();
    expect(secondWriterCall.rewriteContext?.previousDraft).toBe(
      MOCK_WRITER_OUTPUT.content,
    );
    expect(secondWriterCall.rewriteContext?.attemptNumber).toBe(2);
  });

  it("emits maxRewritesReached:true on final failing attempt", async () => {
    for (let i = 0; i <= MAX_REWRITES; i++) {
      mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
      mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_FAILING);
    }
    const { emit, events } = makeEmitSpy();

    await runWriteAndScore(makeStateForWriting(), emit);

    const maxReachedEvent = events.find(
      (e) =>
        e.step === "scoring" &&
        e.status === "done" &&
        (e.data as Record<string, unknown>)?.maxRewritesReached === true,
    );
    expect(maxReachedEvent).toBeDefined();
  });

  it("calls quickKillCheck and runGuardrails on each writing attempt", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);

    await runWriteAndScore(makeStateForWriting(), jest.fn());

    expect(mockQuickKillCheck).toHaveBeenCalledWith(
      MOCK_WRITER_OUTPUT.content,
      MOCK_KNOWLEDGE,
    );
    expect(mockRunGuardrails).toHaveBeenCalledWith(
      MOCK_WRITER_OUTPUT.content,
      MOCK_KNOWLEDGE,
    );
  });

  it("emits guardrailResults in the guardrails event", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    const mockResults = [
      { rule: "No emojis", source: "rules/hard-rules", passed: true },
    ];
    mockRunGuardrails.mockReturnValueOnce(mockResults);
    const { emit, events } = makeEmitSpy();

    await runWriteAndScore(makeStateForWriting(), emit);

    const guardrailEvent = events.find((e) => e.step === "guardrails");
    expect(guardrailEvent?.guardrailResults).toEqual(mockResults);
  });

  it("sets phase=error when runWriter throws", async () => {
    mockRunWriter.mockRejectedValueOnce(new Error("Writer API failure"));
    const state = makeStateForWriting();
    const result = await runWriteAndScore(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Writer API failure");
  });

  it("sets phase=error when runScorer throws", async () => {
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockRejectedValueOnce(new Error("Scorer API failure"));
    const state = makeStateForWriting();
    const result = await runWriteAndScore(state, jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Scorer API failure");
  });

  it("constants MAX_REWRITES and REWRITE_THRESHOLD are exported correctly", () => {
    expect(MAX_REWRITES).toBe(3);
    expect(REWRITE_THRESHOLD).toBe(75);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runFormat — Phase 6
// ═════════════════════════════════════════════════════════════════════════════

describe("runFormat — Phase 6", () => {
  function makeStateForFormat(): PipelineState {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    state.writerOutput = MOCK_WRITER_OUTPUT;
    state.scoreResult = MOCK_SCORE_PASSING;
    return state;
  }

  it("throws if writerOutput is missing", async () => {
    const state = makeBaseState();
    state.scoreResult = MOCK_SCORE_PASSING;
    await expect(runFormat(state, jest.fn())).rejects.toThrow(
      "No writer output to format",
    );
  });

  it("throws if scoreResult is missing", async () => {
    const state = makeBaseState();
    state.writerOutput = MOCK_WRITER_OUTPUT;
    await expect(runFormat(state, jest.fn())).rejects.toThrow(
      "No score result",
    );
  });

  it("throws if no topic is available", async () => {
    const state = makeBaseState();
    state.writerOutput = MOCK_WRITER_OUTPUT;
    state.scoreResult = MOCK_SCORE_PASSING;
    await expect(runFormat(state, jest.fn())).rejects.toThrow("No topic");
  });

  it("sets phase=formatting and emits running at 0%", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const { emit, events } = makeEmitSpy();

    await runFormat(makeStateForFormat(), emit);

    expect(events[0]).toMatchObject({
      step: "formatting",
      status: "running",
      percent: 0,
    });
  });

  it("emits waiting-for-user at 100% with formatted post as data", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const { emit, events } = makeEmitSpy();

    await runFormat(makeStateForFormat(), emit);

    const last = events[events.length - 1];
    expect(last.step).toBe("formatting");
    expect(last.status).toBe("waiting-for-user");
    expect(last.percent).toBe(100);
    expect(last.data).toEqual(MOCK_FORMATTED_POST);
  });

  it("stores formattedPost on state", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const state = makeStateForFormat();

    await runFormat(state, jest.fn());

    expect(state.formattedPost).toEqual(MOCK_FORMATTED_POST);
  });

  it("calls runFormatter with draft, score, topicCard, and template", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const state = makeStateForFormat();
    state.selectedTemplate = "strong-opinion";

    await runFormat(state, jest.fn());

    expect(mockRunFormatter).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: MOCK_WRITER_OUTPUT.content,
        score: MOCK_SCORE_PASSING.totalScore,
        topicCard: MOCK_TOPIC,
        template: "strong-opinion",
      }),
    );
  });

  it("falls back to writerOutput.template when selectedTemplate is not set", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const state = makeStateForFormat();
    state.selectedTemplate = undefined;

    await runFormat(state, jest.fn());

    expect(mockRunFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ template: MOCK_WRITER_OUTPUT.template }),
    );
  });

  it("sets phase=error when runFormatter throws", async () => {
    mockRunFormatter.mockRejectedValueOnce(new Error("Formatter error"));
    const result = await runFormat(makeStateForFormat(), jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Formatter error");
  });

  it("forwards AbortSignal to runFormatter", async () => {
    mockRunFormatter.mockResolvedValueOnce(MOCK_FORMATTED_POST);
    const controller = new AbortController();
    const state = makeStateForFormat();
    await runFormat(state, jest.fn(), controller.signal);

    expect(mockRunFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runReview — Phase 7
// ═════════════════════════════════════════════════════════════════════════════

describe("runReview — Phase 7", () => {
  function makeStateForReview(): PipelineState {
    const state = makeBaseState();
    state.formattedPost = MOCK_FORMATTED_POST;
    return state;
  }

  it("throws if formattedPost is missing", async () => {
    const state = makeBaseState();
    await expect(runReview(state, jest.fn(), {})).rejects.toThrow(
      "No formatted post for review",
    );
  });

  it("emits waiting-for-user event with formattedPost as data", async () => {
    const { emit, events } = makeEmitSpy();
    const state = makeStateForReview();

    await runReview(state, emit, { finalVersion: "user edited version" });

    const waitingEvent = events.find(
      (e) => e.step === "review" && e.status === "waiting-for-user",
    );
    expect(waitingEvent).toBeDefined();
    expect(
      (waitingEvent?.data as Record<string, unknown>).formattedPost,
    ).toEqual(MOCK_FORMATTED_POST);
  });

  it("sets phase=error when finalVersion is missing from checkpoint", async () => {
    const { emit, events } = makeEmitSpy();
    const state = makeStateForReview();

    const result = await runReview(state, emit, {}); // no finalVersion

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Review checkpoint missing finalVersion");
    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent?.step).toBe("review");
  });

  it("stores finalVersion on state when provided", async () => {
    const state = makeStateForReview();
    const finalText = "User's final edited post";

    await runReview(state, jest.fn(), { finalVersion: finalText });

    expect(state.finalVersion).toBe(finalText);
  });

  it("stores userFeedback on state when provided", async () => {
    const state = makeStateForReview();
    const feedback = ["Great hook", "Add more data"];

    await runReview(state, jest.fn(), {
      finalVersion: "done",
      userFeedback: feedback,
    });

    expect(state.userFeedback).toEqual(feedback);
  });

  it("does not set userFeedback when omitted from checkpoint", async () => {
    const state = makeStateForReview();

    await runReview(state, jest.fn(), { finalVersion: "done" });

    expect(state.userFeedback).toBeUndefined();
  });

  it("emits done event at 100% with formattedPost and finalVersion", async () => {
    const { emit, events } = makeEmitSpy();
    const state = makeStateForReview();
    const finalText = "User edited version";

    await runReview(state, emit, { finalVersion: finalText });

    const doneEvent = events.find(
      (e) => e.step === "review" && e.status === "done",
    );
    expect(doneEvent).toBeDefined();
    expect(doneEvent?.percent).toBe(100);
    expect((doneEvent?.data as Record<string, unknown>).finalVersion).toBe(
      finalText,
    );
    expect((doneEvent?.data as Record<string, unknown>).formattedPost).toEqual(
      MOCK_FORMATTED_POST,
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runLearn — Phase 8
// ═════════════════════════════════════════════════════════════════════════════

describe("runLearn — Phase 8", () => {
  function makeStateForLearning(): PipelineState {
    const state = makeBaseState();
    state.selectedTopic = MOCK_TOPIC;
    state.writerOutput = MOCK_WRITER_OUTPUT;
    state.finalVersion = "User's final edited version";
    state.scoreResult = MOCK_SCORE_PASSING;
    state.selectedTemplate = "strong-opinion";
    return state;
  }

  it("throws if writerOutput is missing", async () => {
    const state = makeBaseState();
    state.finalVersion = "done";
    await expect(runLearn(state, jest.fn())).rejects.toThrow(
      "No writer output for learning",
    );
  });

  it("throws if finalVersion is missing", async () => {
    const state = makeBaseState();
    state.writerOutput = MOCK_WRITER_OUTPUT;
    state.selectedTopic = MOCK_TOPIC;
    await expect(runLearn(state, jest.fn())).rejects.toThrow(
      "No final version for learning",
    );
  });

  it("throws if no topic is available", async () => {
    const state = makeBaseState();
    state.writerOutput = MOCK_WRITER_OUTPUT;
    state.finalVersion = "done";
    await expect(runLearn(state, jest.fn())).rejects.toThrow("No topic");
  });

  it("sets phase=learning and emits running at 0%", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const { emit, events } = makeEmitSpy();

    await runLearn(makeStateForLearning(), emit);

    expect(events[0]).toMatchObject({
      step: "learning",
      status: "running",
      percent: 0,
    });
  });

  it("sets phase=complete and emits done at 100% on success", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const { emit, events } = makeEmitSpy();
    const state = makeStateForLearning();

    const result = await runLearn(state, emit);

    expect(result.phase).toBe("complete");
    const doneEvent = events.find(
      (e) => e.step === "learning" && e.status === "done",
    );
    expect(doneEvent?.percent).toBe(100);
    expect(doneEvent?.data).toEqual(MOCK_LEARNER_OUTPUT);
  });

  it("stores learnerOutput on state", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const state = makeStateForLearning();

    await runLearn(state, jest.fn());

    expect(state.learnerOutput).toEqual(MOCK_LEARNER_OUTPUT);
  });

  it("calls runLearner with originalDraft, finalVersion, and sessionContext", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const state = makeStateForLearning();
    state.userFeedback = ["Great post"];

    await runLearn(state, jest.fn());

    expect(mockRunLearner).toHaveBeenCalledWith(
      expect.objectContaining({
        originalDraft: MOCK_WRITER_OUTPUT.content,
        finalVersion: state.finalVersion,
        userFeedback: ["Great post"],
        sessionContext: expect.objectContaining({
          topic: MOCK_TOPIC.headline,
          score: MOCK_SCORE_PASSING.totalScore,
        }),
      }),
    );
  });

  it("uses refinedTopic headline when available in sessionContext", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const state = makeStateForLearning();
    state.refinedTopic = MOCK_REFINED_TOPIC;

    await runLearn(state, jest.fn());

    expect(mockRunLearner).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionContext: expect.objectContaining({
          topic: MOCK_REFINED_TOPIC.headline,
        }),
      }),
    );
  });

  it("falls back to 0 score in sessionContext when scoreResult is missing", async () => {
    mockRunLearner.mockResolvedValueOnce(MOCK_LEARNER_OUTPUT);
    const state = makeStateForLearning();
    state.scoreResult = undefined;

    await runLearn(state, jest.fn());

    expect(mockRunLearner).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionContext: expect.objectContaining({ score: 0 }),
      }),
    );
  });

  it("sets phase=error when runLearner throws", async () => {
    mockRunLearner.mockRejectedValueOnce(new Error("Learner API down"));
    const result = await runLearn(makeStateForLearning(), jest.fn());

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Learner API down");
  });

  it("emits error event with error message when runLearner throws", async () => {
    mockRunLearner.mockRejectedValueOnce(new Error("Learner error"));
    const { emit, events } = makeEmitSpy();

    await runLearn(makeStateForLearning(), emit);

    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent?.step).toBe("learning");
    expect((errorEvent?.data as Record<string, unknown>).error).toBe(
      "Learner error",
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — Master Orchestrator
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — happy path (all 8 phases)", () => {
  it("returns phase=complete when all phases succeed", async () => {
    setupFullHappyPath();
    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();

    const result = await runPipeline(state, jest.fn(), checkpoints);

    expect(result.phase).toBe("complete");
  });

  it("executes all 8 phases in the correct sequence", async () => {
    const callOrder: string[] = [];
    // Use mockImplementation (not mockResolvedValueOnce) to track call order
    mockRunStrategist.mockImplementation(async (input) => {
      callOrder.push(
        input.discoveryBrief ? "strategist-refine" : "strategist-direction",
      );
      return input.discoveryBrief
        ? {
            proposals: [MOCK_REFINED_TOPIC],
            pillarAssessment: "",
            angleAssessment: "",
            currentPhase: "",
          }
        : MOCK_STRATEGIST_OUTPUT;
    });
    mockRunResearcher.mockImplementation(async (input) => {
      callOrder.push(`researcher-${input.mode}`);
      return input.mode === "discovery"
        ? MOCK_DISCOVERY_BRIEF
        : MOCK_EVIDENCE_PACK;
    });
    mockRunWriter.mockImplementation(async () => {
      callOrder.push("writer");
      return MOCK_WRITER_OUTPUT;
    });
    mockRunScorer.mockImplementation(async () => {
      callOrder.push("scorer");
      return MOCK_SCORE_PASSING;
    });
    mockRunFormatter.mockImplementation(async () => {
      callOrder.push("formatter");
      return MOCK_FORMATTED_POST;
    });
    mockRunLearner.mockImplementation(async () => {
      callOrder.push("learner");
      return MOCK_LEARNER_OUTPUT;
    });

    const state = makeBaseState();
    await runPipeline(state, jest.fn(), makeFullCheckpoints());

    expect(callOrder).toEqual([
      "strategist-direction",
      "researcher-discovery",
      "strategist-refine",
      "researcher-evidence",
      "writer",
      "scorer",
      "formatter",
      "learner",
    ]);
  });

  it("applies selectedTopic from checkpoint after Phase 1", async () => {
    setupFullHappyPath();
    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();

    await runPipeline(state, jest.fn(), checkpoints);

    expect(state.selectedTopic).toEqual(MOCK_TOPIC);
  });

  it("applies optional refinedTopic override from checkpoint after Phase 2", async () => {
    setupFullHappyPath();
    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();

    await runPipeline(state, jest.fn(), checkpoints);

    // Checkpoint refinedTopic overrides whatever strategist returned
    expect(state.refinedTopic).toEqual(MOCK_REFINED_TOPIC);
  });

  it("does not override refinedTopic when checkpoint.refinedTopic is omitted", async () => {
    // Configure mocks directly (no setupFullHappyPath to avoid stacking)
    mockRunStrategist
      .mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT) // Phase 1
      .mockResolvedValueOnce({
        proposals: [MOCK_REFINED_TOPIC],
        pillarAssessment: "",
        angleAssessment: "",
        currentPhase: "",
      }); // Phase 2 refinement returns MOCK_REFINED_TOPIC
    mockRunResearcher
      .mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF)
      .mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    mockRunWriter.mockResolvedValue(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValue(MOCK_SCORE_PASSING);
    mockRunFormatter.mockResolvedValue(MOCK_FORMATTED_POST);
    mockRunLearner.mockResolvedValue(MOCK_LEARNER_OUTPUT);

    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();
    delete checkpoints.refinedTopic;

    await runPipeline(state, jest.fn(), checkpoints);

    // refinedTopic should be what discovery phase set (from strategist.proposals[0])
    expect(state.refinedTopic).toEqual(MOCK_REFINED_TOPIC);
  });

  it("applies optional selectedTemplate from checkpoint before Phase 4", async () => {
    setupFullHappyPath();
    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();
    checkpoints.selectedTemplate = "data-story";

    await runPipeline(state, jest.fn(), checkpoints);

    expect(state.selectedTemplate).toBe("data-story");
  });

  it("stores finalVersion from review checkpoint on state", async () => {
    setupFullHappyPath();
    const state = makeBaseState();
    const checkpoints = makeFullCheckpoints();

    await runPipeline(state, jest.fn(), checkpoints);

    expect(state.finalVersion).toBe(checkpoints.finalVersion);
  });

  it("accumulates all phase outputs in final state", async () => {
    setupFullHappyPath();
    const state = makeBaseState();

    const result = await runPipeline(state, jest.fn(), makeFullCheckpoints());

    expect(result.strategistOutput).toBeDefined();
    expect(result.selectedTopic).toBeDefined();
    expect(result.discoveryBrief).toBeDefined();
    expect(result.evidencePack).toBeDefined();
    expect(result.writerOutput).toBeDefined();
    expect(result.scoreResult).toBeDefined();
    expect(result.formattedPost).toBeDefined();
    expect(result.learnerOutput).toBeDefined();
  });

  it("emits events for all phases with increasing percent", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    const steps = events.map((e) => e.step);
    expect(steps).toContain("direction");
    expect(steps).toContain("discovery");
    expect(steps).toContain("discovery-research");
    expect(steps).toContain("discovery-refine");
    expect(steps).toContain("evidence");
    expect(steps).toContain("writing");
    expect(steps).toContain("guardrails");
    expect(steps).toContain("scoring");
    expect(steps).toContain("formatting");
    expect(steps).toContain("review");
    expect(steps).toContain("learning");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — Checkpoint validation
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — checkpoint validation", () => {
  it("returns phase=error when selectedTopic is missing from checkpoint", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const state = makeBaseState();
    const checkpoints: PipelineCheckpoint = {}; // no selectedTopic

    const result = await runPipeline(state, jest.fn(), checkpoints);

    expect(result.phase).toBe("error");
    expect(result.error).toContain("selectedTopic");
  });

  it("emits error event with direction step when selectedTopic missing", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, {});

    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent?.step).toBe("direction");
    expect((errorEvent?.data as Record<string, unknown>)?.error).toContain(
      "selectedTopic",
    );
  });

  it("does not execute Phase 2+ when selectedTopic is missing", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);

    await runPipeline(makeBaseState(), jest.fn(), {});

    expect(mockRunResearcher).not.toHaveBeenCalled();
  });

  it("returns phase=error when finalVersion is missing from review checkpoint", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    delete checkpoints.finalVersion; // remove required finalVersion

    const result = await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(result.phase).toBe("error");
    expect(result.error).toContain("finalVersion");
  });

  it("does not execute Learning phase when review fails", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    delete checkpoints.finalVersion;

    await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(mockRunLearner).not.toHaveBeenCalled();
  });

  it("accepts optional refinedTopic and applies it to state", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    const customTopic = {
      ...MOCK_REFINED_TOPIC,
      headline: "Custom override headline",
    };
    checkpoints.refinedTopic = customTopic;

    const result = await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(result.refinedTopic).toEqual(customTopic);
  });

  it("pipeline proceeds without optional selectedTemplate", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    delete checkpoints.selectedTemplate;

    const result = await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(result.phase).toBe("complete");
  });

  it("pipeline proceeds without optional userFeedback", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    delete checkpoints.userFeedback;

    const result = await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(result.phase).toBe("complete");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — Error handling (early exit)
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — error handling with early exit", () => {
  it("stops pipeline at Phase 1 when runStrategist throws", async () => {
    mockRunStrategist.mockRejectedValueOnce(new Error("Phase 1 failure"));

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Phase 1 failure");
    expect(mockRunResearcher).not.toHaveBeenCalled();
    expect(mockRunWriter).not.toHaveBeenCalled();
    expect(mockRunLearner).not.toHaveBeenCalled();
  });

  it("stops pipeline at Phase 2 when runResearcher (discovery) throws", async () => {
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    mockRunResearcher.mockRejectedValueOnce(
      new Error("Phase 2 discovery failure"),
    );

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Phase 2 discovery failure");
    expect(mockRunWriter).not.toHaveBeenCalled();
  });

  it("stops pipeline at Phase 3 when runResearcher (evidence) throws", async () => {
    mockRunStrategist
      .mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT)
      .mockResolvedValueOnce({
        proposals: [MOCK_REFINED_TOPIC],
        pillarAssessment: "",
        angleAssessment: "",
        currentPhase: "",
      });
    mockRunResearcher
      .mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF)
      .mockRejectedValueOnce(new Error("Phase 3 evidence failure"));

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Phase 3 evidence failure");
    expect(mockRunWriter).not.toHaveBeenCalled();
  });

  it("stops pipeline at Phase 4/5 when runWriter throws", async () => {
    mockRunStrategist
      .mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT)
      .mockResolvedValueOnce({
        proposals: [MOCK_REFINED_TOPIC],
        pillarAssessment: "",
        angleAssessment: "",
        currentPhase: "",
      });
    mockRunResearcher
      .mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF)
      .mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    mockRunWriter.mockRejectedValueOnce(new Error("Phase 4 writer failure"));

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Phase 4 writer failure");
    expect(mockRunFormatter).not.toHaveBeenCalled();
    expect(mockRunLearner).not.toHaveBeenCalled();
  });

  it("stops pipeline at Phase 6 when runFormatter throws", async () => {
    mockRunStrategist
      .mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT)
      .mockResolvedValueOnce({
        proposals: [MOCK_REFINED_TOPIC],
        pillarAssessment: "",
        angleAssessment: "",
        currentPhase: "",
      });
    mockRunResearcher
      .mockResolvedValueOnce(MOCK_DISCOVERY_BRIEF)
      .mockResolvedValueOnce(MOCK_EVIDENCE_PACK);
    mockRunWriter.mockResolvedValueOnce(MOCK_WRITER_OUTPUT);
    mockRunScorer.mockResolvedValueOnce(MOCK_SCORE_PASSING);
    mockRunFormatter.mockRejectedValueOnce(new Error("Phase 6 format failure"));

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.phase).toBe("error");
    expect(result.error).toBe("Phase 6 format failure");
    expect(mockRunLearner).not.toHaveBeenCalled();
  });

  it("preserves error message on state for downstream consumers", async () => {
    mockRunStrategist.mockRejectedValueOnce(
      new Error("Specific error message"),
    );

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.error).toBe("Specific error message");
  });

  it("emits an error event with the error message on phase failure", async () => {
    mockRunStrategist.mockRejectedValueOnce(new Error("Strategist crashed"));
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    const errorEvent = events.find((e) => e.status === "error");
    expect(errorEvent).toBeDefined();
    expect((errorEvent?.data as Record<string, unknown>)?.error).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — AbortSignal cancellation
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — AbortSignal cancellation", () => {
  it("returns phase=error when signal is already aborted before Phase 1", async () => {
    const controller = new AbortController();
    controller.abort();

    // Phase 1 runs first, so strategist must respond (signal is checked after phase completes)
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);

    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
      controller.signal,
    );

    // After Phase 1 completes, aborted check fires before Phase 2
    expect(result.phase).toBe("error");
    expect(result.error).toBe("Pipeline aborted by caller");
  });

  it("emits pipeline error event with abort message", async () => {
    const controller = new AbortController();
    controller.abort();
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);
    const { emit, events } = makeEmitSpy();

    await runPipeline(
      makeBaseState(),
      emit,
      makeFullCheckpoints(),
      controller.signal,
    );

    const abortEvent = events.find(
      (e) => e.step === "pipeline" && e.status === "error",
    );
    expect(abortEvent).toBeDefined();
    expect((abortEvent?.data as Record<string, unknown>)?.error).toBe(
      "Pipeline aborted by caller",
    );
  });

  it("does not execute subsequent phases after abort", async () => {
    const controller = new AbortController();
    controller.abort();
    mockRunStrategist.mockResolvedValueOnce(MOCK_STRATEGIST_OUTPUT);

    await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
      controller.signal,
    );

    // After Phase 1 + abort check, no more phases should run
    expect(mockRunResearcher).not.toHaveBeenCalled();
    expect(mockRunWriter).not.toHaveBeenCalled();
    expect(mockRunLearner).not.toHaveBeenCalled();
  });

  it("forwards AbortSignal to each phase's agent function", async () => {
    setupFullHappyPath();
    const controller = new AbortController();

    await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
      controller.signal,
    );

    expect(mockRunStrategist).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mockRunResearcher).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mockRunWriter).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mockRunFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mockRunLearner).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("works correctly with no signal provided (signal=undefined)", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
      undefined,
    );

    expect(result.phase).toBe("complete");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — Event streaming structure
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — event streaming structure", () => {
  it("every emitted event has step, status, and percent fields", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    for (const event of events) {
      expect(event).toHaveProperty("step");
      expect(event).toHaveProperty("status");
      expect(event).toHaveProperty("percent");
    }
  });

  it("status values are only valid PipelineEvent statuses", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();
    const validStatuses = ["running", "done", "error", "waiting-for-user"];

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    for (const event of events) {
      expect(validStatuses).toContain(event.status);
    }
  });

  it("percent values are all between 0 and 100 inclusive", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    for (const event of events) {
      expect(event.percent).toBeGreaterThanOrEqual(0);
      expect(event.percent).toBeLessThanOrEqual(100);
    }
  });

  it("direction phase emits at least 2 events (running + waiting-for-user)", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    const directionEvents = events.filter((e) => e.step === "direction");
    expect(directionEvents.length).toBeGreaterThanOrEqual(2);
    expect(directionEvents[0].status).toBe("running");
    expect(directionEvents[directionEvents.length - 1].status).toBe(
      "waiting-for-user",
    );
  });

  it("learning phase emits done as the final event in a successful run", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    const last = events[events.length - 1];
    expect(last.step).toBe("learning");
    expect(last.status).toBe("done");
  });

  it("total event count is greater than 15 for a full successful run", async () => {
    setupFullHappyPath();
    const { emit, events } = makeEmitSpy();

    await runPipeline(makeBaseState(), emit, makeFullCheckpoints());

    // 8 phases with multiple events each = well over 15
    expect(events.length).toBeGreaterThan(15);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// runPipeline — State accumulation
// ═════════════════════════════════════════════════════════════════════════════

describe("runPipeline — state accumulation", () => {
  it("state.strategistOutput matches what runStrategist returned", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.strategistOutput).toEqual(MOCK_STRATEGIST_OUTPUT);
  });

  it("state.discoveryBrief matches what runResearcher returned in discovery mode", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.discoveryBrief).toEqual(MOCK_DISCOVERY_BRIEF);
  });

  it("state.evidencePack matches what runResearcher returned in evidence mode", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.evidencePack).toEqual(MOCK_EVIDENCE_PACK);
  });

  it("state.writerOutput matches what runWriter returned", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.writerOutput).toEqual(MOCK_WRITER_OUTPUT);
  });

  it("state.scoreResult matches what runScorer returned", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.scoreResult).toEqual(MOCK_SCORE_PASSING);
  });

  it("state.formattedPost matches what runFormatter returned", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.formattedPost).toEqual(MOCK_FORMATTED_POST);
  });

  it("state.learnerOutput matches what runLearner returned", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.learnerOutput).toEqual(MOCK_LEARNER_OUTPUT);
  });

  it("state.userFeedback is stored when provided in checkpoint", async () => {
    setupFullHappyPath();
    const checkpoints = makeFullCheckpoints();
    checkpoints.userFeedback = ["Excellent hook", "Data was on point"];

    const result = await runPipeline(makeBaseState(), jest.fn(), checkpoints);

    expect(result.userFeedback).toEqual([
      "Excellent hook",
      "Data was on point",
    ]);
  });

  it("state.error is undefined on successful pipeline completion", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.error).toBeUndefined();
  });

  it("state.rewriteCount is 0 when score passes on first attempt", async () => {
    setupFullHappyPath();
    const result = await runPipeline(
      makeBaseState(),
      jest.fn(),
      makeFullCheckpoints(),
    );

    expect(result.rewriteCount).toBe(0);
  });
});
