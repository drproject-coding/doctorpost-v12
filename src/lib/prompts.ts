import { TonePrompt } from './types';

// Collection of tone prompts for different writing styles
export const tonePrompts: TonePrompt[] = [
  {
    id: 'casual-witty',
    name: 'Casual & Witty',
    description:
      'Punchy, first-person riffs with short, staccato sentences, playful sarcasm, and quick take-home lines that feel like a high-engagement LinkedIn scroll.',
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

Take a deep breath and work on this problem step-by-step.`
  },
  {
    id: 'professional-authority',
    name: 'Professional Authority',
    description:
      'Balanced, expert voice backed by facts and research. Establishes industry leadership with measured confidence.',
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
Return only the finished LinkedIn post with appropriate paragraph breaks. No headers, explanations, or meta-commentary.`
  },
  {
    id: 'approachable-expert',
    name: 'Approachable Expert',
    description:
      'Friendly, accessible expertise. Explains complex ideas simply with relatable examples and occasional humor.',
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
Return only the finished LinkedIn post with appropriate paragraph breaks and minimal emoji use (if any). No headers, explanations, or meta-commentary.`
  }
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
  }
): string => {
  let preparedPrompt = template;

  // Replace parameters in the template
  preparedPrompt = preparedPrompt.replace(/{{topic}}/g, params.topic);
  preparedPrompt = preparedPrompt.replace(/{{audience}}/g, params.audience.join(', '));
  preparedPrompt = preparedPrompt.replace(
    /{{coreTakeaway}}/g,
    params.coreTakeaway ?? 'Insights that transform how you approach this topic'
  );
  preparedPrompt = preparedPrompt.replace(/{{ctaGoal}}/g, params.ctaGoal ?? 'Share your thoughts in the comments');
  preparedPrompt = preparedPrompt.replace(/{{contentPillar}}/g, params.contentPillar);
  preparedPrompt = preparedPrompt.replace(/{{hookPattern}}/g, params.hookPattern);
  preparedPrompt = preparedPrompt.replace(/{{postType}}/g, params.postType);

  return preparedPrompt;
};

// Simulates an API call to generate a post using the prepared prompt
export const generatePost = async (prompt: string): Promise<string> => {
  // In a real implementation, this would be an API call to an AI service
  // For demo purposes, we'll simulate a delay and return a mock response
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock responses based on the prompt content
  if (prompt.includes('Casual & Witty')) {
    return `"Nobody actually cares about your content strategy."
That's what a marketing guru told me last week.
I almost choked on my coffee.
Yet here's the truth: he might be right.
I've spent years crafting "perfect" content plans for my clients.
Meticulous editorial calendars.
Detailed audience personas.
Keyword research that would make SEO experts weep with joy.
And you know what happens to 80% of those beautiful strategies?
They collect digital dust.
They become forgotten Google Docs.
They transform into guilt-inducing reminders of what "should" be happening.
Why does this keep happening?
Because we've confused documentation with implementation.
Because we've prioritized perfection over consistency.
Because you can't eat strategy for breakfast.
The clients who actually see results do something different.
They create simple systems.
They focus on publishing, not planning.
They understand that done beats perfect every single time.
Have you fallen into the strategy trap too?
Are you planning more than you're posting?
What if you traded your complex strategy for a simple publishing habit?
The uncomfortable reality: a mediocre post that exists will always outperform the perfect post that doesn't.
Strategy matters, but only when it simplifies your path to creation.
Show me your last post, not your latest strategy document.`;
  } else if (prompt.includes('Professional Authority')) {
    return `Recent research from the Content Marketing Institute reveals that 63% of B2B organizations lack a documented content strategy, despite evidence showing that those with structured approaches achieve 30% higher conversion rates.

This disconnect represents a significant opportunity gap in how businesses approach content development and distribution.

The challenge many marketing teams face isn't recognizing the importance of strategic content planning, but rather implementing systems that balance comprehensive strategy with practical execution capabilities. Too often, we observe organizations investing substantial resources in creating elaborate content frameworks that ultimately fail during the implementation phase.

At the core of effective content strategy is the ability to align business objectives with audience needs while maintaining consistent production cadence. This requires not just planning documents, but operational infrastructure that supports content creation workflows.

According to McKinsey's 2023 Digital Marketing Excellence report, organizations that successfully implement their content strategies share three common characteristics: simplified approval processes, technology enablement for content management, and clear performance metrics tied to business outcomes.

We've found that implementing a modular approach to content strategy yields superior results. This method breaks down comprehensive plans into quarterly execution blocks with bi-weekly production sprints, creating a balance between strategic direction and tactical delivery.

The most successful content programs we've analyzed maintain what we call a "70-20-10" content mix: 70% proven formats that consistently perform, 20% iterations on those formats, and 10% experimental content that tests new approaches.

By restructuring your content operation around execution rather than planning, you can bridge the strategy-implementation gap that constrains results for so many organizations.

Would you like to discuss how we can help transform your content strategy into an execution-focused system that delivers measurable business impact? Let's connect.`;
  } else if (prompt.includes('Approachable Expert')) {
    return `Ever feel like your content strategy is a beautiful car sitting in the garage that you never actually drive?

I had a client call me yesterday, frustrated because they'd spent weeks crafting what they called "the perfect content plan" but somehow weren't seeing any results.

"Well," I asked, "how many pieces have you actually published since creating this strategy?"

The uncomfortable silence told me everything I needed to know.

Here's the thing about content strategies: they're only valuable when they simplify the path to consistent creation. The most brilliant strategy document in the world is worthless if it's too complex to execute.

I used to be guilty of this too. I'd spend days building elaborate content calendars with color-coding systems that would make Marie Kondo proud. But then I'd feel so overwhelmed by my own system that I'd publish... nothing.

The turning point came when I started treating my content strategy as a production system rather than a planning exercise.

Instead of focusing on perfection, I built simple routines:
- One main topic per month
- A consistent weekly publishing schedule
- Templates for my most common content types
- A 30-minute weekly review to adjust course

This approach might sound too simple, but that's exactly why it works. When your strategy reduces friction rather than creating it, you actually follow through.

The clients who see the best results aren't necessarily those with the most sophisticated strategies. They're the ones who consistently publish good (not perfect) content that addresses real audience needs.

What would happen if you traded your complex strategy for a simple publishing habit? Could consistency actually be your missing ingredient rather than a more detailed plan?

Remember: The best content strategy is the one you'll actually implement.

What's one way you could simplify your approach this week? I'd love to hear your thoughts in the comments!`;
  }

  // Default response if no specific content match
  return `This is a generated post about ${prompt.includes('topic: ') ? prompt.split('topic: ')[1].split('\n')[0] : 'the specified topic'}.

It would be tailored to match the selected tone, hook pattern, and post type.

In a real implementation, this would be generated by an AI service using the complete prompt template with all the specified parameters.

The actual content would follow the structure defined in the prompt template and incorporate the specific requirements for the selected tone.`;
};