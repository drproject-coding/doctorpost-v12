# Create Post Manually - Revamp Plan

**Session ID:** plan-2026-03-04-0420
**Status:** Ready for Execution
**Approach:** Smart Defaults + Profile Integration
**Complexity:** Medium
**Risk:** Low

---

## Problem Statement

**Current State:**

- Manual post creation uses hardcoded, static lists for post types, hook patterns, content pillars, and tones
- Lists haven't been updated since old version of DoctorPost—don't match user's current brand or profile
- UI is confusing (unclear what each option means, no guidance)
- Too many clicks required, no smart defaults
- No personalization; all users see the same options

**Impact:**

- Users spend extra time manually selecting from irrelevant options
- New users are overwhelmed
- High friction reduces creation frequency

**Goal:**
Transform the "Create Post Manually" experience into a smart, personalized interface that proposes relevant post types, hooks, pillars, and tones based on the user's profile, with global presets as a fallback.

---

## Scope & Boundaries

**IN Scope:**

- Redesign the "Create Post Manually" dialog/form
- Pull post types, hook patterns, content pillars, tones from user's profile table
- Display smart defaults based on profile data
- Allow user to override/customize each field
- Add global presets as fallback when profile is incomplete
- Update the dialog UI/UX to be clearer and faster
- Cache/optimize profile data fetching

**OUT of Scope:**

- Rewriting the profiles/settings page
- AI-powered content generation (that's the factory pipeline)
- Learning from past documents (Phase 2 improvement)
- Analytics/tracking of which options users select
- Mobile-specific UI optimization (desktop-first)
- Multi-select for all fields (single selections for now)

---

## Success Criteria

**User-Centric:**

- ✅ Users with complete profiles see smart defaults in <1 second
- ✅ Creating a post takes 50% fewer clicks than before
- ✅ New users understand what each field means (labels are clear)
- ✅ Users can customize defaults if they want

**Technical:**

- ✅ Profile data loads correctly and is filtered (only relevant fields)
- ✅ Fallback to global presets when profile is incomplete
- ✅ Dialog renders without jank or delay
- ✅ All changes persist correctly through post creation

**Business:**

- ✅ Increase post creation frequency by 20%+ (measure via analytics later)
- ✅ Reduce time-to-creation for manual posts by 40%+

---

## Implementation Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                         | Files                                             | Dependencies | Complexity |
| --- | -------------------------------------------- | ------------------------------------------------- | ------------ | ---------- |
| 1   | Create PostCreationConfig type and interface | `lib/types/post-creation.ts`                      | -            | Low        |
| 2   | Add API endpoint to fetch profile data       | `app/api/profile/data/route.ts`                   | -            | Low        |
| 3   | Add API endpoint to fetch global presets     | `app/api/post-presets/route.ts`                   | -            | Low        |
| 4   | Create ProfileDataProvider hook              | `lib/hooks/useProfileData.ts`                     | 2            | Low        |
| 5   | Create PresetsProvider hook                  | `lib/hooks/usePostPresets.ts`                     | 3            | Low        |
| 6   | Refactor CreatePostDialog component          | `components/factory/CreatePostDialog.tsx`         | 4,5          | Medium     |
| 7   | Create PostTypeSelector component            | `components/factory/PostTypeSelector.tsx`         | 1            | Low        |
| 8   | Create HookPatternSelector component         | `components/factory/HookPatternSelector.tsx`      | 1            | Low        |
| 9   | Create ContentPillarSelector component       | `components/factory/ContentPillarSelector.tsx`    | 1            | Low        |
| 10  | Create ToneSelector component                | `components/factory/ToneSelector.tsx`             | 1            | Low        |
| 11  | Add smart defaults logic                     | `lib/post-creation/smartDefaults.ts`              | 1,4,5        | Medium     |
| 12  | Integrate selectors into dialog              | `components/factory/CreatePostDialog.tsx`         | 7,8,9,10,11  | Medium     |
| 13  | Add error handling and loading states        | `components/factory/CreatePostDialog.tsx`         | 12           | Low        |
| 14  | Update Storybook stories                     | `stories/factory/CreatePostDialog.stories.tsx`    | 6            | Low        |
| 15  | Add unit tests for selectors                 | `__tests__/components/factory/selectors.test.tsx` | 7,8,9,10     | Medium     |
| 16  | Add integration test for full flow           | `__tests__/integration/post-creation.test.tsx`    | 12           | Medium     |

<!-- EXECUTION_TASKS_END -->

**Batch Strategy:**

- **Batch 1** (Types & APIs): Tasks 1-5 (independent, non-blocking setup)
- **Batch 2** (Components): Tasks 6-14 (component build-out, can run in parallel)
- **Batch 3** (Testing & Polish): Tasks 15-16 (validation)

---

## Data Sources & Integration Points

**Current Implementation Context:**

- Profile data already flows into post creation via `getBrandProfile()` (found in `/lib/api.ts`)
- UI uses `EnhancedDropdown` components that support compatibility mapping (existing in codebase)
- Profile table has `audience`, `tones`, `offers` fields (JSON arrays) ready to use
- Global presets can be stored in a new seed data file

**Smart Defaults Logic:**

```typescript
// Pseudo-code for smart defaults
function getSmartDefaults(profile: BrandProfile): PostCreationDefaults {
  return {
    postTypes:
      profile.preferred_post_types || popularPostTypes(profile.industry),
    hookPatterns: profile.preferred_hooks || recommendedHooks(profile.audience),
    contentPillars: profile.content_pillars || inferFromProfile(profile),
    tones: profile.tones || [defaultTone],
  };
}
```

---

## Dependencies & Risks

**Task Dependencies:**

- **Critical Path:** 1 → 2,3 → 4,5 → 6 → 12 → 13,16
- **Parallelizable:** Tasks 7-11 can run in parallel after 1
- **Bottleneck:** Task 6 (CreatePostDialog refactor) is the most complex, blocks integration

**External Dependencies:**

- Profile data structure must be complete (verify schema in `profiles` table)
- No breaking changes to post creation API

**Risks & Mitigations:**

| Risk                    | Impact                               | Likelihood | Mitigation                             |
| ----------------------- | ------------------------------------ | ---------- | -------------------------------------- |
| Profile data incomplete | Users see empty dialog               | Medium     | Add global presets fallback            |
| Performance regression  | Dialog takes >2s to load             | Low        | Cache profile data, lazy-load presets  |
| Type mismatches         | Data format issues                   | Low        | Strong typing (TypeScript) + tests     |
| Breaking changes        | Existing post creation breaks        | Low        | Keep POST endpoint backward-compatible |
| UI confusion persists   | Users still don't understand options | Medium     | Add tooltips/help text for each field  |

---

## Verification Checklist

**Before Launch:**

- [ ] All unit tests pass (>80% coverage for new components)
- [ ] All integration tests pass (full post creation flow works)
- [ ] Profile data loads correctly and is displayed
- [ ] Fallback to presets works when profile is incomplete
- [ ] Dialog loads in <1 second
- [ ] All field selections persist through post creation
- [ ] No TypeScript errors or console warnings
- [ ] Storybook stories render correctly
- [ ] Code review passed (no critical issues)
- [ ] Manual QA: Create 5 posts using different profile setups

**Post-Launch:**

- [ ] Monitor error rates for 24 hours
- [ ] Check that profile data is loading (no blank dialogs)
- [ ] Gather user feedback on new UX
- [ ] Plan Phase 2 improvements (document learning, more presets)

---

## Architecture Decisions

**Why Smart Defaults Over Learning System:**

1. **ROI**: 80% of value with 20% of effort
2. **Time-to-market**: 1-2 weeks vs. 4-6 weeks
3. **Risk**: Low complexity, no ML needed
4. **Scalable**: Can add learning in Phase 2 without rework

**Why Profile-Based Over Global Presets Only:**

1. **Personalization**: Users with complete profiles get instant value
2. **Existing data**: Profile fields already exist, no new tables needed
3. **Fallback pattern**: Presets are backup for incomplete profiles, not primary
4. **Learning foundation**: Ready to add user preference learning later

---

## Context for Execution

**Key Files to Reference:**

- Current dialog: `/app/(protected)/create/page.tsx`
- Dropdown component: `/components/EnhancedDropdown.tsx`
- Profile API: `/lib/api.ts` (getBrandProfile function)
- Data definitions: `/lib/dropdownData.ts` (16 post types, 6 hooks, 6 pillars, 13 tones)
- Database schema: `/50008_doctorpost_schema.txt`

**Current Post Type Options:** Educational, Listicle, Tool Review, Case Study, Trend Analysis, Industry Insights, Comparison, Question, Personal Story, Controversial, Behind-the-Scenes, Myth-Busting, Prediction, Motivational

**Current Hook Patterns:** Curiosity Gap, Problem-Agitate-Solve, Social Proof, Contrarian, Authority, Educational/Framework

**Profile Fields Available:** audience, tones, offers, content_strategy, definition, copy_guideline, ai_provider
