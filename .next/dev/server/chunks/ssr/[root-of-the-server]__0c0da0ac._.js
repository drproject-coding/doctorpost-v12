module.exports = [
"[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/Desktop/doctorpost-v12/lib/ai/aiService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateViaServer",
    ()=>generateViaServer,
    "generateWithAi",
    ()=>generateWithAi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-ssr] (ecmascript)");
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
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["callClaude"])(request, settings.claudeApiKey, onProgress, signal);
            }
        case "1forall":
            {
                if (!settings.oneforallApiKey) {
                    throw new Error("1ForAll API key is not configured. Please add your 1ForAll API key in Settings.");
                }
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["callOneForAll"])(request, settings.oneforallApiKey, settings.oneforallModel, onProgress, signal);
            }
        case "straico":
            {
                if (!settings.straicoApiKey) {
                    throw new Error("Straico API key is not configured. Please add your Straico API key in Settings.");
                }
                const { callStraico } = await __turbopack_context__.A("[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-ssr] (ecmascript, async loader)");
                return callStraico(request, settings.straicoApiKey, settings.straicoModel, onProgress, signal);
            }
        default:
            throw new Error(`Unsupported AI provider: ${settings.activeProvider}`);
    }
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-ssr] (ecmascript)");
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
    instance: process.env.NCB_INSTANCE,
    dataApiUrl: process.env.NCB_DATA_API_URL,
    authApiUrl: process.env.NCB_AUTH_API_URL,
    appUrl: process.env.NCB_APP_URL || "https://app.nocodebackend.com"
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
    return new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NextResponse"](data, {
        status: res.status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
}),
"[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/Desktop/doctorpost-v12/lib/api.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-ssr] (ecmascript)");
// --- Dropdown Data (client-side) ---
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-ssr] (ecmascript)");
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
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractRows"])(await res.json());
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
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractRows"])(await res.json());
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
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateWithAi"])({
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
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateWithAi"])({
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
}),
"[project]/Desktop/doctorpost-v12/lib/calendarUtils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStatusColorClasses",
    ()=>getStatusColorClasses,
    "statusOptions",
    ()=>statusOptions
]);
const statusOptions = [
    {
        id: 'draft',
        value: 'draft',
        label: 'Draft',
        category: 'Status',
        description: 'Post is a work in progress.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-review',
        value: 'to-review',
        label: 'To Review',
        category: 'Status',
        description: 'Post is ready for review.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-plan',
        value: 'to-plan',
        label: 'To Plan',
        category: 'Status',
        description: 'Post is ready for planning.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-publish',
        value: 'to-publish',
        label: 'To Publish',
        category: 'Status',
        description: 'Post is ready to be published.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'scheduled',
        value: 'scheduled',
        label: 'Scheduled',
        category: 'Status',
        description: 'Post is scheduled for a future date.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'published',
        value: 'published',
        label: 'Published',
        category: 'Status',
        description: 'Post has been published.',
        exampleSnippet: '',
        useCases: []
    }
];
const getStatusColorClasses = (status)=>{
    switch(status){
        case 'scheduled':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'published':
            return 'bg-green-100 text-green-800 border-green-300';
        case 'draft':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'to-review':
            return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'to-plan':
            return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        case 'to-publish':
            return 'bg-red-100 text-red-800 border-red-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};
}),
"[project]/Desktop/doctorpost-v12/components/calendar/ScoreBadge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScoreBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function ScoreBadge({ score, size = "sm" }) {
    const fontSize = size === "sm" ? 9 : 10;
    const padding = size === "sm" ? "0 3px" : "0 4px";
    const marginRight = size === "sm" ? 4 : 6;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        style: {
            display: "inline-block",
            marginRight,
            padding,
            fontSize,
            fontWeight: 700,
            background: score >= 75 ? "var(--bru-success, #00AA00)" : score >= 50 ? "var(--bru-warning, #FFAA00)" : "var(--bru-error, #FF4444)",
            color: "white"
        },
        children: score
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/ScoreBadge.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CalendarView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/calendarUtils.ts [app-ssr] (ecmascript)"); // Import from new utility file
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$ScoreBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/calendar/ScoreBadge.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function CalendarView({ posts, onPostClick, selectedDateFromPicker }) {
    const [currentDate, setCurrentDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Date());
    // Effect to update current month when selectedDateFromPicker changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (selectedDateFromPicker) {
            const newDate = new Date(selectedDateFromPicker);
            // Only update if the month/year is different to avoid unnecessary re-renders
            if (newDate.getFullYear() !== currentDate.getFullYear() || newDate.getMonth() !== currentDate.getMonth()) {
                setCurrentDate(newDate);
            }
        }
    }, [
        selectedDateFromPicker,
        currentDate
    ]); // Depend on selectedDateFromPicker and currentDate
    const getDaysInMonth = (year, month)=>{
        return new Date(year, month + 1, 0).getDate();
    };
    const getFirstDayOfMonth = (year, month)=>{
        return new Date(year, month, 1).getDay();
    };
    const previousMonth = ()=>{
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };
    const nextMonth = ()=>{
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    const renderCalendar = ()=>{
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        const days = [];
        // Add empty cells for days before the first day of the month
        for(let i = 0; i < firstDayOfMonth; i++){
            days.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-24 border-2 border-black bg-gray-50"
            }, `empty-${i}`, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                lineNumber: 67,
                columnNumber: 9
            }, this));
        }
        // Create calendar days
        for(let day = 1; day <= daysInMonth; day++){
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDateFromPicker && date.toDateString() === new Date(selectedDateFromPicker).toDateString();
            // Filter posts for this day
            const dayPosts = posts.filter((post)=>{
                const postDate = new Date(post.scheduledAt);
                return postDate.getFullYear() === year && postDate.getMonth() === month && postDate.getDate() === day;
            });
            let cellClasses = "bg-white";
            let cellStyle = {};
            if (isToday) {
                cellClasses = "bg-bru-purple/10"; // Highlight for today
            }
            if (isSelected) {
                cellClasses = "bg-bru-yellow/20 border-bru-yellow"; // Highlight for selected date
            }
            if (isToday && isSelected) {
                cellClasses = "bg-bru-yellow/20 border-bru-yellow ring-2"; // Both today and selected
                cellStyle = {
                    "--tw-ring-color": "var(--bru-purple)"
                };
            }
            days.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `h-24 border-2 border-black p-1 overflow-y-auto relative ${cellClasses}`,
                style: cellStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `font-bold text-sm mb-1 ${isToday ? "text-bru-purple" : isSelected ? "text-bru-yellow" : ""}`,
                        children: day
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this),
                    dayPosts.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1",
                        children: dayPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `block w-full text-left px-2 py-1 text-xs rounded-bru-md border-2 truncate ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusColorClasses"])(post.status)} hover:opacity-80 transition-opacity`,
                                title: post.title,
                                onClick: ()=>onPostClick(post),
                                children: [
                                    post.factoryScore != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$ScoreBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        score: post.factoryScore
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                        lineNumber: 128,
                                        columnNumber: 21
                                    }, this),
                                    post.title
                                ]
                            }, post.id, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                lineNumber: 121,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                        lineNumber: 119,
                        columnNumber: 13
                    }, this) : null
                ]
            }, day, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                lineNumber: 108,
                columnNumber: 9
            }, this));
        }
        return days;
    };
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl font-bold",
                        children: [
                            monthNames[currentDate.getMonth()],
                            " ",
                            currentDate.getFullYear()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex space-x-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: previousMonth,
                                className: "bru-btn bru-btn--primary p-2 flex items-center justify-center",
                                "aria-label": "Previous month",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                    lineNumber: 169,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: nextMonth,
                                className: "bru-btn bru-btn--primary p-2 flex items-center justify-center",
                                "aria-label": "Next month",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                    lineNumber: 176,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                                lineNumber: 171,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-7 gap-1 mb-1",
                children: [
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat"
                ].map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center font-bold text-sm py-2",
                        children: day
                    }, day, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                        lineNumber: 183,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-7 gap-1",
                children: renderCalendar()
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
                lineNumber: 189,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/save.mjs [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
"use client";
;
;
;
const statusOptions = [
    {
        id: 'draft',
        value: 'draft',
        label: 'Draft',
        category: 'Status',
        description: 'Post is a work in progress.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-review',
        value: 'to-review',
        label: 'To Review',
        category: 'Status',
        description: 'Post is ready for review.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-plan',
        value: 'to-plan',
        label: 'To Plan',
        category: 'Status',
        description: 'Post is ready for planning.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'to-publish',
        value: 'to-publish',
        label: 'To Publish',
        category: 'Status',
        description: 'Post is ready to be published.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'scheduled',
        value: 'scheduled',
        label: 'Scheduled',
        category: 'Status',
        description: 'Post is scheduled for a future date.',
        exampleSnippet: '',
        useCases: []
    },
    {
        id: 'published',
        value: 'published',
        label: 'Published',
        category: 'Status',
        description: 'Post has been published.',
        exampleSnippet: '',
        useCases: []
    }
];
const PostEditorModal = ({ isOpen, onClose, post, onSave })=>{
    const [editedTitle, setEditedTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [editedContent, setEditedContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [editedStatus, setEditedStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('draft');
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saveSuccess, setSaveSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOpen && post) {
            setEditedTitle(post.title);
            setEditedContent(post.content);
            setEditedStatus(post.status);
            setSaveError(null);
            setSaveSuccess(null);
        }
    }, [
        isOpen,
        post
    ]);
    if (!isOpen || !post) return null;
    const handleSave = async ()=>{
        if (!post) return;
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);
        const updatedPost = {
            ...post,
            title: editedTitle,
            content: editedContent,
            status: editedStatus
        };
        try {
            await onSave(updatedPost);
            setSaveSuccess('Post saved successfully!');
            setTimeout(()=>{
                setSaveSuccess(null);
                onClose(); // Close modal on successful save
            }, 1500);
        } catch (error) {
            console.error('Failed to save post:', error);
            setSaveError('Failed to save post. Please try again.');
        } finally{
            setIsSaving(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-overlay",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bru-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "bru-modal__title",
                            children: [
                                "Edit Post: ",
                                post.title
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "bru-modal__close",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__body",
                    children: [
                        saveError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-red-100 text-red-800 border-2 border-red-300 rounded-bru-md p-3 mb-4 text-sm font-medium",
                            children: saveError
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 83,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        saveSuccess && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-green-100 text-green-800 border-2 border-green-300 rounded-bru-md p-3 mb-4 text-sm font-medium",
                            children: saveSuccess
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "edit-title",
                                    className: "bru-field__label",
                                    children: "Title"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 94,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "edit-title",
                                    className: "bru-input",
                                    value: editedTitle,
                                    onChange: (e)=>setEditedTitle(e.target.value),
                                    disabled: isSaving
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "edit-content",
                                    className: "bru-field__label",
                                    children: "Content"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    id: "edit-content",
                                    className: "bru-input h-48 resize-y",
                                    value: editedContent,
                                    onChange: (e)=>setEditedContent(e.target.value),
                                    disabled: isSaving
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 111,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "edit-status",
                                    className: "bru-field__label",
                                    children: "Status"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    id: "edit-status",
                                    className: "bru-input",
                                    value: editedStatus,
                                    onChange: (e)=>setEditedStatus(e.target.value),
                                    disabled: isSaving,
                                    children: statusOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: option.value,
                                            children: option.label
                                        }, option.id, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                            lineNumber: 132,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                    lineNumber: 124,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__footer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "bru-btn bru-btn--secondary",
                            disabled: isSaving,
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: void handleSave,
                            className: "bru-btn bru-btn--primary",
                            disabled: isSaving,
                            children: isSaving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                        size: 16,
                                        className: "animate-spin mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                        lineNumber: 147,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " Saving..."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                lineNumber: 146,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                        size: 16,
                                        className: "mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                        lineNumber: 151,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " Save Changes"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                                lineNumber: 150,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                            lineNumber: 144,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
                    lineNumber: 140,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
            lineNumber: 73,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = PostEditorModal;
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CalendarPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/api.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$CalendarView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/calendar/CalendarView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$PostEditorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/PostEditorModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/list.mjs [app-ssr] (ecmascript) <export default as List>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/filter.mjs [app-ssr] (ecmascript) <export default as Filter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/calendarUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$ScoreBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/calendar/ScoreBadge.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const ListView = ({ posts, onPostClick })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-card bru-card--raised",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: posts.length > 0 ? posts.sort((a, b)=>new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-bold",
                                    children: [
                                        post.factoryScore != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$ScoreBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            score: post.factoryScore,
                                            size: "md"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                            lineNumber: 38,
                                            columnNumber: 23
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        post.title
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                    lineNumber: 36,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-600",
                                    children: [
                                        "Pillar: ",
                                        post.pillar,
                                        " | Scheduled:",
                                        " ",
                                        new Date(post.scheduledAt).toLocaleString()
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                    lineNumber: 42,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                            lineNumber: 35,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center space-x-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `bru-tag bru-tag--filled ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusColorClasses"])(post.status)}`,
                                    children: post.status.charAt(0).toUpperCase() + post.status.slice(1)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                    lineNumber: 48,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "text-sm bg-gray-100 py-1 px-3 rounded-bru-md border-2 border-black font-bold hover:bg-gray-200",
                                    onClick: ()=>onPostClick(post),
                                    children: "View/Edit"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                    lineNumber: 53,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                            lineNumber: 47,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, post.id, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                    lineNumber: 31,
                    columnNumber: 15
                }, ("TURBOPACK compile-time value", void 0))) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-center py-12 text-gray-600 font-medium",
                children: "No posts found for this filter."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                lineNumber: 63,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
function CalendarPage() {
    const [allPosts, setAllPosts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("calendar");
    const [filterStatus, setFilterStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [selectedDateFromPicker, setSelectedDateFromPicker] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // State for Post Editor Modal
    const [isEditorModalOpen, setIsEditorModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedPostForEdit, setSelectedPostForEdit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchPosts = async ()=>{
        setLoading(true);
        try {
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getScheduledPosts"])();
            setAllPosts(data);
        } catch (error) {
            console.error("Failed to load scheduled posts:", error);
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        void fetchPosts();
    }, []);
    const filteredPosts = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useMemo(()=>{
        const now = new Date();
        return allPosts.filter((post)=>{
            if (filterStatus === "all") return true;
            if (filterStatus === "past") {
                return new Date(post.scheduledAt) < now;
            }
            return post.status === filterStatus;
        });
    }, [
        allPosts,
        filterStatus
    ]);
    const handlePostClick = (post)=>{
        setSelectedPostForEdit(post);
        setIsEditorModalOpen(true);
    };
    const handleSaveEditedPost = async (updatedPost)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["updatePost"])(updatedPost);
        await fetchPosts();
        setIsEditorModalOpen(false);
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold mb-6",
                        children: "Content Calendar"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised flex items-center justify-center p-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Loading calendar..."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                            lineNumber: 130,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
            lineNumber: 126,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold mb-6",
                        children: "Content Calendar"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row justify-between items-center gap-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-2 p-1 bg-gray-200 rounded-bru-md border-2 border-black",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setView("calendar"),
                                        className: `flex items-center px-3 py-1 rounded-bru-md text-sm font-bold transition-colors ${view === "calendar" ? "bg-white text-bru-purple shadow" : "text-gray-600 hover:bg-gray-100"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                className: "w-4 h-4 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 149,
                                                columnNumber: 15
                                            }, this),
                                            "Calendar"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 145,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setView("list"),
                                        className: `flex items-center px-3 py-1 rounded-bru-md text-sm font-bold transition-colors ${view === "list" ? "bg-white text-bru-purple shadow" : "text-gray-600 hover:bg-gray-100"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                                                className: "w-4 h-4 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 156,
                                                columnNumber: 15
                                            }, this),
                                            "List"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 152,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                lineNumber: 144,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "date-picker",
                                        className: "sr-only",
                                        children: "Select Date"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 163,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        id: "date-picker",
                                        className: "bru-input !py-2 !pl-3 !pr-8 text-sm font-bold appearance-none bg-white",
                                        value: selectedDateFromPicker ?? "",
                                        onChange: (e)=>setSelectedDateFromPicker(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 166,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: filterStatus,
                                        onChange: (e)=>setFilterStatus(e.target.value),
                                        className: "bru-input !py-2 !pl-3 !pr-8 text-sm font-bold appearance-none bg-white",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "all",
                                                children: "All Statuses"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 181,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "past",
                                                children: "Past Posts"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 182,
                                                columnNumber: 15
                                            }, this),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statusOptions"].map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: option.value,
                                                    children: option.label
                                                }, option.id, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                    lineNumber: 184,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 176,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__["Filter"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                            lineNumber: 190,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 189,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised p-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-md font-bold mb-2",
                                children: "Status Color Guide:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-x-4 gap-y-2",
                                children: [
                                    __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statusOptions"].map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center text-sm text-gray-700",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `w-3 h-3 rounded-full border-2 ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusColorClasses"])(option.value).split(" ")[0].replace("bg-", "border-")} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$calendarUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusColorClasses"])(option.value).split(" ")[0]} mr-2`
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                    lineNumber: 204,
                                                    columnNumber: 17
                                                }, this),
                                                option.label
                                            ]
                                        }, option.id, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                            lineNumber: 200,
                                            columnNumber: 15
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center text-sm text-gray-700",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-3 h-3 rounded-full border-2 border-gray-300 bg-purple-50 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 218,
                                                columnNumber: 15
                                            }, this),
                                            "Today's Date"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 217,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center text-sm text-gray-700",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-3 h-3 rounded-full border-2 border-bru-yellow bg-yellow-100 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                                lineNumber: 222,
                                                columnNumber: 15
                                            }, this),
                                            "Selected Date"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                        lineNumber: 221,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this),
                    view === "calendar" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$calendar$2f$CalendarView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        posts: filteredPosts,
                        onPostClick: handlePostClick,
                        selectedDateFromPicker: selectedDateFromPicker
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 229,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ListView, {
                        posts: filteredPosts,
                        onPostClick: handlePostClick
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                        lineNumber: 235,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$PostEditorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                isOpen: isEditorModalOpen,
                onClose: ()=>setIsEditorModalOpen(false),
                post: selectedPostForEdit,
                onSave: handleSaveEditedPost
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
                lineNumber: 239,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/calendar/page.tsx",
        lineNumber: 138,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0c0da0ac._.js.map