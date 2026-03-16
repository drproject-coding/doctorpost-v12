# Campaign Idea Lifecycle

**Date:** 2026-03-07
**Session:** plan-2026-03-07-campaign-ideas
**Status:** Draft

---

## Problem Statement

The campaign feature generates topic ideas (headline, pillar, angle, template, hook, reasoning) but gives users no way to manage them after creation. Ideas sit in a "pending" limbo with no status, no lifecycle, no bridge into the writing flow. Users can't tell which ideas they've reviewed, which they've approved, or how to start writing from one.

---

## Scope

### In scope

- Status system for campaign ideas (waiting_review → validated / rejected → in_progress → published)
- Campaign list page — load existing campaigns from DB, not just current session
- Campaign calendar color-coded by status
- Filter bar (by status, by pillar) + bulk actions (validate all, reject all)
- Summary row showing idea counts per status
- Idea detail full page (`/campaigns/[campaignId]/idea/[slotOrder]`) — view, edit, change status
- "Write this post" button on validated ideas → navigates to `/create` with topic card pre-filled
- Validated ideas inbox on Create page — pick a validated idea to pre-fill the form
- Campaign analytics — idea funnel (total generated → reviewed → validated → written → published)

### Out of scope

- Auto-generating post content from ideas
- Notifications or reminders for review deadlines
- Multi-user collaboration
- Editing the original campaign config after creation

---

## Success Criteria

1. User opens campaigns page and sees all their campaigns (not just the current session)
2. Calendar cards are color-coded — grey=waiting, blue=validated, red=rejected, orange=in_progress, green=published
3. Clicking a card navigates to `/campaigns/[campaignId]/idea/[slotOrder]`
4. From the detail page, user can validate or reject an idea in one click
5. Validated ideas appear in the Create page inbox with all fields pre-filled
6. Campaign analytics show the full idea funnel

---

## Data Model Changes

### `campaign_posts.generation_status` — repurposed values

| Old value | New value        | Meaning                         |
| --------- | ---------------- | ------------------------------- |
| `pending` | `waiting_review` | Freshly generated, not reviewed |
| —         | `validated`      | User approved                   |
| —         | `rejected`       | User dismissed                  |
| —         | `in_progress`    | A post draft has been started   |
| —         | `published`      | The linked post is published    |

### New column: `campaign_posts.post_uuid`

- Type: `varchar(36)`, nullable
- Set when user clicks "Write this post" — stores the post UUID
- Used to track `in_progress` → `published` status

### Migration

- All existing rows with `generation_status = 'pending'` → rename semantically (handled in NCB via execute_sql)
- Add `post_uuid` column

---

## Architecture

### New routes

- `app/(protected)/campaigns/page.tsx` — enhanced: loads campaign list from DB
- `app/(protected)/campaigns/[campaignId]/page.tsx` — campaign detail with calendar
- `app/(protected)/campaigns/[campaignId]/idea/[slotOrder]/page.tsx` — idea detail page

### New components

- `components/campaigns/CampaignList.tsx` — list of past campaigns
- `components/campaigns/IdeaStatusBadge.tsx` — reusable colored status pill
- `components/campaigns/CampaignFilters.tsx` — filter bar (status + pillar)
- `components/campaigns/CampaignSummaryRow.tsx` — counts per status
- `components/campaigns/IdeaInbox.tsx` — validated ideas panel in Create page

### Modified files

- `app/api/campaign/route.ts` — default status = `waiting_review`, return `campaignId` + slot NCB IDs in SSE
- `components/campaigns/CampaignCalendar.tsx` — status colors, click → navigate (no modal)
- `app/(protected)/create/page.tsx` — add idea inbox, handle `?topicCard=` URL params
- `lib/knowledge/api.ts` — add `updateCampaignPostStatus`, `getValidatedIdeas`, `linkPostToCampaignSlot`
- `lib/knowledge/types.ts` — update `CampaignPostStatus` type with new values

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                           | Files                                                              | Deps  | Batch |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ----- |
| 1   | Update CampaignPostStatus type + default value in route                                        | `lib/knowledge/types.ts`, `app/api/campaign/route.ts`              | —     | 1     |
| 2   | Add post_uuid column via NCB execute_sql                                                       | NCB migration                                                      | —     | 1     |
| 3   | Add knowledge API helpers: updateCampaignPostStatus, getValidatedIdeas, linkPostToCampaignSlot | `lib/knowledge/api.ts`                                             | 1     | 1     |
| 4   | Return campaignId + slot NCB IDs in SSE stream                                                 | `app/api/campaign/route.ts`                                        | 1     | 1     |
| 5   | Create IdeaStatusBadge component                                                               | `components/campaigns/IdeaStatusBadge.tsx`                         | 1     | 2     |
| 6   | Create CampaignSummaryRow component                                                            | `components/campaigns/CampaignSummaryRow.tsx`                      | 5     | 2     |
| 7   | Create CampaignFilters component (status + pillar filters)                                     | `components/campaigns/CampaignFilters.tsx`                         | 5     | 2     |
| 8   | Update CampaignCalendar — status colors, filters, bulk actions, summary row, click navigates   | `components/campaigns/CampaignCalendar.tsx`                        | 5,6,7 | 2     |
| 9   | Create campaign list component (load campaigns from DB)                                        | `components/campaigns/CampaignList.tsx`, `lib/knowledge/api.ts`    | 3     | 2     |
| 10  | Refactor campaigns page — split into list view + new campaign flow                             | `app/(protected)/campaigns/page.tsx`                               | 9     | 2     |
| 11  | Create campaign detail page (loads campaign + slots from DB)                                   | `app/(protected)/campaigns/[campaignId]/page.tsx`                  | 3,8   | 3     |
| 12  | Create idea detail page — view + edit + status actions                                         | `app/(protected)/campaigns/[campaignId]/idea/[slotOrder]/page.tsx` | 3,5   | 3     |
| 13  | Add "Write this post" button on idea detail page                                               | `app/(protected)/campaigns/[campaignId]/idea/[slotOrder]/page.tsx` | 12    | 3     |
| 14  | Create IdeaInbox component for Create page                                                     | `components/campaigns/IdeaInbox.tsx`                               | 3,5   | 4     |
| 15  | Add idea inbox + URL param pre-fill to Create page                                             | `app/(protected)/create/page.tsx`                                  | 14    | 4     |
| 16  | Add campaign analytics section (idea funnel)                                                   | `app/(protected)/campaigns/[campaignId]/page.tsx`                  | 11    | 4     |

<!-- EXECUTION_TASKS_END -->

---

## Dependencies

- NCB MCP must be working for task 2 (migration)
- Task 4 (SSE slot IDs) is needed before task 11+12 can receive real data
- Tasks 5–8 can be done in parallel with task 9
- Create page changes (14–15) are independent of campaign detail (11–12)

---

## Risks & Mitigations

| Risk                                              | Mitigation                                    |
| ------------------------------------------------- | --------------------------------------------- |
| NCB `execute_sql` unavailable for migration       | Manually add column via NCB dashboard         |
| Campaign list page performance (many campaigns)   | Limit to 20 most recent, add pagination later |
| `post_uuid` linking breaks if post is deleted     | Make it nullable, handle gracefully in UI     |
| Create page pre-fill conflicts with existing flow | URL params override only empty fields         |

---

## Verification Checklist

- [ ] `generation_status` default is `waiting_review` for new campaign slots
- [ ] Calendar cards show correct status color
- [ ] Filter bar hides/shows cards correctly (client-side, no flicker)
- [ ] Bulk validate/reject updates DB and refreshes UI
- [ ] Idea detail page loads from DB (not from session state)
- [ ] Validate/Reject buttons update status and show feedback
- [ ] "Write this post" navigates to `/create?topicCard=...` with correct pre-fill
- [ ] Validated ideas appear in Create page inbox
- [ ] Campaign analytics counts match actual DB records
- [ ] Rejected ideas are visually de-emphasised but not hidden by default
