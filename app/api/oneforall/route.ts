import { NextRequest, NextResponse } from "next/server";

const ONEFORALL_BASE = "https://api.1forall.ai/v1/external/llm";

export async function GET(req: NextRequest) {
  return handleRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleRequest(req, "POST");
}

async function handleRequest(req: NextRequest, method: string) {
  const action = req.nextUrl.searchParams.get("action") || "";

  if (!action) {
    return NextResponse.json({ error: "Missing action param" }, { status: 400 });
  }

  if (!["send-request", "check-status"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-oneforall-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing x-oneforall-key header" },
      { status: 400 },
    );
  }

  let url: string;
  if (action === "send-request") {
    url = `${ONEFORALL_BASE}/send-request/`;
  } else {
    const codeRef = req.nextUrl.searchParams.get("code_ref");
    if (!codeRef) {
      return NextResponse.json(
        { error: "Missing code_ref for check-status" },
        { status: 400 },
      );
    }
    url = `${ONEFORALL_BASE}/check-status/${codeRef}/`;
  }

  // Validate max_tokens on send-request
  if (action === "send-request" && method === "POST") {
    try {
      const body = await req.clone().json();
      if (body?.max_tokens != null) {
        const mt = Number(body.max_tokens);
        if (!Number.isFinite(mt) || mt < 1 || mt > 128000) {
          return NextResponse.json(
            { error: "max_tokens must be between 1 and 128000" },
            { status: 422 },
          );
        }
      }
    } catch {
      // body parse failure is fine
    }
  }

  try {
    const upstream = await fetch(url, {
      method: action === "send-request" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${apiKey}`,
      },
      body:
        action === "send-request" && method === "POST"
          ? await req.text()
          : undefined,
    });

    const data = await upstream.text();
    return new NextResponse(data, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
