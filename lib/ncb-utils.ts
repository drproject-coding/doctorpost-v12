import { NextRequest, NextResponse } from "next/server";

export const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
  appUrl: process.env.NCB_APP_URL || "https://app.nocodebackend.com",
};

export function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return "";
  const cookies = cookieHeader.split(";");
  const authCookies: string[] = [];
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (
      trimmed.startsWith("better-auth.session_token=") ||
      trimmed.startsWith("better-auth.session_data=")
    ) {
      authCookies.push(trimmed);
    }
  }
  return authCookies.join("; ");
}

export async function getSessionUser(cookieHeader: string): Promise<{
  id: string;
  email?: string;
  name?: string;
  image?: string;
} | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;
  const url = `${CONFIG.authApiUrl}/get-session?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });
  if (res.ok) {
    const data = (await res.json()) as {
      user?: { id: string; email?: string; name?: string; image?: string };
    };
    return data.user || null;
  }
  return null;
}

export async function proxyToNCB(
  req: NextRequest,
  path: string,
  body?: string,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("instance", CONFIG.instance);
  req.nextUrl.searchParams.forEach((val, key) => {
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
      Origin: origin,
    },
    body: body || undefined,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
