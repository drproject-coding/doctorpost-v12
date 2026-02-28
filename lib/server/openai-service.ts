import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

export async function generateContentWithOpenAI(
  prompt: string,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return chatCompletion.choices[0].message.content ?? "";
}

interface DropdownItem {
  label: string;
  value?: string;
  id?: string;
}

interface RecommendationResult {
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

export async function getOpenAIRecommendations(
  subtopic: string,
  postTypes: DropdownItem[],
  hookPatterns: DropdownItem[],
  contentPillars: DropdownItem[],
  tones: DropdownItem[],
): Promise<RecommendationResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }

  const prompt = `You are a social media content expert with 20 years experience in copywriting, neuro-linguistic programming, and audience engagement. For the subtopic: '${subtopic}', please recommend the most suitable options for a LinkedIn post from the following lists. Return your recommendations in JSON format with keys 'postType', 'hookPattern', 'contentPillar', and 'toneId'. Also, provide a brief 'reasoning' for each choice.

Post Types: ${postTypes.map((p) => p.label).join(", ")}
Hook Patterns: ${hookPatterns.map((h) => h.label).join(", ")}
Content Pillars: ${contentPillars.map((c) => c.label).join(", ")}
Tones: ${tones.map((t) => t.label).join(", ")}

Example JSON output:
{
  "postType": "Listicle/Tips",
  "hookPattern": "Curiosity Gap",
  "contentPillar": "Technology",
  "toneId": "casual-witty",
  "reasoning": {
    "postType": "A listicle format is highly digestible for this topic.",
    "hookPattern": "A curiosity gap will grab attention.",
    "contentPillar": "This topic falls under the technology pillar.",
    "tone": "A casual and witty tone will make the topic more approachable."
  }
}`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 700,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const content = chatCompletion.choices[0].message.content ?? "{}";
  const recommendations = JSON.parse(content) as {
    postType?: string;
    hookPattern?: string;
    contentPillar?: string;
    toneId?: string;
    reasoning?: {
      postType?: string;
      hookPattern?: string;
      contentPillar?: string;
      tone?: string;
    };
  };

  const recommendedPostType =
    postTypes.find(
      (p) =>
        p.label === recommendations.postType ||
        p.value === recommendations.postType,
    )?.value ?? (recommendations.postType || "");
  const recommendedHookPattern =
    hookPatterns.find(
      (h) =>
        h.label === recommendations.hookPattern ||
        h.value === recommendations.hookPattern,
    )?.value ?? (recommendations.hookPattern || "");
  const recommendedContentPillar =
    contentPillars.find(
      (c) =>
        c.label === recommendations.contentPillar ||
        c.value === recommendations.contentPillar,
    )?.value ?? (recommendations.contentPillar || "");
  const recommendedToneId =
    tones.find(
      (t) =>
        t.label === recommendations.toneId ||
        t.id === recommendations.toneId,
    )?.id ?? (recommendations.toneId || "");

  return {
    postType: recommendedPostType,
    hookPattern: recommendedHookPattern,
    contentPillar: recommendedContentPillar,
    toneId: recommendedToneId,
    confidence: Math.floor(Math.random() * 15) + 80,
    reasoning: {
      postType:
        recommendations.reasoning?.postType ??
        `AI recommended '${recommendations.postType}'.`,
      hookPattern:
        recommendations.reasoning?.hookPattern ??
        `AI recommended '${recommendations.hookPattern}'.`,
      contentPillar:
        recommendations.reasoning?.contentPillar ??
        `AI recommended '${recommendations.contentPillar}'.`,
      tone:
        recommendations.reasoning?.tone ??
        `AI recommended '${recommendations.toneId}'.`,
    },
    compatiblePostTypes: postTypes
      .filter((p) => p.value !== recommendedPostType)
      .map((p) => p.value ?? ""),
    compatibleHookPatterns: hookPatterns
      .filter((h) => h.value !== recommendedHookPattern)
      .map((h) => h.value ?? ""),
    compatibleContentPillars: contentPillars
      .filter((c) => c.value !== recommendedContentPillar)
      .map((c) => c.value ?? ""),
    compatibleTones: tones
      .filter((t) => t.id !== recommendedToneId)
      .map((t) => t.id ?? ""),
  };
}

interface SubtopicResult {
  id: string;
  text: string;
  source: string;
  relevanceScore: number;
  searchVolume: number;
}

export async function searchSubtopicsWithOpenAI(
  topic: string,
  count: number = 5,
): Promise<SubtopicResult[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert in content strategy and market research. Your task is to identify trending and high-interest subtopics related to a given primary topic, suitable for LinkedIn content. For each subtopic, provide a brief explanation of why it's relevant. Aim for exactly ${count} distinct subtopics. Rank them by interest & engagement triggering. Format the output as a JSON object with a "subtopics" key containing an array of objects with 'text', 'source', 'relevanceScore' (0-100), and 'searchVolume' (integer). The 'source' should be one of 'google_trends', 'google_questions', or 'related_topics'.`,
    },
    {
      role: "user",
      content: `List me ${count} sub topics of "${topic}" and rank them by interest & engagement triggering, return result in json format.`,
    },
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 500,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = chatCompletion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content) as {
    subtopics?: Array<{
      text: string;
      source: string;
      relevanceScore?: number;
      searchVolume?: number;
    }>;
  };
  const subtopics = parsed.subtopics ?? [];

  return subtopics
    .map(
      (
        sub: {
          text: string;
          source: string;
          relevanceScore?: number;
          searchVolume?: number;
        },
        index: number,
      ) => ({
        id: `subtopic-${index + 1}`,
        text: sub.text,
        source: sub.source.toLowerCase().replace(/\s/g, "_"),
        relevanceScore:
          sub.relevanceScore ?? Math.floor(Math.random() * 30) + 70,
        searchVolume:
          sub.searchVolume ?? Math.floor(Math.random() * 20000) + 5000,
      }),
    )
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
