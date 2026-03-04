// --- Knowledge Layer Types ---
// Mirrors the NCB database tables for the content factory knowledge system.

// ── Document Management ──

export type DocumentCategory =
  | "rules"
  | "references"
  | "library"
  | "learned"
  | "templates";

export type DocumentSource =
  | "seed"
  | "user-edit"
  | "import"
  | "agent-learned"
  | "rule-promotion";

export interface KnowledgeDocument {
  id: string;
  userId: string;
  category: DocumentCategory;
  subcategory: string;
  name: string;
  content: string;
  version: number;
  isActive: boolean;
  source: DocumentSource;
  updatedAt: string;
  updatedBy: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changeReason: string;
  changedBy: string;
  createdAt: string;
}

// NCB row shapes (snake_case from database)

export interface NcbDocumentRow {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  name: string;
  content: string;
  version: number;
  is_active: boolean;
  source: string;
  updated_at: string;
  updated_by: string;
}

export interface NcbDocumentVersionRow {
  id: string;
  document_id: string;
  version: number;
  content: string;
  change_reason: string;
  changed_by: string;
  created_at: string;
}

// ── Signals & Learning ──

export type SignalType =
  | "approval"
  | "rejection"
  | "edit"
  | "hook-rewrite"
  | "tone-feedback"
  | "score-override";

export interface Signal {
  id: string;
  userId: string;
  sessionId: string;
  signalType: SignalType;
  category: string;
  context: Record<string, unknown>;
  observation: string;
  createdAt: string;
}

export interface NcbSignalRow {
  id: string;
  user_id: string;
  session_id: string;
  signal_type: string;
  category: string;
  context: string;
  observation: string;
  created_at: string;
}

export type ProposalStatus = "pending" | "approved" | "rejected";

export interface RuleProposal {
  id: string;
  userId: string;
  targetDocument: string;
  proposalType: string;
  evidenceSignals: string[];
  currentContent: string;
  proposedContent: string;
  reasoning: string;
  confidence: number;
  status: ProposalStatus;
  createdAt: string;
}

export interface NcbRuleProposalRow {
  id: string;
  user_id: string;
  target_document: string;
  proposal_type: string;
  evidence_signals: string;
  current_content: string;
  proposed_content: string;
  reasoning: string;
  confidence: number;
  status: string;
  created_at: string;
}

// ── Campaigns ──

export type CampaignStatus =
  | "planning"
  | "generating"
  | "reviewing"
  | "active"
  | "completed";

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  durationWeeks: number;
  postsPerWeek: number;
  goals: string;
  pillarWeights: Record<string, number>;
  status: CampaignStatus;
  createdAt: string;
}

export interface NcbCampaignRow {
  id: string;
  user_id: string;
  name: string;
  duration_weeks: number;
  posts_per_week: number;
  goals: string;
  pillar_weights: string;
  status: string;
  created_at: string;
}

export type CampaignPostStatus =
  | "pending"
  | "generating"
  | "generated"
  | "reviewed"
  | "approved";

export interface CampaignPost {
  id: string;
  campaignId: string;
  postId: string;
  slotDate: string;
  slotOrder: number;
  topicCard: Record<string, unknown>;
  generationStatus: CampaignPostStatus;
}

export interface NcbCampaignPostRow {
  id: string;
  campaign_id: string;
  post_id: string;
  slot_date: string;
  slot_order: number;
  topic_card: string;
  generation_status: string;
}

// ── Inter-Agent Data Contracts ──

export interface TopicProposal {
  pillar: string;
  angle: string;
  decisionMistake: string;
  headline: string;
  reasoning: string;
  templateRecommendation: string;
  hookCategoryRecommendation: string;
}

export interface DiscoveryBrief {
  subtopicAngles: { angle: string; source: string; relevance: string }[];
  painPoints: { quote: string; source: string; context: string }[];
  currentDebates: string[];
  questionsAsked: string[];
}

export interface EvidencePack {
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

export interface ScoreResult {
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
  checklist: {
    stage: string;
    items: { check: string; pass: boolean }[];
  }[];
  checklistScore: number;
  verdict: "publish" | "minor-tweaks" | "rework" | "rewrite" | "scrap";
  rewriteInstructions?: string;
}

export interface FormattedPost {
  content: string;
  characterCount: number;
  hookBeforeFold: { mobile: boolean; desktop: boolean };
  suggestedPinnedComment: string;
  metadata: {
    template: string;
    pillar: string;
    angle: string;
    score: number;
  };
}

export interface GuardrailResult {
  rule: string;
  source: string;
  passed: boolean;
  detail?: string;
}

export interface PipelineEvent {
  step: string;
  status:
    | "running"
    | "done"
    | "error"
    | "waiting-for-user"
    | "brand-context"
    | "resuming";
  percent: number;
  data?: unknown;
  guardrailResults?: GuardrailResult[];
}

// ── Mapping Helpers ──

export function mapDocumentFromNcb(row: NcbDocumentRow): KnowledgeDocument {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as DocumentCategory,
    subcategory: row.subcategory,
    name: row.name,
    content: row.content,
    version: row.version,
    isActive: row.is_active,
    source: row.source as DocumentSource,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapDocumentVersionFromNcb(
  row: NcbDocumentVersionRow,
): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    version: row.version,
    content: row.content,
    changeReason: row.change_reason,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  };
}

export function mapSignalFromNcb(row: NcbSignalRow): Signal {
  let ctx: Record<string, unknown> = {};
  try {
    ctx = JSON.parse(row.context);
  } catch {
    /* leave empty */
  }
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    signalType: row.signal_type as SignalType,
    category: row.category,
    context: ctx,
    observation: row.observation,
    createdAt: row.created_at,
  };
}

export function mapRuleProposalFromNcb(row: NcbRuleProposalRow): RuleProposal {
  let signals: string[] = [];
  try {
    signals = JSON.parse(row.evidence_signals);
  } catch {
    /* leave empty */
  }
  return {
    id: row.id,
    userId: row.user_id,
    targetDocument: row.target_document,
    proposalType: row.proposal_type,
    evidenceSignals: signals,
    currentContent: row.current_content,
    proposedContent: row.proposed_content,
    reasoning: row.reasoning,
    confidence: row.confidence,
    status: row.status as ProposalStatus,
    createdAt: row.created_at,
  };
}

export function mapCampaignFromNcb(row: NcbCampaignRow): Campaign {
  let weights: Record<string, number> = {};
  try {
    weights = JSON.parse(row.pillar_weights);
  } catch {
    /* leave empty */
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    durationWeeks: row.duration_weeks,
    postsPerWeek: row.posts_per_week,
    goals: row.goals,
    pillarWeights: weights,
    status: row.status as CampaignStatus,
    createdAt: row.created_at,
  };
}

export function mapCampaignPostFromNcb(row: NcbCampaignPostRow): CampaignPost {
  let topicCard: Record<string, unknown> = {};
  try {
    topicCard = JSON.parse(row.topic_card);
  } catch {
    /* leave empty */
  }
  return {
    id: row.id,
    campaignId: row.campaign_id,
    postId: row.post_id,
    slotDate: row.slot_date,
    slotOrder: row.slot_order,
    topicCard,
    generationStatus: row.generation_status as CampaignPostStatus,
  };
}
