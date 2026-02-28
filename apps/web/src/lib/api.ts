import {
  PostGenerationResponse,
  Pillar,
  PostType,
  HookPattern,
  CtaIntent,
  BrandProfile,
  ScheduledPost,
  AnalyticsData,
} from './types';

// Mock API client to simulate backend calls
export async function generatePostMockApi(
  brandId: string,
  pillarId: string,
  postType: string,
  hookPattern: string,
  topic: string,
  tone: string,
  ctaIntent: string,
  hashtags?: string[]
): Promise<PostGenerationResponse> {
  console.log('Mock API Call: generatePost', {
    brandId,
    pillarId,
    postType,
    hookPattern,
    topic,
    tone,
    ctaIntent,
    hashtags,
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mockHashtags = ['#DoctorPostAI', '#LinkedInTips', `#${postType.replace(/\s/g, '')}`];
  if (topic) {
    mockHashtags.push(`#${topic.replace(/\s/g, '')}`);
  }

  const variantA = `
**Variant A: ${hookPattern} Hook**

${topic ? `Here's a post about "${topic}" using the ${postType} format:` : 'Here\'s a generated post:'}

This is the main body of your **${postType}** post, crafted with a **${tone}** tone.
`;

  const variantB = `
**Variant B: Alternative Approach**

${topic ? `An alternative take on "${topic}" in a ${postType} style:` : 'An alternative generated post:'}

This variant offers a slightly different angle or phrasing for your post.
`;

  return {
    variantA: variantA.trim(),
    variantB: variantB.trim(),
    hashtags: mockHashtags,
    warnings: [],
  };
}

// --- Mock Data for New Features ---

export const mockPillars: Pillar[] = [
  { id: 'pillar-1', name: 'Thought Leadership', goal: 'Establish expertise', topics: ['AI in Marketing', 'Future of Content'] },
  { id: 'pillar-2', name: 'Product Updates', goal: 'Inform about new features', topics: ['New Analytics View', 'Scheduler 2.0'] },
  { id: 'pillar-3', name: 'Personal Story', goal: 'Connect on a human level', topics: ['My Founder Journey', 'Lessons Learned'] },
  { id: 'pillar-4', name: 'Industry News', goal: 'Share relevant trends', topics: ['LinkedIn Algorithm Changes', 'Creator Economy'] },
];

export const mockBrandProfile: BrandProfile = {
  id: 'brand-123',
  name: 'DoctorPost User',
  industry: 'AI & Marketing',
  audience: ['Entrepreneurs', 'Consultants', 'Marketing Managers'],
  tones: ['Professional Authority', 'Approachable Expert', 'Contrarian Thought Leader'],
  offers: ['AI Content Generation', 'LinkedIn Strategy Consulting'],
  taboos: ['Politics', 'Spammy Tactics'],
  styleGuide: { emoji: true, hashtags: 5, links: 'end' },
};

export const defaultBrandProfile: BrandProfile = mockBrandProfile; // For use in CreatePostPage

// --- UPDATED MOCK DATA FOR CALENDAR ---
const today = new Date();
export const mockScheduledPosts: ScheduledPost[] = [
    // Past
    { id: 'post-0', title: 'Recap: Last Week\'s Wins', scheduledAt: new Date(new Date().setDate(today.getDate() - 5)).toISOString(), status: 'published', pillar: 'Personal Story' },
    
    // Current Month
    { id: 'post-1', title: 'The Future of AI in Marketing', scheduledAt: new Date(new Date().setDate(today.getDate() + 2)).toISOString(), status: 'scheduled', pillar: 'Thought Leadership' },
    { id: 'post-2', title: 'Our New Analytics View is Live!', scheduledAt: new Date(new Date().setDate(today.getDate() + 4)).toISOString(), status: 'scheduled', pillar: 'Product Updates' },
    { id: 'post-3', title: 'My Biggest Failure as a Founder', scheduledAt: new Date(new Date().setDate(today.getDate() + 7)).toISOString(), status: 'scheduled', pillar: 'Personal Story' },
    { id: 'post-4', title: 'Reacting to the latest LinkedIn changes', scheduledAt: new Date(new Date().setDate(today.getDate() + 8)).toISOString(), status: 'draft', pillar: 'Industry News' },
    { id: 'post-5', title: 'Another post for the same day', scheduledAt: new Date(new Date().setDate(today.getDate() + 8)).toISOString(), status: 'scheduled', pillar: 'Thought Leadership' },
    { id: 'post-6', title: 'A published post from today', scheduledAt: today.toISOString(), status: 'published', pillar: 'Product Updates' },

    // Next Month
    { id: 'post-7', title: 'Planning for next month', scheduledAt: new Date(new Date().setMonth(today.getMonth() + 1, 5)).toISOString(), status: 'draft', pillar: 'Thought Leadership' },
    { id: 'post-8', title: 'Early preview of new feature', scheduledAt: new Date(new Date().setMonth(today.getMonth() + 1, 10)).toISOString(), status: 'scheduled', pillar: 'Product Updates' },
];


export const mockAnalyticsData: AnalyticsData = {
    totalImpressions: 125600,
    totalReactions: 8750,
    totalComments: 1230,
    ctr: 4.5,
    topPerformingPillar: { name: 'Thought Leadership', value: 45000 },
    topPerformingHook: { name: 'Contrarian', value: 3200 },
    performanceByPillar: [
        { name: 'Thought Leadership', impressions: 45000 },
        { name: 'Personal Story', impressions: 35000 },
        { name: 'Industry News', impressions: 28000 },
        { name: 'Product Updates', impressions: 17600 },
    ]
};


// --- Mock API Functions for New Features ---

export async function getBrandProfile(): Promise<BrandProfile> {
  await new Promise(res => setTimeout(res, 500));
  return mockBrandProfile;
}

export async function updateBrandProfile(data: BrandProfile): Promise<BrandProfile> {
  console.log("Updating brand profile:", data);
  await new Promise(res => setTimeout(res, 1000));
  // In a real app, you'd update the data source. Here we just return the input.
  return data;
}

export async function getPillars(): Promise<Pillar[]> {
  await new Promise(res => setTimeout(res, 500));
  return mockPillars;
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
    await new Promise(res => setTimeout(res, 500));
    return mockScheduledPosts;
}

export async function getAnalytics(): Promise<AnalyticsData> {
    await new Promise(res => setTimeout(res, 800));
    return mockAnalyticsData;
}


// --- Data for Dropdowns (used in /create) ---
export const mockPostTypes: PostType[] = [ 'Story', 'Insight', 'How-To', 'Contrarian', 'List', 'Case Study', 'Question' ];
export const mockHookPatterns: HookPattern[] = [ 'Curiosity Gap', 'Social Proof', 'Contrarian', 'Problem-Agitate-Solve', 'Authority/Insight', 'Educational/Framework' ];
export const mockCtaIntents: CtaIntent[] = [ 'LeadGen', 'Engagement', 'WebsiteVisit', 'Follow' ];