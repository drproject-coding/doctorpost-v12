import type { BrandProfile } from "@/lib/types";

/**
 * Replace {{brand.*}} mustache variables in a tone template
 * with values from the user's BrandProfile.
 * Missing values resolve to empty string — never throws.
 */
export function interpolateTemplate(
  template: string,
  profile: BrandProfile,
): string {
  return template
    .replace(/\{\{brand\.name\}\}/g, profile.name ?? "")
    .replace(/\{\{brand\.company\}\}/g, profile.companyName ?? "")
    .replace(/\{\{brand\.role\}\}/g, profile.role ?? "")
    .replace(/\{\{brand\.industry\}\}/g, profile.industry ?? "")
    .replace(/\{\{brand\.audience\}\}/g, (profile.audience ?? []).join(", "))
    .replace(/\{\{brand\.tones\}\}/g, (profile.tones ?? []).join(", "))
    .replace(/\{\{brand\.copy_guidelines\}\}/g, profile.copyGuideline ?? "")
    .replace(/\{\{brand\.taboos\}\}/g, (profile.taboos ?? []).join(", "))
    .replace(/\{\{brand\.forbidden_words\}\}/g, "")
    .replace(
      /\{\{brand\.content_pillars\}\}/g,
      (profile.pillars ?? []).join(", "),
    )
    .replace(
      /\{\{brand\.style\}\}/g,
      profile.styleGuide ? JSON.stringify(profile.styleGuide) : "",
    );
}
