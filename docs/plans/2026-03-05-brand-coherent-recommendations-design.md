# Brand-Coherent Auto-Selection Design

**Date:** 2026-03-05
**Feature:** Smart dropdown auto-selection based on user brand profile
**Status:** Approved

---

## Problem

The `getPostRecommendations` AI call sends topic + subtopic but **zero brand context**. The AI doesn't know the user's industry, role, audience, preferred tones, or content strategy — it's making generic recommendations that may not fit the user's brand at all.

Additionally, recommendations only trigger after subtopic selection. If the user skips subtopics and types directly, they get only the rule-based `getSmartDefaults` (which is deterministic, not AI-powered).

---

## Goal

When a user types a topic on the Create page, the 4 dropdowns (Post Type, Hook Pattern, Content Pillar, Tone) should auto-select the most coherent options **for their specific brand** — no guessing, no generic defaults.

---

## Approach: Option A — AI Auto-Select with Brand Context

Keep all dropdown options visible. Let AI pre-select the most brand-coherent option for each field. User can always override. "Smart Choice" badges confirm AI-selected fields.

---

## Architecture

### Change 1: Brand-aware AI prompt (`lib/api.ts`)

Update `getPostRecommendations` signature to accept brand profile fields:

```ts
getPostRecommendations = async (
  topic: string,
  subtopic: string,
  settings: AiSettings,
  brandContext?: {
    industry: string;
    role: string;
    audience: string[];
    tones: string[];
    contentStrategy: string;
    definition: string;
  }
): Promise<PostRecommendation>
```

Inject brand context into the system prompt:

```
You are a LinkedIn content strategist for this specific professional:
- Industry: {industry}
- Role: {role}
- Audience: {audience.join(', ')}
- Preferred tones: {tones.join(', ')}
- Content strategy: {contentStrategy}
- Brand definition: {definition}

Given their topic, recommend the MOST COHERENT post configuration for their brand.
Return JSON: postType, hookPattern, contentPillar, toneId, confidence, reasoning, compatible arrays.
```

### Change 2: Second recommendation trigger (`create/page.tsx`)

Currently: recommendations only fire after `handleSelectSubtopic`.

Add: when user submits a topic directly (without picking a subtopic), call `getPostRecommendations(topic, topic, settings, brandContext)` before post generation.

Flow:

1. User types topic → clicks "Generate Post" (skipping subtopics)
2. If no recommendation has been fetched yet → call `getPostRecommendations` first
3. Apply recommendation to dropdowns
4. Then generate

### Change 3: Pass profile to recommendation call (`create/page.tsx`)

Extract brand context from loaded profile and pass it to both existing and new recommendation calls:

```ts
const brandContext = profile
  ? {
      industry: profile.industry,
      role: profile.role,
      audience: profile.audience,
      tones: profile.tones,
      contentStrategy: profile.contentStrategy,
      definition: profile.definition,
    }
  : undefined;
```

---

## What Stays Unchanged

- `getSmartDefaults(profile)` — rule-based defaults on page load (fallback when AI hasn't run)
- "Smart Choice" badges in `CreatePostDialog` — already implemented, just needs richer data
- All 4 dropdown options remain visible — no filtering
- User can always override AI selections

---

## Files to Change

| File                              | Change                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.ts`                      | Add `brandContext` param to `getPostRecommendations`, inject into system prompt                                           |
| `app/(protected)/create/page.tsx` | Extract `brandContext` from profile, pass to both recommendation calls; add recommendation trigger on direct topic submit |

---

## Success Criteria

- User in SaaS industry gets "thought-leadership" + "professional-authority" auto-selected, not random
- User with tones: ["casual", "authentic"] gets "casual-witty" tone auto-selected
- "Smart Choice" badge appears on all 4 fields after typing a topic
- Existing subtopic flow still works (just richer context now)
- No regressions on generate flow
