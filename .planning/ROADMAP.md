# Roadmap: DoctorPost DS Compliance

## Overview

Systematically close the design system compliance gaps identified in the DS audit (ds-UAT.md). Four categories of issues: raw form inputs, hardcoded hex colors, rounded corners, raw pixel font sizes.

## Phases

- [ ] **Phase 1: DS Compliance Fixes** - Replace raw form elements, fix color tokens, remove border-radius violations, fix font sizes

## Phase Details

### Phase 1: DS Compliance Fixes

**Goal**: Close all 4 audit issues — forms, colors, borders, typography
**Depends on**: Nothing (first phase)
**Requirements**: DS-FORMS-01, DS-FORMS-02, DS-FORMS-03, DS-FORMS-04, DS-COLORS-01, DS-COLORS-02, DS-COLORS-03, DS-BORDERS-01, DS-TYPO-01
**Success Criteria** (what must be TRUE):

1. Zero raw `<input>/<select>/<textarea>` in priority files (onboarding, settings, brand sections, auth)
2. Auth error states use `var(--drp-error)` — no hardcoded `#b91c1c` or `#dc2626`
3. No `rounded-full` classes on calendar dots
4. No raw pixel font sizes in components replaced with DS token vars

**Plans**: 3 plans in wave 1

Plans:

- [ ] 01-ds-compliance-fixes-01-PLAN.md — Replace form inputs (60+ raw inputs → DS components)
- [ ] 01-ds-compliance-fixes-02-PLAN.md — Replace hardcoded hex colors (40+ colors → DS tokens)
- [ ] 01-ds-compliance-fixes-03-PLAN.md — Fix rounded corners + typography (calendar page fixes)

**Audit source**: `.planning/phases/ds-audit/ds-UAT.md`
