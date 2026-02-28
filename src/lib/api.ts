import { BrandProfile, ScheduledPost, AnalyticsData, SubtopicSuggestion, PostRecommendation, DropdownOption, PostStatus, User } from './types';
// Removed: import { JwtPayload } from 'jwt-decode'; // JwtPayload is not directly used here
// Removed: import fetch from 'node-fetch'; // For OpenAI validation and Google token verification
// import jwt from 'jsonwebtoken'; // Removed: Not used client-side

// Base URL for the new backend API
const API_BASE_URL = 'http://localhost:3001/api'; // Ensure this matches your Express server port

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('app_token');

// --- API Functions (Real Backend Calls) ---

export const googleAuthLogin = async (id_token: string): Promise<{ token: string; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token }),
  });

  if (!response.ok) {
    const errorData: { message?: string } = await response.json() as { message?: string }; // Explicitly type errorData
    throw new Error(errorData.message ?? 'Failed to authenticate with Google.'); // Use nullish coalescing
  }
  const data: { token: string; user: User } = await response.json() as { token: string; user: User }; // Explicitly type data
  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_BASE_URL}/user/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData: { message?: string } = await response.json() as { message?: string };
    throw new Error(errorData.message ?? 'Failed to fetch current user.');
  }
  const data: User = await response.json() as User;
  return data;
};

// Define a type for the raw user data from Prisma to map to BrandProfile
interface PrismaUserResponse {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  role?: string | null;
  openAIKey?: string | null;
  industry?: string | null;
  audience?: string[];
  tones?: string[];
  offers?: string[];
  taboos?: string[];
  styleGuideEmoji?: boolean;
  styleGuideHashtags?: number;
  styleGuideLinks?: string;
  copyGuideline?: string | null;
  contentStrategy?: string | null;
  definition?: string | null;
}

export const getBrandProfile = async (id: string): Promise<BrandProfile> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch brand profile: ${response.statusText}`);
  }
  const data: PrismaUserResponse = await response.json() as PrismaUserResponse;
  // Map Prisma User model to Frontend BrandProfile type
  return {
    id: data.id,
    name: (data.firstName && data.lastName) ? `${data.firstName} ${data.lastName}` : (data.companyName ?? 'N/A'),
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    companyName: data.companyName ?? '',
    role: data.role ?? '',
    openAIKey: data.openAIKey ?? '',
    industry: data.industry ?? '',
    audience: data.audience ?? [],
    tones: data.tones ?? [],
    offers: data.offers ?? [],
    taboos: data.taboos ?? [],
    styleGuide: {
      emoji: data.styleGuideEmoji ?? true,
      hashtags: data.styleGuideHashtags ?? 3,
      links: data.styleGuideLinks ?? "end",
    },
    copyGuideline: data.copyGuideline ?? '',
    contentStrategy: data.contentStrategy ?? '',
    definition: data.definition ?? '',
  };
};

export const updateBrandProfile = async (profile: BrandProfile): Promise<BrandProfile> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/profile/${profile.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName: profile.firstName,
            lastName: profile.lastName,
      companyName: profile.companyName,
      role: profile.role,
      industry: profile.industry,
      audience: profile.audience,
      tones: profile.tones,
      offers: profile.offers,
      taboos: profile.taboos,
      styleGuideEmoji: profile.styleGuide.emoji,
      styleGuideHashtags: profile.styleGuide.hashtags,
      styleGuideLinks: profile.styleGuide.links,
      copyGuideline: profile.copyGuideline,
      contentStrategy: profile.contentStrategy,
      definition: profile.definition,
      openAIKey: profile.openAIKey, // Send the key for update
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update brand profile: ${response.statusText}`);
  }
  const data: PrismaUserResponse = await response.json() as PrismaUserResponse;
  return {
    id: data.id,
    name: (data.firstName && data.lastName) ? `${data.firstName} ${data.lastName}` : (data.companyName ?? 'N/A'),
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    companyName: data.companyName ?? '',
    role: data.role ?? '',
    openAIKey: data.openAIKey ?? '',
    industry: data.industry ?? '',
    audience: data.audience ?? [],
    tones: data.tones ?? [],
    offers: data.offers ?? [],
    taboos: data.taboos ?? [],
    styleGuide: {
      emoji: data.styleGuideEmoji ?? true,
      hashtags: data.styleGuideHashtags ?? 3,
      links: data.styleGuideLinks ?? "end",
    },
    copyGuideline: data.copyGuideline ?? '',
    contentStrategy: data.contentStrategy ?? '',
    definition: data.definition ?? '',
  };
};

export const getScheduledPosts = async (): Promise<ScheduledPost[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/posts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch scheduled posts: ${response.statusText}`);
  }
  const data: ScheduledPost[] = await response.json() as ScheduledPost[];
  return data;
};

export const updatePost = async (updatedPost: ScheduledPost): Promise<ScheduledPost> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/posts/${updatedPost.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: updatedPost.title,
      content: updatedPost.content,
      scheduledAt: updatedPost.scheduledAt,
      pillar: updatedPost.pillar,
      status: updatedPost.status,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update post: ${response.statusText}`);
  }
  const data: ScheduledPost = await response.json() as ScheduledPost;
  return data;
};

export const savePostDraft = async (post: ScheduledPost): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      scheduledAt: post.scheduledAt,
      pillar: post.pillar,
      status: 'draft', // Always save as draft
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save draft: ${response.statusText}`);
  }
};

export const schedulePost = async (post: ScheduledPost): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      scheduledAt: post.scheduledAt,
      pillar: post.pillar,
      status: post.status, // Use the status provided (e.g., 'scheduled', 'to-publish')
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to schedule post: ${response.statusText}`);
  }
};

export const getAnalytics = async (userId: string): Promise<AnalyticsData> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/analytics/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }
  const data: AnalyticsData = await response.json() as AnalyticsData;
  return data;
};

export const validateOpenAIKey = async (key: string): Promise<{ success: boolean; message: string; timestamp?: string }> => {
  const token = getAuthToken();
  try {
    const proxyResponse = await fetch(`${API_BASE_URL}/validate-openai-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ openAIKey: key }),
    });

    const data: { success: boolean; message: string; timestamp?: string; error?: { message: string } } = await proxyResponse.json() as { success: boolean; message: string; timestamp?: string; error?: { message: string } };
    return data;
  } catch (error) {
    console.error('Error calling OpenAI validation proxy:', error);
    return {
      success: false,
      message: 'Could not connect to validation service. Please check your network or try again.',
    };
  }
};

// --- Mock Data for Dropdowns (kept client-side for now) ---
// These are static and don't require backend persistence for now.
import { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions } from '../../server/utils/dropdownData.js';
export { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions };