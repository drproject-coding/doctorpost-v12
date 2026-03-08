import {
  KnowledgeDocument,
  DocumentVersion,
  Signal,
  RuleProposal,
  Campaign,
  CampaignPost,
  NcbDocumentRow,
  NcbDocumentVersionRow,
  NcbSignalRow,
  NcbRuleProposalRow,
  NcbCampaignRow,
  NcbCampaignPostRow,
  DocumentCategory,
  DocumentSource,
  SignalType,
  ProposalStatus,
  CampaignStatus,
  CampaignPostStatus,
  mapDocumentFromNcb,
  mapDocumentVersionFromNcb,
  mapSignalFromNcb,
  mapRuleProposalFromNcb,
  mapCampaignFromNcb,
  mapCampaignPostFromNcb,
} from "./types";
import { extractRows } from "../ncb-utils";

// ── Helpers ──

async function ncbFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const res = await fetch(`/api/data/${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`NCB request failed: ${path} — ${res.statusText}`);
  }
  return res;
}

// ── Documents CRUD ──

export async function getDocuments(
  category?: DocumentCategory,
): Promise<KnowledgeDocument[]> {
  const path = category
    ? `read/documents?category=${encodeURIComponent(category)}`
    : "read/documents";
  const res = await ncbFetch(path);
  const rows = extractRows<NcbDocumentRow>(await res.json());
  return rows.map(mapDocumentFromNcb);
}

export async function getDocument(id: string): Promise<KnowledgeDocument> {
  const res = await ncbFetch(`read/documents/${id}`);
  const rows = extractRows<NcbDocumentRow>(await res.json());
  if (rows.length === 0) throw new Error(`Document not found: ${id}`);
  return mapDocumentFromNcb(rows[0]);
}

export async function getDocumentByName(
  category: DocumentCategory,
  name: string,
): Promise<KnowledgeDocument | null> {
  const res = await ncbFetch(
    `read/documents?category=${encodeURIComponent(category)}&name=${encodeURIComponent(name)}`,
  );
  const rows = extractRows<NcbDocumentRow>(await res.json());
  if (rows.length === 0) return null;
  return mapDocumentFromNcb(rows[0]);
}

export async function createDocument(doc: {
  category: DocumentCategory;
  subcategory: string;
  name: string;
  content: string;
  source: DocumentSource;
  updatedBy: string;
}): Promise<KnowledgeDocument> {
  const res = await ncbFetch("create/documents", {
    method: "POST",
    body: JSON.stringify({
      category: doc.category,
      subcategory: doc.subcategory,
      name: doc.name,
      content: doc.content,
      version: 1,
      is_active: true,
      source: doc.source,
      updated_by: doc.updatedBy,
    }),
  });
  const row = (await res.json()) as NcbDocumentRow;
  return mapDocumentFromNcb(row);
}

// NOTE: Non-atomic operation (3 sequential calls: read → create version → update).
// Version snapshot may persist if update fails. NCB has no transaction support.
export async function updateDocument(
  id: string,
  updates: {
    content?: string;
    isActive?: boolean;
    source?: DocumentSource;
    updatedBy: string;
    changeReason: string;
  },
): Promise<KnowledgeDocument> {
  const current = await getDocument(id);
  const newVersion = current.version + 1;

  // Save version snapshot
  await ncbFetch("create/document_versions", {
    method: "POST",
    body: JSON.stringify({
      document_id: id,
      version: current.version,
      content: current.content,
      change_reason: updates.changeReason,
      changed_by: updates.updatedBy,
    }),
  });

  // Update document
  const payload: Record<string, unknown> = {
    version: newVersion,
    updated_by: updates.updatedBy,
  };
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.source !== undefined) payload.source = updates.source;

  const res = await ncbFetch(`update/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const row = (await res.json()) as NcbDocumentRow;
  return mapDocumentFromNcb(row);
}

export async function deleteDocument(id: string): Promise<void> {
  await ncbFetch(`delete/documents/${id}`, { method: "DELETE" });
}

// ── Document Versions ──

export async function getDocumentVersions(
  documentId: string,
): Promise<DocumentVersion[]> {
  const res = await ncbFetch(
    `read/document_versions?document_id=${encodeURIComponent(documentId)}`,
  );
  const rows = extractRows<NcbDocumentVersionRow>(await res.json());
  return rows.map(mapDocumentVersionFromNcb);
}

// ── Signals ──

export async function getSignals(category?: string): Promise<Signal[]> {
  const path = category
    ? `read/signals?category=${encodeURIComponent(category)}`
    : "read/signals";
  const res = await ncbFetch(path);
  const rows = extractRows<NcbSignalRow>(await res.json());
  return rows.map(mapSignalFromNcb);
}

export async function createSignal(signal: {
  sessionId: string;
  signalType: SignalType;
  category: string;
  context: Record<string, unknown>;
  observation: string;
}): Promise<Signal> {
  const res = await ncbFetch("create/signals", {
    method: "POST",
    body: JSON.stringify({
      session_id: signal.sessionId,
      signal_type: signal.signalType,
      category: signal.category,
      context: JSON.stringify(signal.context),
      observation: signal.observation,
    }),
  });
  const row = (await res.json()) as NcbSignalRow;
  return mapSignalFromNcb(row);
}

// ── Rule Proposals ──

export async function getRuleProposals(
  status?: ProposalStatus,
): Promise<RuleProposal[]> {
  const path = status
    ? `read/rule_proposals?status=${encodeURIComponent(status)}`
    : "read/rule_proposals";
  const res = await ncbFetch(path);
  const rows = extractRows<NcbRuleProposalRow>(await res.json());
  return rows.map(mapRuleProposalFromNcb);
}

export async function createRuleProposal(proposal: {
  targetDocument: string;
  proposalType: string;
  evidenceSignals: string[];
  currentContent: string;
  proposedContent: string;
  reasoning: string;
  confidence: number;
}): Promise<RuleProposal> {
  const res = await ncbFetch("create/rule_proposals", {
    method: "POST",
    body: JSON.stringify({
      target_document: proposal.targetDocument,
      proposal_type: proposal.proposalType,
      evidence_signals: JSON.stringify(proposal.evidenceSignals),
      current_content: proposal.currentContent,
      proposed_content: proposal.proposedContent,
      reasoning: proposal.reasoning,
      confidence: proposal.confidence,
      status: "pending",
    }),
  });
  const row = (await res.json()) as NcbRuleProposalRow;
  return mapRuleProposalFromNcb(row);
}

export async function updateRuleProposalStatus(
  id: string,
  status: ProposalStatus,
): Promise<RuleProposal> {
  const res = await ncbFetch(`update/rule_proposals/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  const row = (await res.json()) as NcbRuleProposalRow;
  return mapRuleProposalFromNcb(row);
}

// ── Campaigns ──

export async function getCampaigns(
  status?: CampaignStatus,
): Promise<Campaign[]> {
  const path = status
    ? `read/campaigns?status=${encodeURIComponent(status)}`
    : "read/campaigns";
  const res = await ncbFetch(path);
  const rows = extractRows<NcbCampaignRow>(await res.json());
  return rows.map(mapCampaignFromNcb);
}

export async function createCampaign(campaign: {
  name: string;
  durationWeeks: number;
  postsPerWeek: number;
  goals: string;
  pillarWeights: Record<string, number>;
}): Promise<Campaign> {
  const res = await ncbFetch("create/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: campaign.name,
      duration_weeks: campaign.durationWeeks,
      posts_per_week: campaign.postsPerWeek,
      goals: campaign.goals,
      pillar_weights: JSON.stringify(campaign.pillarWeights),
      status: "planning",
    }),
  });
  const row = (await res.json()) as NcbCampaignRow;
  return mapCampaignFromNcb(row);
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
): Promise<Campaign> {
  const res = await ncbFetch(`update/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  const row = (await res.json()) as NcbCampaignRow;
  return mapCampaignFromNcb(row);
}

// ── Campaign Posts ──

export async function getCampaignPosts(
  campaignId: string,
): Promise<CampaignPost[]> {
  const res = await ncbFetch(
    `read/campaign_posts?campaign_id=${encodeURIComponent(campaignId)}`,
  );
  const rows = extractRows<NcbCampaignPostRow>(await res.json());
  return rows.map(mapCampaignPostFromNcb);
}

export async function createCampaignPost(post: {
  campaignId: string;
  postId: string;
  slotDate: string;
  slotOrder: number;
  topicCard: Record<string, unknown>;
}): Promise<CampaignPost> {
  const res = await ncbFetch("create/campaign_posts", {
    method: "POST",
    body: JSON.stringify({
      campaign_id: post.campaignId,
      post_id: post.postId,
      slot_date: post.slotDate,
      slot_order: post.slotOrder,
      topic_card: JSON.stringify(post.topicCard),
      generation_status: "waiting_review",
    }),
  });
  const row = (await res.json()) as NcbCampaignPostRow;
  return mapCampaignPostFromNcb(row);
}

export async function updateCampaignPostStatus(
  id: string,
  status: CampaignPostStatus,
): Promise<CampaignPost> {
  const res = await ncbFetch(`update/campaign_posts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ generation_status: status }),
  });
  const row = (await res.json()) as NcbCampaignPostRow;
  return mapCampaignPostFromNcb(row);
}

export async function getValidatedIdeas(): Promise<CampaignPost[]> {
  const res = await ncbFetch("search/campaign_posts", {
    method: "POST",
    body: JSON.stringify({ generation_status: "validated" }),
  });
  const rows = extractRows<NcbCampaignPostRow>(await res.json());
  return rows.map(mapCampaignPostFromNcb);
}

export async function getCampaignsForUser(): Promise<Campaign[]> {
  const res = await ncbFetch("read/campaigns");
  const rows = extractRows<NcbCampaignRow>(await res.json());
  return rows.map(mapCampaignFromNcb);
}

export async function linkPostToCampaignSlot(
  campaignPostId: string,
  postUuid: string,
): Promise<CampaignPost> {
  const res = await ncbFetch(`update/campaign_posts/${campaignPostId}`, {
    method: "PUT",
    body: JSON.stringify({
      post_uuid: postUuid,
      generation_status: "in_progress",
    }),
  });
  const row = (await res.json()) as NcbCampaignPostRow;
  return mapCampaignPostFromNcb(row);
}

export async function updateCampaignPostTopicCard(
  campaignPostId: string,
  topicCard: Record<string, unknown>,
): Promise<CampaignPost> {
  const res = await ncbFetch(`update/campaign_posts/${campaignPostId}`, {
    method: "PUT",
    body: JSON.stringify({
      topic_card: JSON.stringify(topicCard),
    }),
  });
  const row = (await res.json()) as NcbCampaignPostRow;
  return mapCampaignPostFromNcb(row);
}

// ── Bulk Operations (for seeding) ──

export async function bulkCreateDocuments(
  docs: {
    category: DocumentCategory;
    subcategory: string;
    name: string;
    content: string;
    source: DocumentSource;
    updatedBy: string;
  }[],
): Promise<KnowledgeDocument[]> {
  const results: KnowledgeDocument[] = [];
  for (const doc of docs) {
    try {
      results.push(await createDocument(doc));
    } catch (err) {
      console.warn(
        `Failed to create document ${doc.category}/${doc.name}:`,
        err,
      );
    }
  }
  return results;
}
