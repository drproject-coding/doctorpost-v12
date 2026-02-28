// Base URL for the new backend API
const API_BASE_URL = 'http://localhost:3001/api'; // Ensure this matches your Express server port

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('app_token');

// --- Mock Data for Guest Mode ---
const guestBrandProfile = {
  id: 'guest',
  name: 'Guest User',
  firstName: 'Guest',
  lastName: 'User',
  companyName: 'DoctorPost Demo',
  role: 'Explorer',
  openAIKey: '',
  industry: 'AI & Marketing',
  audience: ['Entrepreneurs', 'Consultants', 'Marketing Managers'],
  tones: ['Professional Authority', 'Approachable Expert', 'Contrarian Thought Leader'],
  offers: ['AI Content Generation', 'LinkedIn Strategy Consulting'],
  taboos: ['Politics', 'Spammy Tactics'],
  styleGuide: { emoji: true, hashtags: 5, links: 'end' },
  copyGuideline: "Keep it concise and engaging.",
  contentStrategy: "Explore the app's capabilities.",
  definition: "A temporary profile for demonstration purposes.",
};

const guestScheduledPosts = [
  { id: 'guest-post-1', title: 'Welcome to DoctorPost!', content: 'Explore our features without an account.', scheduledAt: new Date().toISOString(), pillar: 'Onboarding', status: 'published' },
  { id: 'guest-post-2', title: 'Generate Your First Post', content: 'Head to the Create page to try the AI generator.', scheduledAt: new Date(Date.now() + 86400000).toISOString(), pillar: 'Feature Demo', status: 'scheduled' }, // Tomorrow
];

const guestAnalyticsData = {
  totalImpressions: 1500,
  totalReactions: 120,
  totalComments: 15,
  ctr: 2.5,
  topPerformingPillar: { name: 'Feature Demo', value: 800 },
  topPerformingHook: { name: 'Curiosity Gap', value: 50 },
  performanceByPillar: [
    { name: 'Feature Demo', impressions: 800 },
    { name: 'Onboarding', impressions: 700 },
  ],
  trendingTopics: ['AI Content', 'LinkedIn Strategy'],
  creatorEngagement: {
    averageCommentsPerPost: 1.5,
    averageReactionsPerPost: 12,
    followerGrowthRate: 0,
  },
};

// --- API Functions (Real Backend Calls) ---

export const googleAuthLogin = async (id_token) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to authenticate with Google.');
  }
  const data = await response.json();
  return data;
};

export const emailRegister = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to register with email.');
  }
  const data = await response.json();
  return data;
};

export const emailLogin = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to login with email.');
  }
  const data = await response.json();
  return data;
};

export const getCurrentUser = async () => {
  const token = getAuthToken();
  // Check if it's a guest session (set by AuthContext)
  if (!token && localStorage.getItem('isGuest') === 'true') {
    return JSON.parse(localStorage.getItem('guest_user_profile') || JSON.stringify(guestBrandProfile));
  }
  if (!token) {
    throw new Error('No authentication token found and not a guest session.');
  }

  const response = await fetch(`${API_BASE_URL}/user/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to fetch current user.');
  }
  const data = await response.json();
  return data;
};

export const getBrandProfile = async (id) => {
  if (id === 'guest') {
    return guestBrandProfile;
  }

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch brand profile: ${response.statusText}`);
  }
  const data = await response.json();
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

export const updateBrandProfile = async (id, profile) => {
  if (id === 'guest') {
    console.warn('Attempted to update guest profile. Operation ignored.');
    return guestBrandProfile; // Return mock profile, no actual update
  }

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
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
  const data = await response.json();
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

export const getScheduledPosts = async () => {
  const token = getAuthToken();
  // Check if it's a guest session
  if (!token && localStorage.getItem('isGuest') === 'true') {
    return guestScheduledPosts;
  }
  if (!token) {
    throw new Error('No authentication token found and not a guest session.');
  }

  const response = await fetch(`${API_BASE_URL}/posts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch scheduled posts: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

export const updatePost = async (updatedPost) => {
  // Guest users cannot update posts
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to update post. Operation ignored.');
    return updatedPost; // Return the post as if updated, but no actual backend change
  }

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
  const data = await response.json();
  return data;
};

export const savePostDraft = async (post) => {
  // Guest users cannot save drafts to backend
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to save draft. Operation ignored.');
    return;
  }

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
      status: 'draft',
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save draft: ${response.statusText}`);
  }
};

export const schedulePost = async (post) => {
  // Guest users cannot schedule posts to backend
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to schedule post. Operation ignored.');
    return;
  }

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
      status: post.status,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to schedule post: ${response.statusText}`);
  }
};

export const getAnalytics = async (userId) => {
  if (userId === 'guest') {
    return guestAnalyticsData;
  }

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/analytics/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to fetch analytics.');
  }
  const data = await response.json();
  return data;
};

export const validateOpenAIKey = async (key) => {
  // Guest users cannot validate OpenAI keys
  if (localStorage.getItem('isGuest') === 'true') {
    return {
      success: false,
      message: 'OpenAI key validation is not available for guest users.',
    };
  }

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

    const data = await proxyResponse.json();
    return data;
  } catch (error) {
    console.error('Error calling OpenAI validation proxy:', error);
    return {
      success: false,
      message: 'Could not connect to validation service. Please check your network or try again.',
    };
  }
};

// NEW: Client-side API call for subtopic search (calls backend proxy)
export const findSubtopics = async (topic, count = 5, service = 'perplexity') => { // Added service parameter
  const token = getAuthToken();
  // Guest mode handling for findSubtopics
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to find subtopics. Returning mock data.');
    // Return mock data for guest users
    const mockResponses = {
      "artificial intelligence": [
        { id: "1", text: "AI in healthcare", source: "google_questions", relevanceScore: 92, searchVolume: 15000 },
        { id: "2", text: "AI ethics and regulation", source: "google_trends", relevanceScore: 88, searchVolume: 12000 },
        { id: "3", text: "Machine learning basics", source: "related_topics", relevanceScore: 85, searchVolume: 10000 },
      ],
      "default": [
        { id: "1", text: `Top trends in ${topic}`, source: "google_trends", relevanceScore: 90, searchVolume: 10000 },
        { id: "2", text: `How to get started with ${topic}?`, source: "google_questions", relevanceScore: 85, searchVolume: 8000 },
        { id: "3", text: `${topic} best practices`, source: "related_topics", relevanceScore: 80, searchVolume: 7000 },
      ]
    };
    return mockResponses[topic.toLowerCase()] || mockResponses.default;
  }

  const response = await fetch(`${API_BASE_URL}/subtopics/search?topic=${encodeURIComponent(topic)}&count=${count}&service=${service}`, { // Pass service
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to fetch subtopics.');
  }
  const data = await response.json();
  return data;
};

// NEW: Client-side API call for post attribute recommendations (calls backend proxy)
export const getPostRecommendations = async (topic, subtopic) => {
  const token = getAuthToken();
  // Guest mode handling for getPostRecommendations
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to get post recommendations. Returning mock data.');
    return {
      postType: "howTo",
      hookPattern: "curiosityGap",
      contentPillar: "Technology",
      toneId: "approachable-expert",
      confidence: 75,
      reasoning: {
        postType: "Mock: Educational content is generally safe for guests.",
        hookPattern: "Mock: Curiosity hooks are engaging.",
        contentPillar: "Mock: Technology is a broad, relevant pillar.",
        tone: "Mock: An approachable tone is good for demos."
      },
      compatiblePostTypes: enhancedPostTypes.map(p => p.value),
      compatibleHookPatterns: enhancedHookPatterns.map(h => h.value),
      compatibleContentPillars: enhancedContentPillars.map(c => c.value),
      compatibleTones: enhancedToneOptions.map(t => t.id),
    };
  }

  const response = await fetch(`${API_BASE_URL}/recommendations/attributes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ topic, subtopic }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to get post recommendations.');
  }
  const data = await response.json();
  return data;
};

// NEW: Client-side API call for AI content generation (calls backend proxy)
export const generateAIContent = async (prompt) => {
  const token = getAuthToken();
  // Guest mode handling for generateAIContent
  if (localStorage.getItem('isGuest') === 'true') {
    console.warn('Guest user attempted to generate AI content. Returning mock data.');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
    return `This is a mock generated post for guest users based on your prompt: "${prompt.substring(0, 100)}..."
    
    In a real scenario, this content would be generated by a powerful AI model like GPT-4o or Llama-3.
    
    To unlock full AI generation capabilities, please sign in or register for an account!`;
  }

  const response = await fetch(`${API_BASE_URL}/generate/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message ?? 'Failed to generate AI content.');
  }
  const data = await response.json();
  return data.content;
};

// NEW: Frontend client for OpenAI multi-section content
export async function getFrameworkContent(topic, components) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/ai/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ topic, components })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'AI service error');
  }
  return res.json(); // Array<AiSection>
}

// NEW: Frontend client for Perplexity single-section detail
export async function getPerplexityDetail(topic, componentName) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/ai/perplexity?topic=${encodeURIComponent(topic)}&component=${encodeURIComponent(componentName)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Perplexity service error');
  }
  return res.json(); // AiSection
}

// --- Static Dropdown Data (kept client-side for now, but backend recommendation engine uses its own copies) ---
// These are now imported from server/utils/dropdownData.js to ensure consistency
import { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions } from '../../server/utils/dropdownData.js';
export { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions };