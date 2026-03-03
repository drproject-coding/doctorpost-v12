module.exports = [
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
];

//# sourceMappingURL=Desktop_doctorpost-v12_lib_ai_straicoService_ts_24537b92._.js.map