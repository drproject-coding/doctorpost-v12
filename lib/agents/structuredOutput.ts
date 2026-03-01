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
  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Continue to extraction strategies
  }

  // Try extracting from markdown code fence
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // Continue
    }
  }

  // Try finding the first JSON object or array
  const jsonStart = raw.search(/[\[{]/);
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
    `Failed to extract JSON from agent response. Raw output starts with: "${raw.slice(0, 100)}..."`,
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
