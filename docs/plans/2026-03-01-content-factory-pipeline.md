# DoctorPost V1: Content Factory Pipeline — Implementation Plan

**Session ID:** plan-2026-03-01-0001
**Created:** 2026-03-01
**Approach:** A — Server Pipeline + SSE (no new infrastructure)
**Status:** Approved

---

## 1. Problem Statement

DoctorPost v12 currently has a basic single-post AI generation flow (topic → subtopics → generate) running entirely client-side with generic tone prompts. The content-factory-agents system — a 7-agent pipeline with brand rules, scoring, templates, hooks, and a learning engine — runs only in the CLI via Claude Code plugins.

We need to bring the full content factory pipeline into the DoctorPost web app as a server-side orchestrated system with:

- 8 agents (adding a Researcher agent for Perplexity/Reddit evidence gathering)
- Brand-driven guardrails enforced at every phase
- Continuous scoring (not just end-gate)
- A knowledge layer that stores brand rules, templates, and learned signals in the database with versioning
- A feedback loop that captures user behavior and evolves the system over time
- Single-post and campaign batch generation modes

The initial deployment serves Doctor Project only, with all brand data pre-loaded from the existing `.md` files.

---

## 2. Scope & Boundaries

### IN Scope

| Feature                | Details                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **8-Agent Pipeline**   | Strategist, Researcher (new), Writer, Scorer, Formatter, Learner, Knowledge Curator, Template Extractor    |
| **Content Type**       | LinkedIn Post only (4 templates: Strong Opinion, Structured Analysis, Field Storytelling, Myth vs Reality) |
| **Generation Modes**   | Single post (SSE real-time) + Campaign batch (chunked, 1-12 weeks, X posts/week)                           |
| **Knowledge Layer**    | All brand `.md` files → database documents with versioning. CRUD UI for rules, references, library         |
| **Research Agent**     | Perplexity Search API + Reddit API integration for evidence gathering                                      |
| **Scoring System**     | Continuous scoring at every phase. 100-point grid + 40-point checklist from scoring-rules.md               |
| **Brand Guardrails**   | Every check traces to a brand `.md` file. Voice match, anti-voice, hard rules, vocabulary, formatting      |
| **Evidence Integrity** | Every claim in a post must trace to: Evidence Pack, kpi-benchmarks, or pre-approved brand data             |
| **Learning System**    | Signal capture on every interaction. Pattern detection. Rule promotion proposals at 10+ signals            |
| **Import System**      | Paste text (auto-classify), upload .md files, paste admired posts (extract templates)                      |
| **Pipeline UX**        | Named agent steps with streaming progress. Stepper/wizard. Inspect output at each step                     |
| **Pre-loaded Data**    | All Doctor Project `.md` files seeded on account creation                                                  |
| **BYOK**               | User provides own API keys (Claude, Straico, 1ForAll + new: Perplexity, Reddit)                            |

### OUT of Scope

| Exclusion                               | Reason                                            |
| --------------------------------------- | ------------------------------------------------- |
| Direct LinkedIn publishing              | Copy-paste output only for V1                     |
| Multi-user / multi-brand                | Doctor Project only. Versatile mode is V2+        |
| Case Study content type                 | V2                                                |
| Carousel content type                   | V2                                                |
| Model fine-tuning for brand enforcement | V2+ (use system prompt injection for V1)          |
| Analytics / real performance tracking   | Existing mock stays. Real analytics is V2         |
| Inngest / background job infrastructure | Approach A: SSE only, chunk campaigns client-side |

---

## 3. Success Criteria

| #   | Criterion                             | How to verify                                                                                                           |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Single post pipeline works end-to-end | User can go from blank page → topic proposals → research → draft → scored → formatted → saved to calendar               |
| 2   | Campaign batch generates N posts      | User sets "3 posts/week for 4 weeks" → 12 posts appear in calendar with status "draft"                                  |
| 3   | Scoring matches the 100-point grid    | Every draft receives a scorecard with per-criterion breakdown matching scoring-rules.md exactly                         |
| 4   | Brand guardrails enforce rules        | Forbidden words flagged, anti-tones detected, CIO test evaluated, Quick Kill Check runs before scoring                  |
| 5   | Evidence integrity verified           | Every claim in a post traces to Perplexity result, kpi-benchmarks, or pre-approved brand data. Unsourced claims flagged |
| 6   | Rewrite loop works                    | Posts scoring <75 are automatically sent back to writer with per-criterion feedback. Max 3 attempts                     |
| 7   | Knowledge base is editable            | User can edit brand-voice, add hooks, import .md files, paste admired posts — changes take effect on next generation    |
| 8   | Learning system captures signals      | User edits/approvals/rejections create signals. Dashboard shows signal counts and patterns                              |
| 9   | Rule promotions propose changes       | When 10+ signals accumulate for a category, system proposes a rule change with evidence. User can approve/reject        |
| 10  | Version history works                 | Every document change creates a version. User can view history and rollback                                             |
| 11  | Pipeline progress is visible          | UI shows which agent is active, streaming status, and allows inspecting output at each step                             |
| 12  | BYOK keys work server-side            | All AI calls go through server routes (no more browser-direct API exposure)                                             |

---

## 4. Architecture

### 4.1 Agent Pipeline Flow

```
PHASE 1: DIRECTION
  Strategist → reads: content-strategy, content-matrix, winners, preferences
  → outputs: 3-5 topic proposals (pillar, angle, decision mistake, headline)
  → [USER picks a topic]

PHASE 2: DISCOVERY (Research Round 1)
  Researcher → searches: Perplexity (broad) + Reddit (practitioner voices)
  → outputs: Discovery Brief (subtopic angles, pain points, debates, questions)

  Strategist → refines topic using discovery data
  → outputs: Sharpened Topic Card (specific angle, validated decision mistake, headline options)
  → [USER approves sharpened topic]

PHASE 3: EVIDENCE GATHERING (Research Round 2)
  Researcher → deep dive: Perplexity + Reddit + cross-ref kpi-benchmarks
  → outputs: Evidence Pack (verified claims, practitioner quotes, counter-arguments)
  → [USER reviews evidence, can remove/add]

PHASE 4: WRITING
  Writer → receives: topic card + evidence pack + template + all rules + references + library + learned
  → outputs: Draft v1 with embedded evidence

PHASE 5: SCORING + REWRITE LOOP
  Scorer → evaluates: 100-point grid + 40-point checklist
  → if < 75: sends feedback to Writer → rewrite (max 3 loops)
  → if >= 75: passes to Formatter

PHASE 6: FORMATTING
  Formatter → produces: LinkedIn-ready output, see-more check, char count, pinned comment

PHASE 7: REVIEW
  → [USER: approve / edit / reject]

PHASE 8: LEARNING
  Learner → captures: diff analysis, signal classification, pattern detection
```

### 4.2 Brand-Driven Guardrails

Every guardrail traces to a specific `.md` file:

**From brand-voice.md:** 7 core tone traits enforced (Expert, Blunt, Analytical, Challenger, Structured, Calm, Mature), 7 anti-tones blocked (Motivational, Inspirational, Lifestyle/Hustle, Hollow Corporate, Guru/Preachy, FOMO, Aggressive), target emotions checked, vocabulary validated, analogies filtered, positioning verified

**From hard-rules.md:** 9 binary rules (no emojis, no closing questions, no social CTAs, one topic, decision mistake, expert tone, English only, CIO test), forbidden words/symbols, Quick Kill Check (5 binary questions — fail = stop), penalty table

**From formatting-rules.md:** Hook format (3 lines, 50/50/30 chars), post length ranges per template, structure validation, rhythm checks (1 idea/para, 1-3 lines/block), list limits (3-6 items), see-more optimization

**From scoring-rules.md:** 100-point grid (Hook 20, Strategic Relevance 20, Structure 15, Tone 15, Content 15, Conclusion 10, Bonuses ±5), 40-point pre-publish checklist (7 stages), verdict thresholds (≥90 publish, 75-89 pass with suggestions, <75 rewrite, <60 scrap)

**From content-strategy.md:** Pillar alignment (P1:30%, P2:25%, P3:20%, P4:15%, P5:10%), audience targeting (4 roles), ICP relevance (3 profiles), exclusion enforcement (no startups, no SMBs, no <5K projects), 90-day phase fit, Golden Rule (decision mistake)

### 4.3 Evidence Integrity Layer

Every claim in the final post must trace to:

1. **Evidence Pack** (from Researcher) — Perplexity results with URLs, Reddit quotes with thread links
2. **KPI Benchmarks** (from kpi-benchmarks.md) — pre-verified Doctor Project data
3. **Doctor Project experience** (from brand-voice.md) — "50+ firms, 8+ years", named clients

Severity levels:

- HARD: Invented statistic → auto-remove
- SOFT: Unsourced general claim → mark as opinion
- OK: Doctor Project own data → pre-approved

### 4.4 Knowledge Layer

All brand knowledge stored as versioned markdown documents in the database:

**documents table:** id, user_id, category (rules|references|library|learned|templates), subcategory, name, content (TEXT), version, is_active, source (seed|user-edit|import|agent-learned|rule-promotion), updated_at, updated_by

**document_versions table:** id, document_id (FK), version, content (snapshot), change_reason, changed_by, created_at

Three mutation paths:

1. **User edits** — markdown editor → new version → immediate effect on next generation
2. **User imports** — paste text / upload .md / paste posts → auto-classify → route preview → approve
3. **Agent proposes** — rule promotions at 10+ signals → diff view with evidence → user approves/rejects

### 4.5 Learning System

**signals table:** id, user_id, session_id, signal_type (approval|rejection|edit|hook-rewrite|tone-feedback|score-override), category, context (JSON), observation, created_at

**rule_proposals table:** id, user_id, target_document (FK), proposal_type, evidence_signals (FK[]), current_content, proposed_content, reasoning, confidence, status (pending|approved|rejected), created_at

Evolution cycle: Observe → Accumulate → Detect patterns → Propose → Apply → loop

### 4.6 Campaign System

**campaigns table:** id, user_id, name, duration_weeks, posts_per_week, goals, pillar_weights (JSON), status (planning|generating|reviewing|active|completed), created_at

**campaign_posts table:** id, campaign_id (FK), post_id (FK), slot_date, slot_order, topic_card (JSON), generation_status (pending|generating|generated|reviewed|approved)

### 4.7 Inter-Agent Data Contracts

```typescript
interface TopicProposal {
  pillar: string;
  angle: string;
  decisionMistake: string;
  headline: string;
  reasoning: string;
  templateRecommendation: string;
  hookCategoryRecommendation: string;
}

interface DiscoveryBrief {
  subtopicAngles: { angle: string; source: string; relevance: string }[];
  painPoints: { quote: string; source: string; context: string }[];
  currentDebates: string[];
  questionsAsked: string[];
}

interface EvidencePack {
  claims: {
    fact: string;
    source: string;
    sourceUrl: string;
    verification: "verified" | "estimate" | "anecdotal";
    usageNote: string;
  }[];
  humanVoices: { quote: string; context: string; sentiment: string }[];
  counterArguments: string[];
  freshAngles: string[];
}

interface ScoreResult {
  totalScore: number;
  criteriaScores: {
    hook: { score: number; max: 20; feedback: string };
    strategicRelevance: { score: number; max: 20; feedback: string };
    structureRhythm: { score: number; max: 15; feedback: string };
    toneStyle: { score: number; max: 15; feedback: string };
    contentValue: { score: number; max: 15; feedback: string };
    conclusionCTA: { score: number; max: 10; feedback: string };
    bonusPenalty: { score: number; details: string[] };
  };
  checklist: { stage: string; items: { check: string; pass: boolean }[] }[];
  checklistScore: number;
  verdict: "publish" | "minor-tweaks" | "rework" | "rewrite" | "scrap";
  rewriteInstructions?: string;
}

interface FormattedPost {
  content: string;
  characterCount: number;
  hookBeforeFold: { mobile: boolean; desktop: boolean };
  suggestedPinnedComment: string;
  metadata: { template: string; pillar: string; angle: string; score: number };
}

interface PipelineEvent {
  step: string;
  status: "running" | "done" | "error" | "waiting-for-user";
  percent: number;
  data?: any;
  guardrailResults?: {
    rule: string;
    source: string;
    passed: boolean;
    detail?: string;
  }[];
}
```

---

## 5. Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                                                        | Files                                                                                                                      | Deps         | Batch |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ | ----- |
| 1   | Create Knowledge Layer types + interfaces                                                   | `lib/types.ts`, `lib/knowledge/types.ts`                                                                                   | -            | 1     |
| 2   | Create NCB API helpers for documents, document_versions, signals, rule_proposals, campaigns | `lib/knowledge/api.ts`, `lib/knowledge/seed.ts`                                                                            | -            | 1     |
| 3   | Seed script: parse all Doctor Project `.md` files into initial documents                    | `lib/knowledge/seed-data/`, `scripts/seed-knowledge.ts`                                                                    | 1,2          | 1     |
| 4   | Create agent framework: base agent interface, prompt builder, structured output parser      | `lib/agents/types.ts`, `lib/agents/promptBuilder.ts`, `lib/agents/structuredOutput.ts`                                     | 1            | 2     |
| 5   | Create Strategist agent                                                                     | `lib/agents/strategist.ts`                                                                                                 | 4            | 2     |
| 6   | Create Researcher agent (Perplexity + Reddit integration)                                   | `lib/agents/researcher.ts`, `lib/agents/integrations/perplexity.ts`, `lib/agents/integrations/reddit.ts`                   | 4            | 2     |
| 7   | Create Writer agent                                                                         | `lib/agents/writer.ts`                                                                                                     | 4            | 2     |
| 8   | Create Scorer agent (100pt grid + 40pt checklist)                                           | `lib/agents/scorer.ts`                                                                                                     | 4            | 2     |
| 9   | Create Formatter agent (LinkedIn specs)                                                     | `lib/agents/formatter.ts`                                                                                                  | 4            | 2     |
| 10  | Create Learner agent (signal capture + pattern detection)                                   | `lib/agents/learner.ts`                                                                                                    | 4            | 2     |
| 11  | Create Pipeline Orchestrator (state machine + guardrail engine)                             | `lib/agents/orchestrator.ts`, `lib/agents/guardrails.ts`                                                                   | 5,6,7,8,9,10 | 3     |
| 12  | Create SSE stream API route for single-post pipeline                                        | `app/api/pipeline/stream/route.ts`                                                                                         | 11           | 3     |
| 13  | Create campaign planner + batch generation API                                              | `lib/agents/campaignPlanner.ts`, `app/api/campaign/route.ts`                                                               | 11           | 3     |
| 14  | Create Knowledge Base CRUD API routes                                                       | `app/api/knowledge/[...path]/route.ts`                                                                                     | 2            | 3     |
| 15  | Create Knowledge Base page (document list, markdown editor, version history)                | `app/(protected)/knowledge/page.tsx`, `components/knowledge/DocumentEditor.tsx`, `components/knowledge/VersionHistory.tsx` | 14           | 4     |
| 16  | Create Import flow UI (paste → classify → route → approve)                                  | `components/knowledge/ImportFlow.tsx`, `app/api/knowledge/ingest/route.ts`                                                 | 14           | 4     |
| 17  | Create Template Extractor UI (paste posts → deconstruct → preview → save)                   | `components/knowledge/ExtractFlow.tsx`, `lib/agents/templateExtractor.ts`, `app/api/knowledge/extract/route.ts`            | 4,14         | 4     |
| 18  | Create Content Factory page (stepper wizard)                                                | `app/(protected)/factory/page.tsx`, `components/factory/PipelineStepper.tsx`                                               | 12           | 5     |
| 19  | Create Topic Proposals panel                                                                | `components/factory/TopicProposals.tsx`                                                                                    | 18           | 5     |
| 20  | Create Research Brief panel                                                                 | `components/factory/ResearchBrief.tsx`                                                                                     | 18           | 5     |
| 21  | Create Evidence Pack panel                                                                  | `components/factory/EvidencePack.tsx`                                                                                      | 18           | 5     |
| 22  | Create Draft Editor + Scorecard panel                                                       | `components/factory/DraftEditor.tsx`, `components/factory/Scorecard.tsx`                                                   | 18           | 5     |
| 23  | Create Formatted Output panel (LinkedIn preview)                                            | `components/factory/FormattedOutput.tsx`                                                                                   | 18           | 5     |
| 24  | Create Post Review actions (approve/edit/reject + feedback buttons)                         | `components/factory/PostReview.tsx`                                                                                        | 18           | 5     |
| 25  | Create Campaign Setup page                                                                  | `app/(protected)/campaigns/page.tsx`, `components/campaigns/CampaignSetup.tsx`                                             | 13           | 6     |
| 26  | Create Campaign Calendar proposal view                                                      | `components/campaigns/CampaignCalendar.tsx`                                                                                | 25           | 6     |
| 27  | Create Campaign batch progress view                                                         | `components/campaigns/BatchProgress.tsx`                                                                                   | 25           | 6     |
| 28  | Create Learning Dashboard page (signals, patterns, winners)                                 | `app/(protected)/learning/page.tsx`, `components/learning/SignalCounts.tsx`, `components/learning/PatternList.tsx`         | 2            | 7     |
| 29  | Create Rule Promotion proposals UI (diff view, evidence, approve/reject)                    | `components/learning/RuleProposal.tsx`                                                                                     | 28           | 7     |
| 30  | Create Feedback History panel (audit log)                                                   | `components/learning/FeedbackHistory.tsx`                                                                                  | 28           | 7     |
| 31  | Update Sidebar navigation (Factory, Campaigns, Knowledge, Learning)                         | `components/Sidebar.tsx`                                                                                                   | 18,25,15,28  | 8     |
| 32  | Update Settings page (Perplexity + Reddit API key fields)                                   | `app/(protected)/settings/page.tsx`                                                                                        | -            | 8     |
| 33  | Update Calendar page (score badges on factory posts)                                        | `app/(protected)/calendar/page.tsx`, `components/calendar/CalendarView.tsx`                                                | 12           | 8     |
| 34  | Migrate AI calls to server-side routes (security fix)                                       | `lib/ai/aiService.ts`, `app/api/ai/route.ts`                                                                               | -            | 8     |

<!-- EXECUTION_TASKS_END -->

---

## 6. Dependencies

### External

- **Perplexity Search API** — $5/1K requests, BYOK via Settings
- **Reddit API** — Free, app-only OAuth, register at reddit.com/prefs/apps
- **Claude API** — Existing BYOK. Add Structured Outputs beta header (anthropic-beta: structured-outputs-2025-11-13)
- **NCB** — New tables via existing /api/data/ proxy

### Internal (Batch order)

```
Batch 1 (Data Layer) → Batch 2 (Agents) → Batch 3 (Orchestrator + API)
                                         → Batch 4 (Knowledge UI)
                        Batch 3 ────────→ Batch 5 (Pipeline UI)
                        Batch 3 ────────→ Batch 6 (Campaign UI)
Batch 1 ──────────────────────────────→ Batch 7 (Learning UI)
All ──────────────────────────────────→ Batch 8 (Integration)
```

---

## 7. Risks & Mitigations

| Risk                                  | Impact | Likelihood | Mitigation                                                          |
| ------------------------------------- | ------ | ---------- | ------------------------------------------------------------------- |
| Vercel timeout on campaigns           | High   | High       | Chunk: 2-3 posts per SSE request, client queues batches             |
| Claude Structured Outputs beta issues | Medium | Medium     | Fallback: parse JSON from text, validate with Zod                   |
| Perplexity API downtime               | Medium | Medium     | Research step optional, graceful degradation, cache results         |
| NCB table constraints                 | Low    | Low        | Test early. Fallback: JSON fields in existing tables                |
| Prompt size limits                    | Medium | Medium     | Prioritize rules injection. Selective references. Prompt caching    |
| Brand rule conflicts after edits      | Low    | Low        | Curator consistency check on save                                   |
| Cost per post                         | Low    | Low        | Model routing: Haiku for 5 steps, Sonnet for writing. Target <$0.08 |

---

## 8. Verification Checklist

| #   | Check                                          | Method                             |
| --- | ---------------------------------------------- | ---------------------------------- |
| 1   | Pipeline generates scored post from blank page | Manual E2E                         |
| 2   | Scorecard matches scoring-rules.md exactly     | Compare against manual scoring     |
| 3   | Forbidden words detected and flagged           | Test with known forbidden words    |
| 4   | Research returns sourced claims                | Verify source URLs                 |
| 5   | Rewrite loop fires at score < 75               | Force low-quality generation       |
| 6   | Campaign generates correct post count          | Set 3/week x 4 weeks, count 12     |
| 7   | Knowledge edit affects next generation         | Edit brand-voice, verify in output |
| 8   | Signal captured on user edit                   | Edit draft, check signals          |
| 9   | Rule promotion appears at threshold            | Inject 10+ test signals            |
| 10  | Version rollback works                         | Create v2, rollback, verify v1     |
| 11  | All AI calls server-side                       | Check browser network tab          |
| 12  | SSE shows real-time progress                   | Observe step-by-step updates       |

---

## Source Reference

All agent logic, rules, templates, hooks, closers, CTAs, and references sourced from:
`/Users/y/Desktop/content-factory-agents/doctor-project-content-factory/`

This folder IS the source of truth for brand knowledge seeded into the Knowledge Layer.
