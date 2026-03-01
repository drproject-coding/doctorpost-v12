/**
 * Perplexity Search API integration for the Research Agent.
 * https://docs.perplexity.ai/reference/post_chat_completions
 */

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface PerplexityResult {
  answer: string;
  citations: string[];
}

export async function searchPerplexity(
  query: string,
  apiKey: string,
  options?: { focus?: "internet" | "scholar" | "reddit" },
): Promise<PerplexityResult> {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant. Provide factual, well-sourced information. Include specific data points, statistics, and practitioner perspectives when available.",
        },
        { role: "user", content: query },
      ],
      search_focus: options?.focus || "internet",
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "";
  const citations: string[] = data.citations || [];

  return { answer, citations };
}
