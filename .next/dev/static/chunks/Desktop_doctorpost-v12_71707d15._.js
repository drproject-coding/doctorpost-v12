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
    "generateWithAi",
    ()=>generateWithAi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-client] (ecmascript)");
;
;
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
// --- Dropdown Data (client-side) ---
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$dropdownData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/dropdownData.ts [app-client] (ecmascript)");
;
/**
 * NCB read endpoints may return a raw array or an object wrapping it
 * (e.g. { data: [...] } or { rows: [...] }). This normalizes to an array.
 */ function extractRows(json) {
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
        const obj = json;
        if (Array.isArray(obj.data)) return obj.data;
        if (Array.isArray(obj.rows)) return obj.rows;
    // Single object (e.g. update response) - not an array read
    }
    return [];
}
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
        definition: row.definition ?? ""
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
        userId: row.user_id
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
    const rows = extractRows(await res.json());
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
        oneforall_model: profile.oneforallModel
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
    const rows = extractRows(await res.json());
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
"[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/lib/ai/constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
        label: "Claude 4 Sonnet"
    },
    {
        id: "claude_haiku",
        label: "Claude 3 Haiku (fast)"
    },
    {
        id: "claude_sonnet",
        label: "Claude 3.5 Sonnet"
    },
    {
        id: "gpt-4.1-nano",
        label: "GPT-4.1 Nano (test)"
    }
];
const STRAICO_MODELS = [
    {
        id: "openai/gpt-4o-mini",
        label: "GPT-4o Mini"
    },
    {
        id: "anthropic/claude-3.5-sonnet",
        label: "Claude 3.5 Sonnet"
    },
    {
        id: "google/gemini-2.0-flash",
        label: "Gemini 2.0 Flash"
    },
    {
        id: "meta-llama/llama-3.3-70b",
        label: "Llama 3.3 70B"
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/api.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/claudeService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/straicoService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/oneforallService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ai/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/check-circle.mjs [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/lucide-react/dist/esm/icons/x-circle.mjs [app-client] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/auth-context.tsx [app-client] (ecmascript)");
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
function SettingsPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeProvider, setActiveProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("claude");
    const [claudeApiKey, setClaudeApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [straicoApiKey, setStraicoApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [straicoModel, setStraicoModel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("openai/gpt-4o-mini");
    const [oneforallApiKey, setOneforallApiKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [oneforallModel, setOneforallModel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("anthropic/claude-4-sonnet");
    const [keyValidation, setKeyValidation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [keyValidating, setKeyValidating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [straicoModels, setStraicoModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STRAICO_MODELS"]);
    const [straicoUserInfo, setStraicoUserInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsPage.useEffect": ()=>{
            const fetchProfile = {
                "SettingsPage.useEffect.fetchProfile": async ()=>{
                    if (!user?.id) {
                        setLoading(false);
                        return;
                    }
                    try {
                        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getBrandProfile"])(user.id);
                        setProfile(data);
                        setActiveProvider(data.aiProvider ?? "claude");
                        setClaudeApiKey(data.claudeApiKey ?? "");
                        setStraicoApiKey(data.straicoApiKey ?? "");
                        setStraicoModel(data.straicoModel ?? "openai/gpt-4o-mini");
                        setOneforallApiKey(data.oneforallApiKey ?? "");
                        setOneforallModel(data.oneforallModel ?? "anthropic/claude-4-sonnet");
                    } catch (error) {
                        console.error("Failed to load profile:", error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["SettingsPage.useEffect.fetchProfile"];
            void fetchProfile();
        }
    }["SettingsPage.useEffect"], [
        user?.id
    ]);
    const handleValidateKey = async ()=>{
        setKeyValidating(true);
        setKeyValidation(null);
        try {
            if (activeProvider === "claude") {
                if (!claudeApiKey) {
                    setKeyValidation({
                        success: false,
                        message: "Claude API key cannot be empty."
                    });
                    return;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$claudeService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateClaudeKey"])(claudeApiKey);
            } else if (activeProvider === "straico") {
                if (!straicoApiKey) {
                    setKeyValidation({
                        success: false,
                        message: "Straico API key cannot be empty."
                    });
                    return;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateStraicoKey"])(straicoApiKey);
                const [models, userInfo] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchStraicoModels"])(straicoApiKey).catch(()=>null),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$straicoService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchStraicoUserInfo"])(straicoApiKey)
                ]);
                if (models && models.length > 0) setStraicoModels(models);
                setStraicoUserInfo(userInfo);
            } else if (activeProvider === "1forall") {
                if (!oneforallApiKey) {
                    setKeyValidation({
                        success: false,
                        message: "1ForAll API key cannot be empty."
                    });
                    return;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$oneforallService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateOneForAllKey"])(oneforallApiKey);
            }
            setKeyValidation({
                success: true,
                message: "API key validated successfully!"
            });
            await handleSaveProfile(true);
            setKeyValidation({
                success: true,
                message: "API key validated and saved!"
            });
        } catch (error) {
            setKeyValidation({
                success: false,
                message: error instanceof Error ? error.message : "Validation failed."
            });
        } finally{
            setKeyValidating(false);
        }
    };
    const handleSaveProfile = async (isAutoSave = false)=>{
        if (!profile) return;
        setSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                aiProvider: activeProvider,
                claudeApiKey,
                straicoApiKey,
                straicoModel,
                oneforallApiKey,
                oneforallModel
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["updateBrandProfile"])(updatedProfile);
            setProfile(updatedProfile);
            if (!isAutoSave) alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            if (!isAutoSave) alert("Failed to save settings. Please try again.");
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
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bru-card bru-card--raised",
            style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading settings..."
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
            lineNumber: 138,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: "var(--bru-text-h3)",
                    fontWeight: 700,
                    marginBottom: "var(--bru-space-6)"
                },
                children: "Settings"
            }, void 0, false, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "settings-grid",
                style: {
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    fontSize: "var(--bru-text-h5)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-6)"
                                },
                                children: "Brand Profile"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 161,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-row",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "firstName",
                                                className: "bru-field__label",
                                                children: "First Name"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 168,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                lineNumber: 169,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 167,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "lastName",
                                                className: "bru-field__label",
                                                children: "Last Name"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 179,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                lineNumber: 180,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 178,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-row",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "companyName",
                                                className: "bru-field__label",
                                                children: "Company Name"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 194,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                lineNumber: 195,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "role",
                                                className: "bru-field__label",
                                                children: "Role"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 205,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                lineNumber: 206,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 204,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "industry",
                                        className: "bru-field__label",
                                        children: "Industry"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 219,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                        lineNumber: 220,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 218,
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
                                        children: "Audience"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 232,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: "var(--bru-border)",
                                            padding: "var(--bru-space-3)",
                                            background: "var(--bru-cream)"
                                        },
                                        children: [
                                            profile?.audience.map((audience, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        marginBottom: index < (profile?.audience.length ?? 0) - 1 ? "var(--bru-space-2)" : 0
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: "var(--bru-text-md)",
                                                                fontWeight: 500
                                                            },
                                                            children: audience
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 250,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "bru-btn bru-btn--sm",
                                                            children: "Edit"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                            lineNumber: 251,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, index, true, {
                                                    fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                    lineNumber: 241,
                                                    columnNumber: 17
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                lineNumber: 254,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary",
                                onClick: ()=>void handleSaveProfile(),
                                disabled: saving,
                                children: saving ? "Saving..." : "Save Profile"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 272,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-card bru-card--raised",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    fontSize: "var(--bru-text-h5)",
                                    fontWeight: 700,
                                    marginBottom: "var(--bru-space-6)"
                                },
                                children: "AI Provider"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 283,
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
                                        children: "Active Provider"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 289,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            {
                                                value: "claude",
                                                label: "Claude (Anthropic)"
                                            },
                                            {
                                                value: "straico",
                                                label: "Straico (Proxy)"
                                            },
                                            {
                                                value: "1forall",
                                                label: "1ForAll (Async)"
                                            }
                                        ].map((provider)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "bru-radio",
                                                style: {
                                                    padding: "var(--bru-space-3)",
                                                    border: activeProvider === provider.value ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                                                    background: activeProvider === provider.value ? "rgba(174, 122, 255, 0.1)" : "var(--bru-white)",
                                                    cursor: "pointer",
                                                    width: "100%"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        name: "aiProvider",
                                                        value: provider.value,
                                                        checked: activeProvider === provider.value,
                                                        onChange: ()=>{
                                                            setActiveProvider(provider.value);
                                                            setKeyValidation(null);
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 311,
                                                        columnNumber: 19
                                                    }, this),
                                                    provider.label
                                                ]
                                            }, provider.value, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 296,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 290,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 288,
                                columnNumber: 11
                            }, this),
                            activeProvider === "claude" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "claudeApiKey",
                                        className: "bru-field__label",
                                        children: "Claude API Key"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 330,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "password",
                                        id: "claudeApiKey",
                                        className: "bru-input",
                                        style: {
                                            width: "100%"
                                        },
                                        value: claudeApiKey,
                                        onChange: (e)=>{
                                            setClaudeApiKey(e.target.value);
                                            setKeyValidation(null);
                                        },
                                        placeholder: "sk-ant-..."
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 331,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 329,
                                columnNumber: 13
                            }, this),
                            activeProvider === "straico" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-stack",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "straicoApiKey",
                                                className: "bru-field__label",
                                                children: "Straico API Key"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 347,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "password",
                                                id: "straicoApiKey",
                                                className: "bru-input",
                                                style: {
                                                    width: "100%"
                                                },
                                                value: straicoApiKey,
                                                onChange: (e)=>{
                                                    setStraicoApiKey(e.target.value);
                                                    setKeyValidation(null);
                                                },
                                                placeholder: "Your Straico API key"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 348,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 346,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "straicoModel",
                                                className: "bru-field__label",
                                                children: "Model"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 359,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "straicoModel",
                                                className: "bru-select",
                                                style: {
                                                    width: "100%"
                                                },
                                                value: straicoModel,
                                                onChange: (e)=>setStraicoModel(e.target.value),
                                                children: straicoModels.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m.id,
                                                        children: m.label
                                                    }, m.id, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 360,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 358,
                                        columnNumber: 15
                                    }, this),
                                    straicoUserInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            padding: "var(--bru-space-3)",
                                            border: "var(--bru-border)",
                                            background: "var(--bru-cream)",
                                            fontSize: "var(--bru-text-md)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontWeight: 700
                                                },
                                                children: [
                                                    straicoUserInfo.firstName,
                                                    " ",
                                                    straicoUserInfo.lastName
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 381,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: [
                                                    "Plan: ",
                                                    straicoUserInfo.plan,
                                                    " | Coins: ",
                                                    straicoUserInfo.coins
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 382,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 373,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 345,
                                columnNumber: 13
                            }, this),
                            activeProvider === "1forall" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-form-stack",
                                style: {
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "oneforallApiKey",
                                                className: "bru-field__label",
                                                children: "1ForAll API Key"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 392,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "password",
                                                id: "oneforallApiKey",
                                                className: "bru-input",
                                                style: {
                                                    width: "100%"
                                                },
                                                value: oneforallApiKey,
                                                onChange: (e)=>{
                                                    setOneforallApiKey(e.target.value);
                                                    setKeyValidation(null);
                                                },
                                                placeholder: "Your 1ForAll API key"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 393,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 391,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bru-field",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "oneforallModel",
                                                className: "bru-field__label",
                                                children: "Model"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 404,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "oneforallModel",
                                                className: "bru-select",
                                                style: {
                                                    width: "100%"
                                                },
                                                value: oneforallModel,
                                                onChange: (e)=>setOneforallModel(e.target.value),
                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ai$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ONEFORALL_MODELS"].map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m.id,
                                                        children: m.label
                                                    }, m.id, false, {
                                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                        lineNumber: 413,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 403,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 390,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "bru-btn bru-btn--primary bru-btn--block",
                                onClick: ()=>void handleValidateKey(),
                                disabled: keyValidating,
                                children: keyValidating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                            size: 16,
                                            className: "animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                            lineNumber: 428,
                                            columnNumber: 17
                                        }, this),
                                        "Validating..."
                                    ]
                                }, void 0, true) : "Validate & Save Key"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 421,
                                columnNumber: 11
                            }, this),
                            keyValidation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: "var(--bru-space-2)",
                                    fontSize: "var(--bru-text-md)",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--bru-space-1)",
                                    color: keyValidation.success ? "var(--bru-success-dark)" : "var(--bru-error-dark)"
                                },
                                children: [
                                    keyValidation.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 448,
                                        columnNumber: 40
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 448,
                                        columnNumber: 68
                                    }, this),
                                    keyValidation.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 437,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                style: {
                                    marginTop: "var(--bru-space-8)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-field__label",
                                        children: "LinkedIn Integration"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 455,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: "var(--bru-border)",
                                            padding: "var(--bru-space-3)",
                                            background: "var(--bru-cream)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "var(--bru-space-2)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: "var(--bru-text-md)",
                                                    fontWeight: 500
                                                },
                                                children: "Status: Not Connected"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 466,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "bru-btn bru-btn--primary bru-btn--block",
                                                children: "Connect LinkedIn"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 467,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 456,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 454,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: "var(--bru-text-h6)",
                                    fontWeight: 700,
                                    marginTop: "var(--bru-space-8)",
                                    marginBottom: "var(--bru-space-4)"
                                },
                                children: "Notifications"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 474,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "var(--bru-space-3)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-checkbox",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                id: "emailNotif"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 480,
                                                columnNumber: 15
                                            }, this),
                                            "Email Notifications"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 479,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bru-checkbox",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                id: "slackNotif"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                                lineNumber: 484,
                                                columnNumber: 15
                                            }, this),
                                            "Slack Notifications"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 478,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 282,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 151,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bru-card bru-card--raised",
                style: {
                    marginTop: "var(--bru-space-6)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: "var(--bru-text-h5)",
                            fontWeight: 700,
                            marginBottom: "var(--bru-space-6)"
                        },
                        children: "Brand Guidelines"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 493,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-form-row",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "copyGuideline",
                                        className: "bru-field__label",
                                        children: "Copy Guideline"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 499,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                                        lineNumber: 500,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 498,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bru-field",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "contentStrategy",
                                        className: "bru-field__label",
                                        children: "Content Strategy"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                        lineNumber: 509,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                                        lineNumber: 510,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 508,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 497,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bru-field",
                        style: {
                            marginBottom: "var(--bru-space-4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "definition",
                                className: "bru-field__label",
                                children: "Brand Definition"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                                lineNumber: 521,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                                lineNumber: 522,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 520,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            justifyContent: "flex-end"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "bru-btn bru-btn--primary",
                            onClick: ()=>void handleSaveProfile(),
                            disabled: saving,
                            children: saving ? "Saving..." : "Save Guidelines"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                            lineNumber: 532,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                        lineNumber: 531,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/doctorpost-v12/app/(protected)/settings/page.tsx",
                lineNumber: 492,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(SettingsPage, "n2CPiAQ0IcE5c15yE8agSocQJPc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SettingsPage;
var _c;
__turbopack_context__.k.register(_c, "SettingsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_doctorpost-v12_71707d15._.js.map