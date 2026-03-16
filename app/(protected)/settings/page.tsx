"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Heading,
  Icon,
  Input,
  Loader as BruLoader,
  Text,
} from "@doctorproject/react";
import { getBrandProfile, updateBrandProfile } from "@/lib/api";
import {
  BrandProfile,
  AiProviderType,
  AiModel,
  StraicoUserInfo,
} from "@/lib/types";
import { validateClaudeKey } from "@/lib/ai/claudeService";
import {
  validateStraicoKey,
  fetchStraicoUserInfo,
} from "@/lib/ai/straicoService";
import { validateOneForAllKey } from "@/lib/ai/oneforallService";
import { fetchModels, fetchImageModels } from "@/lib/ai/modelService";
import {
  ONEFORALL_MODELS,
  STRAICO_MODELS,
  ONEFORALL_IMAGE_MODELS,
} from "@/lib/ai/constants";
import { StraicoModelPicker } from "@/components/settings/StraicoModelPicker";
import { useAuth } from "@/lib/auth-context";

type ValidationState =
  | { state: "idle" }
  | { state: "validating" }
  | { state: "valid" }
  | { state: "error"; message: string };

function ValidationBadge({ status }: { status: ValidationState }) {
  if (status.state === "idle") return null;
  if (status.state === "validating") {
    return (
      <Badge variant="outline">
        <BruLoader size="sm" /> Verifying...
      </Badge>
    );
  }
  if (status.state === "valid") {
    return <Badge variant="mint">✓ Verified</Badge>;
  }
  // error state:
  return <Badge variant="pink">{status.message ?? "Invalid"}</Badge>;
}

function StatusBadge({
  connected,
  label,
}: {
  connected: boolean;
  label?: string;
}) {
  return (
    <Badge variant={connected ? "mint" : "outline"}>
      {connected ? (
        <Icon name="check" size="sm" />
      ) : (
        <Icon name="close" size="sm" />
      )}
      {label || (connected ? "Connected" : "Not connected")}
    </Badge>
  );
}

type TestState =
  | { state: "idle" }
  | { state: "loading"; testType: "text" | "image" }
  | { state: "success"; testType: "text"; text: string }
  | { state: "success"; testType: "image"; imageUrl: string }
  | { state: "error"; testType: "text" | "image"; message: string };

function TestResultBlock({ test }: { test: TestState }) {
  if (test.state === "idle") return null;
  if (test.state === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--drp-grey)",
          padding: "8px 0",
        }}
      >
        <BruLoader size="sm" />
        {test.testType === "text"
          ? "Generating text..."
          : "Generating image (may take ~30s)..."}
      </div>
    );
  }
  if (test.state === "error") {
    return (
      <div
        style={{
          background: "rgba(220, 38, 38, 0.06)",
          border: "1px solid rgba(220, 38, 38, 0.2)",
          padding: "8px 12px",
          fontSize: 12,
          color: "var(--drp-error, #dc2626)",
        }}
      >
        {test.message}
      </div>
    );
  }
  if (test.state === "success" && test.testType === "text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            background: "rgba(22, 163, 74, 0.06)",
            border: "1px solid rgba(22, 163, 74, 0.2)",
            padding: "6px 12px",
            fontSize: 12,
            color: "var(--drp-success-dark, #166534)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="check" size="sm" />
          Text model working correctly!
        </div>
        <div
          style={{
            background: "var(--drp-bg-2, #f5f5f5)",
            border: "1px solid rgba(0,0,0,0.1)",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--drp-text, #111)",
            fontStyle: "italic",
          }}
        >
          &ldquo;{test.text}&rdquo;
        </div>
      </div>
    );
  }
  if (test.state === "success" && test.testType === "image") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            background: "rgba(22, 163, 74, 0.06)",
            border: "1px solid rgba(22, 163, 74, 0.2)",
            padding: "6px 12px",
            fontSize: 12,
            color: "var(--drp-success-dark, #166534)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="check" size="sm" />
          Image model working correctly!
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={test.imageUrl}
          alt="Model test output"
          style={{ maxWidth: 200, border: "1px solid rgba(0,0,0,0.1)" }}
        />
      </div>
    );
  }
  return null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [activeProvider, setActiveProvider] =
    useState<AiProviderType>("claude");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [straicoApiKey, setStraicoApiKey] = useState("");
  const [straicoModel, setStraicoModel] = useState("openai/gpt-4o-mini");
  const [straicoImageModel, setStraicoImageModel] = useState("flux/1.1");
  const [oneforallApiKey, setOneforallApiKey] = useState("");
  const [oneforallModel, setOneforallModel] = useState(
    "anthropic/claude-4-sonnet",
  );
  const [oneforallImageModel, setOneforallImageModel] = useState("dall-e");

  // Research API keys (Content Factory pipeline)
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [redditClientId, setRedditClientId] = useState("");
  const [redditClientSecret, setRedditClientSecret] = useState("");

  // Show/hide key toggles
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showStraicoKey, setShowStraicoKey] = useState(false);
  const [showOneforallKey, setShowOneforallKey] = useState(false);
  const [showPerplexityKey, setShowPerplexityKey] = useState(false);
  const [showRedditSecret, setShowRedditSecret] = useState(false);

  // Active provider tab
  const [expandedProvider, setExpandedProvider] =
    useState<AiProviderType>("claude");

  // Model section dropdowns (copy + image, per provider)
  const [straicoModelOpen, setStraicoModelOpen] = useState(false);
  const [straicoImageOpen, setStraicoImageOpen] = useState(false);
  const [oneforallModelOpen, setOneforallModelOpen] = useState(false);
  const [oneforallImageOpen, setOneforallImageOpen] = useState(false);

  // Per-provider validation states
  const [claudeValidation, setClaudeValidation] = useState<ValidationState>({
    state: "idle",
  });
  const [straicoValidation, setStraicoValidation] = useState<ValidationState>({
    state: "idle",
  });
  const [oneforallValidation, setOneforallValidation] =
    useState<ValidationState>({ state: "idle" });

  // Per-provider model test states
  const [claudeTest, setClaudeTest] = useState<TestState>({ state: "idle" });
  const [straicoTest, setStraicoTest] = useState<TestState>({ state: "idle" });
  const [oneforallTest, setOneforallTest] = useState<TestState>({
    state: "idle",
  });

  // Dynamic model lists
  const [straicoModels, setStraicoModels] = useState<AiModel[]>([
    ...STRAICO_MODELS,
  ]);
  const [oneforallModels, setOneforallModels] = useState<AiModel[]>([
    ...ONEFORALL_MODELS,
  ]);
  const [oneforallImageModels, setOneforallImageModels] = useState<AiModel[]>([
    ...ONEFORALL_IMAGE_MODELS,
  ]);
  const [modelsLoading, setModelsLoading] = useState<Record<string, boolean>>(
    {},
  );

  const [straicoUserInfo, setStraicoUserInfo] =
    useState<StraicoUserInfo | null>(null);

  // Enrich 1ForAll models with Straico metadata where models overlap
  const enrichedOneforallModels = React.useMemo(() => {
    const chatModels = straicoModels.filter(
      (m) => !m.modelType || m.modelType === "chat",
    );
    if (chatModels.length === 0) return oneforallModels;
    return oneforallModels.map((m) => {
      const keywords = m.label
        .toLowerCase()
        .split(/[\s\-_]+/)
        .filter((w) => w.length > 2);
      const match = chatModels.find(
        (s) =>
          s.provider === m.provider &&
          keywords.some((kw) => s.label.toLowerCase().includes(kw)),
      );
      if (!match) return m;
      return {
        ...m,
        // Only enrich display/quality metadata — never overwrite provider-specific pricing
        editorsChoiceLevel: m.editorsChoiceLevel ?? match.editorsChoiceLevel,
        applications: m.applications ?? match.applications,
        features: m.features ?? match.features,
        pros: m.pros ?? match.pros,
        cons: m.cons ?? match.cons,
        icon: m.icon ?? match.icon,
        modelDate: m.modelDate ?? match.modelDate,
      };
    });
  }, [oneforallModels, straicoModels]);

  // Auto-save profile to NCB (silent, no validation)
  const saveProfileSilent = useCallback(
    async (overrides?: Partial<BrandProfile>) => {
      if (!profile) return;
      try {
        const updatedProfile: BrandProfile = {
          ...profile,
          aiProvider: activeProvider,
          claudeApiKey,
          straicoApiKey,
          straicoModel,
          straicoImageModel,
          oneforallApiKey,
          oneforallModel,
          oneforallImageModel,
          perplexityApiKey: perplexityApiKey || undefined,
          redditClientId: redditClientId || undefined,
          redditClientSecret: redditClientSecret || undefined,
          ...overrides,
        };
        await updateBrandProfile(updatedProfile);
        setProfile(updatedProfile);
      } catch (error) {
        console.error("Failed to save profile:", error);
      }
    },
    [
      profile,
      activeProvider,
      claudeApiKey,
      straicoApiKey,
      straicoModel,
      straicoImageModel,
      oneforallApiKey,
      oneforallModel,
      oneforallImageModel,
      perplexityApiKey,
      redditClientId,
      redditClientSecret,
    ],
  );

  // Per-provider validate: validate key → on success load data → auto-save
  const handleValidateClaude = useCallback(async () => {
    if (!claudeApiKey.trim()) {
      setClaudeValidation({ state: "error", message: "API key is required" });
      return;
    }
    setClaudeValidation({ state: "validating" });
    try {
      await validateClaudeKey(claudeApiKey);
      setClaudeValidation({ state: "valid" });
      await saveProfileSilent();
    } catch (err) {
      setClaudeValidation({
        state: "error",
        message: err instanceof Error ? err.message : "Validation failed",
      });
    }
  }, [claudeApiKey, saveProfileSilent]);

  const handleValidateStraico = useCallback(async () => {
    if (!straicoApiKey.trim()) {
      setStraicoValidation({ state: "error", message: "API key is required" });
      return;
    }
    setStraicoValidation({ state: "validating" });
    try {
      // Step 1: Validate key against Straico auth
      await validateStraicoKey(straicoApiKey);
      setStraicoValidation({ state: "valid" });

      // Step 2: On success, load models + user info in parallel
      setModelsLoading((prev) => ({ ...prev, straico: true }));
      const [modelsResult, userInfo] = await Promise.all([
        fetchModels("straico", straicoApiKey),
        fetchStraicoUserInfo(straicoApiKey),
      ]);
      if (modelsResult.models.length > 0) {
        setStraicoModels(modelsResult.models);
      }
      setStraicoUserInfo(userInfo);
      setModelsLoading((prev) => ({ ...prev, straico: false }));

      // Step 3: Auto-save
      await saveProfileSilent();
    } catch (err) {
      setStraicoValidation({
        state: "error",
        message: err instanceof Error ? err.message : "Validation failed",
      });
      setModelsLoading((prev) => ({ ...prev, straico: false }));
    }
  }, [straicoApiKey, saveProfileSilent]);

  const handleValidateOneforall = useCallback(async () => {
    if (!oneforallApiKey.trim()) {
      setOneforallValidation({
        state: "error",
        message: "API key is required",
      });
      return;
    }
    setOneforallValidation({ state: "validating" });
    try {
      await validateOneForAllKey(oneforallApiKey);
      setOneforallValidation({ state: "valid" });

      // Fetch models from API (like Straico)
      setModelsLoading((prev) => ({ ...prev, "1forall": true }));
      const [modelsResult, imageModelsResult] = await Promise.all([
        fetchModels("1forall", oneforallApiKey),
        fetchImageModels("1forall", oneforallApiKey),
      ]);
      if (modelsResult.models.length > 0) {
        setOneforallModels(modelsResult.models);
      }
      if (imageModelsResult.models.length > 0) {
        setOneforallImageModels(imageModelsResult.models);
      }
      setModelsLoading((prev) => ({ ...prev, "1forall": false }));

      await saveProfileSilent();
    } catch (err) {
      setOneforallValidation({
        state: "error",
        message: err instanceof Error ? err.message : "Validation failed",
      });
      setModelsLoading((prev) => ({ ...prev, "1forall": false }));
    }
  }, [oneforallApiKey, saveProfileSilent]);

  const handleTestModel = useCallback(
    async (
      testType: "text" | "image",
      provider: "claude" | "straico" | "1forall",
      apiKey: string,
      model: string,
      imageModel: string,
      setTest: React.Dispatch<React.SetStateAction<TestState>>,
    ) => {
      if (!apiKey.trim()) return;
      setTest({ state: "loading", testType });
      try {
        const res = await fetch("/api/test-model", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: testType,
            provider,
            apiKey,
            model,
            imageModel,
          }),
        });
        const data = (await res.json()) as
          | { type: "text"; result: string }
          | { type: "image"; imageUrl: string }
          | { error: string };
        if (!res.ok || "error" in data) {
          setTest({
            state: "error",
            testType,
            message: "error" in data ? data.error : "Request failed",
          });
          return;
        }
        if (data.type === "text") {
          setTest({ state: "success", testType: "text", text: data.result });
        } else {
          setTest({
            state: "success",
            testType: "image",
            imageUrl: data.imageUrl,
          });
        }
      } catch (err) {
        setTest({
          state: "error",
          testType,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);
        setActiveProvider(data.aiProvider ?? "claude");
        setClaudeApiKey(data.claudeApiKey ?? "");
        setStraicoApiKey(data.straicoApiKey ?? "");
        setStraicoModel(data.straicoModel ?? "openai/gpt-4o-mini");
        setStraicoImageModel(data.straicoImageModel ?? "flux/1.1");
        setOneforallApiKey(data.oneforallApiKey ?? "");
        setOneforallModel(data.oneforallModel ?? "anthropic/claude-4-sonnet");
        setOneforallImageModel(data.oneforallImageModel ?? "dall-e");
        setPerplexityApiKey(data.perplexityApiKey ?? "");
        setRedditClientId(data.redditClientId ?? "");
        setRedditClientSecret(data.redditClientSecret ?? "");
        setProfileLoaded(true);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id]);

  // Auto-validate all configured keys on initial load
  useEffect(() => {
    if (!profileLoaded) return;

    if (claudeApiKey.trim()) {
      void handleValidateClaude();
    }
    if (straicoApiKey.trim()) {
      void handleValidateStraico();
    }
    if (oneforallApiKey.trim()) {
      void handleValidateOneforall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoaded]);

  const handleSaveAll = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await saveProfileSilent();
    } finally {
      setSaving(false);
    }
  };

  const isClaude = activeProvider === "claude";
  const isOneforall = activeProvider === "1forall";
  const isStraico = activeProvider === "straico";
  const claudeReady = isClaude && !!claudeApiKey;
  const straicoReady = isStraico && !!straicoApiKey;
  const oneforallReady = isOneforall && !!oneforallApiKey;

  function statusLabel(
    validation: ValidationState,
    configured: boolean,
  ): string {
    if (validation.state === "valid") return "Verified";
    if (validation.state === "validating") return "Verifying...";
    if (validation.state === "error") return "Invalid key";
    if (configured) return "Not verified";
    return "Not configured";
  }

  if (loading) {
    return (
      <Container>
        <Card
          variant="raised"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <Text>Loading settings...</Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ marginBottom: "var(--drp-space-6)" }}>
        <Heading level={1}>AI & Integrations</Heading>
      </div>

      {/* Integration Status Overview Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--drp-space-4)",
          padding: "var(--drp-space-3)",
          border: "var(--drp-border)",
          background: "var(--drp-white)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--drp-grey)" }}
          >
            Claude:
          </span>
          <StatusBadge
            connected={claudeValidation.state === "valid"}
            label={statusLabel(claudeValidation, !!claudeApiKey.trim())}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--drp-grey)" }}
          >
            Straico:
          </span>
          <StatusBadge
            connected={straicoValidation.state === "valid"}
            label={statusLabel(straicoValidation, !!straicoApiKey.trim())}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--drp-grey)" }}
          >
            1ForAll:
          </span>
          <StatusBadge
            connected={oneforallValidation.state === "valid"}
            label={statusLabel(oneforallValidation, !!oneforallApiKey.trim())}
          />
        </div>
      </div>

      {/* ── Research APIs Card (Perplexity + Reddit) ── */}
      <Card variant="raised" style={{ marginBottom: "var(--drp-space-6)" }}>
        <div style={{ marginBottom: "var(--drp-space-2)" }}>
          <Heading level={5}>Research APIs</Heading>
        </div>
        <Text size="xs">
          <span
            style={{ marginBottom: "var(--drp-space-4)", display: "block" }}
          >
            Optional keys for the Content Factory research pipeline. When
            configured, the researcher agent can pull real-time data from
            Perplexity and Reddit.
          </span>
        </Text>

        <div className="drp-form-stack">
          {/* Perplexity */}
          <div style={{ position: "relative" }}>
            <Input
              label="Perplexity API Key"
              type={showPerplexityKey ? "text" : "password"}
              value={perplexityApiKey}
              onChange={(e) => setPerplexityApiKey(e.target.value)}
              onBlur={() => void saveProfileSilent()}
              placeholder="pplx-..."
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowPerplexityKey((p) => !p)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                padding: 0,
              }}
            >
              {showPerplexityKey ? (
                <Icon name="eye-off" size="sm" />
              ) : (
                <Icon name="eye" size="sm" />
              )}
            </Button>
          </div>

          {/* Reddit */}
          <Input
            label="Reddit Client ID"
            value={redditClientId}
            onChange={(e) => setRedditClientId(e.target.value)}
            onBlur={() => void saveProfileSilent()}
            placeholder="Reddit app client ID"
          />
          <div style={{ position: "relative" }}>
            <Input
              label="Reddit Client Secret"
              type={showRedditSecret ? "text" : "password"}
              value={redditClientSecret}
              onChange={(e) => setRedditClientSecret(e.target.value)}
              onBlur={() => void saveProfileSilent()}
              placeholder="Reddit app client secret"
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowRedditSecret((p) => !p)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                padding: 0,
              }}
            >
              {showRedditSecret ? (
                <Icon name="eye-off" size="sm" />
              ) : (
                <Icon name="eye" size="sm" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── AI Providers Section (full width) ── */}
      <Card variant="raised" style={{ marginBottom: "var(--drp-space-6)" }}>
        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid rgba(0,0,0,0.08)",
            marginBottom: "var(--drp-space-5)",
          }}
        >
          {[
            {
              id: "claude" as AiProviderType,
              label: "Claude",
              color: "var(--drp-purple)",
            },
            {
              id: "straico" as AiProviderType,
              label: "Straico",
              color: "var(--drp-yellow)",
            },
            {
              id: "1forall" as AiProviderType,
              label: "1ForAll",
              color: "var(--drp-blue)",
            },
          ].map(({ id, label, color }) => {
            const isActive = expandedProvider === id;
            return (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setExpandedProvider(id)}
                style={{
                  padding: "var(--drp-space-2) var(--drp-space-5)",
                  borderBottom: isActive
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? color : "var(--drp-grey)",
                  marginBottom: -2,
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>

        {/* ── Claude Tab ── */}
        {expandedProvider === "claude" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--drp-space-3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-3)",
              }}
            >
              <ValidationBadge status={claudeValidation} />
              {isClaude && (
                <Badge variant={claudeReady ? "primary" : "pink"}>
                  {claudeReady ? "Active" : "No Key"}
                </Badge>
              )}
              {!isClaude && (
                <Button
                  size="sm"
                  variant="primary"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setActiveProvider("claude")}
                >
                  Set as Active
                </Button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Input
                label="API Key"
                type={showClaudeKey ? "text" : "password"}
                value={claudeApiKey}
                onChange={(e) => {
                  setClaudeApiKey(e.target.value);
                  setClaudeValidation({ state: "idle" });
                }}
                placeholder="sk-ant-..."
                error={
                  claudeValidation.state === "error" &&
                  !!claudeValidation.message
                }
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowClaudeKey((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: 0,
                }}
              >
                {showClaudeKey ? (
                  <Icon name="eye-off" size="sm" />
                ) : (
                  <Icon name="eye" size="sm" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void handleValidateClaude()}
              disabled={claudeValidation.state === "validating"}
              style={{ alignSelf: "flex-start" }}
            >
              {claudeValidation.state === "validating" ? (
                <>
                  <BruLoader size="sm" />
                  Validating...
                </>
              ) : (
                "Validate Key"
              )}
            </Button>
            <p style={{ fontSize: 10, color: "var(--drp-grey)" }}>
              Claude uses direct browser API — model selection is automatic
              (Claude Sonnet 4.5).
            </p>
            {claudeApiKey.trim() && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  style={{ alignSelf: "flex-start" }}
                  disabled={claudeTest.state === "loading"}
                  onClick={() =>
                    void handleTestModel(
                      "text",
                      "claude",
                      claudeApiKey,
                      "",
                      "",
                      setClaudeTest,
                    )
                  }
                >
                  {claudeTest.state === "loading" &&
                  claudeTest.testType === "text" ? (
                    <>
                      <BruLoader size="sm" /> Testing...
                    </>
                  ) : (
                    "Test Text Model"
                  )}
                </Button>
                <TestResultBlock test={claudeTest} />
              </div>
            )}
          </div>
        )}

        {/* ── Straico Tab ── */}
        {expandedProvider === "straico" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--drp-space-3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-3)",
              }}
            >
              <ValidationBadge status={straicoValidation} />
              {isStraico && (
                <Badge variant={straicoReady ? "secondary" : "pink"}>
                  {straicoReady ? "Active" : "No Key"}
                </Badge>
              )}
              {!isStraico && (
                <Button
                  size="sm"
                  variant="primary"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setActiveProvider("straico")}
                >
                  Set as Active
                </Button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Input
                label="API Key"
                type={showStraicoKey ? "text" : "password"}
                value={straicoApiKey}
                onChange={(e) => {
                  setStraicoApiKey(e.target.value);
                  setStraicoValidation({ state: "idle" });
                }}
                placeholder="Your Straico API key"
                error={
                  straicoValidation.state === "error" &&
                  !!straicoValidation.message
                }
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowStraicoKey((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: 0,
                }}
              >
                {showStraicoKey ? (
                  <Icon name="eye-off" size="sm" />
                ) : (
                  <Icon name="eye" size="sm" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void handleValidateStraico()}
              disabled={straicoValidation.state === "validating"}
              style={{ alignSelf: "flex-start" }}
            >
              {straicoValidation.state === "validating" ? (
                <>
                  <BruLoader size="sm" />
                  Validating...
                </>
              ) : (
                "Validate Key & Load Models"
              )}
            </Button>
            {straicoApiKey.trim() && (
              <>
                {/* Model for Copy dropdown */}
                <div style={{ border: "var(--drp-border)" }}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setStraicoModelOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--drp-space-2) var(--drp-space-3)",
                      background: straicoModelOpen
                        ? "rgba(245, 158, 11, 0.05)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--drp-grey)",
                      }}
                    >
                      Model for Copy
                    </span>
                    {straicoModelOpen ? (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▼
                      </span>
                    ) : (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▶
                      </span>
                    )}
                  </Button>
                  {straicoModelOpen && (
                    <div
                      style={{
                        padding: "0 14px 14px",
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <StraicoModelPicker
                        models={straicoModels}
                        selectedModelId={straicoModel}
                        onSelectModel={(id) => setStraicoModel(id)}
                        loading={modelsLoading.straico}
                        userInfo={straicoUserInfo}
                      />
                    </div>
                  )}
                </div>

                {/* Model for Image dropdown */}
                <div style={{ border: "var(--drp-border)" }}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setStraicoImageOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--drp-space-2) var(--drp-space-3)",
                      background: straicoImageOpen
                        ? "rgba(245, 158, 11, 0.05)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--drp-grey)",
                      }}
                    >
                      Model for Image
                    </span>
                    {straicoImageOpen ? (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▼
                      </span>
                    ) : (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▶
                      </span>
                    )}
                  </Button>
                  {straicoImageOpen && (
                    <div
                      style={{
                        padding: "0 14px 14px",
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <StraicoModelPicker
                        models={straicoModels.filter(
                          (m) => m.modelType === "image",
                        )}
                        selectedModelId={straicoImageModel}
                        onSelectModel={(id) => {
                          setStraicoImageModel(id);
                          void saveProfileSilent({ straicoImageModel: id });
                        }}
                        loading={modelsLoading.straico}
                        allowAllTypes
                      />
                    </div>
                  )}
                </div>

                {/* Test buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={straicoTest.state === "loading"}
                    onClick={() =>
                      void handleTestModel(
                        "text",
                        "straico",
                        straicoApiKey,
                        straicoModel,
                        straicoImageModel,
                        setStraicoTest,
                      )
                    }
                  >
                    {straicoTest.state === "loading" &&
                    straicoTest.testType === "text" ? (
                      <>
                        <BruLoader size="sm" /> Testing...
                      </>
                    ) : (
                      "Test Text Model"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={straicoTest.state === "loading"}
                    onClick={() =>
                      void handleTestModel(
                        "image",
                        "straico",
                        straicoApiKey,
                        straicoModel,
                        straicoImageModel,
                        setStraicoTest,
                      )
                    }
                  >
                    {straicoTest.state === "loading" &&
                    straicoTest.testType === "image" ? (
                      <>
                        <BruLoader size="sm" /> Testing...
                      </>
                    ) : (
                      "Test Image Model"
                    )}
                  </Button>
                </div>
                <TestResultBlock test={straicoTest} />
              </>
            )}
          </div>
        )}

        {/* ── 1ForAll Tab ── */}
        {expandedProvider === "1forall" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--drp-space-3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-3)",
              }}
            >
              <ValidationBadge status={oneforallValidation} />
              {isOneforall && (
                <Badge variant={oneforallReady ? "filled" : "pink"}>
                  {oneforallReady ? "Active" : "No Key"}
                </Badge>
              )}
              {!isOneforall && (
                <Button
                  size="sm"
                  variant="primary"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setActiveProvider("1forall")}
                >
                  Set as Active
                </Button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Input
                label="API Key"
                type={showOneforallKey ? "text" : "password"}
                value={oneforallApiKey}
                onChange={(e) => {
                  setOneforallApiKey(e.target.value);
                  setOneforallValidation({ state: "idle" });
                }}
                placeholder="Your 1ForAll API key"
                error={
                  oneforallValidation.state === "error" &&
                  !!oneforallValidation.message
                }
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowOneforallKey((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: 0,
                }}
              >
                {showOneforallKey ? (
                  <Icon name="eye-off" size="sm" />
                ) : (
                  <Icon name="eye" size="sm" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void handleValidateOneforall()}
              disabled={oneforallValidation.state === "validating"}
              style={{ alignSelf: "flex-start" }}
            >
              {oneforallValidation.state === "validating" ? (
                <>
                  <BruLoader size="sm" />
                  Validating...
                </>
              ) : (
                "Validate Key"
              )}
            </Button>
            {oneforallApiKey.trim() && (
              <>
                {/* Model for Copy dropdown */}
                <div style={{ border: "var(--drp-border)" }}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setOneforallModelOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--drp-space-2) var(--drp-space-3)",
                      background: oneforallModelOpen
                        ? "rgba(14, 165, 233, 0.05)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--drp-grey)",
                      }}
                    >
                      Model for Copy
                    </span>
                    {oneforallModelOpen ? (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▼
                      </span>
                    ) : (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▶
                      </span>
                    )}
                  </Button>
                  {oneforallModelOpen && (
                    <div
                      style={{
                        padding: "0 14px 14px",
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <StraicoModelPicker
                        models={enrichedOneforallModels}
                        selectedModelId={oneforallModel}
                        onSelectModel={setOneforallModel}
                        loading={modelsLoading["1forall"]}
                      />
                    </div>
                  )}
                </div>

                {/* Model for Image dropdown */}
                <div style={{ border: "var(--drp-border)" }}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setOneforallImageOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--drp-space-2) var(--drp-space-3)",
                      background: oneforallImageOpen
                        ? "rgba(14, 165, 233, 0.05)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--drp-grey)",
                      }}
                    >
                      Model for Image
                    </span>
                    {oneforallImageOpen ? (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▼
                      </span>
                    ) : (
                      <span style={{ color: "var(--drp-grey)", fontSize: 14 }}>
                        ▶
                      </span>
                    )}
                  </Button>
                  {oneforallImageOpen && (
                    <div
                      style={{
                        padding: "0 14px 14px",
                        borderTop: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <StraicoModelPicker
                        models={oneforallImageModels}
                        selectedModelId={oneforallImageModel}
                        onSelectModel={(id) => {
                          setOneforallImageModel(id);
                          void saveProfileSilent({
                            oneforallImageModel: id,
                          });
                        }}
                        loading={modelsLoading["1forall"]}
                        allowAllTypes
                      />
                    </div>
                  )}
                </div>

                {/* Test buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={oneforallTest.state === "loading"}
                    onClick={() =>
                      void handleTestModel(
                        "text",
                        "1forall",
                        oneforallApiKey,
                        oneforallModel,
                        oneforallImageModel,
                        setOneforallTest,
                      )
                    }
                  >
                    {oneforallTest.state === "loading" &&
                    oneforallTest.testType === "text" ? (
                      <>
                        <BruLoader size="sm" /> Testing...
                      </>
                    ) : (
                      "Test Text Model"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={oneforallTest.state === "loading"}
                    onClick={() =>
                      void handleTestModel(
                        "image",
                        "1forall",
                        oneforallApiKey,
                        oneforallModel,
                        oneforallImageModel,
                        setOneforallTest,
                      )
                    }
                  >
                    {oneforallTest.state === "loading" &&
                    oneforallTest.testType === "image" ? (
                      <>
                        <BruLoader size="sm" /> Testing...
                      </>
                    ) : (
                      "Test Image Model"
                    )}
                  </Button>
                </div>
                <TestResultBlock test={oneforallTest} />
              </>
            )}
          </div>
        )}

        {/* Save All button */}
        <Button
          variant="primary"
          block
          style={{ marginTop: "var(--drp-space-6)" }}
          onClick={() => void handleSaveAll()}
          disabled={saving}
        >
          {saving ? (
            <>
              <BruLoader size="sm" />
              Saving & Validating...
            </>
          ) : (
            "Save & Validate All"
          )}
        </Button>
      </Card>
    </Container>
  );
}
