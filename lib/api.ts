import {
  BrandProfile,
  ScheduledPost,
  AnalyticsData,
  SubtopicSuggestion,
  PostRecommendation,
  User,
  AiSettings,
} from "./types";
import { generateWithAi } from "./ai/aiService";
import { extractRows } from "./ncb-utils";

// --- NCB snake_case <-> camelCase mapping helpers ---

interface NcbProfileRow {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  industry?: string | null;
  audience?: string | null;
  tones?: string | null;
  offers?: string | null;
  taboos?: string | null;
  style_guide_emoji?: boolean | null;
  style_guide_hashtags?: number | null;
  style_guide_links?: string | null;
  copy_guideline?: string | null;
  content_strategy?: string | null;
  definition?: string | null;
  openai_key?: string | null;
  ai_provider?: string | null;
  claude_api_key?: string | null;
  straico_api_key?: string | null;
  straico_model?: string | null;
  oneforall_api_key?: string | null;
  oneforall_model?: string | null;
  perplexity_api_key?: string | null;
  reddit_client_id?: string | null;
  reddit_client_secret?: string | null;
}

interface NcbPostRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  scheduled_at?: string | null;
  pillar?: string | null;
  status?: string | null;
  factory_score?: number | null;
  created_at?: string;
  updated_at?: string;
}

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed: unknown = JSON.parse(val);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function mapProfileFromNcb(row: NcbProfileRow): BrandProfile {
  const firstName = row.first_name ?? "";
  const lastName = row.last_name ?? "";
  const aiProvider = row.ai_provider as BrandProfile["aiProvider"] | undefined;
  return {
    id: row.id,
    name:
      firstName && lastName
        ? `${firstName} ${lastName}`
        : (row.company_name ?? "N/A"),
    firstName,
    lastName,
    companyName: row.company_name ?? "",
    role: row.role ?? "",
    aiProvider: aiProvider ?? "claude",
    claudeApiKey: row.claude_api_key ?? "",
    straicoApiKey: row.straico_api_key ?? "",
    straicoModel: row.straico_model ?? "openai/gpt-4o-mini",
    oneforallApiKey: row.oneforall_api_key ?? "",
    oneforallModel: row.oneforall_model ?? "anthropic/claude-4-sonnet",
    industry: row.industry ?? "",
    audience: parseJsonArray(row.audience),
    tones: parseJsonArray(row.tones),
    offers: parseJsonArray(row.offers),
    taboos: parseJsonArray(row.taboos),
    styleGuide: {
      emoji: row.style_guide_emoji ?? true,
      hashtags: row.style_guide_hashtags ?? 3,
      links: row.style_guide_links ?? "end",
    },
    copyGuideline: row.copy_guideline ?? "",
    contentStrategy: row.content_strategy ?? "",
    definition: row.definition ?? "",
    perplexityApiKey: row.perplexity_api_key ?? undefined,
    redditClientId: row.reddit_client_id ?? undefined,
    redditClientSecret: row.reddit_client_secret ?? undefined,
  };
}

function mapPostFromNcb(row: NcbPostRow): ScheduledPost {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    scheduledAt: row.scheduled_at ?? "",
    pillar: row.pillar ?? "",
    status: (row.status ?? "draft") as ScheduledPost["status"],
    userId: row.user_id,
    factoryScore: row.factory_score ?? undefined,
  };
}

// --- Auth ---

export const getCurrentUser = async (): Promise<User | null> => {
  const res = await fetch("/api/auth/get-session", {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: User };
  return data.user ?? null;
};

// --- Brand Profile ---

export const getBrandProfile = async (
  _userId: string,
): Promise<BrandProfile> => {
  const res = await fetch("/api/data/read/profiles", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch brand profile: ${res.statusText}`);
  }
  const rows = extractRows<NcbProfileRow>(await res.json());
  if (rows.length === 0) {
    // Return empty profile - user hasn't created one yet
    return {
      id: "",
      name: "N/A",
      firstName: "",
      lastName: "",
      companyName: "",
      role: "",
      aiProvider: "claude",
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
    };
  }
  return mapProfileFromNcb(rows[0]);
};

export const updateBrandProfile = async (
  profile: BrandProfile,
): Promise<BrandProfile> => {
  const payload = {
    first_name: profile.firstName,
    last_name: profile.lastName,
    company_name: profile.companyName,
    role: profile.role,
    industry: profile.industry,
    audience: JSON.stringify(profile.audience),
    tones: JSON.stringify(profile.tones),
    offers: JSON.stringify(profile.offers),
    taboos: JSON.stringify(profile.taboos),
    style_guide_emoji: profile.styleGuide.emoji,
    style_guide_hashtags: profile.styleGuide.hashtags,
    style_guide_links: profile.styleGuide.links,
    copy_guideline: profile.copyGuideline,
    content_strategy: profile.contentStrategy,
    definition: profile.definition,
    ai_provider: profile.aiProvider,
    claude_api_key: profile.claudeApiKey,
    straico_api_key: profile.straicoApiKey,
    straico_model: profile.straicoModel,
    oneforall_api_key: profile.oneforallApiKey,
    oneforall_model: profile.oneforallModel,
    perplexity_api_key: profile.perplexityApiKey || "",
    reddit_client_id: profile.redditClientId || "",
    reddit_client_secret: profile.redditClientSecret || "",
  };

  if (profile.id) {
    // Update existing
    const res = await fetch(`/api/data/update/profiles/${profile.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to update brand profile: ${res.statusText}`);
    }
    const data = (await res.json()) as NcbProfileRow;
    return mapProfileFromNcb(data);
  } else {
    // Create new
    const res = await fetch("/api/data/create/profiles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to create brand profile: ${res.statusText}`);
    }
    const data = (await res.json()) as NcbProfileRow;
    return mapProfileFromNcb(data);
  }
};

// --- Posts ---

export const ensureUserExists = async (): Promise<void> => {
  // Ensure user exists in NCB before allowing post creation
  // This prevents foreign key constraint violations
  try {
    const res = await fetch("/api/auth/ensure-user", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.warn(
        "[ensureUserExists] Failed to ensure user exists:",
        res.statusText,
      );
    }
  } catch (error) {
    console.warn("[ensureUserExists] Error:", error);
  }
};

export const getScheduledPosts = async (): Promise<ScheduledPost[]> => {
  const res = await fetch("/api/data/read/posts", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.statusText}`);
  }
  const rows = extractRows<NcbPostRow>(await res.json());
  return rows.map(mapPostFromNcb);
};

export const updatePost = async (
  updatedPost: ScheduledPost,
): Promise<ScheduledPost> => {
  const res = await fetch(`/api/data/update/posts/${updatedPost.id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: updatedPost.title,
      content: updatedPost.content,
      scheduled_at: updatedPost.scheduledAt,
      pillar: updatedPost.pillar,
      status: updatedPost.status,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update post: ${res.statusText}`);
  }
  const data = (await res.json()) as NcbPostRow;
  return mapPostFromNcb(data);
};

export const savePostDraft = async (post: ScheduledPost): Promise<void> => {
  const res = await fetch("/api/data/create/posts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      scheduled_at: post.scheduledAt,
      pillar: post.pillar,
      status: "draft",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to save draft: ${res.statusText}`);
  }
};

export const schedulePost = async (post: ScheduledPost): Promise<void> => {
  const payload = {
    title: post.title,
    content: post.content,
    scheduled_at: post.scheduledAt,
    pillar: post.pillar,
    status: post.status,
  };

  console.log("[schedulePost] Sending payload:", payload);

  const res = await fetch("/api/data/create/posts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("[schedulePost] Response status:", res.status, res.statusText);

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorBody = await res.json();
      console.log("[schedulePost] Error response:", errorBody);
      // Handle various error formats from NCB
      if (typeof errorBody === "object" && errorBody !== null) {
        errorDetail =
          errorBody.error ||
          errorBody.message ||
          errorBody.details ||
          JSON.stringify(errorBody);
      } else {
        errorDetail = String(errorBody);
      }
    } catch {
      // Response wasn't JSON, that's ok
      const text = await res.text();
      console.log("[schedulePost] Error response text:", text);
      if (text) errorDetail = text.slice(0, 200);
    }
    throw new Error(`Failed to schedule post: ${errorDetail}`);
  }

  console.log("[schedulePost] Post saved successfully");
};

export const deletePost = async (postId: string): Promise<void> => {
  const res = await fetch(`/api/data/delete/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete post: ${res.statusText}`);
  }
};

// --- Analytics (mock - no real backend yet) ---

export const getAnalytics = async (_userId: string): Promise<AnalyticsData> => {
  return {
    totalImpressions: 0,
    totalReactions: 0,
    totalComments: 0,
    ctr: 0,
    topPerformingPillar: { name: "N/A", value: 0 },
    topPerformingHook: { name: "N/A", value: 0 },
    performanceByPillar: [],
    trendingTopics: [],
    creatorEngagement: {
      averageCommentsPerPost: 0,
      averageReactionsPerPost: 0,
      followerGrowthRate: 0,
    },
  };
};

// --- AI Services (client-side, multi-provider) ---

export const findSubtopics = async (
  topic: string,
  count = 5,
  settings?: AiSettings,
): Promise<SubtopicSuggestion[]> => {
  if (!settings) {
    throw new Error(
      "AI settings are required. Please configure an AI provider in Settings.",
    );
  }

  const systemPrompt = `You are a LinkedIn content strategist. Given a topic, suggest ${count} specific subtopics that would make engaging LinkedIn posts. Return a JSON array of objects with fields: id (string, unique), text (string, the subtopic), source (string, one of "google_trends", "google_questions", "related_topics"), relevanceScore (number 0-1), searchVolume (number). Only return the JSON array, no other text.`;

  const response = await generateWithAi(
    { systemPrompt, userMessage: `Topic: ${topic}` },
    settings,
  );

  try {
    const cleaned = response.content
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned) as SubtopicSuggestion[];
  } catch {
    throw new Error("Failed to parse subtopic suggestions from AI response");
  }
};

export const getPostRecommendations = async (
  topic: string,
  subtopic: string,
  settings?: AiSettings,
): Promise<PostRecommendation> => {
  if (!settings) {
    throw new Error(
      "AI settings are required. Please configure an AI provider in Settings.",
    );
  }

  const systemPrompt = `You are a LinkedIn content strategist. Given a topic and subtopic, recommend the best post configuration. Return a single JSON object with these fields:
- postType (string): one of "educational", "storytelling", "opinion", "how-to", "case-study", "listicle"
- hookPattern (string): one of "question", "statistic", "bold-claim", "story-opener", "contrarian", "curiosity-gap"
- contentPillar (string): one of "thought-leadership", "industry-insights", "personal-branding", "how-to-guides", "case-studies", "trends"
- toneId (string): one of "casual-witty", "professional-authority", "approachable-expert"
- confidence (number 0-1)
- reasoning (object with fields: postType, hookPattern, contentPillar, tone - each a string explaining the choice)
- compatiblePostTypes (string array)
- compatibleHookPatterns (string array)
- compatibleContentPillars (string array)
- compatibleTones (string array)
Only return the JSON object, no other text.`;

  const response = await generateWithAi(
    { systemPrompt, userMessage: `Topic: ${topic}\nSubtopic: ${subtopic}` },
    settings,
  );

  try {
    const cleaned = response.content
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned) as PostRecommendation;
  } catch {
    throw new Error("Failed to parse recommendations from AI response");
  }
};

// --- Dropdown Data (client-side) ---
export {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "./dropdownData";
