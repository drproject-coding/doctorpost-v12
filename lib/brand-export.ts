import type { BrandProfile } from "./types";

const SENSITIVE_FIELDS: (keyof BrandProfile)[] = [
  "claudeApiKey",
  "straicoApiKey",
  "oneforallApiKey",
  "perplexityApiKey",
  "redditClientId",
  "redditClientSecret",
  "openAIKey",
];

export function exportAsMarkdown(profile: BrandProfile): string {
  const lines: string[] = [];
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  // Header
  lines.push(`# Brand Guidelines — ${fullName}`);

  const headerMeta = [profile.companyName, profile.role, profile.industry]
    .filter(Boolean)
    .join(" | ");
  if (headerMeta) lines.push(headerMeta);

  lines.push(
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // Profile
  lines.push("## Profile");
  if (fullName) lines.push(`- **Name:** ${fullName}`);
  if (profile.companyName) lines.push(`- **Company:** ${profile.companyName}`);
  if (profile.role) lines.push(`- **Role:** ${profile.role}`);
  if (profile.industry) lines.push(`- **Industry:** ${profile.industry}`);
  if (profile.audience?.length) {
    lines.push(`- **Audience:** ${profile.audience.join(", ")}`);
  }
  lines.push("");

  // Voice & Guidelines
  lines.push("## Voice & Guidelines");
  if (profile.tones?.length) {
    lines.push(`- **Tones:** ${profile.tones.join(", ")}`);
  }
  if (profile.copyGuideline) {
    lines.push(`- **Copy Guideline:** ${profile.copyGuideline}`);
  }
  if (profile.styleGuide) {
    const emojiVal = profile.styleGuide.emoji ? "yes" : "no";
    const hashtagsVal = profile.styleGuide.hashtags ?? 0;
    const linksVal = profile.styleGuide.links ?? "";
    lines.push(
      `- **Style:** Emoji: ${emojiVal}, Hashtags: ${hashtagsVal}, Links: ${linksVal}`,
    );
  }
  if (profile.taboos?.length) {
    lines.push(`- **Taboos:** ${profile.taboos.join(", ")}`);
  }
  lines.push("");

  // Content Strategy
  lines.push("## Content Strategy");
  if (profile.contentStrategy) {
    lines.push("**Strategy:**");
    lines.push(profile.contentStrategy);
    lines.push("");
  }
  if (profile.definition) {
    lines.push("**Brand Definition:**");
    lines.push(profile.definition);
    lines.push("");
  }

  // Offers
  if (profile.offers?.length) {
    lines.push("## Offers & Value Proposition");
    for (const offer of profile.offers) {
      if (offer) lines.push(`- ${offer}`);
    }
    lines.push("");
  }

  // Positioning
  if (profile.positioning) {
    lines.push("## Brand Positioning");
    lines.push(profile.positioning);
    lines.push("");
  }

  // AI & Tools
  lines.push("## AI & Tools");
  if (profile.aiProvider) {
    lines.push(`- **Active Provider:** ${profile.aiProvider}`);
  }

  return lines.join("\n");
}

export function exportAsJson(profile: BrandProfile): string {
  const sanitized: Record<string, unknown> = { ...profile };

  for (const field of SENSITIVE_FIELDS) {
    const value = profile[field];
    if (value !== undefined) {
      sanitized[field] = value ? "[configured]" : "[not configured]";
    }
  }

  return JSON.stringify(sanitized, null, 2);
}

export async function copyToClipboard(profile: BrandProfile): Promise<void> {
  const markdown = exportAsMarkdown(profile);
  await navigator.clipboard.writeText(markdown);
}

export function downloadFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportAndDownloadMarkdown(profile: BrandProfile): void {
  const content = exportAsMarkdown(profile);
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const filename = fullName
    ? `brand-guidelines-${fullName}.md`
    : "brand-guidelines.md";
  downloadFile(filename, content, "text/markdown;charset=utf-8");
}

export function exportAndDownloadJson(profile: BrandProfile): void {
  const content = exportAsJson(profile);
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const filename = fullName
    ? `brand-profile-${fullName}.json`
    : "brand-profile.json";
  downloadFile(filename, content, "application/json;charset=utf-8");
}

export function triggerPrint(): void {
  window.print();
}
