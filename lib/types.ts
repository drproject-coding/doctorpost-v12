// --- AI Provider Types ---

export type AiProviderType = "claude" | "1forall" | "straico";

export interface AiModel {
  id: string;
  label: string;
  description?: string;
  maxTokens?: { min: number; max: number };
  wordLimit?: number;
  pricing?: { coins: number; words: number };
  creditsPerInputToken?: number;
  creditsPerOutputToken?: number;
  provider?: string;
  modelType?: string;
  editorsChoiceLevel?: number;
  applications?: string[];
  features?: string[];
  pros?: string[];
  cons?: string[];
  icon?: string;
  modelDate?: string;
  enabled?: boolean;
}

export interface AiProgress {
  step: string;
  percent: number;
}
export type OnProgress = (progress: AiProgress) => void;

export interface AiRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

export interface AiResponse {
  content: string;
  provider: AiProviderType;
}

export interface AiSettings {
  activeProvider: AiProviderType;
  claudeApiKey: string;
  straicoApiKey: string;
  straicoModel: string;
  oneforallApiKey: string;
  oneforallModel: string;
}

export interface StraicoUserInfo {
  coins: number;
  plan: string;
  firstName: string;
  lastName: string;
}

// --- Custom Pillar ---

export interface CustomPillar {
  id: string;
  label: string;
  description: string;
}

// --- Brand Profile ---

export interface BrandProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  aiProvider: AiProviderType;
  claudeApiKey: string;
  straicoApiKey: string;
  straicoModel: string;
  oneforallApiKey: string;
  oneforallModel: string;
  openAIKey?: string;
  industry: string;
  audience: string[];
  tones: string[];
  offers: string[];
  taboos: string[];
  styleGuide: {
    emoji: boolean;
    hashtags: number;
    links: string;
  };
  copyGuideline: string;
  contentStrategy: string;
  definition: string;
  positioning?: string;
  pillars?: string[];
  customPillars?: CustomPillar[];
  perplexityApiKey?: string;
  redditClientId?: string;
  redditClientSecret?: string;
}

// NCB session user shape
export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "to-review"
  | "to-plan"
  | "to-publish";

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledAt: string;
  pillar: string;
  status: PostStatus;
  userId?: string;
  /** Score from the Content Factory scoring agent (0-100) */
  factoryScore?: number;
}

export interface AnalyticsData {
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  ctr: number;
  topPerformingPillar: { name: string; value: number };
  topPerformingHook: { name: string; value: number };
  performanceByPillar: { name: string; impressions: number }[];
  trendingTopics: string[];
  creatorEngagement: {
    averageCommentsPerPost: number;
    averageReactionsPerPost: number;
    followerGrowthRate: number;
  };
}

export interface SubtopicSuggestion {
  id: string;
  text: string;
  source: string;
  relevanceScore?: number;
  searchVolume?: number;
}

export interface PostRecommendation {
  postType: string;
  hookPattern: string;
  contentPillar: string;
  toneId: string;
  confidence: number;
  reasoning: {
    postType: string;
    hookPattern: string;
    contentPillar: string;
    tone: string;
  };
  compatiblePostTypes: string[];
  compatibleHookPatterns: string[];
  compatibleContentPillars: string[];
  compatibleTones: string[];
}

export interface DropdownOption {
  id: string;
  value: string;
  label: string;
  category: string;
  description: string;
  exampleSnippet: string;
  useCases: string[];
  performanceIndicator?: "high" | "medium" | "experimental";
  isTrending?: boolean;
}

export type PerformanceIndicator = "high" | "medium" | "experimental";

export type CompatibilityStatus =
  | "recommended"
  | "caution"
  | "not-recommended"
  | "neutral";

export type CompatibilityMap = Record<string, CompatibilityInfo>;

export interface CompatibilityInfo {
  status: CompatibilityStatus;
  reason?: string;
}

export interface GeneratedPost {
  content: string;
  estimatedReadTime: number;
  hashtags?: string[];
}

export interface PostGenerationParameters {
  topic: string;
  audience: string[];
  coreTakeaway?: string;
  ctaGoal?: string;
  contentPillar: string;
  hookPattern: string;
  postType: string;
  toneId: string;
  triggerGeneration: number;
}

export interface TonePrompt {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
}
