# DoctorPost v12: Migrate to Next.js + NoCodeBackend

## Context

DoctorPost is a LinkedIn post generator SaaS app. The stabilization plan (Phases 0-4) has been completed: dead files removed, dependencies fixed, build passing. However, the backend was built on Express + Prisma + PostgreSQL + Redis which the user does NOT want. They want to use **NoCodeBackend (NCB)** for auth and data CRUD, and migrate the frontend from React + Vite to **Next.js App Router**.

NCB uses session cookies (not JWT), has auth/data proxy patterns, and handles user auth + RLS automatically. The AI services (OpenAI, Perplexity) remain as custom Next.js API routes since NCB doesn't handle AI calls.

---

## Phase 0: Create NCB Database + Fetch Integration Code

### 0.1 Create NCB database via MCP tool

Call `create_database` with name `doctorpost` and two tables matching the Prisma schema:

**Table: `profiles`** (brand profile data, separate from NCB's built-in `user` table)
| Column | Type | NotNull | Default |
|--------|------|---------|---------|
| first_name | VARCHAR | no | |
| last_name | VARCHAR | no | |
| company_name | VARCHAR | no | |
| role | VARCHAR | no | |
| industry | VARCHAR | no | |
| audience | TEXT | no | `[]` |
| tones | TEXT | no | `[]` |
| offers | TEXT | no | `[]` |
| taboos | TEXT | no | `[]` |
| style_guide_emoji | BOOLEAN | no | `true` |
| style_guide_hashtags | INT | no | `3` |
| style_guide_links | VARCHAR | no | `end` |
| copy_guideline | TEXT | no | |
| content_strategy | TEXT | no | |
| definition | TEXT | no | |
| openai_key | VARCHAR | no | |

**Table: `posts`**
| Column | Type | NotNull | Default |
|--------|------|---------|---------|
| title | VARCHAR | yes | |
| content | TEXT | yes | |
| scheduled_at | DATETIME | no | |
| pillar | VARCHAR | no | |
| status | VARCHAR | no | `draft` |

Note: NCB auto-adds `id`, `user_id`, `created_at`, `updated_at` to every table.

### 0.2 Fetch integration prompts
Call `get_integration_prompts` for `doctorpost` database. Save output to:
- `docs/auth_proxy_setup.md`
- `docs/data_proxy_setup.md`

### 0.3 No RLS policy changes needed
Both tables use default private RLS (user sees only their own data).

---

## Phase 1: Initialize Next.js App + Core Infrastructure

### 1.1 Create Next.js project in-place

Remove Vite config, add Next.js config. Key changes:
- Delete: `vite.config.ts`, `index.html`
- Create: `next.config.ts`, `tsconfig.json` (Next.js style)
- Update: `package.json` scripts to `next dev`, `next build`, `next start`
- Install: `next@latest`, `react@latest`, `react-dom@latest`
- Remove: `vite`, `@vitejs/plugin-react`, `react-router-dom`, `@react-oauth/google`, `jwt-decode`, `@prisma/client`, `prisma`, `ioredis`, `bcrypt`, `express`, `jsonwebtoken`

### 1.2 Create `.env.local`
```env
NCB_INSTANCE=<from step 0.1>
NCB_AUTH_API_URL=https://app.nocodebackend.com/api/user-auth
NCB_DATA_API_URL=https://app.nocodebackend.com/api/data
NCB_APP_URL=https://app.nocodebackend.com
OPENAI_API_KEY=<existing>
OPENAI_BASE_URL=<existing>
PERPLEXITY_API_KEY=<existing>
PERPLEXITY_BASE_URL=<existing>
```

### 1.3 Create shared NCB utilities
**File: `lib/ncb-utils.ts`**

Contents (from NCB integration guide):
- `CONFIG` object reading env vars
- `extractAuthCookies()` function
- `getSessionUser()` function
- `transformCookiesForLocalhost()` function

### 1.4 Create Auth Proxy
**File: `app/api/auth/[...path]/route.ts`**

Following the NCB guide exactly:
- Proxy all requests to `NCB_AUTH_API_URL`
- Strip `__Secure-` prefix from Set-Cookie headers
- Forward auth cookies on requests to NCB
- Handle sign-out: always return 200, clear cookies

### 1.5 Create Auth Providers endpoint
**File: `app/api/auth-providers/route.ts`**

Fetch enabled providers from NCB to dynamically render login methods.

### 1.6 Create Authenticated Data Proxy
**File: `app/api/data/[...path]/route.ts`**

- Forward session cookies to NCB
- Inject `user_id` from session on CREATE
- Strip `user_id` from client payloads
- Support GET, POST, PUT, DELETE

### 1.7 Verify proxies work
- Test auth: `POST /api/auth/sign-up/email`
- Test data: `GET /api/data/profiles`

---

## Phase 2: Create Next.js App Shell + Layout

### 2.1 Create root layout
**File: `app/layout.tsx`**

- Import global CSS (`src/index.css` moved to `app/globals.css`)
- Set dark mode class, meta tags
- Wrap children in `<AuthProvider>`

### 2.2 Create AuthContext (rewritten for NCB)
**File: `lib/auth-context.tsx`** (client component)

Replace JWT-based auth with NCB session cookies:
- `login` -> no token storage, just call `/api/auth/sign-in/email` or `/api/auth/sign-in/social`, cookies are set automatically
- `logout` -> call `/api/auth/sign-out`, clear state
- `checkSession` -> call `/api/auth/get-session` with `credentials: "include"`
- Expose: `user`, `isLoggedIn`, `loadingAuth`, `login()`, `logout()`
- Remove: `useNavigate` (use `useRouter` from `next/navigation`)

### 2.3 Create authenticated layout with sidebar
**File: `app/(protected)/layout.tsx`**

- Check session, redirect to `/login` if not authenticated
- Render Sidebar + Header + main content area
- Same flex layout as current `App.tsx` protected route

### 2.4 Create login page
**File: `app/login/page.tsx`** (client component)

- Fetch `/api/auth-providers` to determine which login methods to show
- Email + password form (sign in / register toggle)
- Redirect to `/dashboard` on success
- Password reset link -> `/reset-password`
- Remove Google OAuth component (NCB handles OAuth via its own flow if enabled)

### 2.5 Create password reset page
**File: `app/reset-password/page.tsx`**

Read `token` and `db` from query params, submit new password.

---

## Phase 3: Rewrite API Client for NCB

### 3.1 Rewrite `lib/api.ts`

Replace all Express API calls with NCB data proxy calls:

| Old Function | New Implementation |
|---|---|
| `googleAuthLogin()` | Remove (NCB handles OAuth internally) |
| `emailRegister()` | `POST /api/auth/sign-up/email` with `credentials: "include"` |
| `emailLogin()` | `POST /api/auth/sign-in/email` with `credentials: "include"` |
| `getCurrentUser()` | `GET /api/auth/get-session` with `credentials: "include"` |
| `getBrandProfile()` | `GET /api/data/profiles?user_id=<id>` with `credentials: "include"` |
| `updateBrandProfile()` | `PUT /api/data/profiles/<id>` with `credentials: "include"` |
| `getScheduledPosts()` | `GET /api/data/posts` with `credentials: "include"` |
| `updatePost()` | `PUT /api/data/posts/<id>` with `credentials: "include"` |
| `savePostDraft()` | `POST /api/data/posts` with `credentials: "include"` |
| `schedulePost()` | `POST /api/data/posts` with `credentials: "include"` |
| `getAnalytics()` | Keep as mock/placeholder (no real analytics backend yet) |
| `validateOpenAIKey()` | `POST /api/ai/validate-key` (custom API route) |
| `findSubtopics()` | `POST /api/ai/subtopics` (custom API route) |
| `getPostRecommendations()` | `POST /api/ai/recommendations` (custom API route) |
| `generateAIContent()` | `POST /api/ai/generate` (custom API route) |

Key rules:
- Every fetch to `/api/data/*` and `/api/auth/*` MUST include `credentials: "include"`
- Array fields (`audience`, `tones`, `offers`, `taboos`) stored as JSON strings in NCB, parse on read
- NCB uses snake_case columns; map to camelCase TypeScript interfaces in the client

### 3.2 Update `lib/types.ts`
- `User` interface: align with NCB session user shape (`id`, `email`, `name`, `image`)
- `BrandProfile`: keep same but add mapping layer for snake_case <-> camelCase
- `ScheduledPost`: rename `scheduledAt` mapping to `scheduled_at`

---

## Phase 4: AI Service API Routes

### 4.1 Create AI utilities (TypeScript conversion)
**File: `lib/server/openai-service.ts`**

Convert `server/utils/openaiService.js` to TypeScript:
- `generateContentWithOpenAI(prompt)` -> OpenAI gpt-4o call
- `getOpenAIRecommendations(subtopic, postTypes, hookPatterns, contentPillars, tones)` -> JSON recommendations
- `searchSubtopicsWithOpenAI(topic, count)` -> subtopic array

**File: `lib/server/perplexity-service.ts`**

Convert `server/utils/perplexityService.js` to TypeScript:
- `searchSubtopicsWithPerplexity(topic, count)` -> subtopic array

### 4.2 Create AI API routes

**File: `app/api/ai/generate/route.ts`**
- POST: validate session, call `generateContentWithOpenAI(prompt)`, return `{ content }`

**File: `app/api/ai/subtopics/route.ts`**
- POST: validate session, call subtopic service (OpenAI or Perplexity based on `service` param)

**File: `app/api/ai/recommendations/route.ts`**
- POST: validate session, call `getOpenAIRecommendations()`

**File: `app/api/ai/validate-key/route.ts`**
- POST: validate the provided OpenAI key by making a test API call

All AI routes:
- Authenticate via `getSessionUser()` from `lib/ncb-utils.ts`
- Read API keys from `process.env` (server-only)
- Return proper error responses

---

## Phase 5: Migrate Pages to App Router

### 5.1 Move and adapt components

Components that need `"use client"` directive + import changes:
- `Sidebar.tsx`: `NavLink` -> `Link` from `next/link` + `usePathname()` from `next/navigation`
- `Header.tsx`: minimal changes (already uses `useAuth`)
- `ProtectedRoute.tsx`: delete (handled by `(protected)/layout.tsx`)
- All other components (`PostGenerator`, `EnhancedDropdown`, `SchedulePostModal`, etc.): add `"use client"`, no router changes needed

Move components:
- `src/components/*` -> `components/*`
- `src/lib/*` -> `lib/*`

### 5.2 Create page files

| Current Path | New Path | Changes |
|---|---|---|
| `src/pages/DashboardPage.tsx` | `app/(protected)/dashboard/page.tsx` | `"use client"`, remove router imports |
| `src/pages/CreatePage.tsx` | `app/(protected)/create/page.tsx` | `Link` from `next/link`, `"use client"` |
| `src/pages/CalendarPage.tsx` | `app/(protected)/calendar/page.tsx` | `"use client"` |
| `src/pages/LibraryPage.tsx` | `app/(protected)/library/page.tsx` | `"use client"` |
| `src/pages/AnalyticsPage.tsx` | `app/(protected)/analytics/page.tsx` | `"use client"` |
| `src/pages/SettingsPage.tsx` | `app/(protected)/settings/page.tsx` | `"use client"` |

Each page:
- Add `"use client"` at top
- Replace `react-router-dom` imports with `next/navigation` / `next/link`
- Replace `useNavigate()` with `useRouter()` from `next/navigation`
- Replace `<Link to=...>` with `<Link href=...>`
- API calls already handled by Phase 3 rewrite

### 5.3 Create catch-all redirect
**File: `app/(protected)/page.tsx`** -> redirect to `/dashboard`

---

## Phase 6: Cleanup + Build Verification

### 6.1 Delete legacy files
- `server/` directory (entire Express backend)
- `prisma/` directory
- `src/` directory (after all files migrated)
- `vite.config.ts`, `index.html`
- Old `.env` (replaced by `.env.local`)

### 6.2 Clean package.json
Remove unused dependencies: `express`, `prisma`, `@prisma/client`, `ioredis`, `bcrypt`, `jsonwebtoken`, `jwt-decode`, `react-router-dom`, `@react-oauth/google`, `vite`, `@vitejs/plugin-react`, `node-fetch`, `cors`

### 6.3 Build and test
```bash
npm run build   # Next.js production build - must pass with 0 errors
npm run dev     # Start dev server
```

### 6.4 End-to-end verification
1. Visit `/login` -> see email/password form
2. Register a new user -> redirects to `/dashboard`
3. Visit `/settings` -> create/update brand profile
4. Visit `/create` -> generate a post with AI
5. Save draft -> appears in `/library`
6. Logout -> redirected to `/login`
7. Login again -> session persists via cookies

---

## Critical Files Summary

### Files to CREATE
```
app/layout.tsx                          # Root layout
app/globals.css                         # Global styles (from src/index.css)
app/login/page.tsx                      # Login page
app/reset-password/page.tsx             # Password reset
app/(protected)/layout.tsx              # Auth-guarded layout with sidebar
app/(protected)/page.tsx                # Redirect to /dashboard
app/(protected)/dashboard/page.tsx      # Dashboard
app/(protected)/create/page.tsx         # Create post
app/(protected)/calendar/page.tsx       # Calendar
app/(protected)/library/page.tsx        # Library
app/(protected)/analytics/page.tsx      # Analytics
app/(protected)/settings/page.tsx       # Settings
app/api/auth/[...path]/route.ts         # NCB auth proxy
app/api/auth-providers/route.ts         # Auth providers
app/api/data/[...path]/route.ts         # NCB data proxy
app/api/ai/generate/route.ts            # AI content generation
app/api/ai/subtopics/route.ts           # Subtopic search
app/api/ai/recommendations/route.ts     # Post recommendations
app/api/ai/validate-key/route.ts        # OpenAI key validation
lib/ncb-utils.ts                        # NCB shared utilities
lib/auth-context.tsx                    # Auth context (NCB sessions)
lib/api.ts                              # Rewritten API client
lib/types.ts                            # TypeScript types (updated)
lib/server/openai-service.ts            # OpenAI service (TS)
lib/server/perplexity-service.ts        # Perplexity service (TS)
next.config.ts                          # Next.js config
.env.local                              # Environment variables
```

### Files to KEEP (move from `src/`)
```
components/Sidebar.tsx                  # Update imports
components/Header.tsx                   # Minimal changes
components/PostGenerator.tsx            # Add "use client"
components/EnhancedDropdown.tsx         # Add "use client"
components/SchedulePostModal.tsx        # Add "use client"
components/PostEditorModal.tsx          # Add "use client"
components/NeoCard.tsx                  # Add "use client"
components/calendar/CalendarView.tsx    # Add "use client"
lib/prompts.ts                          # Keep as-is
lib/dropdownData.ts                     # Keep as-is
lib/calendarUtils.ts                    # Keep as-is
tailwind.config.ts                      # Keep (already correct)
postcss.config.mjs                      # Keep or create for Next.js
```

### Files to DELETE
```
server/                                 # Entire Express backend
prisma/                                 # Prisma schema + migrations
src/                                    # After migration complete
vite.config.ts                          # Vite config
index.html                              # Vite entry
src/main.tsx                            # Vite entry point
src/App.tsx                             # React Router app shell
src/context/AuthContext.tsx              # JWT auth (replaced)
src/components/ProtectedRoute.tsx       # Replaced by layout
```

### Existing utilities to REUSE
- `src/lib/prompts.ts` -> `lib/prompts.ts` (tone templates, `preparePromptTemplate`, `generatePost`)
- `src/lib/dropdownData.ts` -> `lib/dropdownData.ts` (all dropdown options)
- `src/lib/calendarUtils.ts` -> `lib/calendarUtils.ts` (calendar helpers)
- `server/utils/openaiService.js` -> `lib/server/openai-service.ts` (convert to TS)
- `server/utils/perplexityService.js` -> `lib/server/perplexity-service.ts` (convert to TS)
