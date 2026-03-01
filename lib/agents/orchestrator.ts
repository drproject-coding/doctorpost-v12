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

const MAX_REWRITES = 3;
const REWRITE_THRESHOLD = 75;

// ── Pipeline Runner ──

export function createPipelineState(params: {
  sessionId: string;
  knowledge: KnowledgeDocument[];
  keys: PipelineState["keys"];
  recentPosts?: PipelineState["recentPosts"];
}): PipelineState {
  return {
    phase: "idle",
    sessionId: params.sessionId,
    knowledge: params.knowledge,
    keys: params.keys,
    recentPosts: params.recentPosts,
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
    state.error = String(err);
    emit({ step: "direction", status: "error", percent: 0 });
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
      signal,
    });
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
    state.error = String(err);
    emit({ step: "discovery", status: "error", percent: 0 });
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
    state.error = String(err);
    emit({ step: "evidence", status: "error", percent: 0 });
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
  if (!state.selectedTemplate) throw new Error("No template selected");

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
    state.error = String(err);
    emit({ step: "writing", status: "error", percent: 0 });
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
    state.error = String(err);
    emit({ step: "formatting", status: "error", percent: 0 });
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
    state.error = String(err);
    emit({ step: "learning", status: "error", percent: 0 });
    return state;
  }
}
