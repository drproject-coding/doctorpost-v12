import type { AiModel, AiSettings } from "./types";

export const ONEFORALL_MODELS: AiModel[] = [
  { id: "anthropic/claude-4-sonnet", label: "Claude 4 Sonnet" },
  { id: "claude_haiku", label: "Claude 3 Haiku (fast)" },
  { id: "claude_sonnet", label: "Claude 3.5 Sonnet" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano (test)" },
];

export const STRAICO_MODELS: AiModel[] = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "meta-llama/llama-3.3-70b", label: "Llama 3.3 70B" },
];

export const AI_SETTINGS_DEFAULTS: AiSettings = {
  activeProvider: "claude",
  claudeApiKey: "",
  straicoApiKey: "",
  straicoModel: "openai/gpt-4o-mini",
  oneforallApiKey: "",
  oneforallModel: "anthropic/claude-4-sonnet",
};
