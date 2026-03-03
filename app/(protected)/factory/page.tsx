"use client";
import React, { useState, useCallback, useRef } from "react";
import { Button, Card } from "@bruddle/react";
import { useAuth } from "@/lib/auth-context";
import { Loader, Play, ArrowRight } from "lucide-react";
import type { PipelinePhase } from "@/lib/agents/orchestrator";
import type {
  TopicProposal,
  DiscoveryBrief,
  EvidencePack as EvidencePackType,
  ScoreResult,
  FormattedPost,
  PipelineEvent,
  GuardrailResult,
} from "@/lib/knowledge/types";
import type { StrategistOutput } from "@/lib/agents/strategist";
import type { WriterOutput } from "@/lib/agents/writer";

import { PipelineStepper } from "@/components/factory/PipelineStepper";
import { TopicProposals } from "@/components/factory/TopicProposals";
import { ResearchBrief } from "@/components/factory/ResearchBrief";
import { EvidencePack } from "@/components/factory/EvidencePack";
import { DraftEditor } from "@/components/factory/DraftEditor";
import { Scorecard } from "@/components/factory/Scorecard";
import { FormattedOutput } from "@/components/factory/FormattedOutput";
import { PostReview } from "@/components/factory/PostReview";

interface PipelineClientState {
  sessionId: string;
  phase: PipelinePhase;
  percent: number;
  error?: string;
  /** Tracks which phase was active when error occurred */
  errorAtPhase?: PipelinePhase;
  // Phase outputs
  strategistOutput?: StrategistOutput;
  selectedTopic?: TopicProposal;
  discoveryBrief?: DiscoveryBrief;
  refinedTopic?: TopicProposal;
  evidencePack?: EvidencePackType;
  selectedTemplate?: string;
  writerOutput?: WriterOutput;
  scoreResult?: ScoreResult;
  formattedPost?: FormattedPost;
  guardrailResults?: GuardrailResult[];
  guardrailRetryCount: number;
  guardrailFixing: boolean;
  rewriteCount: number;
  finalVersion?: string;
  userFeedback?: string[];
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function FactoryPage() {
  const { user } = useAuth();
  const [state, setState] = useState<PipelineClientState>({
    sessionId: generateSessionId(),
    phase: "idle",
    percent: 0,
    guardrailRetryCount: 0,
    guardrailFixing: false,
    rewriteCount: 0,
  });
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const callPipeline = useCallback(
    async (action: string, extraBody: Record<string, unknown> = {}) => {
      setRunning(true);
      abortRef.current = new AbortController();
      const snap = stateRef.current;

      try {
        const res = await fetch("/api/pipeline/stream", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            sessionId: snap.sessionId,
            keys: {
              claude: "__server_resolved__", // Key resolved server-side
            },
            selectedTopic: snap.selectedTopic,
            refinedTopic: snap.refinedTopic,
            selectedTemplate: snap.selectedTemplate,
            evidencePack: snap.evidencePack,
            writerOutput: snap.writerOutput,
            scoreResult: snap.scoreResult,
            formattedPost: snap.formattedPost,
            finalVersion: snap.finalVersion,
            userFeedback: snap.userFeedback,
            ...extraBody,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          let errorMsg = `Pipeline request failed (${res.status})`;
          try {
            const err = await res.json();
            errorMsg = err.error || errorMsg;
          } catch {
            // Response wasn't JSON, use status text
          }
          setState((prev) => ({
            ...prev,
            phase: "error",
            error: errorMsg,
          }));
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            try {
              const event: PipelineEvent = JSON.parse(json);
              handleEvent(event);
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            phase: "error",
            error: String(err),
          }));
        }
      } finally {
        setRunning(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads from stateRef.current
    [],
  );

  const handleEvent = (event: PipelineEvent) => {
    setState((prev) => {
      const next = { ...prev, percent: event.percent };

      // Map step to phase
      if (event.step !== "pipeline" && event.step !== "guardrails") {
        const phaseMap: Record<string, PipelinePhase> = {
          direction: "direction",
          "discovery-research": "discovery",
          "discovery-refine": "discovery",
          discovery: "discovery",
          evidence: "evidence",
          writing: "writing",
          scoring: "scoring",
          formatting: "formatting",
          learning: "learning",
        };
        next.phase = phaseMap[event.step] || prev.phase;
      }

      if (event.status === "error") {
        next.errorAtPhase =
          prev.phase !== "error" ? prev.phase : prev.errorAtPhase;
        next.phase = "error";
        next.error =
          (event.data as { error?: string })?.error || "Pipeline error";
      }

      // Capture phase outputs
      if (event.step === "direction" && event.data) {
        next.strategistOutput = event.data as StrategistOutput;
      }
      if (event.step === "discovery" && event.data) {
        const data = event.data as {
          discoveryBrief?: DiscoveryBrief;
          refinedTopic?: TopicProposal;
        };
        if (data.discoveryBrief) next.discoveryBrief = data.discoveryBrief;
        if (data.refinedTopic) next.refinedTopic = data.refinedTopic;
      }
      if (event.step === "discovery-research" && event.data) {
        next.discoveryBrief = event.data as DiscoveryBrief;
      }
      if (event.step === "evidence" && event.data) {
        next.evidencePack = event.data as EvidencePackType;
      }
      if (event.step === "writing" && event.data) {
        const data = event.data as WriterOutput & {
          rewriteAttempt?: number;
        };
        if (data.content) next.writerOutput = data;
        if (data.rewriteAttempt) next.rewriteCount = data.rewriteAttempt - 1;
      }
      if (event.step === "guardrails" && event.guardrailResults) {
        next.guardrailResults = event.guardrailResults;
        next.guardrailFixing = false;
      }
      if (event.step === "scoring" && event.data) {
        next.scoreResult = event.data as ScoreResult;
      }
      if (event.step === "formatting" && event.data) {
        next.formattedPost = event.data as FormattedPost;
      }

      return next;
    });
  };

  // Pipeline controls
  const handleStart = () => callPipeline("start");
  const handleDiscover = () => callPipeline("discover");
  const handleEvidence = () => callPipeline("evidence");
  const handleWrite = () => callPipeline("write");
  const handleFormat = () => callPipeline("format");
  const handleLearn = (finalVersion: string, feedback: string[]) => {
    setState((prev) => ({
      ...prev,
      finalVersion: finalVersion,
      userFeedback: feedback,
    }));
    callPipeline("learn", { finalVersion, userFeedback: feedback });
  };

  const handleTopicSelect = (topic: TopicProposal) => {
    setState((prev) => ({ ...prev, selectedTopic: topic }));
  };

  const handleApprove = (finalVersion: string, feedback: string[]) => {
    handleLearn(finalVersion, feedback);
  };

  const handleReject = (feedback: string[]) => {
    setState((prev) => ({
      ...prev,
      userFeedback: feedback,
      phase: "idle",
      percent: 0,
    }));
  };

  const handleGuardrailManualEdit = (editedContent: string) => {
    setState((prev) => ({
      ...prev,
      writerOutput: prev.writerOutput
        ? { ...prev.writerOutput, content: editedContent }
        : undefined,
    }));
    // Re-run write phase with edited content to re-check guardrails
    callPipeline("write", {
      writerOutput: {
        ...stateRef.current.writerOutput,
        content: editedContent,
      },
    });
  };

  const handleGuardrailAiFix = (failedRules: GuardrailResult[]) => {
    setState((prev) => ({
      ...prev,
      guardrailFixing: true,
      guardrailRetryCount: prev.guardrailRetryCount + 1,
    }));
    const fixInstruction = failedRules
      .map((r) => `Fix: ${r.rule}${r.detail ? ` (${r.detail})` : ""}`)
      .join(". ");
    callPipeline("write", {
      userFeedback: [
        `Rewrite to fix guardrail failures: ${fixInstruction}. Maintain voice and angle.`,
      ],
    });
  };

  const handleNewPost = () => {
    setState({
      sessionId: generateSessionId(),
      phase: "idle",
      percent: 0,
      guardrailRetryCount: 0,
      guardrailFixing: false,
      rewriteCount: 0,
    });
  };

  // Template selection for write phase
  const [templateInput, setTemplateInput] = useState("");

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--bru-text-h3)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Content Factory
        </h1>
        {state.phase !== "idle" && (
          <Button onClick={handleNewPost}>New Post</Button>
        )}
      </div>

      {/* Stepper */}
      {state.phase !== "idle" && (
        <PipelineStepper
          currentPhase={state.phase}
          percent={state.percent}
          errorAtPhase={state.errorAtPhase}
          metadata={
            state.selectedTopic
              ? {
                  postType: state.selectedTopic.templateRecommendation,
                  hookPattern: state.selectedTopic.hookCategoryRecommendation,
                  contentPillar: state.selectedTopic.pillar,
                  tone: state.selectedTopic.angle,
                }
              : undefined
          }
        />
      )}

      {/* Error */}
      {state.phase === "error" && (
        <div
          className="bru-alert bru-alert--error"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <span className="bru-alert__icon">!</span>
          <div className="bru-alert__content">
            <div className="bru-alert__text">
              {state.error || "An error occurred"}
            </div>
          </div>
          <Button
            style={{ marginLeft: "var(--bru-space-3)", flexShrink: 0 }}
            onClick={handleNewPost}
          >
            Start Over
          </Button>
        </div>
      )}

      {/* Loading indicator */}
      {running && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
            marginBottom: "var(--bru-space-4)",
            color: "var(--bru-grey)",
            fontSize: "var(--bru-text-sm)",
          }}
        >
          <Loader size={16} className="animate-spin" />
          Processing...
        </div>
      )}

      {/* IDLE — Start */}
      {state.phase === "idle" && !running && (
        <Card
          variant="raised"
          style={{ textAlign: "center", padding: "var(--bru-space-8)" }}
        >
          <h2
            style={{
              fontSize: "var(--bru-text-h4)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-3)",
            }}
          >
            Create a New Post
          </h2>
          <p
            style={{
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-grey)",
              marginBottom: "var(--bru-space-6)",
              maxWidth: 500,
              margin: "0 auto var(--bru-space-6)",
            }}
          >
            The Content Factory will guide you through an 8-phase AI pipeline:
            topic proposals, research, evidence, writing, scoring, formatting,
            review, and learning.
          </p>
          <Button variant="primary" onClick={handleStart} disabled={running}>
            <Play size={14} />
            Start Pipeline
          </Button>
        </Card>
      )}

      {/* DIRECTION — Topic Proposals */}
      {state.strategistOutput &&
        (state.phase === "direction" ||
          (!running && !state.discoveryBrief && state.selectedTopic)) && (
          <div>
            <TopicProposals
              output={state.strategistOutput}
              onSelect={handleTopicSelect}
              selectedTopic={state.selectedTopic}
            />
            {state.selectedTopic && !running && state.phase === "direction" && (
              <div
                style={{
                  marginTop: "var(--bru-space-4)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="primary" onClick={handleDiscover}>
                  <ArrowRight size={14} />
                  Research This Topic
                </Button>
              </div>
            )}
          </div>
        )}

      {/* DISCOVERY — Research Brief */}
      {state.discoveryBrief &&
        (state.phase === "discovery" || state.phase === "evidence") && (
          <div>
            <ResearchBrief
              brief={state.discoveryBrief}
              refinedTopic={state.refinedTopic}
            />
            {!running && state.phase === "discovery" && (
              <div
                style={{
                  marginTop: "var(--bru-space-4)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="primary" onClick={handleEvidence}>
                  <ArrowRight size={14} />
                  Gather Evidence
                </Button>
              </div>
            )}
          </div>
        )}

      {/* EVIDENCE — Evidence Pack */}
      {state.evidencePack &&
        (state.phase === "evidence" || state.phase === "writing") && (
          <div>
            <EvidencePack evidence={state.evidencePack} />
            {!running && state.phase === "evidence" && (
              <div
                style={{
                  marginTop: "var(--bru-space-4)",
                  display: "flex",
                  gap: "var(--bru-space-2)",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <input
                  className="bru-input"
                  placeholder="Template name (optional)"
                  value={templateInput}
                  onChange={(e) => {
                    setTemplateInput(e.target.value);
                    setState((prev) => ({
                      ...prev,
                      selectedTemplate: e.target.value,
                    }));
                  }}
                  style={{ width: 200 }}
                />
                <Button variant="primary" onClick={handleWrite}>
                  <ArrowRight size={14} />
                  Write Draft
                </Button>
              </div>
            )}
          </div>
        )}

      {/* WRITING + SCORING — Draft + Scorecard */}
      {state.writerOutput && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: state.scoreResult ? "1fr 1fr" : "1fr",
            gap: "var(--bru-space-4)",
          }}
        >
          <DraftEditor
            writerOutput={state.writerOutput}
            guardrailResults={state.guardrailResults}
            rewriteCount={state.rewriteCount}
            onManualEdit={handleGuardrailManualEdit}
            onAiFix={handleGuardrailAiFix}
            isFixing={state.guardrailFixing}
            guardrailRetryCount={state.guardrailRetryCount}
          />
          {state.scoreResult && <Scorecard score={state.scoreResult} />}
        </div>
      )}

      {/* After scoring — proceed to format */}
      {state.scoreResult &&
        !state.formattedPost &&
        !running &&
        (state.phase === "scoring" || state.phase === "writing") && (
          <div
            style={{
              marginTop: "var(--bru-space-4)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="primary" onClick={handleFormat}>
              <ArrowRight size={14} />
              Format for LinkedIn
            </Button>
          </div>
        )}

      {/* FORMATTING — Formatted Output */}
      {state.formattedPost && (
        <div style={{ marginTop: "var(--bru-space-4)" }}>
          <FormattedOutput post={state.formattedPost} />
        </div>
      )}

      {/* REVIEW — Post Review */}
      {state.formattedPost &&
        !running &&
        state.phase !== "learning" &&
        state.phase !== "complete" && (
          <div style={{ marginTop: "var(--bru-space-4)" }}>
            <PostReview
              content={state.formattedPost.content}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

      {/* COMPLETE */}
      {state.phase === "complete" && (
        <Card
          variant="raised"
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            marginTop: "var(--bru-space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--bru-text-h4)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-3)",
            }}
          >
            Post Complete
          </h2>
          <p
            style={{
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-grey)",
              marginBottom: "var(--bru-space-4)",
            }}
          >
            Your post has been approved and learning signals captured.
          </p>
          <Button variant="primary" onClick={handleNewPost}>
            Create Another Post
          </Button>
        </Card>
      )}
    </div>
  );
}
