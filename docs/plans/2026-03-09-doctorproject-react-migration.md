# Plan: Migrate @bruddle/react → @doctorproject/react

**Session:** plan-2026-03-09-2322
**Date:** 2026-03-09
**Branch:** doctorpost-ui-revamp

---

## 1. Problem Statement

The project uses `@bruddle/react` (from `github:drproject-coding/bruddle-react`) — the outdated design system React package. The up-to-date design system lives at `github:drproject-coding/bruddle-design-system` (React package at `packages/react`, package name `@doctorproject/react`). All 56 files importing `@bruddle/react` must migrate to `@doctorproject/react`, and the 17 local CSS files in `styles/bruddle/` must be replaced with the design system's own `global.css`. CSS custom properties must be updated from `--bru-*` to `--drp-*`.

---

## 2. Scope & Boundaries

### IN scope

- Create `drproject-coding/doctorproject-react` GitHub repo from `bruddle-design-system/packages/react`
- Install as `@doctorproject/react`, remove `@bruddle/react`
- Migrate all 56 files (23 pages + 33 components) — import paths + API changes
- Replace `styles/bruddle/` (17 CSS files) with `@doctorproject/react/styles` global.css
- Update `--bru-*` → `--drp-*` in `app/layout.tsx` and `app/globals.css`
- Auth pages (login, signup, forgot-password, reset-password) — in scope
- Onboarding pages — in scope

### OUT of scope

- API routes / server actions / backend logic
- Database / Supabase schema
- Test files (`__tests__/`)
- Feature behavior — visual/styling update only

---

## 3. Success Criteria

- [ ] `@doctorproject/react` installs from `github:drproject-coding/doctorproject-react`
- [ ] `@bruddle/react` fully removed from `package.json` and `node_modules`
- [ ] Zero TypeScript errors after migration (`npm run build` passes)
- [ ] All 56 files import from `@doctorproject/react` — no `@bruddle/react` references remain
- [ ] `styles/bruddle/` deleted; `globals.css` imports design system CSS instead
- [ ] No `--bru-*` CSS variable references remain in source files
- [ ] All pages render correctly in the browser
- [ ] No regressions in existing features

---

## 4. Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                                                                                                                              | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Deps                  | Batch |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----- |
| 1   | Create drproject-coding/doctorproject-react GitHub repo from bruddle-design-system/packages/react; update package.json to install @doctorproject/react and remove @bruddle/react; run npm install | package.json, package-lock.json                                                                                                                                                                                                                                                                                                                                                                                                                                                     | -                     | 1     |
| 2   | CSS migration: replace 16 @import from styles/bruddle/ in globals.css with @doctorproject/react styles import; update --bru-_ → --drp-_ in app/layout.tsx and app/globals.css                     | app/globals.css, app/layout.tsx                                                                                                                                                                                                                                                                                                                                                                                                                                                     | -                     | 1     |
| 3   | Migrate root components: update @bruddle/react → @doctorproject/react imports                                                                                                                     | components/Header.tsx, components/PostGenerator.tsx, components/PostEditorModal.tsx, components/SchedulePostModal.tsx, components/TonePromptPreviewModal.tsx                                                                                                                                                                                                                                                                                                                        | 1                     | 2     |
| 4   | Migrate calendar + campaign components                                                                                                                                                            | components/calendar/CalendarView.tsx, components/campaigns/BatchProgress.tsx, components/campaigns/CampaignAnalytics.tsx, components/campaigns/CampaignCalendar.tsx, components/campaigns/CampaignList.tsx, components/campaigns/CampaignSetup.tsx, components/campaigns/IdeaInbox.tsx                                                                                                                                                                                              | 1                     | 2     |
| 5   | Migrate factory components                                                                                                                                                                        | components/factory/CreatePostDialog.tsx, components/factory/DraftEditor.tsx, components/factory/EvidencePack.tsx, components/factory/FormattedOutput.tsx, components/factory/GuardrailRecovery.tsx, components/factory/LearningPhaseResult.tsx, components/factory/PostReview.tsx, components/factory/ResearchBrief.tsx, components/factory/RewriteInstructions.tsx, components/factory/Scorecard.tsx, components/factory/SessionHistory.tsx, components/factory/TopicProposals.tsx | 1                     | 2     |
| 6   | Migrate knowledge + learning + settings components                                                                                                                                                | components/knowledge/DocumentEditor.tsx, components/knowledge/ExtractFlow.tsx, components/knowledge/ImportFlow.tsx, components/knowledge/VersionHistory.tsx, components/learning/FeedbackHistory.tsx, components/learning/PatternList.tsx, components/learning/RuleProposal.tsx, components/learning/SignalCounts.tsx, components/settings/StraicoModelPicker.tsx                                                                                                                   | 1                     | 2     |
| 7   | Migrate auth pages                                                                                                                                                                                | app/login/page.tsx, app/signup/page.tsx, app/forgot-password/page.tsx, app/reset-password/page.tsx                                                                                                                                                                                                                                                                                                                                                                                  | 1                     | 2     |
| 8   | Migrate onboarding pages                                                                                                                                                                          | app/(onboarding)/onboarding/start/page.tsx, app/(onboarding)/onboarding/upload/page.tsx, app/(onboarding)/onboarding/review/page.tsx, app/(onboarding)/onboarding/wizard/[step]/page.tsx                                                                                                                                                                                                                                                                                            | 1                     | 2     |
| 9   | Migrate protected pages A                                                                                                                                                                         | app/(protected)/analytics/page.tsx, app/(protected)/brand/page.tsx, app/(protected)/calendar/page.tsx, app/(protected)/campaigns/page.tsx, app/(protected)/campaigns/[campaignId]/idea/[slotOrder]/page.tsx                                                                                                                                                                                                                                                                         | 1                     | 2     |
| 10  | Migrate protected pages B                                                                                                                                                                         | app/(protected)/create/page.tsx, app/(protected)/dashboard/page.tsx, app/(protected)/factory/page.tsx, app/(protected)/knowledge/page.tsx                                                                                                                                                                                                                                                                                                                                           | 1                     | 2     |
| 11  | Migrate protected pages C                                                                                                                                                                         | app/(protected)/learning/page.tsx, app/(protected)/library/page.tsx, app/(protected)/settings/page.tsx, app/(protected)/settings/profile/page.tsx, app/(protected)/settings/subscription/page.tsx, app/(protected)/studio/page.tsx                                                                                                                                                                                                                                                  | 1                     | 2     |
| 12  | Delete styles/bruddle/ directory (17 files)                                                                                                                                                       | styles/bruddle/                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 2,3,4,5,6,7,8,9,10,11 | 3     |
| 13  | Verify: grep for @bruddle/react and --bru- remnants; run npm run build                                                                                                                            | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 12                    | 3     |

<!-- EXECUTION_TASKS_END -->

---

## 5. Dependencies

- T1 → T3–T11: Package must be installed before code migrations
- T2 → T12: CSS globals updated before deleting styles/bruddle/
- T3–T11 → T12: All migrations done before cleanup
- T12 → T13: Cleanup before final verification
- T3–T11: Fully independent — parallel execution

---

## 6. Risks & Mitigations

| Risk                                               | Likelihood | Mitigation                                                          |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| GitHub auth fails for drproject-coding org         | Medium     | Check `gh auth status` before T1; user may create repo manually     |
| dist/ in new repo stale — TypeScript types missing | Low        | Verify types resolve after install; rebuild if needed               |
| Missed --bru-\* CSS var references                 | Medium     | T13 greps to catch remaining references                             |
| Button icon prop API breakage                      | Low        | New package still supports old `icon` boolean — backward compatible |
| CSS visual regressions                             | Medium     | Check dev server visually after T2 before batch 2                   |

---

## 7. Verification Checklist

- [ ] `npm ls @doctorproject/react` resolves correctly
- [ ] `npm ls @bruddle/react` returns nothing
- [ ] `grep -r "@bruddle/react" app/ components/` returns zero results
- [ ] `grep -r "\-\-bru-" app/ styles/` returns zero results
- [ ] `styles/bruddle/` directory no longer exists
- [ ] `npm run build` exits 0
- [ ] Dev server: all protected pages load without console errors
- [ ] Dev server: Button, Card, Alert, Tabs, Input render with `drp-` CSS classes

---

## Key Research Findings

### Components in use (14 unique)

Alert, Badge, Button, Card, Divider, EmptyState, Input, Loader, Pagination, ProgressBar, Select, Tabs, Tag, Textarea

### API differences (old → new)

- CSS class prefix: `bru-` → `drp-` (transparent, handled by components)
- CSS variables: `--bru-*` → `--drp-*` (must update layout.tsx and globals.css)
- Button: old `icon` boolean still supported; new adds `iconLeft`/`iconRight` ReactNode props
- Tag: new adds `legend`, `icon` props and `orange`/`light`/`teal`/`black` colors (additive, backward compatible)

### CSS import strategy

Replace the 16 individual `@import url(...)` lines in `app/globals.css` with the design system CSS.
Check exact import path after install (likely `@doctorproject/react/styles` or a direct file path to node_modules).
