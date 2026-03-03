# Real End-to-End Testing Guide

## Background

The testing suite (912 tests) previously missed a bug in the Discovery phase because:

- Tests were mock-based (Playwright tests with mocked API endpoints)
- No validation of actual agent output shapes at runtime
- No real Claude API calls to verify response contracts

This guide shows how to run **real end-to-end tests** with actual API calls and real Claude responses.

## Real E2E Test Script

The script `scripts/e2e-real-test.js` does:

1. **Authenticates** with the deployed app using session cookies
2. **Walks through all 8 phases** of the pipeline
3. **Makes real API calls** to `/api/pipeline/stream`
4. **Validates response shapes** to catch contract violations
5. **Reports detailed errors** for any phase failures

## How to Run

### Step 1: Get Session Cookies

1. Open the deployed app: https://doctorpost-v12.vercel.app
2. Log in with your credentials
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to **Application** tab → **Cookies** → select `doctorpost-v12.vercel.app`
5. Find the cookie named `better-auth.session_token`
6. Copy its **Value** (the full token string)

### Step 2: Run the E2E Test

```bash
# Set environment variable and run test
SESSION_COOKIES="better-auth.session_token=YOUR_TOKEN_VALUE_HERE" \
  CLAUDE_API_KEY="sk-ant-..." \
  node scripts/e2e-real-test.js
```

Replace:

- `YOUR_TOKEN_VALUE_HERE` with the token from Step 1
- `sk-ant-...` with your Claude API key

### Step 3: Review Results

The test will:

- Walk through Phases 1-8 with real API calls
- Report any errors in response shapes
- Show event counts and data extracted from each phase
- Exit with code 0 (success) or 1 (failure)

Example output:

```
═══════════════════════════════════════════════════════════════
     REAL END-TO-END TEST FOR DOCTORPOST PIPELINE
═══════════════════════════════════════════════════════════════
  Base URL: https://doctorpost-v12.vercel.app
  Start time: 2026-03-03T20:00:00.000Z

🚀 Phase 1: Direction
  📤 Sending request to POST /api/pipeline/stream
  📨 Response status: 200
  📊 Received 5 SSE events
     - strategist: processing (45%)
     - strategist: done (100%)
     ✓ Got 4 topic proposals

...
```

## What This Tests

| Test Type               | Description                                    | Catches                                               |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Response Shape**      | Validates all required fields are present      | Missing fields, wrong types (like the strategist bug) |
| **Contract Compliance** | Ensures agent outputs match handoff interfaces | Type mismatches between phases                        |
| **Real API Calls**      | Uses actual Claude API (not mocks)             | API/prompt issues, response format changes            |
| **Phase Sequencing**    | Validates all 8 phases execute correctly       | State accumulation problems                           |
| **Error Handling**      | Tests error paths and recovery                 | Unhandled exceptions, error propagation               |

## Troubleshooting

### 401 Unauthorized

- Your session cookie has expired
- Log back into the app and get a fresh session token

### Network Error

- Check that the app is deployed and accessible at the BASE_URL
- Verify your Claude API key is valid

### Phase Timeout

- A phase is taking > 10 seconds (Claude API slow)
- Check your API rate limits

### Response Validation Error

- An agent's output doesn't match the expected contract
- This indicates a bug similar to the strategist issue
- **This is exactly what we're trying to catch!**

## Adding More Validation

The script includes a `validateResponseShape()` function. To add more validation:

```javascript
case "your_agent":
  if (!data.requiredField) {
    issues.push("Missing 'requiredField'");
  }
  // Add more validation...
  break;
```

Then update the phase handler to call it:

```javascript
const issues = validateResponseShape(data, phase.action);
if (issues.length > 0) {
  results.warnings.push({
    phase: phase.name,
    issues,
  });
}
```

## Next Steps

1. **Run the test** with your session cookies and Claude API key
2. **Document any failures** you find
3. **Add response validation** to the orchestrator to catch these issues at runtime
4. **Update the mock tests** to test response shapes, not just happy paths
5. **Consider adding integration tests** that use real Claude API (with lower rate limits)

## Files

- **Test Script**: `scripts/e2e-real-test.js`
- **Related Code**:
  - `app/api/pipeline/stream/route.ts` - API endpoint being tested
  - `lib/agents/orchestrator.ts` - Pipeline orchestration
  - `lib/agents/types.ts` - Agent handoff contracts

## Integration into CI/CD

For production readiness:

1. Create a test user account
2. Generate a permanent session token (if supported)
3. Run E2E test in CI/CD with:
   ```yaml
   - name: Real E2E Test
     run: |
       SESSION_COOKIES=${{ secrets.TEST_SESSION_COOKIE }} \
       CLAUDE_API_KEY=${{ secrets.CLAUDE_API_KEY }} \
       node scripts/e2e-real-test.js
   ```
4. Add to `package.json`:
   ```json
   {
     "scripts": {
       "test:e2e:real": "SESSION_COOKIES=$SESSION_COOKIES CLAUDE_API_KEY=$CLAUDE_API_KEY node scripts/e2e-real-test.js"
     }
   }
   ```

## Why This Matters

The bug found in production (`Cannot read properties of undefined (reading '0')`) happened in Discovery phase because:

1. **Tests used mocks** - No validation of real Claude response shape
2. **Prompt mismatch** - Strategist refine prompt asked for single TopicProposal, but code expected proposals array
3. **No runtime validation** - No guards to catch shape mismatches at runtime

A real E2E test would have caught this immediately by validating that `refined.proposals` is actually an array before accessing `[0]`.
