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
      if (
        !["publish", "minor-tweaks", "rework", "rewrite", "scrap"].includes(
          data.verdict,
        )
      ) {
        issues.push("Invalid 'verdict' field: " + data.verdict);
      }
      break;

    case "evidence":
      if (!Array.isArray(data.claims)) {
        issues.push("Missing or invalid 'claims' array");
      } else {
        for (const claim of data.claims) {
          if (!claim.fact || typeof claim.fact !== "string") {
            issues.push("Claim missing 'fact' field");
            break;
          }
          if (
            !["verified", "estimate", "anecdotal"].includes(claim.verification)
          ) {
            issues.push(
              "Claim has invalid 'verification': " + claim.verification,
            );
            break;
          }
        }
      }
      if (!Array.isArray(data.humanVoices)) {
        issues.push("Missing 'humanVoices' array");
      }
      break;

    case "formatter":
      if (!data.content || typeof data.content !== "string") {
        issues.push("Missing or invalid 'content' field");
      }
      if (typeof data.characterCount !== "number") {
        issues.push("Missing 'characterCount' field");
      }
      if (!data.hookBeforeFold) {
        issues.push("Missing 'hookBeforeFold' field");
      }
      if (!data.metadata) {
        issues.push("Missing 'metadata' field");
      }
      break;

    case "learner":
      if (!Array.isArray(data.signals)) {
        issues.push("Missing or invalid 'signals' array");
      }
      if (typeof data.rulePromotionReady !== "boolean") {
        issues.push("Missing 'rulePromotionReady' field");
      }
      break;

    case "guardrails":
      if (!Array.isArray(data)) {
        issues.push("Guardrail results should be an array");
      } else {
        for (const r of data) {
          if (!r.rule || typeof r.passed !== "boolean") {
            issues.push("Guardrail result missing 'rule' or 'passed' field");
            break;
          }
        }
      }
      break;
  }

  return issues;
}

// ============================================================================
// NEW FEATURE VALIDATION (Batch 1 + 2)
// ============================================================================

function validateNewFeatures(state) {
  const results = [];

  // Task 3: Scorecard progress bars (validated via scorer response)
  if (state.scoreResult) {
    const score = state.scoreResult;
    if (score.criteriaScores) {
      const criteria = Object.values(score.criteriaScores);
      const overflow = criteria.find((c) => c.score > c.max);
      results.push({
        test: "Scorecard: No criteria score exceeds max",
        passed: !overflow,
        detail: overflow
          ? `Score ${overflow.score} > max ${overflow.max}`
          : "All scores within bounds",
      });
    }
  }

  // Task 5: Rewrite instructions present when score < 75
  if (state.scoreResult) {
    const shouldHaveInstructions = state.scoreResult.totalScore < 75;
    if (shouldHaveInstructions) {
      results.push({
        test: "RewriteInstructions: Present when score < 75",
        passed: !!state.scoreResult.rewriteInstructions,
        detail: state.scoreResult.rewriteInstructions
          ? `Instructions: ${state.scoreResult.rewriteInstructions.substring(0, 80)}...`
          : "Missing rewriteInstructions field",
      });
    }
  }

  // Task 6: Evidence claims have required fields for selection UI
  if (state.evidencePack) {
    const claims = state.evidencePack.claims || [];
    const allHaveVerification = claims.every(
      (c) =>
        c.verification &&
        ["verified", "estimate", "anecdotal"].includes(c.verification),
    );
    results.push({
      test: "Evidence Selection: All claims have verification status",
      passed: allHaveVerification,
      detail: `${claims.length} claims, all with verification: ${allHaveVerification}`,
    });
  }

  // Task 8: Formatted post has fold data for mobile/desktop
  if (state.formattedPost) {
    const hasFoldData =
      state.formattedPost.hookBeforeFold &&
      typeof state.formattedPost.hookBeforeFold.mobile === "boolean" &&
      typeof state.formattedPost.hookBeforeFold.desktop === "boolean";
    results.push({
      test: "LinkedIn Preview: hookBeforeFold has mobile and desktop booleans",
      passed: hasFoldData,
      detail: hasFoldData
        ? `mobile: ${state.formattedPost.hookBeforeFold.mobile}, desktop: ${state.formattedPost.hookBeforeFold.desktop}`
        : "Missing or invalid hookBeforeFold",
    });
  }

  // Task 9: Draft content parseable into structure sections
  if (state.writerOutput && state.writerOutput.content) {
    const lines = state.writerOutput.content.split("\n");
    const paragraphs = [];
    let current = [];
    for (const line of lines) {
      if (line.trim() === "") {
        if (current.length) {
          paragraphs.push(current.join("\n"));
          current = [];
        }
      } else {
        current.push(line);
      }
    }
    if (current.length) paragraphs.push(current.join("\n"));

    results.push({
      test: "Structure Highlighting: Draft has enough paragraphs for structure parsing",
      passed: paragraphs.length >= 3,
      detail: `${paragraphs.length} paragraphs (need 3+ for Hook/Problem/Solution/CTA)`,
    });
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("     REAL END-TO-END TEST FOR DOCTORPOST PIPELINE");
  console.log("     (v2 - includes Batch 1 + 2 feature validation)");
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
    console.log("                    PIPELINE TEST RESULTS");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );

    if (results.errors.length > 0) {
      console.log("\n❌ PIPELINE ERRORS:\n");
      for (const error of results.errors) {
        console.log(`  Phase: ${error.phase}`);
        console.log(`  Error: ${error.error}`);
        console.log();
      }
    } else {
      console.log("\n✅ ALL PIPELINE PHASES COMPLETED\n");
      console.log("Completed phases:");
      for (const [action, result] of Object.entries(results.phases)) {
        console.log(
          `  ✓ ${action}: ${result.status} (${result.eventCount} events)`,
        );
      }
    }

    // Run new feature validations
    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("                    FEATURE VALIDATION");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );

    // Build accumulated state from all phases
    const accumulatedState = {};
    for (const phaseResult of Object.values(results.phases)) {
      Object.assign(accumulatedState, phaseResult.state);
    }

    const featureResults = validateNewFeatures(accumulatedState);
    let featurePassed = 0;
    let featureFailed = 0;

    for (const r of featureResults) {
      const icon = r.passed ? "✅" : "❌";
      console.log(`  ${icon} ${r.test}`);
      console.log(`     ${r.detail}`);
      if (r.passed) featurePassed++;
      else featureFailed++;
    }

    if (featureResults.length === 0) {
      console.log(
        "  ⚠️  No feature validations ran (pipeline may have failed early)",
      );
    } else {
      console.log(
        `\n  Results: ${featurePassed} passed, ${featureFailed} failed out of ${featureResults.length} checks`,
      );
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("                       SUMMARY");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(`  Duration: ${elapsed}s`);
    console.log(`  Pipeline phases: ${Object.keys(results.phases).length}/6`);
    console.log(`  Pipeline errors: ${results.errors.length}`);
    console.log(
      `  Feature checks: ${featurePassed}/${featureResults.length} passed`,
    );
    console.log(`  End time: ${new Date().toISOString()}`);

    if (results.errors.length > 0 || featureFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
