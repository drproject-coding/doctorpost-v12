# PLAN: Pipeline Session Resume (Approach A - Minimal)

## Problem Statement

Currently, when the pipeline fails at any step (e.g., scoring validation error), users must restart from the beginning, losing progress through successful phases. This is inefficient during debugging and iteration. Users need the ability to quickly resume from where they left off without re-running completed phases.

## Scope & Boundaries

**IN SCOPE:**

- Display current/last session status on factory page
- Show which phase completed last
- Add "Resume from [Phase]" button to continue
- Load intermediate results (topic, research, evidence, draft, etc.) from saved session
- Skip completed phases in stream route execution
- Handle both new sessions and resume scenarios

**OUT OF SCOPE:**

- Editing intermediate results (view only)
- Full session history page
- Phase-by-phase selection UI
- Comparing multiple session attempts
- Branching/alternative paths from a session

## Success Criteria

1. **User can resume a failed session** - After a pipeline fails at phase X, user sees a "Resume from [X]" button
2. **Previous results are preserved** - Resuming loads and uses previous phase outputs (topic, research, evidence, draft)
3. **Skipped phases complete instantly** - No re-execution of completed phases; jumps directly to failed phase
4. **Clear UI feedback** - Factory page shows current session status and phase progress
5. **Fallback to new session** - If user chooses not to resume, can start fresh session
6. **Build passes** - All TypeScript types correct, no runtime errors

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                          | Files                            | Deps | Batch |
| --- | --------------------------------------------- | -------------------------------- | ---- | ----- |
| 1   | Add session status UI to factory page         | app/(protected)/factory/page.tsx | -    | 1     |
| 2   | Modify stream route to accept startPhase      | app/api/pipeline/stream/route.ts | -    | 1     |
| 3   | Add state restoration in orchestrator         | lib/agents/orchestrator.ts       | 2    | 1     |
| 4   | Update factory page to display phase progress | app/(protected)/factory/page.tsx | 2    | 2     |

<!-- EXECUTION_TASKS_END -->

## Task Details

### Task 1: Add session status UI to factory page

- Show current session ID if one exists
- Display last completed phase with emoji/badge (✅ Direction, ✅ Discovery, ❌ Scoring)
- Add button: "Resume from [Phase]" vs "Start New Session"
- Fetch current session from API or localStorage
- Handle case where no session exists (show "Start New Session" only)

### Task 2: Modify stream route to accept startPhase

- Add `startPhase?: string` to StreamRequestBody
- If startPhase provided, reconstruct pipeline state from saved session data
- Only run phases after startPhase (skip completed phases)
- Example: If startPhase="scoring", skip direction/discovery/evidence/writing, jump to scoring with previous results

### Task 3: Add state restoration in orchestrator

- Create helper function `restorePipelineState()` that takes:
  - Base state (keys, knowledge, brandContext)
  - Saved session state (from NCB)
  - Returns fully reconstructed PipelineState
- Parse savedState.strategistOutput → state.selectedTopic, state.strategistOutput
- Parse savedState.evidencePack → state.evidencePack
- Parse savedState.writerOutput → state.writerOutput, etc.
- Handle partial state (some phases may not have data)

### Task 4: Update factory page to display phase progress

- Listen to SSE stream events
- Track which phase completed
- Update UI: "Current phase: Writing (step 4/6)"
- Show progress bar: ████░░░░░░ 40%
- On completion: "Ready for review" or "Failed at [phase]"
- Store updated session to allow resume on next visit

## Dependencies

- Task 2 must complete before Task 3 (stream route needs startPhase first)
- Task 3 must complete before Task 4 (need state restoration working)
- Tasks 1 and 2 are independent (can work in parallel)

## Risks & Mitigations

| Risk                                  | Impact                                       | Mitigation                                                                                              |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Saved session state incomplete**    | Resume fails if required field missing       | Add defensive checks in state restoration; log what fields are missing; offer "start fresh" fallback    |
| **Phase order assumptions break**     | Skipping phases causes wrong execution       | Document phase order; add validation that skipped phases actually completed; test all skip combinations |
| **User confused about stale session** | User resumes old session thinking it's fresh | Show timestamp of when session was last updated; Add "New Session" button always visible                |
| **State drift between client/server** | Client and server disagree on phase          | Use session ID from server, not localStorage; refresh session status before resume                      |

## Verification Checklist

- [ ] Factory page displays session status when session exists
- [ ] "Resume from [Phase]" button appears only when previous session incomplete
- [ ] "Start New Session" button always available
- [ ] Clicking resume sends startPhase parameter to stream route
- [ ] Stream route successfully skips completed phases
- [ ] Pipeline state reconstructed correctly with all previous results
- [ ] Skipped phases take <1 second (no re-execution)
- [ ] Phase progress updates in real-time during execution
- [ ] Session timestamp displayed (last updated: HH:MM)
- [ ] No TypeScript errors in build
- [ ] Test: Resume from Direction → re-runs Discovery, Evidence, Writing, etc.
- [ ] Test: Resume from Evidence with missing Strategist output → graceful error
- [ ] Test: Start new session after completing → creates fresh session ID
- [ ] UX: Phase badges clearly indicate completed vs in-progress vs failed
