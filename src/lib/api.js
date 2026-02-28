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
      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`,\n    },\n    body: JSON.stringify({\n      title: post.title,\n      content: post.content,\n      scheduledAt: post.scheduledAt,\n      pillar: post.pillar,\n      status: 'draft',\n    }),\n  });\n  if (!response.ok) {\n    throw new Error(`Failed to save draft: ${response.statusText}`);\n  }\n};\n\nexport const schedulePost = async (post) => {\n  // Guest users cannot schedule posts to backend\n  if (localStorage.getItem('isGuest') === 'true') {\n    console.warn('Guest user attempted to schedule post. Operation ignored.');\n    return;\n  }\n\n  const token = getAuthToken();\n  const response = await fetch(`${API_BASE_URL}/posts`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`,\n    },\n    body: JSON.stringify({\n      title: post.title,\n      content: post.content,\n      scheduledAt: post.scheduledAt,\n      pillar: post.pillar,\n      status: post.status,\n    }),\n  });\n  if (!response.ok) {\n    throw new Error(`Failed to schedule post: ${response.statusText}`);\n  }\n};\n\nexport const getAnalytics = async (userId) => {\n  if (userId === 'guest') {\n    return guestAnalyticsData;\n  }\n\n  const token = getAuthToken();\n  const response = await fetch(`${API_BASE_URL}/analytics/${userId}`, {\n    headers: {\n      'Authorization': `Bearer ${token}`,\n    },\n  });\n  if (!response.ok) {\n    throw new Error(`Failed to fetch analytics: ${response.statusText}`);\n  }\n  const data = await response.json();\n  return data;\n};\n\nexport const validateOpenAIKey = async (key) => {\n  // Guest users cannot validate OpenAI keys\n  if (localStorage.getItem('isGuest') === 'true') {\n    return {\n      success: false,\n      message: 'OpenAI key validation is not available for guest users.',\n    };\n  }\n\n  const token = getAuthToken();\n  try {\n    const proxyResponse = await fetch(`${API_BASE_URL}/validate-openai-key`, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        'Authorization': `Bearer ${token}`,\n      },\n      body: JSON.stringify({ openAIKey: key }),\n    });\n\n    const data = await proxyResponse.json();\n    return data;\n  } catch (error) {\n    console.error('Error calling OpenAI validation proxy:', error);\n    return {\n      success: false,\n      message: 'Could not connect to validation service. Please check your network or try again.',\n    };\n  }\n};\n\n// NEW: Client-side API call for subtopic search (calls backend proxy)\nexport const findSubtopics = async (topic, count = 5, service = 'perplexity') => { // Added service parameter\n  const token = getAuthToken();\n  const response = await fetch(`${API_BASE_URL}/subtopics/search?topic=${encodeURIComponent(topic)}&count=${count}&service=${service}`, { // Pass service\n    headers: {\n      'Authorization': `Bearer ${token}`,\n    },\n  });\n  if (!response.ok) {\n    const errorData = await response.json();\n    throw new Error(errorData.message ?? 'Failed to fetch subtopics.');\n  }\n  const data = await response.json();\n  return data;\n};\n\n// NEW: Client-side API call for post attribute recommendations (calls backend proxy)\nexport const getPostRecommendations = async (topic, subtopic) => {\n  const token = getAuthToken();\n  const response = await fetch(`${API_BASE_URL}/recommendations/attributes`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`,\n    },\n    body: JSON.stringify({ topic, subtopic }),\n  });\n  if (!response.ok) {\n    const errorData = await response.json();\n    throw new Error(errorData.message ?? 'Failed to get post recommendations.');\n  }\n  const data = await response.json();\n  return data;\n};\n\n// NEW: Client-side API call for AI content generation (calls backend proxy)\nexport const generateAIContent = async (prompt) => {\n  const token = getAuthToken();\n  const response = await fetch(`${API_BASE_URL}/generate/post`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`,\n    },\n    body: JSON.stringify({ prompt }),\n  });\n  if (!response.ok) {\n    const errorData = await response.json();\n    throw new Error(errorData.message ?? 'Failed to generate AI content.');\n  }\n  const data = await response.json();\n  return data.content;\n};\n\n// NEW: Frontend client for OpenAI multi-section content\nexport async function getFrameworkContent(topic, components) {\n  const token = getAuthToken();\n  const res = await fetch(`${API_BASE_URL}/ai/openai`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`,\n    },\n    body: JSON.stringify({ topic, components })\n  });\n  if (!res.ok) {\n    const errorData = await res.json();\n    throw new Error(errorData.error || 'AI service error');\n  }\n  return res.json(); // Array<AiSection>\n}\n\n// NEW: Frontend client for Perplexity single-section detail\nexport async function getPerplexityDetail(topic, componentName) {\n  const token = getAuthToken();\n  const res = await fetch(`${API_BASE_URL}/ai/perplexity?topic=${encodeURIComponent(topic)}&component=${encodeURIComponent(componentName)}`, {\n    headers: {\n      'Authorization': `Bearer ${token}`,\n    },\n  });\n  if (!res.ok) {\n    const errorData = await res.json();\n    throw new Error(errorData.error || 'Perplexity service error');\n  }\n  return res.json(); // AiSection\n}\n\n// --- Static Dropdown Data (kept client-side for now, but backend recommendation engine uses its own copies) ---\nexport const enhancedPostTypes = [\n  {\n    id: 'howTo', value: 'howTo', label: 'Educational/How-To', category: 'Educational Content',\n    description: 'Guides readers through a process or technique.',\n    exampleSnippet: 'Learn the 5 steps to master...', useCases: [], performanceIndicator: 'high', isTrending: true,\n  },\n  { id: 'list', value: 'list', label: 'Listicle/Tips', category: 'Educational Content', description: 'Presents multiple points or examples in a structured format.', exampleSnippet: 'Top 7 tools for...', useCases: [], performanceIndicator: 'high' },\n  { id: 'toolReview', value: 'toolReview', label: 'Tool/Resource Review', category: 'Educational Content', description: 'Evaluates a specific tool or resource.', exampleSnippet: 'Is [Tool Name] worth it? My honest review.', useCases: [], performanceIndicator: 'medium' },\n  { id: 'processFramework', value: 'processFramework', label: 'Process/Framework', category: 'Educational Content', description: 'Outlines a systematic approach or conceptual model.', exampleSnippet: 'The A-B-C framework for...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'caseStudy', value: 'caseStudy', label: 'Case Study/Results', category: 'Data-Driven Content', description: 'Showcases real-world examples and demonstrated results.', exampleSnippet: 'How we helped Client X achieve...', useCases: [], performanceIndicator: 'high' },\n  { id: 'trendAnalysis', value: 'trendAnalysis', label: 'Trend Analysis', category: 'Data-Driven Content', description: 'Examines current market movements and future predictions.', exampleSnippet: 'The rise of AI in...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'industryInsights', value: 'industryInsights', label: 'Industry Insights', category: 'Data-Driven Content', description: 'Provides expert commentary on sector-specific developments.', exampleSnippet: 'What the latest report means for...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'comparison', value: 'comparison', label: 'Comparison/Vs Post', category: 'Data-Driven Content', description: 'Compares two or more concepts, tools, or strategies.', exampleSnippet: 'ChatGPT vs Bard: Which is better for...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'question', value: 'question', label: 'Question/Poll', category: 'Engagement Content', description: 'Engages the audience by asking a direct question or running a poll.', exampleSnippet: 'What are your biggest challenges with...? #poll', useCases: [], performanceIndicator: 'experimental', isTrending: true },\n  { id: 'personalStory', value: 'personalStory', label: 'Personal Story/Experience', category: 'Engagement Content', description: 'Shares authentic experiences to build trust and connection.', exampleSnippet: 'This mistake cost me $10k but taught me...', useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: 'contrarian', value: 'contrarian', label: 'Controversial Take/Opinion', category: 'Engagement Content', description: 'Challenges conventional thinking to spark debate and engagement.', exampleSnippet: 'Unpopular opinion: Why remote work is failing...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'behindScenes', value: 'behindScenes', label: 'Behind-the-Scenes', category: 'Engagement Content', description: 'Offers a glimpse into your work process, team, or company culture.', exampleSnippet: 'A day in the life of our AI team...', useCases: [], performanceIndicator: 'experimental' },\n  { id: 'mythBusting', value: 'mythBusting', label: 'Myth-Busting/Fact-Check', category: 'Authority Content', description: 'Debunks common misconceptions or verifies facts.', exampleSnippet: 'The biggest AI myth you still believe...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'prediction', value: 'prediction', label: 'Prediction/Future Outlook', category: 'Authority Content', description: 'Shares informed predictions about future developments.', exampleSnippet: 'My 3 bold predictions for 2024...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'motivational', value: 'motivational', label: 'Motivational/Inspirational', category: 'Authority Content', description: \"Inspires and encourages the audience with uplifting messages.\", exampleSnippet: \"Don't give up on your entrepreneurial journey...\", useCases: [], performanceIndicator: 'medium' },\n];\n\nexport const enhancedHookPatterns = [\n  { id: 'curiosityGap', value: 'curiosityGap', label: 'Curiosity Gap', category: 'Intrigue & Discovery', description: 'Creates intrigue and prompts questions, making readers want to discover the answer.', exampleSnippet: \"You won't believe what happened next...\", useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: 'pas', value: 'pas', label: 'Problem-Agitate-Solve', category: 'Pain & Solution', description: \"Addresses a clear pain point, agitates it, then provides a solution.\", exampleSnippet: \"Struggling with X? Here's how to fix it.\", useCases: [], performanceIndicator: 'high' },\n  { id: 'socialProof', value: 'socialProof', label: 'Social Proof', category: 'Credibility & Trust', description: 'Uses evidence, data, or examples to validate a point through external credibility.', exampleSnippet: 'Join 10,000+ others who...', useCases: [], performanceIndicator: 'medium' },\n  { id: 'contrarian', value: 'contrarian', label: 'Contrarian', category: 'Challenge & Debate', description: \"Challenges common beliefs or practices, creating interest through new perspectives.\", exampleSnippet: \"Everyone says X, but here's why they're wrong.\", useCases: [], performanceIndicator: 'medium' },\n  { id: 'authority', value: 'authority', label: 'Authority/Insight', category: 'Expertise & Value', description: 'Positions you as an expert voice on the topic, building trust with your audience.', exampleSnippet: \"As a 10-year veteran in X, I've learned...\", useCases: [], performanceIndicator: 'high' },\n  { id: 'educational', value: 'educational', label: 'Educational/Framework', category: 'Learning & Guidance', description: 'Aligns with structured learning and applicable knowledge, often presenting a framework.', exampleSnippet: \"Here's the simple framework I use for...\", useCases: [], performanceIndicator: 'high' },\n];\n\nexport const enhancedContentPillars = [\n  { id: 'Technology', value: 'Technology', label: 'Technology', category: 'Core Business', description: 'Focuses on technical concepts, digital tools, or technology implementation.', exampleSnippet: 'The latest in AI ethics...', useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: 'Leadership', value: 'Leadership', label: 'Leadership', category: 'Core Business', description: 'Aligns with management principles, team dynamics, or strategic direction.', exampleSnippet: 'Effective leadership in a remote world.', useCases: [], performanceIndicator: 'high' },\n  { id: 'Human Resource', value: 'Human Resource', label: 'Human Resource', category: 'Core Business', description: 'Addresses talent management, workforce issues, or employee experience.', exampleSnippet: 'Boosting employee engagement in 2024.', useCases: [], performanceIndicator: 'medium' },\n  { id: 'Industry Trends', value: 'Industry Trends', label: 'Industry Trends', category: 'Market & Future', description: \"Examines market movements, future predictions, or sector-wide developments.\", exampleSnippet: \"What's next for digital transformation?\", useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: 'Health Tips', value: 'Health Tips', label: 'Health Tips', category: 'Personal Wellbeing', description: 'Matches topics related to wellbeing, medical insights, or healthcare concerns.', exampleSnippet: '3 simple habits for better mental health.', useCases: [], performanceIndicator: 'medium' },\n  { id: 'Case Studies', value: 'Case Studies', label: 'Case Studies', category: 'Proof & Results', description: 'Dedicated pillar for sharing detailed success stories and project outcomes.', exampleSnippet: 'Our client saved $X with this strategy.', useCases: [], performanceIndicator: 'high' },\n];\n\nexport const enhancedToneOptions = [\n  { id: \"casual-witty\", value: \"casual-witty\", label: \"Casual & Witty\", category: 'Informal & Engaging', description: \"Punchy, first-person riffs with short, staccato sentences, playful sarcasm, and quick take-home lines that feel like a high-engagement LinkedIn scroll.\", exampleSnippet: \"Nobody actually cares about your content strategy. That's what a marketing guru told me last week.\", useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: \"professional-authority\", value: \"professional-authority\", label: \"Professional Authority\", category: 'Formal & Expert', description: \"Balanced, expert voice with clear insights and factual support. Industry leadership with measured confidence.\", exampleSnippet: \"Our latest research indicates...\", useCases: [], performanceIndicator: 'high' },\n  { id: \"approachable-expert\", value: \"approachable-expert\", label: \"Approachable Expert\", category: 'Formal & Expert', description: \"Friendly, accessible expertise. Complex ideas explained simply with relatable examples and occasional humor.\", exampleSnippet: \"Let's break down this complex topic...\", useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: \"snap-snark\", value: \"snap-snark\", label: \"Snap & Snark\", category: 'Informal & Engaging', description: \"Punchy, first-person quips. Short, snappy lines. Light sarcasm. Fast takeaways that read like a high-engagement LinkedIn feed.\", exampleSnippet: \"Unpopular opinion: Meetings are dead.\", useCases: [], performanceIndicator: 'medium' },\n  { id: \"plain-talk-playbook\", value: \"plain-talk-playbook\", label: \"Plain-Talk Playbook\", category: 'Informal & Engaging', description: \"No fluff. Plain language that turns big ideas into step-by-step moves, with sticky analogies and habit-friendly rules of thumb.\", exampleSnippet: \"Here's the simple truth about...\", useCases: [], performanceIndicator: 'high' },\n  { id: \"anecdote-to-aha\", value: \"anecdote-to-aha\", label: \"Anecdote to Aha\", category: 'Storytelling', description: \"Start with a scene. Tease a question. Land an unexpected aha-backed by research and smart counterpoints.\", exampleSnippet: \"I almost quit until I realized...\", useCases: [], performanceIndicator: 'high', isTrending: true },\n  { id: \"bias-buster\", value: \"bias-buster\", label: \"Bias Buster\", category: 'Storytelling', description: \"Wry, rule-bending takes that expose our quirky decision-making and flip conventional wisdom upside down.\", exampleSnippet: \"Your brain is tricking you into...\", useCases: [], performanceIndicator: 'medium' },\n  { id: \"open-heart-honest\", value: \"open-heart-honest\", label: \"Open-Heart Honest\", category: 'Emotional & Relatable', description: \"Warm first-person honesty, blending personal moments with evidence-based takeaways to create genuine connection.\", exampleSnippet: \"It's okay to feel overwhelmed, I've been there.\", useCases: [], performanceIndicator: 'medium' },\n  { id: \"future-forward-glow\", value: \"future-forward-glow\", label: \"Future-Forward Glow\", category: 'Visionary', description: \"Future-forward energy: market maps, sci-fi analogies, and confident bets that paint a hope-filled picture of what's next.\", exampleSnippet: \"Imagine a world where AI...\", useCases: [], performanceIndicator: 'medium' },\n  { id: \"money-with-meaning\", value: \"money-with-meaning\", label: \"Money With Meaning\", category: 'Niche & Specific', description: \"Calm, reflective essays weaving history, psychology, and money lessons into relatable snapshots with a literary touch.\", exampleSnippet: \"The philosophy of wealth beyond riches.\", useCases: [], performanceIndicator: 'experimental' },\n  { id: \"conversion-mode\", value: \"conversion-mode\", label: \"Conversion Mode\", category: 'Niche & Specific', description: \"Benefits first. Pain -> solution -> proof -> CTA. Tight, urgent copy built to convert.\", exampleSnippet: \"Unlock your potential with...\", useCases: [], performanceIndicator: 'medium' },\n  { id: \"nerdy-fun-run\", value: \"nerdy-fun-run\", label: \"Nerdy Fun Run\", category: 'Niche & Specific', description: \"Long-form with stick-figure humor, casual asides, and simple visuals to crack complex ideas-meme-ready and approachable.\",\n    exampleSnippet: \"Let's get nerdy about quantum computing!\", useCases: [], performanceIndicator: 'experimental' },\n  { id: \"mission-voice\", value: \"mission-voice\", label: \"Mission Voice\", category: 'Niche & Specific', description: \"Purpose-first language that asks the big why, rallies the group, and closes with a clear, uplifting call to act.\", exampleSnippet: \"Join us in building a better future for...\", useCases: [], performanceIndicator: 'medium' },\n];\n