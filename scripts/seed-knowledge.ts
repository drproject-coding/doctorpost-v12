/**
 * Seed Knowledge Layer
 *
 * Reads all Doctor Project content-factory .md files and creates
 * knowledge documents via the NCB API.
 *
 * Usage:
 *   npx tsx scripts/seed-knowledge.ts
 *
 * Requires:
 *   - The DoctorPost app running locally (for API access)
 *   - A valid session cookie (or run as authenticated user)
 *   - The content-factory-agents repo at CONTENT_FACTORY_PATH
 *
 * Environment:
 *   CONTENT_FACTORY_PATH  - path to content-factory-agents repo
 *                           (default: ../content-factory-agents)
 *   APP_URL               - DoctorPost app URL (default: http://localhost:3000)
 *   SESSION_COOKIE        - auth cookie for API requests
 */

import * as fs from "fs";
import * as path from "path";
import { SEED_MANIFEST } from "../lib/knowledge/seed-data/manifest";

const CONTENT_FACTORY_PATH =
  process.env.CONTENT_FACTORY_PATH ||
  path.resolve(
    __dirname,
    "../../content-factory-agents/doctor-project-content-factory",
  );
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SESSION_COOKIE = process.env.SESSION_COOKIE || "";

interface SeedResult {
  name: string;
  category: string;
  status: "created" | "skipped" | "error";
  error?: string;
}

async function seedDocument(entry: {
  category: string;
  subcategory: string;
  name: string;
  content: string;
}): Promise<SeedResult> {
  try {
    // Check if document already exists
    const checkRes = await fetch(
      `${APP_URL}/api/data/read/documents?category=${encodeURIComponent(entry.category)}&name=${encodeURIComponent(entry.name)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: SESSION_COOKIE,
        },
      },
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      const rows = Array.isArray(data) ? data : data?.data || data?.rows || [];
      if (rows.length > 0) {
        return {
          name: entry.name,
          category: entry.category,
          status: "skipped",
        };
      }
    }

    // Create the document
    const createRes = await fetch(`${APP_URL}/api/data/create/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: SESSION_COOKIE,
      },
      body: JSON.stringify({
        category: entry.category,
        subcategory: entry.subcategory,
        name: entry.name,
        content: entry.content,
        version: 1,
        is_active: true,
        source: "seed",
        updated_by: "system",
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return {
        name: entry.name,
        category: entry.category,
        status: "error",
        error: `${createRes.status}: ${errText}`,
      };
    }

    return { name: entry.name, category: entry.category, status: "created" };
  } catch (err) {
    return {
      name: entry.name,
      category: entry.category,
      status: "error",
      error: String(err),
    };
  }
}

async function main() {
  console.log("=== DoctorPost Knowledge Layer Seed ===\n");
  console.log(`Content factory path: ${CONTENT_FACTORY_PATH}`);
  console.log(`App URL: ${APP_URL}`);
  console.log(`Documents to seed: ${SEED_MANIFEST.length}\n`);

  // Verify content factory path exists
  if (!fs.existsSync(CONTENT_FACTORY_PATH)) {
    console.error(
      `ERROR: Content factory path not found: ${CONTENT_FACTORY_PATH}`,
    );
    console.error("Set CONTENT_FACTORY_PATH environment variable.");
    process.exit(1);
  }

  const results: SeedResult[] = [];

  for (const entry of SEED_MANIFEST) {
    const filePath = path.join(CONTENT_FACTORY_PATH, entry.sourcePath);

    if (!fs.existsSync(filePath)) {
      console.warn(`  WARN: File not found, skipping: ${entry.sourcePath}`);
      results.push({
        name: entry.name,
        category: entry.category,
        status: "error",
        error: "File not found",
      });
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    process.stdout.write(`  Seeding ${entry.category}/${entry.name}...`);

    const result = await seedDocument({
      category: entry.category,
      subcategory: entry.subcategory,
      name: entry.name,
      content,
    });

    results.push(result);
    console.log(` ${result.status}${result.error ? ` (${result.error})` : ""}`);
  }

  // Summary
  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log("\n=== Summary ===");
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  if (errors > 0) {
    console.log("\nErrors:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  - ${r.category}/${r.name}: ${r.error}`));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
