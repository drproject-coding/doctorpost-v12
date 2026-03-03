(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignalCounts",
    ()=>SignalCounts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
const SIGNAL_LABELS = {
    approval: "Approvals",
    rejection: "Rejections",
    edit: "Edits",
    "hook-rewrite": "Hook Rewrites",
    "tone-feedback": "Tone Feedback",
    "score-override": "Score Overrides"
};
function SignalCounts({ signals }) {
    const counts = signals.reduce((acc, s)=>{
        acc[s.signalType] = (acc[s.signalType] || 0) + 1;
        return acc;
    }, {});
    // Category breakdown
    const categories = signals.reduce((acc, s)=>{
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
    }, {});
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Signal Overview"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            signals.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    color: "var(--bru-grey)"
                },
                children: "No signals recorded yet. Signals are created when you approve, edit, or reject posts in the Content Factory."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                lineNumber: 49,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: "var(--bru-text-lg)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-3)"
                        },
                        children: [
                            signals.length,
                            " total signals"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: "var(--bru-space-2)",
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: Object.entries(SIGNAL_LABELS).map(([type, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-card bru-card--flat",
                                style: {
                                    padding: "var(--bru-space-2)",
                                    textAlign: "center"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "var(--bru-text-h4)",
                                            fontWeight: 700,
                                            color: "var(--bru-purple)"
                                        },
                                        children: counts[type] || 0
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                                        lineNumber: 86,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)"
                                        },
                                        children: label
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                                        lineNumber: 95,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, type, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                                lineNumber: 81,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "By Category"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)",
                            flexWrap: "wrap"
                        },
                        children: Object.entries(categories).sort(([, a], [, b])=>b - a).map(([cat, count])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "var(--bru-space-1) var(--bru-space-2)",
                                    border: "var(--bru-border)",
                                    fontSize: "var(--bru-text-xs)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: cat
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                                        lineNumber: 135,
                                        columnNumber: 19
                                    }, this),
                                    ": ",
                                    count
                                ]
                            }, cat, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                                lineNumber: 127,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_c = SignalCounts;
var _c;
__turbopack_context__.k.register(_c, "SignalCounts");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PatternList",
    ()=>PatternList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
/**
 * Detects recurring patterns by grouping signals by (category, signalType).
 * A pattern is "promotion ready" when it reaches 10+ occurrences.
 */ function detectPatterns(signals) {
    const groups = new Map();
    for (const s of signals){
        const key = `${s.category}::${s.signalType}`;
        const arr = groups.get(key) || [];
        arr.push(s);
        groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([key, sigs])=>{
        const [category, signalType] = key.split("::");
        const sorted = sigs.sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
            category,
            signalType,
            count: sigs.length,
            recentObservations: sorted.slice(0, 3).map((s)=>s.observation),
            promotionReady: sigs.length >= 10
        };
    }).sort((a, b)=>b.count - a.count);
}
function PatternList({ signals }) {
    const patterns = detectPatterns(signals);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Detected Patterns"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            patterns.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    color: "var(--bru-grey)"
                },
                children: "No patterns detected yet. Patterns emerge as you use the Content Factory and the learning agent records recurring signals."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-3)"
                },
                children: patterns.map((p, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--flat",
                        style: {
                            padding: "var(--bru-space-3)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--bru-space-2)",
                                    marginBottom: "var(--bru-space-2)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            padding: "0 4px",
                                            background: p.promotionReady ? "var(--bru-success, #00AA00)" : "var(--bru-purple)",
                                            color: "white"
                                        },
                                        children: p.promotionReady ? "Promotion Ready" : `${p.count} signals`
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                        lineNumber: 89,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "var(--bru-text-sm)",
                                            fontWeight: 700
                                        },
                                        children: p.category
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                        lineNumber: 103,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)"
                                        },
                                        children: p.signalType
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                        lineNumber: 108,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                lineNumber: 81,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "grid",
                                    gap: "var(--bru-space-1)"
                                },
                                children: p.recentObservations.map((obs, oi)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)",
                                            paddingLeft: "var(--bru-space-2)",
                                            borderLeft: "2px solid var(--bru-border-color, #e0e0e0)"
                                        },
                                        children: obs
                                    }, `obs-${idx}-${oi}`, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                        lineNumber: 121,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                lineNumber: 119,
                                columnNumber: 15
                            }, this),
                            !p.promotionReady && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: "var(--bru-space-2)",
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    p.count,
                                    "/10 signals toward rule promotion",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            width: "100%",
                                            height: 4,
                                            background: "var(--bru-border-color, #e0e0e0)",
                                            marginTop: 4
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                width: `${Math.min(100, p.count / 10 * 100)}%`,
                                                height: "100%",
                                                background: "var(--bru-purple)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                            lineNumber: 153,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                        lineNumber: 145,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                                lineNumber: 137,
                                columnNumber: 17
                            }, this)
                        ]
                    }, `${p.category}::${p.signalType}`, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                        lineNumber: 76,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
                lineNumber: 74,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c = PatternList;
var _c;
__turbopack_context__.k.register(_c, "PatternList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RuleProposalCard",
    ()=>RuleProposalCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function RuleProposalCard({ proposal, onUpdateStatus }) {
    _s();
    const [updating, setUpdating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showDiff, setShowDiff] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleAction = async (status)=>{
        setUpdating(true);
        setError(null);
        try {
            await onUpdateStatus(proposal.id, status);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
        } finally{
            setUpdating(false);
        }
    };
    const isPending = proposal.status === "pending";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--flat",
        style: {
            padding: "var(--bru-space-3)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bru-space-2)"
                },
                children: [
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
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    padding: "0 4px",
                                    background: proposal.status === "approved" ? "var(--bru-success, #00AA00)" : proposal.status === "rejected" ? "var(--bru-error, #FF4444)" : "var(--bru-purple)",
                                    color: "white"
                                },
                                children: proposal.status
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-sm)",
                                    fontWeight: 700
                                },
                                children: proposal.proposalType
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: [
                                    "Target: ",
                                    proposal.targetDocument
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: "var(--bru-text-xs)",
                            color: "var(--bru-grey)"
                        },
                        children: [
                            "Confidence: ",
                            Math.round(proposal.confidence * 100),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    marginBottom: "var(--bru-space-2)"
                },
                children: proposal.reasoning
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    marginBottom: "var(--bru-space-2)"
                },
                children: [
                    "Based on ",
                    proposal.evidenceSignals.length,
                    " signal",
                    proposal.evidenceSignals.length !== 1 ? "s" : ""
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "bru-btn bru-btn--ghost",
                onClick: ()=>setShowDiff(!showDiff),
                style: {
                    fontSize: "var(--bru-text-xs)",
                    marginBottom: showDiff ? "var(--bru-space-2)" : 0
                },
                children: showDiff ? "Hide diff" : "Show diff"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            showDiff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-2)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    fontWeight: 700,
                                    marginBottom: 4,
                                    color: "var(--bru-error, #FF4444)"
                                },
                                children: "Current"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    background: "rgba(255, 68, 68, 0.08)",
                                    padding: "var(--bru-space-2)",
                                    border: "var(--bru-border)",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    margin: 0
                                },
                                children: proposal.currentContent || "(empty)"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    fontWeight: 700,
                                    marginBottom: 4,
                                    color: "var(--bru-success, #00AA00)"
                                },
                                children: "Proposed"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    background: "rgba(0, 170, 0, 0.08)",
                                    padding: "var(--bru-space-2)",
                                    border: "var(--bru-border)",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    margin: 0
                                },
                                children: proposal.proposedContent
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 166,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 129,
                columnNumber: 9
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-alert bru-alert--error",
                style: {
                    marginTop: "var(--bru-space-2)",
                    padding: "var(--bru-space-2) var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bru-alert__icon",
                        children: "!"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 192,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            style: {
                                fontSize: "var(--bru-text-xs)"
                            },
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                            lineNumber: 194,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 185,
                columnNumber: 9
            }, this),
            isPending && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: "var(--bru-space-2)",
                    marginTop: "var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "bru-btn bru-btn--primary",
                        disabled: updating,
                        onClick: ()=>handleAction("approved"),
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this),
                            " Approve"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "bru-btn",
                        disabled: updating,
                        onClick: ()=>handleAction("rejected"),
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                                lineNumber: 239,
                                columnNumber: 13
                            }, this),
                            " Reject"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                        lineNumber: 227,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
                lineNumber: 206,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(RuleProposalCard, "WOFkTOKFAHAy00HW+aI3QemirIE=");
_c = RuleProposalCard;
var _c;
__turbopack_context__.k.register(_c, "RuleProposalCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FeedbackHistory",
    ()=>FeedbackHistory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function FeedbackHistory({ signals }) {
    _s();
    const [filterType, setFilterType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const sorted = [
        ...signals
    ].sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const signalTypes = Array.from(new Set(signals.map((s)=>s.signalType)));
    const filtered = filterType === "all" ? sorted : sorted.filter((s)=>s.signalType === filterType);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
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
                        children: "Feedback History"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    signalTypes.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "bru-input",
                        value: filterType,
                        onChange: (e)=>setFilterType(e.target.value),
                        style: {
                            width: "auto",
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "all",
                                children: "All types"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this),
                            signalTypes.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: t,
                                    children: t
                                }, t, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                    lineNumber: 53,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                        lineNumber: 45,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: "var(--bru-text-sm)",
                    color: "var(--bru-grey)"
                },
                children: "No feedback entries yet."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-2)"
                },
                children: filtered.map((signal, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "100px 80px 1fr",
                            gap: "var(--bru-space-2)",
                            padding: "var(--bru-space-2)",
                            borderBottom: "1px solid var(--bru-border-color, #e0e0e0)",
                            alignItems: "start"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-grey)"
                                },
                                children: new Date(signal.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric"
                                })
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                lineNumber: 85,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    padding: "0 4px",
                                    background: "var(--bru-purple)",
                                    color: "white",
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                },
                                children: signal.signalType
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                lineNumber: 98,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "var(--bru-text-sm)"
                                        },
                                        children: signal.observation
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                        lineNumber: 117,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "var(--bru-text-xs)",
                                            color: "var(--bru-grey)",
                                            marginTop: 2
                                        },
                                        children: [
                                            signal.category,
                                            signal.sessionId && ` · Session: ${signal.sessionId.slice(0, 8)}…`
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                        lineNumber: 120,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                                lineNumber: 116,
                                columnNumber: 15
                            }, this)
                        ]
                    }, signal.id, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                        lineNumber: 73,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
                lineNumber: 71,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(FeedbackHistory, "PnSpPjjlelVbMsNefiJeeR6GwIY=");
_c = FeedbackHistory;
var _c;
__turbopack_context__.k.register(_c, "FeedbackHistory");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LearningPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$SignalCounts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/learning/SignalCounts.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$PatternList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/learning/PatternList.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$RuleProposal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/learning/RuleProposal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$FeedbackHistory$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/learning/FeedbackHistory.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/knowledge/types.ts [app-client] (ecmascript)");
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
function LearningPage() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("overview");
    const [signals, setSignals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [proposals, setProposals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LearningPage.useCallback[fetchData]": async ()=>{
            setLoading(true);
            setError(null);
            try {
                const [sigRes, propRes] = await Promise.all([
                    fetch("/api/knowledge/read/signals", {
                        credentials: "include"
                    }),
                    fetch("/api/knowledge/read/rule_proposals", {
                        credentials: "include"
                    })
                ]);
                if (sigRes.ok) {
                    const data = await sigRes.json();
                    const rows = Array.isArray(data) ? data : data.data || data.rows || [];
                    setSignals(rows.map(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapSignalFromNcb"]));
                } else if (sigRes.status !== 404) {
                    setError(`Failed to load signals (${sigRes.status})`);
                }
                if (propRes.ok) {
                    const data = await propRes.json();
                    const rows = Array.isArray(data) ? data : data.data || data.rows || [];
                    setProposals(rows.map(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapRuleProposalFromNcb"]));
                } else if (propRes.status !== 404) {
                    setError({
                        "LearningPage.useCallback[fetchData]": (prev)=>prev ? `${prev} Failed to load proposals (${propRes.status})` : `Failed to load proposals (${propRes.status})`
                    }["LearningPage.useCallback[fetchData]"]);
                }
            } catch  {
                setError("Failed to load learning data. Please refresh the page.");
            } finally{
                setLoading(false);
            }
        }
    }["LearningPage.useCallback[fetchData]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LearningPage.useEffect": ()=>{
            fetchData();
        }
    }["LearningPage.useEffect"], [
        fetchData
    ]);
    const handleUpdateProposalStatus = async (id, status)=>{
        const res = await fetch(`/api/knowledge/update/rule_proposals/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status
            })
        });
        if (!res.ok) {
            throw new Error("Failed to update proposal status");
        }
        const data = await res.json();
        const updated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$knowledge$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapRuleProposalFromNcb"])(data);
        setProposals((prev)=>prev.map((p)=>p.id === id ? updated : p));
    };
    const pendingProposals = proposals.filter((p)=>p.status === "pending");
    const resolvedProposals = proposals.filter((p)=>p.status !== "pending");
    const tabs = [
        {
            key: "overview",
            label: "Overview"
        },
        {
            key: "proposals",
            label: "Rule Proposals",
            count: pendingProposals.length
        },
        {
            key: "history",
            label: "Feedback History"
        }
    ];
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
                        children: "Learning"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: fetchData,
                        disabled: loading,
                        children: loading ? "Loading..." : "Refresh"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 109,
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
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                            lineNumber: 139,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 138,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 133,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: "var(--bru-space-2)",
                    marginBottom: "var(--bru-space-4)",
                    borderBottom: "1px solid var(--bru-border-color, #e0e0e0)",
                    paddingBottom: "var(--bru-space-2)"
                },
                children: tabs.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `bru-btn ${tab === t.key ? "bru-btn--primary" : "bru-btn--ghost"}`,
                        onClick: ()=>setTab(t.key),
                        style: {
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            t.label,
                            t.count !== undefined && t.count > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    marginLeft: 4,
                                    padding: "0 6px",
                                    background: tab === t.key ? "white" : "var(--bru-purple)",
                                    color: tab === t.key ? "var(--bru-purple)" : "white",
                                    fontSize: "var(--bru-text-xs)",
                                    fontWeight: 700
                                },
                                children: t.count
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                lineNumber: 163,
                                columnNumber: 15
                            }, this)
                        ]
                    }, t.key, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            tab === "overview" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$SignalCounts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SignalCounts"], {
                        signals: signals
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 183,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$PatternList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PatternList"], {
                        signals: signals
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 184,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 182,
                columnNumber: 9
            }, this),
            tab === "proposals" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-4)"
                },
                children: [
                    pendingProposals.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: "var(--bru-text-md)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-2)"
                                },
                                children: [
                                    "Pending (",
                                    pendingProposals.length,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                lineNumber: 192,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "grid",
                                    gap: "var(--bru-space-2)"
                                },
                                children: pendingProposals.map((p, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$RuleProposal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RuleProposalCard"], {
                                        proposal: p,
                                        onUpdateStatus: handleUpdateProposalStatus
                                    }, p.id, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                        lineNumber: 203,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                lineNumber: 201,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 191,
                        columnNumber: 13
                    }, this),
                    resolvedProposals.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: "var(--bru-text-md)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-2)"
                                },
                                children: [
                                    "Resolved (",
                                    resolvedProposals.length,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                lineNumber: 215,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "grid",
                                    gap: "var(--bru-space-2)"
                                },
                                children: resolvedProposals.map((p, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$RuleProposal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RuleProposalCard"], {
                                        proposal: p,
                                        onUpdateStatus: handleUpdateProposalStatus
                                    }, p.id, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                        lineNumber: 226,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                                lineNumber: 224,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 214,
                        columnNumber: 13
                    }, this),
                    proposals.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            color: "var(--bru-grey)"
                        },
                        children: "No rule proposals yet. Proposals are created when the learning agent detects patterns that have reached the 10-signal threshold."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                        lineNumber: 237,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 189,
                columnNumber: 9
            }, this),
            tab === "history" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$learning$2f$FeedbackHistory$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeedbackHistory"], {
                signals: signals
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
                lineNumber: 250,
                columnNumber: 29
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/learning/page.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_s(LearningPage, "hMZoauSD4kAsRNr6nIUU5UpRBIU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = LearningPage;
var _c;
__turbopack_context__.k.register(_c, "LearningPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Check
]);
/**
 * lucide-react v0.0.1 - ISC
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const Check = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Check", [
    [
        "polyline",
        {
            points: "20 6 9 17 4 12",
            key: "10jjfj"
        }
    ]
]);
;
 //# sourceMappingURL=check.mjs.map
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript) <export default as Check>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Check",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-client] (ecmascript)");
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>X
]);
/**
 * lucide-react v0.0.1 - ISC
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const X = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("X", [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
]);
;
 //# sourceMappingURL=x.mjs.map
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "X",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=Desktop_doctorpost-v12_badb708a._.js.map