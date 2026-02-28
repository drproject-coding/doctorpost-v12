// Centralized type definitions for the DoctorPost application

export type PostType = 'Story' | 'Insight' | 'How-To' | 'Contrarian' | 'List' | 'Case Study' | 'Question';
export type HookPattern = 'Curiosity Gap' | 'Social Proof' | 'Contrarian' | 'Problem-Agitate-Solve' | 'Authority/Insight' | 'Educational/Framework';
export type CtaIntent = 'LeadGen' | 'Engagement' | 'WebsiteVisit' | 'Follow';
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface PostGenerationRequest {
  brandId: string;
  pillarId: string;
  postType: PostType;
  hookPattern: HookPattern;
  topic: string;
  tone: string;
  ctaIntent: CtaIntent;
  hashtags?: string[];
}

export interface PostGenerationResponse {
  variantA: string;
  variantB: string;
  hashtags: string[];
  warnings: string[];
}

export interface BrandProfile {
  id: string;
  name: string;
  industry: string;
  audience: string[];
  tones: string[];
  offers: string[];
  taboos: string[];
  styleGuide: { emoji: boolean; hashtags: number; links: string };
}

export interface Pillar {
  id: string;
  name: string;
  goal: string;
  topics: string[];
}

export interface PostDraft {
  id: string;
  brandId: string;
  pillarId: string;
  postType: PostType;
  hookPattern: HookPattern;
  topic: string;
  tone: string;
  ctaIntent: CtaIntent;
  body: string;
  hashtags: string[];
  warnings: string[];
  status: PostStatus;
  scheduledAt?: string; // ISO 8601 date string
}

export interface ScheduledPost {
  id: string;
  title: string;
  scheduledAt: string; // ISO 8601 date string
  status: PostStatus;
  pillar: string;
}

export interface AnalyticsData {
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  ctr: number;
  topPerformingPillar: { name: string; value: number };
  topPerformingHook: { name: HookPattern; value: number };
  performanceByPillar: { name: string; impressions: number }[];
}