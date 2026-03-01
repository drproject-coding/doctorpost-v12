import type { KnowledgeDocument } from "../knowledge/types";
import type { DiscoveryBrief, EvidencePack } from "../knowledge/types";
import { buildSystemPrompt, resolveKnowledge } from "./promptBuilder";
import { extractJson } from "./structuredOutput";
import { callAgentClaude } from "./callClaude";
import { AGENT_CONFIGS } from "./types";
import { searchPerplexity } from "./integrations/perplexity";
import { searchReddit, type RedditSearchResult } from "./integrations/reddit";

const config = AGENT_CONFIGS.researcher;

export interface ResearcherInput {
  apiKey: string;
  knowledge: KnowledgeDocument[];
  mode: "discovery" | "evidence";
  topic: string;
  /** For evidence mode: the sharpened angle */
  angle?: string;
  /** Perplexity API key */
  perplexityKey?: string;
  /** Reddit credentials */
  redditCredentials?: { clientId: string; clientSecret: string };
  signal?: AbortSignal;
}

export async function runResearcher(
  input: ResearcherInput,
): Promise<DiscoveryBrief | EvidencePack> {
  const docs = resolveKnowledge(config.requiredKnowledge, input.knowledge);

  // Gather external research data
  let perplexityData = "";
  let redditData = "";

  if (input.perplexityKey) {
    try {
      const focus = input.mode === "evidence" ? "scholar" : "internet";
      const query =
        input.mode === "discovery"
          ? `${input.topic} challenges pain points enterprise`
          : `${input.topic} ${input.angle || ""} statistics data evidence`;
      const result = await searchPerplexity(query, input.perplexityKey, {
        focus,
      });
      perplexityData = `\n### Perplexity Results\n${result.answer}\n\nSources:\n${result.citations.map((c) => `- ${c}`).join("\n")}`;
    } catch (err) {
      perplexityData = `\n### Perplexity: Search failed (${String(err)})`;
    }
  }

  if (input.redditCredentials) {
    try {
      const subreddits = [
        "ecommerce",
        "sysadmin",
        "ITManagers",
        "CTO",
        "datascience",
      ];
      const result: RedditSearchResult = await searchReddit(
        input.topic,
        input.redditCredentials,
        { subreddits, limit: 5 },
      );
      if (result.posts.length > 0) {
        redditData = `\n### Reddit Results\n${result.posts
          .map(
            (p) =>
              `- [r/${p.subreddit}] "${p.title}" (score: ${p.score}, ${p.numComments} comments)\n  ${p.selftext.slice(0, 200)}...\n  ${p.url}`,
          )
          .join("\n")}`;
      }
    } catch (err) {
      redditData = `\n### Reddit: Search failed (${String(err)})`;
    }
  }

  const extraContext = `## Research Data\n${perplexityData}\n${redditData}`;
  const systemPrompt = buildSystemPrompt("researcher", docs, extraContext);

  const userMessage =
    input.mode === "discovery"
      ? `Topic: "${input.topic}"\n\nPerform DISCOVERY research. Find subtopic angles, pain points, current debates, and questions being asked. Use the research data provided above. Return a DiscoveryBrief JSON.`
      : `Topic: "${input.topic}"\nAngle: "${input.angle || ""}"\n\nPerform EVIDENCE GATHERING. Find verified claims, practitioner quotes, counter-arguments, and fresh angles. Cross-reference with kpi-benchmarks. Return an EvidencePack JSON.`;

  const { text } = await callAgentClaude({
    apiKey: input.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    userMessage,
    signal: input.signal,
  });

  if (input.mode === "discovery") {
    return extractJson<DiscoveryBrief>(text);
  }
  return extractJson<EvidencePack>(text);
}
