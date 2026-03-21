"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BrandProfile, AiProviderType } from "@/lib/types";

interface AiToolsSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  claude: "Claude",
  straico: "Straico",
  "1forall": "1ForAll",
};

function maskKey(key: string | undefined): string {
  if (!key || key.trim() === "") return "Not configured";
  const visible = key.slice(0, 4);
  return `${visible}${"•".repeat(16)}`;
}

function KeyField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="drp-field">
      <label className="drp-field__label" htmlFor={id}>
        {label}
      </label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <input
          id={id}
          type={show ? "text" : "password"}
          className="drp-input"
          style={{ width: "100%", paddingRight: "40px" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Enter API key"}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            color: "var(--drp-grey)",
          }}
          aria-label={show ? "Hide API key" : "Show API key"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

const ROW_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: "8px",
  alignItems: "baseline",
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--drp-font-primary)",
  fontSize: "var(--drp-text-md)",
  color: "var(--drp-black)",
};

const MONO_STYLE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "var(--drp-text-sm)",
  color: "var(--drp-grey)",
};

const NOT_SET = (
  <span
    style={{
      color: "var(--drp-grey-85)",
      fontStyle: "italic",
      fontSize: "var(--drp-text-sm)",
    }}
  >
    Not configured
  </span>
);

const PROVIDERS: AiProviderType[] = ["claude", "straico", "1forall"];

const AiToolsSection: React.FC<AiToolsSectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  if (!editing) {
    const providerLabel =
      PROVIDER_LABELS[profile.aiProvider] ?? profile.aiProvider;

    return (
      <div className="drp-form-stack">
        {/* Active provider */}
        <div style={ROW_STYLE}>
          <span className="drp-field__label">Provider</span>
          <span>
            <span
              style={{
                display: "inline-block",
                background: "var(--drp-purple)",
                color: "#fff",
                fontSize: "var(--drp-text-xs)",
                fontWeight: 700,
                padding: "2px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {providerLabel}
            </span>
          </span>
        </div>

        {/* Claude API key */}
        <div style={ROW_STYLE}>
          <span className="drp-field__label">Claude key</span>
          <span style={profile.claudeApiKey ? MONO_STYLE : VALUE_STYLE}>
            {profile.claudeApiKey ? maskKey(profile.claudeApiKey) : NOT_SET}
          </span>
        </div>

        {/* Straico API key */}
        <div style={ROW_STYLE}>
          <span className="drp-field__label">Straico key</span>
          <span style={profile.straicoApiKey ? MONO_STYLE : VALUE_STYLE}>
            {profile.straicoApiKey ? maskKey(profile.straicoApiKey) : NOT_SET}
          </span>
        </div>

        {/* Straico model (only if set) */}
        {profile.straicoModel && (
          <div style={ROW_STYLE}>
            <span className="drp-field__label">Straico model</span>
            <span style={VALUE_STYLE}>{profile.straicoModel}</span>
          </div>
        )}

        {/* 1ForAll API key */}
        <div style={ROW_STYLE}>
          <span className="drp-field__label">1ForAll key</span>
          <span style={profile.oneforallApiKey ? MONO_STYLE : VALUE_STYLE}>
            {profile.oneforallApiKey
              ? maskKey(profile.oneforallApiKey)
              : NOT_SET}
          </span>
        </div>

        {/* 1ForAll model (only if set) */}
        {profile.oneforallModel && (
          <div style={ROW_STYLE}>
            <span className="drp-field__label">1ForAll model</span>
            <span style={VALUE_STYLE}>{profile.oneforallModel}</span>
          </div>
        )}

        {/* Perplexity API key */}
        <div style={ROW_STYLE}>
          <span className="drp-field__label">Perplexity key</span>
          <span style={profile.perplexityApiKey ? MONO_STYLE : VALUE_STYLE}>
            {profile.perplexityApiKey
              ? maskKey(profile.perplexityApiKey)
              : NOT_SET}
          </span>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="drp-form-stack">
      {/* Provider selector */}
      <div className="drp-field">
        <label className="drp-field__label">AI Provider</label>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {PROVIDERS.map((p) => (
            <label
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontFamily: "var(--drp-font-primary)",
                fontSize: "var(--drp-text-md)",
                fontWeight: profile.aiProvider === p ? 700 : 400,
              }}
            >
              <input
                type="radio"
                name="aiProvider"
                value={p}
                checked={profile.aiProvider === p}
                onChange={() => onChange({ aiProvider: p })}
                style={{ accentColor: "var(--drp-purple)", cursor: "pointer" }}
              />
              {PROVIDER_LABELS[p]}
            </label>
          ))}
        </div>
      </div>

      {/* Claude API key */}
      <KeyField
        id="ai-claude-key"
        label="Claude API key"
        value={profile.claudeApiKey}
        onChange={(v) => onChange({ claudeApiKey: v })}
        placeholder="sk-ant-..."
      />

      {/* Straico */}
      <KeyField
        id="ai-straico-key"
        label="Straico API key"
        value={profile.straicoApiKey}
        onChange={(v) => onChange({ straicoApiKey: v })}
        placeholder="Straico API key"
      />
      <div className="drp-field">
        <label className="drp-field__label" htmlFor="ai-straico-model">
          Straico model
        </label>
        <input
          id="ai-straico-model"
          type="text"
          className="drp-input"
          style={{ width: "100%" }}
          value={profile.straicoModel}
          onChange={(e) => onChange({ straicoModel: e.target.value })}
          placeholder="e.g. openai/gpt-4o-mini"
        />
      </div>

      {/* 1ForAll */}
      <KeyField
        id="ai-oneforall-key"
        label="1ForAll API key"
        value={profile.oneforallApiKey}
        onChange={(v) => onChange({ oneforallApiKey: v })}
        placeholder="1ForAll API key"
      />
      <div className="drp-field">
        <label className="drp-field__label" htmlFor="ai-oneforall-model">
          1ForAll model
        </label>
        <input
          id="ai-oneforall-model"
          type="text"
          className="drp-input"
          style={{ width: "100%" }}
          value={profile.oneforallModel}
          onChange={(e) => onChange({ oneforallModel: e.target.value })}
          placeholder="e.g. anthropic/claude-4-sonnet"
        />
      </div>

      {/* Perplexity */}
      <KeyField
        id="ai-perplexity-key"
        label="Perplexity API key"
        value={profile.perplexityApiKey ?? ""}
        onChange={(v) => onChange({ perplexityApiKey: v || undefined })}
        placeholder="Perplexity API key"
      />
    </div>
  );
};

export default AiToolsSection;
