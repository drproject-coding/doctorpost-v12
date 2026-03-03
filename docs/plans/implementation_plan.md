# Content Factory Pipeline Implementation Plan

## Overview
Implement a complete 8-agent content factory pipeline for DoctorPost, transforming from basic single-post generation to a sophisticated system with brand-driven guardrails, evidence gathering, and learning capabilities. This will enable single-post and campaign batch generation with real-time scoring and continuous improvement.

## Types

### Knowledge Layer Types
```typescript
// Document Management
interface Document {
  id: string;
  user_id: string;
  category: 'rules' | 'references' | 'library' | 'learned' | 'templates';
  subcategory: string;
  name: string;
  content: string;
  version: number;
  is_active: boolean;
  source: 'seed' | 'user-edit' | 'import' | 'agent-learned' | 'rule-promotion';
  updated_at: Date;
  updated_by: string;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: string;
  change_reason: string;
  changed_by: string;
  created_at: Date;
}

// Campaign Management
interface Campaign {
  id: string;
  user_id: string;
  name: string;
  duration_weeks: number;
  posts_per_week: number;
  goals: string[];
  pillar_weights: Record<string, number>;
  status: 'planning' | 'generating' | 'reviewing' | 'active' | 'completed';
  created_at: Date;
}

interface CampaignPost {
  id: string;
  campaign_id: string;
  post_id: string;
  slot_date: Date;
  slot_order: number;
  topic_card: TopicProposal;
  generation_status: 'pending' | 'generating' | 'generated' | 'reviewed' | 'approved';
}

// Learning System
interface Signal {
  id: string;
  user_id: string;
  session_id: string;
  signal_type: 'approval' | 'rejection' | 'edit' | 'hook-rewrite' | 'tone-feedback' | 'score-override';
  category: string;
  context: Record<string, any>;
  observation: string;
  created_at: Date;
}

interface RuleProposal {
  id: string;
  user_id: string;
  target_document: string;
  proposal_type: 'add' | 'modify' | 'remove';
  evidence_signals: string[];
  current_content: string;
  proposed_content: string;
  reasoning: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}
```

### Agent Data Contracts
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

## Files

### New Files to Create

**Knowledge Layer (Batch 1):**
- `lib/knowledge/types.ts` - Document and campaign type definitions
- `lib/knowledge/api.ts` - NCB API helpers for CRUD operations
- `lib/knowledge/seed.ts` - Database seeding utilities
- `lib/knowledge/seed-data/content.ts` - Doctor Project brand content
- `lib/knowledge/seed-data/manifest.ts` - Seed configuration
- `scripts/seed-knowledge.ts` - Seed script runner

**Agent Framework (Batch 2):**
- `lib/agents/types.ts` - Agent configurations and interfaces
- `lib/agents/promptBuilder.ts` - Dynamic prompt generation
- `lib/agents/structuredOutput.ts` - Claude structured output parser
- `lib/agents/strategist.ts` - Topic planning agent
- `lib/agents/researcher.ts` - Evidence gathering agent
- `lib/agents/integrations/perplexity.ts` - Perplexity API client
- `lib/agents/integrations/reddit.ts` - Reddit API client
- `lib/agents/writer.ts` - Content generation agent
- `lib/agents/scorer.ts` - Content evaluation agent
- `lib/agents/formatter.ts` - LinkedIn formatting agent
- `lib/agents/learner.ts` - Pattern learning agent
- `lib/agents/templateExtractor.ts` - Template extraction agent

**Orchestration (Batch 3):**
- `lib/agents/orchestrator.ts` - Pipeline state machine
- `lib/agents/guardrails.ts` - Brand rule enforcement engine
- `lib/agents/campaignPlanner.ts` - Batch generation coordinator

**API Routes (Batch 3):**
- `app/api/pipeline/stream/route.ts` - SSE streaming endpoint
- `app/api/campaign/route.ts` - Campaign management API
- `app/api/knowledge/[...path]/route.ts` - Knowledge CRUD API
- `app/api/knowledge/ingest/route.ts` - Document import API
- `app/api/knowledge/extract/route.ts` - Template extraction API

**UI Components (Batches 4-6):**
- `components/knowledge/DocumentEditor.tsx` - Document editing interface
- `components/knowledge/VersionHistory.tsx` - Version history viewer
- `components/knowledge/ImportFlow.tsx` - Document import wizard
- `components/knowledge/ExtractFlow.tsx` - Template extraction interface
- `components/factory/PipelineStepper.tsx` - Pipeline progress stepper
- `components/factory/TopicProposals.tsx` - Topic selection interface
- `components/factory/ResearchBrief.tsx` - Research results display
- `components/factory/EvidencePack.tsx` - Evidence management interface
- `components/factory/DraftEditor.tsx` - Draft editing interface
- `components/factory/Scorecard.tsx` - Scoring results display
- `components/factory/FormattedOutput.tsx` - LinkedIn preview interface
- `components/factory/PostReview.tsx` - Post approval interface
- `components/campaigns/CampaignSetup.tsx` - Campaign configuration
- `components/campaigns/CampaignCalendar.tsx` - Campaign timeline
- `components/campaigns/BatchProgress.tsx` - Batch generation status
- `components/learning/SignalCounts.tsx` - Learning metrics display
- `components/learning/PatternList.tsx` - Pattern detection results
- `components/learning/RuleProposal.tsx` - Rule change proposals
- `components/learning/FeedbackHistory.tsx` - Audit log viewer

**Pages (Batches 4-6):**
- `app/(protected)/knowledge/page.tsx` - Knowledge base page
- `app/(protected)/factory/page.tsx` - Content factory page
- `app/(protected)/campaigns/page.tsx` - Campaign management page
- `app/(protected)/learning/page.tsx` - Learning dashboard page

### Existing Files to Modify

**Core Types:**
- `lib/types.ts` - Add knowledge layer interfaces
- `lib/agents/types.ts` - Add agent configurations

**API Routes:**
- `app/api/ai/route.ts` - Migrate to server-side calls
- `app/api/models/route.ts` - Add Perplexity/Reddit model support

**UI Components:**
- `components/Sidebar.tsx` - Add new navigation items
- `app/(protected)/settings/page.tsx` - Add API key fields
- `app/(protected)/calendar/page.tsx` - Add score badges
- `components/calendar/CalendarView.tsx` - Enhanced display

## Functions

### New Functions

**Knowledge Layer Functions:**
```typescript
// lib/knowledge/api.ts
export async function createDocument(data: Partial<Document>): Promise<Document>
export async function updateDocument(id: string, data: Partial<Document>): Promise<Document>
export async function getDocument(id: string): Promise<Document | null>
export async function listDocuments(userId: string, category?: string): Promise<Document[]>
export async function createDocumentVersion(data: DocumentVersion): Promise<DocumentVersion>
export async function createSignal(data: Signal): Promise<Signal>
export async function createRuleProposal(data: RuleProposal): Promise<RuleProposal>
export async function createCampaign(data: Partial<Campaign>): Promise<Campaign>
export async function createCampaignPost(data: Partial<CampaignPost>): Promise<CampaignPost>
```

**Agent Functions:**
```typescript
// lib/agents/strategist.ts
export async function runStrategist(topic: string, context: AgentContext): Promise<TopicProposal[]>
// lib/agents/researcher.ts
export async function runResearcher(query: string, context: AgentContext): Promise<DiscoveryBrief>
export async function gatherEvidence(topic: string, context: AgentContext): Promise<EvidencePack>
// lib/agents/writer.ts
export async function runWriter(context: AgentContext): Promise<string>
// lib/agents/scorer.ts
export async function runScorer(content: string, context: AgentContext): Promise<ScoreResult>
// lib/agents/formatter.ts
export async function runFormatter(content: string, context: AgentContext): Promise<FormattedPost>
// lib/agents/learner.ts
export async function runLearner(session: SessionData, context: AgentContext): Promise<void>
```

**Orchestration Functions:**
```typescript
// lib/agents/orchestrator.ts
export async function runPipeline(request: PipelineRequest): Promise<PipelineResult>
export async function runCampaign(campaign: Campaign): Promise<void>
// lib/agents/guardrails.ts
export async function enforceGuardrails(content: string, context: AgentContext): Promise<GuardrailResult>
```

**API Functions:**
```typescript
// app/api/pipeline/stream/route.ts
export async function POST(request: Request): Promise<Response>
// app/api/campaign/route.ts
export async function POST(request: Request): Promise<Response>
export async function GET(request: Request): Promise<Response>
```

### Modified Functions

**AI Service Functions:**
- `lib/ai/aiService.ts` - Add server-side routing for all AI calls
- `app/api/ai/route.ts` - Expand to handle all agent types

**Type Extensions:**
- `lib/types.ts` - Add document, campaign, signal interfaces

## Classes

### New Classes

**Agent Base Class:**
```typescript
abstract class BaseAgent {
  protected config: AgentConfig;
  protected context: AgentContext;
  
  constructor(config: AgentConfig, context: AgentContext);
  abstract execute(): Promise<any>;
  protected buildPrompt(template: string, variables: Record<string, any>): string;
  protected parseStructuredOutput<T>(response: string): T;
}
```

**Pipeline Orchestrator Class:**
```typescript
class PipelineOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private state: PipelineState;
  
  constructor(agents: Map<AgentRole, BaseAgent>);
  async execute(request: PipelineRequest): Promise<AsyncGenerator<PipelineEvent>>;
  private validateGuardrails(content: string): GuardrailResult;
  private handleRewriteLoop(draft: string, attempts: number): Promise<string>;
}
```

**Knowledge Manager Class:**
```typescript
class KnowledgeManager {
  private api: KnowledgeAPI;
  
  async loadBrandKnowledge(userId: string): Promise<BrandKnowledge>;
  async updateDocument(id: string, content: string): Promise<void>;
  async importDocument(text: string, type: 'text' | 'file' | 'post'): Promise<Document>;
  async extractTemplate(post: string): Promise<Template>;
}
```

**Campaign Manager Class:**
```typescript
class CampaignManager {
  private planner: CampaignPlanner;
  private orchestrator: PipelineOrchestrator;
  
  async createCampaign(config: CampaignConfig): Promise<Campaign>;
  async executeCampaign(campaign: Campaign): Promise<void>;
  async schedulePosts(campaign: Campaign): Promise<void>;
}
```

### Modified Classes

**Existing Agent Classes:**
- Extend current agent implementations to use new base class
- Add structured output parsing
- Integrate with guardrail system

## Dependencies

### New Dependencies

**API Clients:**
- `axios` or `node-fetch` for Perplexity API integration
- `snoowrap` or custom Reddit API client
- Enhanced error handling and retry logic

**Structured Output:**
- Zod schema validation for Claude structured outputs
- JSON parsing utilities with fallback handling

**Database:**
- NCB schema extensions for new tables
- Migration scripts for existing data

**Streaming:**
- Server-Sent Events (SSE) support
- Real-time progress updates

### Version Changes

**Existing Dependencies:**
- Update Claude API integration for structured outputs
- Enhance error handling in AI service layer
- Add streaming support to frontend components

**Development Dependencies:**
- Add type definitions for new API integrations
- Enhanced testing utilities for agent testing

## Testing

### Test File Requirements

**Unit Tests:**
- `__tests__/lib/knowledge/api.test.ts` - Knowledge CRUD operations
- `__tests__/lib/agents/strategist.test.ts` - Topic planning logic
- `__tests__/lib/agents/researcher.test.ts` - Evidence gathering
- `__tests__/lib/agents/scorer.test.ts` - Scoring algorithms
- `__tests__/lib/agents/orchestrator.test.ts` - Pipeline orchestration

**Integration Tests:**
- `__tests__/api/pipeline/stream.test.ts` - SSE streaming
- `__tests__/api/campaign.test.ts` - Campaign management
- `__tests__/api/knowledge.test.ts` - Knowledge operations

**E2E Tests:**
- `cypress/e2e/content-factory.cy.ts` - Full pipeline workflow
- `cypress/e2e/campaign-generation.cy.ts` - Batch generation
- `cypress/e2e/knowledge-management.cy.ts` - Document management

### Existing Test Modifications

**Agent Tests:**
- Update existing agent tests to use new interfaces
- Add structured output validation
- Test guardrail enforcement

**API Tests:**
- Migrate client-side AI tests to server-side
- Add streaming response tests
- Test error handling and fallbacks

**Component Tests:**
- Update UI component tests for new props
- Test real-time updates and state management
- Validate form handling and validation

### Validation Strategies

**Data Validation:**
- Schema validation for all API inputs/outputs
- Database constraint validation
- File upload validation for imports

**Business Logic Validation:**
- Scoring algorithm accuracy tests
- Guardrail enforcement verification
- Campaign scheduling logic validation

**Integration Validation:**
- End-to-end pipeline testing
- Cross-agent data flow verification
- Error propagation testing

## Implementation Order

### Phase 1: Foundation (Weeks 1-2)
1. **Task 1-3:** Knowledge Layer Types & NCB API
   - Create type definitions and database schema
   - Implement CRUD operations
   - Build seed script for Doctor Project content

### Phase 2: Agent Infrastructure (Weeks 3-4)
2. **Task 4:** Agent Framework
   - Create base agent class and interfaces
   - Implement prompt builder and structured output parser
3. **Task 5-10:** Core Agents
   - Implement Strategist, Researcher, Writer, Scorer, Formatter, Learner
   - Add Perplexity and Reddit API integrations

### Phase 3: Orchestration (Weeks 5-6)
4. **Task 11:** Pipeline Orchestrator
   - Build state machine and guardrail engine
5. **Task 12-14:** API Routes
   - Implement SSE streaming, campaign, and knowledge APIs

### Phase 4: Knowledge Management (Weeks 7-8)
6. **Task 15-17:** Knowledge UI
   - Build document editor, import flow, and template extractor
   - Create knowledge base page

### Phase 5: Content Factory (Weeks 9-10)
7. **Task 18-24:** Factory UI
   - Implement complete pipeline UI with all panels
   - Add real-time scoring and progress tracking

### Phase 6: Campaign Management (Weeks 11-12)
8. **Task 25-27:** Campaign UI
   - Build campaign setup, calendar, and progress tracking

### Phase 7: Learning System (Weeks 13-14)
9. **Task 28-30:** Learning UI
   - Implement learning dashboard, rule proposals, and feedback history

### Phase 8: Integration & Polish (Weeks 15-16)
10. **Task 31-34:** Final Integration
    - Update navigation, settings, calendar
    - Migrate all AI calls to server-side
    - Performance optimization and testing

### Parallel Development Opportunities

**Independent Tracks:**
- Knowledge UI (Batch 4) can start after Batch 1 completion
- Campaign UI (Batch 6) can start after Batch 3 completion
- Learning UI (Batch 7) can start after Batch 1 completion

**Dependencies to Monitor:**
- All UI components depend on completed agent implementations
- API routes depend on agent framework completion
- Integration tasks depend on all previous batches

This implementation plan provides a comprehensive roadmap for building the content factory pipeline while maintaining code quality, test coverage, and architectural integrity.