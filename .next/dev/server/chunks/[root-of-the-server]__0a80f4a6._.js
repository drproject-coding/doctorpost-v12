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
"[project]/Desktop/doctorpost-v12/app/api/auth/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/doctorpost-v12/node_modules/next/server.js [app-route] (ecmascript)");
;
const CONFIG = {
    instance: process.env.NCB_INSTANCE,
    apiUrl: process.env.NCB_AUTH_API_URL
};
async function GET(req, { params }) {
    const { path } = await params;
    return proxy(req, path.join("/"));
}
async function POST(req, { params }) {
    const { path } = await params;
    const pathStr = path.join("/");
    if (pathStr === "sign-out") {
        return handleSignOut(req);
    }
    return proxy(req, pathStr, await req.text());
}
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
function transformSetCookieForLocalhost(cookie) {
    const parts = cookie.split(";");
    const nameValue = parts[0].trim();
    let cleanedNameValue = nameValue;
    if (nameValue.startsWith("__Secure-better-auth.")) {
        cleanedNameValue = nameValue.replace("__Secure-", "");
    } else if (nameValue.startsWith("__Host-better-auth.")) {
        cleanedNameValue = nameValue.replace("__Host-", "");
    }
    const otherAttributes = parts.slice(1).map((attr)=>attr.trim()).filter((attr)=>{
        const lower = attr.toLowerCase();
        return !lower.startsWith("domain=") && !lower.startsWith("secure") && !lower.startsWith("samesite=");
    });
    otherAttributes.push("SameSite=Lax");
    return [
        cleanedNameValue,
        ...otherAttributes
    ].join("; ");
}
async function handleSignOut(req) {
    const response = new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
        success: true
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });
    try {
        const searchParams = new URLSearchParams();
        searchParams.set("instance", CONFIG.instance);
        const url = `${CONFIG.apiUrl}/sign-out?${searchParams.toString()}`;
        const origin = req.headers.get("origin") || req.nextUrl.origin;
        const authCookies = extractAuthCookies(req.headers.get("cookie") || "");
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Database-Instance": CONFIG.instance,
                Cookie: authCookies,
                Origin: origin
            },
            body: "{}"
        });
        const cookies = res.headers.getSetCookie?.() || [];
        for (const cookie of cookies){
            response.headers.append("Set-Cookie", transformSetCookieForLocalhost(cookie));
        }
    } catch  {
    // Ignore upstream errors on sign-out
    }
    const cookiesToClear = [
        "better-auth.session_token",
        "better-auth.session_data"
    ];
    for (const cookieName of cookiesToClear){
        response.headers.append("Set-Cookie", `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
    }
    return response;
}
async function proxy(req, path, body) {
    const searchParams = new URLSearchParams();
    searchParams.set("instance", CONFIG.instance);
    const url = `${CONFIG.apiUrl}/${path}?${searchParams.toString()}`;
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const authCookies = extractAuthCookies(req.headers.get("cookie") || "");
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
    const response = new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$doctorpost$2d$v12$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](data, {
        status: res.status,
        headers: {
            "Content-Type": "application/json"
        }
    });
    const cookies = res.headers.getSetCookie?.() || [];
    for (const cookie of cookies){
        response.headers.append("Set-Cookie", transformSetCookieForLocalhost(cookie));
    }
    return response;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0a80f4a6._.js.map