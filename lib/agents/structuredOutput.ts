/**
 * Parses structured JSON output from Claude agent responses.
 *
 * Agents are prompted to return JSON, but Claude may wrap it in markdown
 * code fences or include preamble text. This module extracts and validates
 * the JSON portion.
 */

/**
 * Extract JSON from a Claude response that may contain markdown fences
 * or surrounding text.
 */
export function extractJson<T>(raw: string): T {
  // Detect if response is an error page (HTML with loading spinner or error indicators)
  if (
    raw.includes("<!DOCTYPE") ||
    raw.includes("<html") ||
    raw.includes("loading-spinner") ||
    raw.includes("Application error") ||
    (raw.includes("<") &&
      raw.includes(">") &&
      raw.length < 5000 &&
      !raw.includes("{"))
  ) {
    // This is likely an HTML error page
    const excerpt = raw.slice(0, 300);
    throw new Error(
      `Formatter agent returned an HTML error page instead of JSON. The agent may have crashed or made an invalid API call. HTML excerpt: "${excerpt}..."`,
    );
  }

  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Continue to extraction strategies
  }

  // Try extracting from markdown code fence
  // Match: ```[json] followed by content until ``` or end
  // Handles both same-line (```json {...}) and multi-line formats
  const fenceStart = raw.indexOf("```");
  if (fenceStart !== -1) {
    let contentStart = fenceStart + 3; // Skip ```
    // Skip optional 'json' tag and whitespace
    const afterFence = raw.slice(contentStart);
    const langMatch = afterFence.match(/^(json)?\s*\n?/);
    if (langMatch) {
      contentStart += langMatch[0].length;
    }

    // Find closing fence or end of string
    const fenceEnd = raw.indexOf("```", contentStart);
    const endPos = fenceEnd !== -1 ? fenceEnd : raw.length;
    const content = raw.slice(contentStart, endPos).trim();

    if (content) {
      try {
        return JSON.parse(content) as T;
      } catch {
        // Continue to next strategy
      }
    }
  }

  // Try finding the first JSON object or array
  const jsonStart = raw.search(/[[{]/);
  if (jsonStart !== -1) {
    const candidate = raw.slice(jsonStart);
    // Find matching closing bracket
    const openChar = candidate[0];
    const closeChar = openChar === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === openChar) depth++;
      if (char === closeChar) depth--;

      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(0, i + 1)) as T;
        } catch {
          break;
        }
      }
    }
  }

  throw new Error(
    `Failed to extract JSON from agent response. Raw output starts with: "${raw.slice(0, 200)}..."`,
  );
}

/**
 * Validate that a parsed object has all required fields.
 */
export function validateFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: string[],
): void {
  const missing = requiredFields.filter(
    (field) => !(field in obj) || obj[field] === undefined,
  );
  if (missing.length > 0) {
    throw new Error(
      `Agent response missing required fields: ${missing.join(", ")}`,
    );
  }
}
