(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineStepper",
    ()=>PipelineStepper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
const STEPS = [
    {
        phase: "direction",
        label: "Direction"
    },
    {
        phase: "discovery",
        label: "Discovery"
    },
    {
        phase: "evidence",
        label: "Evidence"
    },
    {
        phase: "writing",
        label: "Writing"
    },
    {
        phase: "scoring",
        label: "Scoring"
    },
    {
        phase: "formatting",
        label: "Formatting"
    },
    {
        phase: "review",
        label: "Review"
    },
    {
        phase: "learning",
        label: "Learning"
    }
];
const PHASE_ORDER = STEPS.map(_c = (s)=>s.phase);
_c1 = PHASE_ORDER;
function phaseIndex(phase) {
    const idx = PHASE_ORDER.indexOf(phase);
    return idx === -1 ? -1 : idx;
}
function PipelineStepper({ currentPhase, percent, errorAtPhase }) {
    const isErrorState = currentPhase === "error";
    const effectiveIdx = isErrorState && errorAtPhase ? phaseIndex(errorAtPhase) : phaseIndex(currentPhase);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            gap: "var(--bru-space-1)",
            alignItems: "center",
            marginBottom: "var(--bru-space-6)"
        },
        children: STEPS.map((step, i)=>{
            const isComplete = i < effectiveIdx;
            const isCurrent = i === effectiveIdx;
            const isError = isCurrent && isErrorState;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--bru-space-1)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "100%",
                            height: 4,
                            background: "var(--bru-border-color, #e0e0e0)",
                            position: "relative",
                            overflow: "hidden"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                width: isComplete ? "100%" : isCurrent ? `${percent}%` : "0%",
                                height: "100%",
                                background: isError ? "var(--bru-error, #FF4444)" : "var(--bru-purple)",
                                transition: "width 0.3s ease"
                            }
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx",
                            lineNumber: 76,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx",
                        lineNumber: 67,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: "var(--bru-text-xs)",
                            fontWeight: isCurrent ? 700 : 400,
                            color: isComplete || isCurrent ? "var(--bru-black)" : "var(--bru-grey)",
                            whiteSpace: "nowrap"
                        },
                        children: step.label
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx",
                        lineNumber: 88,
                        columnNumber: 13
                    }, this)
                ]
            }, step.phase, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx",
                lineNumber: 56,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_c2 = PipelineStepper;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PHASE_ORDER$STEPS.map");
__turbopack_context__.k.register(_c1, "PHASE_ORDER");
__turbopack_context__.k.register(_c2, "PipelineStepper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TopicProposals",
    ()=>TopicProposals
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
"use client";
;
;
function TopicProposals({ output, onSelect, selectedTopic }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-2)"
                },
                children: "Topic Proposals"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            output.pillarAssessment && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    color: "var(--bru-grey)",
                    marginBottom: "var(--bru-space-4)"
                },
                children: output.pillarAssessment
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                lineNumber: 30,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-3)"
                },
                children: output.proposals.map((topic, idx)=>{
                    const isSelected = selectedTopic === topic || selectedTopic?.headline === topic.headline;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `bru-card ${isSelected ? "bru-card--raised" : "bru-card--flat"} bru-card--interactive`,
                        style: {
                            cursor: "pointer",
                            border: isSelected ? "2px solid var(--bru-purple)" : "var(--bru-border)"
                        },
                        onClick: ()=>onSelect(topic),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        flex: 1
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            style: {
                                                fontSize: "var(--bru-text-md)",
                                                fontWeight: 700,
                                                margin: 0
                                            },
                                            children: topic.headline
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                            lineNumber: 71,
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
                                                        padding: "1px 6px",
                                                        background: "var(--bru-purple)",
                                                        color: "white"
                                                    },
                                                    children: topic.pillar
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 21
                                                }, this),
                                                topic.templateRecommendation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: "var(--bru-text-xs)",
                                                        color: "var(--bru-grey)"
                                                    },
                                                    children: [
                                                        "Template: ",
                                                        topic.templateRecommendation
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                                    lineNumber: 101,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                            lineNumber: 80,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: "var(--bru-text-sm)",
                                                color: "var(--bru-grey)",
                                                margin: "var(--bru-space-2) 0 0"
                                            },
                                            children: topic.angle
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                            lineNumber: 111,
                                            columnNumber: 19
                                        }, this),
                                        topic.reasoning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: "var(--bru-text-xs)",
                                                color: "var(--bru-grey)",
                                                margin: "var(--bru-space-1) 0 0",
                                                fontStyle: "italic"
                                            },
                                            children: topic.reasoning
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                            lineNumber: 121,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                    lineNumber: 70,
                                    columnNumber: 17
                                }, this),
                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                    size: 20,
                                    style: {
                                        color: "var(--bru-purple)",
                                        flexShrink: 0
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                                    lineNumber: 134,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                            lineNumber: 63,
                            columnNumber: 15
                        }, this)
                    }, `${idx}-${topic.headline}`, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                        lineNumber: 52,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = TopicProposals;
var _c;
__turbopack_context__.k.register(_c, "TopicProposals");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResearchBrief",
    ()=>ResearchBrief
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function ResearchBrief({ brief, refinedTopic }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Research Brief"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            refinedTopic && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "var(--bru-space-3)",
                    background: "var(--bru-cream)",
                    border: "var(--bru-border)",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            margin: "0 0 var(--bru-space-1)"
                        },
                        children: "Refined Topic"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 32,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: refinedTopic.headline
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            color: "var(--bru-grey)",
                            margin: "var(--bru-space-1) 0 0"
                        },
                        children: refinedTopic.angle
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, this),
            brief.subtopicAngles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Subtopic Angles"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gap: "var(--bru-space-2)"
                        },
                        children: brief.subtopicAngles.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "var(--bru-space-2)",
                                    border: "var(--bru-border)",
                                    fontSize: "var(--bru-text-sm)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: a.angle
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                        lineNumber: 84,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            marginLeft: "var(--bru-space-2)",
                                            color: "var(--bru-grey)",
                                            fontSize: "var(--bru-text-xs)"
                                        },
                                        children: [
                                            a.source,
                                            " — ",
                                            a.relevance
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                        lineNumber: 85,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, `angle-${i}`, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                lineNumber: 76,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this),
            brief.painPoints.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Pain Points"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this),
                    brief.painPoints.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: "var(--bru-space-2)",
                                border: "var(--bru-border)",
                                fontSize: "var(--bru-text-sm)",
                                marginBottom: "var(--bru-space-2)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                    children: [
                                        "“",
                                        p.quote,
                                        "”"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                    lineNumber: 122,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: "var(--bru-text-xs)",
                                        color: "var(--bru-grey)",
                                        marginTop: "var(--bru-space-1)"
                                    },
                                    children: [
                                        p.source,
                                        " — ",
                                        p.context
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                    lineNumber: 123,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, `pain-${i}`, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                            lineNumber: 113,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 102,
                columnNumber: 9
            }, this),
            brief.currentDebates.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Current Debates"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 140,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        style: {
                            paddingLeft: "var(--bru-space-4)",
                            fontSize: "var(--bru-text-sm)",
                            margin: 0
                        },
                        children: brief.currentDebates.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: d
                            }, `debate-${i}`, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                lineNumber: 157,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 149,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this),
            brief.questionsAsked.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Questions People Are Asking"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        style: {
                            paddingLeft: "var(--bru-space-4)",
                            fontSize: "var(--bru-text-sm)",
                            margin: 0
                        },
                        children: brief.questionsAsked.map((q, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: q
                            }, `question-${i}`, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                                lineNumber: 183,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
                lineNumber: 165,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = ResearchBrief;
var _c;
__turbopack_context__.k.register(_c, "ResearchBrief");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EvidencePack",
    ()=>EvidencePack
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript) <export default as ExternalLink>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function EvidencePack({ evidence }) {
    _s();
    const [expandedSection, setExpandedSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("claims");
    const toggle = (section)=>setExpandedSection(expandedSection === section ? null : section);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Evidence Pack"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: `Claims & Data (${evidence.claims.length})`,
                isOpen: expandedSection === "claims",
                onToggle: ()=>toggle("claims"),
                children: evidence.claims.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: "var(--bru-space-2)",
                            border: "var(--bru-border)",
                            marginBottom: "var(--bru-space-2)",
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0,
                                    fontWeight: 500
                                },
                                children: c.fact
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: "var(--bru-space-2)",
                                    marginTop: "var(--bru-space-1)",
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)",
                                    flexWrap: "wrap",
                                    alignItems: "center"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            padding: "0 4px",
                                            background: c.verification === "verified" ? "rgba(0, 170, 0, 0.15)" : c.verification === "estimate" ? "rgba(233, 215, 152, 0.3)" : "rgba(255, 68, 68, 0.12)"
                                        },
                                        children: c.verification
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                        lineNumber: 58,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: c.source
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    c.sourceUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: c.sourceUrl,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        style: {
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 2,
                                            color: "var(--bru-purple)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                size: 10
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                                lineNumber: 86,
                                                columnNumber: 19
                                            }, this),
                                            "Link"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                        lineNumber: 75,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                lineNumber: 47,
                                columnNumber: 13
                            }, this),
                            c.usageNote && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: "var(--bru-space-1) 0 0",
                                    fontSize: "var(--bru-text-xs)",
                                    fontStyle: "italic",
                                    color: "var(--bru-grey)"
                                },
                                children: c.usageNote
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                lineNumber: 92,
                                columnNumber: 15
                            }, this)
                        ]
                    }, `claim-${i}`, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: `Human Voices (${evidence.humanVoices.length})`,
                isOpen: expandedSection === "voices",
                onToggle: ()=>toggle("voices"),
                children: evidence.humanVoices.map((v, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: "var(--bru-space-2)",
                            border: "var(--bru-border)",
                            marginBottom: "var(--bru-space-2)",
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                children: [
                                    "“",
                                    v.quote,
                                    "”"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                lineNumber: 123,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)",
                                    marginTop: "var(--bru-space-1)"
                                },
                                children: [
                                    v.context,
                                    " — Sentiment: ",
                                    v.sentiment
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this)
                        ]
                    }, `voice-${i}`, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            evidence.counterArguments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: `Counter Arguments (${evidence.counterArguments.length})`,
                isOpen: expandedSection === "counter",
                onToggle: ()=>toggle("counter"),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    style: {
                        paddingLeft: "var(--bru-space-4)",
                        fontSize: "var(--bru-text-sm)",
                        margin: 0
                    },
                    children: evidence.counterArguments.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: a
                        }, `counter-${i}`, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                            lineNumber: 152,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                    lineNumber: 144,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this),
            evidence.freshAngles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Section, {
                title: `Fresh Angles (${evidence.freshAngles.length})`,
                isOpen: expandedSection === "angles",
                onToggle: ()=>toggle("angles"),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    style: {
                        paddingLeft: "var(--bru-space-4)",
                        fontSize: "var(--bru-text-sm)",
                        margin: 0
                    },
                    children: evidence.freshAngles.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: a
                        }, `angle-${i}`, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                            lineNumber: 173,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                    lineNumber: 165,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_s(EvidencePack, "AKUOp4TnpruGGKJadVtRMwbjqyI=");
_c = EvidencePack;
function Section({ title, isOpen, onToggle, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            marginBottom: "var(--bru-space-3)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onToggle,
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-1)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "var(--bru-text-md)",
                    padding: "var(--bru-space-1) 0",
                    width: "100%",
                    textAlign: "left",
                    color: "inherit"
                },
                children: [
                    isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 14
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                        lineNumber: 212,
                        columnNumber: 19
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                        size: 14
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                        lineNumber: 212,
                        columnNumber: 47
                    }, this),
                    title
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-2)"
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
                lineNumber: 216,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx",
        lineNumber: 194,
        columnNumber: 5
    }, this);
}
_c1 = Section;
var _c, _c1;
__turbopack_context__.k.register(_c, "EvidencePack");
__turbopack_context__.k.register(_c1, "Section");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DraftEditor",
    ()=>DraftEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function DraftEditor({ writerOutput, guardrailResults, rewriteCount }) {
    const failedRules = guardrailResults?.filter((r)=>!r.passed) || [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Draft"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)",
                            alignItems: "center"
                        },
                        children: [
                            rewriteCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    "Rewrite #",
                                    rewriteCount
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    writerOutput.content.length,
                                    " chars"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            writerOutput.template && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    marginBottom: "var(--bru-space-2)"
                },
                children: [
                    "Template: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: writerOutput.template
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 75,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    background: "var(--bru-cream)",
                    padding: "var(--bru-space-4)",
                    border: "var(--bru-border)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    lineHeight: 1.6,
                    maxHeight: 500,
                    overflow: "auto"
                },
                children: writerOutput.content
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            guardrailResults && guardrailResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Guardrail Checks"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 99,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gap: "var(--bru-space-1)"
                        },
                        children: guardrailResults.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--bru-space-2)",
                                    fontSize: "var(--bru-text-sm)",
                                    padding: "var(--bru-space-1) var(--bru-space-2)",
                                    background: r.passed ? "rgba(0, 170, 0, 0.08)" : "rgba(255, 68, 68, 0.08)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: r.passed ? "\u2713" : "\u2717"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                        lineNumber: 123,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontWeight: 500
                                        },
                                        children: r.rule
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                        lineNumber: 124,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)"
                                        },
                                        children: r.source
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                        lineNumber: 125,
                                        columnNumber: 17
                                    }, this),
                                    r.detail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)",
                                            marginLeft: "auto"
                                        },
                                        children: r.detail
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                        lineNumber: 134,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, r.rule, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                                lineNumber: 110,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this),
                    failedRules.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-2)",
                            padding: "var(--bru-space-2)",
                            background: "rgba(255, 68, 68, 0.12)",
                            fontSize: "var(--bru-text-xs)",
                            fontWeight: 500,
                            color: "var(--bru-error-dark)"
                        },
                        children: [
                            failedRules.length,
                            " rule",
                            failedRules.length !== 1 ? "s" : "",
                            " ",
                            "failed"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                        lineNumber: 148,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
                lineNumber: 98,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_c = DraftEditor;
var _c;
__turbopack_context__.k.register(_c, "DraftEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Scorecard",
    ()=>Scorecard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function scoreColor(score, max) {
    const pct = score / max * 100;
    if (pct >= 80) return "var(--bru-success-dark, #2d7a3a)";
    if (pct >= 60) return "var(--bru-warning-dark, #b8860b)";
    return "var(--bru-error-dark, #c0392b)";
}
function verdictColor(verdict) {
    switch(verdict){
        case "publish":
            return "rgba(0, 170, 0, 0.15)";
        case "minor-tweaks":
            return "rgba(233, 215, 152, 0.3)";
        default:
            return "rgba(255, 68, 68, 0.12)";
    }
}
function Scorecard({ score }) {
    const criteria = score.criteriaScores;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Scorecard"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 40,
                        columnNumber: 9
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
                                    fontSize: "var(--bru-text-h4)",
                                    fontWeight: 700,
                                    color: scoreColor(score.totalScore, 100)
                                },
                                children: score.totalScore
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-sm)",
                                    color: "var(--bru-grey)"
                                },
                                children: "/ 100"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "inline-block",
                    padding: "var(--bru-space-1) var(--bru-space-3)",
                    background: verdictColor(score.verdict),
                    fontWeight: 700,
                    fontSize: "var(--bru-text-sm)",
                    textTransform: "uppercase",
                    marginBottom: "var(--bru-space-4)"
                },
                children: score.verdict
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-2)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Hook",
                        score: criteria.hook.score,
                        max: criteria.hook.max,
                        feedback: criteria.hook.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Strategic Relevance",
                        score: criteria.strategicRelevance.score,
                        max: criteria.strategicRelevance.max,
                        feedback: criteria.strategicRelevance.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Structure & Rhythm",
                        score: criteria.structureRhythm.score,
                        max: criteria.structureRhythm.max,
                        feedback: criteria.structureRhythm.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Tone & Style",
                        score: criteria.toneStyle.score,
                        max: criteria.toneStyle.max,
                        feedback: criteria.toneStyle.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Content Value",
                        score: criteria.contentValue.score,
                        max: criteria.contentValue.max,
                        feedback: criteria.contentValue.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CriteriaRow, {
                        label: "Conclusion & CTA",
                        score: criteria.conclusionCTA.score,
                        max: criteria.conclusionCTA.max,
                        feedback: criteria.conclusionCTA.feedback
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            criteria.bonusPenalty.score !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-3)",
                    padding: "var(--bru-space-2)",
                    border: "var(--bru-border)",
                    fontSize: "var(--bru-text-sm)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            "Bonus/Penalty: ",
                            criteria.bonusPenalty.score > 0 ? "+" : "",
                            criteria.bonusPenalty.score
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 138,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        style: {
                            margin: "var(--bru-space-1) 0 0",
                            paddingLeft: "var(--bru-space-4)",
                            fontSize: "var(--bru-text-xs)",
                            color: "var(--bru-grey)"
                        },
                        children: criteria.bonusPenalty.details.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: d
                            }, d, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                                lineNumber: 151,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 130,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-3)",
                    padding: "var(--bru-space-2)",
                    border: "var(--bru-border)",
                    fontSize: "var(--bru-text-sm)",
                    display: "flex",
                    justifyContent: "space-between"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Checklist Score"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 168,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            score.checklistScore,
                            "/40"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            score.rewriteInstructions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-3)",
                    padding: "var(--bru-space-3)",
                    background: "rgba(233, 215, 152, 0.3)",
                    border: "var(--bru-border)",
                    fontSize: "var(--bru-text-sm)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Rewrite Instructions:"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 183,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: "var(--bru-space-1) 0 0"
                        },
                        children: score.rewriteInstructions
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                        lineNumber: 184,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 174,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_c = Scorecard;
function CriteriaRow({ label, score, max, feedback }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
            fontSize: "var(--bru-text-sm)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                style: {
                    width: 140,
                    fontWeight: 500
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 213,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: 1,
                    height: 6,
                    background: "var(--bru-border-color, #e0e0e0)",
                    position: "relative"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: `${score / max * 100}%`,
                        height: "100%",
                        background: scoreColor(score, max)
                    }
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                    lineNumber: 223,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                style: {
                    width: 50,
                    textAlign: "right",
                    fontWeight: 700,
                    color: scoreColor(score, max)
                },
                children: [
                    score,
                    "/",
                    max
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 231,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                style: {
                    flex: 2,
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                },
                title: feedback,
                children: feedback
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
                lineNumber: 241,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx",
        lineNumber: 205,
        columnNumber: 5
    }, this);
}
_c1 = CriteriaRow;
var _c, _c1;
__turbopack_context__.k.register(_c, "Scorecard");
__turbopack_context__.k.register(_c1, "CriteriaRow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FormattedOutput",
    ()=>FormattedOutput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/copy.mjs [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function FormattedOutput({ post }) {
    _s();
    const [copied, setCopied] = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(false);
    const handleCopy = async ()=>{
        try {
            await navigator.clipboard.writeText(post.content);
            setCopied(true);
            setTimeout(()=>setCopied(false), 2000);
        } catch  {
        // Clipboard API unavailable (non-HTTPS or permission denied)
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Formatted Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: handleCopy,
                        style: {
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            copied ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                                lineNumber: 47,
                                columnNumber: 21
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                                lineNumber: 47,
                                columnNumber: 43
                            }, this),
                            copied ? "Copied!" : "Copy"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: "white",
                    border: "1px solid #e0e0e0",
                    padding: "var(--bru-space-4)",
                    maxWidth: 550,
                    margin: "0 auto"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                    style: {
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        margin: 0,
                        color: "#191919"
                    },
                    children: post.content
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-4)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "var(--bru-space-2)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Characters",
                        value: String(post.characterCount)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Mobile fold",
                        value: post.hookBeforeFold.mobile ? "Above" : "Below"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Desktop fold",
                        value: post.hookBeforeFold.desktop ? "Above" : "Below"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Template",
                        value: post.metadata.template
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Pillar",
                        value: post.metadata.pillar
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetaStat, {
                        label: "Score",
                        value: String(post.metadata.score)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            post.suggestedPinnedComment && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-4)",
                    padding: "var(--bru-space-3)",
                    background: "var(--bru-cream)",
                    border: "var(--bru-border)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            fontWeight: 700,
                            margin: "0 0 var(--bru-space-1)"
                        },
                        children: "Suggested Pinned Comment"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            margin: 0
                        },
                        children: post.suggestedPinnedComment
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 103,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(FormattedOutput, "NE86rL3vg4NVcTTWDavsT0hUBJs=");
_c = FormattedOutput;
function MetaStat({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: "var(--bru-space-2)",
            border: "var(--bru-border)",
            fontSize: "var(--bru-text-xs)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    color: "var(--bru-grey)"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontWeight: 700
                },
                children: value
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx",
        lineNumber: 131,
        columnNumber: 5
    }, this);
}
_c1 = MetaStat;
var _c, _c1;
__turbopack_context__.k.register(_c, "FormattedOutput");
__turbopack_context__.k.register(_c1, "MetaStat");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PostReview",
    ()=>PostReview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/thumbs-up.mjs [app-client] (ecmascript) <export default as ThumbsUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/thumbs-down.mjs [app-client] (ecmascript) <export default as ThumbsDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2d$line$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit3$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/pen-line.mjs [app-client] (ecmascript) <export default as Edit3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/message-square.mjs [app-client] (ecmascript) <export default as MessageSquare>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function PostReview({ content, onApprove, onReject }) {
    _s();
    const [action, setAction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [editedContent, setEditedContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(content);
    const [feedbackText, setFeedbackText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [feedbackList, setFeedbackList] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const addFeedback = ()=>{
        if (!feedbackText.trim()) return;
        setFeedbackList((prev)=>[
                ...prev,
                feedbackText.trim()
            ]);
        setFeedbackText("");
    };
    const handleApprove = ()=>{
        onApprove(editedContent, feedbackList);
    };
    const handleReject = ()=>{
        onReject(feedbackList);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Review & Approve"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: "var(--bru-space-2)",
                    marginBottom: "var(--bru-space-4)",
                    flexWrap: "wrap"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary",
                        onClick: handleApprove,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__["ThumbsUp"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            "Approve"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: ()=>setAction(action === "editing" ? "idle" : "editing"),
                        style: {
                            border: action === "editing" ? "2px solid var(--bru-purple)" : undefined
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2d$line$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit3$3e$__["Edit3"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            "Edit Before Approve"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: ()=>setAction(action === "feedback" ? "idle" : "feedback"),
                        style: {
                            border: action === "feedback" ? "2px solid var(--bru-purple)" : undefined
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            "Add Feedback"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: handleReject,
                        style: {
                            marginLeft: "auto"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsDown$3e$__["ThumbsDown"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            "Reject"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            action === "editing" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "bru-field__label",
                        style: {
                            marginBottom: "var(--bru-space-2)",
                            display: "block"
                        },
                        children: "Edit Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "bru-input",
                        value: editedContent,
                        onChange: (e)=>setEditedContent(e.target.value),
                        style: {
                            minHeight: 300,
                            fontFamily: "monospace"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: "var(--bru-text-xs)",
                            color: "var(--bru-grey)",
                            marginTop: "var(--bru-space-1)"
                        },
                        children: [
                            editedContent.length,
                            " characters",
                            editedContent !== content && " (modified)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, this),
            action === "feedback" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "bru-field__label",
                        style: {
                            marginBottom: "var(--bru-space-2)",
                            display: "block"
                        },
                        children: "Feedback"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "bru-input",
                                value: feedbackText,
                                onChange: (e)=>setFeedbackText(e.target.value),
                                placeholder: "Type feedback and press Add...",
                                onKeyDown: (e)=>{
                                    if (e.key === "Enter") addFeedback();
                                },
                                style: {
                                    flex: 1
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn",
                                onClick: addFeedback,
                                children: "Add"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                lineNumber: 123,
                columnNumber: 9
            }, this),
            feedbackList.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-1)"
                        },
                        children: [
                            "Feedback (",
                            feedbackList.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gap: "var(--bru-space-1)"
                        },
                        children: feedbackList.map((fb, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "var(--bru-space-1) var(--bru-space-2)",
                                    background: "var(--bru-cream)",
                                    border: "var(--bru-border)",
                                    fontSize: "var(--bru-text-sm)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: fb
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                        lineNumber: 177,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        style: {
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)"
                                        },
                                        onClick: ()=>setFeedbackList((prev)=>prev.filter((_, j)=>j !== i)),
                                        children: "remove"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                        lineNumber: 178,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                                lineNumber: 165,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
                lineNumber: 153,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(PostReview, "0uOigVwRi8Oc9FvTZwDxwIJ2BCY=");
_c = PostReview;
var _c;
__turbopack_context__.k.register(_c, "PostReview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FactoryPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$PipelineStepper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/PipelineStepper.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$TopicProposals$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/TopicProposals.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$ResearchBrief$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/ResearchBrief.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$EvidencePack$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/EvidencePack.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$DraftEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/DraftEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$Scorecard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/Scorecard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$FormattedOutput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/FormattedOutput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$PostReview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/factory/PostReview.tsx [app-client] (ecmascript)");
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
;
;
;
function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function FactoryPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        sessionId: generateSessionId(),
        phase: "idle",
        percent: 0,
        rewriteCount: 0
    });
    const [running, setRunning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stateRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(state);
    stateRef.current = state;
    const callPipeline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FactoryPage.useCallback[callPipeline]": async (action, extraBody = {})=>{
            setRunning(true);
            abortRef.current = new AbortController();
            const snap = stateRef.current;
            try {
                const res = await fetch("/api/pipeline/stream", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action,
                        sessionId: snap.sessionId,
                        keys: {
                            claude: "__server_resolved__"
                        },
                        selectedTopic: snap.selectedTopic,
                        refinedTopic: snap.refinedTopic,
                        selectedTemplate: snap.selectedTemplate,
                        evidencePack: snap.evidencePack,
                        writerOutput: snap.writerOutput,
                        scoreResult: snap.scoreResult,
                        formattedPost: snap.formattedPost,
                        finalVersion: snap.finalVersion,
                        userFeedback: snap.userFeedback,
                        ...extraBody
                    }),
                    signal: abortRef.current.signal
                });
                if (!res.ok) {
                    let errorMsg = `Pipeline request failed (${res.status})`;
                    try {
                        const err = await res.json();
                        errorMsg = err.error || errorMsg;
                    } catch  {
                    // Response wasn't JSON, use status text
                    }
                    setState({
                        "FactoryPage.useCallback[callPipeline]": (prev)=>({
                                ...prev,
                                phase: "error",
                                error: errorMsg
                            })
                    }["FactoryPage.useCallback[callPipeline]"]);
                    return;
                }
                const reader = res.body?.getReader();
                if (!reader) return;
                const decoder = new TextDecoder();
                let buffer = "";
                while(true){
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, {
                        stream: true
                    });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";
                    for (const line of lines){
                        if (!line.startsWith("data: ")) continue;
                        const json = line.slice(6);
                        try {
                            const event = JSON.parse(json);
                            handleEvent(event);
                        } catch  {
                        // Skip malformed events
                        }
                    }
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    setState({
                        "FactoryPage.useCallback[callPipeline]": (prev)=>({
                                ...prev,
                                phase: "error",
                                error: String(err)
                            })
                    }["FactoryPage.useCallback[callPipeline]"]);
                }
            } finally{
                setRunning(false);
            }
        }
    }["FactoryPage.useCallback[callPipeline]"], // eslint-disable-next-line react-hooks/exhaustive-deps -- reads from stateRef.current
    []);
    const handleEvent = (event)=>{
        setState((prev)=>{
            const next = {
                ...prev,
                percent: event.percent
            };
            // Map step to phase
            if (event.step !== "pipeline" && event.step !== "guardrails") {
                const phaseMap = {
                    direction: "direction",
                    "discovery-research": "discovery",
                    "discovery-refine": "discovery",
                    discovery: "discovery",
                    evidence: "evidence",
                    writing: "writing",
                    scoring: "scoring",
                    formatting: "formatting",
                    learning: "learning"
                };
                next.phase = phaseMap[event.step] || prev.phase;
            }
            if (event.status === "error") {
                next.errorAtPhase = prev.phase !== "error" ? prev.phase : prev.errorAtPhase;
                next.phase = "error";
                next.error = event.data?.error || "Pipeline error";
            }
            // Capture phase outputs
            if (event.step === "direction" && event.data) {
                next.strategistOutput = event.data;
            }
            if (event.step === "discovery" && event.data) {
                const data = event.data;
                if (data.discoveryBrief) next.discoveryBrief = data.discoveryBrief;
                if (data.refinedTopic) next.refinedTopic = data.refinedTopic;
            }
            if (event.step === "discovery-research" && event.data) {
                next.discoveryBrief = event.data;
            }
            if (event.step === "evidence" && event.data) {
                next.evidencePack = event.data;
            }
            if (event.step === "writing" && event.data) {
                const data = event.data;
                if (data.content) next.writerOutput = data;
                if (data.rewriteAttempt) next.rewriteCount = data.rewriteAttempt - 1;
            }
            if (event.step === "guardrails" && event.guardrailResults) {
                next.guardrailResults = event.guardrailResults;
            }
            if (event.step === "scoring" && event.data) {
                next.scoreResult = event.data;
            }
            if (event.step === "formatting" && event.data) {
                next.formattedPost = event.data;
            }
            return next;
        });
    };
    // Pipeline controls
    const handleStart = ()=>callPipeline("start");
    const handleDiscover = ()=>callPipeline("discover");
    const handleEvidence = ()=>callPipeline("evidence");
    const handleWrite = ()=>callPipeline("write");
    const handleFormat = ()=>callPipeline("format");
    const handleLearn = (finalVersion, feedback)=>{
        setState((prev)=>({
                ...prev,
                finalVersion: finalVersion,
                userFeedback: feedback
            }));
        callPipeline("learn", {
            finalVersion,
            userFeedback: feedback
        });
    };
    const handleTopicSelect = (topic)=>{
        setState((prev)=>({
                ...prev,
                selectedTopic: topic
            }));
    };
    const handleApprove = (finalVersion, feedback)=>{
        handleLearn(finalVersion, feedback);
    };
    const handleReject = (feedback)=>{
        setState((prev)=>({
                ...prev,
                userFeedback: feedback,
                phase: "idle",
                percent: 0
            }));
    };
    const handleNewPost = ()=>{
        setState({
            sessionId: generateSessionId(),
            phase: "idle",
            percent: 0,
            rewriteCount: 0
        });
    };
    // Template selection for write phase
    const [templateInput, setTemplateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
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
                        children: "Content Factory"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this),
                    state.phase !== "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: handleNewPost,
                        children: "New Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 287,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this),
            state.phase !== "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$PipelineStepper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PipelineStepper"], {
                currentPhase: state.phase,
                percent: state.percent,
                errorAtPhase: state.errorAtPhase
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 295,
                columnNumber: 9
            }, this),
            state.phase === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-alert bru-alert--error",
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bru-alert__icon",
                        children: "!"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 308,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: state.error || "An error occurred"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                            lineNumber: 310,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 309,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        style: {
                            marginLeft: "var(--bru-space-3)",
                            flexShrink: 0
                        },
                        onClick: handleNewPost,
                        children: "Start Over"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 304,
                columnNumber: 9
            }, this),
            running && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-2)",
                    marginBottom: "var(--bru-space-4)",
                    color: "var(--bru-grey)",
                    fontSize: "var(--bru-text-sm)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 16,
                        className: "animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 336,
                        columnNumber: 11
                    }, this),
                    "Processing..."
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 326,
                columnNumber: 9
            }, this),
            state.phase === "idle" && !running && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h4)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-3)"
                        },
                        children: "Create a New Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 347,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            color: "var(--bru-grey)",
                            marginBottom: "var(--bru-space-6)",
                            maxWidth: 500,
                            margin: "0 auto var(--bru-space-6)"
                        },
                        children: "The Content Factory will guide you through an 8-phase AI pipeline: topic proposals, research, evidence, writing, scoring, formatting, review, and learning."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary",
                        onClick: handleStart,
                        disabled: running,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                lineNumber: 374,
                                columnNumber: 13
                            }, this),
                            "Start Pipeline"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 369,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 343,
                columnNumber: 9
            }, this),
            state.strategistOutput && (state.phase === "direction" || !running && !state.discoveryBrief && state.selectedTopic) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$TopicProposals$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TopicProposals"], {
                        output: state.strategistOutput,
                        onSelect: handleTopicSelect,
                        selectedTopic: state.selectedTopic
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 385,
                        columnNumber: 13
                    }, this),
                    state.selectedTopic && !running && state.phase === "direction" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-4)",
                            display: "flex",
                            justifyContent: "flex-end"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "bru-btn bru-btn--primary",
                            onClick: handleDiscover,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                    lineNumber: 402,
                                    columnNumber: 19
                                }, this),
                                "Research This Topic"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                            lineNumber: 398,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 391,
                        columnNumber: 15
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 384,
                columnNumber: 11
            }, this),
            state.discoveryBrief && (state.phase === "discovery" || state.phase === "evidence") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$ResearchBrief$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResearchBrief"], {
                        brief: state.discoveryBrief,
                        refinedTopic: state.refinedTopic
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 414,
                        columnNumber: 13
                    }, this),
                    !running && state.phase === "discovery" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-4)",
                            display: "flex",
                            justifyContent: "flex-end"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "bru-btn bru-btn--primary",
                            onClick: handleEvidence,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                    lineNumber: 430,
                                    columnNumber: 19
                                }, this),
                                "Gather Evidence"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                            lineNumber: 426,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 419,
                        columnNumber: 15
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 413,
                columnNumber: 11
            }, this),
            state.evidencePack && (state.phase === "evidence" || state.phase === "writing") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$EvidencePack$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EvidencePack"], {
                        evidence: state.evidencePack
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 442,
                        columnNumber: 13
                    }, this),
                    !running && state.phase === "evidence" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "var(--bru-space-4)",
                            display: "flex",
                            gap: "var(--bru-space-2)",
                            justifyContent: "flex-end",
                            alignItems: "center"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "bru-input",
                                placeholder: "Template name (optional)",
                                value: templateInput,
                                onChange: (e)=>{
                                    setTemplateInput(e.target.value);
                                    setState((prev)=>({
                                            ...prev,
                                            selectedTemplate: e.target.value
                                        }));
                                },
                                style: {
                                    width: 200
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                lineNumber: 453,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: handleWrite,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                        lineNumber: 470,
                                        columnNumber: 19
                                    }, this),
                                    "Write Draft"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                                lineNumber: 466,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 444,
                        columnNumber: 15
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 441,
                columnNumber: 11
            }, this),
            state.writerOutput && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gridTemplateColumns: state.scoreResult ? "1fr 1fr" : "1fr",
                    gap: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$DraftEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DraftEditor"], {
                        writerOutput: state.writerOutput,
                        guardrailResults: state.guardrailResults,
                        rewriteCount: state.rewriteCount
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 487,
                        columnNumber: 11
                    }, this),
                    state.scoreResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$Scorecard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scorecard"], {
                        score: state.scoreResult
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 492,
                        columnNumber: 33
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 480,
                columnNumber: 9
            }, this),
            state.scoreResult && !state.formattedPost && !running && (state.phase === "scoring" || state.phase === "writing") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-4)",
                    display: "flex",
                    justifyContent: "flex-end"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "bru-btn bru-btn--primary",
                    onClick: handleFormat,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                            lineNumber: 509,
                            columnNumber: 15
                        }, this),
                        "Format for LinkedIn"
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                    lineNumber: 508,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 501,
                columnNumber: 11
            }, this),
            state.formattedPost && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-4)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$FormattedOutput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FormattedOutput"], {
                    post: state.formattedPost
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                    lineNumber: 518,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 517,
                columnNumber: 9
            }, this),
            state.formattedPost && !running && state.phase !== "learning" && state.phase !== "complete" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: "var(--bru-space-4)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$factory$2f$PostReview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PostReview"], {
                    content: state.formattedPost.content,
                    onApprove: handleApprove,
                    onReject: handleReject
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                    lineNumber: 528,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 527,
                columnNumber: 11
            }, this),
            state.phase === "complete" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    textAlign: "center",
                    padding: "var(--bru-space-8)",
                    marginTop: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h4)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-3)"
                        },
                        children: "Post Complete"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 546,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            color: "var(--bru-grey)",
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Your post has been approved and learning signals captured."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 555,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary",
                        onClick: handleNewPost,
                        children: "Create Another Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                        lineNumber: 564,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
                lineNumber: 538,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/factory/page.tsx",
        lineNumber: 267,
        columnNumber: 5
    }, this);
}
_s(FactoryPage, "yvMrThTaUIzu5X05w4U2T8xqjro=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = FactoryPage;
var _c;
__turbopack_context__.k.register(_c, "FactoryPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_doctorpost-v12_f2788e96._.js.map