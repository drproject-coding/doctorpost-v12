"use client";
import React, { useState } from "react";
import { Button, Input } from "@doctorproject/react";
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
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <Input
          id={id}
          label={label}
          type={show ? "text" : "password"}
          style={{ width: "100%", paddingRight: "40px" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Enter API key"}
          autoComplete="off"
        />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute",
            right: "10px",
            bottom: "6px",
            padding: 0,
            color: "var(--drp-grey)",
          }}
          aria-label={show ? "Hide API key" : "Show API key"}
        >
          {show ? "⊘" : "⊙"}
        </Button>
      </div>
    </div>
  );
}

const ROW_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: "var(--drp-space-2)",
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
                color: "var(--drp-white)",
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
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-4)",
            flexWrap: "wrap",
          }}
        >
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
      <Input
        id="ai-straico-model"
        label="Straico model"
        type="text"
        value={profile.straicoModel}
        onChange={(e) => onChange({ straicoModel: e.target.value })}
        placeholder="e.g. openai/gpt-4o-mini"
      />

      {/* 1ForAll */}
      <KeyField
        id="ai-oneforall-key"
        label="1ForAll API key"
        value={profile.oneforallApiKey}
        onChange={(v) => onChange({ oneforallApiKey: v })}
        placeholder="1ForAll API key"
      />
      <Input
        id="ai-oneforall-model"
        label="1ForAll model"
        type="text"
        value={profile.oneforallModel}
        onChange={(e) => onChange({ oneforallModel: e.target.value })}
        placeholder="e.g. anthropic/claude-4-sonnet"
      />

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
