# DoctorPost v12 — Full Production Push Plan

**Session:** plan-2026-03-03-0816
**Approach:** Parallel Tracks (3 batches)
**Created:** 2026-03-03

---

## 1. Problem Statement

DoctorPost v12 has all core features implemented (knowledge layer, 6 agents, orchestration, UI for factory/campaigns/learning) but is **40-50% production-ready**. Three categories of work remain:

1. **Blockers**: ExtractFlow TypeScript fetch mock issue prevents knowledge base testing; multi-agent coordination is not implemented despite individual agents existing.
2. **Test gaps**: Only 13 of 41 test files exist (32% coverage). Campaign management, post management, API endpoints, AI services, and agent tests are at 0%.
3. **Polish**: Inconsistent error handling, potential performance issues under load, component coupling, and technical debt need addressing before production.

Without these resolved, the app cannot be deployed to production with confidence.

---

## 2. Scope & Boundaries

**IN SCOPE:**

- Fix ExtractFlow TypeScript fetch mock issue (MSW or API layer refactor)
- Implement multi-agent coordination system (orchestrator ↔ agent communication)
- Complete remaining ~28 test files (unit, integration, E2E)
- API endpoint comprehensive testing with error handling validation
- AI service integration testing (Claude, Straico, OneForAll)
- Agent functionality and coordination testing
- Content factory pipeline end-to-end integration testing
- Campaign management workflow testing
- Post management feature completion and testing
- Error handling standardization across all components
- Performance optimization for production load
- Technical debt cleanup (component coupling, state management, API consistency)
- Database schema changes if required by any fix (NCB data layer via API proxy)

**OUT OF SCOPE:**

- New features not in the current implementation plan
- New AI provider integrations beyond existing three
- UI redesign or new pages
- Authentication system changes
- Deployment infrastructure changes (Vercel + CI/CD already configured)

---

## 3. Success Criteria

1. **Test coverage ≥ 80%** — All 41 test files exist and pass. Unit, integration, and E2E tests cover critical paths.
2. **Zero critical blockers** — ExtractFlow fetch mock issue resolved. All components render and function without TypeScript errors.
3. **Multi-agent coordination working** — Orchestrator successfully coordinates all 6 agents (Strategist → Researcher → Writer → Scorer → Formatter → Learner) in a single pipeline run with SSE streaming.
4. **End-to-end pipeline passes** — A user can generate a post through the full factory pipeline (topic selection → research → draft → score → format → review) without errors.
5. **Campaign workflow passes** — A user can create a campaign, generate batch content, and view progress.
6. **Error handling standardized** — All API routes return consistent error shapes. All components display user-friendly error messages. No unhandled promise rejections.
7. **Performance baseline** — Factory pipeline completes a single post in < 60s. Pages load in < 2s. No memory leaks in sustained use.
8. **Build clean** — `npm run build` succeeds with zero TypeScript errors and zero ESLint warnings.

---

## 4. Tasks

<!-- EXECUTION_TASKS_START -->

### Batch 1: Fix Blockers + Complete Existing Test Gaps

| #   | Task                                                                    | Files                                                                               | Deps | Batch |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- | ----- |
| 1   | Fix ExtractFlow fetch mock — implement MSW or refactor to use API layer | `__tests__/components/ExtractFlow.test.tsx`, `components/knowledge/ExtractFlow.tsx` | -    | 1     |
| 2   | Create VersionHistory tests                                             | `__tests__/components/VersionHistory.test.tsx`                                      | -    | 1     |
| 3   | Create CampaignSetup tests                                              | `__tests__/components/CampaignSetup.test.tsx`                                       | -    | 1     |
| 4   | Create CampaignCalendar tests                                           | `__tests__/components/CampaignCalendar.test.tsx`                                    | -    | 1     |
| 5   | Create BatchProgress tests                                              | `__tests__/components/BatchProgress.test.tsx`                                       | -    | 1     |
| 6   | Create SchedulePostModal tests                                          | `__tests__/components/SchedulePostModal.test.tsx`                                   | -    | 1     |
| 7   | Create SignalCounts tests                                               | `__tests__/components/SignalCounts.test.tsx`                                        | -    | 1     |
| 8   | Create PatternList tests                                                | `__tests__/components/PatternList.test.tsx`                                         | -    | 1     |
| 9   | Create RuleProposal tests                                               | `__tests__/components/RuleProposal.test.tsx`                                        | -    | 1     |
| 10  | Create FeedbackHistory tests                                            | `__tests__/components/FeedbackHistory.test.tsx`                                     | -    | 1     |
| 11  | Create Sidebar + Header tests                                           | `__tests__/components/Sidebar.test.tsx`, `__tests__/components/Header.test.tsx`     | -    | 1     |
| 12  | Create PostGenerator tests                                              | `__tests__/components/PostGenerator.test.tsx`                                       | -    | 1     |

### Batch 2: Multi-Agent Coordination + API Testing

| #   | Task                                                               | Files                                               | Deps   | Batch |
| --- | ------------------------------------------------------------------ | --------------------------------------------------- | ------ | ----- |
| 13  | Implement multi-agent coordination in orchestrator                 | `lib/agents/orchestrator.ts`, `lib/agents/types.ts` | -      | 2     |
| 14  | Add agent handoff protocol (output→input contracts between agents) | `lib/agents/orchestrator.ts`, `lib/agents/types.ts` | 13     | 2     |
| 15  | Create Strategist agent tests                                      | `__tests__/agents/strategist.test.ts`               | -      | 2     |
| 16  | Create Researcher agent tests                                      | `__tests__/agents/researcher.test.ts`               | -      | 2     |
| 17  | Create Writer agent tests                                          | `__tests__/agents/writer.test.ts`                   | -      | 2     |
| 18  | Create Scorer agent tests                                          | `__tests__/agents/scorer.test.ts`                   | -      | 2     |
| 19  | Create Formatter agent tests                                       | `__tests__/agents/formatter.test.ts`                | -      | 2     |
| 20  | Create Learner agent tests                                         | `__tests__/agents/learner.test.ts`                  | -      | 2     |
| 21  | Create Orchestrator integration tests                              | `__tests__/agents/orchestrator.test.ts`             | 13, 14 | 2     |
| 22  | Create AI service tests (Claude, Straico, OneForAll)               | `__tests__/lib/ai/aiService.test.ts`                | -      | 2     |
| 23  | Create Pipeline stream API tests                                   | `__tests__/api/pipeline.test.ts`                    | 13     | 2     |
| 24  | Create Campaign API tests                                          | `__tests__/api/campaign.test.ts`                    | -      | 2     |
| 25  | Create Knowledge API tests                                         | `__tests__/api/knowledge.test.ts`                   | -      | 2     |

### Batch 3: Integration Testing + Polish + Production Hardening

| #   | Task                                                             | Files                                        | Deps   | Batch |
| --- | ---------------------------------------------------------------- | -------------------------------------------- | ------ | ----- |
| 26  | E2E: Content factory pipeline (topic → publish)                  | `__tests__/e2e/factory-pipeline.spec.ts`     | 13, 14 | 3     |
| 27  | E2E: Campaign creation and batch generation                      | `__tests__/e2e/campaign-workflow.spec.ts`    | 24     | 3     |
| 28  | E2E: Knowledge management (CRUD + import + extract)              | `__tests__/e2e/knowledge-management.spec.ts` | 1      | 3     |
| 29  | Standardize error handling across all API routes                 | `app/api/*/route.ts`                         | -      | 3     |
| 30  | Standardize error display in UI components                       | `components/**/*.tsx`                        | 29     | 3     |
| 31  | Performance optimization — audit and fix slow renders            | All components                               | -      | 3     |
| 32  | Fix component coupling — extract shared state/utilities          | `lib/`, `components/`                        | -      | 3     |
| 33  | Ensure clean build — fix all TS errors and ESLint warnings       | All files                                    | 1-32   | 3     |
| 34  | DB schema validation — verify all NCB data types match app types | `lib/knowledge/types.ts`, `lib/types.ts`     | -      | 3     |

<!-- EXECUTION_TASKS_END -->

**Totals:** 34 tasks across 3 batches.

- Batch 1 (12 tasks) and Batch 2 (13 tasks) run in parallel.
- Batch 3 (9 tasks) runs after both complete.

---

## 5. Dependencies

**Internal Dependencies:**

- Task 14 depends on 13 (agent handoff needs coordination system first)
- Task 21 depends on 13, 14 (orchestrator tests need the implementation)
- Task 23 depends on 13 (pipeline API tests need working orchestrator)
- Task 26 depends on 13, 14 (E2E factory test needs multi-agent working)
- Task 27 depends on 24 (E2E campaign test needs campaign API tests passing)
- Task 28 depends on 1 (E2E knowledge test needs ExtractFlow fixed)
- Task 30 depends on 29 (UI error display needs standardized API errors first)
- Task 33 depends on all prior tasks (clean build is the final gate)

**Batch Independence:**

- Batch 1 (tasks 1-12) and Batch 2 (tasks 13-25) are fully independent — can run in parallel
- Batch 3 (tasks 26-34) depends on Batch 1 and Batch 2 completion

**External Dependencies:**

- MSW package may need to be installed for ExtractFlow fix (task 1)
- Playwright browsers must be installed for E2E tests (tasks 26-28)
- AI API keys must be configured in `.env` for AI service tests (task 22)
- NCB database must be accessible for API integration tests (tasks 23-25)

---

## 6. Risks & Mitigations

| Risk                                                                     | Likelihood | Impact | Mitigation                                                                                  |
| ------------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------- |
| ExtractFlow fix requires component refactor, not just test fix           | Medium     | Medium | Budget time for refactoring the component itself to use API layer instead of direct fetch   |
| Multi-agent coordination reveals data contract mismatches between agents | High       | High   | Write agent tests (tasks 15-20) first to validate individual contracts before integration   |
| E2E tests flaky due to AI API latency/rate limits                        | High       | Medium | Mock AI responses in E2E tests; only use real APIs in a separate smoke test suite           |
| NCB database schema doesn't match app types                              | Low        | High   | Task 34 validates schema early; if mismatches found, create migration tasks                 |
| Performance optimization scope creep                                     | Medium     | Low    | Timebox to critical paths only (factory pipeline, page loads). Defer cosmetic perf work     |
| Clean build reveals deep TS errors from untested code paths              | Medium     | Medium | Fix incrementally per batch, not all at once. Use `// @ts-expect-error` only as last resort |

---

## 7. Verification Checklist

**After each batch:**

- [ ] `npm run build` — zero errors
- [ ] `npm run test` — all tests pass
- [ ] No new TypeScript errors introduced

**After Batch 1:**

- [ ] ExtractFlow renders and functions without TS errors
- [ ] All 12 new component test files pass
- [ ] Test count ≥ 25 files total

**After Batch 2:**

- [ ] Multi-agent pipeline runs: Strategist → Researcher → Writer → Scorer → Formatter → Learner
- [ ] SSE streaming delivers events for each pipeline step
- [ ] All 6 agent test files pass individually
- [ ] Orchestrator integration test passes
- [ ] AI service tests pass (with mocked API responses)
- [ ] All API route tests pass
- [ ] Test count ≥ 38 files total

**After Batch 3 (Production Gate):**

- [ ] E2E: Full factory pipeline completes without errors
- [ ] E2E: Campaign creation + batch generation works
- [ ] E2E: Knowledge CRUD + import + extract works
- [ ] All API routes return consistent error shapes
- [ ] All components show user-friendly error messages
- [ ] Factory pipeline completes single post in < 60s
- [ ] Pages load in < 2s
- [ ] `npm run build` — zero TS errors, zero ESLint warnings
- [ ] Test coverage ≥ 80%
- [ ] NCB data types match app types

---

## Reference

- **App Status Report:** `docs/plans/APP_STATUS_REPORT.md`
- **Implementation Plan:** `implementation_plan.md`
- **Codebase Map:** `docs/plans/map.md`
- **Testing Summary:** `docs/plans/TESTING_IMPLEMENTATION_SUMMARY.md`
