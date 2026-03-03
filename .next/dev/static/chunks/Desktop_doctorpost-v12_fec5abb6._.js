(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callClaude",
    ()=>callClaude,
    "validateClaudeKey",
    ()=>validateClaudeKey
]);
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 4096;
async function validateClaudeKey(apiKey) {
    const response = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            max_tokens: 1,
            messages: [
                {
                    role: "user",
                    content: "hi"
                }
            ]
        })
    });
    if (!response.ok) {
        const body = await response.text();
        if (response.status === 401) throw new Error("Invalid API key");
        if (response.status === 403) throw new Error("API key lacks permission");
        throw new Error(`Validation failed (${response.status}): ${body}`);
    }
}
async function callClaude(request, apiKey, onProgress, signal) {
    onProgress?.({
        step: "Preparing request...",
        percent: 0
    });
    onProgress?.({
        step: "Sending to Claude...",
        percent: 20
    });
    const response = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
            system: request.systemPrompt,
            messages: [
                {
                    role: "user",
                    content: request.userMessage
                }
            ]
        }),
        signal
    });
    onProgress?.({
        step: "Processing response...",
        percent: 80
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errorBody}`);
    }
    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
        throw new Error("Claude API returned an empty response");
    }
    onProgress?.({
        step: "Response received",
        percent: 100
    });
    return {
        content: text,
        provider: "claude"
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callOneForAll",
    ()=>callOneForAll,
    "validateOneForAllKey",
    ()=>validateOneForAllKey
]);
const PROXY_URL = "/api/oneforall";
const DEFAULT_MAX_TOKENS = 4096;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;
const MAX_CONSECUTIVE_FAILURES = 3;
async function validateOneForAllKey(apiKey) {
    const response = await fetch(`${PROXY_URL}?action=send-request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-oneforall-key": apiKey
        },
        body: JSON.stringify({
            title: "Key validation",
            system_prompt: "Reply with ok",
            message: "ok",
            model: "gpt-4.1-nano",
            max_tokens: 1
        })
    });
    if (!response.ok) {
        const body = await response.text();
        if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid API key");
        }
        throw new Error(`Validation failed (${response.status}): ${body}`);
    }
}
async function callOneForAll(request, apiKey, model, onProgress, signal) {
    // Step 1: Submit the request
    onProgress?.({
        step: "Submitting request to 1ForAll...",
        percent: 0
    });
    const submitResponse = await fetch(`${PROXY_URL}?action=send-request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-oneforall-key": apiKey
        },
        body: JSON.stringify({
            title: "DoctorPost content generation",
            system_prompt: request.systemPrompt,
            message: request.userMessage,
            model: model,
            max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS
        }),
        signal
    });
    if (!submitResponse.ok) {
        const errorBody = await submitResponse.text();
        throw new Error(`1ForAll submit error (${submitResponse.status}): ${errorBody}`);
    }
    const submitData = await submitResponse.json();
    // Some models respond immediately without a code_ref
    if (!submitData.code_ref && submitData.response) {
        onProgress?.({
            step: "Response received",
            percent: 100
        });
        return {
            content: submitData.response,
            provider: "1forall"
        };
    }
    const codeRef = submitData.code_ref;
    if (!codeRef) {
        throw new Error("1ForAll API did not return a code_ref or immediate response");
    }
    // Step 2: Poll for completion
    onProgress?.({
        step: "Request submitted. Polling for result...",
        percent: 10
    });
    const startTime = Date.now();
    let consecutiveFailures = 0;
    while(Date.now() - startTime < POLL_TIMEOUT_MS){
        await sleep(POLL_INTERVAL_MS, signal);
        let statusResult;
        try {
            const statusResponse = await fetch(`${PROXY_URL}?action=check-status&code_ref=${encodeURIComponent(codeRef)}`, {
                method: "GET",
                headers: {
                    "x-oneforall-key": apiKey
                },
                signal
            });
            if (!statusResponse.ok) {
                throw new Error(`Poll request failed (${statusResponse.status})`);
            }
            statusResult = await statusResponse.json();
            consecutiveFailures = 0;
        } catch (error) {
            if (signal?.aborted) throw error;
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                throw new Error(`1ForAll polling failed after ${MAX_CONSECUTIVE_FAILURES} consecutive errors: ${error instanceof Error ? error.message : String(error)}`);
            }
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const pct = Math.min(90, 10 + elapsed / (POLL_TIMEOUT_MS / 1000) * 80);
            onProgress?.({
                step: `Poll attempt failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}), retrying...`,
                percent: pct
            });
            continue;
        }
        if (statusResult.status === "completed") {
            onProgress?.({
                step: "Response received",
                percent: 100
            });
            return {
                content: statusResult.response,
                provider: "1forall"
            };
        }
        if (statusResult.status === "error") {
            throw new Error(`1ForAll processing error: ${statusResult.error || "Unknown error"}`);
        }
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const pct = Math.min(90, 10 + elapsed / (POLL_TIMEOUT_MS / 1000) * 80);
        onProgress?.({
            step: `Processing... (${elapsed}s elapsed)`,
            percent: pct
        });
    }
    throw new Error(`1ForAll polling timed out after ${POLL_TIMEOUT_MS / 1000} seconds`);
}
function sleep(ms, signal) {
    return new Promise((resolve, reject)=>{
        if (signal?.aborted) return reject(signal.reason);
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener("abort", ()=>{
            clearTimeout(timer);
            reject(signal.reason);
        }, {
            once: true
        });
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/ai/aiService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateViaServer",
    ()=>generateViaServer,
    "generateWithAi",
    ()=>generateWithAi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-client] (ecmascript)");
;
;
async function generateViaServer(request, signal) {
    const res = await fetch("/api/ai", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            request
        }),
        signal
    });
    if (!res.ok) {
        let msg = `AI request failed (${res.status})`;
        try {
            const err = await res.json();
            msg = err.error || msg;
        } catch  {
        // not JSON
        }
        throw new Error(msg);
    }
    return res.json();
}
async function generateWithAi(request, settings, onProgress, signal) {
    switch(settings.activeProvider){
        case "claude":
            {
                if (!settings.claudeApiKey) {
                    throw new Error("Claude API key is not configured. Please add your Claude API key in Settings.");
                }
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callClaude"])(request, settings.claudeApiKey, onProgress, signal);
            }
        case "1forall":
            {
                if (!settings.oneforallApiKey) {
                    throw new Error("1ForAll API key is not configured. Please add your 1ForAll API key in Settings.");
                }
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callOneForAll"])(request, settings.oneforallApiKey, settings.oneforallModel, onProgress, signal);
            }
        case "straico":
            {
                if (!settings.straicoApiKey) {
                    throw new Error("Straico API key is not configured. Please add your Straico API key in Settings.");
                }
                const { callStraico } = await __turbopack_context__.A("[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-client] (ecmascript, async loader)");
                return callStraico(request, settings.straicoApiKey, settings.straicoModel, onProgress, signal);
            }
        default:
            throw new Error(`Unsupported AI provider: ${settings.activeProvider}`);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG",
    ()=>CONFIG,
    "extractAuthCookies",
    ()=>extractAuthCookies,
    "extractRows",
    ()=>extractRows,
    "fetchUserProfile",
    ()=>fetchUserProfile,
    "getSessionUser",
    ()=>getSessionUser,
    "proxyToNCB",
    ()=>proxyToNCB
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-client] (ecmascript)");
;
function extractRows(json) {
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
        const obj = json;
        if (Array.isArray(obj.data)) return obj.data;
        if (Array.isArray(obj.rows)) return obj.rows;
    }
    return [];
}
const CONFIG = {
    instance: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NCB_INSTANCE,
    dataApiUrl: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NCB_DATA_API_URL,
    authApiUrl: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NCB_AUTH_API_URL,
    appUrl: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NCB_APP_URL || "https://app.nocodebackend.com"
};
function extractAuthCookies(cookieHeader) {
    if (!cookieHeader) return "";
    const cookies = cookieHeader.split(";");
    const authCookies = [];
    for (const cookie of cookies){
        const trimmed = cookie.trim();
        if (trimmed.startsWith("better-auth.session_token=") || trimmed.startsWith("better-auth.session_data=")) {
            authCookies.push(trimmed);
        }
    }
    return authCookies.join("; ");
}
async function getSessionUser(cookieHeader) {
    const authCookies = extractAuthCookies(cookieHeader);
    if (!authCookies) return null;
    const url = `${CONFIG.authApiUrl}/get-session?instance=${CONFIG.instance}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Database-Instance": CONFIG.instance,
            Cookie: authCookies
        }
    });
    if (res.ok) {
        const data = await res.json();
        return data.user || null;
    }
    return null;
}
async function fetchUserProfile(cookieHeader) {
    const authCookies = extractAuthCookies(cookieHeader);
    const url = `${CONFIG.dataApiUrl}/read/profiles?instance=${CONFIG.instance}`;
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "X-Database-Instance": CONFIG.instance,
            Cookie: authCookies
        }
    });
    if (!res.ok) return null;
    const rows = extractRows(await res.json());
    return rows[0] || null;
}
async function proxyToNCB(req, path, body) {
    const searchParams = new URLSearchParams();
    searchParams.set("instance", CONFIG.instance);
    req.nextUrl.searchParams.forEach((val, key)=>{
        if (key !== "instance") searchParams.append(key, val);
    });
    const url = `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const cookieHeader = req.headers.get("cookie") || "";
    const authCookies = extractAuthCookies(cookieHeader);
    const res = await fetch(url, {
        method: req.method,
        headers: {
            "Content-Type": "application/json",
            "X-Database-Instance": CONFIG.instance,
            Cookie: authCookies,
            Origin: origin
        },
        body: body || undefined
    });
    const data = await res.text();
    return new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NextResponse"](data, {
        status: res.status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "enhancedContentPillars",
    ()=>enhancedContentPillars,
    "enhancedHookPatterns",
    ()=>enhancedHookPatterns,
    "enhancedPostTypes",
    ()=>enhancedPostTypes,
    "enhancedToneOptions",
    ()=>enhancedToneOptions
]);
const enhancedPostTypes = [
    {
        id: 'howTo',
        value: 'howTo',
        label: 'Educational/How-To',
        category: 'Educational Content',
        description: 'Guides readers through a process or technique.',
        exampleSnippet: 'Learn the 5 steps to master...',
        useCases: [
            'Skill development',
            'Process explanation'
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: 'list',
        value: 'list',
        label: 'Listicle/Tips',
        category: 'Educational Content',
        description: 'Presents multiple points or examples in a structured format.',
        exampleSnippet: 'Top 7 tools for...',
        useCases: [
            'Resource sharing',
            'Quick takeaways'
        ],
        performanceIndicator: 'high'
    },
    {
        id: 'toolReview',
        value: 'toolReview',
        label: 'Tool/Resource Review',
        category: 'Educational Content',
        description: 'Evaluates a specific tool or resource.',
        exampleSnippet: 'Is [Tool Name] worth it? My honest review.',
        useCases: [
            'Product recommendations',
            'Software comparisons'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'processFramework',
        value: 'processFramework',
        label: 'Process/Framework',
        category: 'Educational Content',
        description: 'Outlines a systematic approach or conceptual model.',
        exampleSnippet: 'The A-B-C framework for...',
        useCases: [
            'Strategic planning',
            'Methodology sharing'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'caseStudy',
        value: 'caseStudy',
        label: 'Case Study/Results',
        category: 'Data-Driven Content',
        description: 'Showcases real-world examples and demonstrated results.',
        exampleSnippet: 'How we helped Client X achieve...',
        useCases: [
            'Proof of concept',
            'Success stories'
        ],
        performanceIndicator: 'high'
    },
    {
        id: 'trendAnalysis',
        value: 'trendAnalysis',
        label: 'Trend Analysis',
        category: 'Data-Driven Content',
        description: 'Examines current market movements and future predictions.',
        exampleSnippet: 'The rise of AI in...',
        useCases: [
            'Market forecasting',
            'Industry outlook'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'industryInsights',
        value: 'industryInsights',
        label: 'Industry Insights',
        category: 'Data-Driven Content',
        description: 'Provides expert commentary on sector-specific developments.',
        exampleSnippet: 'What the latest report means for...',
        useCases: [
            'Thought leadership',
            'Expert opinion'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'comparison',
        value: 'comparison',
        label: 'Comparison/Vs Post',
        category: 'Data-Driven Content',
        description: 'Compares two or more concepts, tools, or strategies.',
        exampleSnippet: 'ChatGPT vs Bard: Which is better for...',
        useCases: [
            'Decision making',
            'Feature comparison'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'question',
        value: 'question',
        label: 'Question/Poll',
        category: 'Engagement Content',
        description: 'Engages the audience by asking a direct question or running a poll.',
        exampleSnippet: 'What are your biggest challenges with...? #poll',
        useCases: [
            'Audience research',
            'Community building'
        ],
        performanceIndicator: 'experimental',
        isTrending: true
    },
    {
        id: 'personalStory',
        value: 'personalStory',
        label: 'Personal Story/Experience',
        category: 'Engagement Content',
        description: 'Shares authentic experiences to build trust and connection.',
        exampleSnippet: 'This mistake cost me $10k but taught me...',
        useCases: [
            'Building credibility',
            'Humanizing your brand'
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: 'contrarian',
        value: 'contrarian',
        label: 'Controversial Take/Opinion',
        category: 'Engagement Content',
        description: 'Challenges conventional thinking to spark debate and engagement.',
        exampleSnippet: 'Unpopular opinion: Why remote work is failing...',
        useCases: [
            'Generating discussion',
            'Standing out'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'behindScenes',
        value: 'behindScenes',
        label: 'Behind-the-Scenes',
        category: 'Engagement Content',
        description: 'Offers a glimpse into your work process, team, or company culture.',
        exampleSnippet: 'A day in the life of our AI team...',
        useCases: [
            'Transparency',
            'Employer branding'
        ],
        performanceIndicator: 'experimental'
    },
    {
        id: 'mythBusting',
        value: 'mythBusting',
        label: 'Myth-Busting/Fact-Check',
        category: 'Authority Content',
        description: 'Debunks common misconceptions or verifies facts.',
        exampleSnippet: 'The biggest AI myth you still believe...',
        useCases: [
            'Educating audience',
            'Correcting misinformation'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'prediction',
        value: 'prediction',
        label: 'Prediction/Future Outlook',
        category: 'Authority Content',
        description: 'Shares informed predictions about future developments.',
        exampleSnippet: 'My 3 bold predictions for 2024...',
        useCases: [
            'Thought leadership',
            'Foresight'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'motivational',
        value: 'motivational',
        label: 'Motivational/Inspirational',
        category: 'Authority Content',
        description: "Inspires and encourages the audience with uplifting messages.",
        exampleSnippet: "Don't give up on your entrepreneurial journey...",
        useCases: [
            'Community support',
            'Personal growth'
        ],
        performanceIndicator: 'medium'
    }
];
const enhancedHookPatterns = [
    {
        id: 'curiosityGap',
        value: 'curiosityGap',
        label: 'Curiosity Gap',
        category: 'Intrigue & Discovery',
        description: 'Creates intrigue and prompts questions, making readers want to discover the answer.',
        exampleSnippet: "You won't believe what happened next...",
        useCases: [
            'Generating clicks',
            'Building suspense'
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: 'pas',
        value: 'pas',
        label: 'Problem-Agitate-Solve',
        category: 'Pain & Solution',
        description: 'Addresses a clear pain point, agitates it, then provides a solution.',
        exampleSnippet: "Struggling with X? Here's how to fix it.",
        useCases: [
            'Selling solutions',
            'Addressing common issues'
        ],
        performanceIndicator: 'high'
    },
    {
        id: 'socialProof',
        value: 'socialProof',
        label: 'Social Proof',
        category: 'Credibility & Trust',
        description: 'Uses evidence, data, or examples to validate a point through external credibility.',
        exampleSnippet: 'Join 10,000+ others who...',
        useCases: [
            'Building trust',
            'Leveraging testimonials'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'contrarian',
        value: 'contrarian',
        label: 'Contrarian',
        category: 'Challenge & Debate',
        description: 'Challenges common beliefs or practices, creating interest through new perspectives.',
        exampleSnippet: "Everyone says X, but here's why they're wrong.",
        useCases: [
            'Sparking discussion',
            'Standing out'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'authority',
        value: 'authority',
        label: 'Authority/Insight',
        category: 'Expertise & Value',
        description: 'Positions you as an expert voice on the topic, building trust with your audience.',
        exampleSnippet: "As a 10-year veteran in X, I've learned...",
        useCases: [
            'Establishing leadership',
            'Sharing deep knowledge'
        ],
        performanceIndicator: 'high'
    },
    {
        id: 'educational',
        value: 'educational',
        label: 'Educational/Framework',
        category: 'Learning & Guidance',
        description: 'Aligns with structured learning and applicable knowledge, often presenting a framework.',
        exampleSnippet: "Here's the simple framework I use for...",
        useCases: [
            'Teaching concepts',
            'Providing actionable steps'
        ],
        performanceIndicator: 'high'
    }
];
const enhancedContentPillars = [
    {
        id: 'Technology',
        value: 'Technology',
        label: 'Technology',
        category: 'Core Business',
        description: 'Focuses on technical concepts, digital tools, or technology implementation.',
        exampleSnippet: 'The latest in AI ethics...',
        useCases: [
            'Tech updates',
            'Software reviews'
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: 'Leadership',
        value: 'Leadership',
        label: 'Leadership',
        category: 'Core Business',
        description: 'Aligns with management principles, team dynamics, or strategic direction.',
        exampleSnippet: 'Effective leadership in a remote world.',
        useCases: [
            'Management tips',
            'Team building'
        ],
        performanceIndicator: 'high'
    },
    {
        id: 'Human Resource',
        value: 'Human Resource',
        label: 'Human Resource',
        category: 'Core Business',
        description: 'Addresses talent management, workforce issues, or employee experience.',
        exampleSnippet: 'Boosting employee engagement in 2024.',
        useCases: [
            'HR best practices',
            'Recruitment strategies'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'Industry Trends',
        value: 'Industry Trends',
        label: 'Industry Trends',
        category: 'Market & Future',
        description: "Examines market movements, future predictions, or sector-wide developments.",
        exampleSnippet: "What's next for digital transformation?",
        useCases: [
            'Market analysis',
            'Future forecasting'
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: 'Health Tips',
        value: 'Health Tips',
        label: 'Health Tips',
        category: 'Personal Wellbeing',
        description: 'Matches topics related to wellbeing, medical insights, or healthcare concerns.',
        exampleSnippet: '3 simple habits for better mental health.',
        useCases: [
            'Wellness advice',
            'Preventative care'
        ],
        performanceIndicator: 'medium'
    },
    {
        id: 'Case Studies',
        value: 'Case Studies',
        label: 'Case Studies',
        category: 'Proof & Results',
        description: 'Dedicated pillar for sharing detailed success stories and project outcomes.',
        exampleSnippet: 'Our client saved $X with this strategy.',
        useCases: [
            'Demonstrating ROI',
            'Client success'
        ],
        performanceIndicator: 'high'
    }
];
const enhancedToneOptions = [
    {
        id: "casual-witty",
        value: "casual-witty",
        label: "Casual & Witty",
        category: 'Informal & Engaging',
        description: "Punchy, first-person riffs with short, staccato sentences, playful sarcasm, and quick take-home lines that feel like a high-engagement LinkedIn scroll.",
        exampleSnippet: "Nobody actually cares about your content strategy. That's what a marketing guru told me last week.",
        useCases: [
            "Engagement-focused posts",
            "Counter-intuitive insights",
            "Personal observations"
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: "professional-authority",
        value: "professional-authority",
        label: "Professional Authority",
        category: 'Formal & Expert',
        description: "Balanced, expert voice with clear insights and factual support. Industry leadership with measured confidence.",
        exampleSnippet: "Our latest research indicates...",
        useCases: [
            "Academic topics",
            "Industry reports"
        ],
        performanceIndicator: 'high'
    },
    {
        id: "approachable-expert",
        value: "approachable-expert",
        label: "Approachable Expert",
        category: 'Formal & Expert',
        description: "Friendly, accessible expertise. Complex ideas explained simply with relatable examples and occasional humor.",
        exampleSnippet: "Let's break down this complex topic...",
        useCases: [
            "Educational content",
            "Beginner guides"
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: "snap-snark",
        value: "snap-snark",
        label: "Snap & Snark",
        category: 'Informal & Engaging',
        description: "Punchy, first-person quips. Short, snappy lines. Light sarcasm. Fast takeaways that read like a high-engagement LinkedIn feed.",
        exampleSnippet: "Unpopular opinion: Meetings are dead.",
        useCases: [
            "Opinion pieces",
            "Quick takes"
        ],
        performanceIndicator: 'medium'
    },
    {
        id: "plain-talk-playbook",
        value: "plain-talk-playbook",
        label: "Plain-Talk Playbook",
        category: 'Informal & Engaging',
        description: "No fluff. Plain language that turns big ideas into step-by-step moves, with sticky analogies and habit-friendly rules of thumb.",
        exampleSnippet: "Here's the simple truth about...",
        useCases: [
            "How-to guides",
            "Actionable advice"
        ],
        performanceIndicator: 'high'
    },
    {
        id: "anecdote-to-aha",
        value: "anecdote-to-aha",
        label: "Anecdote to Aha",
        category: 'Storytelling',
        description: "Start with a scene. Tease a question. Land an unexpected aha\u2014backed by research and smart counterpoints.",
        exampleSnippet: "I almost quit until I realized...",
        useCases: [
            "Personal growth stories",
            "Lessons learned"
        ],
        performanceIndicator: 'high',
        isTrending: true
    },
    {
        id: "bias-buster",
        value: "bias-buster",
        label: "Bias Buster",
        category: 'Storytelling',
        description: "Wry, rule-bending takes that expose our quirky decision-making and flip conventional wisdom upside down.",
        exampleSnippet: "Your brain is tricking you into...",
        useCases: [
            "Challenging norms",
            "Psychology insights"
        ],
        performanceIndicator: 'medium'
    },
    {
        id: "open-heart-honest",
        value: "open-heart-honest",
        label: "Open-Heart Honest",
        category: 'Emotional & Relatable',
        description: "Warm first-person honesty, blending personal moments with evidence-based takeaways to create genuine connection.",
        exampleSnippet: "It's okay to feel overwhelmed, I've been there.",
        useCases: [
            "Vulnerability",
            "Empathy building"
        ],
        performanceIndicator: 'medium'
    },
    {
        id: "future-forward-glow",
        value: "future-forward-glow",
        label: "Future-Forward Glow",
        category: 'Visionary',
        description: "Future-forward energy: market maps, sci-fi analogies, and confident bets that paint a hope-filled picture of what's next.",
        exampleSnippet: "Imagine a world where AI...",
        useCases: [
            "Futurism",
            "Innovation"
        ],
        performanceIndicator: 'medium'
    },
    {
        id: "money-with-meaning",
        value: "money-with-meaning",
        label: "Money With Meaning",
        category: 'Niche & Specific',
        description: "Calm, reflective essays weaving history, psychology, and money lessons into relatable snapshots with a literary touch.",
        exampleSnippet: "The philosophy of wealth beyond riches.",
        useCases: [
            "Financial literacy",
            "Ethical investing"
        ],
        performanceIndicator: 'experimental'
    },
    {
        id: "conversion-mode",
        value: "conversion-mode",
        label: "Conversion Mode",
        category: 'Niche & Specific',
        description: "Benefits first. Pain \u2192 solution \u2192 proof \u2192 CTA. Tight, urgent copy built to convert.",
        exampleSnippet: "Unlock your potential with...",
        useCases: [
            "Sales copy",
            "Landing pages"
        ],
        performanceIndicator: 'medium'
    },
    {
        id: "nerdy-fun-run",
        value: "nerdy-fun-run",
        label: "Nerdy Fun Run",
        category: 'Niche & Specific',
        description: "Long-form with stick-figure humor, casual asides, and simple visuals to crack complex ideas\u2014meme-ready and approachable.",
        exampleSnippet: "Let's get nerdy about quantum computing!",
        useCases: [
            "Complex explanations",
            "Engaging education"
        ],
        performanceIndicator: 'experimental'
    },
    {
        id: "mission-voice",
        value: "mission-voice",
        label: "Mission Voice",
        category: 'Niche & Specific',
        description: "Purpose-first language that asks the big why, rallies the group, and closes with a clear, uplifting call to act.",
        exampleSnippet: "Join us in building a better future for...",
        useCases: [
            "Advocacy",
            "Community rallying"
        ],
        performanceIndicator: 'medium'
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/api.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deletePost",
    ()=>deletePost,
    "findSubtopics",
    ()=>findSubtopics,
    "getAnalytics",
    ()=>getAnalytics,
    "getBrandProfile",
    ()=>getBrandProfile,
    "getCurrentUser",
    ()=>getCurrentUser,
    "getPostRecommendations",
    ()=>getPostRecommendations,
    "getScheduledPosts",
    ()=>getScheduledPosts,
    "savePostDraft",
    ()=>savePostDraft,
    "schedulePost",
    ()=>schedulePost,
    "updateBrandProfile",
    ()=>updateBrandProfile,
    "updatePost",
    ()=>updatePost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/aiService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-client] (ecmascript)");
// --- Dropdown Data (client-side) ---
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-client] (ecmascript)");
;
;
function parseJsonArray(val) {
    if (!val) return [];
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    } catch  {
        return [];
    }
}
function mapProfileFromNcb(row) {
    const firstName = row.first_name ?? "";
    const lastName = row.last_name ?? "";
    const aiProvider = row.ai_provider;
    return {
        id: row.id,
        name: firstName && lastName ? `${firstName} ${lastName}` : row.company_name ?? "N/A",
        firstName,
        lastName,
        companyName: row.company_name ?? "",
        role: row.role ?? "",
        aiProvider: aiProvider ?? "claude",
        claudeApiKey: row.claude_api_key ?? "",
        straicoApiKey: row.straico_api_key ?? "",
        straicoModel: row.straico_model ?? "openai/gpt-4o-mini",
        oneforallApiKey: row.oneforall_api_key ?? "",
        oneforallModel: row.oneforall_model ?? "anthropic/claude-4-sonnet",
        industry: row.industry ?? "",
        audience: parseJsonArray(row.audience),
        tones: parseJsonArray(row.tones),
        offers: parseJsonArray(row.offers),
        taboos: parseJsonArray(row.taboos),
        styleGuide: {
            emoji: row.style_guide_emoji ?? true,
            hashtags: row.style_guide_hashtags ?? 3,
            links: row.style_guide_links ?? "end"
        },
        copyGuideline: row.copy_guideline ?? "",
        contentStrategy: row.content_strategy ?? "",
        definition: row.definition ?? "",
        perplexityApiKey: row.perplexity_api_key ?? undefined,
        redditClientId: row.reddit_client_id ?? undefined,
        redditClientSecret: row.reddit_client_secret ?? undefined
    };
}
function mapPostFromNcb(row) {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        scheduledAt: row.scheduled_at ?? "",
        pillar: row.pillar ?? "",
        status: row.status ?? "draft",
        userId: row.user_id,
        factoryScore: row.factory_score ?? undefined
    };
}
const getCurrentUser = async ()=>{
    const res = await fetch("/api/auth/get-session", {
        credentials: "include"
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
};
const getBrandProfile = async (_userId)=>{
    const res = await fetch("/api/data/read/profiles", {
        credentials: "include"
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch brand profile: ${res.statusText}`);
    }
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractRows"])(await res.json());
    if (rows.length === 0) {
        // Return empty profile - user hasn't created one yet
        return {
            id: "",
            name: "N/A",
            firstName: "",
            lastName: "",
            companyName: "",
            role: "",
            aiProvider: "claude",
            claudeApiKey: "",
            straicoApiKey: "",
            straicoModel: "openai/gpt-4o-mini",
            oneforallApiKey: "",
            oneforallModel: "anthropic/claude-4-sonnet",
            industry: "",
            audience: [],
            tones: [],
            offers: [],
            taboos: [],
            styleGuide: {
                emoji: true,
                hashtags: 3,
                links: "end"
            },
            copyGuideline: "",
            contentStrategy: "",
            definition: ""
        };
    }
    return mapProfileFromNcb(rows[0]);
};
const updateBrandProfile = async (profile)=>{
    const payload = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        company_name: profile.companyName,
        role: profile.role,
        industry: profile.industry,
        audience: JSON.stringify(profile.audience),
        tones: JSON.stringify(profile.tones),
        offers: JSON.stringify(profile.offers),
        taboos: JSON.stringify(profile.taboos),
        style_guide_emoji: profile.styleGuide.emoji,
        style_guide_hashtags: profile.styleGuide.hashtags,
        style_guide_links: profile.styleGuide.links,
        copy_guideline: profile.copyGuideline,
        content_strategy: profile.contentStrategy,
        definition: profile.definition,
        ai_provider: profile.aiProvider,
        claude_api_key: profile.claudeApiKey,
        straico_api_key: profile.straicoApiKey,
        straico_model: profile.straicoModel,
        oneforall_api_key: profile.oneforallApiKey,
        oneforall_model: profile.oneforallModel,
        perplexity_api_key: profile.perplexityApiKey || null,
        reddit_client_id: profile.redditClientId || null,
        reddit_client_secret: profile.redditClientSecret || null
    };
    if (profile.id) {
        // Update existing
        const res = await fetch(`/api/data/update/profiles/${profile.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            throw new Error(`Failed to update brand profile: ${res.statusText}`);
        }
        const data = await res.json();
        return mapProfileFromNcb(data);
    } else {
        // Create new
        const res = await fetch("/api/data/create/profiles", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            throw new Error(`Failed to create brand profile: ${res.statusText}`);
        }
        const data = await res.json();
        return mapProfileFromNcb(data);
    }
};
const getScheduledPosts = async ()=>{
    const res = await fetch("/api/data/read/posts", {
        credentials: "include"
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractRows"])(await res.json());
    return rows.map(mapPostFromNcb);
};
const updatePost = async (updatedPost)=>{
    const res = await fetch(`/api/data/update/posts/${updatedPost.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: updatedPost.title,
            content: updatedPost.content,
            scheduled_at: updatedPost.scheduledAt,
            pillar: updatedPost.pillar,
            status: updatedPost.status
        })
    });
    if (!res.ok) {
        throw new Error(`Failed to update post: ${res.statusText}`);
    }
    const data = await res.json();
    return mapPostFromNcb(data);
};
const savePostDraft = async (post)=>{
    const res = await fetch("/api/data/create/posts", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: post.title,
            content: post.content,
            scheduled_at: post.scheduledAt,
            pillar: post.pillar,
            status: "draft"
        })
    });
    if (!res.ok) {
        throw new Error(`Failed to save draft: ${res.statusText}`);
    }
};
const schedulePost = async (post)=>{
    const res = await fetch("/api/data/create/posts", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: post.title,
            content: post.content,
            scheduled_at: post.scheduledAt,
            pillar: post.pillar,
            status: post.status
        })
    });
    if (!res.ok) {
        throw new Error(`Failed to schedule post: ${res.statusText}`);
    }
};
const deletePost = async (postId)=>{
    const res = await fetch(`/api/data/delete/posts/${postId}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!res.ok) {
        throw new Error(`Failed to delete post: ${res.statusText}`);
    }
};
const getAnalytics = async (_userId)=>{
    return {
        totalImpressions: 0,
        totalReactions: 0,
        totalComments: 0,
        ctr: 0,
        topPerformingPillar: {
            name: "N/A",
            value: 0
        },
        topPerformingHook: {
            name: "N/A",
            value: 0
        },
        performanceByPillar: [],
        trendingTopics: [],
        creatorEngagement: {
            averageCommentsPerPost: 0,
            averageReactionsPerPost: 0,
            followerGrowthRate: 0
        }
    };
};
const findSubtopics = async (topic, count = 5, settings)=>{
    if (!settings) {
        throw new Error("AI settings are required. Please configure an AI provider in Settings.");
    }
    const systemPrompt = `You are a LinkedIn content strategist. Given a topic, suggest ${count} specific subtopics that would make engaging LinkedIn posts. Return a JSON array of objects with fields: id (string, unique), text (string, the subtopic), source (string, one of "google_trends", "google_questions", "related_topics"), relevanceScore (number 0-1), searchVolume (number). Only return the JSON array, no other text.`;
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateWithAi"])({
        systemPrompt,
        userMessage: `Topic: ${topic}`
    }, settings);
    try {
        const cleaned = response.content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    } catch  {
        throw new Error("Failed to parse subtopic suggestions from AI response");
    }
};
const getPostRecommendations = async (topic, subtopic, settings)=>{
    if (!settings) {
        throw new Error("AI settings are required. Please configure an AI provider in Settings.");
    }
    const systemPrompt = `You are a LinkedIn content strategist. Given a topic and subtopic, recommend the best post configuration. Return a single JSON object with these fields:
- postType (string): one of "educational", "storytelling", "opinion", "how-to", "case-study", "listicle"
- hookPattern (string): one of "question", "statistic", "bold-claim", "story-opener", "contrarian", "curiosity-gap"
- contentPillar (string): one of "thought-leadership", "industry-insights", "personal-branding", "how-to-guides", "case-studies", "trends"
- toneId (string): one of "casual-witty", "professional-authority", "approachable-expert"
- confidence (number 0-1)
- reasoning (object with fields: postType, hookPattern, contentPillar, tone - each a string explaining the choice)
- compatiblePostTypes (string array)
- compatibleHookPatterns (string array)
- compatibleContentPillars (string array)
- compatibleTones (string array)
Only return the JSON object, no other text.`;
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateWithAi"])({
        systemPrompt,
        userMessage: `Topic: ${topic}\nSubtopic: ${subtopic}`
    }, settings);
    try {
        const cleaned = response.content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    } catch  {
        throw new Error("Failed to parse recommendations from AI response");
    }
};
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/api.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/bar-chart-2.mjs [app-client] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/arrow-up-right.mjs [app-client] (ecmascript) <export default as ArrowUpRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2d$square$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusSquare$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/plus-square.mjs [app-client] (ecmascript) <export default as PlusSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/trending-up.mjs [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Book$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/book.mjs [app-client] (ecmascript) <export default as Book>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function DashboardPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [posts, setPosts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [analyticsData, setAnalyticsData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DashboardPage.useEffect": ()=>{
            const fetchData = {
                "DashboardPage.useEffect.fetchData": async ()=>{
                    if (!user?.id) {
                        setLoading(false);
                        return;
                    }
                    try {
                        const fetchedPosts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getScheduledPosts"])();
                        const fetchedAnalytics = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getAnalytics"])(user.id);
                        setPosts(fetchedPosts);
                        setAnalyticsData(fetchedAnalytics);
                    } catch (error) {
                        console.error("Failed to load dashboard data:", error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["DashboardPage.useEffect.fetchData"];
            void fetchData();
        }
    }["DashboardPage.useEffect"], [
        user?.id
    ]);
    const formatDate = (dateString)=>{
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    const formatTime = (dateString)=>{
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold mb-6",
                        children: "Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised flex items-center justify-center p-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Loading dashboard data..."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 59,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                        lineNumber: 58,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                lineNumber: 56,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this);
    }
    const now = new Date();
    const upcomingPosts = posts.filter((post)=>new Date(post.scheduledAt) > now && post.status === 'scheduled').sort((a, b)=>new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 3);
    const recentPosts = posts.filter((post)=>new Date(post.scheduledAt) <= now && (post.status === 'published' || post.status === 'scheduled')).sort((a, b)=>new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).slice(0, 3);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-6xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl font-bold mb-6",
                    children: "Dashboard"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-card bru-card--raised",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                background: "var(--bru-purple)",
                                                padding: "8px",
                                                borderRadius: "var(--bru-radius-md)"
                                            },
                                            className: "mr-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"], {
                                                className: "text-white",
                                                size: 24
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                lineNumber: 87,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 86,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold",
                                            children: "Performance Overview"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 89,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 85,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600 font-bold",
                                                            children: "Impressions"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 94,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold flex items-center text-green-600",
                                                            children: analyticsData?.totalImpressions.toLocaleString() ?? 'N/A'
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 95,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bru-progress",
                                                    style: {
                                                        marginTop: "4px"
                                                    },
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bru-progress__bar",
                                                        style: {
                                                            width: `${(analyticsData?.totalImpressions ?? 0) / 100000 * 100}%`
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                        lineNumber: 100,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 99,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 92,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600 font-bold",
                                                            children: "Engagement"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 105,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold flex items-center text-green-600",
                                                            children: analyticsData?.ctr ? `${analyticsData.ctr}%` : 'N/A'
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 106,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 104,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bru-progress",
                                                    style: {
                                                        marginTop: "4px"
                                                    },
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bru-progress__bar",
                                                        style: {
                                                            width: `${(analyticsData?.ctr ?? 0) * 10}%`
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                        lineNumber: 111,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 110,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 103,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600 font-bold",
                                                            children: "Top Pillar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 116,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold flex items-center text-green-600",
                                                            children: analyticsData?.topPerformingPillar.name ?? 'N/A'
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 117,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bru-progress",
                                                    style: {
                                                        marginTop: "4px"
                                                    },
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bru-progress__bar",
                                                        style: {
                                                            width: `${(analyticsData?.topPerformingPillar.value ?? 0) / 50000 * 100}%`
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                        lineNumber: 122,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 121,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 114,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 91,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-card bru-card--raised",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                background: "var(--bru-yellow)",
                                                padding: "8px",
                                                borderRadius: "var(--bru-radius-md)"
                                            },
                                            className: "mr-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2d$square$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusSquare$3e$__["PlusSquare"], {
                                                className: "text-white",
                                                size: 24
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                lineNumber: 132,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 131,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold",
                                            children: "Quick Actions"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 134,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 130,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/create",
                                            className: "flex items-center font-bold hover:underline",
                                            style: {
                                                color: "var(--bru-purple)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                                    size: 16,
                                                    className: "mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 17
                                                }, this),
                                                " Generate New Post"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/calendar",
                                            className: "flex items-center font-bold hover:underline",
                                            style: {
                                                color: "var(--bru-purple)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                    size: 16,
                                                    className: "mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 17
                                                }, this),
                                                " View Calendar"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 140,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/settings",
                                            className: "flex items-center font-bold hover:underline",
                                            style: {
                                                color: "var(--bru-purple)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    size: 16,
                                                    className: "mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 17
                                                }, this),
                                                " Update Brand Profile"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 143,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-card bru-card--raised md:col-span-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold",
                                            children: "Upcoming Posts"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 152,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/calendar",
                                            className: "text-sm font-bold hover:underline",
                                            style: {
                                                color: "var(--bru-purple)"
                                            },
                                            children: "View All"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 153,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 151,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: upcomingPosts.length > 0 ? upcomingPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start space-x-3 pb-4 last:pb-0",
                                            style: {
                                                borderBottom: "1px solid rgba(0,0,0,0.08)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pt-1",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                        className: "w-4 h-4 text-gray-600"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                        lineNumber: 160,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 159,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-semibold",
                                                            children: post.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 163,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-600",
                                                            children: [
                                                                formatDate(post.scheduledAt),
                                                                " at ",
                                                                formatTime(post.scheduledAt)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 164,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 162,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, post.id, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 158,
                                            columnNumber: 19
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-center text-gray-600 font-medium py-4",
                                        children: "No upcoming scheduled posts."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                        lineNumber: 169,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 155,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                    lineNumber: 82,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-card bru-card--raised",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold",
                                            children: "Recent Posts"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/library",
                                            className: "text-sm font-bold hover:underline",
                                            style: {
                                                color: "var(--bru-purple)"
                                            },
                                            children: "View Library"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 180,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 178,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: recentPosts.length > 0 ? recentPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start space-x-3 pb-4 last:pb-0",
                                            style: {
                                                borderBottom: "1px solid rgba(0,0,0,0.08)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pt-1",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Book$3e$__["Book"], {
                                                        className: "w-4 h-4 text-gray-600"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                        lineNumber: 187,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-semibold",
                                                            children: post.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 190,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-600",
                                                            children: [
                                                                "Published: ",
                                                                formatDate(post.scheduledAt)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                            lineNumber: 191,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 189,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, post.id, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 185,
                                            columnNumber: 19
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-center text-gray-600 font-medium py-4",
                                        children: "No recent posts found."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                        lineNumber: 196,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 182,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 177,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-card bru-card--raised",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold",
                                            children: "Trending Topics"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 204,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-bold text-gray-600",
                                            children: "Last 7 Days"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 205,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 203,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: analyticsData?.trendingTopics.length ? analyticsData.trendingTopics.map((topic, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bru-card bru-card--flat flex items-center justify-between",
                                            style: {
                                                padding: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: topic
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 211,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                    size: 16,
                                                    className: "text-green-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                                    lineNumber: 212,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, index, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                            lineNumber: 210,
                                            columnNumber: 19
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-center text-gray-600 font-medium py-4",
                                        children: "No trending topics available."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                        lineNumber: 216,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                                    lineNumber: 207,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
                    lineNumber: 175,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/dashboard/page.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
_s(DashboardPage, "bHzUhN0J+kbu3UAamXENuHg1d/M=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = DashboardPage;
var _c;
__turbopack_context__.k.register(_c, "DashboardPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_doctorpost-v12_fec5abb6._.js.map