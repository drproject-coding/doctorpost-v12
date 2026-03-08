/**
 * SSE stream API route for single-post pipeline.
 *
 * POST /api/pipeline/stream
 *
 * Request body:
 *   { action, sessionId, keys, selectedTopic?, selectedTemplate?, finalVersion?, userFeedback? }
 *
 * Actions drive the pipeline through phases:
 *   "start"     → Phase 1: Direction (strategist proposes topics)
 *   "discover"  → Phase 2: Discovery (research + refine)
 *   "evidence"  → Phase 3: Evidence gathering
 *   "write"     → Phase 4+5: Writing + Scoring (with rewrite loop)
 *   "format"    → Phase 6: Formatting
 *   "learn"     → Phase 8: Learning (after user review)
 *
 * Each request streams PipelineEvents as SSE, then closes.
 * The client reconstructs pipeline state from events.
 */

import { NextRequest } from "next/server";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";

function safeParseArray(val: string | undefined | null): string[] {
  if (!val) return [];
  try {
    const parsed: unknown = JSON.parse(val);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return val ? [val] : [];
  }
}
import {
  savePipelineSession,
  savePipelineDirections,
  savePipelineClaims,
  savePipelinePatterns,
} from "@/lib/pipeline/savePipelineData";
import { fetchKnowledgeForUser } from "@/lib/knowledge/fetch";
import { getUsedTopics } from "@/lib/agents/getUsedTopics";
import {
  createPipelineState,
  runDirection,
  runDiscovery,
  runEvidence,
  runWriteAndScore,
  runFormat,
  runLearn,
  type PipelineState,
  type EventCallback,
} from "@/lib/agents/orchestrator";
import type { PipelineEvent, TopicProposal } from "@/lib/knowledge/types";

const PHASE_ORDER = [
  "direction",
  "discovery",
  "evidence",
  "writing",
  "scoring",
  "formatting",
  "learning",
] as const;

type PhaseName = (typeof PHASE_ORDER)[number];

interface StreamRequestBody {
  action:
    | "start"
    | "discover"
    | "evidence"
    | "write"
    | "format"
    | "learn"
    | "resume";
  sessionId: string;
  keys: {
    claude: string;
    perplexity?: string;
    reddit?: { clientId: string; clientSecret: string };
  };
  // Phase-specific inputs
  selectedTopic?: TopicProposal;
  selectedTemplate?: string;
  refinedTopic?: TopicProposal;
  evidencePack?: PipelineState["evidencePack"];
  writerOutput?: PipelineState["writerOutput"];
  scoreResult?: PipelineState["scoreResult"];
  formattedPost?: PipelineState["formattedPost"];
  finalVersion?: string;
  userFeedback?: string[];
  /** Session-level tone override */
  toneOverride?: string;
  /** Phase to resume from (used with action === "resume") */
  startPhase?: PhaseName;
}

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: StreamRequestBody;
  try {
    body = (await req.json()) as StreamRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.action || !body.sessionId || !body.keys?.claude) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: action, sessionId, keys.claude",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Fetch profile once (used for key resolution + brand context)
  const profile = await fetchUserProfile(cookie);

  // Resolve __server_resolved__ sentinel keys from user profile
  const resolvedKeys = { ...body.keys };
  if (resolvedKeys.claude === "__server_resolved__") {
    if (profile) {
      // Resolve to appropriate AI provider key based on user's active provider
      const activeProvider = (profile.ai_provider as string) || "claude";

      if (activeProvider === "straico") {
        resolvedKeys.claude = profile.straico_api_key || "";
      } else if (activeProvider === "1forall") {
        resolvedKeys.claude = profile.oneforall_api_key || "";
      } else {
        // Default to Claude/Anthropic
        resolvedKeys.claude = profile.claude_api_key || "";
      }

      if (!resolvedKeys.perplexity && profile.perplexity_api_key) {
        resolvedKeys.perplexity = profile.perplexity_api_key;
      }
      if (!resolvedKeys.reddit && profile.reddit_client_id) {
        resolvedKeys.reddit = {
          clientId: profile.reddit_client_id,
          clientSecret: profile.reddit_client_secret || "",
        };
      }
    }
    if (!resolvedKeys.claude) {
      const activeProvider = (profile?.ai_provider as string) || "claude";
      return new Response(
        JSON.stringify({
          error: `No ${activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)} API key configured. Please add your key in Settings.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Fetch knowledge docs + used headlines (for cross-feature topic dedup)
  const [knowledge, usedHeadlines] = await Promise.all([
    fetchKnowledgeForUser(user.id, cookie),
    getUsedTopics(user.id, cookie),
  ]);
  const brandContext = profile
    ? {
        industry: profile.industry || "",
        audience: safeParseArray(profile.audience),
        tones: safeParseArray(profile.tones),
        contentStrategy: profile.content_strategy || "",
        definition: profile.definition || "",
        copyGuideline: profile.copy_guideline || "",
        lastUpdated: profile.updated_at || undefined,
      }
    : undefined;

  // Resolve provider + model for pipeline
  const activeProvider = ((profile?.ai_provider as string) || "claude") as
    | "claude"
    | "straico"
    | "1forall";
  const providerModel =
    activeProvider === "straico"
      ? (profile?.straico_model as string) || "openai/gpt-4o-mini"
      : activeProvider === "1forall"
        ? (profile?.oneforall_model as string) || "anthropic/claude-4-sonnet"
        : undefined;

  // Build pipeline state from request
  const state = createPipelineState({
    sessionId: body.sessionId,
    knowledge,
    keys: {
      ...resolvedKeys,
      provider: activeProvider,
      providerModel,
    },
    brandContext,
    usedHeadlines,
  });

  // Restore state from client-provided data
  if (body.selectedTopic) state.selectedTopic = body.selectedTopic;
  if (body.refinedTopic) state.refinedTopic = body.refinedTopic;
  if (body.selectedTemplate) state.selectedTemplate = body.selectedTemplate;
  if (body.evidencePack) state.evidencePack = body.evidencePack;
  if (body.writerOutput) state.writerOutput = body.writerOutput;
  if (body.scoreResult) state.scoreResult = body.scoreResult;
  if (body.formattedPost) state.formattedPost = body.formattedPost;
  if (body.finalVersion) state.finalVersion = body.finalVersion;
  if (body.userFeedback) state.userFeedback = body.userFeedback;
  if (body.toneOverride) state.toneOverride = body.toneOverride;

  // SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit: EventCallback = (event: PipelineEvent) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Use AbortSignal from request (client disconnect)
      const signal = req.signal;

      // Emit brand context so client can display it
      if (brandContext) {
        emit({
          step: "pipeline",
          status: "brand-context",
          percent: 0,
          data: { brandContext },
        });
      }

      try {
        switch (body.action) {
          case "start":
            await runDirection(state, emit, signal);
            // Save direction proposals to NCB (fire-and-forget)
            if (state.strategistOutput?.proposals?.length) {
              savePipelineDirections(
                cookie,
                body.sessionId,
                state.strategistOutput.proposals.map((p) => ({
                  headline: p.headline,
                  angle: p.angle,
                  pillar: p.pillar,
                  reasoning: p.reasoning,
                })),
              ).catch((err) => console.error("[savePipelineDirections]", err));
            }
            break;
          case "discover":
            await runDiscovery(state, emit, signal);
            break;
          case "evidence":
            await runEvidence(state, emit, signal);
            // Save evidence claims to NCB (fire-and-forget)
            if (state.evidencePack?.claims?.length) {
              savePipelineClaims(
                cookie,
                body.sessionId,
                state.evidencePack.claims.map((c) => ({
                  claim: c.fact,
                  source: c.source,
                  strength:
                    c.verification === "verified"
                      ? "strong"
                      : c.verification === "estimate"
                        ? "moderate"
                        : "weak",
                  category: c.usageNote || undefined,
                })),
              ).catch((err) => console.error("[savePipelineClaims]", err));
            }
            break;
          case "write":
            await runWriteAndScore(state, emit, signal);
            break;
          case "format":
            await runFormat(state, emit, signal);
            break;
          case "learn":
            await runLearn(state, emit, signal);
            // Save learned patterns to NCB (fire-and-forget)
            if (state.learnerOutput) {
              const patterns: {
                patternType: string;
                value: string;
                effectiveness?: string;
                score?: number;
              }[] = [];
              const lo = state.learnerOutput as unknown as Record<
                string,
                unknown
              >;
              // Extract patterns from learner output structure
              if (Array.isArray(lo.patterns)) {
                for (const p of lo.patterns) {
                  const pat = p as Record<string, unknown>;
                  patterns.push({
                    patternType: String(
                      pat.type || pat.patternType || "general",
                    ),
                    value: String(
                      pat.value || pat.description || JSON.stringify(p),
                    ),
                    effectiveness: String(pat.effectiveness || "medium"),
                    score: Number(pat.score || 0),
                  });
                }
              }
              if (Array.isArray(lo.signals)) {
                for (const s of lo.signals) {
                  const sig = s as Record<string, unknown>;
                  patterns.push({
                    patternType: String(sig.signalType || sig.type || "signal"),
                    value: String(
                      sig.observation || sig.value || JSON.stringify(s),
                    ),
                    effectiveness: "medium",
                  });
                }
              }
              if (patterns.length > 0) {
                savePipelinePatterns(cookie, body.sessionId, patterns).catch(
                  (err) => console.error("[savePipelinePatterns]", err),
                );
              }
            }
            break;
          case "resume": {
            const startPhase = body.startPhase;
            if (!startPhase) {
              emit({
                step: "pipeline",
                status: "error",
                percent: 0,
                data: { error: "resume action requires startPhase" },
              });
              break;
            }

            const startIndex = PHASE_ORDER.indexOf(startPhase);
            if (startIndex === -1) {
              emit({
                step: "pipeline",
                status: "error",
                percent: 0,
                data: {
                  error: `Invalid startPhase: ${startPhase}. Valid values: ${PHASE_ORDER.join(", ")}`,
                },
              });
              break;
            }

            const skippedPhases = PHASE_ORDER.slice(0, startIndex);

            emit({
              step: "pipeline",
              status: "resuming",
              percent: 0,
              data: { startPhase, skippedPhases },
            });

            // Run from startPhase through to the end
            const phasesToRun = PHASE_ORDER.slice(startIndex);

            for (const phase of phasesToRun) {
              // Stop if a phase errored
              if (state.phase === "error") break;

              switch (phase) {
                case "direction":
                  await runDirection(state, emit, signal);
                  break;
                case "discovery":
                  await runDiscovery(state, emit, signal);
                  break;
                case "evidence":
                  await runEvidence(state, emit, signal);
                  break;
                case "writing":
                case "scoring":
                  // writing and scoring are combined in runWriteAndScore
                  // only run once even if both appear in phasesToRun
                  if (phase === "writing") {
                    await runWriteAndScore(state, emit, signal);
                  }
                  break;
                case "formatting":
                  await runFormat(state, emit, signal);
                  break;
                case "learning":
                  await runLearn(state, emit, signal);
                  break;
              }
            }
            break;
          }
        }

        // Persist session to NCB (fire-and-forget, don't block SSE)
        const title =
          state.selectedTopic?.headline ||
          state.selectedTopic?.angle ||
          "Untitled";
        const dbStatus =
          state.phase === "error"
            ? "error"
            : state.phase === "complete"
              ? "complete"
              : "active";
        savePipelineSession(
          cookie,
          body.sessionId,
          title,
          state.phase,
          dbStatus,
          JSON.stringify({
            selectedTopic: state.selectedTopic,
            refinedTopic: state.refinedTopic,
            selectedTemplate: state.selectedTemplate,
            evidencePack: state.evidencePack,
            writerOutput: state.writerOutput,
            scoreResult: state.scoreResult,
            formattedPost: state.formattedPost,
          }),
        ).catch((err) => {
          console.error("[savePipelineSession] Failed:", err);
        });

        // Send final state summary
        emit({
          step: "pipeline",
          status: state.phase === "error" ? "error" : "done",
          percent: 100,
          data: { phase: state.phase, error: state.error },
        });
      } catch (err) {
        emit({
          step: "pipeline",
          status: "error",
          percent: 0,
          data: { error: String(err) },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
