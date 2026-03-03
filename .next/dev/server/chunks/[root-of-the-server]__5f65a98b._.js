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
"[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-route] (ecmascript)");
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
    return new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](data, {
        status: res.status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
}),
"[project]/Desktop/doctorpost-v12/app/api/seed-profile/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/lib/ncb-utils.ts [app-route] (ecmascript)");
;
;
async function ncbFetch(method, path, cookies, body) {
    const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG"].dataApiUrl}/${path}?instance=${__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG"].instance}`;
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Database-Instance": __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG"].instance,
            Cookie: cookies
        },
        body: body || undefined
    });
    return res;
}
async function POST(req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSessionUser"])(cookieHeader);
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    const authCookies = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractAuthCookies"])(cookieHeader);
    const doctorProjectProfile = {
        user_id: user.id,
        first_name: "Yassine",
        last_name: "Fatihi",
        company_name: "Doctor Project Ltd",
        role: "Founder & Senior E-Commerce Architect",
        industry: "E-Commerce Architecture & Digital Transformation",
        audience: JSON.stringify([
            "CIO / CTO / Head of Enterprise Architecture (C-level / VP)",
            "Head of Digital / VP Digital / E-commerce Directors (Senior leadership)",
            "Product Data Manager / Catalog Manager / PIM Manager (Functional leadership)",
            "PMO / IT Directors / Transformation Leads (Program leadership)"
        ]),
        tones: JSON.stringify([
            "expert",
            "blunt",
            "analytical",
            "challenger",
            "structured",
            "calm",
            "mature"
        ]),
        offers: JSON.stringify([
            "Strategic intervention for complex e-commerce architecture",
            "ERP/PIM/OMS/DAM system integration & governance",
            "MACH & API-first architecture consulting",
            "Product data governance & multi-country rollout",
            "Business/IT alignment & digital transformation leadership",
            "Applied AI for e-commerce workflows"
        ]),
        taboos: JSON.stringify([
            "Empty motivational content",
            "Lifestyle / hustle culture",
            "Guru / preachy tone",
            "Hollow corporate buzzwords",
            "Fear-based marketing / FOMO",
            "Social CTAs (like if you agree)",
            "Emojis (except 1-2 max if necessary)",
            "Direct self-promotion",
            "Closing questions",
            "Synergy, Leverage, Disrupt, Game-changer, Hustle, Grind"
        ]),
        style_guide_emoji: false,
        style_guide_hashtags: 0,
        style_guide_links: "never-in-post",
        copy_guideline: "Every post must help the reader avoid one identifiable decision mistake. " + "Tone is expert, blunt, analytical, challenger -- never hollow corporate. " + "Posts written in English. Technical terms stay in English (ERP, PIM, OMS, MACH, API-first, headless). " + "Never end with a question -- conclusion is always a strong statement. " + "One single topic per post. No multi-topic, no tangents. " + "Lists: 3-6 items max. No endless bullet lists. " + "CIO test: Would a CIO at a Fortune 500 group read this in full? If not, rewrite. " + "Forbidden words: Synergy, Leverage, Disrupt, Game-changer, Hustle, Grind, Side project, Innovation (without substance), Passion, Dream, Mindset.",
        content_strategy: "5 Editorial Pillars: " + "(1) Modern E-Commerce Architecture -- holistic system vision, ERP/WMS integration, MACH without the BS, invisible tech debt. " + "(2) Project Failures & Delivery -- why 70% fail, vague specs, fake agile, poor scoping. " + "(3) Product Data Governance -- single source of truth, Excel vs PIM, multi-country rollout. " + "(4) Business/IT Translation -- CIO vs e-commerce disconnect, dual profile value. " + "(5) Applied AI -- AI without architecture = gimmick, automated content generation, workflow automation. " + "Publishing: 3 posts/week (Mon, Tue, Fri) 7-11am. 60-90 min post-publication engagement. " + "Target: Enterprise organizations, projects 50K+ EUR. " + "Goal: Establish Doctor Project as THE reference for complex e-commerce architecture.",
        definition: "Doctor Project is a strategic intervention unit for complex e-commerce architecture, " + "serving enterprise retail, CPG, and luxury groups. " + "Senior, operational from Day 1. Dual profile: technical + business. " + "Specialist in complex systems (ERP, PIM, OMS, DAM, MACH, API-first, Headless). " + "Premium track record: Chanel, Tiffany & Co, Mars (Royal Canin), Galeries Lafayette. " + "Featured in the New York Times T List. " + "Tagline: Your Systems Speak Chaos. We Speak Clarity. " + "We are NOT a technical freelancer, digital agency, coach, or consulting body shop.",
        ai_provider: "claude",
        claude_api_key: "",
        straico_api_key: "",
        straico_model: "openai/gpt-4o-mini",
        oneforall_api_key: "",
        oneforall_model: "anthropic/claude-4-sonnet"
    };
    try {
        // Check if profile already exists
        const readRes = await ncbFetch("GET", "read/profiles", authCookies);
        const readData = await readRes.json();
        const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$lib$2f$ncb$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractRows"])(readData);
        if (rows.length > 0) {
            const existing = rows[0];
            const profileId = existing.id;
            // Preserve user's existing API keys & provider settings
            // Strip research API fields that may not exist in NCB schema yet
            const { perplexity_api_key: _p, reddit_client_id: _r, reddit_client_secret: _rs, ...baseProfile } = doctorProjectProfile;
            const updatePayload = {
                ...baseProfile,
                claude_api_key: existing.claude_api_key || "",
                straico_api_key: existing.straico_api_key || "",
                oneforall_api_key: existing.oneforall_api_key || "",
                ai_provider: existing.ai_provider || "claude",
                straico_model: existing.straico_model || "openai/gpt-4o-mini",
                oneforall_model: existing.oneforall_model || "anthropic/claude-4-sonnet"
            };
            const updateRes = await ncbFetch("PUT", `update/profiles/${profileId}`, authCookies, JSON.stringify(updatePayload));
            const updateData = await updateRes.json();
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                action: "updated",
                profile: updateData
            });
        } else {
            const { perplexity_api_key: _p2, reddit_client_id: _r2, reddit_client_secret: _rs2, ...createProfile } = doctorProjectProfile;
            const createRes = await ncbFetch("POST", "create/profiles", authCookies, JSON.stringify(createProfile));
            const createData = await createRes.json();
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                action: "created",
                profile: createData
            });
        }
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error instanceof Error ? error.message : "Failed to seed profile"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5f65a98b._.js.map