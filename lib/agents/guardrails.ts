/**
 * Guardrail engine — runs brand-rule checks against drafts.
 * Every check traces to a specific .md knowledge document.
 */

import type { KnowledgeDocument, GuardrailResult } from "../knowledge/types";

/**
 * Runs all guardrail checks against a draft, returning pass/fail results.
 * Checks are sourced from the knowledge documents injected by the pipeline.
 */
export function runGuardrails(
  draft: string,
  knowledge: KnowledgeDocument[],
): GuardrailResult[] {
  const results: GuardrailResult[] = [];

  // Hard Rules checks (from hard-rules.md)
  const hardRulesDoc = knowledge.find(
    (d) => d.category === "rules" && d.name === "hard-rules",
  );
  if (hardRulesDoc) {
    results.push(...checkHardRules(draft, hardRulesDoc));
  }

  // Formatting checks (from formatting-rules.md)
  const formattingDoc = knowledge.find(
    (d) => d.category === "rules" && d.name === "formatting-rules",
  );
  if (formattingDoc) {
    results.push(...checkFormattingRules(draft, formattingDoc));
  }

  return results;
}

// ── Hard Rules ──

const FORBIDDEN_SYMBOLS = ["🔥", "🚀", "💡", "⚡", "✨", "🎯", "💪"];
const FORBIDDEN_PATTERNS = [
  /\?[\s]*$/m, // closing question
  /follow me|subscribe|share this|tag someone/i, // social CTAs
];

function checkHardRules(
  draft: string,
  doc: KnowledgeDocument,
): GuardrailResult[] {
  const results: GuardrailResult[] = [];
  const source = `rules/${doc.name}`;

  // No emojis
  const foundEmojis = FORBIDDEN_SYMBOLS.filter((e) => draft.includes(e));
  results.push({
    rule: "No emojis",
    source,
    passed: foundEmojis.length === 0,
    detail:
      foundEmojis.length > 0 ? `Found: ${foundEmojis.join(" ")}` : undefined,
  });

  // No closing questions
  const lines = draft.split("\n").filter((l) => l.trim().length > 0);
  const lastLine = lines[lines.length - 1] || "";
  results.push({
    rule: "No closing question",
    source,
    passed: !lastLine.trim().endsWith("?"),
    detail: lastLine.trim().endsWith("?")
      ? `Last line ends with '?'`
      : undefined,
  });

  // No social CTAs
  const socialCtaMatch = FORBIDDEN_PATTERNS[1].test(draft);
  results.push({
    rule: "No social CTAs",
    source,
    passed: !socialCtaMatch,
    detail: socialCtaMatch ? "Social CTA detected" : undefined,
  });

  // English only
  // Simple heuristic: check for common non-ASCII script blocks
  const nonAsciiRatio =
    draft.length === 0
      ? 0
      : (draft.replace(/[\x00-\x7F]/g, "").length / draft.length) * 100;
  results.push({
    rule: "English only",
    source,
    passed: nonAsciiRatio < 5,
    detail:
      nonAsciiRatio >= 5
        ? `${nonAsciiRatio.toFixed(1)}% non-ASCII characters`
        : undefined,
  });

  return results;
}

// ── Formatting Rules ──

function checkFormattingRules(
  draft: string,
  doc: KnowledgeDocument,
): GuardrailResult[] {
  const results: GuardrailResult[] = [];
  const source = `rules/${doc.name}`;

  const lines = draft.split("\n");

  // Hook format: first 3 lines, 50/50/30 char targets
  const hookLines = lines.slice(0, 3).map((l) => l.trim());
  if (hookLines.length >= 3) {
    const hookOk =
      hookLines[0].length <= 60 &&
      hookLines[1].length <= 60 &&
      hookLines[2].length <= 40;
    results.push({
      rule: "Hook format (3 lines, ~50/50/30 chars)",
      source,
      passed: hookOk,
      detail: !hookOk
        ? `Hook lines: ${hookLines[0].length}/${hookLines[1].length}/${hookLines[2].length} chars`
        : undefined,
    });
  }

  // Post length: 800–1600 chars is a healthy range
  const charCount = draft.length;
  results.push({
    rule: "Post length (800-1600 chars)",
    source,
    passed: charCount >= 800 && charCount <= 1600,
    detail:
      charCount < 800 || charCount > 1600
        ? `${charCount} characters`
        : undefined,
  });

  return results;
}

/**
 * Quick Kill Check — 5 binary yes/no questions from hard-rules.md.
 * If ANY fail, the post should be stopped before scoring.
 */
export function quickKillCheck(
  draft: string,
  knowledge: KnowledgeDocument[],
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  // 1. Is it about one topic only? (heuristic: no "also" + topic shift patterns)
  // This is a simplified check — the scorer does the real analysis
  const hasMultiTopicSignal =
    /\b(also|additionally|on another note|switching)\b/i.test(draft);
  if (hasMultiTopicSignal) {
    failures.push("Possible multi-topic post detected");
  }

  // 2. Does it contain a decision mistake?
  const hasDecisionFrame =
    /\b(mistake|wrong|fail|avoid|don't|instead of)\b/i.test(draft);
  if (!hasDecisionFrame) {
    failures.push("No decision-mistake framing detected");
  }

  // 3. Expert tone? (absence of motivation/hustle patterns)
  const hasAntiTone =
    /\b(grind|hustle|believe in yourself|you got this|dream big|never give up)\b/i.test(
      draft,
    );
  if (hasAntiTone) {
    failures.push("Anti-tone detected (motivational/hustle language)");
  }

  // 4. No forbidden emojis
  const hasEmojis = FORBIDDEN_SYMBOLS.some((e) => draft.includes(e));
  if (hasEmojis) {
    failures.push("Forbidden emojis detected");
  }

  // 5. English only
  const nonAsciiRatio =
    draft.length === 0
      ? 0
      : (draft.replace(/[\x00-\x7F]/g, "").length / draft.length) * 100;
  if (nonAsciiRatio >= 5) {
    failures.push("Non-English content detected");
  }

  return { passed: failures.length === 0, failures };
}
