import { DropdownOption } from "@/lib/types";

/**
 * The source of a post creation configuration.
 * - 'profile'  — derived automatically from the user's brand profile
 * - 'preset'   — a curated preset chosen by the user
 * - 'custom'   — manually configured by the user
 */
export type PostCreationSource = "profile" | "preset" | "custom";

/**
 * Full catalogue of available dropdown options for the four post-creation
 * dimensions.  Populated from dropdownData.ts and passed into UI components
 * so they never import dropdown data directly.
 */
export interface PostCreationConfig {
  /** All available post-type options (e.g. carousel, story, poll). */
  postTypes: DropdownOption[];

  /** All available hook-pattern options (e.g. question, bold claim). */
  hookPatterns: DropdownOption[];

  /** All available content-pillar options (e.g. education, inspiration). */
  contentPillars: DropdownOption[];

  /** All available tone options (e.g. professional, casual). */
  tones: DropdownOption[];
}

/**
 * A resolved set of selections — one id per dimension — that represents the
 * "smart default" state for a post-creation session.
 *
 * Each field holds the `id` of the chosen DropdownOption so that components
 * can look up full option details from PostCreationConfig without duplicating
 * data.
 */
export interface PostCreationDefaults {
  /** Id of the selected post type. */
  selectedPostType: string;

  /** Id of the selected hook pattern. */
  selectedHookPattern: string;

  /** Id of the selected content pillar. */
  selectedPillar: string;

  /** Id of the selected tone. */
  selectedTone: string;
}

/**
 * A named, curated preset that bundles a human-readable description with a
 * complete set of PostCreationDefaults.
 *
 * Presets are displayed in the UI so creators can quickly apply proven
 * combinations without configuring each dimension manually.
 */
export interface PostCreationPreset {
  /** Unique identifier for the preset. */
  id: string;

  /** Short display name shown in the preset picker (e.g. "Thought Leader"). */
  name: string;

  /** One-sentence explanation of when to use this preset. */
  description: string;

  /** The concrete dimension selections this preset applies. */
  defaults: PostCreationDefaults;
}
