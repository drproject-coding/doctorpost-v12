"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@bruddle/react";
import { getBrandProfile, updateBrandProfile } from "@/lib/api";
import type { BrandProfile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESET_TONES = [
  "Authoritative",
  "Analytical",
  "Direct",
  "Challenger",
  "Storyteller",
  "Educational",
  "Inspirational",
  "Practical",
  "Conversational",
  "Witty",
  "Empathetic",
  "Visionary",
];

const PRESET_TABOOS = [
  "Vague",
  "Corporate-speak",
  "Fluffy",
  "Passive",
  "Clichéd",
  "Salesy",
  "Overly formal",
  "Jargon-heavy",
];

const TOTAL_STEPS = 5;

// ---------------------------------------------------------------------------
// Tag Input
// ---------------------------------------------------------------------------

interface TagInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "8px 10px",
        border: "1.5px solid var(--bru-grey)",
        background: "#fff",
        minHeight: "44px",
        alignItems: "center",
      }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 10px 2px 10px",
            background: "var(--bru-purple)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Remove ${tag}`}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "0 0 0 4px",
              fontSize: "14px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : ""}
        style={{
          border: "none",
          outline: "none",
          flex: 1,
          minWidth: "120px",
          fontSize: "14px",
          background: "transparent",
          color: "var(--bru-black)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chip selector
// ---------------------------------------------------------------------------

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  min?: number;
  max?: number;
}

function ChipSelector({ options, selected, onChange, max }: ChipSelectorProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      if (max !== undefined && selected.length >= max) return;
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            style={{
              padding: "6px 14px",
              border: `1.5px solid ${active ? "var(--bru-purple)" : "var(--bru-grey)"}`,
              background: active ? "var(--bru-purple)" : "#fff",
              color: active ? "#fff" : "var(--bru-black)",
              cursor:
                max !== undefined && selected.length >= max && !active
                  ? "not-allowed"
                  : "pointer",
              fontSize: "13px",
              fontWeight: active ? 600 : 400,
              opacity:
                max !== undefined && selected.length >= max && !active
                  ? 0.45
                  : 1,
              transition: "all 0.12s ease",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

interface LabeledFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function LabeledField({ label, error, children, hint }: LabeledFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontWeight: 600,
          fontSize: "13px",
          color: "var(--bru-black)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {hint && (
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "var(--bru-grey)",
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p style={{ margin: 0, fontSize: "12px", color: "#e53e3e" }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid var(--bru-grey)",
  outline: "none",
  fontSize: "14px",
  background: "#fff",
  color: "var(--bru-black)",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "96px",
  fontFamily: "inherit",
  lineHeight: 1.6,
};

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEP_TITLES: Record<number, string> = {
  1: "Your Identity",
  2: "Voice & Tone",
  3: "Content Pillars",
  4: "Target Audience",
  5: "Bio & Positioning",
};

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Tell us who you are. This information personalises your content strategy and brand voice.",
  2: "Define how you communicate. Your tone and taboos shape every piece of content you produce.",
  3: "Clarify the themes and uniqueness of your content so the AI can stay on-brand.",
  4: "Describe the people you serve and what you offer them.",
  5: "Capture how you position yourself in the market. This becomes the north star of your messaging.",
};

// ---------------------------------------------------------------------------
// Step 1: Identity
// ---------------------------------------------------------------------------

interface Step1State {
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  industry: string;
}

interface Step1Errors {
  firstName?: string;
}

function Step1({
  state,
  onChange,
  errors,
}: {
  state: Step1State;
  onChange: (s: Step1State) => void;
  errors: Step1Errors;
}) {
  const set =
    (key: keyof Step1State) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...state, [key]: e.target.value });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <LabeledField label="First Name" error={errors.firstName}>
          <input
            style={{
              ...inputStyle,
              borderColor: errors.firstName ? "#e53e3e" : "var(--bru-grey)",
            }}
            value={state.firstName}
            onChange={set("firstName")}
            placeholder="Jane"
            autoFocus
          />
        </LabeledField>
        <LabeledField label="Last Name">
          <input
            style={inputStyle}
            value={state.lastName}
            onChange={set("lastName")}
            placeholder="Smith"
          />
        </LabeledField>
      </div>
      <LabeledField label="Company / Brand Name">
        <input
          style={inputStyle}
          value={state.companyName}
          onChange={set("companyName")}
          placeholder="Acme Corp"
        />
      </LabeledField>
      <LabeledField label="Your Role / Title">
        <input
          style={inputStyle}
          value={state.role}
          onChange={set("role")}
          placeholder="Head of Marketing"
        />
      </LabeledField>
      <LabeledField label="Industry">
        <input
          style={inputStyle}
          value={state.industry}
          onChange={set("industry")}
          placeholder="SaaS / Healthcare / Finance…"
        />
      </LabeledField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Voice & Tone
// ---------------------------------------------------------------------------

interface Step2State {
  tones: string[];
  taboos: string[];
  copyGuideline: string;
}

interface Step2Errors {
  tones?: string;
}

function Step2({
  state,
  onChange,
  errors,
}: {
  state: Step2State;
  onChange: (s: Step2State) => void;
  errors: Step2Errors;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <LabeledField
        label="Tones (select 3–5)"
        hint="Choose the tones that best represent your communication style."
        error={errors.tones}
      >
        <ChipSelector
          options={PRESET_TONES}
          selected={state.tones}
          onChange={(tones) => onChange({ ...state, tones })}
          max={5}
        />
      </LabeledField>

      <LabeledField
        label="Taboos (select 2–4)"
        hint="Select writing styles you want to avoid."
      >
        <ChipSelector
          options={PRESET_TABOOS}
          selected={state.taboos}
          onChange={(taboos) => onChange({ ...state, taboos })}
          max={4}
        />
      </LabeledField>

      <LabeledField
        label="Copy Guideline"
        hint="Any additional instructions for your writing style (optional)."
      >
        <textarea
          style={textareaStyle}
          value={state.copyGuideline}
          onChange={(e) =>
            onChange({ ...state, copyGuideline: e.target.value })
          }
          placeholder="e.g. Always lead with data. Keep sentences under 20 words. Never use passive voice."
        />
      </LabeledField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Content Pillars
// ---------------------------------------------------------------------------

interface Step3State {
  contentStrategy: string;
  definition: string;
}

interface Step3Errors {
  contentStrategy?: string;
}

function Step3({
  state,
  onChange,
  errors,
}: {
  state: Step3State;
  onChange: (s: Step3State) => void;
  errors: Step3Errors;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <LabeledField
        label="Content Strategy"
        hint="Describe your main content themes and topics."
        error={errors.contentStrategy}
      >
        <textarea
          style={{
            ...textareaStyle,
            borderColor: errors.contentStrategy ? "#e53e3e" : "var(--bru-grey)",
          }}
          value={state.contentStrategy}
          onChange={(e) =>
            onChange({ ...state, contentStrategy: e.target.value })
          }
          placeholder="e.g. I cover AI productivity, leadership lessons from startup failures, and data-driven marketing tactics."
        />
      </LabeledField>

      <LabeledField
        label="Brand Definition"
        hint="What makes your content unique? How do you define value?"
      >
        <textarea
          style={textareaStyle}
          value={state.definition}
          onChange={(e) => onChange({ ...state, definition: e.target.value })}
          placeholder="e.g. I translate complex technical concepts into actionable frameworks that non-technical executives can implement immediately."
        />
      </LabeledField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Audience (ICP)
// ---------------------------------------------------------------------------

interface Step4State {
  audience: string[];
  offers: string[];
}

interface Step4Errors {
  audience?: string;
}

function Step4({
  state,
  onChange,
  errors,
}: {
  state: Step4State;
  onChange: (s: Step4State) => void;
  errors: Step4Errors;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <LabeledField
        label="Target Audience"
        hint="Type an audience segment and press Enter or comma to add it."
        error={errors.audience}
      >
        <TagInput
          value={state.audience}
          onChange={(audience) => onChange({ ...state, audience })}
          placeholder="e.g. B2B SaaS founders, VP of Marketing…"
        />
      </LabeledField>

      <LabeledField
        label="Key Offers / Services"
        hint="What products or services do you offer? Press Enter or comma to add."
      >
        <TagInput
          value={state.offers}
          onChange={(offers) => onChange({ ...state, offers })}
          placeholder="e.g. Consulting, Online Course, Newsletter…"
        />
      </LabeledField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Bio & Positioning
// ---------------------------------------------------------------------------

interface Step5State {
  positioning: string;
}

interface Step5Errors {
  positioning?: string;
}

function Step5({
  state,
  onChange,
  errors,
}: {
  state: Step5State;
  onChange: (s: Step5State) => void;
  errors: Step5Errors;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <LabeledField
        label="Positioning Statement"
        hint="How do you describe your value? This is often the first sentence of your LinkedIn bio."
        error={errors.positioning}
      >
        <textarea
          style={{
            ...textareaStyle,
            minHeight: "128px",
            borderColor: errors.positioning ? "#e53e3e" : "var(--bru-grey)",
          }}
          value={state.positioning}
          onChange={(e) => onChange({ ...state, positioning: e.target.value })}
          placeholder="e.g. I help B2B SaaS companies grow from $1M to $10M ARR by building content-led demand engines — without paid ads."
        />
      </LabeledField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--bru-grey)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span>
          Step {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "3px",
          background: "var(--bru-grey)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: "var(--bru-purple)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function WizardStepPage({
  params,
}: {
  params: Promise<{ step: string }> | { step: string };
}) {
  const resolvedParams =
    "then" in params ? use(params as Promise<{ step: string }>) : params;
  const step = Math.min(
    Math.max(parseInt(resolvedParams.step, 10) || 1, 1),
    TOTAL_STEPS,
  );
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Step-local states
  const [step1, setStep1] = useState<Step1State>({
    firstName: "",
    lastName: "",
    companyName: "",
    role: "",
    industry: "",
  });
  const [step2, setStep2] = useState<Step2State>({
    tones: [],
    taboos: [],
    copyGuideline: "",
  });
  const [step3, setStep3] = useState<Step3State>({
    contentStrategy: "",
    definition: "",
  });
  const [step4, setStep4] = useState<Step4State>({ audience: [], offers: [] });
  const [step5, setStep5] = useState<Step5State>({ positioning: "" });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile once on mount
  useEffect(() => {
    let cancelled = false;
    getBrandProfile("")
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setStep1({
          firstName: p.firstName,
          lastName: p.lastName,
          companyName: p.companyName,
          role: p.role,
          industry: p.industry,
        });
        setStep2({
          tones: p.tones,
          taboos: p.taboos,
          copyGuideline: p.copyGuideline,
        });
        setStep3({
          contentStrategy: p.contentStrategy,
          definition: p.definition,
        });
        setStep4({ audience: p.audience, offers: p.offers });
        setStep5({ positioning: p.positioning ?? "" });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load profile.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Validate current step, returns true if valid
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !step1.firstName.trim()) {
      errs.firstName = "First name is required.";
    }
    if (step === 2 && step2.tones.length === 0) {
      errs.tones = "Select at least one tone.";
    }
    if (step === 3 && !step3.contentStrategy.trim()) {
      errs.contentStrategy = "Content strategy is required.";
    }
    if (step === 4 && step4.audience.length === 0) {
      errs.audience = "Add at least one target audience.";
    }
    if (step === 5 && !step5.positioning.trim()) {
      errs.positioning = "Positioning statement is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildUpdatedProfile = (): BrandProfile => {
    const base = profile ?? {
      id: "",
      name: "",
      firstName: "",
      lastName: "",
      companyName: "",
      role: "",
      aiProvider: "claude" as const,
      claudeApiKey: "",
      straicoApiKey: "",
      straicoModel: "openai/gpt-4o-mini",
      oneforallApiKey: "",
      oneforallModel: "anthropic/claude-4-sonnet",
      industry: "",
      audience: [],
      tones: [],
      offers: [],
      taboos: [],
      styleGuide: { emoji: true, hashtags: 3, links: "end" },
      copyGuideline: "",
      contentStrategy: "",
      definition: "",
      positioning: "",
    };

    const merged: BrandProfile = {
      ...base,
      firstName: step1.firstName,
      lastName: step1.lastName,
      companyName: step1.companyName,
      role: step1.role,
      industry: step1.industry,
      tones: step2.tones,
      taboos: step2.taboos,
      copyGuideline: step2.copyGuideline,
      contentStrategy: step3.contentStrategy,
      definition: step3.definition,
      audience: step4.audience,
      offers: step4.offers,
      positioning: step5.positioning,
    };

    const firstName = merged.firstName.trim();
    const lastName = merged.lastName.trim();
    merged.name =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : merged.companyName || "N/A";

    return merged;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updated = buildUpdatedProfile();
      const saved = await updateBrandProfile(updated);
      setProfile(saved);

      if (step < TOTAL_STEPS) {
        router.push(`/onboarding/wizard/${step + 1}`);
      } else {
        router.push("/onboarding/review");
      }
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step <= 1) {
      router.push("/onboarding/start");
    } else {
      router.push(`/onboarding/wizard/${step - 1}`);
    }
  };

  // Loading state
  if (!profile && !loadError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bru-cream)",
        }}
      >
        <p style={{ color: "var(--bru-grey)", fontSize: "14px" }}>Loading…</p>
      </div>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bru-cream)",
          padding: "24px",
        }}
      >
        <Card style={{ maxWidth: "480px", width: "100%", padding: "32px" }}>
          <p style={{ color: "#e53e3e", marginBottom: "16px" }}>{loadError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bru-cream)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Progress */}
        <ProgressBar current={step} total={TOTAL_STEPS} />

        <Card
          style={{
            padding: "36px 40px",
            marginTop: "16px",
            border: "1.5px solid var(--bru-black)",
            background: "#fff",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--bru-black)",
                letterSpacing: "-0.02em",
              }}
            >
              Step {step}: {STEP_TITLES[step]}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--bru-grey)",
                lineHeight: 1.5,
              }}
            >
              {STEP_DESCRIPTIONS[step]}
            </p>
          </div>

          {/* Step content */}
          {step === 1 && (
            <Step1
              state={step1}
              onChange={setStep1}
              errors={{ firstName: errors.firstName }}
            />
          )}
          {step === 2 && (
            <Step2
              state={step2}
              onChange={setStep2}
              errors={{ tones: errors.tones }}
            />
          )}
          {step === 3 && (
            <Step3
              state={step3}
              onChange={setStep3}
              errors={{ contentStrategy: errors.contentStrategy }}
            />
          )}
          {step === 4 && (
            <Step4
              state={step4}
              onChange={setStep4}
              errors={{ audience: errors.audience }}
            />
          )}
          {step === 5 && (
            <Step5
              state={step5}
              onChange={setStep5}
              errors={{ positioning: errors.positioning }}
            />
          )}

          {/* Save error */}
          {saveError && (
            <p
              style={{
                marginTop: "16px",
                marginBottom: 0,
                fontSize: "13px",
                color: "#e53e3e",
              }}
            >
              {saveError}
            </p>
          )}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "32px",
              gap: "12px",
            }}
          >
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={saving}
              style={{ minWidth: "110px" }}
            >
              ← Back
            </Button>

            <Button
              onClick={handleContinue}
              disabled={saving}
              style={{ minWidth: "140px" }}
            >
              {saving
                ? "Saving…"
                : step === TOTAL_STEPS
                  ? "Finish →"
                  : "Continue →"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
