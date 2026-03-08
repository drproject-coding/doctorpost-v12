# Tone Prompt Templates — Native Prompts in Knowledge

**Session:** plan-2026-03-08-1543
**Date:** 2026-03-08
**Status:** Approved

---

## Problem Statement

The 13 tone system prompts exist only in an external markdown file. The post generator today uses a generic system prompt with brand context injected as a flat text block — it does not use per-tone writing instructions. Tones are also currently a brand-wide setting (stored on the brand profile globally), not a per-post runtime parameter. Users have no way to see, understand, or customise how each tone actually writes. Tone selection feels like a label rather than a real writing mode.

---

## Scope & Boundaries

### IN

- Seed 13 system tone templates into Knowledge › Templates tab on first visit (per user, auto on load)
- System templates: locked (read-only), with a "Fork" button
- User forks: fully editable copy of a system template, linked to the same tone ID
- Generator: resolve the correct system prompt at generation time (user fork → system seed → legacy fallback)
- Brand variable interpolation: `{{brand.*}}` vars replaced from `BrandProfile` at generation time
- Create page: "Preview prompt" link on tone selector opens a modal with the underlying system prompt text
- **No new DB table** — use existing `documents` table: `category = "templates"`, `subcategory = toneId`, `source = "seed"` marks system/locked

### OUT

- Creating a tone template from scratch (fork-only for now)
- Multi-tone per post
- Template versioning UI beyond the existing `version` field
- Surfacing tone scores or A/B results per template

---

## Success Criteria

1. Knowledge › Templates tab shows all 13 system tone templates, locked, with display name + one-line description
2. "Fork" button creates a user-editable copy; the fork is used by the generator instead of the system default
3. Post generation uses the resolved system prompt (with `{{brand.*}}` vars replaced) instead of the generic prompt
4. Create page tone selector has a "Preview" link that shows the system prompt text (pre-variable-substitution) in a modal
5. Auto-seed is idempotent — running it twice does not create duplicates

---

## Dependencies

- NCB `documents` table — existing, no schema migration needed
- `lib/knowledge/types.ts` — `KnowledgeDocument`, `NcbDocumentRow`, `mapDocumentFromNcb`
- `lib/api.ts` — `getBrandProfile` (for variable resolution)
- `lib/prompts.ts` — current post generation system prompt construction
- `lib/dropdownData.ts` — `enhancedToneOptions` (13 tone IDs + display names)
- `components/knowledge/DocumentEditor.tsx` — needs read-only mode for locked docs

---

## Risks & Mitigations

| Risk                                             | Mitigation                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| NCB RLS blocks seed inserts for system rows      | Seed uses authenticated user session; rows are inserted per-user, not globally                                        |
| Auto-seed on every load causes duplicate rows    | Seed checks for existence before inserting (`subcategory = toneId` + `source = "seed"` per user)                      |
| `{{brand.*}}` var not found in profile           | Interpolation uses empty string fallback; never errors                                                                |
| User deletes fork — generator falls back to seed | Correct and expected fallback behaviour                                                                               |
| `subcategory` collision with other template docs | Template tone docs use `subcategory = toneId` (e.g. `casual-witty`); other templates use different subcategory values |

---

## Verification Checklist

- [ ] 13 templates visible in Knowledge › Templates tab on first visit
- [ ] System templates show lock icon / no edit or delete controls
- [ ] Fork button creates a new editable doc with same subcategory
- [ ] Editing a fork and saving persists changes
- [ ] Generator uses fork when present, seed when not, legacy when neither
- [ ] `{{brand.name}}` and `{{brand.industry}}` are replaced correctly in generated system prompt
- [ ] Create page tone selector shows "Preview" link; modal renders the full prompt text
- [ ] Auto-seed is idempotent (verified by calling twice, count stays at 13)
- [ ] TypeScript `npx tsc --noEmit` passes

---

## Task Breakdown

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                      | Files                                                                           | Deps | Batch |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---- | ----- |
| 1   | Seed utility: 13 tone templates as KnowledgeDocs                          | `lib/knowledge/seedToneTemplates.ts`                                            | -    | 1     |
| 2   | Auto-seed on Knowledge page load (idempotent)                             | `app/(protected)/knowledge/page.tsx`                                            | 1    | 1     |
| 3   | Templates tab: system badge + lock state (no edit/delete for source=seed) | `app/(protected)/knowledge/page.tsx`, `components/knowledge/DocumentEditor.tsx` | 2    | 2     |
| 4   | Fork action: clone seed doc as source=user-edit with same subcategory     | `app/(protected)/knowledge/page.tsx`, `components/knowledge/DocumentEditor.tsx` | 3    | 2     |
| 5   | Brand variable interpolation helper                                       | `lib/knowledge/interpolateTemplate.ts`                                          | -    | 3     |
| 6   | Prompt template resolver (user fork → seed → null)                        | `lib/knowledge/resolvePromptTemplate.ts`                                        | 5    | 3     |
| 7   | Wire resolver into post generation system prompt                          | `lib/prompts.ts`                                                                | 5, 6 | 3     |
| 8   | Create page tone selector: "Preview prompt" modal                         | `app/(protected)/create/page.tsx`                                               | 1    | 4     |
| 9   | Tone preview modal component                                              | `components/TonePromptPreviewModal.tsx`                                         | 1    | 4     |

<!-- EXECUTION_TASKS_END -->

---

## Seed Data Contract

Each of the 13 tone templates is seeded as a `KnowledgeDocument` with:

```
category:    "templates"
subcategory: "<tone-id>"          // e.g. "casual-witty"
name:        "<Display Name>"     // e.g. "Casual & Witty"
content:     "<system prompt>"    // full {{brand.*}} template string
source:      "seed"               // marks as system / locked
isActive:    true
version:     1
updatedBy:   "system"
```

### Tone ID → Display Name mapping

| tone_id                | Display Name           |
| ---------------------- | ---------------------- |
| casual-witty           | Casual & Witty         |
| professional-authority | Professional Authority |
| approachable-expert    | Approachable Expert    |
| snap-snark             | Snap & Snark           |
| plain-talk-playbook    | Plain Talk Playbook    |
| anecdote-to-aha        | Anecdote to Aha        |
| bias-buster            | Bias Buster            |
| open-heart-honest      | Open Heart Honest      |
| future-forward-glow    | Future Forward Glow    |
| money-with-meaning     | Money With Meaning     |
| conversion-mode        | Conversion Mode        |
| nerdy-fun-run          | Nerdy Fun Run          |
| mission-voice          | Mission Voice          |

---

## Generator Resolution Logic

```ts
// lib/knowledge/resolvePromptTemplate.ts
async function resolvePromptTemplate(
  toneId: string,
  userId: string,
): Promise<string | null> {
  // 1. Look for user fork
  const userFork = await queryDoc({
    category: "templates",
    subcategory: toneId,
    source: "user-edit",
    userId,
  });
  if (userFork) return userFork.content;

  // 2. Look for system seed
  const seed = await queryDoc({
    category: "templates",
    subcategory: toneId,
    source: "seed",
    userId,
  });
  if (seed) return seed.content;

  // 3. No template → caller falls back to legacy generic prompt
  return null;
}
```

```ts
// lib/knowledge/interpolateTemplate.ts
function interpolateTemplate(template: string, profile: BrandProfile): string {
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
```
