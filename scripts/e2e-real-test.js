#!/usr/bin/env node

/**
 * REAL END-TO-END TEST FOR PIPELINE
 *
 * This script runs a REAL end-to-end test of the full 8-phase pipeline,
 * with actual API calls and real Claude responses (not mocked).
 *
 * Usage:
 *   NODE_ENV=production node scripts/e2e-real-test.js
 *
 * Environment variables:
 *   CLAUDE_API_KEY - Claude API key for pipeline phases
 *   BASE_URL - App base URL (default: https://doctorpost-v12.vercel.app)
 *   SESSION_COOKIES - Authenticated session cookies
 *   TEST_USER_EMAIL - Email for test user (if creating new account)
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "https://doctorpost-v12.vercel.app";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.error("ERROR: CLAUDE_API_KEY environment variable is required");
  process.exit(1);
}

// ============================================================================
// STEP 1: Get authenticated session cookies
// ============================================================================

async function getSessionCookies() {
  console.log("\n📋 STEP 1: Authenticating with the app...");

  // Method 1: Try to use provided session cookies
  if (process.env.SESSION_COOKIES) {
    console.log("  ✓ Using provided SESSION_COOKIES environment variable");
    return process.env.SESSION_COOKIES;
  }

  // Method 2: Try to read from a .env.local file
  const envLocalPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envLocal = fs.readFileSync(envLocalPath, "utf-8");
    const cookieMatch = envLocal.match(/better-auth\.session_token=([^\n;]+)/);
    if (cookieMatch) {
      const cookies = envLocal
        .split("\n")
        .filter(
          (line) =>
            line.includes("better-auth.session_token=") ||
            line.includes("better-auth.session_data="),
        )
        .join("; ");
      if (cookies) {
        console.log("  ✓ Found session cookies in .env.local");
        return cookies;
      }
    }
  }

  // Method 3: Try to authenticate via login
  console.log("  ⚠️  No session cookies found.");
  console.log("  To run this test, you need to:");
  console.log("    1. Login to the app at " + BASE_URL);
  console.log(
    "    2. Extract session cookies from browser DevTools (Application > Cookies)",
  );
  console.log(
    "    3. Run with: SESSION_COOKIES='cookie_value' node scripts/e2e-real-test.js",
  );
  process.exit(1);
}

// ============================================================================
// STEP 2: Test pipeline phases
// ============================================================================

async function testPipeline(cookies) {
  const sessionId = `e2e-test-${Date.now()}`;
  const results = {
    sessionId,
    phases: {},
    errors: [],
    warnings: [],
  };

  const phases = [
    { action: "start", name: "Phase 1: Direction" },
    { action: "discover", name: "Phase 2: Discovery" },
    { action: "evidence", name: "Phase 3: Evidence" },
    { action: "write", name: "Phase 4+5: Writing & Scoring" },
    { action: "format", name: "Phase 6: Formatting" },
    { action: "learn", name: "Phase 8: Learning" },
  ];

  let state = {};
  let selectedTopic = null;

  for (const phase of phases) {
    console.log(`\n🚀 ${phase.name}`);

    const requestBody = {
      action: phase.action,
      sessionId,
      keys: {
        claude: CLAUDE_API_KEY,
      },
      // Pass along state from previous phases
      selectedTopic,
      ...Object.entries(state).reduce((acc, [key, val]) => {
        if (
          [
            "refinedTopic",
            "selectedTemplate",
            "evidencePack",
            "writerOutput",
            "scoreResult",
            "formattedPost",
          ].includes(key)
        ) {
          acc[key] = val;
        }
        return acc;
      }, {}),
    };

    try {
      console.log(`  📤 Sending request to POST /api/pipeline/stream`);
      console.log(`     Headers: Cookie: [${cookies.substring(0, 50)}...]`);

      const response = await fetch(`${BASE_URL}/api/pipeline/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`  📨 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ ERROR: ${errorText}`);
        results.errors.push({
          phase: phase.name,
          status: response.status,
          error: errorText,
        });
        break;
      }

      // Parse SSE events
      const text = await response.text();
      const events = parseSSE(text);

      console.log(`  📊 Received ${events.length} SSE events`);

      // Process events
      for (const event of events) {
        const data = JSON.parse(event);
        console.log(
          `     - ${data.step || "pipeline"}: ${data.status} (${data.percent}%)`,
        );

        // Extract state from events
        if (data.step === "strategist" && data.data?.proposals) {
          selectedTopic = data.data.proposals[0];
          console.log(
            `       ✓ Got ${data.data.proposals.length} topic proposals`,
          );
        }

        if (data.step === "researcher" && data.data?.subtopicAngles) {
          state.refinedTopic = data.data.subtopicAngles;
          console.log(
            `       ✓ Got research brief with ${data.data.subtopicAngles.length} angles`,
          );
        }

        if (data.step === "evidence" && data.data?.claims) {
          state.evidencePack = data.data;
          console.log(
            `       ✓ Gathered evidence: ${data.data.claims?.length || 0} claims`,
          );
        }

        if (data.step === "writer" && data.data?.content) {
          state.writerOutput = data.data;
          console.log(`       ✓ Draft written: ${data.data.wordCount} words`);
        }

        if (data.step === "scorer" && data.data?.totalScore !== undefined) {
          state.scoreResult = data.data;
          console.log(
            `       ✓ Scored: ${data.data.totalScore} (verdict: ${data.data.verdict})`,
          );
        }

        if (data.step === "formatter" && data.data?.hookBeforeFold) {
          state.formattedPost = data.data;
          console.log(`       ✓ Formatted for platform`);
        }

        if (data.step === "pipeline" && data.status === "error") {
          console.log(`       ❌ Pipeline error: ${data.data?.error}`);
          results.errors.push({
            phase: phase.name,
            error: data.data?.error,
          });
          break;
        }
      }

      results.phases[phase.action] = {
        status: "completed",
        eventCount: events.length,
        state: state,
      };
    } catch (error) {
      console.error(`  ❌ Request failed: ${error.message}`);
      results.errors.push({
        phase: phase.name,
        error: error.message,
      });
      break;
    }
  }

  return results;
}

// ============================================================================
// UTILITIES
// ============================================================================

function parseSSE(text) {
  const lines = text.split("\n");
  const events = [];
  let currentEvent = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      currentEvent = line.slice(6);
      if (currentEvent) {
        events.push(currentEvent);
      }
    }
  }

  return events;
}

function validateResponseShape(data, phase) {
  const issues = [];

  switch (phase) {
    case "strategist":
      if (!Array.isArray(data.proposals)) {
        issues.push("Missing or invalid 'proposals' array");
      }
      if (!data.pillarAssessment || typeof data.pillarAssessment !== "string") {
        issues.push("Missing or invalid 'pillarAssessment' field");
      }
      if (!data.angleAssessment || typeof data.angleAssessment !== "string") {
        issues.push("Missing or invalid 'angleAssessment' field");
      }
      if (!data.currentPhase || typeof data.currentPhase !== "string") {
        issues.push("Missing or invalid 'currentPhase' field");
      }
      break;

    case "writer":
      if (!data.content || typeof data.content !== "string") {
        issues.push("Missing or invalid 'content' field");
      }
      if (typeof data.wordCount !== "number") {
        issues.push("Missing or invalid 'wordCount' field");
      }
      break;

    case "scorer":
      if (typeof data.totalScore !== "number") {
        issues.push("Missing or invalid 'totalScore' field");
      }
      if (!["publish", "rewrite", "scrap"].includes(data.verdict)) {
        issues.push("Invalid 'verdict' field");
      }
      break;
  }

  return issues;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("     REAL END-TO-END TEST FOR DOCTORPOST PIPELINE");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Start time: ${new Date().toISOString()}`);

  try {
    const cookies = await getSessionCookies();
    const results = await testPipeline(cookies);

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("                    TEST RESULTS");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );

    if (results.errors.length > 0) {
      console.log("\n❌ ERRORS DETECTED:\n");
      for (const error of results.errors) {
        console.log(`  Phase: ${error.phase}`);
        console.log(`  Error: ${error.error}`);
        console.log();
      }
      process.exit(1);
    } else {
      console.log("\n✅ ALL PHASES COMPLETED SUCCESSFULLY!\n");
      console.log("Completed phases:");
      for (const [action, result] of Object.entries(results.phases)) {
        console.log(`  ✓ ${action}: ${result.status}`);
      }
    }

    console.log(`\nEnd time: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
