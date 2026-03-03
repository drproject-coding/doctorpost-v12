(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/doctorpost-v12/lib/knowledge/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// --- Knowledge Layer Types ---
// Mirrors the NCB database tables for the content factory knowledge system.
// ── Document Management ──
__turbopack_context__.s([
    "mapCampaignFromNcb",
    ()=>mapCampaignFromNcb,
    "mapCampaignPostFromNcb",
    ()=>mapCampaignPostFromNcb,
    "mapDocumentFromNcb",
    ()=>mapDocumentFromNcb,
    "mapDocumentVersionFromNcb",
    ()=>mapDocumentVersionFromNcb,
    "mapRuleProposalFromNcb",
    ()=>mapRuleProposalFromNcb,
    "mapSignalFromNcb",
    ()=>mapSignalFromNcb
]);
function mapDocumentFromNcb(row) {
    return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        subcategory: row.subcategory,
        name: row.name,
        content: row.content,
        version: row.version,
        isActive: row.is_active,
        source: row.source,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    };
}
function mapDocumentVersionFromNcb(row) {
    return {
        id: row.id,
        documentId: row.document_id,
        version: row.version,
        content: row.content,
        changeReason: row.change_reason,
        changedBy: row.changed_by,
        createdAt: row.created_at
    };
}
function mapSignalFromNcb(row) {
    let ctx = {};
    try {
        ctx = JSON.parse(row.context);
    } catch  {
    /* leave empty */ }
    return {
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        signalType: row.signal_type,
        category: row.category,
        context: ctx,
        observation: row.observation,
        createdAt: row.created_at
    };
}
function mapRuleProposalFromNcb(row) {
    let signals = [];
    try {
        signals = JSON.parse(row.evidence_signals);
    } catch  {
    /* leave empty */ }
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
        status: row.status,
        createdAt: row.created_at
    };
}
function mapCampaignFromNcb(row) {
    let weights = {};
    try {
        weights = JSON.parse(row.pillar_weights);
    } catch  {
    /* leave empty */ }
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        durationWeeks: row.duration_weeks,
        postsPerWeek: row.posts_per_week,
        goals: row.goals,
        pillarWeights: weights,
        status: row.status,
        createdAt: row.created_at
    };
}
function mapCampaignPostFromNcb(row) {
    let topicCard = {};
    try {
        topicCard = JSON.parse(row.topic_card);
    } catch  {
    /* leave empty */ }
    return {
        id: row.id,
        campaignId: row.campaign_id,
        postId: row.post_id,
        slotDate: row.slot_date,
        slotOrder: row.slot_order,
        topicCard,
        generationStatus: row.generation_status
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DocumentEditor",
    ()=>DocumentEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/save.mjs [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/history.mjs [app-client] (ecmascript) <export default as History>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function DocumentEditor({ documentId, name, category, content: initialContent, version, onSave, onClose, onShowHistory }) {
    _s();
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialContent);
    const [reason, setReason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [feedback, setFeedback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const hasChanges = content !== initialContent;
    const handleSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DocumentEditor.useCallback[handleSave]": async ()=>{
            if (!hasChanges) return;
            setSaving(true);
            setFeedback(null);
            try {
                await onSave(content, reason || "Manual edit");
                setFeedback("Saved successfully");
                setTimeout({
                    "DocumentEditor.useCallback[handleSave]": ()=>setFeedback(null)
                }["DocumentEditor.useCallback[handleSave]"], 3000);
            } catch (err) {
                setFeedback(`Error: ${String(err)}`);
            } finally{
                setSaving(false);
            }
        }
    }["DocumentEditor.useCallback[handleSave]"], [
        content,
        reason,
        hasChanges,
        onSave
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        style: {
            height: "100%"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: "var(--bru-text-h5)",
                                    fontWeight: 700,
                                    margin: 0
                                },
                                children: name
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-sm)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    category,
                                    " · v",
                                    version
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                lineNumber: 69,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--ghost",
                                onClick: onShowHistory,
                                title: "Version history",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                    lineNumber: 84,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--ghost",
                                onClick: onClose,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                className: "bru-input",
                value: content,
                onChange: (e)=>setContent(e.target.value),
                style: {
                    width: "100%",
                    minHeight: 400,
                    fontFamily: "monospace",
                    fontSize: "var(--bru-text-sm)",
                    resize: "vertical"
                }
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-3)",
                    marginTop: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "bru-input",
                        placeholder: "Change reason (optional)",
                        value: reason,
                        onChange: (e)=>setReason(e.target.value),
                        style: {
                            flex: 1
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary",
                        onClick: handleSave,
                        disabled: !hasChanges || saving,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            saving ? "Saving..." : "Save"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            feedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-3)",
                    padding: "var(--bru-space-3)",
                    border: "var(--bru-border)",
                    fontSize: "var(--bru-text-md)",
                    fontWeight: 500,
                    background: feedback.startsWith("Error") ? "rgba(255, 68, 68, 0.12)" : "rgba(0, 170, 0, 0.12)",
                    color: feedback.startsWith("Error") ? "var(--bru-error-dark)" : "var(--bru-success-dark)"
                },
                children: feedback
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
                lineNumber: 134,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
_s(DocumentEditor, "Y72oCzLnsRlMh5q4kKH2tAuzKs0=");
_c = DocumentEditor;
var _c;
__turbopack_context__.k.register(_c, "DocumentEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VersionHistory",
    ()=>VersionHistory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/rotate-ccw.mjs [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/knowledge/types.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function VersionHistory({ documentId, currentVersion, onRestore, onClose }) {
    _s();
    const [versions, setVersions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VersionHistory.useEffect": ()=>{
            async function load() {
                try {
                    const res = await fetch(`/api/knowledge/read/document_versions?document_id=${documentId}`, {
                        credentials: "include"
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const rows = Array.isArray(data) ? data : data.data || data.rows || [];
                        const mapped = rows.map({
                            "VersionHistory.useEffect.load.mapped": (r)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapDocumentVersionFromNcb"])(r)
                        }["VersionHistory.useEffect.load.mapped"]);
                        mapped.sort({
                            "VersionHistory.useEffect.load": (a, b)=>b.version - a.version
                        }["VersionHistory.useEffect.load"]);
                        setVersions(mapped);
                    }
                } catch  {
                // silently fail
                } finally{
                    setLoading(false);
                }
            }
            load();
        }
    }["VersionHistory.useEffect"], [
        documentId
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        style: {
            height: "100%"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Version History"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--ghost",
                        onClick: onClose,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)",
                    color: "var(--bru-grey)"
                },
                children: "Loading versions..."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                lineNumber: 81,
                columnNumber: 9
            }, this) : versions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)",
                    color: "var(--bru-grey)",
                    fontSize: "var(--bru-text-md)"
                },
                children: "No version history yet. Edits will create version snapshots."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--bru-space-2)"
                },
                children: versions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            border: "var(--bru-border)",
                            padding: "var(--bru-space-3)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer"
                                },
                                onClick: ()=>setExpanded(expanded === v.id ? null : v.id),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontWeight: 700,
                                                    fontSize: "var(--bru-text-md)"
                                                },
                                                children: [
                                                    "v",
                                                    v.version
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 127,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    marginLeft: "var(--bru-space-2)",
                                                    color: "var(--bru-grey)",
                                                    fontSize: "var(--bru-text-sm)"
                                                },
                                                children: v.changeReason
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 135,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                        lineNumber: 126,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "var(--bru-text-xs)",
                                                    color: "var(--bru-grey)"
                                                },
                                                children: new Date(v.createdAt).toLocaleDateString()
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 152,
                                                columnNumber: 19
                                            }, this),
                                            expanded === v.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 161,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 163,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                        lineNumber: 145,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                lineNumber: 117,
                                columnNumber: 15
                            }, this),
                            expanded === v.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: "var(--bru-space-3)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            background: "var(--bru-cream)",
                                            padding: "var(--bru-space-3)",
                                            border: "var(--bru-border)",
                                            maxHeight: 300,
                                            overflow: "auto",
                                            whiteSpace: "pre-wrap"
                                        },
                                        children: v.content
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                        lineNumber: 170,
                                        columnNumber: 19
                                    }, this),
                                    v.version < currentVersion && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "bru-btn",
                                        style: {
                                            marginTop: "var(--bru-space-2)"
                                        },
                                        onClick: ()=>onRestore(v),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                                lineNumber: 189,
                                                columnNumber: 23
                                            }, this),
                                            "Restore v",
                                            v.version
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                        lineNumber: 184,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                                lineNumber: 169,
                                columnNumber: 17
                            }, this)
                        ]
                    }, v.id, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                        lineNumber: 110,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
                lineNumber: 102,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_s(VersionHistory, "vVkaFjh8zPKcjLJV6KY/+mdX7hQ=");
_c = VersionHistory;
var _c;
__turbopack_context__.k.register(_c, "VersionHistory");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ImportFlow",
    ()=>ImportFlow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const CATEGORY_OPTIONS = [
    {
        value: "rules",
        label: "Rules"
    },
    {
        value: "references",
        label: "References"
    },
    {
        value: "library",
        label: "Library"
    },
    {
        value: "templates",
        label: "Templates"
    },
    {
        value: "learned",
        label: "Learned"
    }
];
function ImportFlow({ onComplete, onCancel }) {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("input");
    const [text, setText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [fileName, setFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("rules");
    const [subcategory, setSubcategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [feedback, setFeedback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleFileUpload = (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        // Auto-detect name from filename
        setName(file.name.replace(/\.md$/, "").replace(/[_-]/g, " "));
        const reader = new FileReader();
        reader.onload = (ev)=>{
            setText(ev.target?.result);
        };
        reader.readAsText(file);
    };
    const handleClassify = async ()=>{
        if (!text.trim()) return;
        // Auto-classify via API
        try {
            const res = await fetch("/api/knowledge/ingest", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: text
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.category) setCategory(data.category);
                if (data.subcategory) setSubcategory(data.subcategory);
                if (data.name && !name) setName(data.name);
            }
        } catch  {
        // Auto-classify failed, user will manually classify
        }
        setStep("classify");
    };
    const handleSave = async ()=>{
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch("/api/knowledge/create/documents", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category,
                    subcategory: subcategory || category,
                    name: name || "Imported document",
                    content: text,
                    version: 1,
                    is_active: true,
                    source: "import",
                    updated_by: user?.name || "user"
                })
            });
            if (!res.ok) throw new Error("Failed to save document");
            setFeedback("Document imported successfully!");
            setTimeout(onComplete, 1500);
        } catch (err) {
            setFeedback(`Error: ${String(err)}`);
            setSaving(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-3)",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--ghost",
                        onClick: onCancel,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                            lineNumber: 110,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h4)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Import Knowledge"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            step === "input" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Paste text or upload a file"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 125,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: "Upload .md file"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                accept: ".md,.txt",
                                onChange: handleFileUpload,
                                className: "bru-input",
                                style: {
                                    padding: "var(--bru-space-2)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this),
                            fileName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-sm)",
                                    color: "var(--bru-grey)",
                                    marginTop: "var(--bru-space-1)"
                                },
                                children: [
                                    "Selected: ",
                                    fileName
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 149,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: "Or paste content"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "bru-input",
                                value: text,
                                onChange: (e)=>setText(e.target.value),
                                placeholder: "Paste markdown content here...",
                                style: {
                                    minHeight: 200,
                                    fontFamily: "monospace"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 162,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-actions",
                        style: {
                            marginTop: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: onCancel,
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 177,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: handleClassify,
                                disabled: !text.trim(),
                                children: "Next: Classify"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 173,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                lineNumber: 124,
                columnNumber: 9
            }, this),
            step === "classify" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Classify & Name"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-stack",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Document Name"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 205,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        value: name,
                                        onChange: (e)=>setName(e.target.value),
                                        placeholder: "e.g. brand-voice"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 206,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 204,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "bru-field__label",
                                                children: "Category"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                                lineNumber: 216,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                className: "bru-select",
                                                value: category,
                                                onChange: (e)=>setCategory(e.target.value),
                                                children: CATEGORY_OPTIONS.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: opt.value,
                                                        children: opt.label
                                                    }, opt.value, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                                lineNumber: 217,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 215,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "bru-field__label",
                                                children: "Subcategory"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                                lineNumber: 232,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "bru-input",
                                                value: subcategory,
                                                onChange: (e)=>setSubcategory(e.target.value),
                                                placeholder: "e.g. hooks, closers"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                                lineNumber: 233,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 231,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Content Preview"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 244,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            background: "var(--bru-cream)",
                                            padding: "var(--bru-space-3)",
                                            border: "var(--bru-border)",
                                            maxHeight: 200,
                                            overflow: "auto",
                                            whiteSpace: "pre-wrap"
                                        },
                                        children: [
                                            text.slice(0, 1000),
                                            text.length > 1000 ? "\n..." : ""
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                        lineNumber: 245,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 243,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 203,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-actions",
                        style: {
                            marginTop: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: ()=>setStep("input"),
                                children: "Back"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 266,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: handleSave,
                                disabled: !name.trim() || saving,
                                children: saving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                            size: 14,
                                            className: "animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                            lineNumber: 276,
                                            columnNumber: 19
                                        }, this),
                                        " Saving..."
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                            lineNumber: 280,
                                            columnNumber: 19
                                        }, this),
                                        " Import Document"
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                                lineNumber: 269,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this),
                    feedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-3)",
                            padding: "var(--bru-space-3)",
                            border: "var(--bru-border)",
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 500,
                            background: feedback.startsWith("Error") ? "rgba(255, 68, 68, 0.12)" : "rgba(0, 170, 0, 0.12)",
                            color: feedback.startsWith("Error") ? "var(--bru-error-dark)" : "var(--bru-success-dark)"
                        },
                        children: feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                        lineNumber: 287,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
                lineNumber: 192,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_s(ImportFlow, "r2BzMAICaTVIhMwvYm1n87Qcqvk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = ImportFlow;
var _c;
__turbopack_context__.k.register(_c, "ImportFlow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExtractFlow",
    ()=>ExtractFlow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scissors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scissors$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/scissors.mjs [app-client] (ecmascript) <export default as Scissors>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ExtractFlow({ onComplete, onCancel }) {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("paste");
    const [postContent, setPostContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [template, setTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [templateName, setTemplateName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [feedback, setFeedback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleExtract = async ()=>{
        if (!postContent.trim()) return;
        setStep("extracting");
        setFeedback(null);
        try {
            // API key is resolved server-side from the user's brand profile
            const res = await fetch("/api/knowledge/extract", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: postContent
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Extraction failed");
            }
            const data = await res.json();
            setTemplate(data);
            setTemplateName(data.name);
            setStep("preview");
        } catch (err) {
            setFeedback(`Error: ${String(err)}`);
            setStep("paste");
        }
    };
    const handleSave = async ()=>{
        if (!template) return;
        setStep("saving");
        try {
            // Build markdown content from template
            const content = `# ${templateName}

## Structure
${template.structure}

## Hook Pattern
${template.hookPattern}

## Closer Pattern
${template.closerPattern}

## Estimated Length
~${template.estimatedLength} characters

## Tone Notes
${template.toneNotes}

## Example Hooks
${template.exampleHooks.map((h)=>`- ${h}`).join("\n")}
`;
            const res = await fetch("/api/knowledge/create/documents", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category: "templates",
                    subcategory: "templates",
                    name: templateName,
                    content,
                    version: 1,
                    is_active: true,
                    source: "import",
                    updated_by: user?.name || "user"
                })
            });
            if (!res.ok) throw new Error("Failed to save template");
            setFeedback("Template saved!");
            setTimeout(onComplete, 1500);
        } catch (err) {
            setFeedback(`Error: ${String(err)}`);
            setStep("preview");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-3)",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--ghost",
                        onClick: onCancel,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                            lineNumber: 125,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h4)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Extract Template"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            step === "paste" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Paste an admired LinkedIn post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 140,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            color: "var(--bru-grey)",
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "AI will deconstruct the post into a reusable template with hook patterns, structure, and closer patterns."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 149,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "bru-input",
                        value: postContent,
                        onChange: (e)=>setPostContent(e.target.value),
                        placeholder: "Paste the full LinkedIn post here...",
                        style: {
                            minHeight: 250,
                            fontFamily: "monospace"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 159,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-actions",
                        style: {
                            marginTop: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: onCancel,
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: handleExtract,
                                disabled: !postContent.trim(),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scissors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scissors$3e$__["Scissors"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 178,
                                        columnNumber: 15
                                    }, this),
                                    "Extract Template"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this),
                    feedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-3)",
                            padding: "var(--bru-space-3)",
                            border: "var(--bru-border)",
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 500,
                            background: "rgba(255, 68, 68, 0.12)",
                            color: "var(--bru-error-dark)"
                        },
                        children: feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 183,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this),
            step === "extracting" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 32,
                        className: "animate-spin",
                        style: {
                            margin: "0 auto var(--bru-space-4)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 208,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700
                        },
                        children: "Analyzing post structure..."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            color: "var(--bru-grey)",
                            fontSize: "var(--bru-text-md)"
                        },
                        children: "AI is deconstructing the post into a reusable template"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                lineNumber: 201,
                columnNumber: 9
            }, this),
            step === "preview" && template && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Template Preview"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 226,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-stack",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Template Name"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 238,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        value: templateName,
                                        onChange: (e)=>setTemplateName(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 239,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 237,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "bru-field__label",
                                                style: {
                                                    marginBottom: "var(--bru-space-2)",
                                                    display: "block"
                                                },
                                                children: "Hook Pattern"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                                lineNumber: 248,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: "var(--bru-space-3)",
                                                    background: "var(--bru-cream)",
                                                    border: "var(--bru-border)",
                                                    fontSize: "var(--bru-text-sm)"
                                                },
                                                children: template.hookPattern
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                                lineNumber: 257,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 247,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "bru-field__label",
                                                style: {
                                                    marginBottom: "var(--bru-space-2)",
                                                    display: "block"
                                                },
                                                children: "Closer Pattern"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                                lineNumber: 269,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: "var(--bru-space-3)",
                                                    background: "var(--bru-cream)",
                                                    border: "var(--bru-border)",
                                                    fontSize: "var(--bru-text-sm)"
                                                },
                                                children: template.closerPattern
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                                lineNumber: 278,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 268,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 246,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        style: {
                                            marginBottom: "var(--bru-space-2)",
                                            display: "block"
                                        },
                                        children: "Structure"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 292,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            background: "var(--bru-cream)",
                                            padding: "var(--bru-space-3)",
                                            border: "var(--bru-border)",
                                            whiteSpace: "pre-wrap"
                                        },
                                        children: template.structure
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 298,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 291,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        style: {
                                            marginBottom: "var(--bru-space-2)",
                                            display: "block"
                                        },
                                        children: "Example Hooks"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 312,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        style: {
                                            padding: "var(--bru-space-3)",
                                            background: "var(--bru-cream)",
                                            border: "var(--bru-border)",
                                            fontSize: "var(--bru-text-sm)",
                                            listStyle: "disc",
                                            paddingLeft: "var(--bru-space-6)"
                                        },
                                        children: template.exampleHooks.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: h
                                            }, h, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                                lineNumber: 329,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 318,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 311,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "var(--bru-space-3)",
                                    background: "var(--bru-cream)",
                                    border: "var(--bru-border)",
                                    fontSize: "var(--bru-text-sm)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Tone:"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 342,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    template.toneNotes,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 343,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Length:"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 344,
                                        columnNumber: 15
                                    }, this),
                                    " ~",
                                    template.estimatedLength,
                                    " chars"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 236,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-actions",
                        style: {
                            marginTop: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: ()=>setStep("paste"),
                                children: "Back"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 352,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: handleSave,
                                disabled: !templateName.trim(),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                        lineNumber: 360,
                                        columnNumber: 15
                                    }, this),
                                    "Save Template"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                                lineNumber: 355,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 348,
                        columnNumber: 11
                    }, this),
                    feedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-3)",
                            padding: "var(--bru-space-3)",
                            border: "var(--bru-border)",
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 500,
                            background: feedback.startsWith("Error") ? "rgba(255, 68, 68, 0.12)" : "rgba(0, 170, 0, 0.12)",
                            color: feedback.startsWith("Error") ? "var(--bru-error-dark)" : "var(--bru-success-dark)"
                        },
                        children: feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 366,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                lineNumber: 225,
                columnNumber: 9
            }, this),
            step === "saving" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 32,
                        className: "animate-spin",
                        style: {
                            margin: "0 auto var(--bru-space-4)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 395,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700
                        },
                        children: "Saving template..."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                        lineNumber: 400,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
                lineNumber: 388,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
_s(ExtractFlow, "GdCwT7yc79FNF7IGCEnC7hRf2kw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = ExtractFlow;
var _c;
__turbopack_context__.k.register(_c, "ExtractFlow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>KnowledgePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/upload.mjs [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scissors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scissors$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/scissors.mjs [app-client] (ecmascript) <export default as Scissors>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/knowledge/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$DocumentEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/knowledge/DocumentEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$VersionHistory$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/knowledge/VersionHistory.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$ImportFlow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/knowledge/ImportFlow.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$ExtractFlow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/knowledge/ExtractFlow.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
const CATEGORIES = [
    {
        value: "all",
        label: "All"
    },
    {
        value: "rules",
        label: "Rules"
    },
    {
        value: "references",
        label: "References"
    },
    {
        value: "library",
        label: "Library"
    },
    {
        value: "templates",
        label: "Templates"
    },
    {
        value: "learned",
        label: "Learned"
    }
];
function KnowledgePage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [documents, setDocuments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [filterCategory, setFilterCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("list");
    const [selectedDoc, setSelectedDoc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchDocs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "KnowledgePage.useCallback[fetchDocs]": async ()=>{
            setLoading(true);
            setError(null);
            try {
                const path = filterCategory === "all" ? "/api/knowledge/read/documents" : `/api/knowledge/read/documents?category=${filterCategory}`;
                const res = await fetch(path, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    const rows = Array.isArray(data) ? data : data.data || data.rows || [];
                    setDocuments(rows.map({
                        "KnowledgePage.useCallback[fetchDocs]": (r)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapDocumentFromNcb"])(r)
                    }["KnowledgePage.useCallback[fetchDocs]"]));
                }
            } catch (err) {
                setError("Failed to load documents. Please refresh the page.");
            } finally{
                setLoading(false);
            }
        }
    }["KnowledgePage.useCallback[fetchDocs]"], [
        filterCategory
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "KnowledgePage.useEffect": ()=>{
            fetchDocs();
        }
    }["KnowledgePage.useEffect"], [
        fetchDocs
    ]);
    const filtered = documents.filter((d)=>{
        if (search) {
            const q = search.toLowerCase();
            return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.subcategory.toLowerCase().includes(q);
        }
        return true;
    });
    const handleEdit = (doc)=>{
        setSelectedDoc(doc);
        setView("editor");
    };
    const handleSave = async (content, reason)=>{
        if (!selectedDoc) return;
        const res = await fetch(`/api/knowledge/update/documents/${selectedDoc.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content,
                updated_by: user?.name || "user",
                version: selectedDoc.version + 1
            })
        });
        if (!res.ok) throw new Error("Failed to save");
        // Also create version snapshot via the knowledge api
        const versionRes = await fetch("/api/knowledge/create/document_versions", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                document_id: selectedDoc.id,
                version: selectedDoc.version,
                content: selectedDoc.content,
                change_reason: reason,
                changed_by: user?.name || "user"
            })
        });
        if (!versionRes.ok) throw new Error("Failed to create version snapshot");
        // Refresh
        await fetchDocs();
        setSelectedDoc((prev)=>prev ? {
                ...prev,
                content,
                version: prev.version + 1
            } : null);
    };
    const handleRestore = async (version)=>{
        if (!selectedDoc) return;
        await handleSave(version.content, `Restored from v${version.version}`);
        setView("editor");
    };
    // Import/Extract callbacks
    const handleImportComplete = ()=>{
        setView("list");
        fetchDocs();
    };
    if (view === "import") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$ImportFlow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImportFlow"], {
            onComplete: handleImportComplete,
            onCancel: ()=>setView("list")
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
            lineNumber: 135,
            columnNumber: 7
        }, this);
    }
    if (view === "extract") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$ExtractFlow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtractFlow"], {
            onComplete: handleImportComplete,
            onCancel: ()=>setView("list")
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
            lineNumber: 144,
            columnNumber: 7
        }, this);
    }
    if (view === "editor" && selectedDoc) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "var(--bru-space-6)"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$DocumentEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DocumentEditor"], {
                documentId: selectedDoc.id,
                name: selectedDoc.name,
                category: selectedDoc.category,
                content: selectedDoc.content,
                version: selectedDoc.version,
                onSave: handleSave,
                onClose: ()=>setView("list"),
                onShowHistory: ()=>setView("history")
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
            lineNumber: 153,
            columnNumber: 7
        }, this);
    }
    if (view === "history" && selectedDoc) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$knowledge$2f$VersionHistory$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VersionHistory"], {
            documentId: selectedDoc.id,
            currentVersion: selectedDoc.version,
            onRestore: handleRestore,
            onClose: ()=>setView("editor")
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
            lineNumber: 176,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            fontSize: "var(--bru-text-h3)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Knowledge Base"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: ()=>setView("import"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 203,
                                        columnNumber: 13
                                    }, this),
                                    "Import"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                lineNumber: 202,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: ()=>setView("extract"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scissors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Scissors$3e$__["Scissors"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 207,
                                        columnNumber: 13
                                    }, this),
                                    "Extract Template"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 201,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 188,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--flat",
                style: {
                    display: "flex",
                    gap: "var(--bru-space-3)",
                    alignItems: "center",
                    marginBottom: "var(--bru-space-4)",
                    flexWrap: "wrap"
                },
                children: [
                    CATEGORIES.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: `bru-btn ${filterCategory === cat.value ? "bru-btn--primary" : ""}`,
                            style: {
                                padding: "4px 12px",
                                fontSize: "var(--bru-text-sm)"
                            },
                            onClick: ()=>setFilterCategory(cat.value),
                            children: cat.label
                        }, cat.value, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                            lineNumber: 225,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            minWidth: 200
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "relative"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    size: 14,
                                    style: {
                                        position: "absolute",
                                        left: 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "var(--bru-grey)"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                    lineNumber: 236,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "bru-input",
                                    placeholder: "Search documents...",
                                    value: search,
                                    onChange: (e)=>setSearch(e.target.value),
                                    style: {
                                        paddingLeft: 30
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                    lineNumber: 246,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                            lineNumber: 235,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 214,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-alert bru-alert--error",
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bru-alert__icon",
                        children: "!"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 263,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                            lineNumber: 265,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 264,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 259,
                columnNumber: 9
            }, this),
            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)",
                    color: "var(--bru-grey)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                    size: 24,
                    className: "animate-spin"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                    lineNumber: 279,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 272,
                columnNumber: 9
            }, this) : filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)",
                    color: "var(--bru-grey)"
                },
                children: "No documents found. Import brand files to get started."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 282,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "var(--bru-space-4)"
                },
                children: filtered.map((doc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised bru-card--interactive",
                        style: {
                            cursor: "pointer"
                        },
                        onClick: ()=>handleEdit(doc),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "var(--bru-space-3)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                        size: 20,
                                        style: {
                                            flexShrink: 0,
                                            marginTop: 2
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 314,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1,
                                            minWidth: 0
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                style: {
                                                    fontSize: "var(--bru-text-md)",
                                                    fontWeight: 700,
                                                    margin: 0,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                },
                                                children: doc.name
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                                lineNumber: 316,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    gap: "var(--bru-space-2)",
                                                    marginTop: "var(--bru-space-1)",
                                                    flexWrap: "wrap"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-xs)",
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.05em",
                                                            padding: "1px 6px",
                                                            background: "var(--bru-purple)",
                                                            color: "white"
                                                        },
                                                        children: doc.category
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                                        lineNumber: 336,
                                                        columnNumber: 21
                                                    }, this),
                                                    doc.subcategory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-xs)",
                                                            color: "var(--bru-grey)"
                                                        },
                                                        children: doc.subcategory
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                                        lineNumber: 350,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                                lineNumber: 328,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: "var(--bru-text-xs)",
                                                    color: "var(--bru-grey)",
                                                    margin: "var(--bru-space-2) 0 0",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical"
                                                },
                                                children: doc.content.slice(0, 150)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                                lineNumber: 360,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                lineNumber: 307,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: "var(--bru-space-3)",
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "v",
                                            doc.version
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 385,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: doc.source
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                        lineNumber: 386,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                                lineNumber: 376,
                                columnNumber: 15
                            }, this)
                        ]
                    }, doc.id, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                        lineNumber: 301,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
                lineNumber: 293,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/knowledge/page.tsx",
        lineNumber: 186,
        columnNumber: 5
    }, this);
}
_s(KnowledgePage, "QFbirKwGulrxV1FCpMx16k/CIVY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = KnowledgePage;
var _c;
__turbopack_context__.k.register(_c, "KnowledgePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_doctorpost-v12_aad54221._.js.map