# Plan: Multi-Provider AI Support for Pipeline

## Context

The pipeline is hardcoded to use Anthropic Claude API via `lib/agents/callClaude.ts`.
Users who have Straico or 1forall configured as their active provider cannot run the
pipeline at all - they get 401/credit errors. All three providers are already stored
in the user's NCB profile (straicoApiKey, oneforallApiKey, aiProvider). Existing
service files for Straico/1forall exist in `lib/ai/` but were only used client-side.
This plan extends the pipeline's single AI call entry point to support all three providers.

## Critical Insight

**ALL pipeline AI calls go through ONE function**: `callAgentClaude` in `lib/agents/callClaude.ts`.
This means the entire refactor hinges on updating that one function + threading provider
info through the pipeline state and each agent's input interface.

## Scope

**In:** Straico, 1forall, Claude support in the post pipeline (factory page)
**Out:** Campaign planner, template extractor (separate tools, lower priority)

## Success Criteria

- User with Straico as active provider can run the full pipeline
- User with 1forall as active provider can run the full pipeline
- User with Claude as active provider still works as before
- Provider and model are resolved from user profile automatically (no manual key entry)

---

## Implementation

### File 1: `lib/agents/callClaude.ts`

Core change - add provider routing to the single AI call function.

```typescript
// New signature
export async function callAgentClaude(params: {
  apiKey: string;
  model: AgentConfig["model"];
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  // NEW
  provider?: "claude" | "straico" | "1forall";
  providerModel?: string; // e.g. "openai/gpt-4o-mini" or "anthropic/claude-4-sonnet"
}): Promise<{ text: string; tokensUsed: number }>;
```

**Straico branch** (direct server-side call, no proxy needed):

- POST `https://api.straico.com/v1/prompt/completion`
- Header: `Authorization: Bearer <apiKey>`
- Body: `{ models: [providerModel], message: "<system>\n\n<user>", max_tokens }`
- Response: `data.completions[modelName].completion.choices[0].message.content`

**1forall branch** (async polling, direct server-side call):

- POST `https://api.1forall.ai/v1/external/llm/send-request/`
- Header: `Authorization: Api-Key <apiKey>`
- Body: `{ title: "DoctorPost", system_prompt, message, model: providerModel, max_tokens }`
- Poll GET `https://api.1forall.ai/v1/external/llm/check-status/<code_ref>/` every 2s, max 120s
- Response: `{ status: "completed"|"error"|"pending", response: "..." }`

**Claude branch**: Existing behavior (unchanged)

### File 2: `lib/agents/orchestrator.ts`

Add provider fields to `PipelineState.keys`:

```typescript
keys: {
  claude: string;          // API key (any provider, kept for compat)
  perplexity?: string;
  reddit?: { clientId: string; clientSecret: string };
  provider?: "claude" | "straico" | "1forall";  // NEW
  providerModel?: string;                         // NEW
};
```

Each agent call in the orchestrator passes the two new fields:

```typescript
const output = await runStrategist({
  apiKey: state.keys.claude,
  provider: state.keys.provider,
  providerModel: state.keys.providerModel,
  ...
});
```

### Files 3–8: Each Agent (strategist, researcher, writer, scorer, formatter, learner)

All follow the same pattern - add two optional fields to input interface, pass to `callAgentClaude`:

```typescript
// Input interface addition (same for all 6 agents)
provider?: "claude" | "straico" | "1forall";
providerModel?: string;

// callAgentClaude call update
const { text } = await callAgentClaude({
  apiKey: input.apiKey,
  model: config.model,
  provider: input.provider,
  providerModel: input.providerModel,
  ...
});
```

### File 9: `app/api/pipeline/stream/route.ts`

Resolve provider + model from user profile and inject into pipeline state:

```typescript
const activeProvider = (profile?.ai_provider || "claude") as "claude" | "straico" | "1forall";
const providerModel = activeProvider === "straico"
  ? (profile?.straico_model || "openai/gpt-4o-mini")
  : activeProvider === "1forall"
    ? (profile?.oneforall_model || "anthropic/claude-4-sonnet")
    : undefined; // Claude uses MODEL_IDS internally

// Add to createPipelineState keys:
keys: {
  ...resolvedKeys,
  provider: activeProvider,
  providerModel,
}
```

---

## Tasks

<!-- EXECUTION_TASKS_START -->

| #   | Task                                                 | Files                                                                                                                                                      | Deps | Batch |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----- |
| 1   | Add provider routing to callAgentClaude              | `lib/agents/callClaude.ts`                                                                                                                                 | -    | 1     |
| 2   | Add provider fields to PipelineState and agent calls | `lib/agents/orchestrator.ts`                                                                                                                               | 1    | 1     |
| 3   | Update all agent input interfaces                    | `lib/agents/strategist.ts`, `lib/agents/writer.ts`, `lib/agents/scorer.ts`, `lib/agents/formatter.ts`, `lib/agents/learner.ts`, `lib/agents/researcher.ts` | 1    | 1     |
| 4   | Resolve provider from profile in stream route        | `app/api/pipeline/stream/route.ts`                                                                                                                         | 2, 3 | 2     |

<!-- EXECUTION_TASKS_END -->

---

## Risks & Mitigations

| Risk                           | Mitigation                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------- |
| 1forall polling timeout        | 120s max, emit SSE error if exceeded                                            |
| Straico response format varies | Handle both new and legacy response shapes                                      |
| Provider key missing/empty     | Clear error: "No {provider} API key configured. Check Settings."                |
| Model not selected by user     | Defaults: Straico → `openai/gpt-4o-mini`, 1forall → `anthropic/claude-4-sonnet` |

## Verification

1. Set active provider to Straico in Settings → launch factory → pipeline runs
2. Set active provider to 1forall → launch factory → pipeline runs with polling
3. Set active provider to Claude (with valid key) → still works unchanged
4. TypeScript build clean: `npm run build`
