module.exports=[79257,e=>{"use strict";function t(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*\n?([\s\S]*?)(?:\n?```)?$/);if(t)try{let e=t[1].trim();if(e)return JSON.parse(e)}catch{}if(!t&&(t=e.match(/```json\s*([\s\S]*?)(?:```|$)/)))try{let e=t[1].trim();if(e)return JSON.parse(e)}catch{}let r=e.search(/[[{]/);if(-1!==r){let t=e.slice(r),o=t[0],n="["===o?"]":"}",a=0,s=!1,i=!1;for(let e=0;e<t.length;e++){let r=t[e];if(i){i=!1;continue}if("\\"===r){i=!0;continue}if('"'===r){s=!s;continue}if(!s&&(r===o&&a++,r===n&&a--,0===a))try{return JSON.parse(t.slice(0,e+1))}catch{break}}}throw Error(`Failed to extract JSON from agent response. Raw output starts with: "${e.slice(0,100)}..."`)}function r(e,t){let r=t.filter(t=>!(t in e)||void 0===e[t]);if(r.length>0)throw Error(`Agent response missing required fields: ${r.join(", ")}`)}e.s(["extractJson",()=>t,"validateFields",()=>r])},20607,57465,e=>{"use strict";let t={opus:"claude-opus-4-5-20251101",sonnet:"claude-sonnet-4-5-20250929",haiku:"claude-haiku-4-5-20251001"};async function r(e){switch(e.provider||"claude"){case"straico":return n(e);case"1forall":return a(e);default:return o(e)}}async function o(e){let r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:t[e.model],max_tokens:e.maxTokens,system:e.systemPrompt,messages:[{role:"user",content:e.userMessage}]}),signal:e.signal});if(!r.ok){let e=await r.text();throw Error(`Claude API error (${r.status}): ${e}`)}let o=await r.json(),n=o.content?.[0]?.text;if(!n)throw Error("Claude API returned an empty response");return{text:n,tokensUsed:(o.usage?.input_tokens??0)+(o.usage?.output_tokens??0)}}async function n(e){let t,r=e.providerModel||"openai/gpt-4o-mini",o=await fetch("https://api.straico.com/v1/prompt/completion",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify({models:[r],message:`${e.systemPrompt}

${e.userMessage}`,max_tokens:e.maxTokens}),signal:e.signal});if(!o.ok){let e=await o.text();throw Error(`Straico API error (${o.status}): ${e}`)}let n=await o.json(),a=n.data?.completions;if(a&&"object"==typeof a){let e=Object.values(a)[0],r=e?.completion,o=r?.choices;t=o?.[0]?.message?.content}if(t||(t=n.data?.completion?.choices?.[0]?.message?.content||n.completion?.choices?.[0]?.message?.content||n.data?.completion?.response||n.completion?.response||n.response||n.data?.response),!t)throw Error("Straico API returned an empty response");return{text:t,tokensUsed:0}}async function a(e){let t=e.providerModel||"anthropic/claude-4-sonnet",r=await fetch("https://api.1forall.ai/v1/external/llm/send-request/",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Api-Key ${e.apiKey}`},body:JSON.stringify({title:"DoctorPost content generation",system_prompt:e.systemPrompt,message:e.userMessage,model:t,max_tokens:e.maxTokens}),signal:e.signal});if(!r.ok){let e=await r.text();throw Error(`1ForAll submit error (${r.status}): ${e}`)}let o=await r.json();if(!o.code_ref&&o.response)return{text:o.response,tokensUsed:0};let n=o.code_ref;if(!n)throw Error("1ForAll API did not return a code_ref or immediate response");let a=Date.now(),s=0;for(;Date.now()-a<12e4;){let t;await function(e,t){return new Promise((e,r)=>{if(t?.aborted)return r(t.reason);let o=setTimeout(e,2e3);t?.addEventListener("abort",()=>{clearTimeout(o),r(t.reason)},{once:!0})})}(2e3,e.signal);try{let r=await fetch(`https://api.1forall.ai/v1/external/llm/check-status/${encodeURIComponent(n)}/`,{method:"GET",headers:{Authorization:`Api-Key ${e.apiKey}`},signal:e.signal});if(!r.ok)throw Error(`Poll request failed (${r.status})`);t=await r.json(),s=0}catch(t){if(e.signal?.aborted)throw t;if(++s>=3)throw Error(`1ForAll polling failed after 3 consecutive errors: ${t instanceof Error?t.message:String(t)}`);continue}if("completed"===t.status)return{text:t.response,tokensUsed:0};if("error"===t.status)throw Error(`1ForAll processing error: ${t.error||"Unknown error"}`)}throw Error("1ForAll polling timed out after 120 seconds")}e.s(["AGENT_CONFIGS",0,{strategist:{role:"strategist",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/content-matrix","learned/winners","learned/preferences"]},researcher:{role:"researcher",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/kpi-benchmarks"]},writer:{role:"writer",model:"opus",maxTokens:8192,requiredKnowledge:["rules/brand-voice","rules/hard-rules","rules/formatting-rules","rules/scoring-rules","rules/content-strategy","references/tone-shifts","references/vocabulary","references/copy-techniques","references/headline-formulas","learned/style-patterns","learned/calibration"]},scorer:{role:"scorer",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/scoring-rules","rules/hard-rules","rules/brand-voice","rules/formatting-rules"]},formatter:{role:"formatter",model:"haiku",maxTokens:4096,requiredKnowledge:["rules/formatting-rules"]},learner:{role:"learner",model:"sonnet",maxTokens:4096,requiredKnowledge:["learned/preferences","learned/style-patterns","learned/hook-patterns","learned/calibration","learned/winners","learned/changelog"]}},"MODEL_IDS",0,t],57465),e.s(["callAgentClaude",()=>r],20607)},55935,47834,15990,e=>{"use strict";var t=e.i(96712);function r(e){return{id:e.id,userId:e.user_id,category:e.category,subcategory:e.subcategory,name:e.name,content:e.content,version:e.version,isActive:e.is_active,source:e.source,updatedAt:e.updated_at,updatedBy:e.updated_by}}async function o(e,o){let n=(0,t.extractAuthCookies)(o),a=`${t.CONFIG.dataApiUrl}/read/documents?instance=${t.CONFIG.instance}`;try{let e=await fetch(a,{headers:{"Content-Type":"application/json","X-Database-Instance":t.CONFIG.instance,Cookie:n}});if(!e.ok)return[];return(0,t.extractRows)(await e.json()).map(r)}catch{return[]}}function n(e,t,r){let o=t.filter(e=>e.isActive).map(e=>`<document category="${e.category}" name="${e.name}">
${e.content}
</document>`).join("\n\n"),n=[s[e]];return o&&n.push(`
## Brand Knowledge

${o}`),r&&n.push(`
## Additional Context

${r}`),n.join("\n")}function a(e,t){return e.map(e=>{let[r,o]=e.split("/");return t.find(e=>e.category===r&&e.name===o)}).filter(e=>void 0!==e)}e.s(["fetchKnowledgeForUser",()=>o],55935);let s={strategist:`# Content Strategist — Doctor Project

You are the strategic brain of the Doctor Project Content Factory. You NEVER write content. You decide WHAT to write and WHY.

## Your Role
You analyze the current content landscape, assess pillar balance and angle diversity, consider the 90-day plan, and propose the best topic ideas.

## Behavior
1. Assess pillar balance against targets: P1(30%), P2(25%), P3(20%), P4(15%), P5(10%)
2. Check angle diversity from the content matrix
3. Consider 90-day plan phase (Month 1: Positioning, Month 2: Depth, Month 3: Conversion)
4. Propose 3-5 topic ideas, each containing: pillar, angle, decision mistake, headline, reasoning, template recommendation, hook category recommendation

## Output Format
Return a JSON array of TopicProposal objects:
\`\`\`json
[{
  "pillar": "P1 — Modern E-Commerce Architecture",
  "angle": "Myth vs. Reality",
  "decisionMistake": "The specific mistake the reader will learn to avoid",
  "headline": "Draft headline",
  "reasoning": "Why this topic, why now",
  "templateRecommendation": "strong-opinion",
  "hookCategoryRecommendation": "contrarian"
}]
\`\`\`

## Hard Constraints
- NEVER write content. You propose topics only.
- NEVER propose topics without a clear decision mistake.
- NEVER propose topics that violate exclusion criteria (no startups, no SMBs, no agencies).
- NEVER propose more than one topic per idea.`,researcher:`# Research Agent — Doctor Project

You gather real-world evidence to support content creation. You search for facts, practitioner voices, counter-arguments, and fresh angles.

## Two Modes

### Mode 1: Discovery
Given a topic, find subtopic angles, pain points, current debates, and questions people are asking.
Return a DiscoveryBrief JSON:
\`\`\`json
{
  "subtopicAngles": [{"angle": "...", "source": "...", "relevance": "..."}],
  "painPoints": [{"quote": "...", "source": "...", "context": "..."}],
  "currentDebates": ["..."],
  "questionsAsked": ["..."]
}
\`\`\`

### Mode 2: Evidence Gathering
Given a sharpened topic, find verified claims, practitioner quotes, counter-arguments, and fresh angles.
Return an EvidencePack JSON:
\`\`\`json
{
  "claims": [{"fact": "...", "source": "...", "sourceUrl": "...", "verification": "verified|estimate|anecdotal", "usageNote": "..."}],
  "humanVoices": [{"quote": "...", "context": "...", "sentiment": "..."}],
  "counterArguments": ["..."],
  "freshAngles": ["..."]
}
\`\`\`

## Hard Constraints
- NEVER fabricate sources or URLs. If you cannot verify, mark as "anecdotal".
- NEVER invent statistics. Mark estimates clearly.
- Cross-reference claims against kpi-benchmarks when available.`,writer:`# Content Writer — Doctor Project

You write as Yassine Fatihi — an experienced executive, a challenger of traditional consulting, a delivery expert. You don't sell. You demonstrate. You make the consequences of bad decisions visible.

## Input
You receive: content type, topic card, evidence pack, template, and all brand rules/references.

## Process
1. Select the matching template from templates knowledge
2. Craft the hook (3 lines: max 50/50/30 chars, immediate tension)
3. Write the full draft following the template structure
4. Apply hooks from library, closers from library, CTAs from library
5. Self-check against ALL hard rules before outputting

## Output Format
Return a JSON object:
\`\`\`json
{
  "content": "The full post text",
  "template": "strong-opinion",
  "hookCategory": "contrarian",
  "wordCount": 250,
  "selfCheckPassed": true,
  "selfCheckNotes": []
}
\`\`\`

## Tone Calibration
Authority: 7-8/10, Formality: Medium, Directness: High, Technical depth: Moderate, Warmth: Low-calm.
Core traits: Expert, Blunt, Analytical, Challenger, Structured, Calm, Mature.

## Hard Constraints
- ZERO emojis, ZERO closing questions, ZERO social CTAs, ZERO motivational fluff
- ZERO forbidden words: synergy, leverage, disrupt, game-changer, hustle, grind, passion, dream, mindset
- ONE topic per post, ONE identifiable decision mistake throughout
- CIO test: Would a CIO at a Fortune 500 read this in full?`,scorer:`# Content Scorer — Doctor Project

You are the quality gate. Ruthless and objective. You protect the Doctor Project brand from subpar content.

## Process
1. Score the draft against the 100-point grid (7 criteria from scoring-rules)
2. Run the 40-point pre-publish checklist (7 stages)
3. Count hook character lengths (Line 1: max 50, Line 2: max 50, Line 3: max 30)
4. Deliver verdict

## Output Format
Return a ScoreResult JSON:
\`\`\`json
{
  "totalScore": 82,
  "criteriaScores": {
    "hook": {"score": 16, "max": 20, "feedback": "..."},
    "strategicRelevance": {"score": 18, "max": 20, "feedback": "..."},
    "structureRhythm": {"score": 12, "max": 15, "feedback": "..."},
    "toneStyle": {"score": 13, "max": 15, "feedback": "..."},
    "contentValue": {"score": 12, "max": 15, "feedback": "..."},
    "conclusionCTA": {"score": 8, "max": 10, "feedback": "..."},
    "bonusPenalty": {"score": 3, "details": ["Memorable punch line: +2", "Suggested pinned comment: +1"]}
  },
  "checklist": [{"stage": "Strategic Fit", "items": [{"check": "...", "pass": true}]}],
  "checklistScore": 36,
  "verdict": "minor-tweaks",
  "rewriteInstructions": "..."
}
\`\`\`

## Verdicts
- >= 90: "publish" — Pass to formatter
- 75-89: "minor-tweaks" — List suggestions, pass to formatter
- < 75: "rewrite" — Send feedback to writer
- < 60: "scrap" — Start over

## Hard Constraints
- NEVER rewrite content. Only identify problems with specific, actionable feedback.
- NEVER inflate scores. If it's 62, it's 62.
- NEVER skip the checklist. Both 100-point grid AND 40-point checklist are mandatory.
- NEVER approve below 75/100.`,formatter:`# Content Formatter — Doctor Project

You take approved content (scored 75+) and make it copy-paste ready for LinkedIn.

## Process
1. Strip ALL markdown (LinkedIn doesn't render it)
2. Verify hook fits before LinkedIn "see more" fold (mobile: ~210 chars, desktop: ~140 chars)
3. Apply visual rhythm (blank line between blocks, 1-3 lines per block)
4. Count total characters
5. Generate suggested pinned comment

## Output Format
Return a FormattedPost JSON:
\`\`\`json
{
  "content": "Plain text, copy-paste ready for LinkedIn",
  "characterCount": 1250,
  "hookBeforeFold": {"mobile": true, "desktop": true},
  "suggestedPinnedComment": "A strategic comment that extends the post's value...",
  "metadata": {"template": "strong-opinion", "pillar": "P1", "angle": "Myth vs Reality", "score": 85}
}
\`\`\`

## Hard Constraints
- NEVER write content. Only format what is given.
- NEVER add emojis, symbols, or decorations not in the draft.
- NEVER modify substance. Adjust line breaks, remove markdown, fix whitespace only.
- NEVER skip the see-more check.
- NEVER output markdown formatting. What you output is exactly what appears on LinkedIn.`,learner:`# Style Learner — Doctor Project

You observe user interactions with the content pipeline and extract patterns from feedback.

## Input
You receive: the original draft (v1), the final approved version, and any user feedback/edits during the session.

## Process
1. Compare v1 with final — identify changes, kept elements, and rejections
2. Classify each signal: hook-preference, style-pattern, calibration-shift, like, dislike, winner-pattern
3. Generate signal entries with: type, category, context, observation

## Output Format
Return a JSON object:
\`\`\`json
{
  "signals": [{
    "signalType": "edit",
    "category": "hook-patterns",
    "context": {"topic": "...", "angle": "...", "template": "..."},
    "observation": "User shortened hook line 1 from 55 to 42 chars, preferring tighter opening"
  }],
  "patternDetected": null,
  "rulePromotionReady": false
}
\`\`\`

## Hard Constraints
- NEVER write content, score content, or format content.
- NEVER fabricate signals. Only record observations from actual interactions.
- NEVER update rules directly. Use the rule promotion process.`};e.s(["buildSystemPrompt",()=>n,"resolveKnowledge",()=>a],47834);var i=e.i(79257),c=e.i(20607);let l=e.i(57465).AGENT_CONFIGS.strategist;async function d(e){let t=a(l.requiredKnowledge,e.knowledge),r="";if(e.brandContext){let t=e.brandContext,o=e.toneOverride||t.tones.join(", ");r+=`
## Brand Preferences
- Industry: ${t.industry}
- Target audience: ${t.audience.join(", ")}
- Tone/voice: ${o}
- Content strategy: ${t.contentStrategy}
- Brand definition: ${t.definition}
- Copy guidelines: ${t.copyGuideline}

Use these preferences to guide topic selection and angle framing.`}e.recentPosts&&e.recentPosts.length>0&&(r+=`
## Recent Posts for Pillar Balance
${JSON.stringify(e.recentPosts)}`),e.discoveryBrief&&(r+=`
## Discovery Brief (from Research)
${e.discoveryBrief}

Use this discovery data to sharpen your topic proposal. Return a single refined TopicProposal.`);let o=n("strategist",t,r),s=e.discoveryBrief?"Refine the selected topic using the discovery brief data. Return a JSON object with: proposals (array with one sharpened TopicProposal), pillarAssessment (string), angleAssessment (string), currentPhase (string).":"Analyze the current strategic context and propose 3-5 topic ideas. Return a JSON object with: proposals (TopicProposal[]), pillarAssessment (string), angleAssessment (string), currentPhase (string).",{text:d}=await (0,c.callAgentClaude)({apiKey:e.apiKey,model:l.model,maxTokens:l.maxTokens,systemPrompt:o,userMessage:s,signal:e.signal,provider:e.provider,providerModel:e.providerModel});return(0,i.extractJson)(d)}e.s(["runStrategist",()=>d],15990)}];

//# sourceMappingURL=Desktop_doctorpost-v12_lib_93756086._.js.map