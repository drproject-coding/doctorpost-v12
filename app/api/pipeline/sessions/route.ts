import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import {
  listPipelineSessions,
  deletePipelineSession,
} from "@/lib/pipeline/savePipelineData";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessions = await listPipelineSessions(cookie);
  return NextResponse.json(sessions);
}

export async function DELETE(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sessionId } = (await req.json()) as { sessionId: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  await deletePipelineSession(cookie, sessionId);
  return NextResponse.json({ ok: true });
}
