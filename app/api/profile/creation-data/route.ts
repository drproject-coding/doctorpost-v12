import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";

export interface ProfileCreationData {
  audience: string[];
  tones: string[];
  offers: string[];
  industry: string;
  contentStrategy: string;
  definition: string;
  copyGuideline: string;
}

const EMPTY_PROFILE: ProfileCreationData = {
  audience: [],
  tones: [],
  offers: [],
  industry: "",
  contentStrategy: "",
  definition: "",
  copyGuideline: "",
};

function parseJsonField(value: string | undefined | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await fetchUserProfile(cookieHeader);

    if (!profile) {
      return NextResponse.json(EMPTY_PROFILE);
    }

    const data: ProfileCreationData = {
      audience: parseJsonField(profile.audience),
      tones: parseJsonField(profile.tones),
      offers: parseJsonField(profile.offers),
      industry: profile.industry || "",
      contentStrategy: profile.content_strategy || "",
      definition: profile.definition || "",
      copyGuideline: profile.copy_guideline || "",
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[profile/creation-data] Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 },
    );
  }
}
