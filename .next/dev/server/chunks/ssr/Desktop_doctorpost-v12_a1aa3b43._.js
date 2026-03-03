module.exports = [
"[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CampaignSetup",
    ()=>CampaignSetup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/minus.mjs [app-ssr] (ecmascript) <export default as Minus>");
"use client";
;
;
;
const DEFAULT_PILLARS = [
    "Authority",
    "Engagement",
    "Trust",
    "Education",
    "Personal"
];
function CampaignSetup({ onSubmit, disabled }) {
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [durationWeeks, setDurationWeeks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(4);
    const [postsPerWeek, setPostsPerWeek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(3);
    const [goals, setGoals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [startDate, setStartDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Date().toISOString().split("T")[0]);
    const [pillars, setPillars] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        const initial = {};
        DEFAULT_PILLARS.forEach((p)=>initial[p] = 20);
        return initial;
    });
    const [newPillar, setNewPillar] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const totalWeight = Object.values(pillars).reduce((s, v)=>s + v, 0);
    const handlePillarWeight = (pillar, value)=>{
        setPillars((prev)=>({
                ...prev,
                [pillar]: Math.max(0, Math.min(100, value))
            }));
    };
    const addPillar = ()=>{
        if (!newPillar.trim() || pillars[newPillar]) return;
        setPillars((prev)=>({
                ...prev,
                [newPillar.trim()]: 10
            }));
        setNewPillar("");
    };
    const removePillar = (pillar)=>{
        setPillars((prev)=>{
            const next = {
                ...prev
            };
            delete next[pillar];
            return next;
        });
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        onSubmit({
            name,
            durationWeeks,
            postsPerWeek,
            goals,
            pillarWeights: pillars,
            startDate
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "New Campaign"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-form-stack",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: "Campaign Name"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "bru-input",
                                value: name,
                                onChange: (e)=>setName(e.target.value),
                                placeholder: "e.g. Q2 2026 Authority Building",
                                required: true
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 92,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Duration (weeks)"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 103,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        type: "number",
                                        min: 1,
                                        max: 52,
                                        step: 1,
                                        value: durationWeeks,
                                        onChange: (e)=>setDurationWeeks(Number(e.target.value))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Posts per week"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 115,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        type: "number",
                                        min: 1,
                                        max: 7,
                                        step: 1,
                                        value: postsPerWeek,
                                        onChange: (e)=>setPostsPerWeek(Number(e.target.value))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 116,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 114,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Start Date"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 127,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        type: "date",
                                        value: startDate,
                                        onChange: (e)=>setStartDate(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 128,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: "Goals"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "bru-input",
                                value: goals,
                                onChange: (e)=>setGoals(e.target.value),
                                placeholder: "What do you want to achieve with this campaign?",
                                style: {
                                    minHeight: 80
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: [
                                    "Pillar Weights (total: ",
                                    totalWeight,
                                    "%)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            totalWeight !== 100 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "var(--bru-text-xs)",
                                    color: "var(--bru-error-dark)",
                                    marginBottom: "var(--bru-space-2)"
                                },
                                children: "Weights should sum to 100%"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 154,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "grid",
                                    gap: "var(--bru-space-2)"
                                },
                                children: [
                                    Object.entries(pillars).map(([pillar, weight])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "var(--bru-space-2)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        width: 120,
                                                        fontSize: "var(--bru-text-sm)",
                                                        fontWeight: 500
                                                    },
                                                    children: pillar
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                    lineNumber: 174,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    className: "bru-input",
                                                    type: "number",
                                                    min: 0,
                                                    max: 100,
                                                    value: weight,
                                                    onChange: (e)=>handlePillarWeight(pillar, Number(e.target.value)),
                                                    style: {
                                                        width: 70
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                    lineNumber: 183,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: "var(--bru-text-xs)",
                                                        color: "var(--bru-grey)"
                                                    },
                                                    children: "%"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                    lineNumber: 194,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bru-btn bru-btn--ghost",
                                                    onClick: ()=>removePillar(pillar),
                                                    style: {
                                                        padding: 2
                                                    },
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__["Minus"], {
                                                        size: 12
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                        lineNumber: 208,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                    lineNumber: 202,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, pillar, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                            lineNumber: 166,
                                            columnNumber: 15
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "bru-input",
                                                value: newPillar,
                                                onChange: (e)=>setNewPillar(e.target.value),
                                                placeholder: "New pillar...",
                                                style: {
                                                    width: 120
                                                },
                                                onKeyDown: (e)=>{
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addPillar();
                                                    }
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                lineNumber: 220,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "bru-btn bru-btn--ghost",
                                                onClick: addPillar,
                                                style: {
                                                    padding: 2
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                    size: 12
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                    lineNumber: 239,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                                lineNumber: 233,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                        lineNumber: 213,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: "var(--bru-text-sm)",
                            color: "var(--bru-grey)",
                            padding: "var(--bru-space-2)",
                            background: "var(--bru-cream)",
                            border: "var(--bru-border)"
                        },
                        children: [
                            "Total posts: ",
                            durationWeeks * postsPerWeek
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-form-actions",
                style: {
                    marginTop: "var(--bru-space-4)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "submit",
                    className: "bru-btn bru-btn--primary",
                    disabled: disabled || !name.trim() || totalWeight !== 100,
                    children: "Create Campaign"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                    lineNumber: 262,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CampaignCalendar",
    ()=>CampaignCalendar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function CampaignCalendar({ slots, durationWeeks, postsPerWeek }) {
    // Group slots by week
    const weeks = [];
    for(let w = 1; w <= durationWeeks; w++){
        weeks.push(slots.filter((s)=>s.weekNumber === w));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Campaign Calendar"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "var(--bru-space-3)"
                },
                children: weeks.map((weekSlots, wi)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                style: {
                                    fontSize: "var(--bru-text-md)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-2)"
                                },
                                children: [
                                    "Week ",
                                    wi + 1
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                lineNumber: 37,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${postsPerWeek}, 1fr)`,
                                    gap: "var(--bru-space-2)"
                                },
                                children: weekSlots.length > 0 ? weekSlots.map((slot, si)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-card bru-card--flat",
                                        style: {
                                            padding: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontSize: "var(--bru-text-xs)",
                                                    color: "var(--bru-grey)",
                                                    marginBottom: "var(--bru-space-1)"
                                                },
                                                children: new Date(slot.slotDate + "T00:00:00").toLocaleDateString(undefined, {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric"
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                                lineNumber: 60,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontSize: "var(--bru-text-sm)",
                                                    fontWeight: 700,
                                                    marginBottom: "var(--bru-space-1)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                },
                                                children: slot.topicCard.headline
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                                lineNumber: 75,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    gap: "var(--bru-space-1)",
                                                    flexWrap: "wrap"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-xs)",
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            padding: "0 4px",
                                                            background: "var(--bru-purple)",
                                                            color: "white"
                                                        },
                                                        children: slot.topicCard.pillar
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                                        lineNumber: 94,
                                                        columnNumber: 25
                                                    }, this),
                                                    slot.topicCard.templateRecommendation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-xs)",
                                                            color: "var(--bru-grey)"
                                                        },
                                                        children: slot.topicCard.templateRecommendation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                                        lineNumber: 107,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                                lineNumber: 87,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, `slot-${wi}-${si}`, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                        lineNumber: 55,
                                        columnNumber: 21
                                    }, this)) : Array.from({
                                    length: postsPerWeek
                                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            padding: "var(--bru-space-2)",
                                            border: "1px dashed var(--bru-grey)",
                                            textAlign: "center",
                                            color: "var(--bru-grey)",
                                            fontSize: "var(--bru-text-xs)"
                                        },
                                        children: "Pending"
                                    }, `empty-${wi}-${i}`, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                        lineNumber: 120,
                                        columnNumber: 21
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        ]
                    }, `week-${wi}`, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchProgress",
    ()=>BatchProgress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-circle.mjs [app-ssr] (ecmascript) <export default as AlertCircle>");
"use client";
;
;
function BatchProgress({ phase, slotsPlanned, totalSlots, error, pillarDistribution }) {
    const progressPercent = totalSlots > 0 ? Math.round(slotsPlanned / totalSlots * 100) : 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    fontSize: "var(--bru-text-h5)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-4)"
                },
                children: "Campaign Progress"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: "100%",
                    height: 8,
                    background: "var(--bru-border-color, #e0e0e0)",
                    marginBottom: "var(--bru-space-3)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: phase === "error" ? "var(--bru-error, #FF4444)" : phase === "complete" ? "var(--bru-success, #00AA00)" : "var(--bru-purple)",
                        transition: "width 0.3s ease"
                    }
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-2)",
                    marginBottom: "var(--bru-space-3)"
                },
                children: [
                    phase === "complete" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                        size: 16,
                        style: {
                            color: "var(--bru-success, #00AA00)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, this) : phase === "error" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        size: 16,
                        style: {
                            color: "var(--bru-error, #FF4444)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this) : phase !== "idle" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 16,
                        className: "animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 500
                        },
                        children: [
                            phase === "idle" && "Ready to start",
                            phase === "creating" && "Creating campaign...",
                            phase === "planning" && "AI is planning topics...",
                            phase === "saving" && `Saving slots (${slotsPlanned}/${totalSlots})...`,
                            phase === "complete" && `Complete! ${slotsPlanned} posts planned.`,
                            phase === "error" && "An error occurred"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-alert bru-alert--error",
                style: {
                    marginBottom: "var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bru-alert__icon",
                        children: "!"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                            lineNumber: 102,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 101,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                lineNumber: 96,
                columnNumber: 9
            }, this),
            phase === "complete" && pillarDistribution && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        style: {
                            fontSize: "var(--bru-text-md)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Pillar Distribution"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "var(--bru-space-2)",
                            flexWrap: "wrap"
                        },
                        children: Object.entries(pillarDistribution).map(([pillar, count])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "var(--bru-space-1) var(--bru-space-2)",
                                    border: "var(--bru-border)",
                                    fontSize: "var(--bru-text-xs)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: pillar
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                                        lineNumber: 135,
                                        columnNumber: 17
                                    }, this),
                                    ": ",
                                    count
                                ]
                            }, pillar, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                                lineNumber: 127,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                        lineNumber: 119,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CampaignsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$CampaignSetup$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/campaigns/CampaignSetup.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$CampaignCalendar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/campaigns/CampaignCalendar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$BatchProgress$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/campaigns/BatchProgress.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function CampaignsPage() {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [slots, setSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [totalSlots, setTotalSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])();
    const [pillarDistribution, setPillarDistribution] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])();
    const [config, setConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Abort SSE stream on unmount
    __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useEffect(()=>{
        return ()=>{
            abortRef.current?.abort();
        };
    }, []);
    const handleSubmit = async (cfg)=>{
        setConfig(cfg);
        setPhase("creating");
        setSlots([]);
        setError(undefined);
        setTotalSlots(cfg.durationWeeks * cfg.postsPerWeek);
        abortRef.current = new AbortController();
        try {
            const res = await fetch("/api/campaign", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...cfg,
                    keys: {
                        claude: "__server_resolved__"
                    }
                }),
                signal: abortRef.current.signal
            });
            if (!res.ok) {
                let errorMsg = `Campaign creation failed (${res.status})`;
                try {
                    const err = await res.json();
                    errorMsg = err.error || errorMsg;
                } catch  {
                // not JSON
                }
                setPhase("error");
                setError(errorMsg);
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
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";
                for (const part of parts){
                    const lines = part.split("\n");
                    let eventType = "";
                    let data = "";
                    for (const line of lines){
                        if (line.startsWith("event: ")) eventType = line.slice(7);
                        if (line.startsWith("data: ")) data += (data ? "\n" : "") + line.slice(6);
                    }
                    if (!data) continue;
                    try {
                        const parsed = JSON.parse(data);
                        switch(eventType){
                            case "status":
                                if (parsed.phase) setPhase(parsed.phase);
                                if (parsed.slotsCount) setTotalSlots(parsed.slotsCount);
                                break;
                            case "slot":
                                setSlots((prev)=>[
                                        ...prev,
                                        parsed
                                    ]);
                                break;
                            case "complete":
                                setPhase("complete");
                                if (parsed.pillarDistribution) setPillarDistribution(parsed.pillarDistribution);
                                break;
                            case "error":
                                setPhase("error");
                                setError(parsed.message);
                                break;
                        }
                    } catch  {
                    // Skip malformed events
                    }
                }
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                setPhase("error");
                setError(String(err));
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            fontSize: "var(--bru-text-h3)",
                            fontWeight: 700,
                            margin: 0
                        },
                        children: "Campaigns"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this),
                    phase !== "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn",
                        onClick: ()=>{
                            setPhase("idle");
                            setSlots([]);
                            setConfig(null);
                            setError(undefined);
                        },
                        children: "New Campaign"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            phase === "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$CampaignSetup$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CampaignSetup"], {
                onSubmit: handleSubmit
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                lineNumber: 169,
                columnNumber: 28
            }, this),
            phase !== "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$BatchProgress$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchProgress"], {
                    phase: phase,
                    slotsPlanned: slots.length,
                    totalSlots: totalSlots,
                    error: error,
                    pillarDistribution: pillarDistribution
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                    lineNumber: 174,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                lineNumber: 173,
                columnNumber: 9
            }, this),
            slots.length > 0 && config && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$campaigns$2f$CampaignCalendar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CampaignCalendar"], {
                slots: slots,
                durationWeeks: config.durationWeeks,
                postsPerWeek: config.postsPerWeek
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
                lineNumber: 186,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/campaigns/page.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/minus.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Minus
]);
/**
 * lucide-react v0.0.1 - ISC
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-ssr] (ecmascript)");
;
const Minus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Minus", [
    [
        "path",
        {
            d: "M5 12h14",
            key: "1ays0h"
        }
    ]
]);
;
 //# sourceMappingURL=minus.mjs.map
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/minus.mjs [app-ssr] (ecmascript) <export default as Minus>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Minus",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/minus.mjs [app-ssr] (ecmascript)");
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Check
]);
/**
 * lucide-react v0.0.1 - ISC
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-ssr] (ecmascript)");
;
const Check = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Check", [
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
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Check",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript)");
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-circle.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AlertCircle
]);
/**
 * lucide-react v0.0.1 - ISC
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-ssr] (ecmascript)");
;
const AlertCircle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("AlertCircle", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "8",
            y2: "12",
            key: "1pkeuh"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12.01",
            y1: "16",
            y2: "16",
            key: "4dfq90"
        }
    ]
]);
;
 //# sourceMappingURL=alert-circle.mjs.map
}),
"[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-circle.mjs [app-ssr] (ecmascript) <export default as AlertCircle>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlertCircle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-circle.mjs [app-ssr] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_doctorpost-v12_a1aa3b43._.js.map