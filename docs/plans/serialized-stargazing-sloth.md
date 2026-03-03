# Plan: Seed Knowledge + Migrate to @bruddle/react + E2E Test Factory

## Context

The Factory pipeline is deployed but non-functional because: (1) the NCB `documents` table is empty — agents get zero knowledge context, (2) all UI components use raw `bru-*` CSS classes instead of the just-installed `@bruddle/react` typed components. This plan seeds the knowledge layer, migrates the UI, and verifies the Factory works end-to-end.

---

## Step 1: Seed Knowledge Documents

**Goal**: Bundle 31 .md files into the codebase and create an API endpoint to seed them into NCB.

### 1a. Create `lib/knowledge/seed-data/content.ts`

Read all 31 .md files from `/Users/y/Desktop/content-factory-agents/doctor-project-content-factory/` and create a single TypeScript file mapping `sourcePath → content string`. Keys match `SEED_MANIFEST[i].sourcePath` exactly.

### 1b. Create `app/api/seed-knowledge/route.ts`

Follow the `seed-profile/route.ts` pattern:

- Auth via `getSessionUser` + `extractAuthCookies`
- `ncbFetch` helper (same as seed-profile)
- For each manifest entry: check if doc exists (`GET read/documents?category=X&name=Y`), create if missing
- Return `{ results: [{ name, status: "created"|"skipped"|"error" }] }`

**Files created**: `lib/knowledge/seed-data/content.ts`, `app/api/seed-knowledge/route.ts`
**Files referenced**: `lib/knowledge/seed-data/manifest.ts`, `app/api/seed-profile/route.ts`, `lib/ncb-utils.ts`

---

## Step 2: Migrate Components to @bruddle/react

**Goal**: Replace raw `bru-*` class markup with typed React components across ~35 files.

### Migration rules

| Raw class pattern                                  | @bruddle/react component              |
| -------------------------------------------------- | ------------------------------------- |
| `<div className="bru-card bru-card--raised">`      | `<Card variant="raised">`             |
| `<div className="bru-card bru-card--flat">`        | `<Card variant="flat">`               |
| `<div className="bru-card bru-card--interactive">` | `<Card variant="interactive">`        |
| `<button className="bru-btn bru-btn--primary">`    | `<Button variant="primary">`          |
| `<button className="bru-btn bru-btn--ghost">`      | `<Button variant="ghost">`            |
| `<button className="bru-btn bru-btn--sm">`         | `<Button size="sm">`                  |
| `<button className="bru-btn bru-btn--block">`      | `<Button block>`                      |
| Multi-element `bru-alert bru-alert--error`         | `<Alert variant="error" title="...">` |
| `<input className="bru-input">` with label         | `<Input label="...">`                 |
| `<select className="bru-select">`                  | `<Select label="...">`                |
| `bru-progress` + `bru-progress__bar` div pair      | `<ProgressBar value={n}>`             |

### What NOT to migrate

- **Modals** — `Modal` component lacks `className` prop, can't set `max-w-2xl`
- **Form layout** (`bru-field`, `bru-form-stack`, `bru-form-row`, `bru-form-actions`) — no React equivalents
- **Tags with status colors** — dynamic colors don't map to Tag's `color` prop
- **Factory error alert** with embedded "Start Over" button — keep raw
- **Inline styles** with CSS variables — stay as-is

### Batch order (6 batches)

1. **Alert** (10 files) — 5-line → 1-line, lowest risk
2. **ProgressBar** (1 file) — `dashboard/page.tsx`
3. **Select** (2 files) — `StraicoModelPicker.tsx`, `ImportFlow.tsx`
4. **Card** (35 files) — mechanical `<div>` → `<Card variant="...">`
5. **Button** (23 files, 72 occurrences) — `<button>` → `<Button variant="...">`
6. **Input** (where clean label+input pairing exists)

---

## Step 3: Build, Commit, Push, Deploy

1. `npx next build` — verify 0 errors
2. Commit all changes
3. Push to main → Vercel auto-deploys

---

## Step 4: Seed Production & Test Factory E2E

Seed: `fetch('/api/seed-knowledge', { method: 'POST', credentials: 'include' })`

Manual test: Start Pipeline → select topic → Research → Evidence → Write → Score → Format → Approve → verify Learning completes.

---

## Scope

- **New files**: 2 (`content.ts`, `seed-knowledge/route.ts`)
- **Modified files**: ~35 (component migration)
- **Risk**: Low — same CSS classes applied internally, seed is additive
