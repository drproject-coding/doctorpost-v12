# Brand-Coherent Recommendations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 4 dropdowns on the Create page (Post Type, Hook Pattern, Content Pillar, Tone) auto-select the most coherent options for each user's brand by injecting their profile into the AI recommendation call.

**Architecture:** Two surgical changes — (1) add `brandContext` param to `getPostRecommendations` so the AI knows who the user is, (2) trigger recommendations on direct topic submit (not just subtopic selection). No new files, no new API routes, no schema changes.

**Tech Stack:** Next.js 14 App Router, TypeScript, existing `generateWithAi` abstraction, existing `BrandProfile` type from `lib/types.ts`

---

## Context for the Engineer

### Current flow (Create page)

1. User loads page → `getSmartDefaults(profile)` sets rule-based dropdown defaults
2. User types a topic → clicks "Find Subtopics" → `findSubtopics()` returns 5 AI-suggested angles
3. User picks a subtopic → `getPostRecommendations(topic, subtopic, aiSettings)` fires
4. AI returns recommended postType, hookPattern, contentPillar, toneId → dropdowns update
5. "Smart Choice" badge appears on matched fields

### The problem

`getPostRecommendations` sends NO brand context to the AI. The system prompt says "LinkedIn content strategist" but the AI knows nothing about the user's industry, role, audience, or preferred tones. It guesses generically.

### Key files

- `lib/api.ts:417-455` — `getPostRecommendations` function
- `lib/types.ts` — `BrandProfile`, `PostRecommendation` types
- `app/(protected)/create/page.tsx:149-182` — `handleSelectSubtopic` (where rec call lives)
- `app/(protected)/create/page.tsx:197-215` — `handleGeneratePostClick`
- `lib/post-creation/smartDefaults.ts` — rule-based defaults (do NOT change)

### What `PostRecommendation` looks like (already in types.ts)

```ts
interface PostRecommendation {
  postType: string;
  hookPattern: string;
  contentPillar: string;
  toneId: string;
  confidence: number;
  reasoning: {
    postType: string;
    hookPattern: string;
    contentPillar: string;
    tone: string;
  };
  compatiblePostTypes: string[];
  compatibleHookPatterns: string[];
  compatibleContentPillars: string[];
  compatibleTones: string[];
}
```

---

## Task 1: Add `brandContext` parameter to `getPostRecommendations`

**Files:**

- Modify: `lib/api.ts` (lines ~417-455)

**What to do:**

Add an optional `brandContext` parameter and inject it into the system prompt. If not provided, fall back to the existing generic prompt.

**Step 1: Read the current function**

Open `lib/api.ts` around line 417. Confirm the current signature:

```ts
getPostRecommendations = async (
  topic: string,
  subtopic: string,
  settings?: AiSettings,
): Promise<PostRecommendation>
```

**Step 2: Add the BrandContext type (inline, no new file)**

At the top of `lib/api.ts`, near other interfaces, add:

```ts
interface BrandContextForRecommendation {
  industry: string;
  role: string;
  audience: string[];
  tones: string[];
  contentStrategy: string;
  definition: string;
}
```

**Step 3: Update the function signature**

```ts
getPostRecommendations = async (
  topic: string,
  subtopic: string,
  settings?: AiSettings,
  brandContext?: BrandContextForRecommendation,
): Promise<PostRecommendation>
```

**Step 4: Build the brand section of the system prompt**

Replace the hardcoded system prompt with:

```ts
const brandSection = brandContext
  ? `
You are personalizing recommendations for this specific LinkedIn content creator:
- Industry: ${brandContext.industry || "not specified"}
- Role: ${brandContext.role || "not specified"}
- Target audience: ${brandContext.audience.length ? brandContext.audience.join(", ") : "general"}
- Preferred tones: ${brandContext.tones.length ? brandContext.tones.join(", ") : "professional"}
- Content strategy: ${brandContext.contentStrategy || "not specified"}
- Brand definition: ${brandContext.definition || "not specified"}

Choose options that are MOST COHERENT with this brand profile.
`
  : "";

const systemPrompt = `You are a LinkedIn content strategist.${brandSection} Given a topic and subtopic, recommend the best post configuration. Return a single JSON object with these fields:
- postType (string): one of "educational", "storytelling", "opinion", "how-to", "case-study", "listicle"
- hookPattern (string): one of "question", "statistic", "bold-claim", "story-opener", "contrarian", "curiosity-gap"
- contentPillar (string): one of "thought-leadership", "industry-insights", "personal-branding", "how-to-guides", "case-studies", "trends"
- toneId (string): one of "casual-witty", "professional-authority", "approachable-expert"
- confidence (number 0-1)
- reasoning (object with fields: postType, hookPattern, contentPillar, tone - each a string explaining the choice)
- compatiblePostTypes (string array)
- compatibleHookPatterns (string array)
- compatibleContentPillars (string array)
- compatibleTones (string array)
Only return the JSON object, no other text.`;
```

**Step 5: Verify the rest of the function is unchanged**

The `generateWithAi` call and JSON parsing stay exactly the same. Only the system prompt changes.

**Step 6: Commit**

```bash
git add lib/api.ts
git commit -m "feat: add brand context to post recommendation AI prompt"
```

---

## Task 2: Pass brand context from Create page → recommendation call

**Files:**

- Modify: `app/(protected)/create/page.tsx`

**What to do:**

Extract brand fields from the loaded profile and pass them to `getPostRecommendations` in `handleSelectSubtopic`.

**Step 1: Add a `brandContext` memo near `aiSettings` memo (around line 110)**

```ts
const brandContext = useMemo(() => {
  if (!profile) return undefined;
  return {
    industry: profile.industry,
    role: profile.role,
    audience: profile.audience,
    tones: profile.tones,
    contentStrategy: profile.contentStrategy,
    definition: profile.definition,
  };
}, [profile]);
```

**Step 2: Update the `handleSelectSubtopic` call (around line 156)**

Change:

```ts
const result = await getPostRecommendations(
  topic,
  subtopic.text,
  aiSettings ?? undefined,
);
```

To:

```ts
const result = await getPostRecommendations(
  topic,
  subtopic.text,
  aiSettings ?? undefined,
  brandContext,
);
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

**Step 4: Commit**

```bash
git add app/(protected)/create/page.tsx
git commit -m "feat: pass brand context to subtopic recommendation call"
```

---

## Task 3: Trigger brand-aware recommendation on direct topic submit

**Files:**

- Modify: `app/(protected)/create/page.tsx`

**Context:**

Currently `handleGeneratePostClick` (line ~197) requires topic + postType + hookPattern + contentPillar + selectedToneId to be filled. If user skips subtopics, they get only the rule-based smart defaults (not AI-powered).

**What to do:**

Add a recommendation fetch step inside `handleGeneratePostClick` when no AI recommendation has been fetched yet. Apply it to dropdowns, then generate.

**Step 1: Update `handleGeneratePostClick`**

Replace the current function body:

```ts
const handleGeneratePostClick = async () => {
  if (!profile || !topic) {
    setSaveFeedback("Please fill in a topic before generating.");
    setTimeout(() => setSaveFeedback(null), 3000);
    return;
  }

  setSaveFeedback(null);

  // If no AI recommendation yet, fetch one now using the topic directly
  if (!recommendation && aiSettings) {
    setLoadingRecommendation(true);
    try {
      const result = await getPostRecommendations(
        topic,
        topic, // use topic as subtopic when no subtopic selected
        aiSettings,
        brandContext,
      );
      setRecommendation(result);
      if (enhancedPostTypes.some((opt) => opt.value === result.postType)) {
        setPostType(result.postType);
      }
      if (
        enhancedHookPatterns.some((opt) => opt.value === result.hookPattern)
      ) {
        setHookPattern(result.hookPattern);
      }
      if (
        enhancedContentPillars.some((opt) => opt.value === result.contentPillar)
      ) {
        setContentPillar(result.contentPillar);
      }
      if (result.toneId) {
        setSelectedToneId(result.toneId);
      }
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      // Non-fatal: proceed with current dropdown values
    } finally {
      setLoadingRecommendation(false);
    }
  }

  // Require form completeness before generating
  if (!postType || !hookPattern || !contentPillar || !selectedToneId) {
    setSaveFeedback(
      "Please fill in all required fields (Post Type, Hook Pattern, Content Pillar, Tone) before generating.",
    );
    setTimeout(() => setSaveFeedback(null), 3000);
    return;
  }

  setGeneratedContent("");
  setTriggerPostGeneration((prev) => prev + 1);
};
```

Note: The function signature changes from `() =>` to `async () =>`. Make sure the JSX handler is `onClick={handleGeneratePostClick}` (already using this pattern elsewhere).

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add app/(protected)/create/page.tsx
git commit -m "feat: trigger brand-aware recommendations on direct topic generate"
```

---

## Task 4: Manual smoke test

No automated test needed (AI calls are expensive to mock meaningfully for this). Manual verification:

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Go to Settings and confirm profile has industry + tones filled**

Check that at least `industry`, `role`, and `tones` are set for your account.

**Step 3: Test path A — subtopic flow (existing)**

1. Go to Create page
2. Type a topic (e.g. "productivity for freelancers")
3. Click "Find Subtopics"
4. Select a subtopic
5. Verify "Smart Choice" badges appear on dropdowns
6. Open browser Network tab → find the AI request → confirm brand context is in the system prompt

**Step 4: Test path B — direct generate (new)**

1. Go to Create page
2. Type a topic (e.g. "productivity for freelancers")
3. Click "Generate Post" directly (skip subtopics)
4. Verify loading state shows ("Getting Recommendations...")
5. Verify dropdowns auto-update with brand-coherent values
6. Verify "Smart Choice" badges appear

**Step 5: Test path C — no AI settings**

1. Go to Settings, remove Claude API key
2. Go to Create page, type topic, click Generate
3. Verify graceful fallback: no crash, rule-based smart defaults used, error doesn't block generation

---

## Task 5: Final commit + cleanup

```bash
git add -A
git status  # verify only expected files changed
git commit -m "feat: brand-coherent dropdown recommendations complete"
```

---

## Summary of Changes

| File                              | Lines Changed | What                                                                                        |
| --------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `lib/api.ts`                      | ~10 lines     | Add `BrandContextForRecommendation` type + `brandContext` param + brand-aware system prompt |
| `app/(protected)/create/page.tsx` | ~30 lines     | Add `brandContext` memo, pass to subtopic call, rewrite `handleGeneratePostClick` as async  |

**Total: ~40 lines changed. Zero new files. Zero schema changes.**
