import { DocumentCategory } from "../types";

/**
 * Maps each Doctor Project content-factory .md file to its knowledge layer
 * document entry. The `sourcePath` is relative to the content-factory root
 * (doctor-project-content-factory/).
 */
export interface SeedEntry {
  sourcePath: string;
  category: DocumentCategory;
  subcategory: string;
  name: string;
}

export const SEED_MANIFEST: SeedEntry[] = [
  // ── Rules ──
  {
    sourcePath: "rules/brand-voice.md",
    category: "rules",
    subcategory: "brand",
    name: "brand-voice",
  },
  {
    sourcePath: "rules/hard-rules.md",
    category: "rules",
    subcategory: "brand",
    name: "hard-rules",
  },
  {
    sourcePath: "rules/formatting-rules.md",
    category: "rules",
    subcategory: "formatting",
    name: "formatting-rules",
  },
  {
    sourcePath: "rules/scoring-rules.md",
    category: "rules",
    subcategory: "scoring",
    name: "scoring-rules",
  },
  {
    sourcePath: "rules/content-strategy.md",
    category: "rules",
    subcategory: "strategy",
    name: "content-strategy",
  },

  // ── References ──
  {
    sourcePath: "references/vocabulary.md",
    category: "references",
    subcategory: "language",
    name: "vocabulary",
  },
  {
    sourcePath: "references/tone-shifts.md",
    category: "references",
    subcategory: "language",
    name: "tone-shifts",
  },
  {
    sourcePath: "references/content-matrix.md",
    category: "references",
    subcategory: "strategy",
    name: "content-matrix",
  },
  {
    sourcePath: "references/content-funnel.md",
    category: "references",
    subcategory: "strategy",
    name: "content-funnel",
  },
  {
    sourcePath: "references/headline-formulas.md",
    category: "references",
    subcategory: "copywriting",
    name: "headline-formulas",
  },
  {
    sourcePath: "references/kpi-benchmarks.md",
    category: "references",
    subcategory: "data",
    name: "kpi-benchmarks",
  },
  {
    sourcePath: "references/copy-techniques.md",
    category: "references",
    subcategory: "copywriting",
    name: "copy-techniques",
  },

  // ── Library: Hooks ──
  {
    sourcePath: "library/hooks/pain-driven.md",
    category: "library",
    subcategory: "hooks",
    name: "pain-driven",
  },
  {
    sourcePath: "library/hooks/contrarian.md",
    category: "library",
    subcategory: "hooks",
    name: "contrarian",
  },
  {
    sourcePath: "library/hooks/analytical.md",
    category: "library",
    subcategory: "hooks",
    name: "analytical",
  },
  {
    sourcePath: "library/hooks/field-based.md",
    category: "library",
    subcategory: "hooks",
    name: "field-based",
  },
  {
    sourcePath: "library/hooks/aspirational.md",
    category: "library",
    subcategory: "hooks",
    name: "aspirational",
  },

  // ── Library: Closers & CTAs ──
  {
    sourcePath: "library/closers/closers.md",
    category: "library",
    subcategory: "closers",
    name: "closers",
  },
  {
    sourcePath: "library/ctas/ctas.md",
    category: "library",
    subcategory: "ctas",
    name: "ctas",
  },

  // ── Library: Templates ──
  {
    sourcePath: "library/templates/linkedin-post/strong-opinion.md",
    category: "templates",
    subcategory: "linkedin-post",
    name: "strong-opinion",
  },
  {
    sourcePath: "library/templates/linkedin-post/structured-analysis.md",
    category: "templates",
    subcategory: "linkedin-post",
    name: "structured-analysis",
  },
  {
    sourcePath: "library/templates/linkedin-post/field-storytelling.md",
    category: "templates",
    subcategory: "linkedin-post",
    name: "field-storytelling",
  },
  {
    sourcePath: "library/templates/linkedin-post/myth-vs-reality.md",
    category: "templates",
    subcategory: "linkedin-post",
    name: "myth-vs-reality",
  },

  // ── Learned (empty v1 - placeholders for the learning system) ──
  {
    sourcePath: "learned/preferences.md",
    category: "learned",
    subcategory: "user",
    name: "preferences",
  },
  {
    sourcePath: "learned/style-patterns.md",
    category: "learned",
    subcategory: "patterns",
    name: "style-patterns",
  },
  {
    sourcePath: "learned/hook-patterns.md",
    category: "learned",
    subcategory: "patterns",
    name: "hook-patterns",
  },
  {
    sourcePath: "learned/calibration.md",
    category: "learned",
    subcategory: "scoring",
    name: "calibration",
  },
  {
    sourcePath: "learned/winners.md",
    category: "learned",
    subcategory: "performance",
    name: "winners",
  },
  {
    sourcePath: "learned/changelog.md",
    category: "learned",
    subcategory: "system",
    name: "changelog",
  },
];
