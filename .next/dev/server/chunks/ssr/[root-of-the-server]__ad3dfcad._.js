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
"[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callStraico",
    ()=>callStraico,
    "fetchStraicoModels",
    ()=>fetchStraicoModels,
    "fetchStraicoUserInfo",
    ()=>fetchStraicoUserInfo,
    "validateStraicoKey",
    ()=>validateStraicoKey
]);
const PROXY_URL = "/api/straico";
async function validateStraicoKey(apiKey) {
    const response = await fetch(`${PROXY_URL}?action=user`, {
        method: "GET",
        headers: {
            "x-straico-key": apiKey
        }
    });
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid API key");
        }
        const body = await response.text();
        throw new Error(`Validation failed (${response.status}): ${body}`);
    }
}
async function fetchStraicoModels(apiKey) {
    const response = await fetch(`${PROXY_URL}?action=models`, {
        method: "GET",
        headers: {
            "x-straico-key": apiKey
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch models (${response.status})`);
    }
    const data = await response.json();
    const models = data.data || data;
    if (!Array.isArray(models)) return [];
    return models.map((m)=>({
            id: m.model || m.name || "",
            label: m.name || m.model || "",
            maxTokens: m.max_tokens ? {
                min: 1,
                max: m.max_tokens
            } : undefined,
            wordLimit: m.word_limit,
            pricing: m.pricing?.coins != null ? {
                coins: m.pricing.coins,
                words: m.pricing.words ?? 100
            } : undefined,
            provider: m.provider,
            modelType: m.model_type,
            editorsChoiceLevel: m.editors_choice_level,
            applications: m.applications,
            features: m.features,
            pros: m.pros,
            cons: m.cons,
            icon: m.icon,
            modelDate: m.model_date
        }));
}
async function callStraico(request, apiKey, model, onProgress, signal) {
    onProgress?.({
        step: "Preparing request...",
        percent: 0
    });
    onProgress?.({
        step: "Sending to Straico...",
        percent: 20
    });
    const response = await fetch(`${PROXY_URL}?action=prompt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-straico-key": apiKey
        },
        body: JSON.stringify({
            models: [
                model
            ],
            message: `${request.systemPrompt}\n\n${request.userMessage}`,
            ...request.maxTokens ? {
                max_tokens: request.maxTokens
            } : {}
        }),
        signal
    });
    onProgress?.({
        step: "Processing response...",
        percent: 80
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Straico API error (${response.status}): ${errorBody}`);
    }
    const data = await response.json();
    // Straico v1 response format (models array):
    // { data: { completions: { "model-name": { completion: { choices: [{ message: { content } }] } } } } }
    // Legacy format: { data: { completion: { choices: [{ message: { content } }] } } }
    let content;
    // New format: completions keyed by model name
    const completions = data.data?.completions;
    if (completions && typeof completions === "object") {
        const firstModel = Object.values(completions)[0];
        const completion = firstModel?.completion;
        const choices = completion?.choices;
        content = choices?.[0]?.message?.content;
    }
    // Fallback: legacy format
    if (!content) {
        content = data.data?.completion?.choices?.[0]?.message?.content || data.completion?.choices?.[0]?.message?.content || data.data?.completion?.response || data.completion?.response || data.response || data.data?.response;
    }
    if (!content) {
        throw new Error("Straico API returned an empty response");
    }
    onProgress?.({
        step: "Response received",
        percent: 100
    });
    return {
        content,
        provider: "straico"
    };
}
async function fetchStraicoUserInfo(apiKey) {
    try {
        const response = await fetch(`${PROXY_URL}?action=user-info`, {
            method: "GET",
            headers: {
                "x-straico-key": apiKey
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        const user = data.data || data;
        return {
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            coins: Number(user.coins) || 0,
            plan: user.plan || ""
        };
    } catch  {
        return null;
    }
}
}),
"[project]/Desktop/doctorpost-v12/lib/ai/constants.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AI_SETTINGS_DEFAULTS",
    ()=>AI_SETTINGS_DEFAULTS,
    "ONEFORALL_MODELS",
    ()=>ONEFORALL_MODELS,
    "STRAICO_MODELS",
    ()=>STRAICO_MODELS
]);
const ONEFORALL_MODELS = [
    {
        id: "anthropic/claude-4-sonnet",
        label: "Claude 4 Sonnet",
        provider: "anthropic",
        creditsPerInputToken: 0.02,
        creditsPerOutputToken: 0.02
    },
    {
        id: "claude_haiku",
        label: "Claude 3 Haiku (fast)",
        provider: "anthropic",
        creditsPerInputToken: 0.01,
        creditsPerOutputToken: 0.01
    },
    {
        id: "claude_sonnet",
        label: "Claude 3.5 Sonnet",
        provider: "anthropic",
        creditsPerInputToken: 0.02,
        creditsPerOutputToken: 0.02
    },
    {
        id: "gpt-4.1-nano",
        label: "GPT-4.1 Nano (test)",
        provider: "openai",
        creditsPerInputToken: 0.01,
        creditsPerOutputToken: 0.01
    }
];
const STRAICO_MODELS = [
    {
        id: "openai/gpt-4o-mini",
        label: "GPT-4o Mini",
        maxTokens: {
            min: 1,
            max: 16384
        },
        wordLimit: 100000,
        pricing: {
            coins: 0.5,
            words: 100
        },
        provider: "openai",
        modelType: "chat",
        editorsChoiceLevel: -1
    },
    {
        id: "anthropic/claude-3.5-sonnet",
        label: "Claude 3.5 Sonnet",
        maxTokens: {
            min: 1,
            max: 8192
        },
        wordLimit: 150000,
        pricing: {
            coins: 5,
            words: 100
        },
        provider: "anthropic",
        modelType: "chat",
        editorsChoiceLevel: 2
    },
    {
        id: "google/gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        maxTokens: {
            min: 1,
            max: 8192
        },
        wordLimit: 75000,
        pricing: {
            coins: 0.3,
            words: 100
        },
        provider: "google",
        modelType: "chat",
        editorsChoiceLevel: -1
    }
];
const AI_SETTINGS_DEFAULTS = {
    activeProvider: "claude",
    claudeApiKey: "",
    straicoApiKey: "",
    straicoModel: "openai/gpt-4o-mini",
    oneforallApiKey: "",
    oneforallModel: "anthropic/claude-4-sonnet"
};
}),
"[project]/Desktop/doctorpost-v12/lib/ai/modelService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchModels",
    ()=>fetchModels
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/constants.ts [app-ssr] (ecmascript)");
;
async function fetchModels(provider, apiKey) {
    if (provider === "claude") {
        return {
            models: [],
            source: "fallback"
        };
    }
    // Both Straico and 1ForAll use the server-side /api/models endpoint
    // which hits the real upstream APIs (Straico v2, 1ForAll models API)
    try {
        if (!apiKey) {
            const fallback = provider === "1forall" ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ONEFORALL_MODELS"] : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STRAICO_MODELS"];
            return {
                models: [
                    ...fallback
                ],
                source: "fallback"
            };
        }
        const headerKey = provider === "1forall" ? "x-oneforall-key" : "x-straico-key";
        const response = await fetch(`/api/models?provider=${provider}`, {
            method: "GET",
            headers: {
                [headerKey]: apiKey
            }
        });
        if (!response.ok) {
            throw new Error(`Models fetch failed (${response.status})`);
        }
        const data = await response.json();
        const models = data.models || [];
        if (models.length > 0) {
            return {
                models,
                source: data.source || "api"
            };
        }
        const fallback = provider === "1forall" ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ONEFORALL_MODELS"] : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STRAICO_MODELS"];
        return {
            models: [
                ...fallback
            ],
            source: "fallback"
        };
    } catch  {
        const fallback = provider === "1forall" ? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ONEFORALL_MODELS"] : __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STRAICO_MODELS"];
        return {
            models: [
                ...fallback
            ],
            source: "fallback"
        };
    }
}
}),
"[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StraicoModelPicker",
    ()=>StraicoModelPicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/search.mjs [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/star.mjs [app-ssr] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/coins.mjs [app-ssr] (ecmascript) <export default as Coins>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-up.mjs [app-ssr] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/image.mjs [app-ssr] (ecmascript) <export default as Image>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/globe.mjs [app-ssr] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/thumbs-up.mjs [app-ssr] (ecmascript) <export default as ThumbsUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/thumbs-down.mjs [app-ssr] (ecmascript) <export default as ThumbsDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
"use client";
;
;
;
function formatNumber(n) {
    return n.toLocaleString("en-US", {
        maximumFractionDigits: 2
    });
}
function QualityBadge({ level }) {
    if (level < 0) return null;
    const stars = Math.min(level, 3);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: "#d97706"
        },
        title: `Editor's choice: ${level}/3`,
        children: Array.from({
            length: stars
        }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                size: 10,
                fill: "currentColor"
            }, i, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 46,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
function FeatureBadge({ label }) {
    const iconMap = {
        "Image input": __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"],
        "Web search": __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"]
    };
    const Icon = iconMap[label] || __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            background: "var(--bru-purple-20)",
            color: "var(--bru-purple)",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                size: 10
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
function StraicoModelPicker({ models, selectedModelId, onSelectModel, loading, userInfo }) {
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [providerFilter, setProviderFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sort, setSort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("quality");
    const [expandedModelId, setExpandedModelId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const providers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const set = new Set(models.map((m)=>m.provider).filter(Boolean));
        return Array.from(set).sort();
    }, [
        models
    ]);
    const filteredModels = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        let result = models.filter((m)=>!m.modelType || m.modelType === "chat");
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((m)=>m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.provider?.toLowerCase().includes(q));
        }
        if (providerFilter) {
            result = result.filter((m)=>m.provider === providerFilter);
        }
        const getPrice = (m)=>m.pricing?.coins ?? m.creditsPerInputToken ?? 0;
        result.sort((a, b)=>{
            switch(sort){
                case "quality":
                    return (b.editorsChoiceLevel ?? -1) - (a.editorsChoiceLevel ?? -1);
                case "price-asc":
                    return getPrice(a) - getPrice(b);
                case "price-desc":
                    return getPrice(b) - getPrice(a);
                case "newest":
                    return (b.modelDate ?? "").localeCompare(a.modelDate ?? "");
                default:
                    return 0;
            }
        });
        return result;
    }, [
        models,
        search,
        providerFilter,
        sort
    ]);
    const selectedModel = models.find((m)=>m.id === selectedModelId);
    const chipBase = {
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(0,0,0,0.15)",
        cursor: "pointer",
        background: "var(--bru-white)",
        color: "var(--bru-black)"
    };
    const chipActive = {
        ...chipBase,
        borderColor: "var(--bru-purple)",
        background: "var(--bru-purple)",
        color: "var(--bru-white)"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "var(--bru-space-3)"
        },
        children: [
            userInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-3)",
                    padding: "var(--bru-space-2)",
                    background: "rgba(217, 119, 6, 0.08)",
                    border: "1px solid rgba(217, 119, 6, 0.25)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__["Coins"], {
                        size: 14,
                        style: {
                            color: "#d97706"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 177,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#92400e"
                        },
                        children: [
                            formatNumber(userInfo.coins),
                            " coins"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 178,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "2px 6px",
                            background: "rgba(217, 119, 6, 0.15)",
                            color: "#92400e"
                        },
                        children: userInfo.plan
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 181,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 167,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--bru-space-2)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "relative"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                size: 14,
                                style: {
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--bru-grey)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: search,
                                onChange: (e)=>setSearch(e.target.value),
                                placeholder: "Search models...",
                                className: "bru-input",
                                style: {
                                    width: "100%",
                                    paddingLeft: 32,
                                    fontSize: 12
                                }
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 216,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this),
                    providers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setProviderFilter(null),
                                style: !providerFilter ? chipActive : chipBase,
                                children: "All"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 229,
                                columnNumber: 13
                            }, this),
                            providers.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setProviderFilter(providerFilter === p ? null : p),
                                    style: providerFilter === p ? chipActive : chipBase,
                                    children: p
                                }, p, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                    lineNumber: 237,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 228,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: sort,
                        onChange: (e)=>setSort(e.target.value),
                        className: "bru-select",
                        style: {
                            width: "100%",
                            fontSize: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "quality",
                                children: "Sort: Quality Rating"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 258,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "price-asc",
                                children: "Sort: Price (low to high)"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "price-desc",
                                children: "Sort: Price (high to low)"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 260,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "newest",
                                children: "Sort: Newest First"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                lineNumber: 261,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 252,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--bru-space-4) 0",
                    gap: "var(--bru-space-2)",
                    fontSize: 12,
                    color: "var(--bru-grey)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                        size: 14,
                        className: "animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 278,
                        columnNumber: 11
                    }, this),
                    "Loading models..."
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 267,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    maxHeight: 400,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingRight: 4
                },
                children: [
                    filteredModels.map((model)=>{
                        const isSelected = model.id === selectedModelId;
                        const isExpanded = model.id === expandedModelId;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>onSelectModel(model.id),
                                    style: {
                                        width: "100%",
                                        textAlign: "left",
                                        padding: 10,
                                        border: isSelected ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                        background: isSelected ? "rgba(99, 29, 237, 0.05)" : "var(--bru-white)",
                                        cursor: "pointer",
                                        fontFamily: "var(--bru-font-primary)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10
                                        },
                                        children: [
                                            model.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: model.icon,
                                                alt: "",
                                                style: {
                                                    width: 24,
                                                    height: 24,
                                                    marginTop: 2,
                                                    objectFit: "contain"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                lineNumber: 321,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    flex: 1,
                                                    minWidth: 0
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            flexWrap: "wrap"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap"
                                                                },
                                                                children: model.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 341,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(QualityBadge, {
                                                                level: model.editorsChoiceLevel ?? -1
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 352,
                                                                columnNumber: 23
                                                            }, this),
                                                            model.provider && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.05em",
                                                                    padding: "2px 4px",
                                                                    background: "rgba(0,0,0,0.05)"
                                                                },
                                                                children: model.provider
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 354,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                        lineNumber: 333,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 12,
                                                            marginTop: 4,
                                                            fontSize: 10,
                                                            color: "var(--bru-grey)"
                                                        },
                                                        children: [
                                                            model.pricing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                title: "Cost per 100 words",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__["Coins"], {
                                                                        size: 10,
                                                                        style: {
                                                                            display: "inline",
                                                                            marginRight: 2,
                                                                            verticalAlign: "-1px"
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                        lineNumber: 381,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    model.pricing.coins,
                                                                    "/",
                                                                    model.pricing.words,
                                                                    "w"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 25
                                                            }, this),
                                                            !model.pricing && model.creditsPerInputToken != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                title: "Credits per token (in/out)",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__["Coins"], {
                                                                        size: 10,
                                                                        style: {
                                                                            display: "inline",
                                                                            marginRight: 2,
                                                                            verticalAlign: "-1px"
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                        lineNumber: 394,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    model.creditsPerInputToken,
                                                                    "↑ /",
                                                                    " ",
                                                                    model.creditsPerOutputToken ?? 0,
                                                                    "↓"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 393,
                                                                columnNumber: 25
                                                            }, this),
                                                            model.maxTokens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                title: "Max output tokens",
                                                                children: [
                                                                    "max: ",
                                                                    model.maxTokens.max.toLocaleString()
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 25
                                                            }, this),
                                                            model.wordLimit != null && model.wordLimit > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                title: "Context window (words)",
                                                                children: [
                                                                    "ctx: ",
                                                                    (model.wordLimit / 1000).toFixed(0),
                                                                    "k"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                lineNumber: 412,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 21
                                                    }, this),
                                                    model.description && !model.applications?.length && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        style: {
                                                            fontSize: 10,
                                                            color: "var(--bru-grey)",
                                                            marginTop: 4,
                                                            lineHeight: 1.4,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        },
                                                        title: model.description,
                                                        children: model.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                        lineNumber: 418,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: 4,
                                                            marginTop: 6
                                                        },
                                                        children: [
                                                            model.applications?.slice(0, 4).map((app)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        padding: "2px 4px",
                                                                        fontSize: 9,
                                                                        fontWeight: 700,
                                                                        textTransform: "uppercase",
                                                                        letterSpacing: "0.05em",
                                                                        background: "rgba(37, 99, 235, 0.08)",
                                                                        color: "#2563eb"
                                                                    },
                                                                    children: app
                                                                }, app, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                    lineNumber: 443,
                                                                    columnNumber: 25
                                                                }, this)),
                                                            model.features?.map((feat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureBadge, {
                                                                    label: feat
                                                                }, feat, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                    lineNumber: 459,
                                                                    columnNumber: 25
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                lineNumber: 332,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                        lineNumber: 317,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                    lineNumber: 300,
                                    columnNumber: 15
                                }, this),
                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        setExpandedModelId(isExpanded ? null : model.id);
                                    },
                                    style: {
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 4,
                                        padding: "4px 0",
                                        fontSize: 10,
                                        color: "var(--bru-purple)",
                                        fontWeight: 700,
                                        borderLeft: "2px solid var(--bru-purple)",
                                        borderRight: "2px solid var(--bru-purple)",
                                        borderBottom: "2px solid var(--bru-purple)",
                                        background: "rgba(99, 29, 237, 0.05)",
                                        cursor: "pointer",
                                        fontFamily: "var(--bru-font-primary)"
                                    },
                                    children: isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            "Hide details ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                                size: 10
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                lineNumber: 493,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            "Show details ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                size: 10
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                lineNumber: 497,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, void 0, true)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                    lineNumber: 467,
                                    columnNumber: 17
                                }, this),
                                isSelected && isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        borderLeft: "2px solid var(--bru-purple)",
                                        borderRight: "2px solid var(--bru-purple)",
                                        borderBottom: "2px solid var(--bru-purple)",
                                        background: "rgba(99, 29, 237, 0.05)",
                                        padding: "0 12px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8
                                    },
                                    children: [
                                        model.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: 11,
                                                color: "var(--bru-grey)",
                                                lineHeight: 1.4
                                            },
                                            children: model.description
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 517,
                                            columnNumber: 21
                                        }, this),
                                        model.pricing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: 11,
                                                color: "var(--bru-grey)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__["Coins"], {
                                                    size: 11,
                                                    style: {
                                                        display: "inline",
                                                        marginRight: 4,
                                                        verticalAlign: "-1px",
                                                        color: "#d97706"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 529,
                                                    columnNumber: 23
                                                }, this),
                                                "~",
                                                model.pricing.coins,
                                                " coins per ",
                                                model.pricing.words,
                                                " ",
                                                "words"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 528,
                                            columnNumber: 21
                                        }, this),
                                        !model.pricing && model.creditsPerInputToken != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: 11,
                                                color: "var(--bru-grey)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coins$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Coins$3e$__["Coins"], {
                                                    size: 11,
                                                    style: {
                                                        display: "inline",
                                                        marginRight: 4,
                                                        verticalAlign: "-1px",
                                                        color: "#d97706"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 544,
                                                    columnNumber: 23
                                                }, this),
                                                model.creditsPerInputToken,
                                                " credits/input token ·",
                                                " ",
                                                model.creditsPerOutputToken ?? 0,
                                                " credits/output token"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 543,
                                            columnNumber: 21
                                        }, this),
                                        model.maxTokens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: 11,
                                                color: "var(--bru-grey)"
                                            },
                                            children: [
                                                "This model supports up to",
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: model.maxTokens.max.toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 560,
                                                    columnNumber: 23
                                                }, this),
                                                " ",
                                                "output tokens"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 558,
                                            columnNumber: 21
                                        }, this),
                                        model.pros && model.pros.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: "#16a34a",
                                                        marginBottom: 4
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__["ThumbsUp"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                            lineNumber: 578,
                                                            columnNumber: 25
                                                        }, this),
                                                        " Strengths"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 567,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    style: {
                                                        listStyle: "none",
                                                        padding: 0,
                                                        margin: 0,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 2
                                                    },
                                                    children: model.pros.map((pro, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            style: {
                                                                fontSize: 11,
                                                                color: "var(--bru-grey)",
                                                                paddingLeft: 12,
                                                                position: "relative"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        position: "absolute",
                                                                        left: 0,
                                                                        color: "#22c55e"
                                                                    },
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                    lineNumber: 600,
                                                                    columnNumber: 29
                                                                }, this),
                                                                pro
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                            lineNumber: 591,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 580,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 566,
                                            columnNumber: 21
                                        }, this),
                                        model.cons && model.cons.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: "#ef4444",
                                                        marginBottom: 4
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsDown$3e$__["ThumbsDown"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                            lineNumber: 629,
                                                            columnNumber: 25
                                                        }, this),
                                                        " Weaknesses"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 618,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    style: {
                                                        listStyle: "none",
                                                        padding: 0,
                                                        margin: 0,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 2
                                                    },
                                                    children: model.cons.map((con, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            style: {
                                                                fontSize: 11,
                                                                color: "var(--bru-grey)",
                                                                paddingLeft: 12,
                                                                position: "relative"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        position: "absolute",
                                                                        left: 0,
                                                                        color: "#f87171"
                                                                    },
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                                    lineNumber: 651,
                                                                    columnNumber: 29
                                                                }, this),
                                                                con
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                            lineNumber: 642,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                                    lineNumber: 631,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                            lineNumber: 617,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                                    lineNumber: 504,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, model.id, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                            lineNumber: 299,
                            columnNumber: 13
                        }, this);
                    }),
                    !loading && filteredModels.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: 12,
                            color: "var(--bru-grey)",
                            textAlign: "center",
                            padding: "var(--bru-space-4) 0"
                        },
                        children: "No models match your filters"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                        lineNumber: 673,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 284,
                columnNumber: 7
            }, this),
            selectedModel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    paddingTop: "var(--bru-space-2)",
                    borderTop: "var(--bru-border)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        fontSize: 10,
                        color: "var(--bru-grey)"
                    },
                    children: [
                        "Selected:",
                        " ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontWeight: 700,
                                color: "var(--bru-black)"
                            },
                            children: selectedModel.label
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                            lineNumber: 696,
                            columnNumber: 13
                        }, this),
                        selectedModel.pricing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                marginLeft: 8
                            },
                            children: [
                                "(",
                                selectedModel.pricing.coins,
                                " coins /",
                                " ",
                                selectedModel.pricing.words,
                                "w)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                            lineNumber: 700,
                            columnNumber: 15
                        }, this),
                        !selectedModel.pricing && selectedModel.creditsPerInputToken != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                marginLeft: 8
                            },
                            children: [
                                "(",
                                selectedModel.creditsPerInputToken,
                                "↑ /",
                                " ",
                                selectedModel.creditsPerOutputToken ?? 0,
                                "↓ credits/tok)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                            lineNumber: 707,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                    lineNumber: 694,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
                lineNumber: 688,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/api.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$modelService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/modelService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$settings$2f$StraicoModelPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/components/settings/StraicoModelPicker.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-ssr] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check-circle.mjs [app-ssr] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x-circle.mjs [app-ssr] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/eye.mjs [app-ssr] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/eye-off.mjs [app-ssr] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/key.mjs [app-ssr] (ecmascript) <export default as Key>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/shield-check.mjs [app-ssr] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/alert-circle.mjs [app-ssr] (ecmascript) <export default as AlertCircle>");
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
;
;
function ValidationBadge({ status }) {
    if (status.state === "idle") return null;
    if (status.state === "validating") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "rgba(59, 130, 246, 0.1)",
                color: "#2563eb"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                    size: 10,
                    className: "animate-spin"
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this),
                "Verifying"
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
            lineNumber: 43,
            columnNumber: 7
        }, this);
    }
    if (status.state === "valid") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "rgba(22, 163, 74, 0.1)",
                color: "#16a34a"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                    size: 10
                }, void 0, false, {
                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this),
                "Verified"
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#dc2626"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$alert$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                size: 10
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            "Invalid"
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
function StatusBadge({ connected, label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: connected ? "rgba(22, 163, 74, 0.1)" : "rgba(0,0,0,0.05)",
            color: connected ? "#16a34a" : "var(--bru-grey)"
        },
        children: [
            connected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                size: 10
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 126,
                columnNumber: 20
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                size: 10
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 126,
                columnNumber: 48
            }, this),
            label || (connected ? "Connected" : "Not connected")
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
        lineNumber: 112,
        columnNumber: 5
    }, this);
}
function SettingsPage() {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profileLoaded, setProfileLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeProvider, setActiveProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("claude");
    const [claudeApiKey, setClaudeApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [straicoApiKey, setStraicoApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [straicoModel, setStraicoModel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("openai/gpt-4o-mini");
    const [oneforallApiKey, setOneforallApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [oneforallModel, setOneforallModel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("anthropic/claude-4-sonnet");
    // Research API keys (Content Factory pipeline)
    const [perplexityApiKey, setPerplexityApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [redditClientId, setRedditClientId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [redditClientSecret, setRedditClientSecret] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // Show/hide key toggles
    const [showClaudeKey, setShowClaudeKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showStraicoKey, setShowStraicoKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showOneforallKey, setShowOneforallKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showPerplexityKey, setShowPerplexityKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showRedditSecret, setShowRedditSecret] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Expandable provider cards
    const [expandedProvider, setExpandedProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Per-provider validation states
    const [claudeValidation, setClaudeValidation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        state: "idle"
    });
    const [straicoValidation, setStraicoValidation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        state: "idle"
    });
    const [oneforallValidation, setOneforallValidation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        state: "idle"
    });
    // Dynamic model lists
    const [straicoModels, setStraicoModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        ...__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STRAICO_MODELS"]
    ]);
    const [oneforallModels, setOneforallModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        ...__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ONEFORALL_MODELS"]
    ]);
    const [modelsLoading, setModelsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [straicoUserInfo, setStraicoUserInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Auto-save profile to NCB (silent, no validation)
    const saveProfileSilent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (overrides)=>{
        if (!profile) return;
        try {
            const updatedProfile = {
                ...profile,
                aiProvider: activeProvider,
                claudeApiKey,
                straicoApiKey,
                straicoModel,
                oneforallApiKey,
                oneforallModel,
                perplexityApiKey: perplexityApiKey || undefined,
                redditClientId: redditClientId || undefined,
                redditClientSecret: redditClientSecret || undefined,
                ...overrides
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["updateBrandProfile"])(updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Failed to save profile:", error);
        }
    }, [
        profile,
        activeProvider,
        claudeApiKey,
        straicoApiKey,
        straicoModel,
        oneforallApiKey,
        oneforallModel,
        perplexityApiKey,
        redditClientId,
        redditClientSecret
    ]);
    // Per-provider validate: validate key → on success load data → auto-save
    const handleValidateClaude = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!claudeApiKey.trim()) {
            setClaudeValidation({
                state: "error",
                message: "API key is required"
            });
            return;
        }
        setClaudeValidation({
            state: "validating"
        });
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateClaudeKey"])(claudeApiKey);
            setClaudeValidation({
                state: "valid"
            });
            await saveProfileSilent();
        } catch (err) {
            setClaudeValidation({
                state: "error",
                message: err instanceof Error ? err.message : "Validation failed"
            });
        }
    }, [
        claudeApiKey,
        saveProfileSilent
    ]);
    const handleValidateStraico = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!straicoApiKey.trim()) {
            setStraicoValidation({
                state: "error",
                message: "API key is required"
            });
            return;
        }
        setStraicoValidation({
            state: "validating"
        });
        try {
            // Step 1: Validate key against Straico auth
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateStraicoKey"])(straicoApiKey);
            setStraicoValidation({
                state: "valid"
            });
            // Step 2: On success, load models + user info in parallel
            setModelsLoading((prev)=>({
                    ...prev,
                    straico: true
                }));
            const [modelsResult, userInfo] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$modelService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchModels"])("straico", straicoApiKey),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchStraicoUserInfo"])(straicoApiKey)
            ]);
            if (modelsResult.models.length > 0) {
                setStraicoModels(modelsResult.models);
            }
            setStraicoUserInfo(userInfo);
            setModelsLoading((prev)=>({
                    ...prev,
                    straico: false
                }));
            // Step 3: Auto-save
            await saveProfileSilent();
        } catch (err) {
            setStraicoValidation({
                state: "error",
                message: err instanceof Error ? err.message : "Validation failed"
            });
            setModelsLoading((prev)=>({
                    ...prev,
                    straico: false
                }));
        }
    }, [
        straicoApiKey,
        saveProfileSilent
    ]);
    const handleValidateOneforall = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!oneforallApiKey.trim()) {
            setOneforallValidation({
                state: "error",
                message: "API key is required"
            });
            return;
        }
        setOneforallValidation({
            state: "validating"
        });
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateOneForAllKey"])(oneforallApiKey);
            setOneforallValidation({
                state: "valid"
            });
            // Fetch models from API (like Straico)
            setModelsLoading((prev)=>({
                    ...prev,
                    "1forall": true
                }));
            const modelsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$modelService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchModels"])("1forall", oneforallApiKey);
            if (modelsResult.models.length > 0) {
                setOneforallModels(modelsResult.models);
            }
            setModelsLoading((prev)=>({
                    ...prev,
                    "1forall": false
                }));
            await saveProfileSilent();
        } catch (err) {
            setOneforallValidation({
                state: "error",
                message: err instanceof Error ? err.message : "Validation failed"
            });
            setModelsLoading((prev)=>({
                    ...prev,
                    "1forall": false
                }));
        }
    }, [
        oneforallApiKey,
        saveProfileSilent
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchProfile = async ()=>{
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getBrandProfile"])(user.id);
                setProfile(data);
                setActiveProvider(data.aiProvider ?? "claude");
                setClaudeApiKey(data.claudeApiKey ?? "");
                setStraicoApiKey(data.straicoApiKey ?? "");
                setStraicoModel(data.straicoModel ?? "openai/gpt-4o-mini");
                setOneforallApiKey(data.oneforallApiKey ?? "");
                setOneforallModel(data.oneforallModel ?? "anthropic/claude-4-sonnet");
                setPerplexityApiKey(data.perplexityApiKey ?? "");
                setRedditClientId(data.redditClientId ?? "");
                setRedditClientSecret(data.redditClientSecret ?? "");
                setProfileLoaded(true);
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally{
                setLoading(false);
            }
        };
        void fetchProfile();
    }, [
        user?.id
    ]);
    // Auto-validate all configured keys on initial load
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!profileLoaded) return;
        if (claudeApiKey.trim()) {
            void handleValidateClaude();
        }
        if (straicoApiKey.trim()) {
            void handleValidateStraico();
        }
        if (oneforallApiKey.trim()) {
            void handleValidateOneforall();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        profileLoaded
    ]);
    const handleSaveAll = async ()=>{
        if (!profile) return;
        setSaving(true);
        try {
            await saveProfileSilent();
        } finally{
            setSaving(false);
        }
    };
    const updateField = (field, value)=>{
        setProfile((prev)=>prev ? {
                ...prev,
                [field]: value
            } : prev);
    };
    const isClaude = activeProvider === "claude";
    const isOneforall = activeProvider === "1forall";
    const isStraico = activeProvider === "straico";
    const claudeReady = isClaude && !!claudeApiKey;
    const straicoReady = isStraico && !!straicoApiKey;
    const oneforallReady = isOneforall && !!oneforallApiKey;
    function statusLabel(validation, configured) {
        if (validation.state === "valid") return "Verified";
        if (validation.state === "validating") return "Verifying...";
        if (validation.state === "error") return "Invalid key";
        if (configured) return "Not verified";
        return "Not configured";
    }
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
                children: "Loading settings..."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 398,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
            lineNumber: 389,
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
                children: "Settings"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 405,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--bru-space-4)",
                    padding: "var(--bru-space-3)",
                    border: "var(--bru-border)",
                    background: "var(--bru-white)",
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--bru-grey)"
                                },
                                children: "Claude:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 434,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                connected: claudeValidation.state === "valid",
                                label: statusLabel(claudeValidation, !!claudeApiKey.trim())
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 439,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 427,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--bru-grey)"
                                },
                                children: "Straico:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 451,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                connected: straicoValidation.state === "valid",
                                label: statusLabel(straicoValidation, !!straicoApiKey.trim())
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 456,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 444,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--bru-space-2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--bru-grey)"
                                },
                                children: "1ForAll:"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 468,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                connected: oneforallValidation.state === "valid",
                                label: statusLabel(oneforallValidation, !!oneforallApiKey.trim())
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 473,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 461,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 416,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-2)"
                        },
                        children: "Research APIs"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 485,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: "var(--bru-text-xs)",
                            color: "var(--bru-grey)",
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: "Optional keys for the Content Factory research pipeline. When configured, the researcher agent can pull real-time data from Perplexity and Reddit."
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 494,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-stack",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Perplexity API Key"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 509,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "bru-input",
                                                type: showPerplexityKey ? "text" : "password",
                                                value: perplexityApiKey,
                                                onChange: (e)=>setPerplexityApiKey(e.target.value),
                                                onBlur: ()=>void saveProfileSilent(),
                                                placeholder: "pplx-...",
                                                style: {
                                                    flex: 1
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 511,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "bru-btn bru-btn--ghost",
                                                onClick: ()=>setShowPerplexityKey((p)=>!p),
                                                style: {
                                                    padding: "4px 8px"
                                                },
                                                children: showPerplexityKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 526,
                                                    columnNumber: 38
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 526,
                                                    columnNumber: 61
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 520,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 508,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Reddit Client ID"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 533,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "bru-input",
                                        value: redditClientId,
                                        onChange: (e)=>setRedditClientId(e.target.value),
                                        onBlur: ()=>void saveProfileSilent(),
                                        placeholder: "Reddit app client ID"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 534,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 532,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "Reddit Client Secret"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 543,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "bru-input",
                                                type: showRedditSecret ? "text" : "password",
                                                value: redditClientSecret,
                                                onChange: (e)=>setRedditClientSecret(e.target.value),
                                                onBlur: ()=>void saveProfileSilent(),
                                                placeholder: "Reddit app client secret",
                                                style: {
                                                    flex: 1
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 545,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "bru-btn bru-btn--ghost",
                                                onClick: ()=>setShowRedditSecret((p)=>!p),
                                                style: {
                                                    padding: "4px 8px"
                                                },
                                                children: showRedditSecret ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 560,
                                                    columnNumber: 37
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 560,
                                                    columnNumber: 60
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 554,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 544,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 542,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 506,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 481,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "var(--bru-space-6)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    fontSize: "var(--bru-text-h5)",
                                    fontWeight: 700,
                                    margin: 0
                                },
                                children: "Brand Profile"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 580,
                                columnNumber: 11
                            }, this),
                            !profile?.companyName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: async ()=>{
                                    try {
                                        const res = await fetch("/api/seed-profile", {
                                            method: "POST",
                                            credentials: "include"
                                        });
                                        if (res.ok) {
                                            window.location.reload();
                                        }
                                    } catch (e) {
                                        console.error("Seed failed:", e);
                                    }
                                },
                                children: "Load Doctor Project Profile"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 590,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 572,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-row",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "firstName",
                                        className: "bru-field__label",
                                        children: "First Name"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 616,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "firstName",
                                        className: "bru-input",
                                        style: {
                                            width: "100%"
                                        },
                                        value: profile?.firstName ?? "",
                                        onChange: (e)=>updateField("firstName", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 619,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 615,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "lastName",
                                        className: "bru-field__label",
                                        children: "Last Name"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 629,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "lastName",
                                        className: "bru-input",
                                        style: {
                                            width: "100%"
                                        },
                                        value: profile?.lastName ?? "",
                                        onChange: (e)=>updateField("lastName", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 632,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 628,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 611,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-row",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "companyName",
                                        className: "bru-field__label",
                                        children: "Company Name"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 648,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "companyName",
                                        className: "bru-input",
                                        style: {
                                            width: "100%"
                                        },
                                        value: profile?.companyName ?? "",
                                        onChange: (e)=>updateField("companyName", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 651,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 647,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "role",
                                        className: "bru-field__label",
                                        children: "Role"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 661,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "role",
                                        className: "bru-input",
                                        style: {
                                            width: "100%"
                                        },
                                        value: profile?.role ?? "",
                                        onChange: (e)=>updateField("role", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 664,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 660,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 643,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "industry",
                                className: "bru-field__label",
                                children: "Industry"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 679,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                id: "industry",
                                className: "bru-input",
                                style: {
                                    width: "100%"
                                },
                                value: profile?.industry ?? "",
                                onChange: (e)=>updateField("industry", e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 682,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 675,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "bru-field__label",
                                children: "Audience"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 696,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    border: "var(--bru-border)",
                                    padding: "var(--bru-space-3)",
                                    background: "var(--bru-cream)"
                                },
                                children: [
                                    profile?.audience.map((audience, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: index < (profile?.audience.length ?? 0) - 1 ? "var(--bru-space-2)" : 0
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: "var(--bru-text-md)",
                                                        fontWeight: 500
                                                    },
                                                    children: audience
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 717,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm",
                                                    children: "Edit"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 722,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, index, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 705,
                                            columnNumber: 15
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        style: {
                                            marginTop: "var(--bru-space-2)",
                                            fontSize: "var(--bru-text-md)",
                                            fontWeight: 700,
                                            color: "var(--bru-purple)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            fontFamily: "var(--bru-font-primary)"
                                        },
                                        children: "+ Add Audience"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 725,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 697,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 692,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary",
                        onClick: ()=>void handleSaveAll(),
                        disabled: saving,
                        children: saving ? "Saving..." : "Save Profile"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 743,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 568,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    marginBottom: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-6)"
                        },
                        children: "AI Providers"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 757,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--bru-space-3)"
                        },
                        children: [
                            (()=>{
                                const isExpanded = expandedProvider === "claude";
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        border: isClaude ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                        background: isClaude ? "rgba(99, 29, 237, 0.05)" : "var(--bru-white)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setExpandedProvider(isExpanded ? null : "claude"),
                                            style: {
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "var(--bru-space-3)",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily: "var(--bru-font-primary)"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "var(--bru-space-3)"
                                                },
                                                children: [
                                                    isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 814,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 816,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-md)",
                                                            fontWeight: 700
                                                        },
                                                        children: "Claude"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 818,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ValidationBadge, {
                                                        status: claudeValidation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 826,
                                                        columnNumber: 21
                                                    }, this),
                                                    isClaude && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.05em",
                                                            color: claudeReady ? "var(--bru-purple)" : "var(--bru-error, #FF4444)",
                                                            background: claudeReady ? "var(--bru-purple-20)" : "rgba(231, 76, 60, 0.1)",
                                                            padding: "2px 6px"
                                                        },
                                                        children: claudeReady ? "Active" : "No Key"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 828,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 806,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 788,
                                            columnNumber: 17
                                        }, this),
                                        isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: "0 var(--bru-space-4) var(--bru-space-4)",
                                                borderTop: "1px solid rgba(0,0,0,0.1)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "var(--bru-space-3)"
                                            },
                                            children: [
                                                !isClaude && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    style: {
                                                        marginTop: "var(--bru-space-3)",
                                                        alignSelf: "flex-start"
                                                    },
                                                    onClick: ()=>setActiveProvider("claude"),
                                                    children: "Set as Active"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 859,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: "var(--bru-space-3)"
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.05em",
                                                                color: "var(--bru-grey)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 6,
                                                                marginBottom: "var(--bru-space-2)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__["Key"], {
                                                                    size: 12
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 884,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " API Key"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 871,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                position: "relative"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: showClaudeKey ? "text" : "password",
                                                                    value: claudeApiKey,
                                                                    onChange: (e)=>{
                                                                        setClaudeApiKey(e.target.value);
                                                                        setClaudeValidation({
                                                                            state: "idle"
                                                                        });
                                                                    },
                                                                    placeholder: "sk-ant-...",
                                                                    className: "bru-input",
                                                                    style: {
                                                                        width: "100%",
                                                                        paddingRight: 40
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 887,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>setShowClaudeKey((v)=>!v),
                                                                    style: {
                                                                        position: "absolute",
                                                                        right: 10,
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        background: "none",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                        color: "var(--bru-grey)",
                                                                        padding: 0
                                                                    },
                                                                    children: showClaudeKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 914,
                                                                        columnNumber: 29
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 916,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 898,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 886,
                                                            columnNumber: 23
                                                        }, this),
                                                        claudeValidation.state === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            style: {
                                                                fontSize: 10,
                                                                color: "#dc2626",
                                                                marginTop: 4
                                                            },
                                                            children: claudeValidation.message
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 921,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 870,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    onClick: ()=>void handleValidateClaude(),
                                                    disabled: claudeValidation.state === "validating",
                                                    style: {
                                                        alignSelf: "flex-start"
                                                    },
                                                    children: claudeValidation.state === "validating" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                                size: 12,
                                                                className: "animate-spin"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                lineNumber: 940,
                                                                columnNumber: 27
                                                            }, this),
                                                            "Validating..."
                                                        ]
                                                    }, void 0, true) : "Validate Key"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 932,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        fontSize: 10,
                                                        color: "var(--bru-grey)"
                                                    },
                                                    children: "Claude uses direct browser API — model selection is automatic (Claude Sonnet 4.5)."
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 947,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 849,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                    lineNumber: 778,
                                    columnNumber: 15
                                }, this);
                            })(),
                            (()=>{
                                const isExpanded = expandedProvider === "straico";
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        border: isStraico ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                        background: isStraico ? "rgba(99, 29, 237, 0.05)" : "var(--bru-white)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                const next = isExpanded ? null : "straico";
                                                setExpandedProvider(next);
                                            // Models loaded on validation or auto-validate
                                            },
                                            style: {
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "var(--bru-space-3)",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily: "var(--bru-font-primary)"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "var(--bru-space-3)"
                                                },
                                                children: [
                                                    isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1001,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1003,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-md)",
                                                            fontWeight: 700
                                                        },
                                                        children: "Straico"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1005,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ValidationBadge, {
                                                        status: straicoValidation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1013,
                                                        columnNumber: 21
                                                    }, this),
                                                    isStraico && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.05em",
                                                            color: straicoReady ? "var(--bru-purple)" : "var(--bru-error, #FF4444)",
                                                            background: straicoReady ? "var(--bru-purple-20)" : "rgba(231, 76, 60, 0.1)",
                                                            padding: "2px 6px"
                                                        },
                                                        children: straicoReady ? "Active" : "No Key"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1015,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 993,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 971,
                                            columnNumber: 17
                                        }, this),
                                        isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: "0 var(--bru-space-4) var(--bru-space-4)",
                                                borderTop: "1px solid rgba(0,0,0,0.1)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "var(--bru-space-3)"
                                            },
                                            children: [
                                                !isStraico && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    style: {
                                                        marginTop: "var(--bru-space-3)",
                                                        alignSelf: "flex-start"
                                                    },
                                                    onClick: ()=>setActiveProvider("straico"),
                                                    children: "Set as Active"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1046,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: "var(--bru-space-3)"
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.05em",
                                                                color: "var(--bru-grey)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 6,
                                                                marginBottom: "var(--bru-space-2)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__["Key"], {
                                                                    size: 12
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1071,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " API Key"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1058,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                position: "relative"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: showStraicoKey ? "text" : "password",
                                                                    value: straicoApiKey,
                                                                    onChange: (e)=>{
                                                                        setStraicoApiKey(e.target.value);
                                                                        setStraicoValidation({
                                                                            state: "idle"
                                                                        });
                                                                    },
                                                                    placeholder: "Your Straico API key",
                                                                    className: "bru-input",
                                                                    style: {
                                                                        width: "100%",
                                                                        paddingRight: 40
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1074,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>setShowStraicoKey((v)=>!v),
                                                                    style: {
                                                                        position: "absolute",
                                                                        right: 10,
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        background: "none",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                        color: "var(--bru-grey)",
                                                                        padding: 0
                                                                    },
                                                                    children: showStraicoKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 1101,
                                                                        columnNumber: 29
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 1103,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1085,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1073,
                                                            columnNumber: 23
                                                        }, this),
                                                        straicoValidation.state === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            style: {
                                                                fontSize: 10,
                                                                color: "#dc2626",
                                                                marginTop: 4
                                                            },
                                                            children: straicoValidation.message
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1108,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1057,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    onClick: ()=>void handleValidateStraico(),
                                                    disabled: straicoValidation.state === "validating",
                                                    style: {
                                                        alignSelf: "flex-start"
                                                    },
                                                    children: straicoValidation.state === "validating" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                                size: 12,
                                                                className: "animate-spin"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                lineNumber: 1127,
                                                                columnNumber: 27
                                                            }, this),
                                                            "Validating..."
                                                        ]
                                                    }, void 0, true) : "Validate Key & Load Models"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1119,
                                                    columnNumber: 21
                                                }, this),
                                                straicoApiKey.trim() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$settings$2f$StraicoModelPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StraicoModelPicker"], {
                                                    models: straicoModels,
                                                    selectedModelId: straicoModel,
                                                    onSelectModel: (id)=>setStraicoModel(id),
                                                    loading: modelsLoading["straico"],
                                                    userInfo: straicoUserInfo
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1135,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 1036,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                    lineNumber: 961,
                                    columnNumber: 15
                                }, this);
                            })(),
                            (()=>{
                                const isExpanded = expandedProvider === "1forall";
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        border: isOneforall ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                        background: isOneforall ? "rgba(99, 29, 237, 0.05)" : "var(--bru-white)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                const next = isExpanded ? null : "1forall";
                                                setExpandedProvider(next);
                                            // Models loaded on validation or auto-validate
                                            },
                                            style: {
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "var(--bru-space-3)",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily: "var(--bru-font-primary)"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "var(--bru-space-3)"
                                                },
                                                children: [
                                                    isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1193,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1195,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "var(--bru-text-md)",
                                                            fontWeight: 700
                                                        },
                                                        children: "1ForAll"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1197,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ValidationBadge, {
                                                        status: oneforallValidation
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1205,
                                                        columnNumber: 21
                                                    }, this),
                                                    isOneforall && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.05em",
                                                            color: oneforallReady ? "var(--bru-purple)" : "var(--bru-error, #FF4444)",
                                                            background: oneforallReady ? "var(--bru-purple-20)" : "rgba(231, 76, 60, 0.1)",
                                                            padding: "2px 6px"
                                                        },
                                                        children: oneforallReady ? "Active" : "No Key"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 1207,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 1185,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 1163,
                                            columnNumber: 17
                                        }, this),
                                        isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: "0 var(--bru-space-4) var(--bru-space-4)",
                                                borderTop: "1px solid rgba(0,0,0,0.1)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "var(--bru-space-3)"
                                            },
                                            children: [
                                                !isOneforall && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    style: {
                                                        marginTop: "var(--bru-space-3)",
                                                        alignSelf: "flex-start"
                                                    },
                                                    onClick: ()=>setActiveProvider("1forall"),
                                                    children: "Set as Active"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1238,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: "var(--bru-space-3)"
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.05em",
                                                                color: "var(--bru-grey)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 6,
                                                                marginBottom: "var(--bru-space-2)"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Key$3e$__["Key"], {
                                                                    size: 12
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1263,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " API Key"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1250,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                position: "relative"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: showOneforallKey ? "text" : "password",
                                                                    value: oneforallApiKey,
                                                                    onChange: (e)=>{
                                                                        setOneforallApiKey(e.target.value);
                                                                        setOneforallValidation({
                                                                            state: "idle"
                                                                        });
                                                                    },
                                                                    placeholder: "Your 1ForAll API key",
                                                                    className: "bru-input",
                                                                    style: {
                                                                        width: "100%",
                                                                        paddingRight: 40
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1266,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>setShowOneforallKey((v)=>!v),
                                                                    style: {
                                                                        position: "absolute",
                                                                        right: 10,
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        background: "none",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                        color: "var(--bru-grey)",
                                                                        padding: 0
                                                                    },
                                                                    children: showOneforallKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 1293,
                                                                        columnNumber: 29
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                        lineNumber: 1295,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                    lineNumber: 1277,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1265,
                                                            columnNumber: 23
                                                        }, this),
                                                        oneforallValidation.state === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            style: {
                                                                fontSize: 10,
                                                                color: "#dc2626",
                                                                marginTop: 4
                                                            },
                                                            children: oneforallValidation.message
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1300,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1249,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "bru-btn bru-btn--sm bru-btn--primary",
                                                    onClick: ()=>void handleValidateOneforall(),
                                                    disabled: oneforallValidation.state === "validating",
                                                    style: {
                                                        alignSelf: "flex-start"
                                                    },
                                                    children: oneforallValidation.state === "validating" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                                size: 12,
                                                                className: "animate-spin"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                                lineNumber: 1319,
                                                                columnNumber: 27
                                                            }, this),
                                                            "Validating..."
                                                        ]
                                                    }, void 0, true) : "Validate Key"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1311,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.05em",
                                                                color: "var(--bru-grey)",
                                                                marginBottom: "var(--bru-space-2)",
                                                                display: "block"
                                                            },
                                                            children: "Model"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1327,
                                                            columnNumber: 23
                                                        }, this),
                                                        oneforallApiKey.trim() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$components$2f$settings$2f$StraicoModelPicker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StraicoModelPicker"], {
                                                            models: oneforallModels,
                                                            selectedModelId: oneforallModel,
                                                            onSelectModel: setOneforallModel,
                                                            loading: modelsLoading["1forall"]
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 1341,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 1326,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 1228,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                    lineNumber: 1153,
                                    columnNumber: 15
                                }, this);
                            })()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 767,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bru-btn bru-btn--primary bru-btn--block",
                        style: {
                            marginTop: "var(--bru-space-6)"
                        },
                        onClick: ()=>void handleSaveAll(),
                        disabled: saving,
                        children: saving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                    size: 16,
                                    className: "animate-spin"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                    lineNumber: 1365,
                                    columnNumber: 15
                                }, this),
                                "Saving & Validating..."
                            ]
                        }, void 0, true) : "Save & Validate All"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 1357,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 753,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    marginTop: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-6)"
                        },
                        children: "Brand Guidelines"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 1379,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-row",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "copyGuideline",
                                        className: "bru-field__label",
                                        children: "Copy Guideline"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 1394,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "copyGuideline",
                                        className: "bru-input",
                                        style: {
                                            width: "100%",
                                            minHeight: 120,
                                            resize: "vertical"
                                        },
                                        value: profile?.copyGuideline ?? "",
                                        onChange: (e)=>updateField("copyGuideline", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 1397,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 1393,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "contentStrategy",
                                        className: "bru-field__label",
                                        children: "Content Strategy"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 1406,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "contentStrategy",
                                        className: "bru-input",
                                        style: {
                                            width: "100%",
                                            minHeight: 120,
                                            resize: "vertical"
                                        },
                                        value: profile?.contentStrategy ?? "",
                                        onChange: (e)=>updateField("contentStrategy", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 1409,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 1405,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 1389,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "definition",
                                className: "bru-field__label",
                                children: "Brand Definition"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 1423,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                id: "definition",
                                className: "bru-input",
                                style: {
                                    width: "100%",
                                    minHeight: 120,
                                    resize: "vertical"
                                },
                                value: profile?.definition ?? "",
                                onChange: (e)=>updateField("definition", e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 1426,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 1419,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            justifyContent: "flex-end"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "bru-btn bru-btn--primary",
                            onClick: ()=>void handleSaveAll(),
                            disabled: saving,
                            children: saving ? "Saving..." : "Save Guidelines"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                            lineNumber: 1436,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 1435,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 1375,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ad3dfcad._.js.map