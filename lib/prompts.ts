import { TonePrompt, AiSettings, OnProgress } from "./types";
import { generateWithAi } from "./ai/aiService";

// Collection of tone prompts for different writing styles
export const tonePrompts: TonePrompt[] = [
  {
    id: "casual-witty",
    name: "Casual & Witty",
    description:
      "Punchy, first-person riffs with short, staccato sentences, playful sarcasm, and quick take-home lines that feel like a high-engagement LinkedIn scroll.",
    promptTemplate: `Act like a witty LinkedIn influencer who writes high-engagement, first-person riffs. Your voice is casual, playful, and a little sarcastic. You specialize in punchy, short sentences that create a fast scroll experience.

Objective:
Write a LinkedIn post in the "Casual & Witty" style that hooks quickly, entertains, and lands a crisp takeaway readers remember.

Inputs (replace bracketed items before you write):
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE TAKEAWAY: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Hard Constraints (must pass all):
- Length: ~25 lines (±3). One sentence per line. Blank line between paragraphs is allowed.
- Opener: Line 1 starts with a contrarian quote or statement that challenges a common belief.
- Short-sentence ratio: ≥45% of lines have ≤6 words.
- Rhetorical questions: Exactly 4 lines end with "?".
- Address the reader: Use "you" at least 5 times.
- Formatting bans: no bullets, no emojis, no hashtags, no exclamation points, no bold/ALL CAPS emphasis.
- Tone: playful sarcasm without snark or insults; confident, first person ("I", "me", "my").
- CTA: Final line is a memorable one-liner that nudges the CTA GOAL without salesy hype. (e.g., "Your move." "Prove me wrong." "Tell me where I'm off."). No question mark if you already hit 4.

Structure (follow step-by-step):
1) Hook (Lines 1–3): Start contrarian. State the tension. Tease a payoff without revealing it.
2) Snapshot (Lines 4–8): Share a quick first-person moment or observation. Keep it human. Keep it tight.
3) Turn (Lines 9–14): Flip the obvious logic. Drop 2 of the 4 rhetorical questions across this section. Use relatable metaphors.
4) Lesson (Lines 15–20): Boil the idea to its core. Use simple, scannable, staccato lines. Add the last 2 rhetorical questions here.
5) Takeaway (Lines 21–24): Deliver the CORE TAKEAWAY in fresh wording. Make it quotable.
6) CTA (Line 25): One sharp closer that implies the CTA GOAL (e.g., "Your move." "Prove me wrong." "Tell me where I'm off."). No question mark if you already hit 4.

Writing Rules:
- Keep paragraphs 1–2 lines. White space is your friend.
- Prefer concrete, everyday language over jargon.
- Use callbacks and contrast ("I used to… Now I…") to create rhythm.
- Show, then tell. Tell, then tighten.
- If any sentence exceeds 16 words, consider splitting it.
- Never include labels, lists, or meta-notes in the output.

Self-check before finalizing (silently fix if any fail):
- Count lines (22–28?). Count "?" (exactly 4?). Count "you" (≥5?). Any bullets/emojis/hashtags/exclamation points? Any line >1 sentence? ≥45% lines ≤6 words? Opener contrarian? Final line = CTA one-liner?

Output Format:
- Return only the finished LinkedIn post in plain text. One sentence per line. No headers, labels, or explanations.

Take a deep breath and work on this problem step-by-step.`,
  },
  {
    id: "professional-authority",
    name: "Professional Authority",
    description:
      "Balanced, expert voice backed by facts and research. Establishes industry leadership with measured confidence.",
    promptTemplate: `Act as a respected industry leader with deep expertise in your field. You communicate with a professional, authoritative voice that establishes credibility while remaining accessible.

Objective:
Create a LinkedIn post in the "Professional Authority" tone that demonstrates thought leadership while providing valuable insights to your audience.

Inputs:
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE INSIGHT: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Content Requirements:
- Length: 8-12 paragraphs, with each paragraph 1-3 sentences.
- Hook: Start with a compelling statistic, research finding, or industry observation.
- Evidence: Include at least 2 data points, research references, or expert sources.
- Structure: Problem → Context → Solution → Application → Insight → Call to action.
- Voice: Third-person or first-person plural ("we") dominant; limited "I" statements.
- Tone: Confident but not arrogant; precise language; nuanced perspectives.
- Language: Professional vocabulary appropriate to your industry, minimal jargon.
- Formatting: Use 1-2 line breaks for readability; no emojis or excessive punctuation.

The post should:
- Establish your expertise without explicitly stating credentials
- Present balanced, well-reasoned arguments
- Acknowledge complexity while providing clarity
- Include practical implications or applications
- Close with a thoughtful call to action that invites professional engagement

Output Format:
Return only the finished LinkedIn post with appropriate paragraph breaks. No headers, explanations, or meta-commentary.`,
  },
  {
    id: "approachable-expert",
    name: "Approachable Expert",
    description:
      "Friendly, accessible expertise. Explains complex ideas simply with relatable examples and occasional humor.",
    promptTemplate: `Act as an approachable expert who makes complex topics accessible and engaging. Your tone is friendly and conversational while still demonstrating clear expertise.

Objective:
Create a LinkedIn post in the "Approachable Expert" tone that simplifies a complex topic, builds connection, and provides valuable insights.

Inputs:
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE LESSON: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Content Requirements:
- Length: 6-10 paragraphs of varying length, with conversational flow.
- Hook: Start with a relatable scenario, common misconception, or intriguing question.
- Structure: Attention-grabber → Personal connection → Problem → Simple explanation → Example or analogy → Practical application → Insight → Friendly call to action.
- Voice: Balanced mix of first-person ("I") and second-person ("you"), creating conversation.
- Tone: Warm, enthusiastic, occasionally humorous, but always respectful of the topic's importance.
- Language: Simple explanations of complex ideas; analogies to everyday experiences; minimal jargon with clear definitions when used.
- Formatting: Strategic use of 1-2 emojis for emphasis; line breaks for readability; 1-2 questions to engage readers.

The post should:
- Build rapport through shared experiences or challenges
- Demystify complex concepts with simple explanations
- Use analogies that connect to readers' everyday experiences
- Include a personal touch that humanizes your expertise
- End with an inviting, low-pressure call to action

Output Format:
Return only the finished LinkedIn post with appropriate paragraph breaks and minimal emoji use (if any). No headers, explanations, or meta-commentary.`,
  },
];

// Function to get a prompt by ID
export const getPromptById = (id: string): TonePrompt | undefined => {
  return tonePrompts.find((prompt) => prompt.id === id);
};

// Function to prepare a prompt template with the provided parameters
export const preparePromptTemplate = (
  template: string,
  params: {
    topic: string;
    audience: string[];
    coreTakeaway?: string;
    ctaGoal?: string;
    contentPillar: string;
    hookPattern: string;
    postType: string;
  },
): string => {
  let preparedPrompt = template;

  // Replace parameters in the template
  preparedPrompt = preparedPrompt.replace(/{{topic}}/g, params.topic);
  preparedPrompt = preparedPrompt.replace(
    /{{audience}}/g,
    params.audience.join(", "),
  );
  preparedPrompt = preparedPrompt.replace(
    /{{coreTakeaway}}/g,
    params.coreTakeaway ??
      "Insights that transform how you approach this topic",
  );
  preparedPrompt = preparedPrompt.replace(
    /{{ctaGoal}}/g,
    params.ctaGoal ?? "Share your thoughts in the comments",
  );
  preparedPrompt = preparedPrompt.replace(
    /{{contentPillar}}/g,
    params.contentPillar,
  );
  preparedPrompt = preparedPrompt.replace(
    /{{hookPattern}}/g,
    params.hookPattern,
  );
  preparedPrompt = preparedPrompt.replace(/{{postType}}/g, params.postType);

  return preparedPrompt;
};

// Generate a post using the client-side AI service
export const generatePost = async (
  prompt: string,
  settings: AiSettings,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<string> => {
  const response = await generateWithAi(
    {
      systemPrompt:
        "You are an expert LinkedIn content strategist and copywriter specializing in high-engagement posts. Your role is to create compelling, authentic LinkedIn content that resonates with professional audiences. Focus on clarity, impact, and driving meaningful engagement.",
      userMessage: prompt,
    },
    settings,
    onProgress,
    signal,
  );
  return response.content;
};
