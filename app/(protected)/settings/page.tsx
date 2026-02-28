"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getBrandProfile, updateBrandProfile } from "@/lib/api";
import { BrandProfile, AiProviderType, AiModel, StraicoUserInfo } from "@/lib/types";
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

function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
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

  const [activeProvider, setActiveProvider] = useState<AiProviderType>("claude");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [straicoApiKey, setStraicoApiKey] = useState("");
  const [straicoModel, setStraicoModel] = useState("openai/gpt-4o-mini");
  const [oneforallApiKey, setOneforallApiKey] = useState("");
  const [oneforallModel, setOneforallModel] = useState("anthropic/claude-4-sonnet");

  // Show/hide key toggles
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showStraicoKey, setShowStraicoKey] = useState(false);
  const [showOneforallKey, setShowOneforallKey] = useState(false);

  // Expandable provider cards
  const [expandedProvider, setExpandedProvider] = useState<AiProviderType | null>(null);

  // Per-provider validation states
  const [claudeValidation, setClaudeValidation] = useState<ValidationState>({ state: "idle" });
  const [straicoValidation, setStraicoValidation] = useState<ValidationState>({ state: "idle" });
  const [oneforallValidation, setOneforallValidation] = useState<ValidationState>({ state: "idle" });

  // Dynamic model lists
  const [straicoModels, setStraicoModels] = useState<AiModel[]>([...STRAICO_MODELS]);
  const [oneforallModels, setOneforallModels] = useState<AiModel[]>([...ONEFORALL_MODELS]);
  const [modelsLoading, setModelsLoading] = useState<Record<string, boolean>>({});

  const [straicoUserInfo, setStraicoUserInfo] = useState<StraicoUserInfo | null>(null);

  // Fetch models when a provider card is expanded
  const loadModels = useCallback(
    async (provider: AiProviderType) => {
      if (provider === "claude") return;
      setModelsLoading((prev) => ({ ...prev, [provider]: true }));
      const apiKey = provider === "1forall" ? oneforallApiKey : straicoApiKey;
      const result = await fetchModels(provider, apiKey);
      if (provider === "1forall") {
        setOneforallModels(result.models.length > 0 ? result.models : [...ONEFORALL_MODELS]);
      } else {
        setStraicoModels(result.models.length > 0 ? result.models : [...STRAICO_MODELS]);
        if (apiKey) {
          fetchStraicoUserInfo(apiKey).then(setStraicoUserInfo).catch(() => {});
        }
      }
      setModelsLoading((prev) => ({ ...prev, [provider]: false }));
    },
    [oneforallApiKey, straicoApiKey],
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
        setOneforallApiKey(data.oneforallApiKey ?? "");
        setOneforallModel(data.oneforallModel ?? "anthropic/claude-4-sonnet");
        setProfileLoaded(true);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id]);

  // Auto-validate keys on initial load
  useEffect(() => {
    if (!profileLoaded) return;

    if (claudeApiKey.trim()) {
      setClaudeValidation({ state: "validating" });
      validateClaudeKey(claudeApiKey)
        .then(() => setClaudeValidation({ state: "valid" }))
        .catch((err) =>
          setClaudeValidation({
            state: "error",
            message: err instanceof Error ? err.message : "Validation failed",
          }),
        );
    }

    if (straicoApiKey.trim()) {
      setStraicoValidation({ state: "validating" });
      validateStraicoKey(straicoApiKey)
        .then(() => setStraicoValidation({ state: "valid" }))
        .catch((err) =>
          setStraicoValidation({
            state: "error",
            message: err instanceof Error ? err.message : "Validation failed",
          }),
        );
    }

    if (oneforallApiKey.trim()) {
      setOneforallValidation({ state: "validating" });
      validateOneForAllKey(oneforallApiKey)
        .then(() => setOneforallValidation({ state: "valid" }))
        .catch((err) =>
          setOneforallValidation({
            state: "error",
            message: err instanceof Error ? err.message : "Validation failed",
          }),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoaded]);

  const handleSaveAll = async () => {
    if (!profile) return;
    setSaving(true);

    const validations: Promise<void>[] = [];

    if (claudeApiKey.trim()) {
      setClaudeValidation({ state: "validating" });
      validations.push(
        validateClaudeKey(claudeApiKey)
          .then(() => setClaudeValidation({ state: "valid" }))
          .catch((err) => {
            setClaudeValidation({
              state: "error",
              message: err instanceof Error ? err.message : "Validation failed",
            });
          }),
      );
    } else {
      setClaudeValidation({ state: "idle" });
    }

    if (straicoApiKey.trim()) {
      setStraicoValidation({ state: "validating" });
      validations.push(
        validateStraicoKey(straicoApiKey)
          .then(() => setStraicoValidation({ state: "valid" }))
          .catch((err) => {
            setStraicoValidation({
              state: "error",
              message: err instanceof Error ? err.message : "Validation failed",
            });
          }),
      );
    } else {
      setStraicoValidation({ state: "idle" });
    }

    if (oneforallApiKey.trim()) {
      setOneforallValidation({ state: "validating" });
      validations.push(
        validateOneForAllKey(oneforallApiKey)
          .then(() => setOneforallValidation({ state: "valid" }))
          .catch((err) => {
            setOneforallValidation({
              state: "error",
              message: err instanceof Error ? err.message : "Validation failed",
            });
          }),
      );
    } else {
      setOneforallValidation({ state: "idle" });
    }

    try {
      const updatedProfile: BrandProfile = {
        ...profile,
        aiProvider: activeProvider,
        claudeApiKey,
        straicoApiKey,
        straicoModel,
        oneforallApiKey,
        oneforallModel,
      };
      await Promise.all([updateBrandProfile(updatedProfile), ...validations]);
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to save settings:", error);
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

  function statusLabel(validation: ValidationState, configured: boolean): string {
    if (validation.state === "valid") return "Verified";
    if (validation.state === "validating") return "Verifying...";
    if (validation.state === "error") return "Invalid key";
    if (configured) return "Not verified";
    return "Not configured";
  }

  if (loading) {
    return (
      <div
        className="bru-card bru-card--raised"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}
      >
        <p>Loading settings...</p>
      </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--bru-space-2)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}>Claude:</span>
          <StatusBadge
            connected={claudeValidation.state === "valid"}
            label={statusLabel(claudeValidation, !!claudeApiKey.trim())}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--bru-space-2)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}>Straico:</span>
          <StatusBadge
            connected={straicoValidation.state === "valid"}
            label={statusLabel(straicoValidation, !!straicoApiKey.trim())}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--bru-space-2)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--bru-grey)" }}>1ForAll:</span>
          <StatusBadge
            connected={oneforallValidation.state === "valid"}
            label={statusLabel(oneforallValidation, !!oneforallApiKey.trim())}
          />
        </div>
      </div>

      {/* Main 2-column grid: Brand Profile (2/3) + AI Provider (1/3) */}
      <div
        className="settings-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--bru-space-6)",
        }}
      >
        {/* ── Brand Profile Card ── */}
        <div className="bru-card bru-card--raised">
          <h2
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-6)",
            }}
          >
            Brand Profile
          </h2>

          <div className="bru-form-row" style={{ marginBottom: "var(--bru-space-4)" }}>
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

          <div className="bru-form-row" style={{ marginBottom: "var(--bru-space-4)" }}>
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

          <div className="bru-field" style={{ marginBottom: "var(--bru-space-4)" }}>
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

          <div className="bru-field" style={{ marginBottom: "var(--bru-space-4)" }}>
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
                  <span style={{ fontSize: "var(--bru-text-md)", fontWeight: 500 }}>
                    {audience}
                  </span>
                  <button className="bru-btn bru-btn--sm">Edit</button>
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

          <button
            className="bru-btn bru-btn--primary"
            onClick={() => void handleSaveAll()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* ── AI Providers Card ── */}
        <div className="bru-card bru-card--raised">
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
                      ? "rgba(174, 122, 255, 0.05)"
                      : "var(--bru-white)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedProvider(isExpanded ? null : "claude")}
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
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span style={{ fontSize: "var(--bru-text-md)", fontWeight: 700 }}>
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
                            color: "var(--bru-purple)",
                            background: "rgba(174, 122, 255, 0.1)",
                            padding: "2px 6px",
                          }}
                        >
                          Active
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
                        <button
                          className="bru-btn bru-btn--sm bru-btn--primary"
                          style={{ marginTop: "var(--bru-space-3)", alignSelf: "flex-start" }}
                          onClick={() => setActiveProvider("claude")}
                        >
                          Set as Active
                        </button>
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
                            {showClaudeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {claudeValidation.state === "error" && (
                          <p style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>
                            {claudeValidation.message}
                          </p>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--bru-grey)" }}>
                        Claude uses direct browser API — model selection is automatic (Claude
                        Sonnet 4.5).
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
                      ? "rgba(174, 122, 255, 0.05)"
                      : "var(--bru-white)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = isExpanded ? null : ("straico" as AiProviderType);
                      setExpandedProvider(next);
                      if (next === "straico") void loadModels("straico");
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
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span style={{ fontSize: "var(--bru-text-md)", fontWeight: 700 }}>
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
                            color: "var(--bru-purple)",
                            background: "rgba(174, 122, 255, 0.1)",
                            padding: "2px 6px",
                          }}
                        >
                          Active
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
                        <button
                          className="bru-btn bru-btn--sm bru-btn--primary"
                          style={{ marginTop: "var(--bru-space-3)", alignSelf: "flex-start" }}
                          onClick={() => setActiveProvider("straico")}
                        >
                          Set as Active
                        </button>
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
                            {showStraicoKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {straicoValidation.state === "error" && (
                          <p style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>
                            {straicoValidation.message}
                          </p>
                        )}
                      </div>
                      <StraicoModelPicker
                        models={straicoModels}
                        selectedModelId={straicoModel}
                        onSelectModel={(id) => setStraicoModel(id)}
                        loading={modelsLoading["straico"]}
                        userInfo={straicoUserInfo}
                      />
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
                      ? "rgba(174, 122, 255, 0.05)"
                      : "var(--bru-white)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = isExpanded ? null : ("1forall" as AiProviderType);
                      setExpandedProvider(next);
                      if (next === "1forall") void loadModels("1forall");
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
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span style={{ fontSize: "var(--bru-text-md)", fontWeight: 700 }}>
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
                            color: "var(--bru-purple)",
                            background: "rgba(174, 122, 255, 0.1)",
                            padding: "2px 6px",
                          }}
                        >
                          Active
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
                        <button
                          className="bru-btn bru-btn--sm bru-btn--primary"
                          style={{ marginTop: "var(--bru-space-3)", alignSelf: "flex-start" }}
                          onClick={() => setActiveProvider("1forall")}
                        >
                          Set as Active
                        </button>
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
                            {showOneforallKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {oneforallValidation.state === "error" && (
                          <p style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>
                            {oneforallValidation.message}
                          </p>
                        )}
                      </div>
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
                        <div style={{ position: "relative" }}>
                          <select
                            value={oneforallModel}
                            onChange={(e) => setOneforallModel(e.target.value)}
                            className="bru-select"
                            style={{ width: "100%" }}
                            disabled={modelsLoading["1forall"]}
                          >
                            {oneforallModels.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                          {modelsLoading["1forall"] && (
                            <Loader
                              size={14}
                              className="animate-spin"
                              style={{
                                position: "absolute",
                                right: 32,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--bru-purple)",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Save All button */}
          <button
            className="bru-btn bru-btn--primary bru-btn--block"
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
          </button>

          {/* LinkedIn Integration */}
          <div className="bru-field" style={{ marginTop: "var(--bru-space-8)" }}>
            <label className="bru-field__label">LinkedIn Integration</label>
            <div
              style={{
                border: "var(--bru-border)",
                padding: "var(--bru-space-3)",
                background: "var(--bru-cream)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--bru-space-2)",
              }}
            >
              <p style={{ fontSize: "var(--bru-text-md)", fontWeight: 500 }}>
                Status: Not Connected
              </p>
              <button className="bru-btn bru-btn--primary bru-btn--block">
                Connect LinkedIn
              </button>
            </div>
          </div>

          {/* Notifications */}
          <h3
            style={{
              fontSize: "var(--bru-text-h6)",
              fontWeight: 700,
              marginTop: "var(--bru-space-8)",
              marginBottom: "var(--bru-space-4)",
            }}
          >
            Notifications
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--bru-space-3)",
            }}
          >
            <label className="bru-checkbox">
              <input type="checkbox" id="emailNotif" />
              Email Notifications
            </label>
            <label className="bru-checkbox">
              <input type="checkbox" id="slackNotif" />
              Slack Notifications
            </label>
          </div>
        </div>
      </div>

      {/* ── Brand Guidelines Card (full width) ── */}
      <div className="bru-card bru-card--raised" style={{ marginTop: "var(--bru-space-6)" }}>
        <h2
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--bru-space-6)",
          }}
        >
          Brand Guidelines
        </h2>

        <div className="bru-form-row" style={{ marginBottom: "var(--bru-space-4)" }}>
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

        <div className="bru-field" style={{ marginBottom: "var(--bru-space-4)" }}>
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
          <button
            className="bru-btn bru-btn--primary"
            onClick={() => void handleSaveAll()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Guidelines"}
          </button>
        </div>
      </div>
    </>
  );
}
