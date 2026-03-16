# Brand Page Implementation Plan

> **Session:** plan-2026-03-05-brand-page
> **For Claude:** Use `superpowers:executing-plans` to implement this plan task-by-task.

---

## Problem Statement

Brand information in DoctorPost is fragmented across Settings (edit form) and Create page (inline usage). There is no single place where a user can view their complete brand identity, edit it clearly by section, or export it as a shareable brand guideline document. Settings mixes AI provider config with brand identity — causing confusion about where things live.

---

## Scope

### IN scope

- New `/brand` route with sidebar nav entry ("Brand" icon)
- Single-scroll page with 7 color-coded sections
- View-first layout: each section shows data beautifully, with an inline Edit button
- Auto-save per section on edit confirm
- Export: PDF, Markdown, JSON, Copy as text
- Settings page stripped down to AI config only (providers, API keys, models)
- New `positioning` field added to `BrandProfile` type + DB
- Per-section AI `✨ Generate` button (drafts content using existing profile context)
- Global `Audit Brand` AI action (reviews all sections, surfaces suggestions)

### OUT of scope

- Multi-brand profiles
- Brand collaboration/sharing with other users
- Analytics per brand section

---

## Success Criteria

- [ ] `/brand` is accessible from sidebar and renders all 7 sections
- [ ] Each section switches between view mode and inline edit mode
- [ ] Saving a section calls `updateBrandProfile` and shows feedback
- [ ] Export generates valid MD, JSON, copy-to-clipboard, and PDF
- [ ] Settings page shows only AI config (no brand fields)
- [ ] `✨ Generate` button on each section produces a draft using AI
- [ ] `Audit Brand` button produces a full brand review
- [ ] TypeScript: 0 errors

---

## Section Design

Each section has:

- **Color-coded left border + header tag** to visually identify section type
- **View mode**: clean display of values as text, tags, or cards
- **Edit mode**: inline form fields, triggered by an Edit button
- **AI Generate button** (✨): drafts/suggests content for that section

| Section             | Color              | Fields                                                                                                   |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| Profile             | Purple `#631DED`   | firstName, lastName, companyName, role, industry, audience                                               |
| Voice & Guidelines  | Orange `#FF6C01`   | tones, copyGuideline, styleGuide (emoji/hashtags/links), taboos                                          |
| Content Strategy    | Teal `#00A896`     | contentStrategy, definition                                                                              |
| Offers & Value Prop | Yellow `#FAE8A4`   | offers (string array)                                                                                    |
| Content Pillars     | Mint `#98E9AB`     | visual tag display of contentPillar values                                                               |
| Brand Positioning   | Pink `#E99898`     | positioning (new field — free text)                                                                      |
| AI & Tools          | Charcoal `#282828` | aiProvider, claudeApiKey, straicoApiKey, straicoModel, oneforallApiKey, oneforallModel, perplexityApiKey |

---

## Architecture

**Files to create:**

- `app/(protected)/brand/page.tsx` — main Brand page
- `components/brand/BrandSection.tsx` — reusable section wrapper (view/edit/color/header)
- `components/brand/sections/ProfileSection.tsx`
- `components/brand/sections/VoiceSection.tsx`
- `components/brand/sections/StrategySection.tsx`
- `components/brand/sections/OffersSection.tsx`
- `components/brand/sections/PillarsSection.tsx`
- `components/brand/sections/PositioningSection.tsx`
- `components/brand/sections/AiToolsSection.tsx`
- `components/brand/BrandExport.tsx` — export utility component
- `lib/brand-export.ts` — export logic (MD, JSON, PDF, clipboard)

**Files to modify:**

- `lib/types.ts` — add `positioning?: string` to `BrandProfile`
- `lib/api.ts` — add `positioning` to `NcbProfileRow` + `mapProfileFromNcb` + `updateBrandProfile`
- `app/(protected)/settings/page.tsx` — remove brand fields, keep only AI config
- `components/Sidebar.tsx` — add Brand nav item

**No new API routes** — uses existing `updateBrandProfile`.

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                                       | Files                                                     | Deps  | Batch |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----- | ----- |
| 1   | Add `positioning` field to BrandProfile type, NcbProfileRow, mapProfileFromNcb, updateBrandProfile payload | `lib/types.ts`, `lib/api.ts`                              | -     | 1     |
| 2   | Strip Settings page to AI config only — remove brand identity form fields                                  | `app/(protected)/settings/page.tsx`                       | -     | 1     |
| 3   | Add Brand nav item to sidebar                                                                              | `components/Sidebar.tsx`                                  | -     | 1     |
| 4   | Create brand page route + scaffold with profile load                                                       | `app/(protected)/brand/page.tsx`                          | 1     | 2     |
| 5   | Build `BrandSection` wrapper component (view/edit toggle, color border, header, AI button slot)            | `components/brand/BrandSection.tsx`                       | -     | 2     |
| 6   | Build ProfileSection (view + edit mode)                                                                    | `components/brand/sections/ProfileSection.tsx`            | 5     | 3     |
| 7   | Build VoiceSection (tones as tags, styleGuide, taboos, copyGuideline)                                      | `components/brand/sections/VoiceSection.tsx`              | 5     | 3     |
| 8   | Build StrategySection (contentStrategy text, definition)                                                   | `components/brand/sections/StrategySection.tsx`           | 5     | 3     |
| 9   | Build OffersSection (offers as tag list, add/remove)                                                       | `components/brand/sections/OffersSection.tsx`             | 5     | 3     |
| 10  | Build PillarsSection (content pillars as color-coded visual cards)                                         | `components/brand/sections/PillarsSection.tsx`            | 5     | 3     |
| 11  | Build PositioningSection (free text, new field)                                                            | `components/brand/sections/PositioningSection.tsx`        | 5     | 3     |
| 12  | Build AiToolsSection (mirrors Settings AI config, shows keys masked, edit in-place)                        | `components/brand/sections/AiToolsSection.tsx`            | 5     | 3     |
| 13  | Wire all sections into Brand page with profile load + updateBrandProfile on save                           | `app/(protected)/brand/page.tsx`                          | 6-12  | 4     |
| 14  | Build export utility: MD + JSON + clipboard                                                                | `lib/brand-export.ts`                                     | 1     | 4     |
| 15  | Build PDF export (use browser print or html2canvas)                                                        | `lib/brand-export.ts`, `components/brand/BrandExport.tsx` | 14    | 5     |
| 16  | Add Export button to Brand page header (dropdown: MD, JSON, Copy, PDF)                                     | `app/(protected)/brand/page.tsx`                          | 14,15 | 5     |
| 17  | Add per-section AI `✨ Generate` button — calls AI with current profile context to draft that section      | `components/brand/BrandSection.tsx`, `lib/api.ts`         | 13    | 6     |
| 18  | Add global `Audit Brand` button — AI reviews all sections and returns suggestions as a panel               | `app/(protected)/brand/page.tsx`, `lib/api.ts`            | 13    | 6     |
| 19  | TypeScript check + smoke test                                                                              | -                                                         | 18    | 7     |

<!-- EXECUTION_TASKS_END -->

---

## Key Implementation Notes

### BrandSection component contract

```tsx
<BrandSection
  title="Profile"
  color="#631DED"
  tag="PROFILE"
  onSave={async (data) => updateProfile(data)}
  onAiGenerate={() => generateSection("profile")}
>
  {(editing) => (editing ? <ProfileEdit /> : <ProfileView />)}
</BrandSection>
```

### Export format — Markdown

```md
# Brand Guidelines — [Name]

## Profile

- Role: ...
- Industry: ...
- Audience: ...

## Voice & Guidelines

- Tones: ...
  ...
```

### AI Generate per section

- System prompt: "You are a brand strategist. Based on this user's existing brand profile: [JSON of current profile], generate a [section name] for them."
- Use existing `generateWithAi` abstraction
- Result is shown as a suggestion — user confirms before saving

### AI Audit Brand

- System prompt: "Review this brand profile and identify: (1) missing or weak sections, (2) inconsistencies between sections, (3) specific improvements."
- Renders results in a collapsible audit panel at top of Brand page

### PDF Export

- Use `window.print()` with a `@media print` stylesheet for the brand page
- Or use `html2canvas` + `jspdf` if richer layout needed
- Decision: start with `window.print()`, upgrade if needed

### Settings page after strip

Settings keeps only:

- AI Provider selector
- Claude API key + validate
- Straico API key + model + validate
- Oneforall API key + model + validate
- Perplexity API key
- Reddit credentials
  All brand identity fields (role, industry, audience, tones, etc.) are removed from Settings.

---

## Risks & Mitigations

| Risk                                             | Mitigation                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Settings strip breaks existing profile save flow | Keep `saveProfileSilent` logic, just remove brand fields from the form state |
| PDF export quality varies by browser             | Start with `window.print()`, document the limitation                         |
| AI generate costs per-section adds up            | Only fires on explicit button press — no auto-generation                     |
| `positioning` field not in DB yet                | Task 1 explicitly adds it to schema via NocodeBackend                        |

---

## Verification Checklist

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `/brand` loads without crash when profile exists
- [ ] `/brand` loads without crash when profile is empty (new user)
- [ ] Each section: view mode shows data correctly
- [ ] Each section: edit mode saves and reverts on cancel
- [ ] Settings page: brand fields are gone, AI config still works
- [ ] Export MD: valid markdown with all sections
- [ ] Export JSON: valid JSON parseable
- [ ] Copy: lands in clipboard
- [ ] AI Generate: returns suggestion, user can confirm or dismiss
- [ ] Audit Brand: returns structured feedback panel
