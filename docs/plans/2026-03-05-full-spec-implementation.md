# DoctorPost Full Spec Implementation Plan

> **Session:** plan-2026-03-05-full-spec
> **Source:** DoctorPost_Spec/ (PRD-01 through PRD-11)
> **For Claude:** Use `superpowers:executing-plans` to implement this plan task-by-task.

---

## Problem Statement

The DoctorPost spec defines a complete product with onboarding, a clean 4-stage AI pipeline (Studio), post scoring, learning loop, and proper settings sub-pages. The current codebase (v12) has partial implementations under different routes (`/factory`, `/create`) and is missing critical user flows (onboarding, signup/forgot-password, library detail, subscription page). This plan implements the full spec.

---

## Gap Analysis

| Feature                | Spec                                 | Current                | Action         |
| ---------------------- | ------------------------------------ | ---------------------- | -------------- |
| Signup page            | `/signup`                            | Inline on login        | Split out      |
| Forgot-password        | `/forgot-password`                   | Button on login        | New page       |
| Onboarding             | 5-step wizard + upload               | Missing                | Build          |
| Studio (4-agent SSE)   | `/studio`                            | `/factory` (different) | Build new      |
| Studio API routes      | 4 SSE routes                         | `/api/pipeline/stream` | Build new      |
| Library detail         | `/library/[id]`                      | Missing                | Build          |
| Settings: Profile      | `/settings/profile`                  | Missing                | Build          |
| Settings: Subscription | `/settings/subscription`             | Missing                | Build          |
| AI infrastructure      | brand-context, sse, ai-client, usage | Partial                | Build/complete |
| Learning loop          | Style learner agent                  | Missing                | Build          |

---

## Architecture Decisions

- **Route structure**: Keep existing `/create` and `/factory` — add new `/studio` per spec alongside them
- **Onboarding layout**: New `app/(onboarding)/layout.tsx` with progress bar — no sidebar
- **Settings sub-pages**: Under existing `app/(protected)/settings/` as sub-routes
- **Studio API**: New `app/api/studio/` routes with SSE streaming
- **Auth pages**: New `app/signup/page.tsx` and `app/forgot-password/page.tsx`
- **Library detail**: `app/(protected)/library/[id]/page.tsx`
- **No new tables**: Use existing NCB tables and brand_profiles schema; check NCB for `content_history` before save

---

## Key Implementation Notes

### SSE Streaming Pattern

```typescript
// lib/sse.ts
export function createSSEResponse(handler: (send: SendFn) => Promise<void>): Response {
  const stream = new ReadableStream({ ... })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

### Brand Context Builder

```typescript
// lib/brand-context.ts
export async function getBrandContext(userId: string): Promise<string>;
// Returns formatted string injected into all agent system prompts
```

### AI Client (server-side only)

```typescript
// lib/ai-client.ts
export async function getAIClient(userId: string): Promise<Anthropic>;
// Fetches user API key from profile, never exposes to client
```

### Studio Pipeline Flow

```
User clicks Generate
  → POST /api/studio/strategist (SSE)
  → POST /api/studio/writer (SSE)
  → POST /api/studio/scorer (SSE)
  → POST /api/studio/formatter (SSE)
  → Save to content_history
```

### Onboarding Wizard State

- Saved incrementally to brand_profiles on each step
- Uses existing `updateBrandProfile` from lib/api.ts
- New onboarding-specific fields mapped to brand_profiles columns

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                                                                     | Files                                                | Deps        | Batch |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------- | ----- |
| 1   | Create signup page (separate from login, links to /login)                                                                                | `app/signup/page.tsx`                                | -           | 1     |
| 2   | Create forgot-password page (email input, calls NCB reset)                                                                               | `app/forgot-password/page.tsx`                       | -           | 1     |
| 3   | Update login page to link to /signup and /forgot-password (remove inline register form)                                                  | `app/login/page.tsx`                                 | -           | 1     |
| 4   | Create onboarding layout with progress bar                                                                                               | `app/(onboarding)/layout.tsx`                        | -           | 1     |
| 5   | Create lib/sse.ts — SSE stream helper (createSSEResponse, sendToken, sendDone, sendError)                                                | `lib/sse.ts`                                         | -           | 1     |
| 6   | Create lib/brand-context.ts — getBrandContext(userId): fetches brand_profiles + learned_profiles, returns formatted string               | `lib/brand-context.ts`                               | -           | 1     |
| 7   | Create lib/ai-client.ts — getAIClient(userId): fetches user API key from profile, returns initialized Anthropic client                   | `lib/ai-client.ts`                                   | -           | 1     |
| 8   | Create lib/usage.ts — checkUsageLimit(userId) and incrementUsage(userId): checks user_settings monthly_usage_count                       | `lib/usage.ts`                                       | -           | 1     |
| 9   | Create onboarding start page — two cards: Upload vs Wizard                                                                               | `app/(onboarding)/onboarding/start/page.tsx`         | 4           | 2     |
| 10  | Create onboarding wizard step 1 (Identity): full_name, professional_title, years_experience, primary_industry                            | `app/(onboarding)/onboarding/wizard/[step]/page.tsx` | 4           | 2     |
| 11  | Create onboarding wizard steps 2-5 in same dynamic route file (Voice/Pillars/ICP/Bio) with step routing                                  | `app/(onboarding)/onboarding/wizard/[step]/page.tsx` | 10          | 2     |
| 12  | Create onboarding upload page — drag-drop, process files, AI extraction preview                                                          | `app/(onboarding)/onboarding/upload/page.tsx`        | 4           | 2     |
| 13  | Create onboarding review page — accordion sections, "Save and Start Creating" → /studio                                                  | `app/(onboarding)/onboarding/review/page.tsx`        | 4           | 2     |
| 14  | Create POST /api/studio/strategist — SSE route: check usage, fetch brand context + platform KB, stream strategist output (Claude Sonnet) | `app/api/studio/strategist/route.ts`                 | 5,6,7,8     | 3     |
| 15  | Create POST /api/studio/writer — SSE route: takes strategy JSON, streams post draft (Claude Opus)                                        | `app/api/studio/writer/route.ts`                     | 5,6,7       | 3     |
| 16  | Create POST /api/studio/scorer — SSE route: takes post_text + strategy, streams 100-point score JSON (Claude Sonnet)                     | `app/api/studio/scorer/route.ts`                     | 5,6,7       | 3     |
| 17  | Create POST /api/studio/formatter — SSE route: takes post_text + format + score, streams formatted output JSON (Claude Haiku)            | `app/api/studio/formatter/route.ts`                  | 5,7         | 3     |
| 18  | Create Studio page UI — 3-column layout: left (inputs), center (pipeline stages), right (score + actions)                                | `app/(protected)/studio/page.tsx`                    | 14,15,16,17 | 4     |
| 19  | Create Library post detail page — full post, score breakdown, pipeline inputs summary, Open in Studio                                    | `app/(protected)/library/[id]/page.tsx`              | -           | 4     |
| 20  | Create Settings profile sub-page — display name, email, profile picture                                                                  | `app/(protected)/settings/profile/page.tsx`          | -           | 4     |
| 21  | Create Settings subscription sub-page — tier badge, usage bar, plan comparison, upgrade CTA                                              | `app/(protected)/settings/subscription/page.tsx`     | -           | 4     |
| 22  | Add Studio and onboarding to sidebar nav + update middleware for new routes                                                              | `components/Sidebar.tsx`, `middleware.ts`            | 18          | 5     |
| 23  | Create /api/internal/style-learner route — async: analyzes observations + published posts, updates learned_profiles.style_rules          | `app/api/internal/style-learner/route.ts`            | 7           | 5     |
| 24  | Wire post auto-save after pipeline completion in Studio — POST to content_history via data proxy                                         | `app/(protected)/studio/page.tsx`                    | 18          | 5     |
| 25  | TypeScript check + smoke test                                                                                                            | -                                                    | 24          | 6     |

<!-- EXECUTION_TASKS_END -->

---

## Verification Checklist

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `/signup` renders and creates account
- [ ] `/forgot-password` renders and submits email
- [ ] `/login` links correctly to /signup and /forgot-password
- [ ] `/onboarding/start` renders with two path cards
- [ ] `/onboarding/wizard/1` through `/wizard/5` step correctly
- [ ] `/onboarding/review` shows summary, CTA redirects to /studio
- [ ] `/studio` renders 3-column layout with Generate button
- [ ] Studio pipeline: Generate → streams through 4 stages → shows score
- [ ] `/library/[id]` shows full post + score breakdown
- [ ] `/settings/profile` shows editable profile fields
- [ ] `/settings/subscription` shows usage + tier info
- [ ] Sidebar has Studio link
