/**
 * Visual prompt templates for AI image generation.
 * [FILL] is replaced by the visual agent with content-specific text.
 */

export interface VisualPromptTemplate {
  id: string;
  label: string;
  category: string;
  /** Full Midjourney-style prompt with [FILL] placeholder */
  template: string;
  /** Description of what [FILL] should be */
  placeholderHint: string;
  /** Example of a good [FILL] value */
  exampleFill: string;
  /** Aspect ratio hint for image generation sizing */
  aspectRatio: "1:1" | "2:3" | "3:2" | "9:16" | "16:9";
}

export const VISUAL_PROMPT_TEMPLATES: VisualPromptTemplate[] = [
  {
    id: "dadaist-surreal",
    label: "Minimal Dadaist Surreal",
    category: "Art",
    template:
      "Minimal surreal art inspired by a modern interpretation of Dadaism, featuring [FILL], a muted pastel background with soft, organic textures, gentle interplay of shadows and light, and delicately suspended objects that defy gravity. The composition evokes a surreal sense of wonder and quiet intrigue. --ar 2:3 --style raw --v 6.1 --stylize 200",
    placeholderHint:
      "a symbolic object or action with an abstract and unexpected twist that metaphorically represents the post's core message",
    exampleFill: "a chessboard with pieces levitating above their squares",
    aspectRatio: "2:3",
  },
];

/** Pick the best template for a given post. Returns the template ID. */
export function pickBestTemplate(
  _postText: string,
  _format: string,
): VisualPromptTemplate {
  // With one template, always return it.
  // When we have 100+, the visual agent AI will pick.
  return VISUAL_PROMPT_TEMPLATES[0];
}
