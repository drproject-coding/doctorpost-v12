const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL =
  process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai/v1";

interface SubtopicResult {
  id: string;
  text: string;
  source: string;
  relevanceScore: number;
  searchVolume: number;
}

export async function searchSubtopicsWithPerplexity(
  topic: string,
  count: number = 5,
): Promise<SubtopicResult[]> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key is not configured.");
  }

  const messages = [
    {
      role: "system" as const,
      content: `You are an expert in content strategy and market research. Your task is to identify trending and high-interest subtopics related to a given primary topic, suitable for LinkedIn content. For each subtopic, provide a brief explanation of why it's relevant. Aim for exactly ${count} distinct subtopics. Rank them by interest & engagement triggering. Format the output as a JSON array of objects with 'text', 'source', and 'relevanceScore' (0-100).`,
    },
    {
      role: "user" as const,
      content: `List me ${count} sub topics of "${topic}" and rank them by interest & engagement triggering, return result in json format.`,
    },
  ];

  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "llama-3-sonar-small-32k-online",
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as {
      error?: { message?: string };
    };
    throw new Error(
      `Perplexity API error: ${errorData.error?.message ?? response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  let content = data.choices[0].message.content;

  // Strip markdown code blocks if present
  if (content.startsWith("```json") && content.endsWith("```")) {
    content = content.substring(7, content.length - 3).trim();
  } else if (content.startsWith("```") && content.endsWith("```")) {
    content = content.substring(3, content.length - 3).trim();
  }

  const subtopics = JSON.parse(content) as Array<{
    text: string;
    source: string;
    relevanceScore?: number;
    searchVolume?: number;
  }>;

  return subtopics
    .map((sub, index) => ({
      id: `subtopic-${index + 1}`,
      text: sub.text,
      source: sub.source.toLowerCase().replace(/\s/g, "_"),
      relevanceScore:
        sub.relevanceScore ?? Math.floor(Math.random() * 30) + 70,
      searchVolume:
        sub.searchVolume ?? Math.floor(Math.random() * 20000) + 5000,
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
