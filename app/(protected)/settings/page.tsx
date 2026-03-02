"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button, Card } from "@bruddle/react";
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
import { fetchModels } from "@/lib/ai/modelService";
import { ONEFORALL_MODELS, STRAICO_MODELS } from "@/lib/ai/constants";
import { StraicoModelPicker } from "@/components/settings/StraicoModelPicker";
import {
  Loader,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
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
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: "rgba(59, 130, 246, 0.1)",
          color: "#2563eb",
        }}
      >
        <Loader size={10} className="animate-spin" />
        Verifying
      </span>
    );
  }
  if (status.state === "valid") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: "rgba(22, 163, 74, 0.1)",
          color: "#16a34a",
        }}
      >
        <ShieldCheck size={10} />
        Verified
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#dc2626",
      }}
    >
      <AlertCircle size={10} />
      Invalid
    </span>
  );
}

function StatusBadge({
  connected,
  label,
}: {
  connected: boolean;
  label?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: connected ? "rgba(22, 163, 74, 0.1)" : "rgba(0,0,0,0.05)",
        color: connected ? "#16a34a" : "var(--bru-grey)",
      }}
    >
      {connected ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {label || (connected ? "Connected" : "Not connected")}
    </span>
  );
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
  const [oneforallApiKey, setOneforallApiKey] = useState("");
  const [oneforallModel, setOneforallModel] = useState(
    "anthropic/claude-4-sonnet",
  );

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

  // Expandable provider cards
  const [expandedProvider, setExpandedProvider] =
    useState<AiProviderType | null>(null);

  // Per-provider validation states
  const [claudeValidation, setClaudeValidation] = useState<ValidationState>({
    state: "idle",
  });
  const [straicoValidation, setStraicoValidation] = useState<ValidationState>({
    state: "idle",
  });
  const [oneforallValidation, setOneforallValidation] =
    useState<ValidationState>({ state: "idle" });

  // Dynamic model lists
  const [straicoModels, setStraicoModels] = useState<AiModel[]>([
    ...STRAICO_MODELS,
  ]);
  const [oneforallModels, setOneforallModels] = useState<AiModel[]>([
    ...ONEFORALL_MODELS,
  ]);
  const [modelsLoading, setModelsLoading] = useState<Record<string, boolean>>(
    {},
  );

  const [straicoUserInfo, setStraicoUserInfo] =
    useState<StraicoUserInfo | null>(null);

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
          oneforallApiKey,
          oneforallModel,
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
      oneforallApiKey,
      oneforallModel,
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
      const modelsResult = await fetchModels("1forall", oneforallApiKey);
      if (modelsResult.models.length > 0) {
        setOneforallModels(modelsResult.models);
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
        setOneforallApiKey(data.oneforallApiKey ?? "");
        setOneforallModel(data.oneforallModel ?? "anthropic/claude-4-sonnet");
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

  const updateField = (field: keyof BrandProfile, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
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
      <Card
        variant="raised"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <p>Loading settings...</p>
      </Card>
    );
  }

  return (
    <>
      <h1
        style={{
          fontSize: "var(--bru-text-h3)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-6)",
        }}
      >
        Settings
      </h1>

      {/* Integration Status Overview Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--bru-space-4)",
          padding: "var(--bru-space-3)",
          border: "var(--bru-border)",
          background: "var(--bru-white)",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}
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
            gap: "var(--bru-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}
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
            gap: "var(--bru-space-2)",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}
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
      <Card variant="raised" style={{ marginBottom: "var(--bru-space-6)" }}>
        <h2
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--bru-space-2)",
          }}
        >
          Research APIs
        </h2>
        <p
          style={{
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-grey)",
            marginBottom: "var(--bru-space-4)",
          }}
        >
          Optional keys for the Content Factory research pipeline. When
          configured, the researcher agent can pull real-time data from
          Perplexity and Reddit.
        </p>

        <div className="bru-form-stack">
          {/* Perplexity */}
          <div className="bru-field">
            <label className="bru-field__label">Perplexity API Key</label>
            <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
              <input
                className="bru-input"
                type={showPerplexityKey ? "text" : "password"}
                value={perplexityApiKey}
                onChange={(e) => setPerplexityApiKey(e.target.value)}
                onBlur={() => void saveProfileSilent()}
                placeholder="pplx-..."
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPerplexityKey((p) => !p)}
                style={{ padding: "4px 8px" }}
              >
                {showPerplexityKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>

          {/* Reddit */}
          <div className="bru-field">
            <label className="bru-field__label">Reddit Client ID</label>
            <input
              className="bru-input"
              value={redditClientId}
              onChange={(e) => setRedditClientId(e.target.value)}
              onBlur={() => void saveProfileSilent()}
              placeholder="Reddit app client ID"
            />
          </div>
          <div className="bru-field">
            <label className="bru-field__label">Reddit Client Secret</label>
            <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
              <input
                className="bru-input"
                type={showRedditSecret ? "text" : "password"}
                value={redditClientSecret}
                onChange={(e) => setRedditClientSecret(e.target.value)}
                onBlur={() => void saveProfileSilent()}
                placeholder="Reddit app client secret"
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRedditSecret((p) => !p)}
                style={{ padding: "4px 8px" }}
              >
                {showRedditSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Brand Profile Card (full width) ── */}
      <Card variant="raised" style={{ marginBottom: "var(--bru-space-6)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--bru-space-6)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Brand Profile
          </h2>
          {!profile?.companyName && (
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const res = await fetch("/api/seed-profile", {
                    method: "POST",
                    credentials: "include",
                  });
                  if (res.ok) {
                    window.location.reload();
                  }
                } catch (e) {
                  console.error("Seed failed:", e);
                }
              }}
            >
              Load Doctor Project Profile
            </Button>
          )}
        </div>

        <div
          className="bru-form-row"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <div className="bru-field">
            <label htmlFor="firstName" className="bru-field__label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              className="bru-input"
              style={{ width: "100%" }}
              value={profile?.firstName ?? ""}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div className="bru-field">
            <label htmlFor="lastName" className="bru-field__label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              className="bru-input"
              style={{ width: "100%" }}
              value={profile?.lastName ?? ""}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
        </div>

        <div
          className="bru-form-row"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <div className="bru-field">
            <label htmlFor="companyName" className="bru-field__label">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              className="bru-input"
              style={{ width: "100%" }}
              value={profile?.companyName ?? ""}
              onChange={(e) => updateField("companyName", e.target.value)}
            />
          </div>
          <div className="bru-field">
            <label htmlFor="role" className="bru-field__label">
              Role
            </label>
            <input
              type="text"
              id="role"
              className="bru-input"
              style={{ width: "100%" }}
              value={profile?.role ?? ""}
              onChange={(e) => updateField("role", e.target.value)}
            />
          </div>
        </div>

        <div
          className="bru-field"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <label htmlFor="industry" className="bru-field__label">
            Industry
          </label>
          <input
            type="text"
            id="industry"
            className="bru-input"
            style={{ width: "100%" }}
            value={profile?.industry ?? ""}
            onChange={(e) => updateField("industry", e.target.value)}
          />
        </div>

        <div
          className="bru-field"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <label className="bru-field__label">Audience</label>
          <div
            style={{
              border: "var(--bru-border)",
              padding: "var(--bru-space-3)",
              background: "var(--bru-cream)",
            }}
          >
            {profile?.audience.map((audience, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom:
                    index < (profile?.audience.length ?? 0) - 1
                      ? "var(--bru-space-2)"
                      : 0,
                }}
              >
                <span
                  style={{ fontSize: "var(--bru-text-md)", fontWeight: 500 }}
                >
                  {audience}
                </span>
                <Button size="sm">Edit</Button>
              </div>
            ))}
            <button
              style={{
                marginTop: "var(--bru-space-2)",
                fontSize: "var(--bru-text-md)",
                fontWeight: 700,
                color: "var(--bru-purple)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "var(--bru-font-primary)",
              }}
            >
              + Add Audience
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => void handleSaveAll()}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </Card>

      {/* ── AI Providers Section (full width) ── */}
      <Card variant="raised" style={{ marginBottom: "var(--bru-space-6)" }}>
        <h2
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--bru-space-6)",
          }}
        >
          AI Providers
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--bru-space-3)",
          }}
        >
          {/* ── Claude Card ── */}
          {(() => {
            const isExpanded = expandedProvider === "claude";
            return (
              <div
                style={{
                  border: isClaude
                    ? "2px solid var(--bru-purple)"
                    : "var(--bru-border)",
                  background: isClaude
                    ? "rgba(99, 29, 237, 0.05)"
                    : "var(--bru-white)",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedProvider(isExpanded ? null : "claude")
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--bru-space-3)",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--bru-font-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <span
                      style={{
                        fontSize: "var(--bru-text-md)",
                        fontWeight: 700,
                      }}
                    >
                      Claude
                    </span>
                    <ValidationBadge status={claudeValidation} />
                    {isClaude && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: claudeReady
                            ? "var(--bru-purple)"
                            : "var(--bru-error, #FF4444)",
                          background: claudeReady
                            ? "var(--bru-purple-20)"
                            : "rgba(231, 76, 60, 0.1)",
                          padding: "2px 6px",
                        }}
                      >
                        {claudeReady ? "Active" : "No Key"}
                      </span>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 var(--bru-space-4) var(--bru-space-4)",
                      borderTop: "1px solid rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {!isClaude && (
                      <Button
                        size="sm"
                        variant="primary"
                        style={{
                          marginTop: "var(--bru-space-3)",
                          alignSelf: "flex-start",
                        }}
                        onClick={() => setActiveProvider("claude")}
                      >
                        Set as Active
                      </Button>
                    )}
                    <div style={{ marginTop: "var(--bru-space-3)" }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--bru-grey)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: "var(--bru-space-2)",
                        }}
                      >
                        <Key size={12} /> API Key
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showClaudeKey ? "text" : "password"}
                          value={claudeApiKey}
                          onChange={(e) => {
                            setClaudeApiKey(e.target.value);
                            setClaudeValidation({ state: "idle" });
                          }}
                          placeholder="sk-ant-..."
                          className="bru-input"
                          style={{ width: "100%", paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowClaudeKey((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--bru-grey)",
                            padding: 0,
                          }}
                        >
                          {showClaudeKey ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {claudeValidation.state === "error" && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "#dc2626",
                            marginTop: 4,
                          }}
                        >
                          {claudeValidation.message}
                        </p>
                      )}
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
                          <Loader size={12} className="animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Key"
                      )}
                    </Button>
                    <p style={{ fontSize: 10, color: "var(--bru-grey)" }}>
                      Claude uses direct browser API — model selection is
                      automatic (Claude Sonnet 4.5).
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Straico Card ── */}
          {(() => {
            const isExpanded = expandedProvider === "straico";
            return (
              <div
                style={{
                  border: isStraico
                    ? "2px solid var(--bru-purple)"
                    : "var(--bru-border)",
                  background: isStraico
                    ? "rgba(99, 29, 237, 0.05)"
                    : "var(--bru-white)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = isExpanded
                      ? null
                      : ("straico" as AiProviderType);
                    setExpandedProvider(next);
                    // Models loaded on validation or auto-validate
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--bru-space-3)",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--bru-font-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <span
                      style={{
                        fontSize: "var(--bru-text-md)",
                        fontWeight: 700,
                      }}
                    >
                      Straico
                    </span>
                    <ValidationBadge status={straicoValidation} />
                    {isStraico && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: straicoReady
                            ? "var(--bru-purple)"
                            : "var(--bru-error, #FF4444)",
                          background: straicoReady
                            ? "var(--bru-purple-20)"
                            : "rgba(231, 76, 60, 0.1)",
                          padding: "2px 6px",
                        }}
                      >
                        {straicoReady ? "Active" : "No Key"}
                      </span>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 var(--bru-space-4) var(--bru-space-4)",
                      borderTop: "1px solid rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {!isStraico && (
                      <Button
                        size="sm"
                        variant="primary"
                        style={{
                          marginTop: "var(--bru-space-3)",
                          alignSelf: "flex-start",
                        }}
                        onClick={() => setActiveProvider("straico")}
                      >
                        Set as Active
                      </Button>
                    )}
                    <div style={{ marginTop: "var(--bru-space-3)" }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--bru-grey)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: "var(--bru-space-2)",
                        }}
                      >
                        <Key size={12} /> API Key
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showStraicoKey ? "text" : "password"}
                          value={straicoApiKey}
                          onChange={(e) => {
                            setStraicoApiKey(e.target.value);
                            setStraicoValidation({ state: "idle" });
                          }}
                          placeholder="Your Straico API key"
                          className="bru-input"
                          style={{ width: "100%", paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowStraicoKey((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--bru-grey)",
                            padding: 0,
                          }}
                        >
                          {showStraicoKey ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {straicoValidation.state === "error" && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "#dc2626",
                            marginTop: 4,
                          }}
                        >
                          {straicoValidation.message}
                        </p>
                      )}
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
                          <Loader size={12} className="animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Key & Load Models"
                      )}
                    </Button>
                    {straicoApiKey.trim() && (
                      <StraicoModelPicker
                        models={straicoModels}
                        selectedModelId={straicoModel}
                        onSelectModel={(id) => setStraicoModel(id)}
                        loading={modelsLoading.straico}
                        userInfo={straicoUserInfo}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── 1ForAll Card ── */}
          {(() => {
            const isExpanded = expandedProvider === "1forall";
            return (
              <div
                style={{
                  border: isOneforall
                    ? "2px solid var(--bru-purple)"
                    : "var(--bru-border)",
                  background: isOneforall
                    ? "rgba(99, 29, 237, 0.05)"
                    : "var(--bru-white)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = isExpanded
                      ? null
                      : ("1forall" as AiProviderType);
                    setExpandedProvider(next);
                    // Models loaded on validation or auto-validate
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--bru-space-3)",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--bru-font-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <span
                      style={{
                        fontSize: "var(--bru-text-md)",
                        fontWeight: 700,
                      }}
                    >
                      1ForAll
                    </span>
                    <ValidationBadge status={oneforallValidation} />
                    {isOneforall && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: oneforallReady
                            ? "var(--bru-purple)"
                            : "var(--bru-error, #FF4444)",
                          background: oneforallReady
                            ? "var(--bru-purple-20)"
                            : "rgba(231, 76, 60, 0.1)",
                          padding: "2px 6px",
                        }}
                      >
                        {oneforallReady ? "Active" : "No Key"}
                      </span>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 var(--bru-space-4) var(--bru-space-4)",
                      borderTop: "1px solid rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--bru-space-3)",
                    }}
                  >
                    {!isOneforall && (
                      <Button
                        size="sm"
                        variant="primary"
                        style={{
                          marginTop: "var(--bru-space-3)",
                          alignSelf: "flex-start",
                        }}
                        onClick={() => setActiveProvider("1forall")}
                      >
                        Set as Active
                      </Button>
                    )}
                    <div style={{ marginTop: "var(--bru-space-3)" }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--bru-grey)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: "var(--bru-space-2)",
                        }}
                      >
                        <Key size={12} /> API Key
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showOneforallKey ? "text" : "password"}
                          value={oneforallApiKey}
                          onChange={(e) => {
                            setOneforallApiKey(e.target.value);
                            setOneforallValidation({ state: "idle" });
                          }}
                          placeholder="Your 1ForAll API key"
                          className="bru-input"
                          style={{ width: "100%", paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOneforallKey((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--bru-grey)",
                            padding: 0,
                          }}
                        >
                          {showOneforallKey ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {oneforallValidation.state === "error" && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "#dc2626",
                            marginTop: 4,
                          }}
                        >
                          {oneforallValidation.message}
                        </p>
                      )}
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
                          <Loader size={12} className="animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Key"
                      )}
                    </Button>
                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--bru-grey)",
                          marginBottom: "var(--bru-space-2)",
                          display: "block",
                        }}
                      >
                        Model
                      </label>
                      {oneforallApiKey.trim() && (
                        <StraicoModelPicker
                          models={oneforallModels}
                          selectedModelId={oneforallModel}
                          onSelectModel={setOneforallModel}
                          loading={modelsLoading["1forall"]}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Save All button */}
        <Button
          variant="primary"
          block
          style={{ marginTop: "var(--bru-space-6)" }}
          onClick={() => void handleSaveAll()}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader size={16} className="animate-spin" />
              Saving & Validating...
            </>
          ) : (
            "Save & Validate All"
          )}
        </Button>
      </Card>

      {/* ── Brand Guidelines Card (full width) ── */}
      <Card variant="raised" style={{ marginTop: "var(--bru-space-6)" }}>
        <h2
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--bru-space-6)",
          }}
        >
          Brand Guidelines
        </h2>

        <div
          className="bru-form-row"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <div className="bru-field">
            <label htmlFor="copyGuideline" className="bru-field__label">
              Copy Guideline
            </label>
            <textarea
              id="copyGuideline"
              className="bru-input"
              style={{ width: "100%", minHeight: 120, resize: "vertical" }}
              value={profile?.copyGuideline ?? ""}
              onChange={(e) => updateField("copyGuideline", e.target.value)}
            />
          </div>
          <div className="bru-field">
            <label htmlFor="contentStrategy" className="bru-field__label">
              Content Strategy
            </label>
            <textarea
              id="contentStrategy"
              className="bru-input"
              style={{ width: "100%", minHeight: 120, resize: "vertical" }}
              value={profile?.contentStrategy ?? ""}
              onChange={(e) => updateField("contentStrategy", e.target.value)}
            />
          </div>
        </div>

        <div
          className="bru-field"
          style={{ marginBottom: "var(--bru-space-4)" }}
        >
          <label htmlFor="definition" className="bru-field__label">
            Brand Definition
          </label>
          <textarea
            id="definition"
            className="bru-input"
            style={{ width: "100%", minHeight: 120, resize: "vertical" }}
            value={profile?.definition ?? ""}
            onChange={(e) => updateField("definition", e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="primary"
            onClick={() => void handleSaveAll()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Guidelines"}
          </Button>
        </div>
      </Card>
    </>
  );
}
