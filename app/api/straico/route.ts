import { NextRequest, NextResponse } from "next/server";

const STRAICO_BASE = "https://api.straico.com";

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

  if (!["prompt", "models", "user", "user-info"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-straico-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing x-straico-key header" },
      { status: 400 },
    );
  }

  let url: string;

  if (action === "prompt") {
    url = `${STRAICO_BASE}/v1/prompt/completion`;
  } else if (action === "models") {
    url = `${STRAICO_BASE}/v1/models`;
  } else {
    // user and user-info both hit the same endpoint
    url = `${STRAICO_BASE}/v0/user`;
  }

  // Validate max_tokens on prompt requests
  if (action === "prompt" && method === "POST") {
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
      // body parse failure is ok for non-prompt actions
    }
  }

  try {
    const upstream = await fetch(url, {
      method: action === "prompt" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body:
        action === "prompt" ? await req.text() : undefined,
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
