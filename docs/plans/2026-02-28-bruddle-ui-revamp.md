# Bruddle UI/UX Revamp — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current neo-brutalism ad-hoc CSS with the Bruddle Design System — a framework-agnostic brutalist design system with offset shadows, 2px borders, #AE7AFF primary purple, cream backgrounds, dark sidebar, and 4px grid spacing.

**Architecture:** Copy Bruddle CSS + fonts into the project's `public/` directory. Replace Tailwind `@layer components` neo-* classes with Bruddle `bru-*` CSS classes. Update all React components to use Bruddle class names. Update Tailwind config to match Bruddle tokens. Keep Tailwind for layout utilities only, not for design system primitives.

**Tech Stack:** Next.js 16, React 18, Tailwind CSS 3, Bruddle Design System (CSS), Lucide React icons, TypeScript

---

## Pre-Flight: Current State Summary

### What Exists Now
- **Design system**: Ad-hoc "neo-brutalism" via Tailwind `@layer components` in `globals.css` — uses `#631DED` purple, `#282828` black, `#FF6C01` orange, `3px` borders, `4px` radius
- **Sidebar**: Light bg (`neo-sidebar`), collapsible via `w-64`/`w-0`, fixed position
- **Header**: Simple topbar with toggle + avatar
- **Cards/Buttons/Inputs**: All use `neo-card`, `neo-button`, `neo-input` classes

### What Bruddle Brings
- **Color palette**: `#AE7AFF` purple, `#FAF4F0` cream bg, `#FAE8A4` yellow, `#E99898` pink, `#98E9AB` mint
- **Shadows**: Solid offset black (`4px 4px 0 0 #000`), no blur
- **Borders**: `2px solid #000` (not 3px), `6px` radius (not 4px)
- **Sidebar**: Dark bg (`#1A1A1A`), fixed, 280px wide, collapsible to 68px
- **Typography**: Visby + Roboto Flex fonts, 48px–11px scale
- **Dark mode**: Full CSS variable overrides via `body.dark-mode`
- **Layout shell**: `.app-layout` > `.sidebar` + `.main-content` > `.topbar` + `.content` + `.footer-bar`
- **Mobile**: Bottom tab bar at 390px, collapsed sidebar at 768px, bottom sheet nav

### Key Mapping: Old → New

| Old Class | New Bruddle Class |
|-----------|-------------------|
| `neo-card` | `bru-card bru-card--raised` |
| `neo-button` | `bru-btn bru-btn--primary` |
| `neo-button secondary` | `bru-btn` (base = white bg) |
| `neo-input` | `bru-input` |
| `neo-label` | `bru-field__label` |
| `neo-sidebar` | `sidebar` |
| `neo-sidebar-link` | `sidebar-nav-item` |
| `neo-sidebar-link active` | `sidebar-nav-item active` |
| `neo-pill` | `bru-tag` |
| `neo-pill published` | `bru-tag bru-tag--filled bru-tag--mint` |
| `neo-pill scheduled` | `bru-tag bru-tag--filled bru-tag--purple` |
| `neo-pill draft` | `bru-tag bru-tag--filled bru-tag--yellow` |
| `neo-grid-bg` | (remove, use `bru-cream` bg) |
| `bg-purple-electric` | `var(--bru-purple)` / Tailwind `bru-purple` |
| `text-purple-electric` | `var(--bru-purple)` / Tailwind `text-bru-purple` |
| `bg-ivory-white` | `var(--bru-cream)` |
| `border-neo border-neo-border` | `border-2 border-black` or Bruddle's `var(--bru-border)` |

---

## Task 1: Copy Bruddle Assets into Project

**Files:**
- Create: `public/fonts/VisbyRegular.otf`
- Create: `public/fonts/VisbyMedium.otf`
- Create: `public/fonts/VisbySemibold.otf`
- Create: `public/fonts/VisbyBold.otf`
- Create: `public/fonts/RobotoFlex-VariableFont.ttf`
- Create: `public/css/bruddle/tokens.css`
- Create: `public/css/bruddle/typography.css`
- Create: `public/css/bruddle/buttons.css`
- Create: `public/css/bruddle/forms.css`
- Create: `public/css/bruddle/cards.css`
- Create: `public/css/bruddle/tags.css`
- Create: `public/css/bruddle/modals.css`
- Create: `public/css/bruddle/layout.css`
- Create: `public/css/bruddle/utilities.css`
- Create: `public/css/bruddle/tables.css`
- Create: `public/css/bruddle/pagination.css`
- Create: `public/css/bruddle/charts.css`
- Create: `public/css/bruddle/responsive.css`

**Step 1: Copy fonts**
```bash
mkdir -p public/fonts
cp /tmp/bruddle-design-system/fonts/* public/fonts/
```

**Step 2: Copy CSS files (adjusting font paths)**
```bash
mkdir -p public/css/bruddle
cp /tmp/bruddle-design-system/css/*.css public/css/bruddle/
```

**Step 3: Fix font paths in `typography.css`**

Change `../fonts/` → `/fonts/` in all `@font-face` `src` declarations since files are served from `public/`.

**Step 4: Commit**
```bash
git add public/fonts/ public/css/bruddle/
git commit -m "chore: add Bruddle design system CSS + fonts"
```

---

## Task 2: Update Tailwind Config for Bruddle Tokens

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Replace Tailwind color/spacing/shadow tokens**

Replace the current neo-brutalism tokens with Bruddle-aligned ones:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Bruddle Design System
        "bru-purple": "#AE7AFF",
        "bru-purple-hover": "#9B5FF5",
        "bru-black": "#000000",
        "bru-cream": "#FAF4F0",
        "bru-surface": "#FEFCFA",
        "bru-yellow": "#FAE8A4",
        "bru-pink": "#E99898",
        "bru-mint": "#98E9AB",
        "bru-grey": "#5F646D",
        // Semantic
        "bru-success": "#98E9AB",
        "bru-error": "#E99898",
        "bru-warning": "#FAE8A4",
        "bru-info": "#AE7AFF",
      },
      fontFamily: {
        visby: ["Visby", "Roboto Flex", "sans-serif"],
      },
      borderWidth: {
        bru: "2px",
      },
      boxShadow: {
        "bru-sm": "3px 3px 0 0 rgba(0,0,0,1)",
        "bru-md": "4px 4px 0 0 rgba(0,0,0,1)",
        "bru-lg": "6px 6px 0 0 rgba(0,0,0,1)",
      },
      borderRadius: {
        "bru-sm": "4px",
        "bru-md": "6px",
        "bru-lg": "8px",
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Commit**
```bash
git add tailwind.config.ts
git commit -m "refactor: update Tailwind config to Bruddle design tokens"
```

---

## Task 3: Replace `globals.css` with Bruddle Imports

**Files:**
- Modify: `app/globals.css`

**Step 1: Rewrite globals.css**

Replace the entire file. Import Bruddle CSS, keep Tailwind directives, remove all `neo-*` component classes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Bruddle Design System */
@import url('/css/bruddle/tokens.css');
@import url('/css/bruddle/typography.css');
@import url('/css/bruddle/buttons.css');
@import url('/css/bruddle/forms.css');
@import url('/css/bruddle/tags.css');
@import url('/css/bruddle/cards.css');
@import url('/css/bruddle/tables.css');
@import url('/css/bruddle/modals.css');
@import url('/css/bruddle/pagination.css');
@import url('/css/bruddle/charts.css');
@import url('/css/bruddle/layout.css');
@import url('/css/bruddle/utilities.css');
@import url('/css/bruddle/responsive.css');

/* App-specific overrides */
@layer components {
  /* Enhanced Dropdown (keep — Bruddle doesn't have this) */
  .enhanced-dropdown-container {
    @apply relative;
  }
  .enhanced-dropdown-trigger {
    @apply flex items-center justify-between cursor-pointer;
  }
  .enhanced-dropdown-content {
    @apply absolute z-30 mt-1 w-full max-h-[300px] overflow-y-auto;
    background: var(--bru-surface);
    border: var(--bru-border);
    box-shadow: var(--bru-shadow-md);
  }
  .enhanced-dropdown-option {
    @apply flex items-center justify-between h-[44px] px-3 py-2 text-sm cursor-pointer transition-colors duration-200 relative;
    color: var(--bru-black);
  }
  .enhanced-dropdown-option:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .enhanced-dropdown-option.selected {
    background: rgba(174, 122, 255, 0.12);
    color: var(--bru-purple);
    font-weight: 700;
  }
  .enhanced-dropdown-search {
    @apply p-2 border-b;
    border-color: rgba(0, 0, 0, 0.1);
  }
  .enhanced-dropdown-filters {
    @apply flex flex-wrap gap-2 p-2 border-b;
    border-color: rgba(0, 0, 0, 0.1);
  }
  .enhanced-dropdown-filter-tag {
    @apply px-2 py-1 text-xs font-bold cursor-pointer;
    border: 1px solid var(--bru-black);
    border-radius: var(--bru-radius-sm);
  }
  .enhanced-dropdown-filter-tag.active {
    background: var(--bru-purple);
    color: white;
    border-color: var(--bru-purple);
  }
  .enhanced-dropdown-category-header {
    @apply text-xs font-bold uppercase tracking-wider py-2 px-3;
    color: var(--bru-grey);
    background: var(--bru-cream);
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }

  /* Smart Choice Badge */
  .smart-choice-badge {
    @apply inline-flex items-center gap-1 py-1 px-2 font-bold text-xs;
    border: 2px solid var(--bru-yellow);
    background: rgba(250, 232, 164, 0.3);
    color: #92400E;
    border-radius: var(--bru-radius-sm);
  }

  /* Post status pills */
  .status-published {
    background: var(--bru-mint);
    color: var(--bru-success-dark, #166534);
  }
  .status-scheduled {
    background: var(--bru-purple);
    color: #FFFFFF;
  }
  .status-draft {
    background: var(--bru-yellow);
    color: var(--bru-warning-dark, #92400E);
  }
}
```

**Step 2: Commit**
```bash
git add app/globals.css
git commit -m "refactor: replace neo-brutalism CSS with Bruddle design system imports"
```

---

## Task 4: Update Root Layout — Import Fonts + Dark Mode

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update RootLayout to include Bruddle body class and font**

```tsx
import "./globals.css";

export const metadata = {
  title: "DoctorPost",
  description: "AI-powered LinkedIn post generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--bru-font-primary)" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

Keep existing AuthProvider import.

**Step 2: Commit**
```bash
git add app/layout.tsx
git commit -m "refactor: update root layout for Bruddle font family"
```

---

## Task 5: Revamp Protected Layout — Bruddle App Shell

**Files:**
- Modify: `app/(protected)/layout.tsx`

**Step 1: Replace layout with Bruddle `.app-layout` shell**

Replace the current flex layout with Bruddle's sidebar + main-content pattern:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loadingAuth } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !isLoggedIn) {
      router.push("/login");
    }
  }, [loadingAuth, isLoggedIn, router]);

  if (loadingAuth || !isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bru-cream)" }}>
        <Loader size={32} className="animate-spin" style={{ color: "var(--bru-purple)" }} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="main-content">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="content">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/(protected)/layout.tsx
git commit -m "refactor: update protected layout to Bruddle app shell"
```

---

## Task 6: Revamp Sidebar Component

**Files:**
- Modify: `components/Sidebar.tsx`

**Step 1: Rewrite Sidebar with Bruddle classes**

Replace the entire component with the Bruddle sidebar pattern — dark bg, nav sections, user profile at bottom, collapse toggle:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Book,
  BarChart2,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Create", path: "/create", icon: PenSquare },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Library", path: "/library", icon: Book },
    { name: "Analytics", path: "/analytics", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">DoctorPost</span>
        <span className="sidebar-brand-dot" />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-label">Main</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={20} />
                </span>
                <span className="sidebar-nav-text">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={onToggle}>
        <ChevronLeft size={14} />
      </button>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.image ? (
            <img src={user.image} alt={user?.name ?? "User"} />
          ) : (
            initials
          )}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name ?? "User"}</div>
          <div className="sidebar-user-role">Free Plan</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
```

**Step 2: Commit**
```bash
git add components/Sidebar.tsx
git commit -m "refactor: revamp Sidebar with Bruddle dark sidebar pattern"
```

---

## Task 7: Revamp Header Component

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Rewrite Header with Bruddle topbar classes**

```tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Plus } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();

  const pageTitle = () => {
    const map: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/create": "Create Post",
      "/calendar": "Calendar",
      "/library": "Library",
      "/analytics": "Analytics",
      "/settings": "Settings",
    };
    return map[pathname] || "DoctorPost";
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{pageTitle()}</h1>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
        <Link href="/create">
          <button className="topbar-create-btn">
            <Plus size={18} />
            <span>Create Post</span>
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
```

**Step 2: Commit**
```bash
git add components/Header.tsx
git commit -m "refactor: revamp Header with Bruddle topbar pattern"
```

---

## Task 8: Revamp Login Page

**Files:**
- Modify: `app/login/page.tsx`

**Step 1: Replace neo-* classes with Bruddle classes**

Key changes:
- `bg-neo-grid-bg` → plain cream bg via `style={{ background: "var(--bru-cream)" }}`
- `neo-card` → `bru-card bru-card--raised`
- `neo-button` → `bru-btn bru-btn--primary bru-btn--block`
- `neo-button secondary` → `bru-btn bru-btn--block`
- `neo-input` → `bru-input`
- `text-purple-electric` → `style={{ color: "var(--bru-purple)" }}`
- `bg-purple-electric` → `style={{ background: "var(--bru-purple)" }}`
- Error div: use `bru-toast bru-toast--error` style

Replace all Tailwind neo-* references. Keep the form logic intact. Only change class names.

**Step 2: Commit**
```bash
git add app/login/page.tsx
git commit -m "refactor: revamp Login page with Bruddle design system"
```

---

## Task 9: Revamp Dashboard Page

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

**Step 1: Replace all neo-* with Bruddle classes**

Key changes:
- `neo-card` → `bru-card bru-card--raised`
- `neo-grid-bg` → remove (layout handles background)
- `text-neo-foreground` → plain `color: var(--bru-black)` or just remove (body default)
- `bg-purple-electric` icon badges → `style={{ background: "var(--bru-purple)" }}`
- `bg-blazing-orange` icon badges → `style={{ background: "var(--bru-yellow)" }}`
- Progress bars → use `bru-progress` + `bru-progress__bar`
- Quick action links → use `bru-text--bold` + purple color
- Tags/pills → `bru-tag bru-tag--filled bru-tag--mint` etc.
- Stat sections: use `bru-card` with color accent `.bru-card--purple`

**Step 2: Commit**
```bash
git add app/(protected)/dashboard/page.tsx
git commit -m "refactor: revamp Dashboard page with Bruddle components"
```

---

## Task 10: Revamp Create Page

**Files:**
- Modify: `app/(protected)/create/page.tsx`

**Step 1: Update all form elements**

Key changes:
- All `neo-input` → `bru-input`
- All `neo-label` → `bru-field__label`
- All `neo-button` → `bru-btn bru-btn--primary`
- All `neo-card` → `bru-card bru-card--raised`
- Form groups → `bru-field` wrapper
- Form rows → `bru-form-row` or `bru-grid-2`
- `select.neo-input` → `bru-select`
- Tone slider: keep custom but update border/shadow to Bruddle tokens
- Smart choice badges: already handled in globals.css overrides
- Subtopic items: update border/hover colors to Bruddle tokens

**Step 2: Commit**
```bash
git add app/(protected)/create/page.tsx
git commit -m "refactor: revamp Create page with Bruddle form components"
```

---

## Task 11: Revamp Library Page

**Files:**
- Modify: `app/(protected)/library/page.tsx`

**Step 1: Update classes**

Key changes:
- Cards → `bru-card bru-card--raised`
- Buttons → `bru-btn` variants
- Status pills → `bru-tag bru-tag--filled` + color variants
- Search input → `bru-input`
- Filter buttons → `bru-tabs` / `bru-tab` pattern
- Empty state → `bru-empty` with `bru-empty__icon`, `bru-empty__title`, `bru-empty__text`

**Step 2: Commit**
```bash
git add app/(protected)/library/page.tsx
git commit -m "refactor: revamp Library page with Bruddle components"
```

---

## Task 12: Revamp Calendar Page

**Files:**
- Modify: `app/(protected)/calendar/page.tsx`

**Step 1: Update classes**

Key changes:
- Cards → `bru-card bru-card--raised`
- Status filter buttons → `bru-tabs` + `bru-tab`
- Date picker → `bru-input` styling
- Post cards → `bru-card bru-card--interactive`
- Status dots → `bru-dot bru-dot--mint` / `bru-dot--purple` etc.
- Modals → `bru-overlay` + `bru-modal` pattern

**Step 2: Commit**
```bash
git add app/(protected)/calendar/page.tsx
git commit -m "refactor: revamp Calendar page with Bruddle components"
```

---

## Task 13: Revamp Analytics Page

**Files:**
- Modify: `app/(protected)/analytics/page.tsx`

**Step 1: Update classes**

Key changes:
- Stat cards → `bru-card bru-card--raised` with color accents
- Charts → use `bru-progress` for simple bars, keep chart logic
- Section headers → `bru-h4` or `bru-h5`
- Grid → `bru-grid-3` or `bru-grid-4`

**Step 2: Commit**
```bash
git add app/(protected)/analytics/page.tsx
git commit -m "refactor: revamp Analytics page with Bruddle components"
```

---

## Task 14: Revamp Settings Page

**Files:**
- Modify: `app/(protected)/settings/page.tsx`

**Step 1: Update classes**

Key changes:
- Form inputs → `bru-input` inside `bru-field` wrappers
- Labels → `bru-field__label`
- Save buttons → `bru-btn bru-btn--primary`
- Sections → `bru-card bru-card--raised` with section headers
- Form rows → `bru-form-row`
- Tabs (if used) → `bru-tabs--underline` + `bru-tab`
- Success/error messages → `bru-toast--success` / `bru-toast--error`

**Step 2: Commit**
```bash
git add app/(protected)/settings/page.tsx
git commit -m "refactor: revamp Settings page with Bruddle components"
```

---

## Task 15: Revamp Modal Components

**Files:**
- Modify: `components/PostEditorModal.tsx`
- Modify: `components/SchedulePostModal.tsx`

**Step 1: Update PostEditorModal**

Replace custom modal markup with Bruddle:
- Overlay → `bru-overlay`
- Modal → `bru-modal`
- Header → `bru-modal__header` (purple bg, white text)
- Body → `bru-modal__body`
- Footer → `bru-modal__footer`
- Close button → `bru-modal__close`
- Form inputs inside → `bru-input`, `bru-select`
- Action buttons → `bru-btn bru-btn--primary`, `bru-btn`

**Step 2: Update SchedulePostModal (same pattern)**

**Step 3: Commit**
```bash
git add components/PostEditorModal.tsx components/SchedulePostModal.tsx
git commit -m "refactor: revamp modal components with Bruddle modal pattern"
```

---

## Task 16: Revamp EnhancedDropdown Component

**Files:**
- Modify: `components/EnhancedDropdown.tsx`

**Step 1: Update dropdown styling**

The trigger input: `bru-input` (replaces `neo-input`).
The dropdown content: already handled in globals.css overrides.
Category headers, options, filter tags: already mapped in globals.css.

Just update the trigger className from `neo-input` / `enhanced-dropdown-trigger` to use `bru-input enhanced-dropdown-trigger`.

**Step 2: Commit**
```bash
git add components/EnhancedDropdown.tsx
git commit -m "refactor: update EnhancedDropdown trigger to Bruddle input"
```

---

## Task 17: Revamp PostGenerator Component

**Files:**
- Modify: `components/PostGenerator.tsx`

**Step 1: Update PostGenerator styling**

- Card wrapping → `bru-card bru-card--raised`
- Buttons → `bru-btn bru-btn--primary` / `bru-btn`
- Text areas → `bru-input` (textarea variant)
- Copy/download buttons → `bru-btn bru-btn--ghost bru-btn--sm`

**Step 2: Commit**
```bash
git add components/PostGenerator.tsx
git commit -m "refactor: update PostGenerator with Bruddle components"
```

---

## Task 18: Revamp CalendarView Component

**Files:**
- Modify: `components/calendar/CalendarView.tsx`

**Step 1: Update calendar grid styling**

- Calendar container → `bru-card`
- Day cells → border using `var(--bru-border-thin)`
- Today highlight → `background: var(--bru-purple-20)`
- Event dots → `bru-dot` variants
- Navigation buttons → `bru-btn bru-btn--ghost bru-btn--icon`

**Step 2: Commit**
```bash
git add components/calendar/CalendarView.tsx
git commit -m "refactor: update CalendarView with Bruddle styling"
```

---

## Task 19: Clean Up — Remove Dead CSS & Old Tokens

**Files:**
- Modify: `app/globals.css` (final pass)
- Modify: `tailwind.config.ts` (remove old neo tokens)

**Step 1: Remove any remaining neo-* references from globals.css**

Search for any leftover `neo-` class definitions and remove them.

**Step 2: Remove old color tokens from tailwind.config.ts**

Remove: `charcoal-black`, `purple-electric`, `blazing-orange`, `ivory-white`, `neo-foreground`, `neo-border`, and all oklch/hsl references that aren't used.

**Step 3: Clean up any `border-neo`, `rounded-neo`, `border-neo-border` references across all files**

```bash
grep -r "neo-" --include="*.tsx" --include="*.ts" --include="*.css" app/ components/ lib/
```

Fix any remaining references.

**Step 4: Commit**
```bash
git add -A
git commit -m "chore: remove all legacy neo-brutalism CSS and tokens"
```

---

## Task 20: Verify Build & Visual Check

**Step 1: Run build**
```bash
npm run build
```
Fix any TypeScript or build errors.

**Step 2: Run dev server**
```bash
npm run dev
```

**Step 3: Visual checklist**
- [ ] Login page: cream bg, Bruddle card with offset shadow, purple primary button
- [ ] Sidebar: dark (#1A1A1A) background, purple active state, collapsible
- [ ] Topbar: cream bg, black border-bottom, purple "Create Post" button with offset shadow
- [ ] Dashboard: cards with 2px black borders and offset shadows, purple progress bars
- [ ] Create page: form inputs with Bruddle styling, purple focus rings
- [ ] Library: tags with color variants, search input styled
- [ ] Calendar: clean grid, Bruddle modals
- [ ] Analytics: stat cards with color accents
- [ ] Settings: form fields with labels, proper spacing
- [ ] Mobile (390px): bottom tab bar visible, sidebar hidden
- [ ] Tablet (768px): sidebar collapsed to 68px

**Step 4: Final commit**
```bash
git add -A
git commit -m "fix: resolve build errors and visual polish after Bruddle migration"
```

---

## Execution Notes

- **Font loading**: Visby fonts are `.otf` served from `public/fonts/`. Next.js serves these automatically. No special `next/font` config needed since Bruddle handles `@font-face` in its own CSS.
- **Dark mode**: Bruddle uses `body.dark-mode` class (not Tailwind's `dark:` prefix). A dark mode toggle can be added later — all CSS variables are already set up.
- **No JS dependency**: Bruddle is pure CSS. No npm packages to install for the design system itself.
- **Tailwind coexistence**: Tailwind utilities (flex, grid, spacing, etc.) still work alongside Bruddle classes. Use Bruddle for component-level styling, Tailwind for layout/spacing utilities.
