/**
 * Pipeline Orchestrator — state machine that drives the 8-phase content pipeline.
 *
 * Phases:
 *   1. Direction    — Strategist proposes topics
 *   2. Discovery    — Researcher (broad) + Strategist refines
 *   3. Evidence     — Researcher (deep) gathers proof
 *   4. Writing      — Writer produces draft
 *   5. Scoring      — Scorer evaluates + rewrite loop (max 3)
 *   6. Formatting   — Formatter produces LinkedIn-ready output
 *   7. Review       — User approval gate
 *   8. Learning     — Learner captures signals
 *
 * Each phase emits PipelineEvents via a callback for SSE streaming.
 */

import type {
  KnowledgeDocument,
  TopicProposal,
  DiscoveryBrief,
  EvidencePack,
  ScoreResult,
  FormattedPost,
  PipelineEvent,
} from "../knowledge/types";

import { runStrategist, type StrategistOutput } from "./strategist";
import { runResearcher } from "./researcher";
import { runWriter, type WriterOutput } from "./writer";
import { runScorer } from "./scorer";
import { runFormatter } from "./formatter";
import { runLearner, type LearnerOutput } from "./learner";
import { runGuardrails, quickKillCheck } from "./guardrails";

// ── Response Validation ──
/**
 * Runtime validation for agent outputs to catch response shape mismatches.
 * This prevents bugs like the strategist refine output shape mismatch.
 */

function validateStrategistResponse(output: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!output || typeof output !== "object") {
    return { valid: false, error: "Strategist output is not an object" };
  }
  const obj = output as Record<string, unknown>;

  if (!Array.isArray(obj.proposals)) {
    return {
      valid: false,
      error: "Strategist output missing 'proposals' array",
    };
  }

  if (obj.proposals.length === 0) {
    return {
      valid: false,
      error: "Strategist output has empty 'proposals' array",
    };
  }

  const requiredFields = [
    "pillarAssessment",
    "angleAssessment",
    "currentPhase",
  ];
  for (const field of requiredFields) {
    if (typeof obj[field] !== "string") {
      return {
        valid: false,
        error: `Strategist output missing or invalid '${field}' field`,
      };
    }
  }

  return { valid: true };
}

function validateWriterResponse(output: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!output || typeof output !== "object") {
    return { valid: false, error: "Writer output is not an object" };
  }
  const obj = output as Record<string, unknown>;

  if (typeof obj.content !== "string" || obj.content.length === 0) {
    return {
      valid: false,
      error: "Writer output missing or empty 'content' field",
    };
  }

  if (typeof obj.wordCount !== "number" || obj.wordCount < 10) {
    return {
      valid: false,
      error: "Writer output invalid 'wordCount' field",
    };
  }

  if (typeof obj.template !== "string") {
    return {
      valid: false,
      error: "Writer output missing 'template' field",
    };
  }

  return { valid: true };
}

function validateScorerResponse(output: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!output || typeof output !== "object") {
    return { valid: false, error: "Scorer output is not an object" };
  }
  const obj = output as Record<string, unknown>;

  if (typeof obj.totalScore !== "number") {
    return {
      valid: false,
      error: "Scorer output missing or invalid 'totalScore' field",
    };
  }

  if (!["publish", "rewrite", "scrap"].includes(obj.verdict as string)) {
    return {
      valid: false,
      error: `Scorer output invalid 'verdict': ${obj.verdict}`,
    };
  }

  if (!Array.isArray(obj.checklist)) {
    return {
      valid: false,
      error: "Scorer output missing or invalid 'checklist' array",
    };
  }

  return { valid: true };
}

function validateFormatterResponse(output: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!output || typeof output !== "object") {
    return { valid: false, error: "Formatter output is not an object" };
  }
  const obj = output as Record<string, unknown>;

  const hook = obj.hookBeforeFold as Record<string, unknown>;
  if (!hook || typeof hook !== "object") {
    return {
      valid: false,
      error: "Formatter output missing 'hookBeforeFold' object",
    };
  }

  if (typeof hook.mobile !== "string" || typeof hook.desktop !== "string") {
    return {
      valid: false,
      error: "Formatter output hookBeforeFold missing mobile/desktop",
    };
  }

  if (!obj.metadata || typeof obj.metadata !== "object") {
    return {
      valid: false,
      error: "Formatter output missing 'metadata' object",
    };
  }

  return { valid: true };
}

// ── Pipeline State ──

export type PipelinePhase =
  | "idle"
  | "direction"
  | "discovery"
  | "evidence"
  | "writing"
  | "scoring"
  | "formatting"
  | "review"
  | "learning"
  | "complete"
  | "error";

/** Brand preferences loaded from user profile at pipeline start */
export interface BrandContext {
  industry: string;
  audience: string[];
  tones: string[];
  contentStrategy: string;
  definition: string;
  copyGuideline: string;
  /** ISO timestamp of when the profile was last updated */
  lastUpdated?: string;
}

export interface PipelineState {
  phase: PipelinePhase;
  sessionId: string;
  /** All knowledge documents for this user */
  knowledge: KnowledgeDocument[];
  /** API keys */
  keys: {
    claude: string;
    perplexity?: string;
    reddit?: { clientId: string; clientSecret: string };
  };
  /** Recent posts for pillar balance */
  recentPosts?: { pillar: string; date: string }[];
  /** Brand context from user profile */
  brandContext?: BrandContext;
  /** Session-level tone override (overrides brand tones for this run) */
  toneOverride?: string;

  // Phase outputs (populated as pipeline progresses)
  strategistOutput?: StrategistOutput;
  selectedTopic?: TopicProposal;
  discoveryBrief?: DiscoveryBrief;
  refinedTopic?: TopicProposal;
  evidencePack?: EvidencePack;
  selectedTemplate?: string;
  writerOutput?: WriterOutput;
  scoreResult?: ScoreResult;
  formattedPost?: FormattedPost;
  learnerOutput?: LearnerOutput;
  /** User's final version (after edits in review phase) */
  finalVersion?: string;
  /** User feedback strings from the session */
  userFeedback?: string[];
  /** Rewrite attempt count */
  rewriteCount: number;
  /** Error if pipeline failed */
  error?: string;
}

export type EventCallback = (event: PipelineEvent) => void;

export const MAX_REWRITES = 3;
export const REWRITE_THRESHOLD = 75;

// ── Pipeline Runner ──

export function createPipelineState(params: {
  sessionId: string;
  knowledge: KnowledgeDocument[];
  keys: PipelineState["keys"];
  recentPosts?: PipelineState["recentPosts"];
  brandContext?: BrandContext;
}): PipelineState {
  return {
    phase: "idle",
    sessionId: params.sessionId,
    knowledge: params.knowledge,
    keys: params.keys,
    recentPosts: params.recentPosts,
    brandContext: params.brandContext,
    rewriteCount: 0,
  };
}

/**
 * Run Phase 1: Direction — Strategist proposes topics.
 */
export async function runDirection(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  state.phase = "direction";
  emit({ step: "direction", status: "running", percent: 0 });

  try {
    const output = await runStrategist({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      recentPosts: state.recentPosts,
      brandContext: state.brandContext,
      toneOverride: state.toneOverride,
      signal,
    });
    state.strategistOutput = output;
    emit({
      step: "direction",
      status: "waiting-for-user",
      percent: 100,
      data: output,
    });
    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "direction",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

/**
 * Run Phase 2: Discovery — Researcher (broad) + Strategist refines topic.
 * Must call after user selects a topic from Phase 1.
 */
export async function runDiscovery(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  if (!state.selectedTopic) throw new Error("No topic selected for discovery");
  state.phase = "discovery";
  emit({ step: "discovery", status: "running", percent: 0 });

  try {
    // Step 1: Broad research
    emit({ step: "discovery-research", status: "running", percent: 20 });
    const brief = await runResearcher({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      mode: "discovery",
      topic: state.selectedTopic.headline,
      perplexityKey: state.keys.perplexity,
      redditCredentials: state.keys.reddit,
      signal,
    });
    state.discoveryBrief = brief as DiscoveryBrief;
    emit({
      step: "discovery-research",
      status: "done",
      percent: 50,
      data: brief,
    });

    // Step 2: Strategist refines topic using discovery data
    emit({ step: "discovery-refine", status: "running", percent: 60 });
    const refined = await runStrategist({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      discoveryBrief: JSON.stringify(state.discoveryBrief),
      brandContext: state.brandContext,
      toneOverride: state.toneOverride,
      signal,
    });

    // Validate strategist response shape
    const validation = validateStrategistResponse(refined);
    if (!validation.valid) {
      throw new Error(`Invalid strategist response: ${validation.error}`);
    }

    // Refined output should have a single proposal
    state.refinedTopic = refined.proposals[0] || state.selectedTopic;
    emit({
      step: "discovery",
      status: "waiting-for-user",
      percent: 100,
      data: {
        discoveryBrief: state.discoveryBrief,
        refinedTopic: state.refinedTopic,
      },
    });
    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "discovery",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

/**
 * Run Phase 3: Evidence Gathering — Researcher (deep dive).
 */
export async function runEvidence(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  const topic = state.refinedTopic || state.selectedTopic;
  if (!topic) throw new Error("No topic available for evidence gathering");
  state.phase = "evidence";
  emit({ step: "evidence", status: "running", percent: 0 });

  try {
    const pack = await runResearcher({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      mode: "evidence",
      topic: topic.headline,
      angle: topic.angle,
      perplexityKey: state.keys.perplexity,
      redditCredentials: state.keys.reddit,
      signal,
    });
    state.evidencePack = pack as EvidencePack;
    emit({
      step: "evidence",
      status: "waiting-for-user",
      percent: 100,
      data: state.evidencePack,
    });
    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "evidence",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

/**
 * Run Phase 4: Writing + Phase 5: Scoring (with rewrite loop).
 * Runs writer → quick-kill check → scorer → rewrite if needed.
 */
export async function runWriteAndScore(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  const topic = state.refinedTopic || state.selectedTopic;
  if (!topic) throw new Error("No topic for writing");
  if (!state.evidencePack) throw new Error("No evidence pack for writing");
  // Default template if user didn't pick one
  if (!state.selectedTemplate) {
    state.selectedTemplate = topic.templateRecommendation || "strong-opinion";
  }

  state.phase = "writing";
  state.rewriteCount = 0;

  try {
    let writerOutput: WriterOutput | undefined;
    let scoreResult: ScoreResult | undefined;

    for (let attempt = 1; attempt <= MAX_REWRITES + 1; attempt++) {
      // Writing phase
      emit({
        step: "writing",
        status: "running",
        percent: attempt === 1 ? 10 : 50,
        data: attempt > 1 ? { rewriteAttempt: attempt } : undefined,
      });

      writerOutput = await runWriter({
        apiKey: state.keys.claude,
        knowledge: state.knowledge,
        topicCard: topic,
        evidencePack: state.evidencePack,
        template: state.selectedTemplate,
        rewriteContext:
          attempt > 1 && writerOutput && scoreResult
            ? {
                previousDraft: writerOutput.content,
                scorerFeedback:
                  scoreResult.rewriteInstructions ||
                  JSON.stringify(scoreResult.criteriaScores),
                attemptNumber: attempt,
              }
            : undefined,
        signal,
      });

      // Validate writer response shape
      const writerValidation = validateWriterResponse(writerOutput);
      if (!writerValidation.valid) {
        throw new Error(`Invalid writer response: ${writerValidation.error}`);
      }

      state.writerOutput = writerOutput;
      emit({
        step: "writing",
        status: "done",
        percent: 40,
        data: writerOutput,
      });

      // Quick Kill Check (guardrails)
      const qk = quickKillCheck(writerOutput.content, state.knowledge);
      const guardrails = runGuardrails(writerOutput.content, state.knowledge);
      emit({
        step: "guardrails",
        status: "done",
        percent: 50,
        data: { quickKill: qk },
        guardrailResults: guardrails,
      });

      // Scoring phase
      state.phase = "scoring";
      emit({ step: "scoring", status: "running", percent: 60 });

      scoreResult = await runScorer({
        apiKey: state.keys.claude,
        knowledge: state.knowledge,
        draft: writerOutput.content,
        topicCard: topic,
        previousScore: attempt > 1 ? scoreResult : undefined,
        signal,
      });

      // Validate scorer response shape
      const scorerValidation = validateScorerResponse(scoreResult);
      if (!scorerValidation.valid) {
        throw new Error(`Invalid scorer response: ${scorerValidation.error}`);
      }

      state.scoreResult = scoreResult;
      emit({
        step: "scoring",
        status: "done",
        percent: 80,
        data: scoreResult,
      });

      // Check if score passes threshold
      if (scoreResult.totalScore >= REWRITE_THRESHOLD) {
        break;
      }

      state.rewriteCount = attempt - 1;
      if (attempt >= MAX_REWRITES + 1) {
        // Max rewrites reached — proceed with best effort
        emit({
          step: "scoring",
          status: "done",
          percent: 80,
          data: { ...scoreResult, maxRewritesReached: true },
        });
        break;
      }

      // Loop for rewrite
      state.phase = "writing";
    }

    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "writing",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

/**
 * Run Phase 6: Formatting.
 */
export async function runFormat(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  if (!state.writerOutput) throw new Error("No writer output to format");
  if (!state.scoreResult) throw new Error("No score result");

  const topic = state.refinedTopic || state.selectedTopic;
  if (!topic) throw new Error("No topic");

  state.phase = "formatting";
  emit({ step: "formatting", status: "running", percent: 0 });

  try {
    const formatted = await runFormatter({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      draft: state.writerOutput.content,
      score: state.scoreResult.totalScore,
      topicCard: topic,
      template: state.selectedTemplate || state.writerOutput.template,
      signal,
    });

    // Validate formatter response shape
    const formatterValidation = validateFormatterResponse(formatted);
    if (!formatterValidation.valid) {
      throw new Error(
        `Invalid formatter response: ${formatterValidation.error}`,
      );
    }

    state.formattedPost = formatted;
    emit({
      step: "formatting",
      status: "waiting-for-user",
      percent: 100,
      data: formatted,
    });
    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "formatting",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

/**
 * Run Phase 8: Learning — after user approves/edits the post.
 */
export async function runLearn(
  state: PipelineState,
  emit: EventCallback,
  signal?: AbortSignal,
): Promise<PipelineState> {
  if (!state.writerOutput) throw new Error("No writer output for learning");
  if (!state.finalVersion) throw new Error("No final version for learning");

  const topic = state.refinedTopic || state.selectedTopic;
  if (!topic) throw new Error("No topic");

  state.phase = "learning";
  emit({ step: "learning", status: "running", percent: 0 });

  try {
    const learnerOutput = await runLearner({
      apiKey: state.keys.claude,
      knowledge: state.knowledge,
      originalDraft: state.writerOutput.content,
      finalVersion: state.finalVersion,
      userFeedback: state.userFeedback,
      sessionContext: {
        topic: topic.headline,
        angle: topic.angle,
        template: state.selectedTemplate || state.writerOutput.template,
        score: state.scoreResult?.totalScore || 0,
      },
      signal,
    });
    state.learnerOutput = learnerOutput;
    state.phase = "complete";
    emit({
      step: "learning",
      status: "done",
      percent: 100,
      data: learnerOutput,
    });
    return state;
  } catch (err) {
    state.phase = "error";
    state.error = err instanceof Error ? err.message : String(err);
    emit({
      step: "learning",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }
}

// ── Pipeline Checkpoint ──

/**
 * User-supplied inputs at each human-in-the-loop checkpoint.
 * Pass only the fields that have been provided at the time of the call.
 */
export interface PipelineCheckpoint {
  /** Required after Phase 1 (Direction): which topic the user selected */
  selectedTopic?: TopicProposal;
  /** Optional after Phase 2 (Discovery): user may override the refined topic */
  refinedTopic?: TopicProposal;
  /** Optional before Phase 4 (Writing): user may choose a specific template */
  selectedTemplate?: string;
  /** Required after Phase 7 (Review): the user's final (possibly edited) post */
  finalVersion?: string;
  /** Optional after Phase 7 (Review): free-form feedback strings */
  userFeedback?: string[];
}

// ── Phase 7: Review ──

/**
 * Run Phase 7: Review — user approves or edits the formatted post.
 * Waits for finalVersion to be provided via the checkpoint, then stores it
 * on the state so Phase 8 (Learning) can compare original vs final.
 */
export async function runReview(
  state: PipelineState,
  emit: EventCallback,
  checkpoint: PipelineCheckpoint,
): Promise<PipelineState> {
  if (!state.formattedPost) throw new Error("No formatted post for review");

  state.phase = "review";
  emit({
    step: "review",
    status: "waiting-for-user",
    percent: 0,
    data: { formattedPost: state.formattedPost },
  });

  // Apply the user's submission from the checkpoint
  const finalVersion = checkpoint.finalVersion;
  if (!finalVersion) {
    state.phase = "error";
    state.error = "Review checkpoint missing finalVersion";
    emit({
      step: "review",
      status: "error",
      percent: 0,
      data: { error: state.error },
    });
    return state;
  }

  state.finalVersion = finalVersion;
  if (checkpoint.userFeedback) {
    state.userFeedback = checkpoint.userFeedback;
  }

  emit({
    step: "review",
    status: "done",
    percent: 100,
    data: {
      formattedPost: state.formattedPost,
      finalVersion: state.finalVersion,
    },
  });

  return state;
}

// ── Master Pipeline Coordinator ──

/**
 * runPipeline — coordinates all 8 phases in sequence.
 *
 * The caller provides:
 *   - `state`       — initial PipelineState (from createPipelineState)
 *   - `emit`        — SSE event callback
 *   - `checkpoints` — user-supplied inputs at each human gate
 *   - `signal`      — optional AbortSignal for cancellation
 *
 * Phases:
 *   1. Direction      → awaits checkpoints.selectedTopic
 *   2. Discovery      → awaits checkpoints.refinedTopic (optional override)
 *   3. Evidence
 *   4+5. Writing + Scoring (rewrite loop)
 *   6. Formatting
 *   7. Review         → awaits checkpoints.finalVersion
 *   8. Learning
 *
 * Returns the final PipelineState (phase === "complete" on success, "error" on failure).
 */
export async function runPipeline(
  state: PipelineState,
  emit: EventCallback,
  checkpoints: PipelineCheckpoint,
  signal?: AbortSignal,
): Promise<PipelineState> {
  // ── Phase 1: Direction ──
  state = await runDirection(state, emit, signal);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // Apply user's topic selection
  if (!checkpoints.selectedTopic) {
    return pipelineError(
      state,
      emit,
      "direction",
      "Checkpoint missing selectedTopic",
    );
  }
  state.selectedTopic = checkpoints.selectedTopic;

  // ── Phase 2: Discovery ──
  state = await runDiscovery(state, emit, signal);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // User may optionally override the refined topic
  if (checkpoints.refinedTopic) {
    state.refinedTopic = checkpoints.refinedTopic;
  }

  // ── Phase 3: Evidence ──
  state = await runEvidence(state, emit, signal);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // User may optionally choose a template before writing
  if (checkpoints.selectedTemplate) {
    state.selectedTemplate = checkpoints.selectedTemplate;
  }

  // ── Phase 4 + 5: Writing + Scoring ──
  state = await runWriteAndScore(state, emit, signal);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // ── Phase 6: Formatting ──
  state = await runFormat(state, emit, signal);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // ── Phase 7: Review ──
  state = await runReview(state, emit, checkpoints);
  if (state.phase === "error") return state;
  if (signal?.aborted) return aborted(state, emit);

  // ── Phase 8: Learning ──
  state = await runLearn(state, emit, signal);
  return state;
}

// ── Internal helpers ──

function aborted(state: PipelineState, emit: EventCallback): PipelineState {
  state.phase = "error";
  state.error = "Pipeline aborted by caller";
  emit({
    step: "pipeline",
    status: "error",
    percent: 0,
    data: { error: state.error },
  });
  return state;
}

function pipelineError(
  state: PipelineState,
  emit: EventCallback,
  step: string,
  message: string,
): PipelineState {
  state.phase = "error";
  state.error = message;
  emit({ step, status: "error", percent: 0, data: { error: message } });
  return state;
}
