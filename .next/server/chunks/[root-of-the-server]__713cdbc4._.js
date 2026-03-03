module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},96712,e=>{"use strict";var t=e.i(85455);function r(e){if(Array.isArray(e))return e;if(e&&"object"==typeof e){if(Array.isArray(e.data))return e.data;if(Array.isArray(e.rows))return e.rows}return[]}let n={instance:process.env.NCB_INSTANCE,dataApiUrl:process.env.NCB_DATA_API_URL,authApiUrl:process.env.NCB_AUTH_API_URL,appUrl:process.env.NCB_APP_URL||"https://app.nocodebackend.com"};function o(e){if(!e)return"";let t=e.split(";"),r=[];for(let e of t){let t=e.trim();(t.startsWith("better-auth.session_token=")||t.startsWith("better-auth.session_data="))&&r.push(t)}return r.join("; ")}async function a(e){let t=o(e);if(!t)return null;let r=`${n.authApiUrl}/get-session?instance=${n.instance}`,a=await fetch(r,{method:"GET",headers:{"Content-Type":"application/json","X-Database-Instance":n.instance,Cookie:t}});return a.ok&&(await a.json()).user||null}async function s(e){let t=o(e),a=`${n.dataApiUrl}/read/profiles?instance=${n.instance}`,s=await fetch(a,{headers:{"Content-Type":"application/json","X-Database-Instance":n.instance,Cookie:t}});return s.ok&&r(await s.json())[0]||null}async function i(e,r,a){try{let s=new URLSearchParams;s.set("instance",n.instance),e.nextUrl.searchParams.forEach((e,t)=>{"instance"!==t&&s.append(t,e)});let i=`${n.dataApiUrl}/${r}?${s.toString()}`,c=e.headers.get("origin")||e.nextUrl.origin,l=e.headers.get("cookie")||"",d=o(l),u=await fetch(i,{method:e.method,headers:{"Content-Type":"application/json","X-Database-Instance":n.instance,Cookie:d,Origin:c},body:a||void 0}),p=await u.text();return new t.NextResponse(p,{status:u.status,headers:{"Content-Type":"application/json"}})}catch(n){return console.error(`[proxyToNCB] ${e.method} ${r} failed:`,n),new t.NextResponse(JSON.stringify({error:"Backend service unavailable"}),{status:502,headers:{"Content-Type":"application/json"}})}}e.s(["CONFIG",0,n,"extractAuthCookies",()=>o,"extractRows",()=>r,"fetchUserProfile",()=>s,"getSessionUser",()=>a,"proxyToNCB",()=>i])},79257,e=>{"use strict";function t(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let r=e.search(/[[{]/);if(-1!==r){let t=e.slice(r),n=t[0],o="["===n?"]":"}",a=0,s=!1,i=!1;for(let e=0;e<t.length;e++){let r=t[e];if(i){i=!1;continue}if("\\"===r){i=!0;continue}if('"'===r){s=!s;continue}if(!s&&(r===n&&a++,r===o&&a--,0===a))try{return JSON.parse(t.slice(0,e+1))}catch{break}}}throw Error(`Failed to extract JSON from agent response. Raw output starts with: "${e.slice(0,100)}..."`)}function r(e,t){let r=t.filter(t=>!(t in e)||void 0===e[t]);if(r.length>0)throw Error(`Agent response missing required fields: ${r.join(", ")}`)}e.s(["extractJson",()=>t,"validateFields",()=>r])},20607,57465,e=>{"use strict";let t={opus:"claude-opus-4-5-20251101",sonnet:"claude-sonnet-4-5-20250929",haiku:"claude-haiku-4-5-20251001"};async function r(e){let r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:t[e.model],max_tokens:e.maxTokens,system:e.systemPrompt,messages:[{role:"user",content:e.userMessage}]}),signal:e.signal});if(!r.ok){let e=await r.text();throw Error(`Claude API error (${r.status}): ${e}`)}let n=await r.json(),o=n.content?.[0]?.text;if(!o)throw Error("Claude API returned an empty response");return{text:o,tokensUsed:(n.usage?.input_tokens??0)+(n.usage?.output_tokens??0)}}e.s(["AGENT_CONFIGS",0,{strategist:{role:"strategist",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/content-matrix","learned/winners","learned/preferences"]},researcher:{role:"researcher",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/kpi-benchmarks"]},writer:{role:"writer",model:"opus",maxTokens:8192,requiredKnowledge:["rules/brand-voice","rules/hard-rules","rules/formatting-rules","rules/scoring-rules","rules/content-strategy","references/tone-shifts","references/vocabulary","references/copy-techniques","references/headline-formulas","learned/style-patterns","learned/calibration"]},scorer:{role:"scorer",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/scoring-rules","rules/hard-rules","rules/brand-voice","rules/formatting-rules"]},formatter:{role:"formatter",model:"haiku",maxTokens:4096,requiredKnowledge:["rules/formatting-rules"]},learner:{role:"learner",model:"sonnet",maxTokens:4096,requiredKnowledge:["learned/preferences","learned/style-patterns","learned/hook-patterns","learned/calibration","learned/winners","learned/changelog"]}},"MODEL_IDS",0,t],57465),e.s(["callAgentClaude",()=>r],20607)},55935,47834,15990,e=>{"use strict";var t=e.i(96712);function r(e){return{id:e.id,userId:e.user_id,category:e.category,subcategory:e.subcategory,name:e.name,content:e.content,version:e.version,isActive:e.is_active,source:e.source,updatedAt:e.updated_at,updatedBy:e.updated_by}}async function n(e,n){let o=(0,t.extractAuthCookies)(n),a=`${t.CONFIG.dataApiUrl}/read/documents?instance=${t.CONFIG.instance}`;try{let e=await fetch(a,{headers:{"Content-Type":"application/json","X-Database-Instance":t.CONFIG.instance,Cookie:o}});if(!e.ok)return[];return(0,t.extractRows)(await e.json()).map(r)}catch{return[]}}function o(e,t,r){let n=t.filter(e=>e.isActive).map(e=>`<document category="${e.category}" name="${e.name}">
${e.content}
</document>`).join("\n\n"),o=[s[e]];return n&&o.push(`
## Brand Knowledge

${n}`),r&&o.push(`
## Additional Context

${r}`),o.join("\n")}function a(e,t){return e.map(e=>{let[r,n]=e.split("/");return t.find(e=>e.category===r&&e.name===n)}).filter(e=>void 0!==e)}e.s(["fetchKnowledgeForUser",()=>n],55935);let s={strategist:`# Content Strategist — Doctor Project

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
- NEVER update rules directly. Use the rule promotion process.`};e.s(["buildSystemPrompt",()=>o,"resolveKnowledge",()=>a],47834);var i=e.i(79257),c=e.i(20607);let l=e.i(57465).AGENT_CONFIGS.strategist;async function d(e){let t=a(l.requiredKnowledge,e.knowledge),r="";e.recentPosts&&e.recentPosts.length>0&&(r+=`
## Recent Posts for Pillar Balance
${JSON.stringify(e.recentPosts)}`),e.discoveryBrief&&(r+=`
## Discovery Brief (from Research)
${e.discoveryBrief}

Use this discovery data to sharpen your topic proposal. Return a single refined TopicProposal.`);let n=o("strategist",t,r),s=e.discoveryBrief?"Refine the selected topic using the discovery brief data. Return a JSON object with: proposals (array with one sharpened TopicProposal), pillarAssessment (string), angleAssessment (string), currentPhase (string).":"Analyze the current strategic context and propose 3-5 topic ideas. Return a JSON object with: proposals (TopicProposal[]), pillarAssessment (string), angleAssessment (string), currentPhase (string).",{text:d}=await (0,c.callAgentClaude)({apiKey:e.apiKey,model:l.model,maxTokens:l.maxTokens,systemPrompt:n,userMessage:s,signal:e.signal});return(0,i.extractJson)(d)}e.s(["runStrategist",()=>d],15990)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__713cdbc4._.js.map