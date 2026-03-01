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
import { fetchKnowledgeForUser } from "@/lib/knowledge/fetch";
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

interface StreamRequestBody {
  action: "start" | "discover" | "evidence" | "write" | "format" | "learn";
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

  // Resolve __server_resolved__ sentinel keys from user profile
  const resolvedKeys = { ...body.keys };
  if (resolvedKeys.claude === "__server_resolved__") {
    const profile = await fetchUserProfile(cookie);
    if (profile) {
      resolvedKeys.claude = profile.claude_api_key || "";
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
      return new Response(
        JSON.stringify({
          error:
            "No Claude API key configured. Please add your key in Settings.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Fetch knowledge docs
  const knowledge = await fetchKnowledgeForUser(user.id, cookie);

  // Build pipeline state from request
  const state = createPipelineState({
    sessionId: body.sessionId,
    knowledge,
    keys: resolvedKeys,
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

      try {
        switch (body.action) {
          case "start":
            await runDirection(state, emit, signal);
            break;
          case "discover":
            await runDiscovery(state, emit, signal);
            break;
          case "evidence":
            await runEvidence(state, emit, signal);
            break;
          case "write":
            await runWriteAndScore(state, emit, signal);
            break;
          case "format":
            await runFormat(state, emit, signal);
            break;
          case "learn":
            await runLearn(state, emit, signal);
            break;
        }

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
