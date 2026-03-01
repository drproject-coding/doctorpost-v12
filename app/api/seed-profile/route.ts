import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  extractAuthCookies,
  CONFIG,
  extractRows,
} from "@/lib/ncb-utils";

async function ncbFetch(
  method: string,
  path: string,
  cookies: string,
  body?: string,
) {
  const url = `${CONFIG.dataApiUrl}/${path}?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: cookies,
    },
    body: body || undefined,
  });
  return res;
}

/**
 * POST /api/seed-profile
 * Seeds the authenticated user's brand profile with Doctor Project data.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authCookies = extractAuthCookies(cookieHeader);

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
      "PMO / IT Directors / Transformation Leads (Program leadership)",
    ]),
    tones: JSON.stringify([
      "expert",
      "blunt",
      "analytical",
      "challenger",
      "structured",
      "calm",
      "mature",
    ]),
    offers: JSON.stringify([
      "Strategic intervention for complex e-commerce architecture",
      "ERP/PIM/OMS/DAM system integration & governance",
      "MACH & API-first architecture consulting",
      "Product data governance & multi-country rollout",
      "Business/IT alignment & digital transformation leadership",
      "Applied AI for e-commerce workflows",
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
      "Synergy, Leverage, Disrupt, Game-changer, Hustle, Grind",
    ]),
    style_guide_emoji: false,
    style_guide_hashtags: 0,
    style_guide_links: "never-in-post",
    copy_guideline:
      "Every post must help the reader avoid one identifiable decision mistake. " +
      "Tone is expert, blunt, analytical, challenger -- never hollow corporate. " +
      "Posts written in English. Technical terms stay in English (ERP, PIM, OMS, MACH, API-first, headless). " +
      "Never end with a question -- conclusion is always a strong statement. " +
      "One single topic per post. No multi-topic, no tangents. " +
      "Lists: 3-6 items max. No endless bullet lists. " +
      "CIO test: Would a CIO at a Fortune 500 group read this in full? If not, rewrite. " +
      "Forbidden words: Synergy, Leverage, Disrupt, Game-changer, Hustle, Grind, Side project, Innovation (without substance), Passion, Dream, Mindset.",
    content_strategy:
      "5 Editorial Pillars: " +
      "(1) Modern E-Commerce Architecture -- holistic system vision, ERP/WMS integration, MACH without the BS, invisible tech debt. " +
      "(2) Project Failures & Delivery -- why 70% fail, vague specs, fake agile, poor scoping. " +
      "(3) Product Data Governance -- single source of truth, Excel vs PIM, multi-country rollout. " +
      "(4) Business/IT Translation -- CIO vs e-commerce disconnect, dual profile value. " +
      "(5) Applied AI -- AI without architecture = gimmick, automated content generation, workflow automation. " +
      "Publishing: 3 posts/week (Mon, Tue, Fri) 7-11am. 60-90 min post-publication engagement. " +
      "Target: Enterprise organizations, projects 50K+ EUR. " +
      "Goal: Establish Doctor Project as THE reference for complex e-commerce architecture.",
    definition:
      "Doctor Project is a strategic intervention unit for complex e-commerce architecture, " +
      "serving enterprise retail, CPG, and luxury groups. " +
      "Senior, operational from Day 1. Dual profile: technical + business. " +
      "Specialist in complex systems (ERP, PIM, OMS, DAM, MACH, API-first, Headless). " +
      "Premium track record: Chanel, Tiffany & Co, Mars (Royal Canin), Galeries Lafayette. " +
      "Featured in the New York Times T List. " +
      "Tagline: Your Systems Speak Chaos. We Speak Clarity. " +
      "We are NOT a technical freelancer, digital agency, coach, or consulting body shop.",
    ai_provider: "claude",
    claude_api_key: "",
    straico_api_key: "",
    straico_model: "openai/gpt-4o-mini",
    oneforall_api_key: "",
    oneforall_model: "anthropic/claude-4-sonnet",
  };

  try {
    // Check if profile already exists
    const readRes = await ncbFetch("GET", "read/profiles", authCookies);
    const readData = await readRes.json();
    const rows = extractRows<Record<string, unknown>>(readData);

    if (rows.length > 0) {
      const existing = rows[0];
      const profileId = existing.id;

      // Preserve user's existing API keys & provider settings
      // Strip research API fields that may not exist in NCB schema yet
      const {
        perplexity_api_key: _p,
        reddit_client_id: _r,
        reddit_client_secret: _rs,
        ...baseProfile
      } = doctorProjectProfile;
      const updatePayload = {
        ...baseProfile,
        claude_api_key: (existing.claude_api_key as string) || "",
        straico_api_key: (existing.straico_api_key as string) || "",
        oneforall_api_key: (existing.oneforall_api_key as string) || "",
        ai_provider: (existing.ai_provider as string) || "claude",
        straico_model:
          (existing.straico_model as string) || "openai/gpt-4o-mini",
        oneforall_model:
          (existing.oneforall_model as string) || "anthropic/claude-4-sonnet",
      };

      const updateRes = await ncbFetch(
        "PUT",
        `update/profiles/${profileId}`,
        authCookies,
        JSON.stringify(updatePayload),
      );
      const updateData = await updateRes.json();
      return NextResponse.json({
        success: true,
        action: "updated",
        profile: updateData,
      });
    } else {
      const {
        perplexity_api_key: _p2,
        reddit_client_id: _r2,
        reddit_client_secret: _rs2,
        ...createProfile
      } = doctorProjectProfile;
      const createRes = await ncbFetch(
        "POST",
        "create/profiles",
        authCookies,
        JSON.stringify(createProfile),
      );
      const createData = await createRes.json();
      return NextResponse.json({
        success: true,
        action: "created",
        profile: createData,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to seed profile",
      },
      { status: 500 },
    );
  }
}
