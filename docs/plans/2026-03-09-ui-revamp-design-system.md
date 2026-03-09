# UI Revamp — Bruddle Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically replace all raw/inconsistent UI patterns across every page with components and CSS classes from the Bruddle Design System, achieving a fully consistent, on-brand UI.

**Architecture:** All UI must come exclusively from `@bruddle/react` components or `bru-*` CSS classes from `styles/bruddle/`. No new components or custom UI patterns are allowed. Tailwind color utilities (`text-gray-*`, `text-green-*`, etc.) must be replaced with `--bru-*` CSS variables. All pages are in `app/(protected)/` except auth pages.

**Tech Stack:** Next.js 16 (App Router), `@bruddle/react` (Button, Input, Select, Textarea, Card, Tag, Badge, Alert, EmptyState, Loader, Skeleton, Tabs, Pagination, Modal, ProgressBar, StatusDot, Switch, Checkbox, Divider, Tooltip), Bruddle CSS classes (`bru-btn`, `bru-card`, `bru-input`, `bru-field`, etc.), TypeScript

---

## Design System Reference

### `@bruddle/react` Components Available

```
Button(variant, size, block, icon)
Input(label, error, success)
Select(label)
Textarea(label, error, success)
Checkbox(label, dark)
Radio(label, color, dark)
Switch(label)
Card(variant: raised|flat|sm, className)
CardHeader
Tag(color: purple|mint|pink|yellow|grey, filled, dot, closeable)
Badge(variant: filled|primary|secondary|outline|mint|pink)
StatusDot(color: purple|mint|pink|yellow, pulse)
Alert(variant: info|success|warning|error, title, onClose)
EmptyState(icon, title, description, action)
Loader(size: sm|lg, label)
Skeleton(width, height, variant: text|rectangular|circular)
ProgressBar(value, color: mint|pink|yellow|grey, size: sm|lg)
Tabs(items: [{id, label, count}], activeTab, onChange)
Pagination(page, totalPages, onChange)
Modal(isOpen, onClose, title, children)
Divider(label)
Tooltip(content, children)
Avatar(src, alt, size: sm|lg, initials)
```

### CSS Classes Reference

```
bru-btn, bru-btn--primary, bru-btn--outline, bru-btn--ghost, bru-btn--danger, bru-btn--secondary, bru-btn--dark
bru-btn--sm, bru-btn--lg, bru-btn--icon, bru-btn--block
bru-card, bru-card--raised, bru-card--flat, bru-card--sm
bru-card--purple (left accent), bru-card--mint, bru-card--pink, bru-card--yellow
bru-card__header, bru-card__title, bru-card__subtitle
bru-field, bru-field__label, bru-input, bru-input--error, bru-input--success
bru-select
Typography: bru-h1...bru-h6, bru-text-lg/md/sm/xs, bru-label, bru-caption
```

### Replacement Rules (apply everywhere)

| Old pattern                         | Replace with                                   |
| ----------------------------------- | ---------------------------------------------- |
| `text-gray-600`                     | `style={{ color: 'var(--bru-grey)' }}`         |
| `text-green-500/600`                | `style={{ color: 'var(--bru-success)' }}`      |
| `text-red-*`                        | `style={{ color: 'var(--bru-error)' }}`        |
| Raw `<button>`                      | `<Button variant="...">` or `bru-btn` class    |
| Raw `<input>`                       | `<Input label="...">` from @bruddle/react      |
| Raw `<select>`                      | `<Select label="...">` from @bruddle/react     |
| Raw `<textarea>`                    | `<Textarea label="...">` from @bruddle/react   |
| Inline error `<div>`                | `<Alert variant="error">`                      |
| Loading `<Loader>` from lucide      | `<Loader>` from @bruddle/react                 |
| Empty state `<p>`                   | `<EmptyState title="..." description="...">`   |
| Status badge `<span>` inline styled | `<Tag color="...">` or `<Badge variant="...">` |
| Filter buttons row                  | `<Tabs>` component                             |
| Custom pagination buttons           | `<Pagination>` component                       |
| Inline validation badge             | `<Badge>` from @bruddle/react                  |

---

## Task 1: Auth Pages (Login, Reset Password)

**Files:**

- Modify: `app/login/page.tsx`
- Modify: `app/reset-password/page.tsx`
- Modify: `app/signup/page.tsx` (if exists)

**What to fix:**

- `app/login/page.tsx` line 162: raw `<input type="email">` → `<Input label="Email" type="email">`
- `app/login/page.tsx` line 173: raw `<input type="password">` → `<Input label="Password" type={showPassword ? "text" : "password"}>`
- `app/login/page.tsx` line 140-151: divider markup → `<Divider label="or">`
- `app/login/page.tsx` line 212-225: inline error div → `<Alert variant="error">{error}</Alert>`
- `app/login/page.tsx` line 82-90: lucide Loader → `<Loader>` from @bruddle/react
- Remove password toggle button (eye icon) since Input component doesn't have this natively — keep as-is with `bru-btn--ghost bru-btn--icon` class on the toggle button

**Step 1:** Replace all raw inputs in login/page.tsx with `<Input>` from @bruddle/react

```tsx
import { Button, Card, Input, Alert, Divider, Loader } from "@bruddle/react";

// Email input (remove <div> wrapper, Input handles it):
<Input
  label="Email"
  type="email"
  placeholder="Email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Password (keep relative div for eye toggle):
<div className="relative">
  <Input
    label="Password"
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="bru-btn bru-btn--ghost bru-btn--icon"
    style={{ position: "absolute", right: 8, bottom: 8 }}
  >
    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
  </button>
</div>
```

**Step 2:** Replace error inline div with Alert

```tsx
{
  error && <Alert variant="error">{error}</Alert>;
}
```

**Step 3:** Replace divider with Divider component

```tsx
<Divider label="or" />
```

**Step 4:** Replace Lucide Loader with @bruddle/react Loader

```tsx
import { Loader } from "@bruddle/react"; // replaces lucide Loader
// Usage: <Loader /> (no size prop needed for default)
```

**Step 5:** Commit

```bash
git add app/login/page.tsx app/reset-password/page.tsx
git commit -m "feat(ui-revamp): auth pages — use bruddle Input, Alert, Divider, Loader"
```

---

## Task 2: Header Component

**Files:**

- Modify: `components/Header.tsx`

**What to fix:**

- Lines 30-33: topbar menu button → use `bru-btn--ghost bru-btn--icon` class
- Lines 36-38: notification button → use `bru-btn--ghost bru-btn--icon` class
- Lines 40-45: logout button → use `bru-btn--ghost bru-btn--icon` class
- Lines 47-51: Create Post button → use `<Button variant="primary" size="sm">`

**Step 1:** Update Header buttons

```tsx
import { Button } from "@bruddle/react";

// Menu toggle — keep as raw button since it needs custom handler:
<button className="bru-btn bru-btn--ghost bru-btn--icon topbar-menu-btn" onClick={onToggleSidebar}>
  <Menu size={20} />
</button>

// Notification bell:
<button className="bru-btn bru-btn--ghost bru-btn--icon" style={{ position: "relative" }}>
  <Bell size={20} />
  <span className="notification-dot" />
</button>

// Logout:
<button onClick={() => void logout()} className="bru-btn bru-btn--ghost bru-btn--icon" title="Sign out">
  <LogOut size={20} />
</button>

// Create Post button:
<Link href="/create">
  <Button variant="primary" size="sm">
    <Plus size={16} /> Create Post
  </Button>
</Link>
```

**Step 2:** Commit

```bash
git add components/Header.tsx
git commit -m "feat(ui-revamp): header — use bruddle Button for topbar actions"
```

---

## Task 3: Dashboard Page

**Files:**

- Modify: `app/(protected)/dashboard/page.tsx`

**What to fix:**

- Lines 109-169: `Card variant="raised"` already used — good. Fix internals.
- Line 113-120: inline `borderRadius: "var(--bru-radius-md)"` — radius is always 0, just remove the radius prop
- Line 123: `className="text-lg font-bold"` → inline style with bru tokens
- Lines 128-130: `text-sm text-gray-600 font-bold` → `style={{ color: 'var(--bru-grey)', fontSize: 'var(--bru-text-sm)', fontWeight: 700 }}`
- Lines 131-132: `text-sm font-bold text-green-600` → `style={{ color: 'var(--bru-success)', ... }}`
- Lines 186-208: quick action Links — use `<Button variant="ghost" size="sm">` or `bru-btn--ghost`
- Lines 224-248: upcoming posts empty state `<p>` → `<EmptyState title="No upcoming posts" description="Schedule a post to see it here.">`
- Lines 268-288: recent posts empty state `<p>` → `<EmptyState>`
- Lines 301-317: trending topics — inner `Card variant="flat"` ok, but `text-green-500` → `style={{ color: 'var(--bru-success)' }}`
- Line 69-78: loading state — `<Loader>` from @bruddle/react instead of `<p>Loading...`

**Step 1:** Fix loading state

```tsx
import { Card, ProgressBar, Loader, EmptyState } from "@bruddle/react";

if (loading) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
      }}
    >
      <Loader label="Loading dashboard..." />
    </div>
  );
}
```

**Step 2:** Fix Tailwind color classes with bru tokens throughout
Replace every `text-gray-600` → `style={{ color: 'var(--bru-grey)' }}`
Replace every `text-green-600`/`text-green-500` → `style={{ color: 'var(--bru-success)' }}`

**Step 3:** Replace empty states

```tsx
// Upcoming posts empty:
<EmptyState
  icon="📅"
  title="No upcoming posts"
  description="Create and schedule a post to see it here."
  action={<Link href="/create"><Button variant="primary" size="sm">Create Post</Button></Link>}
/>

// Recent posts empty:
<EmptyState icon="📝" title="No recent posts" description="Posts you've published will appear here." />

// Trending topics empty:
<EmptyState icon="📊" title="No trending topics" description="Analytics data will appear here." />
```

**Step 4:** Fix quick actions — replace plain Link with Button

```tsx
import { Button } from "@bruddle/react";
<Link href="/create">
  <Button variant="ghost" size="sm">
    <ArrowUpRight size={16} /> Generate New Post
  </Button>
</Link>;
```

**Step 5:** Commit

```bash
git add app/(protected)/dashboard/page.tsx
git commit -m "feat(ui-revamp): dashboard — bruddle EmptyState, Loader, fix color tokens"
```

---

## Task 4: Library Page

**Files:**

- Modify: `app/(protected)/library/page.tsx`

**What to fix (scan full file):**

- Status filter row (buttons) → `<Tabs>` component
- Inline styled source/format spans → `<Tag>` component
- Pagination (if any) → `<Pagination>` component
- Empty state → `<EmptyState>`
- Any raw `<button>` → `<Button>` or `bru-btn` class
- `text-gray-*` color classes → `--bru-*` tokens
- Source style inline `{ bg: "#631DED1A", color: "#631DED" }` → `<Tag color="purple" filled>`
- Source style `{ bg: "#00A8961A", color: "#00A896" }` → `<Tag color="mint" filled>`
- Source style `{ bg: "#FF6C011A", color: "#FF6C01" }` → `<Tag color="yellow" filled>` (closest to orange)

**Step 1:** Read full library page

```bash
# Read app/(protected)/library/page.tsx fully before editing
```

**Step 2:** Replace STATUS_FILTERS button row with Tabs

```tsx
import { Tabs, Tag, EmptyState, Pagination, Button } from "@bruddle/react";

const tabItems = STATUS_FILTERS.map((f) => ({ id: f.id, label: f.label }));

<Tabs
  items={tabItems}
  activeTab={activeFilter}
  onChange={(id) => setActiveFilter(id as FilterId)}
/>;
```

**Step 3:** Replace source/format inline styled spans with Tag

```tsx
// Source badge:
const SOURCE_TAG_COLOR: Record<string, "purple" | "mint" | "yellow"> = {
  Studio: "purple",
  Factory: "mint",
  Create: "yellow",
};
<Tag color={SOURCE_TAG_COLOR[source]} filled>
  {source}
</Tag>;

// Format badge:
const FORMAT_TAG_COLOR: Record<string, "purple" | "yellow" | "grey"> = {
  carousel: "purple",
  visual: "yellow",
  simple: "grey",
};
<Tag color={FORMAT_TAG_COLOR[format] ?? "grey"} filled>
  {format}
</Tag>;
```

**Step 4:** Replace empty state

```tsx
<EmptyState
  icon="📚"
  title="No posts found"
  description="Try a different filter or create your first post."
  action={
    <Link href="/create">
      <Button variant="primary" size="sm">
        Create Post
      </Button>
    </Link>
  }
/>
```

**Step 5:** Add Pagination if page count > 1

```tsx
{
  totalPages > 1 && (
    <Pagination
      page={currentPage}
      totalPages={totalPages}
      onChange={setCurrentPage}
    />
  );
}
```

**Step 6:** Commit

```bash
git add app/(protected)/library/page.tsx
git commit -m "feat(ui-revamp): library — bruddle Tabs, Tag, EmptyState, Pagination"
```

---

## Task 5: Settings Page

**Files:**

- Modify: `app/(protected)/settings/page.tsx`

**What to fix:**

- `ValidationBadge` inline styled spans → `<Badge>` from @bruddle/react
- Raw `<input type="password">` fields → `<Input>` with label + error state
- Raw `<select>` → `<Select>` from @bruddle/react
- Raw `<button>` → `<Button>` or `bru-btn` class
- Accordion section headers → use `bru-card--raised` style + `bru-btn--ghost` for toggle
- `text-gray-*`, inline color styles with non-bru colors → bru tokens
- Inline validation badge styles → `<Badge variant="mint">` (valid), `<Badge variant="primary">` (verifying), `<Badge variant="pink">` (error)

**Step 1:** Read full settings page first (it's 1146 lines)

**Step 2:** Replace ValidationBadge with Badge component

```tsx
import { Badge, Loader as BruLoader } from "@bruddle/react";

function ValidationBadge({ status }: { status: ValidationState }) {
  if (status.state === "idle") return null;
  if (status.state === "validating")
    return (
      <Badge variant="outline">
        <BruLoader size="sm" /> Verifying
      </Badge>
    );
  if (status.state === "valid") return <Badge variant="mint">Valid</Badge>;
  return <Badge variant="pink">{status.message}</Badge>;
}
```

**Step 3:** Replace raw inputs with Input component (scan for all `<input` tags)

```tsx
import { Input, Select, Button } from "@bruddle/react";

// API key input:
<Input
  label="API Key"
  type={showKey ? "text" : "password"}
  value={keyValue}
  onChange={(e) => setKeyValue(e.target.value)}
  placeholder="sk-..."
/>;
```

**Step 4:** Replace all action buttons with Button component or bru-btn classes

**Step 5:** Commit

```bash
git add app/(protected)/settings/page.tsx
git commit -m "feat(ui-revamp): settings — bruddle Badge, Input, Button, Select"
```

---

## Task 6: Create Page

**Files:**

- Modify: `app/(protected)/create/page.tsx`
- Modify: `components/factory/CreatePostDialog.tsx` (if it has raw UI)

**What to fix (full read first):**

- All raw inputs/selects/textareas → bruddle components
- Raw buttons → Button component
- Error states → Alert
- Loading states → Loader
- Color utility classes → bru tokens

**Step 1:** Read `app/(protected)/create/page.tsx` (876 lines)

**Step 2:** Replace raw form elements section by section

**Step 3:** Fix any empty/loading states

**Step 4:** Commit

```bash
git add app/(protected)/create/page.tsx
git commit -m "feat(ui-revamp): create page — bruddle form components"
```

---

## Task 7: Factory Page

**Files:**

- Modify: `app/(protected)/factory/page.tsx`
- Modify: `components/factory/PostTypeSelector.tsx`
- Modify: `components/factory/ToneSelector.tsx`

**What to fix (full read first, 1213 lines):**

- Selector components — replace raw styled cards/buttons with `bru-card--interactive` + `Tag`
- Loading/streaming states → Loader + ProgressBar from bruddle
- Color utility classes → bru tokens
- Any raw buttons → Button component

**Step 1:** Read factory page and selector components

**Step 2:** Replace selector cards with `bru-card--interactive` + proper Token usage

**Step 3:** Fix buttons and states

**Step 4:** Commit

```bash
git add app/(protected)/factory/page.tsx components/factory/
git commit -m "feat(ui-revamp): factory — bruddle interactive cards, selectors"
```

---

## Task 8: Knowledge Page

**Files:**

- Modify: `app/(protected)/knowledge/page.tsx`
- Modify: `components/knowledge/DocumentEditor.tsx`

**What to fix:**

- Raw inputs/textareas → bruddle components
- Buttons → Button component
- Empty states → EmptyState
- Status badges → Tag/Badge

**Step 1:** Read knowledge page (420 lines)

**Step 2:** Apply replacements

**Step 3:** Commit

```bash
git add app/(protected)/knowledge/page.tsx components/knowledge/
git commit -m "feat(ui-revamp): knowledge — bruddle components"
```

---

## Task 9: Campaigns, Analytics, Calendar, Learning Pages

**Files:**

- Modify: `app/(protected)/campaigns/page.tsx`
- Modify: `app/(protected)/analytics/page.tsx`
- Modify: `app/(protected)/calendar/page.tsx`
- Modify: `app/(protected)/learning/page.tsx`

**Step 1:** Read each page

**Step 2:** Apply same replacement pattern:

- Buttons → Button from bruddle
- Inputs/selects → Input/Select from bruddle
- Empty states → EmptyState
- Status badges → Tag/Badge
- Color utilities → bru tokens
- Loading → Loader from bruddle

**Step 3:** Commit per page

```bash
git add app/(protected)/campaigns/page.tsx && git commit -m "feat(ui-revamp): campaigns — bruddle components"
git add app/(protected)/analytics/page.tsx && git commit -m "feat(ui-revamp): analytics — bruddle components"
git add app/(protected)/calendar/page.tsx && git commit -m "feat(ui-revamp): calendar — bruddle components"
git add app/(protected)/learning/page.tsx && git commit -m "feat(ui-revamp): learning — bruddle components"
```

---

## Task 10: Final Pass — Typography & Token Consistency

**Files:** All modified files

**Step 1:** Grep for any remaining Tailwind color utilities

```bash
grep -r "text-gray-\|text-green-\|text-red-\|text-blue-\|bg-gray-\|bg-green-" app/components/ --include="*.tsx"
```

**Step 2:** Replace each remaining instance with inline `style={{ color: 'var(--bru-*)' }}`

**Step 3:** Verify no `borderRadius` values other than 0 exist (bruddle is strictly 0)

```bash
grep -r "borderRadius\|border-radius" app/ components/ --include="*.tsx" | grep -v "var(--bru-radius"
```

**Step 4:** Final commit

```bash
git add -A
git commit -m "feat(ui-revamp): typography and token consistency final pass"
```

---

## Task 11: Push Branch

```bash
git push -u origin doctorpost-ui-revamp
```

---

## Execution Notes

- **Each agent** should read the full target file before editing
- **Import pattern**: Always import from `@bruddle/react`, never create local copies
- **No new CSS**: Only use existing `bru-*` classes or inline `style={{ ... }}` with `var(--bru-*)` tokens
- **Border radius**: Always 0 — never add `borderRadius` other than 0 or `var(--bru-radius-*)` (which are also 0)
- **Shadows**: Always offset black — use `var(--bru-shadow-sm/md/lg)` never `box-shadow: 0 2px 8px rgba(...)`
- **Fonts**: Never set `fontFamily` inline — it's already set globally
- **Colors**: Never use hex colors directly except `#FFFFFF` and `#000000` — always use `var(--bru-*)`
