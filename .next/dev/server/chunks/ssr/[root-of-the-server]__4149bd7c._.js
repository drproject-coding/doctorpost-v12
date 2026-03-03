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
"[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check.mjs [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/info.mjs [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x-circle.mjs [app-ssr] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$triangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-triangle.mjs [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Book$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/book.mjs [app-ssr] (ecmascript) <export default as Book>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/bar-chart.mjs [app-ssr] (ecmascript) <export default as BarChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/message-square.mjs [app-ssr] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/target.mjs [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/trending-up.mjs [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/heart.mjs [app-ssr] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/user-check.mjs [app-ssr] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/smile.mjs [app-ssr] (ecmascript) <export default as Smile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/book-open.mjs [app-ssr] (ecmascript) <export default as BookOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
"use client";
;
;
;
const categoryIcons = {
    "Educational Content": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Book$3e$__["Book"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 40,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)),
    "Data-Driven Content": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart$3e$__["BarChart"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 41,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)),
    "Engagement Content": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 42,
        columnNumber: 25
    }, ("TURBOPACK compile-time value", void 0)),
    "Authority Content": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 43,
        columnNumber: 24
    }, ("TURBOPACK compile-time value", void 0)),
    "Intrigue & Discovery": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 44,
        columnNumber: 27
    }, ("TURBOPACK compile-time value", void 0)),
    "Pain & Solution": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$triangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 45,
        columnNumber: 22
    }, ("TURBOPACK compile-time value", void 0)),
    "Credibility & Trust": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 46,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)),
    "Challenge & Debate": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 47,
        columnNumber: 25
    }, ("TURBOPACK compile-time value", void 0)),
    "Expertise & Value": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 48,
        columnNumber: 24
    }, ("TURBOPACK compile-time value", void 0)),
    "Learning & Guidance": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Book$3e$__["Book"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 49,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)),
    "Market & Future": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 50,
        columnNumber: 22
    }, ("TURBOPACK compile-time value", void 0)),
    "Personal Wellbeing": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 51,
        columnNumber: 25
    }, ("TURBOPACK compile-time value", void 0)),
    "Proof & Results": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart$3e$__["BarChart"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 52,
        columnNumber: 22
    }, ("TURBOPACK compile-time value", void 0)),
    "Formal & Expert": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 53,
        columnNumber: 22
    }, ("TURBOPACK compile-time value", void 0)),
    "Informal & Engaging": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 54,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)),
    Storytelling: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__["BookOpen"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 55,
        columnNumber: 17
    }, ("TURBOPACK compile-time value", void 0)),
    "Emotional & Relatable": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 56,
        columnNumber: 28
    }, ("TURBOPACK compile-time value", void 0)),
    Visionary: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 57,
        columnNumber: 14
    }, ("TURBOPACK compile-time value", void 0)),
    "Niche & Specific": /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
        size: 16
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 58,
        columnNumber: 23
    }, ("TURBOPACK compile-time value", void 0))
};
// Helper for performance badges
const PerformanceBadge = ({ indicator, isTrending })=>{
    if (!indicator && !isTrending) return null;
    const baseClasses = "text-xs font-bold py-0.5 px-1.5 border";
    let indicatorClasses = "";
    let indicatorLabel = "";
    switch(indicator){
        case "high":
            indicatorClasses = "badge-high";
            indicatorLabel = "Avg. 5k+ views";
            break;
        case "medium":
            indicatorClasses = "badge-medium";
            indicatorLabel = "Avg. 2-5k views";
            break;
        case "experimental":
            indicatorClasses = "badge-experimental";
            indicatorLabel = "New format";
            break;
        default:
            break;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center space-x-1",
        children: [
            indicator && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${baseClasses} ${indicatorClasses}`,
                children: indicatorLabel
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            isTrending && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${baseClasses} badge-trending flex items-center`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                        size: 12,
                        className: "mr-1"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 98,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    " Trending"
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 97,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
// Helper for compatibility badges
const CompatibilityBadge = ({ status, reason })=>{
    if (!status || status === "neutral") return null;
    const baseClasses = "text-xs font-bold py-0.5 px-1.5 border ml-1";
    let statusClasses = "";
    let statusIcon = null;
    let statusLabel = "";
    switch(status){
        case "recommended":
            statusClasses = "badge-compatibility-recommended";
            statusIcon = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                size: 12
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 120,
                columnNumber: 20
            }, ("TURBOPACK compile-time value", void 0));
            statusLabel = "Recommended";
            break;
        case "caution":
            statusClasses = "badge-compatibility-caution";
            statusIcon = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$triangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                size: 12
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 125,
                columnNumber: 20
            }, ("TURBOPACK compile-time value", void 0));
            statusLabel = "Caution";
            break;
        case "not-recommended":
            statusClasses = "badge-compatibility-not-recommended";
            statusIcon = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                size: 12
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 130,
                columnNumber: 20
            }, ("TURBOPACK compile-time value", void 0));
            statusLabel = "Not Recommended";
            break;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${baseClasses} ${statusClasses} flex items-center`,
                children: [
                    statusIcon,
                    " ",
                    statusLabel
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            reason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "enhanced-dropdown-tooltip hidden group-hover:block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: reason
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                    lineNumber: 142,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 141,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 136,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const EnhancedDropdown = ({ label, options, value, onChange, placeholder = "Select an option", compatibilityMap = {}, loading = false })=>{
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [activeFilters, setActiveFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const selectedOption = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>options.find((opt)=>opt.value === value), [
        options,
        value
    ]);
    const toggleDropdown = ()=>setIsOpen(!isOpen);
    const handleSelect = (optionValue)=>{
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
        setActiveFilters([]);
    };
    const handleFilterToggle = (filter)=>{
        setActiveFilters((prev)=>prev.includes(filter) ? prev.filter((f)=>f !== filter) : [
                ...prev,
                filter
            ]);
    };
    const filteredOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        let filtered = options.filter((option)=>option.label.toLowerCase().includes(searchTerm.toLowerCase()) || option.description.toLowerCase().includes(searchTerm.toLowerCase()));
        if (activeFilters.includes("high-performance")) {
            filtered = filtered.filter((opt)=>opt.performanceIndicator === "high");
        }
        if (activeFilters.includes("trending")) {
            filtered = filtered.filter((opt)=>opt.isTrending);
        }
        if (activeFilters.includes("experimental")) {
            filtered = filtered.filter((opt)=>opt.performanceIndicator === "experimental");
        }
        if (activeFilters.includes("recommended")) {
            filtered = filtered.filter((opt)=>compatibilityMap[opt.id]?.status === "recommended");
        }
        // Group by category
        const grouped = {};
        filtered.forEach((option)=>{
            if (!grouped[option.category]) {
                grouped[option.category] = [];
            }
            grouped[option.category].push(option);
        });
        return grouped;
    }, [
        options,
        searchTerm,
        activeFilters,
        compatibilityMap
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleClickOutside = (event)=>{
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return ()=>document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const filterTags = [
        {
            id: "all",
            label: "All",
            filter: ""
        },
        {
            id: "high-performance",
            label: "High Performance \u2728",
            filter: "high-performance"
        },
        {
            id: "trending",
            label: "Trending \ud83d\udd25",
            filter: "trending"
        },
        {
            id: "experimental",
            label: "Experimental \ud83e\uddea",
            filter: "experimental"
        },
        {
            id: "recommended",
            label: "Recommended \u2705",
            filter: "recommended"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "enhanced-dropdown-container",
        ref: dropdownRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: `dropdown-${label}`,
                className: "bru-field__label",
                children: label
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 251,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                id: `dropdown-${label}`,
                type: "button",
                className: "enhanced-dropdown-trigger bru-input",
                onClick: toggleDropdown,
                "aria-haspopup": "listbox",
                "aria-expanded": isOpen,
                disabled: loading,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex items-center",
                        children: selectedOption ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                selectedOption.category && categoryIcons[selectedOption.category] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "mr-2 text-gray-500",
                                    children: categoryIcons[selectedOption.category]
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                    lineNumber: 268,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)),
                                selectedOption.label,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CompatibilityBadge, {
                                    status: compatibilityMap[selectedOption.id]?.status,
                                    reason: compatibilityMap[selectedOption.id]?.reason
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                    lineNumber: 274,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-500",
                            children: placeholder
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 16,
                        className: `transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 283,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 254,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "enhanced-dropdown-content",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "enhanced-dropdown-search",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Search options...",
                            className: "bru-input",
                            value: searchTerm,
                            onChange: (e)=>setSearchTerm(e.target.value),
                            "aria-label": `Search ${label} options`
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                            lineNumber: 292,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 291,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "enhanced-dropdown-filters",
                        children: filterTags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `enhanced-dropdown-filter-tag ${activeFilters.includes(tag.filter) || tag.id === "all" && activeFilters.length === 0 ? "active" : ""}`,
                                onClick: ()=>tag.id === "all" ? setActiveFilters([]) : handleFilterToggle(tag.filter),
                                children: tag.label
                            }, tag.id, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                lineNumber: 303,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 301,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    Object.keys(filteredOptions).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 text-center text-gray-500",
                        children: "No options found."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                        lineNumber: 317,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : Object.entries(filteredOptions).map(([category, optionsInCat])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "enhanced-dropdown-category-header flex items-center space-x-2",
                                    children: [
                                        categoryIcons[category] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-400",
                                            children: categoryIcons[category]
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                            lineNumber: 325,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: category
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                            lineNumber: 329,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                    lineNumber: 323,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                optionsInCat.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `enhanced-dropdown-option ${option.value === value ? "selected" : ""}`,
                                        onClick: ()=>handleSelect(option.value),
                                        role: "option",
                                        "aria-selected": option.value === value,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "enhanced-dropdown-option-content",
                                                children: [
                                                    option.value === value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                        size: 16,
                                                        className: "mr-2 text-bru-purple"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex-1",
                                                        children: option.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 343,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "enhanced-dropdown-option-badges",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PerformanceBadge, {
                                                                indicator: option.performanceIndicator,
                                                                isTrending: option.isTrending
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                                lineNumber: 345,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CompatibilityBadge, {
                                                                status: compatibilityMap[option.id]?.status,
                                                                reason: compatibilityMap[option.id]?.reason
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                                lineNumber: 349,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 344,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                lineNumber: 339,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute hidden group-hover:block enhanced-dropdown-tooltip",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        className: "font-bold",
                                                        children: option.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 357,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "mb-2",
                                                        children: option.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 358,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-semibold",
                                                        children: "\\ud83d\\udca1 Example:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 359,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "italic mb-2",
                                                        children: [
                                                            '"',
                                                            option.exampleSnippet,
                                                            '"'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 360,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-semibold",
                                                        children: "\\u2705 Best for:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 363,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "list-disc list-inside ml-4",
                                                        children: option.useCases.map((uc, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: uc
                                                            }, i, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                                lineNumber: 366,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                        lineNumber: 364,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                                lineNumber: 356,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, option.id, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                                        lineNumber: 332,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            ]
                        }, category, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                            lineNumber: 322,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 290,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "recommendation-loading",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                    size: 24,
                    className: "animate-spin text-bru-purple"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                    lineNumber: 380,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
                lineNumber: 379,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx",
        lineNumber: 250,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = EnhancedDropdown;
}),
"[project]/Desktop/doctorpost-v12/lib/prompts.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generatePost",
    ()=>generatePost,
    "getPromptById",
    ()=>getPromptById,
    "preparePromptTemplate",
    ()=>preparePromptTemplate,
    "tonePrompts",
    ()=>tonePrompts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/aiService.ts [app-ssr] (ecmascript)");
;
const tonePrompts = [
    {
        id: "casual-witty",
        name: "Casual & Witty",
        description: "Punchy, first-person riffs with short, staccato sentences, playful sarcasm, and quick take-home lines that feel like a high-engagement LinkedIn scroll.",
        promptTemplate: `Act like a witty LinkedIn influencer who writes high-engagement, first-person riffs. Your voice is casual, playful, and a little sarcastic. You specialize in punchy, short sentences that create a fast scroll experience.

Objective:
Write a LinkedIn post in the "Casual & Witty" style that hooks quickly, entertains, and lands a crisp takeaway readers remember.

Inputs (replace bracketed items before you write):
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE TAKEAWAY: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Hard Constraints (must pass all):
- Length: ~25 lines (±3). One sentence per line. Blank line between paragraphs is allowed.
- Opener: Line 1 starts with a contrarian quote or statement that challenges a common belief.
- Short-sentence ratio: ≥45% of lines have ≤6 words.
- Rhetorical questions: Exactly 4 lines end with "?".
- Address the reader: Use "you" at least 5 times.
- Formatting bans: no bullets, no emojis, no hashtags, no exclamation points, no bold/ALL CAPS emphasis.
- Tone: playful sarcasm without snark or insults; confident, first person ("I", "me", "my").
- CTA: Final line is a memorable one-liner that nudges the CTA GOAL without salesy hype. (e.g., "Your move." "Prove me wrong." "Tell me where I'm off."). No question mark if you already hit 4.

Structure (follow step-by-step):
1) Hook (Lines 1–3): Start contrarian. State the tension. Tease a payoff without revealing it.
2) Snapshot (Lines 4–8): Share a quick first-person moment or observation. Keep it human. Keep it tight.
3) Turn (Lines 9–14): Flip the obvious logic. Drop 2 of the 4 rhetorical questions across this section. Use relatable metaphors.
4) Lesson (Lines 15–20): Boil the idea to its core. Use simple, scannable, staccato lines. Add the last 2 rhetorical questions here.
5) Takeaway (Lines 21–24): Deliver the CORE TAKEAWAY in fresh wording. Make it quotable.
6) CTA (Line 25): One sharp closer that implies the CTA GOAL (e.g., "Your move." "Prove me wrong." "Tell me where I'm off."). No question mark if you already hit 4.

Writing Rules:
- Keep paragraphs 1–2 lines. White space is your friend.
- Prefer concrete, everyday language over jargon.
- Use callbacks and contrast ("I used to… Now I…") to create rhythm.
- Show, then tell. Tell, then tighten.
- If any sentence exceeds 16 words, consider splitting it.
- Never include labels, lists, or meta-notes in the output.

Self-check before finalizing (silently fix if any fail):
- Count lines (22–28?). Count "?" (exactly 4?). Count "you" (≥5?). Any bullets/emojis/hashtags/exclamation points? Any line >1 sentence? ≥45% lines ≤6 words? Opener contrarian? Final line = CTA one-liner?

Output Format:
- Return only the finished LinkedIn post in plain text. One sentence per line. No headers, labels, or explanations.

Take a deep breath and work on this problem step-by-step.`
    },
    {
        id: "professional-authority",
        name: "Professional Authority",
        description: "Balanced, expert voice backed by facts and research. Establishes industry leadership with measured confidence.",
        promptTemplate: `Act as a respected industry leader with deep expertise in your field. You communicate with a professional, authoritative voice that establishes credibility while remaining accessible.

Objective:
Create a LinkedIn post in the "Professional Authority" tone that demonstrates thought leadership while providing valuable insights to your audience.

Inputs:
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE INSIGHT: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Content Requirements:
- Length: 8-12 paragraphs, with each paragraph 1-3 sentences.
- Hook: Start with a compelling statistic, research finding, or industry observation.
- Evidence: Include at least 2 data points, research references, or expert sources.
- Structure: Problem → Context → Solution → Application → Insight → Call to action.
- Voice: Third-person or first-person plural ("we") dominant; limited "I" statements.
- Tone: Confident but not arrogant; precise language; nuanced perspectives.
- Language: Professional vocabulary appropriate to your industry, minimal jargon.
- Formatting: Use 1-2 line breaks for readability; no emojis or excessive punctuation.

The post should:
- Establish your expertise without explicitly stating credentials
- Present balanced, well-reasoned arguments
- Acknowledge complexity while providing clarity
- Include practical implications or applications
- Close with a thoughtful call to action that invites professional engagement

Output Format:
Return only the finished LinkedIn post with appropriate paragraph breaks. No headers, explanations, or meta-commentary.`
    },
    {
        id: "approachable-expert",
        name: "Approachable Expert",
        description: "Friendly, accessible expertise. Explains complex ideas simply with relatable examples and occasional humor.",
        promptTemplate: `Act as an approachable expert who makes complex topics accessible and engaging. Your tone is friendly and conversational while still demonstrating clear expertise.

Objective:
Create a LinkedIn post in the "Approachable Expert" tone that simplifies a complex topic, builds connection, and provides valuable insights.

Inputs:
- TOPIC: {{topic}}
- AUDIENCE: {{audience}}
- CORE LESSON: {{coreTakeaway}}
- CTA GOAL: {{ctaGoal}}
- CONTENT PILLAR: {{contentPillar}}
- HOOK: {{hookPattern}}
- POST TYPE: {{postType}}

Content Requirements:
- Length: 6-10 paragraphs of varying length, with conversational flow.
- Hook: Start with a relatable scenario, common misconception, or intriguing question.
- Structure: Attention-grabber → Personal connection → Problem → Simple explanation → Example or analogy → Practical application → Insight → Friendly call to action.
- Voice: Balanced mix of first-person ("I") and second-person ("you"), creating conversation.
- Tone: Warm, enthusiastic, occasionally humorous, but always respectful of the topic's importance.
- Language: Simple explanations of complex ideas; analogies to everyday experiences; minimal jargon with clear definitions when used.
- Formatting: Strategic use of 1-2 emojis for emphasis; line breaks for readability; 1-2 questions to engage readers.

The post should:
- Build rapport through shared experiences or challenges
- Demystify complex concepts with simple explanations
- Use analogies that connect to readers' everyday experiences
- Include a personal touch that humanizes your expertise
- End with an inviting, low-pressure call to action

Output Format:
Return only the finished LinkedIn post with appropriate paragraph breaks and minimal emoji use (if any). No headers, explanations, or meta-commentary.`
    }
];
const getPromptById = (id)=>{
    return tonePrompts.find((prompt)=>prompt.id === id);
};
const preparePromptTemplate = (template, params)=>{
    let preparedPrompt = template;
    // Replace parameters in the template
    preparedPrompt = preparedPrompt.replace(/{{topic}}/g, params.topic);
    preparedPrompt = preparedPrompt.replace(/{{audience}}/g, params.audience.join(", "));
    preparedPrompt = preparedPrompt.replace(/{{coreTakeaway}}/g, params.coreTakeaway ?? "Insights that transform how you approach this topic");
    preparedPrompt = preparedPrompt.replace(/{{ctaGoal}}/g, params.ctaGoal ?? "Share your thoughts in the comments");
    preparedPrompt = preparedPrompt.replace(/{{contentPillar}}/g, params.contentPillar);
    preparedPrompt = preparedPrompt.replace(/{{hookPattern}}/g, params.hookPattern);
    preparedPrompt = preparedPrompt.replace(/{{postType}}/g, params.postType);
    return preparedPrompt;
};
const generatePost = async (prompt, settings, onProgress, signal)=>{
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateWithAi"])({
        systemPrompt: "",
        userMessage: prompt
    }, settings, onProgress, signal);
    return response.content;
};
}),
"[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$prompts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/prompts.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/clock.mjs [app-ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/copy.mjs [app-ssr] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/download.mjs [app-ssr] (ecmascript) <export default as Download>");
"use client";
;
;
;
;
const PostGenerator = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ parameters, profile, aiSettings, triggerGeneration, onContentGenerated }, ref)=>{
    const [generatedContent, setGeneratedContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [estimatedReadTime, setEstimatedReadTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isContentSelected, setIsContentSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [aiProgress, setAiProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const contentRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, ()=>({
            getGeneratedContent: ()=>generatedContent
        }));
    const generateContentEffect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setIsGenerating(true);
        setError(null);
        setCopied(false);
        setIsContentSelected(false);
        setAiProgress(null);
        try {
            const promptTemplate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$prompts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPromptById"])(parameters.toneId);
            if (!promptTemplate) {
                throw new Error(`No prompt template found for tone: ${parameters.toneId}`);
            }
            const preparedPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$prompts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["preparePromptTemplate"])(promptTemplate.promptTemplate, {
                topic: parameters.topic,
                audience: profile.audience,
                coreTakeaway: parameters.coreTakeaway,
                ctaGoal: parameters.ctaGoal,
                contentPillar: parameters.contentPillar,
                hookPattern: parameters.hookPattern,
                postType: parameters.postType
            });
            const content = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$prompts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generatePost"])(preparedPrompt, aiSettings, (progress)=>setAiProgress(progress), controller.signal);
            setGeneratedContent(content);
            onContentGenerated(content);
            const wordCount = content.split(/\s+/).length;
            setEstimatedReadTime(Math.max(1, Math.ceil(wordCount / 225)));
        } catch (err) {
            if (controller.signal.aborted) return;
            setError(err instanceof Error ? err.message : "An error occurred while generating the post");
        } finally{
            setIsGenerating(false);
            setAiProgress(null);
        }
    }, [
        parameters,
        profile,
        aiSettings,
        onContentGenerated
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (triggerGeneration > 0 && parameters.topic && parameters.postType && parameters.hookPattern && parameters.contentPillar && parameters.toneId) {
            void generateContentEffect();
        }
    }, [
        triggerGeneration,
        generateContentEffect,
        parameters
    ]);
    const copyToClipboard = async ()=>{
        if (contentRef.current) {
            try {
                contentRef.current.select();
                contentRef.current.setSelectionRange(0, generatedContent.length);
                contentRef.current.focus();
                setIsContentSelected(true);
                await navigator.clipboard.writeText(generatedContent);
                setCopied(true);
                setError(null);
            } catch (err) {
                console.error("Failed to copy to clipboard:", err);
                setError("Failed to copy to clipboard.");
                setCopied(false);
            } finally{
                setTimeout(()=>{
                    setIsContentSelected(false);
                    setCopied(false);
                }, 2000);
            }
        }
    };
    const downloadAsText = ()=>{
        const element = document.createElement("a");
        const file = new Blob([
            generatedContent
        ], {
            type: "text/plain"
        });
        element.href = URL.createObjectURL(file);
        element.download = `${parameters.topic.replace(/\s+/g, "_")}_post.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-alert bru-alert--error",
                style: {
                    marginBottom: "var(--bru-space-4)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bru-alert__icon",
                        children: "!"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 164,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-alert__content",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                            lineNumber: 166,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 165,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                lineNumber: 160,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            isGenerating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    minHeight: 256,
                    border: "2px dashed var(--bru-grey-85)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bru-grey)",
                    gap: "var(--bru-space-3)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 32,
                        className: "animate-spin",
                        style: {
                            color: "var(--bru-purple)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 184,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: aiProgress?.step ?? "Generating your post..."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 189,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    aiProgress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: 192,
                            height: 8,
                            background: "rgba(0,0,0,0.1)",
                            overflow: "hidden"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                width: `${aiProgress.percent}%`,
                                height: "100%",
                                background: "var(--bru-purple)",
                                transition: "width 300ms ease"
                            }
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                            lineNumber: 199,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 191,
                        columnNumber: 15
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-sm)"
                        },
                        children: [
                            "Using ",
                            aiSettings.activeProvider
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 209,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                lineNumber: 172,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : generatedContent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            fontSize: "var(--bru-text-sm)",
                            color: "var(--bru-grey)",
                            marginBottom: "var(--bru-space-2)",
                            gap: "var(--bru-space-1)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                                lineNumber: 225,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            " ",
                            estimatedReadTime,
                            " min read"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 215,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        ref: contentRef,
                        style: {
                            width: "100%",
                            minHeight: 256,
                            resize: "vertical",
                            padding: "var(--bru-space-4)",
                            border: isContentSelected ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                            boxShadow: isContentSelected ? "3px 3px 0 0 var(--bru-purple)" : "var(--bru-shadow-sm)",
                            background: "var(--bru-white)",
                            fontFamily: "var(--bru-font-mono)",
                            fontSize: "var(--bru-text-md)",
                            lineHeight: "var(--bru-leading-loose)",
                            color: "var(--bru-black)",
                            outline: "none"
                        },
                        value: generatedContent,
                        onChange: (e)=>{
                            setGeneratedContent(e.target.value);
                            onContentGenerated(e.target.value);
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 227,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-actions",
                        style: {
                            marginTop: "var(--bru-space-3)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--sm",
                                onClick: void copyToClipboard,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                                        lineNumber: 261,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    copied ? "Copied!" : "Copy"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                                lineNumber: 257,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--sm",
                                onClick: downloadAsText,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                                        lineNumber: 265,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Download"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                                lineNumber: 264,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                        lineNumber: 253,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                lineNumber: 214,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    minHeight: 256,
                    border: "2px dashed var(--bru-grey-85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bru-grey)",
                    padding: "var(--bru-space-6)",
                    textAlign: "center"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: 'Fill in the form and click "Generate Post" to create your LinkedIn content'
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                    lineNumber: 283,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
                lineNumber: 271,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx",
        lineNumber: 158,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
const __TURBOPACK__default__export__ = PostGenerator;
}),
"[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
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
const SchedulePostModal = ({ isOpen, onClose, onSchedule, initialDate, initialStatus = 'scheduled' })=>{
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialDate ?? new Date().toISOString().split('T')[0]);
    const [selectedStatus, setSelectedStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialStatus);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOpen) {
            setSelectedDate(initialDate ?? new Date().toISOString().split('T')[0]);
            setSelectedStatus(initialStatus);
        }
    }, [
        isOpen,
        initialDate,
        initialStatus
    ]);
    if (!isOpen) return null;
    const handleSchedule = ()=>{
        onSchedule(selectedDate, selectedStatus);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bru-overlay",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bru-modal w-full max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "bru-modal__title",
                            children: "Schedule Post"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "bru-modal__close",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                lineNumber: 52,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                    lineNumber: 49,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__body",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "schedule-date",
                                    className: "bru-field__label",
                                    children: "Date"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                    lineNumber: 58,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "date",
                                    id: "schedule-date",
                                    className: "bru-input",
                                    value: selectedDate,
                                    onChange: (e)=>setSelectedDate(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "schedule-status",
                                    className: "bru-field__label",
                                    children: "Status"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                    lineNumber: 71,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    id: "schedule-status",
                                    className: "bru-input",
                                    value: selectedStatus,
                                    onChange: (e)=>setSelectedStatus(e.target.value),
                                    children: statusOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: option.value,
                                            children: option.label
                                        }, option.id, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                            lineNumber: 81,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                                    lineNumber: 74,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                    lineNumber: 56,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-modal__footer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "bru-btn bru-btn--secondary",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 90,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: void handleSchedule,
                            className: "bru-btn bru-btn--primary",
                            children: "Schedule"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
                    lineNumber: 89,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
            lineNumber: 48,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = SchedulePostModal;
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CreatePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/api.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/search.mjs [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/trending-up.mjs [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$EnhancedDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/EnhancedDropdown.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$PostGenerator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/PostGenerator.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$SchedulePostModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/SchedulePostModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-ssr] (ecmascript)");
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
function CreatePage() {
    const { user, loadingAuth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeSubNav, setActiveSubNav] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("generate-post");
    // Form values
    const [postType, setPostType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [hookPattern, setHookPattern] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [contentPillar, setContentPillar] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedToneId, setSelectedToneId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // Subtopic feature
    const [topic, setTopic] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [subtopics, setSubtopics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedSubtopic, setSelectedSubtopic] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadingSubtopics, setLoadingSubtopics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // AI recommendation state
    const [recommendation, setRecommendation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadingRecommendation, setLoadingRecommendation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Additional parameters
    const [coreTakeaway, setCoreTakeaway] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [ctaGoal, setCtaGoal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [triggerPostGeneration, setTriggerPostGeneration] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [generatedContent, setGeneratedContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const postGeneratorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Schedule Post Modal
    const [isScheduleModalOpen, setIsScheduleModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveFeedback, setSaveFeedback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (loadingAuth) return;
        const fetchProfile = async ()=>{
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getBrandProfile"])(user.id);
                setProfile(data);
                setSelectedToneId("casual-witty");
                if (__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedContentPillars"].length > 0) {
                    setContentPillar(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedContentPillars"][0].value);
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally{
                setLoading(false);
            }
        };
        void fetchProfile();
    }, [
        user?.id,
        loadingAuth
    ]);
    const aiSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!profile) return null;
        return {
            activeProvider: profile.aiProvider,
            claudeApiKey: profile.claudeApiKey,
            straicoApiKey: profile.straicoApiKey,
            straicoModel: profile.straicoModel,
            oneforallApiKey: profile.oneforallApiKey,
            oneforallModel: profile.oneforallModel
        };
    }, [
        profile
    ]);
    const handleTopicChange = (e)=>{
        setTopic(e.target.value);
        setSubtopics([]);
        setSelectedSubtopic(null);
        setRecommendation(null);
        setTriggerPostGeneration(0);
        setGeneratedContent("");
    };
    const handleFindSubtopics = async ()=>{
        if (!topic.trim()) return;
        setLoadingSubtopics(true);
        setSubtopics([]);
        setSelectedSubtopic(null);
        setRecommendation(null);
        setTriggerPostGeneration(0);
        setGeneratedContent("");
        try {
            const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["findSubtopics"])(topic, 5, aiSettings ?? undefined);
            setSubtopics(results);
        } catch (error) {
            console.error("Failed to find subtopics:", error);
        } finally{
            setLoadingSubtopics(false);
        }
    };
    const handleSelectSubtopic = async (subtopic)=>{
        setSelectedSubtopic(subtopic);
        setTopic(subtopic.text);
        setTriggerPostGeneration(0);
        setGeneratedContent("");
        setLoadingRecommendation(true);
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getPostRecommendations"])(topic, subtopic.text, aiSettings ?? undefined);
            setRecommendation(result);
            setPostType(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedPostTypes"].some((opt)=>opt.value === result.postType) ? result.postType : "");
            setHookPattern(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedHookPatterns"].some((opt)=>opt.value === result.hookPattern) ? result.hookPattern : "");
            setContentPillar(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedContentPillars"].some((opt)=>opt.value === result.contentPillar) ? result.contentPillar : "");
        } catch (error) {
            console.error("Failed to get recommendations:", error);
        } finally{
            setLoadingRecommendation(false);
        }
    };
    const getSourceBadgeLabel = (source)=>{
        switch(source){
            case "google_trends":
                return "Google Trends";
            case "google_questions":
                return "Frequently Asked";
            case "related_topics":
                return "Related Topic";
            default:
                return source;
        }
    };
    const handleGeneratePostClick = ()=>{
        if (!profile || !topic || !postType || !hookPattern || !contentPillar || !selectedToneId) {
            setSaveFeedback("Please fill in all required fields (Topic, Post Type, Hook Pattern, Content Pillar, Tone) before generating.");
            setTimeout(()=>setSaveFeedback(null), 3000);
            return;
        }
        setSaveFeedback(null);
        setGeneratedContent("");
        setTriggerPostGeneration((prev)=>prev + 1);
    };
    const handleContentGenerated = (content)=>{
        setGeneratedContent(content);
    };
    const handleSaveDraft = async ()=>{
        if (!profile || !generatedContent) {
            setSaveFeedback("No content to save. Please generate a post first.");
            setTimeout(()=>setSaveFeedback(null), 3000);
            return;
        }
        setSaving(true);
        setSaveFeedback(null);
        try {
            const newPost = {
                id: "temp-draft-" + Date.now(),
                userId: profile.id,
                title: topic.substring(0, 100),
                content: generatedContent,
                scheduledAt: new Date().toISOString(),
                pillar: contentPillar,
                status: "draft"
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["savePostDraft"])(newPost);
            setSaveFeedback("Post saved as draft successfully!");
        } catch (error) {
            console.error("Failed to save draft:", error);
            setSaveFeedback("Failed to save draft. Please try again.");
        } finally{
            setSaving(false);
            setTimeout(()=>setSaveFeedback(null), 3000);
        }
    };
    const handleOpenScheduleModal = ()=>{
        if (!generatedContent) {
            setSaveFeedback("No content to schedule. Please generate a post first.");
            setTimeout(()=>setSaveFeedback(null), 3000);
            return;
        }
        setIsScheduleModalOpen(true);
    };
    const handleSchedulePost = async (date, status)=>{
        if (!profile || !generatedContent) {
            setSaveFeedback("No content to schedule. Please generate a post first.");
            setTimeout(()=>setSaveFeedback(null), 3000);
            return;
        }
        setSaving(true);
        setSaveFeedback(null);
        try {
            const newPost = {
                id: "temp-scheduled-" + Date.now(),
                userId: profile.id,
                title: topic.substring(0, 100),
                content: generatedContent,
                scheduledAt: new Date(date).toISOString(),
                pillar: contentPillar,
                status: status
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["schedulePost"])(newPost);
            setSaveFeedback("Post scheduled successfully!");
            setIsScheduleModalOpen(false);
        } catch (error) {
            console.error("Failed to schedule post:", error);
            setSaveFeedback("Failed to schedule post. Please try again.");
        } finally{
            setSaving(false);
            setTimeout(()=>setSaveFeedback(null), 3000);
        }
    };
    const postGenerationParams = {
        topic: selectedSubtopic?.text ?? topic,
        audience: profile?.audience ?? [],
        coreTakeaway: coreTakeaway,
        ctaGoal: ctaGoal,
        contentPillar: contentPillar,
        hookPattern: hookPattern,
        postType: postType,
        toneId: selectedToneId,
        triggerGeneration: triggerPostGeneration
    };
    const getCompatibilityMap = (rec)=>{
        if (!rec) return {};
        const map = {};
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedPostTypes"].forEach((opt)=>{
            if (opt.value === rec.postType) {
                map[opt.id] = {
                    status: "recommended",
                    reason: rec.reasoning.postType
                };
            } else if (rec.compatiblePostTypes.includes(opt.value)) {
                map[opt.id] = {
                    status: "caution",
                    reason: "Compatible option, but not the primary recommendation."
                };
            } else {
                map[opt.id] = {
                    status: "neutral"
                };
            }
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedHookPatterns"].forEach((opt)=>{
            if (opt.value === rec.hookPattern) {
                map[opt.id] = {
                    status: "recommended",
                    reason: rec.reasoning.hookPattern
                };
            } else if (rec.compatibleHookPatterns.includes(opt.value)) {
                map[opt.id] = {
                    status: "caution",
                    reason: "Compatible option, but not the primary recommendation."
                };
            } else {
                map[opt.id] = {
                    status: "neutral"
                };
            }
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedContentPillars"].forEach((opt)=>{
            if (opt.value === rec.contentPillar) {
                map[opt.id] = {
                    status: "recommended",
                    reason: rec.reasoning.contentPillar
                };
            } else if (rec.compatibleContentPillars.includes(opt.value)) {
                map[opt.id] = {
                    status: "caution",
                    reason: "Compatible option, but not the primary recommendation."
                };
            } else {
                map[opt.id] = {
                    status: "neutral"
                };
            }
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedToneOptions"].forEach((opt)=>{
            if (opt.id === rec.toneId) {
                map[opt.id] = {
                    status: "recommended",
                    reason: rec.reasoning.tone
                };
            } else if (rec.compatibleTones.includes(opt.id)) {
                map[opt.id] = {
                    status: "caution",
                    reason: "Compatible option, but not the primary recommendation."
                };
            } else {
                map[opt.id] = {
                    status: "neutral"
                };
            }
        });
        return map;
    };
    const compatibilityMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>getCompatibilityMap(recommendation), [
        recommendation
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bru-card bru-card--raised",
            style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading brand profile..."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 362,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
            lineNumber: 353,
            columnNumber: 7
        }, this);
    }
    if (!profile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bru-alert bru-alert--error",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "bru-alert__icon",
                    children: "!"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                    lineNumber: 370,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bru-alert__content",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__title",
                            children: "No brand profile found"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                            lineNumber: 372,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bru-alert__text",
                            children: [
                                "Please go to",
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "/settings",
                                    style: {
                                        fontWeight: 700,
                                        textDecoration: "underline"
                                    },
                                    children: "Settings"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                    lineNumber: 375,
                                    columnNumber: 13
                                }, this),
                                " ",
                                "to set up your brand profile before creating content."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                            lineNumber: 373,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                    lineNumber: 371,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
            lineNumber: 369,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: "var(--bru-text-h3)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-6)"
                },
                children: "Create New Post"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 390,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: "var(--bru-space-2)",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setActiveSubNav("generate-post"),
                        className: `bru-btn ${activeSubNav === "generate-post" ? "bru-btn--primary" : ""}`,
                        children: "Generate Post"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 408,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setActiveSubNav("content-strategy"),
                        className: `bru-btn ${activeSubNav === "content-strategy" ? "bru-btn--primary" : ""}`,
                        children: "Content Strategy"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 414,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 401,
                columnNumber: 7
            }, this),
            activeSubNav === "generate-post" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--bru-space-6)"
                },
                className: "create-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    fontSize: "var(--bru-text-h5)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: "Post Details"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 433,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-stack",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field bru-field--has-icon",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "topic-input",
                                                className: "bru-field__label",
                                                children: "Topic"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 446,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: "relative"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        id: "topic-input",
                                                        className: "bru-input",
                                                        style: {
                                                            width: "100%",
                                                            paddingRight: 40
                                                        },
                                                        value: topic,
                                                        onChange: handleTopicChange,
                                                        placeholder: "e.g., 'AI in healthcare'"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 450,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>void handleFindSubtopics(),
                                                        disabled: loadingSubtopics || !topic.trim(),
                                                        "aria-label": "Find Subtopics",
                                                        style: {
                                                            position: "absolute",
                                                            right: 8,
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            padding: 4
                                                        },
                                                        children: loadingSubtopics ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                            size: 20,
                                                            className: "animate-spin",
                                                            style: {
                                                                color: "var(--bru-purple)"
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                            lineNumber: 475,
                                                            columnNumber: 23
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                            size: 20,
                                                            style: {
                                                                color: "var(--bru-grey)"
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                            lineNumber: 481,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 449,
                                                columnNumber: 17
                                            }, this),
                                            subtopics.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "var(--bru-space-2)",
                                                    marginTop: "var(--bru-space-3)"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bru-field__label",
                                                        children: "Subtopic Suggestions"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 495,
                                                        columnNumber: 21
                                                    }, this),
                                                    subtopics.map((sub)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>void handleSelectSubtopic(sub),
                                                            style: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                padding: "var(--bru-space-2) var(--bru-space-3)",
                                                                border: selectedSubtopic?.id === sub.id ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                                                background: selectedSubtopic?.id === sub.id ? "var(--bru-purple-20)" : "var(--bru-cream)",
                                                                cursor: "pointer",
                                                                textAlign: "left",
                                                                width: "100%",
                                                                fontFamily: "var(--bru-font-primary)",
                                                                fontSize: "var(--bru-text-md)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        fontWeight: 500
                                                                    },
                                                                    children: sub.text
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                    lineNumber: 523,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "bru-tag bru-tag--filled",
                                                                    style: {
                                                                        fontSize: 11,
                                                                        padding: "2px 8px",
                                                                        background: sub.source === "google_trends" ? "var(--bru-purple-20)" : sub.source === "google_questions" ? "rgba(0, 170, 0, 0.12)" : "rgba(255, 170, 0, 0.15)"
                                                                    },
                                                                    children: getSourceBadgeLabel(sub.source)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                    lineNumber: 524,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, sub.id, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                            lineNumber: 499,
                                                            columnNumber: 23
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 487,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 445,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "coreTakeaway",
                                                className: "bru-field__label",
                                                children: "Core Takeaway (Optional)"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 547,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                id: "coreTakeaway",
                                                className: "bru-input",
                                                style: {
                                                    width: "100%",
                                                    minHeight: 80,
                                                    resize: "vertical"
                                                },
                                                value: coreTakeaway,
                                                onChange: (e)=>setCoreTakeaway(e.target.value),
                                                placeholder: "What's the single most important thing readers should remember?"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 550,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 546,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "ctaGoal",
                                                className: "bru-field__label",
                                                children: "Call to Action Goal (Optional)"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 562,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                id: "ctaGoal",
                                                className: "bru-input",
                                                style: {
                                                    width: "100%"
                                                },
                                                value: ctaGoal,
                                                onChange: (e)=>setCtaGoal(e.target.value),
                                                placeholder: "e.g., 'Visit my website', 'Share your thoughts'"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 565,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 561,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-form-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: "relative"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$EnhancedDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        label: "Post Type",
                                                        options: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedPostTypes"],
                                                        value: postType,
                                                        onChange: setPostType,
                                                        placeholder: "Select a post type",
                                                        compatibilityMap: compatibilityMap,
                                                        loading: loadingRecommendation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 579,
                                                        columnNumber: 19
                                                    }, this),
                                                    recommendation && postType === recommendation.postType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "smart-choice-badge",
                                                        style: {
                                                            marginTop: "var(--bru-space-1)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                                size: 12
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                lineNumber: 593,
                                                                columnNumber: 23
                                                            }, this),
                                                            " Smart Choice"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 589,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 578,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: "relative"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$EnhancedDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        label: "Hook Pattern",
                                                        options: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedHookPatterns"],
                                                        value: hookPattern,
                                                        onChange: setHookPattern,
                                                        placeholder: "Select a hook pattern",
                                                        compatibilityMap: compatibilityMap,
                                                        loading: loadingRecommendation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 599,
                                                        columnNumber: 19
                                                    }, this),
                                                    recommendation && hookPattern === recommendation.hookPattern && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "smart-choice-badge",
                                                        style: {
                                                            marginTop: "var(--bru-space-1)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                                size: 12
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                lineNumber: 614,
                                                                columnNumber: 25
                                                            }, this),
                                                            " Smart Choice"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 610,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 598,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: "relative"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$EnhancedDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        label: "Content Pillar",
                                                        options: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedContentPillars"],
                                                        value: contentPillar,
                                                        onChange: setContentPillar,
                                                        placeholder: "Select a content pillar",
                                                        compatibilityMap: compatibilityMap,
                                                        loading: loadingRecommendation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 620,
                                                        columnNumber: 19
                                                    }, this),
                                                    recommendation && contentPillar === recommendation.contentPillar && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "smart-choice-badge",
                                                        style: {
                                                            marginTop: "var(--bru-space-1)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                                size: 12
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                lineNumber: 635,
                                                                columnNumber: 25
                                                            }, this),
                                                            " Smart Choice"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 631,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 619,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    position: "relative"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$EnhancedDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        label: "Tone",
                                                        options: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enhancedToneOptions"],
                                                        value: selectedToneId,
                                                        onChange: setSelectedToneId,
                                                        placeholder: "Select a tone",
                                                        compatibilityMap: compatibilityMap,
                                                        loading: loadingRecommendation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 641,
                                                        columnNumber: 19
                                                    }, this),
                                                    recommendation && selectedToneId === recommendation.toneId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "smart-choice-badge",
                                                        style: {
                                                            marginTop: "var(--bru-space-1)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                                size: 12
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                                lineNumber: 656,
                                                                columnNumber: 25
                                                            }, this),
                                                            " Smart Choice"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                        lineNumber: 652,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 640,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 577,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleGeneratePostClick,
                                        className: "bru-btn bru-btn--primary bru-btn--block",
                                        disabled: loadingRecommendation || !topic || !postType || !hookPattern || !contentPillar || !selectedToneId,
                                        children: loadingRecommendation ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                    size: 18,
                                                    className: "animate-spin"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                    lineNumber: 677,
                                                    columnNumber: 21
                                                }, this),
                                                "Getting Recommendations..."
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                    size: 18
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                    lineNumber: 682,
                                                    columnNumber: 21
                                                }, this),
                                                "Generate Post"
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 663,
                                        columnNumber: 15
                                    }, this),
                                    saveFeedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `bru-alert ${saveFeedback.includes("successfully") ? "bru-alert--success" : "bru-alert--error"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bru-alert__icon",
                                                children: saveFeedback.includes("successfully") ? "\u2713" : "!"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 692,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bru-alert__content",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bru-alert__text",
                                                    children: saveFeedback
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                    lineNumber: 696,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 695,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 689,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 443,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 432,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$PostGenerator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                ref: postGeneratorRef,
                                parameters: postGenerationParams,
                                profile: profile,
                                aiSettings: aiSettings,
                                triggerGeneration: triggerPostGeneration,
                                onContentGenerated: handleContentGenerated
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 711,
                                columnNumber: 13
                            }, this),
                            generatedContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-actions",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>void handleSaveDraft(),
                                        className: "bru-btn",
                                        style: {
                                            flex: 1
                                        },
                                        disabled: saving,
                                        children: [
                                            saving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                size: 16,
                                                className: "animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                                lineNumber: 727,
                                                columnNumber: 30
                                            }, this),
                                            "Save as Draft"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 721,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleOpenScheduleModal,
                                        className: "bru-btn bru-btn--primary",
                                        style: {
                                            flex: 1
                                        },
                                        disabled: saving,
                                        children: "Schedule Post"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 730,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 720,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 704,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 423,
                columnNumber: 9
            }, this),
            activeSubNav === "content-strategy" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Your Content Strategy"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 746,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-stack",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Content Strategy Overview"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 757,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.contentStrategy ?? "No content strategy defined yet. Go to Settings to add one."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 758,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 756,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Brand Definition"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 764,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.definition ?? "No brand definition provided. Go to Settings to add one."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 765,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 763,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Copy Guidelines"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 771,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.copyGuideline ?? "No copy guidelines set. Go to Settings to add them."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 772,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 770,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Audience"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 778,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.audience.join(", ") || "No audience defined. Go to Settings to add one."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 779,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 777,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Tones"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 785,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.tones.join(", ") || "No tones defined. Go to Settings to add them."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 786,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 784,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Offers"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 792,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.offers.join(", ") || "No offers defined. Go to Settings to add them."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 793,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 791,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "bru-field__label",
                                        children: "Taboos"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 799,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: profile.taboos.join(", ") || "No taboo topics defined. Go to Settings to add them."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                        lineNumber: 800,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 798,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    justifyContent: "flex-end"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/settings",
                                    className: "bru-btn",
                                    children: "Edit Strategy in Settings"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                    lineNumber: 806,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                                lineNumber: 805,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                        lineNumber: 755,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 745,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$SchedulePostModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                isOpen: isScheduleModalOpen,
                onClose: ()=>setIsScheduleModalOpen(false),
                onSchedule: handleSchedulePost,
                initialDate: new Date().toISOString().split("T")[0],
                initialStatus: "scheduled"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/create/page.tsx",
                lineNumber: 814,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4149bd7c._.js.map