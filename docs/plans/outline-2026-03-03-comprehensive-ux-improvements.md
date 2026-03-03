# DoctorPost Pipeline: Comprehensive UX Improvements Plan

**Date**: 2026-03-03
**Session ID**: outline-2026-03-03-1430
**Status**: PLANNING
**Target**: Production-Ready Beta by 2026-03-21

---

## Problem Statement

Beta testing revealed 10 critical gaps preventing users from completing post generation workflows:

1. **Critical Blocking Issues** (users stuck):
   - Manual post creation loader stuck after generation
   - Post metadata (type, hook pattern, pillar, tone) showing stale/incorrect values
   - Guardrail failures (word count, tone, structure) with no recovery mechanism
   - Scorecard UI buggy (progress bars overflow)
   - Rewrite instructions unclear and non-actionable

2. **High-Impact Feature Gaps** (poor UX):
   - No ability to choose which evidence/claims to use (forced to accept all)
   - No session history/resumption (forces users to regenerate, wastes AI cost)
   - LinkedIn preview unrealistic (no mobile/desktop view like LinkedIn)
   - No visibility into post structure (hook/problem/solution/CTA markers)
   - No learning phase feedback (user doesn't know what patterns captured)
   - One-way pipeline flow (can't go back/forward to review phases)

3. **Optimization Gap**:
   - No database persistence of pipeline outputs (angles, claims, tones)
   - Repeated AI calls for same research (high cost)
   - No pattern reuse across posts

---

## Success Criteria

| Criteria                                           | Target  | Impact                              |
| -------------------------------------------------- | ------- | ----------------------------------- |
| Users complete full pipeline without getting stuck | 100%    | Currently ~40% due to bugs          |
| Session resumption feature adopted                 | >70%    | Reduces AI costs by 30-40%          |
| Average time in pipeline                           | <15 min | Down from ~25 min with manual fixes |
| AI cost per post                                   | -25%    | Via data persistence + reuse        |
| User satisfaction (beta feedback)                  | >4.5/5  | Improved UX + less frustration      |

---

## Scope & Boundaries

### IN SCOPE

- Fix all 5 critical blocking issues (Phase 1)
- Implement 6 high-impact features (Phase 2)
- Add data persistence and cost optimization (Phase 3)
- Include real E2E testing for each phase
- Update database schema as needed
- Maintain backward compatibility

### OUT OF SCOPE

- Redesign entire UI (incremental improvements only)
- Add new pipeline phases
- Change authentication/security model
- Multi-user collaboration features
- Export/sharing to LinkedIn API (manual sharing OK)

---

## Phases & Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                         | Files                                                                                       | Severity    | Batch | Deps |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------- | ----- | ---- |
| 1   | Fix manual post creation loader                              | `components/PostGenerator.tsx`                                                              | 🔴 CRITICAL | 1     | -    |
| 2   | Fix stale metadata display (post type, hook, pillar, tone)   | `components/PipelineStepper.tsx`, `lib/agents/orchestrator.ts`                              | 🔴 CRITICAL | 1     | -    |
| 3   | Fix scorecard progress bar overflow                          | `components/factory/Scorecard.tsx`                                                          | 🔴 CRITICAL | 1     | -    |
| 4   | Guardrail recovery UI (manual + AI fix)                      | `components/GuardrailResult.tsx` (new), `app/api/pipeline/stream/route.ts`                  | 🔴 CRITICAL | 1     | -    |
| 5   | Format rewrite instructions + Apply Fix button               | `components/RewriteInstructions.tsx` (new), `components/factory/PostReview.tsx`             | 🔴 CRITICAL | 1     | -    |
| 6   | Evidence step: filtering/selection UI                        | `components/factory/EvidenceSelector.tsx` (new), `lib/agents/orchestrator.ts`               | 🟠 HIGH     | 2     | -    |
| 7   | Session history & resumption                                 | `lib/api/savePipelineSession.ts` (new), DB schema, `app/api/pipeline/resume/route.ts` (new) | 🟠 HIGH     | 2     | -    |
| 8   | Realistic LinkedIn preview (mobile/desktop)                  | `components/LinkedInPreview.tsx` (new), `components/factory/FormattedOutput.tsx`            | 🟠 HIGH     | 2     | -    |
| 9   | Post structure highlighting (hook/problem/solution/CTA)      | `components/PostStructureHighlighter.tsx` (new), `components/factory/PostDraft.tsx`         | 🟠 HIGH     | 2     | 8    |
| 10  | Learning phase feedback & summary                            | `components/LearningPhaseResult.tsx` (new), `components/factory/PipelineStepper.tsx`        | 🟠 HIGH     | 2     | -    |
| 11  | Step navigation (back/forward + phase review)                | `components/StepNavigation.tsx` (new), `components/factory/PipelineStepper.tsx`             | 🟠 HIGH     | 2     | -    |
| 12  | Save pipeline outputs to database                            | `lib/knowledge/savePipelineData.ts` (new), DB migrations, `lib/agents/orchestrator.ts`      | 🟡 MEDIUM   | 3     | -    |
| 13  | Brand setup data integration (post type, hook, pillar, tone) | `lib/api/getBrandSetup.ts` (new), `app/(protected)/settings/brand/page.tsx`                 | 🟡 MEDIUM   | 3     | -    |
| 14  | Real E2E testing (all phases)                                | `scripts/e2e-comprehensive-test.js` (new)                                                   | 🟡 MEDIUM   | 3     | 1-11 |

<!-- EXECUTION_TASKS_END -->

---

## Detailed Task Breakdown

### Phase 1: Critical Bug Fixes (Mar 3-7)

#### Task 1: Fix Manual Post Creation Loader

**Problem**: After user submits post, loader keeps spinning indefinitely
**Root Cause**: Likely missing completion signal or error state not handled
**Solution**:

- [ ] Check PostGenerator component for signal handling
- [ ] Ensure SSE stream closes properly after all phases complete
- [ ] Add timeout (20 min) with error message if stream doesn't close
- [ ] Show completion message: "✅ Post ready! Review before publishing"

**Acceptance Criteria**:

- Loader stops after pipeline completes
- User sees clear completion state
- No orphaned connections

---

#### Task 2: Fix Stale Metadata Display

**Problem**: Post type, hook pattern, content pillar, tone showing old values instead of fresh ones from agent
**Root Cause**: Not updating display with latest agent output; possibly showing cached/session values
**Solution**:

- [ ] Verify orchestrator emits these values after each relevant agent phase
- [ ] Update PipelineStepper to display latest values as they're generated
- [ ] Add timestamp showing when values were generated (from agent output)
- [ ] If values unavailable, show "Analyzing..." or previous value with "(from last session)"

**Acceptance Criteria**:

- Display shows latest values as pipeline progresses
- Shows date/time of when values were generated
- Updates real-time as new data arrives via SSE

---

#### Task 3: Fix Scorecard Progress Bar Overflow

**Problem**: Progress bars for hook, strategic relevance, structure & rhythm, tone & style, content value, conclusion CTA overflow their containers
**Root Cause**: CSS width calculation doesn't respect container bounds
**Solution**:

- [ ] Add `overflow: hidden` and `max-width: 100%` to bar containers
- [ ] Ensure parent div constrains child width properly
- [ ] Test mobile (375px) and desktop (1440px) widths
- [ ] Verify bar fills proportionally to score

**Acceptance Criteria**:

- All progress bars fit within containers
- Works on mobile and desktop
- Visual alignment matches design

---

#### Task 4: Guardrail Recovery UI

**Problem**: When guardrail check fails (word count 1683 vs max 1600), user has no way to fix without abandoning
**Solution**:

- [ ] Create GuardrailResult component showing:
  - Failed rule with actual vs. required value
  - "Manual Edit" button → Opens text editor with post content
  - "Fix with AI" button → Calls writer with instruction to reduce/adjust
- [ ] After user action, re-run guardrail check
- [ ] If still failing, show options again (max 3 retries)
- [ ] If passing, show "✅ Ready to proceed" and advance pipeline

**Acceptance Criteria**:

- Clear display of guardrail failures
- Two action paths (manual + AI)
- Auto-retry after fix
- Max 3 attempts before requiring manual action

---

#### Task 5: Format Rewrite Instructions + Apply Fix Button

**Problem**: Rewrite instructions from scorer are raw text, user doesn't know what to do
**Solution**:

- [ ] Create RewriteInstructions component parsing scorer output:
  - Score: "84/100 ✅ Passes (>75)"
  - Required Changes: [numbered list]
  - Optional Improvements: [bulleted list]
- [ ] Add "Apply Fixes with AI" button:
  - Calls writer with: "Rewrite based on these instructions: [parsed instructions]. Maintain voice and angle."
  - Shows progress during rewrite
  - Re-runs guardrail check + scorer on new version
- [ ] If new score >= 75, show "✅ Fixed!"
- [ ] If < 75, show instructions again (max 2 rewrites)

**Acceptance Criteria**:

- Clear, formatted display of instructions
- "Apply Fixes" button works end-to-end
- New version scored automatically
- Prevents infinite rewrite loops

---

### Phase 2: High-Impact Features (Mar 10-14)

#### Task 6: Evidence Selection UI

**Problem**: Users forced to accept all claims/evidence from researcher; can't filter out weak/irrelevant ones
**Solution**:

- [ ] After Evidence phase, show EvidenceSelector component:
  - Display all claims with: claim text, source, strength (weak/moderate/strong)
  - Checkbox to select/deselect each claim
  - "Strength filter": Show only strong claims, or show all
  - Selected count: "Using 7 of 12 claims"
- [ ] Update pipeline state with user's selected claims
- [ ] Pass selected claims to Writer phase
- [ ] Writer uses: "Use these claims: [selected]"

**Acceptance Criteria**:

- User can filter claims by relevance
- Selected claims passed to Writer
- Clear indication of what's being used

---

#### Task 7: Session History & Resumption

**Problem**: Users must regenerate entire pipeline; high AI cost and time waste
**Solution**:

- [ ] Create database schema for sessions:
  ```sql
  sessions (id, user_id, status, created_at, completed_at)
  session_phases (id, session_id, phase_name, output_json, completed_at)
  ```
- [ ] After each phase completes, save outputs to DB
- [ ] Create "View Sessions" page showing past sessions with:
  - Date created, topic, completion status
  - "Resume from Direction", "Resume from Evidence", etc.
- [ ] Create `/api/pipeline/resume` endpoint accepting session_id + phase
- [ ] Resume flow: Load phase outputs → Show preview → "Continue from here"

**Acceptance Criteria**:

- Sessions persisted to database
- User can view and resume past sessions
- Resume skips completed phases, starts at selected phase
- Reduces AI calls for repeated research

---

#### Task 8: Realistic LinkedIn Preview (Mobile/Desktop)

**Problem**: User can't see how post will look on LinkedIn before publishing
**Solution**:

- [ ] Create LinkedInPreview component:
  - Mobile view (375px width, LinkedIn mobile card styling)
  - Desktop view (1440px width, LinkedIn desktop card styling)
  - Toggle button between mobile/desktop
- [ ] Simulate LinkedIn post card:
  - White background, shadows, padding
  - Hook before fold line (visual marker)
  - Truncated text below fold with "Show more"
  - Engagement metrics placeholder
- [ ] Show actual formatted post content exactly as it will appear

**Acceptance Criteria**:

- Mobile preview matches LinkedIn mobile
- Desktop preview matches LinkedIn desktop
- Smooth toggle between views
- Shows hook/body/CTA correctly

---

#### Task 9: Post Structure Highlighting

**Problem**: User can't see where hook, problem, solution, CTA are in the draft
**Solution**:

- [ ] Create PostStructureHighlighter component:
  - Parse post based on template type (strong-opinion, problem-solution, etc.)
  - Identify sections: hook, problem, solution, CTA
  - Show colored panels/blocks around each section in draft view
  - Side panel with breakdown: "Hook (45 words) → Problem (120 words) → Solution (200 words) → CTA (30 words)"
- [ ] Clickable sections in side panel highlight corresponding text in draft
- [ ] Show in both "Post Draft" and "Formatted Post" views

**Acceptance Criteria**:

- Clear visual boundaries between sections
- Side panel shows breakdown with word counts
- Works for all template types
- Mobile-friendly display

---

#### Task 10: Learning Phase Feedback

**Problem**: After learning phase completes, user has no idea what patterns were captured
**Solution**:

- [ ] Create LearningPhaseResult component showing:

  ```
  ✅ LEARNING PHASE COMPLETE

  Captured Patterns:
  - Hook category: "Problem-Statement Hook" (effectiveness: high)
  - Tone shift: "Contrarian Authority"
  - Content pattern: "Problem-Solution-ROI"
  - Engagement signal: High (predicted 120+ reactions)

  Insights:
  - This angle resonated with your audience
  - Structure performed well (84/100 score)
  - Tone authenticity ranked high

  [Save Patterns] [View Past Patterns]
  ```

- [ ] Store patterns in user's knowledge base
- [ ] Link "View Past Patterns" to pattern history page

**Acceptance Criteria**:

- Clear summary of learned patterns
- Shows predicted effectiveness
- Patterns saved and retrievable
- User understands what was learned

---

#### Task 11: Step Navigation & Phase Review

**Problem**: One-way pipeline; user can't review what was generated earlier or go back
**Solution**:

- [ ] Add StepNavigation component to PipelineStepper:
  - "← Previous Phase" button (goes back, shows what was generated)
  - "Next Phase →" button (goes forward)
  - Dropdown: "Jump to Phase..." (Direction, Discovery, Evidence, etc.)
- [ ] Each phase view shows:
  - Phase name and summary
  - All outputs from that phase (proposals, research brief, evidence, etc.)
  - "Review" mode (read-only) vs "Edit" mode (can modify and re-run)
- [ ] Clicking "← Back to Evidence" re-runs that phase with same inputs
- [ ] Navigation preserved: User can jump anywhere in pipeline

**Acceptance Criteria**:

- User can navigate forward/backward through phases
- Can jump to any completed phase
- Phase views show all generated data
- Can review previous outputs without re-running

---

### Phase 3: Optimization & Data Persistence (Mar 17-21)

#### Task 12: Save Pipeline Outputs to Database

**Problem**: No persistence of angles, claims, tones; high AI costs from regenerating same research
**Solution**:

- [ ] Extend database schema:
  ```sql
  pipeline_directions (id, user_id, headline, angle, pillar, reasoning, created_at)
  pipeline_angles (id, user_id, angle, relevance, created_at)
  pipeline_claims (id, user_id, claim, source, strength, created_at)
  pipeline_patterns (id, user_id, pattern_type, value, effectiveness, created_at)
  ```
- [ ] After each phase, save outputs:
  - Direction: Save all proposals
  - Discovery: Save research brief + refined topic
  - Evidence: Save all claims
  - Learning: Save patterns with scores
- [ ] Create "My Patterns & Evidence" page showing:
  - Most-used angles with success rates
  - Effective claims by topic
  - Hook patterns by effectiveness
  - Tone shifts by engagement
- [ ] Enable pattern reuse: "You've used this angle before (avg 84/100)"

**Acceptance Criteria**:

- All phase outputs persisted to DB
- Data accessible in new "Patterns" section
- Reduces AI calls by 30-40% on repeat topics
- Shows pattern effectiveness metrics

---

#### Task 13: Brand Setup Data Integration

**Problem**: Post type, hook pattern, content pillar, tone should reflect brand setup with dates, not be stale
**Solution**:

- [ ] Verify brand profile has fields for:
  - Preferred post types (strong-opinion, problem-solution, etc.)
  - Successful hook patterns
  - Content pillars
  - Brand tone/voice guidelines
- [ ] Update orchestrator to load brand setup at pipeline start
- [ ] Display in PipelineStepper:
  - "Brand Setup" section showing current settings with "Last updated: [date]"
  - Agent uses brand setup as input to generation
  - Strategist considers brand preferences when proposing topics
- [ ] Allow session-specific overrides: "Use different tone for this post"

**Acceptance Criteria**:

- Brand setup loads at pipeline start
- Agent uses brand preferences
- Display shows dates and current values
- Users can override for specific posts

---

#### Task 14: Comprehensive E2E Testing

**Problem**: Need to validate all fixes and features work end-to-end with real API calls
**Solution**:

- [ ] Extend `scripts/e2e-real-test.js` to cover:
  - All 8 phases with real Claude API
  - Guardrail recovery flow (failure + fix + re-check)
  - Evidence selection (select/deselect claims)
  - Rewrite instruction parsing and Apply Fix button
  - Session save/resume
  - Structure highlighting
  - Learning phase feedback
  - All metadata displays
- [ ] Run test in staging environment before each deployment
- [ ] Generate detailed report with timings and cost estimates

**Acceptance Criteria**:

- All phases tested with real API
- Guardrail recovery flows tested
- New features validated end-to-end
- Performance baseline established

---

## Implementation Timeline

```
PHASE 1: CRITICAL FIXES (Week of Mar 3)
├── Mon 3/3: Tasks 1-2 (Loader + Metadata)
├── Tue 3/4: Task 3 (Scorecard UI)
├── Wed 3/5: Task 4 (Guardrail Recovery)
├── Thu 3/6: Task 5 (Rewrite Instructions)
└── Fri 3/7: Testing & bug fixes

PHASE 2: HIGH-IMPACT FEATURES (Week of Mar 10)
├── Mon 3/10: Tasks 6-7 (Evidence Selection + Sessions)
├── Tue 3/11: Task 8 (LinkedIn Preview)
├── Wed 3/12: Task 9 (Structure Highlighting)
├── Thu 3/13: Tasks 10-11 (Learning + Navigation)
└── Fri 3/14: Testing & bug fixes

PHASE 3: OPTIMIZATION (Week of Mar 17)
├── Mon 3/17: Task 12 (Database Persistence)
├── Tue 3/18: Task 13 (Brand Setup Integration)
├── Wed 3/19: Task 14 (Comprehensive E2E Testing)
├── Thu 3/20: Bug fixes & refinement
└── Fri 3/21: Staging rollout

PRODUCTION ROLLOUT
├── Mon 3/24: Deploy to beta
├── Tue-Wed: Monitor + hotfixes
└── Thu-Fri: Gather user feedback for next sprint
```

---

## Risk Analysis

| Risk                                 | Likelihood | Impact                       | Mitigation                            |
| ------------------------------------ | ---------- | ---------------------------- | ------------------------------------- |
| Guardrail fix loop infinite retry    | Medium     | User frustration             | Max 3 retries + manual edit fallback  |
| LinkedIn preview differs from actual | High       | User disappointed at publish | Use LinkedIn's own CSS framework      |
| Session resumption data corruption   | Low        | Lost data                    | Backup DB before each deployment      |
| Performance regression               | Medium     | Slow pipeline                | Benchmark Phase 1-2, optimize Phase 3 |
| Integration complexity               | High       | Deployment delay             | Test each phase independently first   |

---

## Dependencies & Blockers

- ✅ Real E2E test script exists (from earlier work)
- ✅ Runtime validation implemented (won't break guardrail fixes)
- ⚠️ Need to verify learner output format (is it structured?)
- ⚠️ Brand profile schema - check if post-type, hook-pattern fields exist
- ⚠️ Database capacity for session persistence (estimate: 100KB per session)

---

## Files to Create/Modify

### New Components

- `components/GuardrailResult.tsx` - Guardrail failure + recovery UI
- `components/RewriteInstructions.tsx` - Formatted feedback + Apply Fix
- `components/factory/EvidenceSelector.tsx` - Evidence filtering UI
- `components/LinkedInPreview.tsx` - Mobile/desktop post preview
- `components/PostStructureHighlighter.tsx` - Hook/problem/solution/CTA markers
- `components/LearningPhaseResult.tsx` - Learning phase feedback
- `components/StepNavigation.tsx` - Back/forward navigation

### New API Routes

- `app/api/pipeline/resume/route.ts` - Resume from saved session
- `app/api/pipeline/sessions/route.ts` - List/manage sessions
- `lib/api/savePipelineSession.ts` - Session persistence logic
- `lib/api/getBrandSetup.ts` - Load brand configuration

### Database Schema

- New tables: `sessions`, `session_phases`, `pipeline_directions`, `pipeline_angles`, `pipeline_claims`, `pipeline_patterns`
- Migrations for each table

### Modified Files

- `components/PostGenerator.tsx` - Fix loader signal handling
- `components/factory/Scorecard.tsx` - Fix progress bar CSS
- `components/factory/PipelineStepper.tsx` - Add navigation + metadata display
- `components/factory/PostReview.tsx` - Integrate GuardrailResult + RewriteInstructions
- `components/factory/FormattedOutput.tsx` - Add LinkedInPreview toggle
- `components/factory/PostDraft.tsx` - Add structure highlighting
- `lib/agents/orchestrator.ts` - Session saving + evidence filtering
- `app/api/pipeline/stream/route.ts` - Guardrail recovery action

---

## Success Metrics & Monitoring

| Metric                   | Baseline | Target  | Method                 |
| ------------------------ | -------- | ------- | ---------------------- |
| Pipeline completion rate | 40%      | 100%    | User session tracking  |
| Avg time in pipeline     | 25 min   | <15 min | SSE event timestamps   |
| AI cost per post         | $0.50    | $0.40   | API token counting     |
| Session resume adoption  | 0%       | >70%    | Feature usage tracking |
| User satisfaction        | 3.2/5    | >4.5/5  | Beta feedback surveys  |

---

## Rollout Strategy

1. **Staging Deployment** (Mar 21): Deploy all 14 tasks to staging environment
2. **Smoke Testing** (Mar 21-23): Manual QA + automated E2E tests
3. **Beta Rollout** (Mar 24): Deploy to beta users in phases:
   - Phase 1 (Critical fixes only) → Monitor 2 days
   - Phase 2 (Add features) → Monitor 3 days
   - Phase 3 (Optimization) → Monitor ongoing
4. **Feedback Loop**: Daily check-ins with beta users during first week
5. **Hotfix Protocol**: If critical issues, rollback and fix immediately

---

## Sign-Off & Next Steps

**Ready to execute when approved.**

**Questions for final review**:

1. Timeline looks aggressive - acceptable?
2. Database schema changes - approval needed?
3. LinkedIn preview: Use actual LinkedIn CSS or custom simulation?
4. Session history: How long to retain (30/60/90 days)?

**To proceed**:
Run `claudikins-kernel:execute /path/to/this/plan` to begin implementation with isolated agents.
