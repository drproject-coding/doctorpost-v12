import { ReactNode } from 'react';

export interface BrandProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  openAIKey: string;
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
}

// New User interface for authenticated user data
export interface User {
  id: string;
  googleId?: string;
  email?: string;
  name?: string;
  picture?: string;
  // Include other relevant profile fields if needed for the authenticated user object
  firstName?: string;
  lastName?: string;
  companyName?: string;
  role?: string;
  industry?: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'to-review' | 'to-plan' | 'to-publish';

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledAt: string;
  pillar: string;
  status: PostStatus;
  userId?: string; // Optional, will be added by backend
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
  performanceIndicator?: 'high' | 'medium' | 'experimental';
  isTrending?: boolean;
}

export type PerformanceIndicator = 'high' | 'medium' | 'experimental';

export type CompatibilityStatus = 'recommended' | 'caution' | 'not-recommended' | 'neutral';

export type CompatibilityMap = Record<string, CompatibilityInfo>; // Changed to Record type

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