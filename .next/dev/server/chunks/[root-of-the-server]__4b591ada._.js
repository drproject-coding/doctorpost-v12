module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Desktop/doctorpost-v12/app/api/models/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-route] (ecmascript)");
;
const ONEFORALL_BASE = "https://api.1forall.ai/v1/external/llm";
const STRAICO_BASE = "https://api.straico.com";
// Infer provider from 1ForAll model code
function inferProvider(code) {
    const lower = code.toLowerCase();
    if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
    if (lower.includes("gpt") || lower.includes("openai") || lower.includes("chatgpt")) return "openai";
    if (lower.includes("gemini") || lower.includes("google")) return "google";
    if (lower.includes("llama") || lower.includes("meta")) return "meta";
    if (lower.includes("mistral")) return "mistral";
    if (lower.includes("deepseek")) return "deepseek";
    if (lower.includes("qwen")) return "qwen";
    if (lower.includes("perplexity") || lower.includes("sonar")) return "perplexity";
    return "other";
}
const ONEFORALL_FALLBACK = [
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
const STRAICO_FALLBACK = [
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
async function fetchOneForAllModels(apiKey) {
    const response = await fetch(`${ONEFORALL_BASE}/models/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Api-Key ${apiKey}`
        }
    });
    if (!response.ok) {
        throw new Error(`1ForAll models fetch failed (${response.status})`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json();
    // 1ForAll returns a flat JSON array
    const raw = Array.isArray(data) ? data : data.models || data.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const models = Array.isArray(raw) ? raw : [];
    if (models.length === 0) {
        throw new Error("1ForAll returned empty models list");
    }
    return models.filter((m)=>m.enabled !== false).map((m)=>{
        // 1ForAll uses `code` as model ID and `name` as display label
        const code = String(m.code || m.id || m.model || m.name || "");
        const label = String(m.name || m.code || "");
        // Extract max_tokens from additional_fields if present
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const additionalFields = Array.isArray(m.additional_fields) ? m.additional_fields : [];
        const maxTokensField = additionalFields.find(// eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f)=>f.code === "max_tokens" || f.code === "max_output_tokens");
        return {
            id: code,
            label,
            ...m.description ? {
                description: String(m.description)
            } : {},
            ...maxTokensField?.max ? {
                maxTokens: {
                    min: Number(maxTokensField.min) || 1,
                    max: Number(maxTokensField.max)
                }
            } : {},
            ...m.credits_per_input_token != null ? {
                creditsPerInputToken: parseFloat(m.credits_per_input_token)
            } : {},
            ...m.credits_per_output_token != null ? {
                creditsPerOutputToken: parseFloat(m.credits_per_output_token)
            } : {},
            provider: inferProvider(code)
        };
    });
}
async function fetchStraicoModels(apiKey) {
    const response = await fetch(`${STRAICO_BASE}/v2/models`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        }
    });
    if (!response.ok) {
        throw new Error(`Straico models fetch failed (${response.status})`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    if (raw.length === 0) {
        throw new Error("Straico returned empty models list");
    }
    // Filter to chat models only
    const chatModels = raw.filter((m)=>(m.model_type || "chat") === "chat");
    return chatModels.map((m)=>({
            id: String(m.id || m.model || m.name || ""),
            label: String(m.name || m.id || m.model || ""),
            ...m.max_output ? {
                maxTokens: {
                    min: 1,
                    max: Number(m.max_output)
                }
            } : {},
            ...m.word_limit != null ? {
                wordLimit: Number(m.word_limit)
            } : {},
            ...m.pricing ? {
                pricing: m.pricing
            } : {},
            ...m.owned_by ? {
                provider: String(m.owned_by)
            } : {},
            ...m.model_type ? {
                modelType: String(m.model_type)
            } : {},
            ...m.metadata?.editors_choice_level != null ? {
                editorsChoiceLevel: Number(m.metadata.editors_choice_level)
            } : {},
            ...m.metadata?.applications?.length ? {
                applications: m.metadata.applications
            } : {},
            ...m.metadata?.features?.length ? {
                features: m.metadata.features
            } : {},
            ...m.metadata?.pros?.length ? {
                pros: m.metadata.pros
            } : {},
            ...m.metadata?.cons?.length ? {
                cons: m.metadata.cons
            } : {},
            ...m.metadata?.icon ? {
                icon: String(m.metadata.icon)
            } : {},
            ...m.metadata?.model_date ? {
                modelDate: String(m.metadata.model_date)
            } : {}
        }));
}
async function GET(req) {
    const provider = req.nextUrl.searchParams.get("provider");
    if (!provider || provider !== "1forall" && provider !== "straico") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Invalid or missing provider. Use ?provider=1forall or ?provider=straico"
        }, {
            status: 400
        });
    }
    const apiKey = provider === "1forall" ? req.headers.get("x-oneforall-key") : req.headers.get("x-straico-key");
    let models;
    let source;
    try {
        if (!apiKey) {
            throw new Error("No API key provided");
        }
        models = provider === "1forall" ? await fetchOneForAllModels(apiKey) : await fetchStraicoModels(apiKey);
        source = "api";
    } catch  {
        models = provider === "1forall" ? ONEFORALL_FALLBACK : STRAICO_FALLBACK;
        source = "fallback";
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        provider,
        models,
        source
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4b591ada._.js.map