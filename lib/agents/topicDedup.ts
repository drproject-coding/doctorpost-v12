/**
 * Topic deduplication utilities.
 *
 * Two approaches:
 * 1. summarizeCoveredTopics — compact keyword summary for the prompt (keeps it short)
 * 2. isTooSimilar / filterNewProposals — post-generation Jaccard filter (zero AI cost)
 */

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "how",
  "why",
  "what",
  "when",
  "where",
  "who",
  "which",
  "your",
  "you",
  "my",
  "our",
  "their",
  "its",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "not",
  "no",
  "nor",
  "so",
  "yet",
  "both",
  "either",
  "each",
  "every",
  "all",
  "any",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "than",
  "that",
  "this",
  "these",
  "those",
  "as",
  "up",
  "out",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "without",
  "within",
  "along",
  "following",
  "across",
  "behind",
  "beyond",
  "plus",
  "except",
  "get",
  "make",
  "use",
  "need",
  "want",
  "know",
  "think",
  "see",
  "look",
  "come",
  "go",
  "take",
  "give",
  "work",
  "call",
  "try",
  "ask",
  "turn",
  "keep",
  "put",
  "seem",
  "feel",
  "become",
  "leave",
  "show",
  "create",
  "build",
  "grow",
  "stop",
  "start",
  "run",
]);

/** Extract meaningful keywords from a headline */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Summarize covered topics into a compact phrase for the prompt.
 * Extracts the top keywords by frequency and returns a short sentence.
 * Keeps prompt addition to ~1 line instead of N full headlines.
 */
export function summarizeCoveredTopics(headlines: string[]): string {
  if (headlines.length === 0) return "";

  const freq: Record<string, number> = {};
  for (const h of headlines) {
    const words = new Set(tokenize(h)); // unique per headline (not per word)
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // Keep only words that appear in at least 2 headlines OR the top 20 by freq
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);

  return sorted.join(", ");
}

/**
 * Jaccard similarity between two headlines (word overlap ratio).
 * Returns 0–1. A score above ~0.35 usually means same topic.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Returns true if a proposed headline is too similar to any existing one.
 * Threshold of 0.35 catches obvious repeats without being over-zealous.
 */
export function isTooSimilar(
  proposed: string,
  existing: string[],
  threshold = 0.35,
): boolean {
  return existing.some((h) => jaccardSimilarity(proposed, h) >= threshold);
}

/**
 * Filter a list of topic proposals, removing any that overlap with existing headlines.
 * Used post-generation as a zero-cost safety net.
 */
export function filterNewProposals<T extends { headline: string }>(
  proposals: T[],
  existingHeadlines: string[],
  threshold = 0.35,
): T[] {
  const accepted: T[] = [];
  const seen = [...existingHeadlines];
  for (const p of proposals) {
    if (!isTooSimilar(p.headline, seen, threshold)) {
      accepted.push(p);
      seen.push(p.headline); // also dedup against other proposals in this batch
    }
  }
  return accepted;
}
