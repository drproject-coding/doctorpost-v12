# Plan: US-049 + US-050 — Create Form Redesign

**Session:** plan-2026-03-07-2257
**Date:** 2026-03-08
**Branch:** feature/create
**Approach:** Surgical — keep PostGenerator, add 2 new server routes, new UI components

---

## Problem Statement

The Create form has three UX and architecture problems:

1. **Tone selector** duplicates brand profile — cognitive load, inconsistency
2. **Hook Pattern** presented as a dropdown obscures its purpose; needs 7 chip-based "Content Angle" options
3. **Post Type** dropdown (15 options) should be 5 visual cards with clear structural meaning

Additionally, pillar and angle are not auto-recommended after subtopic selection, forcing the user to manually map every post to their strategy.

---

## Scope & Boundaries

| In scope                                                    | Out of scope                            |
| ----------------------------------------------------------- | --------------------------------------- |
| Remove tone selector from Create UI                         | Tone changes in Studio / Factory        |
| New `/api/create/generate` route (server injects tone)      | `content_history` table (AC16 deferred) |
| New `/api/create/recommend-params` route                    | Style/learning profile                  |
| ContentAngleChips (7 options)                               | Factory page migration                  |
| PostStructureCards (5 options)                              | Mobile/responsive redesign              |
| Collapsible AI recommendations panel                        |                                         |
| localStorage for PostStructure                              |                                         |
| Auto-recommend on subtopic select (4s timeout, silent fail) |                                         |
| Update PostGenerationParameters type                        |                                         |
| Update dropdownData option sets                             |                                         |
| Update getPostRecommendations system prompt                 |                                         |
| Update affected tests                                       |                                         |

**Factory page risk:** Factory's selectors still reference old `enhancedHookPatterns` / `enhancedPostTypes` data. Task 1 preserves old keys to avoid breakage. Factory migration is a separate story.

---

## Success Criteria

- Tone field is gone from Create — no label, no greyed state, zero UI references
- Generating a post calls `/api/create/generate` which reads `brand_profiles.tones[]` server-side
- Content Angle shows 7 chips, none pre-selected, tooltip on hover, "suggested" badge from auto-recommend
- Post Structure shows 5 visual cards, last-used persisted in localStorage
- After subtopic selection: pillar + angle auto-fill within 4s or silently skip (no error state)
- Form order: Topic → Subtopic → Pillar → Content Angle → Post Structure → Generate
- AI Recommendations section collapses/expands correctly
- `PostGenerationParameters` type has `contentAngle`, `postStructure`, no `toneId`
- All tests pass

---

## Content Angle Options (7)

| Value             | Tooltip                                                       |
| ----------------- | ------------------------------------------------------------- |
| Contrarian        | Challenges a widely held belief in your field                 |
| Analytical        | Breaks down data, patterns, or trends with your take          |
| Observation       | Shares something you noticed that others have missed          |
| Actionable        | Gives the reader a clear step or framework they can use today |
| X vs Y            | Compares two approaches, tools, or ideas side by side         |
| Present vs Future | Contrasts where things are now with where they're heading     |
| Listicle          | Delivers value through a numbered or bulleted list            |

## Post Structure Options (5)

| Value        | Description                                      |
| ------------ | ------------------------------------------------ |
| Opinion/Take | Share your perspective on an industry topic      |
| How-To       | Step-by-step guide to accomplish something       |
| Observation  | Something you noticed that others should know    |
| Story        | A personal or case-study narrative with a lesson |
| List         | Curated items that deliver fast, scannable value |

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                                                                                                                                                                                                                | Files                                                                                         | Deps       | Batch |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- | ----- |
| 1   | Replace option data — rewrite `enhancedHookPatterns` → 7 Content Angle options, `enhancedPostTypes` → 5 Post Structure options; keep old keys as deprecated aliases for Factory                                                                                                     | `lib/dropdownData.ts`                                                                         | -          | 1     |
| 2   | Update type system — rename `hookPattern → contentAngle`, `postType → postStructure`, remove `toneId` from `PostGenerationParameters`; add `content_angle?: string`, `post_structure?: string` to `ScheduledPost`                                                                   | `lib/types.ts`, `lib/types/post-creation.ts`                                                  | -          | 1     |
| 3   | Build `/api/create/generate` route — server reads `brand_profiles` for auth user (tones[], audience, role, industry), builds structured prompt with `{ topic, subtopic, pillar, content_angle, post_structure }`, calls AI via existing provider pattern, streams response          | `app/api/create/generate/route.ts`                                                            | 1, 2       | 2     |
| 4   | Build `/api/create/recommend-params` route — reads user's pillars from `brand_profiles`, calls AI with topic + subtopic + pillar list, validates returned angle against 7 valid values server-side, 4s timeout with silent null fallback                                            | `app/api/create/recommend-params/route.ts`                                                    | 1          | 2     |
| 5   | Update `getPostRecommendations` system prompt — replace hardcoded old option values with the 7 Content Angle names and 5 Post Structure names                                                                                                                                       | `lib/api.ts`                                                                                  | 1          | 2     |
| 6   | Build `ContentAngleChips` — 7 chips, single-select, hover tooltip, "suggested" badge state, no default                                                                                                                                                                              | `components/create/ContentAngleChips.tsx`                                                     | 1          | 2     |
| 7   | Build `PostStructureCards` — 5 visual cards (icon + label + description), single-select, localStorage persistence                                                                                                                                                                   | `components/create/PostStructureCards.tsx`                                                    | 1          | 2     |
| 8   | Adapt `PostGenerator` — remove `toneId` from params, call `/api/create/generate` instead of `generatePost()`, pass `contentAngle` and `postStructure`                                                                                                                               | `components/PostGenerator.tsx`                                                                | 3, 2       | 3     |
| 9   | Rewrite Create page — remove tone selector, replace hook dropdown with `ContentAngleChips`, replace post-type dropdown with `PostStructureCards`, collapsible "AI Recommendations" section (auto-expands on subtopic select), wire subtopic-select → `/api/create/recommend-params` | `app/(protected)/create/page.tsx`                                                             | 4, 6, 7, 8 | 4     |
| 10  | Update `savePostDraft` — add `content_angle` and `post_structure` to payload; fire-and-forget (NCB columns may not exist yet)                                                                                                                                                       | `lib/api.ts`                                                                                  | 2, 9       | 4     |
| 11  | Strip tone from smart defaults — remove tone selection from `getSmartDefaults`; remove tone-related logic from Create                                                                                                                                                               | `lib/post-creation/smartDefaults.ts`, `app/(protected)/create/page.tsx`                       | 9          | 4     |
| 12  | Update tests — rename field references (`hookPattern→contentAngle`, `postType→postStructure`, remove `toneId`); update option fixtures                                                                                                                                              | `__tests__/components/PostGenerator.test.tsx`, `__tests__/integration/post-creation.test.tsx` | 8, 9       | 5     |

<!-- EXECUTION_TASKS_END -->

---

## Risks & Mitigations

| Risk                                                         | Mitigation                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Factory page breaks if old option keys removed               | Task 1 keeps deprecated aliases; Factory migration separate story               |
| Prompt quality regression from removing 13 crafted templates | Task 3 prompt must encode angle + structure semantics; validate before shipping |
| AI recommend-params returns invalid angle                    | Task 4 validates server-side; invalid → null → field stays empty                |
| Existing drafts have no content_angle/post_structure         | Library renders empty — non-breaking                                            |
| 4s timeout fires too often on slow providers                 | Task 4 silent fallback; user sets fields manually                               |

---

## Verification Checklist

- [ ] `toneId` and `selectedToneId` absent from Create page
- [ ] No `ToneSelector` import in Create
- [ ] `ContentAngleChips` renders 7 chips with correct tooltips
- [ ] `PostStructureCards` renders 5 cards; selection persists on reload
- [ ] Subtopic selection triggers recommend-params and pre-fills with "suggested" badge
- [ ] Generate calls `/api/create/generate` (Network tab)
- [ ] Generated post reflects selected angle and structure
- [ ] All 12 tests pass
- [ ] Factory page renders without errors
- [ ] TypeScript build clean
