import type { AiModel, AiSettings } from "./types";

export const ONEFORALL_MODELS: AiModel[] = [
  {
    id: "anthropic/claude-4-sonnet",
    label: "Claude 4 Sonnet",
    provider: "anthropic",
    creditsPerInputToken: 0.02,
    creditsPerOutputToken: 0.02,
  },
  {
    id: "claude_haiku",
    label: "Claude 3 Haiku (fast)",
    provider: "anthropic",
    creditsPerInputToken: 0.01,
    creditsPerOutputToken: 0.01,
  },
  {
    id: "claude_sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
    creditsPerInputToken: 0.02,
    creditsPerOutputToken: 0.02,
  },
  {
    id: "gpt-4.1-nano",
    label: "GPT-4.1 Nano (test)",
    provider: "openai",
    creditsPerInputToken: 0.01,
    creditsPerOutputToken: 0.01,
  },
];

export const STRAICO_MODELS: AiModel[] = [
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    maxTokens: { min: 1, max: 16384 },
    wordLimit: 100000,
    pricing: { coins: 0.5, words: 100 },
    provider: "openai",
    modelType: "chat",
    editorsChoiceLevel: -1,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    maxTokens: { min: 1, max: 8192 },
    wordLimit: 150000,
    pricing: { coins: 5, words: 100 },
    provider: "anthropic",
    modelType: "chat",
    editorsChoiceLevel: 2,
  },
  {
    id: "google/gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    maxTokens: { min: 1, max: 8192 },
    wordLimit: 75000,
    pricing: { coins: 0.3, words: 100 },
    provider: "google",
    modelType: "chat",
    editorsChoiceLevel: -1,
  },
];

export const AI_SETTINGS_DEFAULTS: AiSettings = {
  activeProvider: "claude",
  claudeApiKey: "",
  straicoApiKey: "",
  straicoModel: "openai/gpt-4o-mini",
  oneforallApiKey: "",
  oneforallModel: "anthropic/claude-4-sonnet",
};
