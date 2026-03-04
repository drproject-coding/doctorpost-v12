import {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";
import type { DropdownOption } from "@/lib/types";
import type { PostCreationDefaults } from "@/lib/types/post-creation";
import type { ProfileCreationData } from "@/lib/hooks/useProfileData";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return the first option whose performanceIndicator is 'high', falling back
 * to the very first option in the list if none is marked high.
 */
function firstHighPerformance(options: DropdownOption[]): DropdownOption {
  return options.find((o) => o.performanceIndicator === "high") ?? options[0];
}

/**
 * Attempt to find a matching option by comparing a profile string against
 * option ids and labels (case-insensitive, trimmed).
 * Returns the matched option or null.
 */
function matchOption(
  options: DropdownOption[],
  profileValues: string[],
): DropdownOption | null {
  if (!profileValues || profileValues.length === 0) return null;

  for (const value of profileValues) {
    const normalised = value.trim().toLowerCase();
    const match = options.find(
      (o) =>
        o.id.toLowerCase() === normalised ||
        o.label.toLowerCase() === normalised ||
        o.value.toLowerCase() === normalised,
    );
    if (match) return match;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Determine smart defaults for the four post-creation dimensions.
 *
 * Strategy:
 * - tone: match profile tones → fallback to first high-performance tone
 * - postType: always first high-performance option (no profile signal)
 * - hookPattern: always first high-performance option (no profile signal)
 * - pillar: match profile industry → fallback to first high-performance pillar
 *
 * @param profile - user profile data, or null when no profile is available
 * @returns resolved PostCreationDefaults (one id per dimension)
 */
export function getSmartDefaults(
  profile: ProfileCreationData | null,
): PostCreationDefaults {
  // Tone — match profile tones array against tone options
  const toneMatch =
    profile?.tones && profile.tones.length > 0
      ? matchOption(enhancedToneOptions, profile.tones)
      : null;
  const selectedTone = (toneMatch ?? firstHighPerformance(enhancedToneOptions))
    .id;

  // Post type — no direct profile signal; use first high-performance option
  const selectedPostType = firstHighPerformance(enhancedPostTypes).id;

  // Hook pattern — no direct profile signal; use first high-performance option
  const selectedHookPattern = firstHighPerformance(enhancedHookPatterns).id;

  // Pillar — match profile industry as a single-element array for reuse of matchOption
  const industryValues = profile?.industry ? [profile.industry] : [];
  const pillarMatch =
    industryValues.length > 0
      ? matchOption(enhancedContentPillars, industryValues)
      : null;
  const selectedPillar = (
    pillarMatch ?? firstHighPerformance(enhancedContentPillars)
  ).id;

  return {
    selectedPostType,
    selectedHookPattern,
    selectedPillar,
    selectedTone,
  };
}

// ---------------------------------------------------------------------------

export interface RecommendedOptions {
  postTypes: DropdownOption[];
  hookPatterns: DropdownOption[];
  contentPillars: DropdownOption[];
  tones: DropdownOption[];
}

/**
 * Return ordered lists for each dimension, prioritising:
 * 1. Options that match profile data (tones, industry/audience)
 * 2. High-performance options
 * 3. Trending options
 * 4. Everything else
 *
 * @param profile - user profile data, or null
 */
export function getRecommendedOptions(
  profile: ProfileCreationData | null,
): RecommendedOptions {
  const scoreOption = (
    option: DropdownOption,
    profileMatches: Set<string>,
  ): number => {
    let score = 0;
    if (profileMatches.has(option.id)) score += 100;
    if (option.performanceIndicator === "high") score += 10;
    if (option.isTrending) score += 5;
    return score;
  };

  const sortOptions = (
    options: DropdownOption[],
    profileMatches: Set<string>,
  ): DropdownOption[] =>
    [...options].sort(
      (a, b) => scoreOption(b, profileMatches) - scoreOption(a, profileMatches),
    );

  // Build profile-match sets for each dimension
  const toneMatches = new Set<string>();
  if (profile?.tones) {
    for (const t of profile.tones) {
      const match = matchOption(enhancedToneOptions, [t]);
      if (match) toneMatches.add(match.id);
    }
  }

  const pillarMatches = new Set<string>();
  if (profile?.industry) {
    const match = matchOption(enhancedContentPillars, [profile.industry]);
    if (match) pillarMatches.add(match.id);
  }
  if (profile?.audience) {
    for (const a of profile.audience) {
      const match = matchOption(enhancedContentPillars, [a]);
      if (match) pillarMatches.add(match.id);
    }
  }

  // postTypes and hookPatterns have no direct profile signal; use empty sets
  const emptySet = new Set<string>();

  return {
    postTypes: sortOptions(enhancedPostTypes, emptySet),
    hookPatterns: sortOptions(enhancedHookPatterns, emptySet),
    contentPillars: sortOptions(enhancedContentPillars, pillarMatches),
    tones: sortOptions(enhancedToneOptions, toneMatches),
  };
}
