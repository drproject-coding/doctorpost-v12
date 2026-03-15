"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Alert, Button, Card, Icon, Input, Loader } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";
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
import type { LearnerOutput } from "@/lib/agents/learner";

import { PipelineStepper } from "@/components/factory/PipelineStepper";
import { TopicProposals } from "@/components/factory/TopicProposals";
import { ResearchBrief } from "@/components/factory/ResearchBrief";
import { EvidencePack } from "@/components/factory/EvidencePack";
import { DraftEditor } from "@/components/factory/DraftEditor";
import { Scorecard } from "@/components/factory/Scorecard";
import { FormattedOutput } from "@/components/factory/FormattedOutput";
import { PostReview } from "@/components/factory/PostReview";
import { LearningPhaseResult } from "@/components/factory/LearningPhaseResult";
import { SessionHistory } from "@/components/factory/SessionHistory";
import {
  saveSession,
  listSessions,
  type SavedSession,
} from "@/lib/sessionStorage";
import { schedulePost, ensureUserExists } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface PipelineClientState {
  sessionId: string;
  phase: PipelinePhase;
  percent: number;
  error?: string;
  /** Tracks which phase was active when error occurred */
  errorAtPhase?: PipelinePhase;
  /** Track success/failure status for each completed phase */
  phaseStatus?: Record<PipelinePhase, "success" | "failed">;
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
  selectedClaimIndices?: number[];
  learnerOutput?: LearnerOutput;
  finalVersion?: string;
  userFeedback?: string[];
  /** Session-level tone override */
  toneOverride?: string;
  brandContext?: {
    industry: string;
    audience: string[];
    tones: string[];
    contentStrategy: string;
    lastUpdated?: string;
  };
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function truncateSessionId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 10)}...${id.slice(-4)}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function FactoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [state, setState] = useState<PipelineClientState>({
    sessionId: generateSessionId(),
    phase: "idle",
    percent: 0,
    guardrailRetryCount: 0,
    guardrailFixing: false,
    rewriteCount: 0,
  });
  const [running, setRunning] = useState(false);
  const [viewPhase, setViewPhase] = useState<PipelinePhase | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [incompleteSession, setIncompleteSession] =
    useState<SavedSession | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasSavedPost, setHasSavedPost] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // On mount: check localStorage for the most recent incomplete session
  useEffect(() => {
    const sessions = listSessions();
    const recent = sessions.find(
      (s) => s.phase !== "complete" && s.phase !== "idle",
    );
    if (recent) {
      setIncompleteSession(recent);
    }
  }, []);

  // Save post when pipeline completes (once per pipeline run)
  useEffect(() => {
    if (
      state.phase === "complete" &&
      state.formattedPost &&
      state.selectedTopic &&
      !running &&
      !hasSavedPost
    ) {
      const saveCompletedPost = async () => {
        try {
          await ensureUserExists();
          await schedulePost({
            id: "",
            title:
              state.selectedTopic!.headline ||
              state.selectedTopic!.angle ||
              "Untitled Post",
            content: state.formattedPost!.content,
            pillar: state.selectedTopic!.pillar,
            status: "scheduled",
            scheduledAt: new Date().toISOString(),
            userId: user?.id || "",
            factoryScore: state.scoreResult?.totalScore,
          });
          setHasSavedPost(true);
          console.log("[Auto-save] Post saved successfully to library");
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.error("[Auto-save] Failed to save completed post:", errorMsg);
        }
      };
      void saveCompletedPost();
    }
  }, [
    state.phase,
    state.formattedPost,
    state.selectedTopic,
    state.scoreResult,
    running,
    hasSavedPost,
    user?.id,
  ]);

  const handleManualSave = useCallback(async () => {
    if (!state.formattedPost || !state.selectedTopic || !user?.id) {
      showToast("Cannot save: missing post data", "error");
      return;
    }
    if (hasSavedPost) {
      showToast("Post already saved to library", "success");
      return;
    }

    setIsSaving(true);
    try {
      console.log("[handleManualSave] Ensuring user exists in NCB");
      await ensureUserExists();

      console.log("[handleManualSave] Saving post with data:", {
        title:
          state.selectedTopic!.headline ||
          state.selectedTopic!.angle ||
          "Untitled Post",
        pillar: state.selectedTopic!.pillar,
        status: "scheduled",
      });

      await schedulePost({
        id: "",
        title:
          state.selectedTopic!.headline ||
          state.selectedTopic!.angle ||
          "Untitled Post",
        content: state.formattedPost.content,
        pillar: state.selectedTopic!.pillar,
        status: "scheduled",
        scheduledAt: new Date().toISOString(),
        userId: user.id,
        factoryScore: state.scoreResult?.totalScore,
      });
      showToast("Post saved to library successfully!", "success");
      console.log("[handleManualSave] Save completed successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[handleManualSave] Failed to save post:", errorMsg);
      showToast(`Failed to save post: ${errorMsg}`, "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    state.formattedPost,
    state.selectedTopic,
    state.scoreResult,
    hasSavedPost,
    user?.id,
    showToast,
  ]);

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
            toneOverride: snap.toneOverride || undefined,
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
      const phaseStatus = { ...(prev.phaseStatus || {}) } as Record<
        PipelinePhase,
        "success" | "failed"
      >;

      // Map step to phase
      let currentPhase: PipelinePhase | undefined;
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
        currentPhase = phaseMap[event.step];
        next.phase = currentPhase || prev.phase;
      }

      // Track phase success/failure status
      if (event.status === "error") {
        const phase = currentPhase || prev.phase;
        if (phase && phase !== "error") {
          phaseStatus[phase] = "failed";
          next.phaseStatus = phaseStatus;
        }
        // Only set errorAtPhase if it's a valid phase to retry from
        const validPhases = [
          "direction",
          "discovery",
          "evidence",
          "writing",
          "scoring",
          "formatting",
          "learning",
        ];
        next.errorAtPhase =
          prev.phase !== "error" && validPhases.includes(prev.phase as string)
            ? prev.phase
            : prev.errorAtPhase;
        next.phase = "error";
        next.error =
          (event.data as { error?: string })?.error || "Pipeline error";
      }

      // Success overwrites any previous failure - if phase completes, it succeeded
      if (currentPhase && event.status === "done") {
        phaseStatus[currentPhase] = "success";
        next.phaseStatus = phaseStatus;
      }

      // Handle resume: mark skipped phases as success so stepper shows them as completed
      if (
        event.step === "pipeline" &&
        event.status === "resuming" &&
        event.data
      ) {
        const { skippedPhases } = event.data as {
          startPhase: string;
          skippedPhases: string[];
        };
        if (skippedPhases) {
          for (const sp of skippedPhases) {
            phaseStatus[sp as PipelinePhase] = "success";
          }
          next.phaseStatus = phaseStatus;
        }
      }

      // Capture brand context
      if (
        event.step === "pipeline" &&
        event.status === "brand-context" &&
        event.data
      ) {
        next.brandContext = (
          event.data as {
            brandContext: PipelineClientState["brandContext"];
          }
        ).brandContext;
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
      if (event.step === "learning" && event.data && event.status === "done") {
        next.learnerOutput = event.data as LearnerOutput;
        next.phase = "complete";
      }

      return next;
    });
  };

  // Pipeline controls
  const handleStart = () => callPipeline("start");
  const handleDiscover = () => callPipeline("discover");
  const handleEvidence = () => callPipeline("evidence");
  const handleWrite = () => {
    const snap = stateRef.current;
    // If user has selected specific claims, filter the evidence pack
    if (snap.selectedClaimIndices && snap.evidencePack) {
      const selectedClaims = snap.selectedClaimIndices
        .map((i) => snap.evidencePack!.claims[i])
        .filter(Boolean);
      callPipeline("write", {
        evidencePack: {
          ...snap.evidencePack,
          claims: selectedClaims,
        },
      });
    } else {
      callPipeline("write");
    }
  };
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

  // Check if all guardrails are passing
  const allGuardrailsPassing = () => {
    if (!state.guardrailResults || state.guardrailResults.length === 0) {
      return false; // No results yet = not passing
    }
    return state.guardrailResults.every((g) => g.passed);
  };

  const handleGuardrailManualEdit = (editedContent: string) => {
    setState((prev) => ({
      ...prev,
      writerOutput: prev.writerOutput
        ? { ...prev.writerOutput, content: editedContent }
        : undefined,
      formattedPost: undefined, // Clear formatted post - must regenerate from edited draft
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
    setIncompleteSession(null);
    setLastSavedAt(null);
    setHasSavedPost(false);
  };

  /** Map a pipeline phase to the API action needed to retry it */
  const getActionForPhase = (phase: PipelinePhase): string | null => {
    const map: Partial<Record<PipelinePhase, string>> = {
      direction: "start",
      discovery: "discover",
      evidence: "evidence",
      writing: "write",
      scoring: "write", // scoring is part of the write action
      formatting: "format",
      learning: "learn",
    };
    return map[phase] ?? null;
  };

  const PHASE_LABELS: Record<string, string> = {
    direction: "Direction",
    discovery: "Discovery",
    evidence: "Evidence",
    writing: "Writing",
    scoring: "Scoring",
    formatting: "Formatting",
    learning: "Learning",
  };

  const PHASE_ORDER: PipelinePhase[] = [
    "direction",
    "discovery",
    "evidence",
    "writing",
    "scoring",
    "formatting",
    "learning",
  ];

  /** Retry from the phase that errored */
  const handleRetryFromPhase = (phase: PipelinePhase) => {
    const action = getActionForPhase(phase);
    if (!action) return;
    // Clear error state, set phase back so UI shows correctly
    setState((prev) => ({
      ...prev,
      phase: phase,
      error: undefined,
      errorAtPhase: undefined,
      percent: 0,
    }));
    callPipeline(action);
  };

  /** Resume from a specific earlier phase (re-run from that point) */
  const handleResumeFromPhase = (phase: PipelinePhase) => {
    const action = getActionForPhase(phase);
    if (!action) return;
    setState((prev) => ({
      ...prev,
      phase: phase,
      error: undefined,
      errorAtPhase: undefined,
      percent: 0,
    }));
    callPipeline(action);
  };

  // Template selection for write phase
  const [templateInput, setTemplateInput] = useState("");
  // Tone override for this session
  const [toneInput, setToneInput] = useState("");

  // Auto-save session after phase transitions
  useEffect(() => {
    if (state.phase !== "idle" && state.phase !== "error") {
      const title =
        state.selectedTopic?.headline ||
        state.selectedTopic?.angle ||
        "Untitled";
      saveSession(state.sessionId, title, state.phase, JSON.stringify(state));
      setLastSavedAt(new Date().toISOString());
    }
  }, [state.phase, state.sessionId, state.selectedTopic]);

  const handleResumeSession = (stateJson: string) => {
    try {
      const restored = JSON.parse(stateJson) as PipelineClientState;
      // Determine the start phase for resume
      let startPhase: PipelinePhase;

      if (restored.phase === "complete") {
        // Completed sessions must be viewed via handleViewCompletedSession, not resumed
        console.warn(
          "[handleResumeSession] Called with a complete session — use handleViewCompletedSession instead",
        );
        return;
      } else if (restored.phase === "error" && restored.errorAtPhase) {
        // If errored, retry from the failed phase
        startPhase = restored.errorAtPhase;
        restored.phase = restored.errorAtPhase;
        restored.error = undefined;
        restored.errorAtPhase = undefined;
      } else {
        // If paused successfully, resume from the next phase
        const currentIdx = PHASE_ORDER.indexOf(restored.phase as PipelinePhase);
        const nextPhase =
          currentIdx >= 0 && currentIdx < PHASE_ORDER.length - 1
            ? PHASE_ORDER[currentIdx + 1]
            : PHASE_ORDER[0]; // Default to first phase if invalid
        startPhase = nextPhase;
      }
      setState(restored);
      setViewPhase(undefined);
      setIncompleteSession(null);
      // Trigger pipeline resume after state settles
      setTimeout(() => callPipeline("resume", { startPhase }), 100);
    } catch {
      // Invalid session data, ignore
    }
  };

  /** Restore a completed session for read-only viewing — never relaunches the pipeline */
  const handleViewCompletedSession = (stateJson: string) => {
    try {
      const restored = JSON.parse(stateJson) as PipelineClientState;
      if (restored.phase !== "complete") return;
      setState(restored);
      setViewPhase(undefined);
      setIncompleteSession(null);
      // No callPipeline — completed sessions are locked
    } catch {
      // Invalid session data, ignore
    }
  };

  /** Resume session and immediately retry the failed phase */
  const handleRetryFromSession = (stateJson: string, phase: string) => {
    try {
      const restored = JSON.parse(stateJson) as PipelineClientState;
      // Clear error, set phase back
      const startPhase = phase as PipelinePhase;
      restored.phase = startPhase;
      restored.error = undefined;
      restored.errorAtPhase = undefined;
      setState(restored);
      setViewPhase(undefined);
      // Use action: "resume" with startPhase to let state settle before calling pipeline
      setTimeout(() => callPipeline("resume", { startPhase }), 100);
    } catch {
      // Invalid session data, ignore
    }
  };

  // If user is viewing a past phase, show that phase's section read-only
  const isViewingPast = viewPhase !== undefined && viewPhase !== state.phase;
  const showPhase = (phase: PipelinePhase) =>
    isViewingPast ? viewPhase === phase : undefined; // undefined = use normal logic

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "var(--drp-space-6)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--drp-text-h3)",
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
                  contentPillar: state.selectedTopic!.pillar,
                  tone: state.selectedTopic.angle,
                  phaseStatus: state.phaseStatus,
                  brandContext: state.brandContext,
                }
              : state.brandContext
                ? {
                    brandContext: state.brandContext,
                    phaseStatus: state.phaseStatus,
                  }
                : state.phaseStatus
                  ? { phaseStatus: state.phaseStatus }
                  : undefined
          }
          viewPhase={viewPhase}
          onPhaseClick={(phase) => {
            // If clicking current phase, clear viewPhase
            if (phase === state.phase) {
              setViewPhase(undefined);
            } else {
              setViewPhase(phase);
            }
          }}
          onRetryPhase={(phase) => {
            // Clear view mode and retry the phase
            setViewPhase(undefined);
            handleRetryFromPhase(phase);
          }}
        />
      )}

      {/* Session Status Bar — shown when a session is active */}
      {state.phase !== "idle" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-3)",
            padding: "var(--drp-space-2) var(--drp-space-3)",
            marginBottom: "var(--drp-space-4)",
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.08)",
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
          }}
        >
          <span>
            Session:{" "}
            <code style={{ fontFamily: "monospace" }}>
              {truncateSessionId(state.sessionId)}
            </code>
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>
            Phase:{" "}
            <strong style={{ color: "var(--drp-black)" }}>
              {PHASE_LABELS[state.phase] || state.phase}
            </strong>
          </span>
          {lastSavedAt && (
            <>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>Saved {formatTimestamp(lastSavedAt)}</span>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {state.phase === "error" && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <Alert variant="error" title={state.error || "An error occurred"}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-2)",
                flexWrap: "wrap",
                marginTop: "var(--drp-space-2)",
              }}
            >
              {state.errorAtPhase && (
                <span
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                    flex: 1,
                  }}
                >
                  Failed at:{" "}
                  {PHASE_LABELS[state.errorAtPhase] || state.errorAtPhase}
                </span>
              )}
              {state.errorAtPhase && getActionForPhase(state.errorAtPhase) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryFromPhase(state.errorAtPhase!)}
                  disabled={running}
                >
                  ↺ Retry{" "}
                  {PHASE_LABELS[state.errorAtPhase] || state.errorAtPhase}
                </Button>
              )}
              <Button size="sm" onClick={handleNewPost}>
                Start Over
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Paused/Resumed indicator with Continue button */}
      {!running &&
        state.phase !== "idle" &&
        state.phase !== "error" &&
        state.phase !== "complete" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-3)",
              marginBottom: "var(--drp-space-4)",
              padding: "var(--drp-space-3)",
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-black)",
              }}
            >
              Paused at{" "}
              <strong>{PHASE_LABELS[state.phase] || state.phase}</strong> —
              Click to continue
            </div>
            <Button
              variant="primary"
              onClick={() => handleRetryFromPhase(state.phase as PipelinePhase)}
              disabled={running}
            >
              <Icon name="arrow-right" size="sm" />
              Continue
            </Button>
          </div>
        )}

      {/* Loading indicator */}
      {running && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <Loader
            size="sm"
            label={
              state.phase && PHASE_ORDER.includes(state.phase as PipelinePhase)
                ? `Processing ${PHASE_LABELS[state.phase] || state.phase} (step ${PHASE_ORDER.indexOf(state.phase as PipelinePhase) + 1}/7)...`
                : "Processing..."
            }
          />
        </div>
      )}

      {/* Auto-resume prompt — shown when page loads with an incomplete session */}
      {state.phase === "idle" && !running && incompleteSession && (
        <Card
          variant="raised"
          style={{
            marginBottom: "var(--drp-space-4)",
            borderLeft: "4px solid var(--drp-purple)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--drp-space-3)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "var(--drp-text-md)",
                  marginBottom: "var(--drp-space-1)",
                }}
              >
                You have an incomplete session
              </div>
              <div
                style={{
                  fontSize: "var(--drp-text-sm)",
                  color: "var(--drp-grey)",
                  marginBottom: "var(--drp-space-3)",
                }}
              >
                Last phase:{" "}
                <strong>
                  {PHASE_LABELS[incompleteSession.phase] ||
                    incompleteSession.phase}
                </strong>
                {incompleteSession.title &&
                incompleteSession.title !== "Untitled"
                  ? ` — "${incompleteSession.title}"`
                  : ""}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "var(--drp-space-2)",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="primary"
                  onClick={() =>
                    handleResumeSession(incompleteSession.stateJson)
                  }
                >
                  ▶ Resume from{" "}
                  {PHASE_LABELS[incompleteSession.phase] ||
                    incompleteSession.phase}
                </Button>
                <Button onClick={handleNewPost}>Start Fresh</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Session History (shown on idle when no incomplete session prompt) */}
      {state.phase === "idle" && !running && !incompleteSession && (
        <SessionHistory
          onResume={handleResumeSession}
          onView={handleViewCompletedSession}
          onRetryFromPhase={handleRetryFromSession}
        />
      )}

      {/* IDLE — Start */}
      {state.phase === "idle" && !running && (
        <Card
          variant="raised"
          style={{ textAlign: "center", padding: "var(--drp-space-8)" }}
        >
          <h2
            style={{
              fontSize: "var(--drp-text-h4)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-3)",
            }}
          >
            Create a New Post
          </h2>
          <p
            style={{
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-grey)",
              marginBottom: "var(--drp-space-6)",
              maxWidth: 500,
              margin: "0 auto var(--drp-space-6)",
            }}
          >
            The Content Factory will guide you through an 8-phase AI pipeline:
            topic proposals, research, evidence, writing, scoring, formatting,
            review, and learning.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--drp-space-2)",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div title="Override your brand tones for this session only. E.g., 'casual', 'humorous', 'celebratory'. Your brand profile remains unchanged.">
              <Input
                placeholder="Tone override (optional)"
                value={toneInput}
                onChange={(e) => {
                  setToneInput(e.target.value);
                  setState((prev) => ({
                    ...prev,
                    toneOverride: e.target.value || undefined,
                  }));
                }}
                style={{ width: 200 }}
              />
            </div>
            <Button variant="primary" onClick={handleStart} disabled={running}>
              ▶ Start Pipeline
            </Button>
          </div>
        </Card>
      )}

      {/* DIRECTION — Topic Proposals */}
      {state.strategistOutput &&
        (showPhase("direction") ??
          (state.phase === "direction" ||
            (!running && !state.discoveryBrief && state.selectedTopic))) && (
          <div>
            <TopicProposals
              output={state.strategistOutput}
              onSelect={handleTopicSelect}
              selectedTopic={state.selectedTopic}
            />
            {state.selectedTopic && !running && (
              <div
                style={{
                  marginTop: "var(--drp-space-4)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="primary" onClick={handleDiscover}>
                  <Icon name="arrow-right" size="sm" />
                  Research This Topic
                </Button>
              </div>
            )}
          </div>
        )}

      {/* DISCOVERY — Research Brief */}
      {state.discoveryBrief &&
        (showPhase("discovery") ??
          (state.phase === "discovery" || state.phase === "evidence")) && (
          <div>
            <ResearchBrief
              brief={state.discoveryBrief}
              refinedTopic={state.refinedTopic}
            />
            {!running && state.phase === "discovery" && (
              <div
                style={{
                  marginTop: "var(--drp-space-4)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="primary" onClick={handleEvidence}>
                  <Icon name="arrow-right" size="sm" />
                  Gather Evidence
                </Button>
              </div>
            )}
          </div>
        )}

      {/* EVIDENCE — Evidence Pack */}
      {state.evidencePack &&
        (showPhase("evidence") ??
          (state.phase === "evidence" || state.phase === "writing")) && (
          <div>
            <EvidencePack
              evidence={state.evidencePack}
              onSelectionChange={(indices) =>
                setState((prev) => ({ ...prev, selectedClaimIndices: indices }))
              }
            />
            {!running && state.phase === "evidence" && (
              <div
                style={{
                  marginTop: "var(--drp-space-4)",
                  display: "flex",
                  gap: "var(--drp-space-2)",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Input
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
                  <Icon name="arrow-right" size="sm" />
                  Write Draft
                </Button>
              </div>
            )}
          </div>
        )}

      {/* WRITING + SCORING — Draft + Scorecard */}
      {state.writerOutput &&
        (!isViewingPast ||
          viewPhase === "writing" ||
          viewPhase === "scoring") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: state.scoreResult
                ? "minmax(0, 1fr) minmax(0, 1fr)"
                : "1fr",
              gap: "var(--drp-space-4)",
              overflowX: "hidden",
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
            {state.scoreResult && (
              <Scorecard
                score={state.scoreResult}
                onApplyFix={(instructions) => {
                  callPipeline("write", {
                    userFeedback: [
                      `Rewrite based on scorer instructions: ${instructions}. Maintain voice and angle.`,
                    ],
                  });
                }}
                isApplying={running}
                rewriteCount={state.rewriteCount}
              />
            )}
          </div>
        )}

      {/* After scoring — proceed to format ONLY if all guardrails pass */}
      {state.scoreResult &&
        !state.formattedPost &&
        !running &&
        (state.phase === "scoring" || state.phase === "writing") && (
          <div style={{ marginTop: "var(--drp-space-4)" }}>
            {!allGuardrailsPassing() && (
              <div style={{ marginBottom: "var(--drp-space-2)" }}>
                <Alert
                  variant="warning"
                  title="Fix failing guardrails before formatting"
                >
                  {""}
                </Alert>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="primary"
                onClick={handleFormat}
                disabled={!allGuardrailsPassing()}
              >
                <Icon name="arrow-right" size="sm" />
                Format for LinkedIn
              </Button>
            </div>
          </div>
        )}

      {/* FORMATTING — Formatted Output */}
      {state.formattedPost &&
        (!isViewingPast || viewPhase === "formatting") && (
          <div style={{ marginTop: "var(--drp-space-4)" }}>
            <FormattedOutput
              post={state.formattedPost}
              onSave={handleManualSave}
              isSaving={isSaving}
            />
          </div>
        )}

      {/* REVIEW — Post Review */}
      {state.formattedPost &&
        !running &&
        !isViewingPast &&
        state.phase !== "learning" &&
        state.phase !== "complete" && (
          <div style={{ marginTop: "var(--drp-space-4)" }}>
            <PostReview
              content={state.formattedPost.content}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

      {/* LEARNING RESULTS + COMPLETE */}
      {state.phase === "complete" && (
        <div style={{ marginTop: "var(--drp-space-4)" }}>
          {state.learnerOutput && (
            <LearningPhaseResult output={state.learnerOutput} />
          )}
          <Card
            variant="raised"
            style={{
              textAlign: "center",
              padding: "var(--drp-space-8)",
              marginTop: "var(--drp-space-4)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--drp-text-h4)",
                fontWeight: 700,
                marginBottom: "var(--drp-space-3)",
              }}
            >
              Post Complete
            </h2>
            <p
              style={{
                fontSize: "var(--drp-text-md)",
                color: "var(--drp-grey)",
                marginBottom: "var(--drp-space-4)",
              }}
            >
              Your post has been approved and learning signals captured.
            </p>
            <Button variant="primary" onClick={handleNewPost}>
              Create Another Post
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
