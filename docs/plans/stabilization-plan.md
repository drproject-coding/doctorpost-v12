# DoctorPost v12 - Stabilization Plan

## Context

DoctorPost is a LinkedIn post generator SaaS app (React 18 + Vite + Express + Prisma + PostgreSQL + Redis). It was working but accumulated many bugs. The codebase has a critical structural problem: every file exists in both `.jsx` and `.tsx` versions, with `index.html` pointing to `main.jsx` (making JSX the active code). The TSX files are an incomplete TypeScript port. We will **consolidate to TypeScript**, merging missing JSX functionality into TSX files, then delete all dead code.

---

## Phase 0: Prerequisites

1. **Init git** - `git init && git add -A && git commit -m "chore: initial commit"`
2. **Add `.gitignore`** - Exclude `.env`, `server/.env`, `node_modules/`
3. **Install deps** - `npm install` + add missing server deps:
   - `npm install @prisma/client ioredis node-fetch dotenv openai`
   - `npm install -D typescript @types/node`
4. **Generate Prisma** - `npx prisma generate`

---

## Phase 1: Delete Dead Code (~30 files)

### Delete entire directories
- `app/` (unused Next.js structure)
- `apps/` (unused frontend copy)

### Delete dead root files
- `server.js` (old proxy, replaced by `server/index.js`)
- `vite.config.js` (replaced by `vite.config.ts`)
- `postcss.config.cjs` (duplicate of `postcss.config.js`)
- `tailwind.config.js` (replaced by `tailwind.config.ts`)

### Delete ALL .jsx files in src/
- `src/main.jsx`, `src/App.jsx`
- All `src/components/*.jsx` and `src/components/calendar/*.jsx`
- All `src/pages/*.jsx`
- `src/context/AuthContext.jsx`

### Delete dead .js/.jsx lib files
- `src/lib/api.js`, `src/lib/api.jsx`, `src/lib/types.js`, `src/lib/utils.js`, `src/lib/calendarUtils.js`, `src/lib/prompts.js`

### Delete other dead files
- `src/context/useAuth.ts` (conflicting duplicate AuthContext)
- `src/pages/CreatePostPage.tsx` (old version importing non-existent mocks)
- `src/index.html`, `src/index.tsx`, `src/vite.config.ts` (misplaced duplicates)

---

## Phase 2: Fix TSX Files (merge JSX functionality)

### 2.1 `index.html` - Update entry point
Change `src="/src/main.jsx"` to `src="/src/main.tsx"`

### 2.2 `src/components/Header.tsx` - **REWRITE** (currently hardcodes "Jane Doe")
- Import `useAuth` from `../context/AuthContext`
- Show `user?.name` dynamically
- Add logout button calling `logout()`
- Keep `HeaderProps` TypeScript interface

### 2.3 `src/components/Sidebar.tsx` - **UPDATE**
- Merge navigation items and descriptions from JSX version
- Keep TypeScript `SidebarProps` interface

### 2.4 `src/pages/LoginPage.tsx` - **ADD email auth UI**
- Add email/password form with register/login toggle
- Add password show/hide toggle
- Import `emailRegister`, `emailLogin` from `../lib/api`
- Keep Google OAuth button

### 2.5 `src/lib/api.ts` - **ADD missing functions**
Add these functions (exist in .js but missing from .ts):
- `emailRegister(email, password)` - POST `/api/auth/register`
- `emailLogin(email, password)` - POST `/api/auth/login`
- `findSubtopics(topic, count, service)` - GET `/api/subtopics/search`
- `getPostRecommendations(topic, subtopic)` - POST `/api/recommendations/attributes`
- `generateAIContent(prompt)` - POST `/api/generate/post`
Remove cross-boundary import from `../../server/utils/dropdownData.js`

### 2.6 `src/lib/prompts.ts` - **FIX mock data**
Replace mock `generatePost()` (returns hardcoded strings) with real backend call using `generateAIContent` from `./api`

### 2.7 `src/pages/CreatePage.tsx` - **ADD missing features**
- Add `numSubtopics` state and count dropdown
- Add AI service selection (Perplexity/OpenAI toggle)
- Add `Star` icon for recommended subtopics
- Update `handleFindSubtopics` to accept service parameter

### 2.8 `src/components/PostGenerator.tsx` - **FIX readonly**
- Make textarea editable (currently `readOnly`, should have `onChange`)

### 2.9 Create `src/lib/dropdownData.ts`
- Copy dropdown arrays from `server/utils/dropdownData.js`
- Add TypeScript types using `DropdownOption` interface
- Update `api.ts` to import from `./dropdownData`

---

## Phase 3: Fix Server Crash (missing AI routes)

**Problem:** `server/index.js:15` imports `./routes/ai.js` which doesn't exist.

**Create** `server/routes/ai.js`:
- POST `/openai` - multi-section content generation
- GET `/perplexity` - single-section detail lookup
- Import from existing `../utils/openaiService.js` and `../utils/perplexityService.js`

---

## Phase 4: Security Quick Fixes

1. **API URL env var** - Change hardcoded `http://localhost:3001/api` in `api.ts` to `import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'`
2. **CORS** - Restrict to `http://localhost:3000` in `server/index.js`
3. **JWT secret** - Generate strong random secret, update `server/.env`
4. **`.env.example`** - Create with placeholder values
5. **Consolidate .env** - Single root `.env` file

---

## Verification

After all phases:
1. `npm run dev` starts Vite on port 3000 without errors
2. `node server/index.js` starts Express on port 3001 without crashing
3. `/login` renders with Google OAuth + email/password form
4. After login, redirects to `/dashboard`
5. Header shows real user name (not "Jane Doe")
6. Sidebar navigation works for all pages
7. `/create` page loads with dropdowns, subtopic search, AI generation
8. `/calendar`, `/library`, `/analytics`, `/settings` all render

---

## Key Files to Modify

| File | Action |
|------|--------|
| `index.html` | Change entry to main.tsx |
| `src/components/Header.tsx` | Rewrite with auth |
| `src/components/Sidebar.tsx` | Merge JSX features |
| `src/pages/LoginPage.tsx` | Add email auth form |
| `src/lib/api.ts` | Add 5 missing functions, fix imports |
| `src/lib/prompts.ts` | Replace mock with real API call |
| `src/lib/dropdownData.ts` | New file (extracted from server) |
| `src/pages/CreatePage.tsx` | Add subtopic count, AI service toggle |
| `src/components/PostGenerator.tsx` | Make textarea editable |
| `server/routes/ai.js` | New file (fix crash) |
| `server/index.js` | Fix CORS, env loading |
| `.gitignore` | New file |
| `.env.example` | New file |
