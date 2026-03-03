module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},96712,e=>{"use strict";var t=e.i(85455);function r(e){if(Array.isArray(e))return e;if(e&&"object"==typeof e){if(Array.isArray(e.data))return e.data;if(Array.isArray(e.rows))return e.rows}return[]}let a={instance:process.env.NCB_INSTANCE,dataApiUrl:process.env.NCB_DATA_API_URL,authApiUrl:process.env.NCB_AUTH_API_URL,appUrl:process.env.NCB_APP_URL||"https://app.nocodebackend.com"};function n(e){if(!e)return"";let t=e.split(";"),r=[];for(let e of t){let t=e.trim();(t.startsWith("better-auth.session_token=")||t.startsWith("better-auth.session_data="))&&r.push(t)}return r.join("; ")}async function s(e){let t=n(e);if(!t)return null;let r=`${a.authApiUrl}/get-session?instance=${a.instance}`,s=await fetch(r,{method:"GET",headers:{"Content-Type":"application/json","X-Database-Instance":a.instance,Cookie:t}});return s.ok&&(await s.json()).user||null}async function o(e){let t=n(e),s=`${a.dataApiUrl}/read/profiles?instance=${a.instance}`,o=await fetch(s,{headers:{"Content-Type":"application/json","X-Database-Instance":a.instance,Cookie:t}});return o.ok&&r(await o.json())[0]||null}async function i(e,r,s){try{let o=new URLSearchParams;o.set("instance",a.instance),e.nextUrl.searchParams.forEach((e,t)=>{"instance"!==t&&o.append(t,e)});let i=`${a.dataApiUrl}/${r}?${o.toString()}`,l=e.headers.get("origin")||e.nextUrl.origin,c=e.headers.get("cookie")||"",d=n(c),p=await fetch(i,{method:e.method,headers:{"Content-Type":"application/json","X-Database-Instance":a.instance,Cookie:d,Origin:l},body:s||void 0}),u=await p.text();return new t.NextResponse(u,{status:p.status,headers:{"Content-Type":"application/json"}})}catch(a){return console.error(`[proxyToNCB] ${e.method} ${r} failed:`,a),new t.NextResponse(JSON.stringify({error:"Backend service unavailable"}),{status:502,headers:{"Content-Type":"application/json"}})}}e.s(["CONFIG",0,a,"extractAuthCookies",()=>n,"extractRows",()=>r,"fetchUserProfile",()=>o,"getSessionUser",()=>s,"proxyToNCB",()=>i])},79257,e=>{"use strict";function t(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let r=e.search(/[[{]/);if(-1!==r){let t=e.slice(r),a=t[0],n="["===a?"]":"}",s=0,o=!1,i=!1;for(let e=0;e<t.length;e++){let r=t[e];if(i){i=!1;continue}if("\\"===r){i=!0;continue}if('"'===r){o=!o;continue}if(!o&&(r===a&&s++,r===n&&s--,0===s))try{return JSON.parse(t.slice(0,e+1))}catch{break}}}throw Error(`Failed to extract JSON from agent response. Raw output starts with: "${e.slice(0,100)}..."`)}function r(e,t){let r=t.filter(t=>!(t in e)||void 0===e[t]);if(r.length>0)throw Error(`Agent response missing required fields: ${r.join(", ")}`)}e.s(["extractJson",()=>t,"validateFields",()=>r])},20607,57465,e=>{"use strict";let t={opus:"claude-opus-4-5-20251101",sonnet:"claude-sonnet-4-5-20250929",haiku:"claude-haiku-4-5-20251001"};async function r(e){let r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:t[e.model],max_tokens:e.maxTokens,system:e.systemPrompt,messages:[{role:"user",content:e.userMessage}]}),signal:e.signal});if(!r.ok){let e=await r.text();throw Error(`Claude API error (${r.status}): ${e}`)}let a=await r.json(),n=a.content?.[0]?.text;if(!n)throw Error("Claude API returned an empty response");return{text:n,tokensUsed:(a.usage?.input_tokens??0)+(a.usage?.output_tokens??0)}}e.s(["AGENT_CONFIGS",0,{strategist:{role:"strategist",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/content-matrix","learned/winners","learned/preferences"]},researcher:{role:"researcher",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/content-strategy","references/kpi-benchmarks"]},writer:{role:"writer",model:"opus",maxTokens:8192,requiredKnowledge:["rules/brand-voice","rules/hard-rules","rules/formatting-rules","rules/scoring-rules","rules/content-strategy","references/tone-shifts","references/vocabulary","references/copy-techniques","references/headline-formulas","learned/style-patterns","learned/calibration"]},scorer:{role:"scorer",model:"sonnet",maxTokens:4096,requiredKnowledge:["rules/scoring-rules","rules/hard-rules","rules/brand-voice","rules/formatting-rules"]},formatter:{role:"formatter",model:"haiku",maxTokens:4096,requiredKnowledge:["rules/formatting-rules"]},learner:{role:"learner",model:"sonnet",maxTokens:4096,requiredKnowledge:["learned/preferences","learned/style-patterns","learned/hook-patterns","learned/calibration","learned/winners","learned/changelog"]}},"MODEL_IDS",0,t],57465),e.s(["callAgentClaude",()=>r],20607)},55935,47834,15990,e=>{"use strict";var t=e.i(96712);function r(e){return{id:e.id,userId:e.user_id,category:e.category,subcategory:e.subcategory,name:e.name,content:e.content,version:e.version,isActive:e.is_active,source:e.source,updatedAt:e.updated_at,updatedBy:e.updated_by}}async function a(e,a){let n=(0,t.extractAuthCookies)(a),s=`${t.CONFIG.dataApiUrl}/read/documents?instance=${t.CONFIG.instance}`;try{let e=await fetch(s,{headers:{"Content-Type":"application/json","X-Database-Instance":t.CONFIG.instance,Cookie:n}});if(!e.ok)return[];return(0,t.extractRows)(await e.json()).map(r)}catch{return[]}}function n(e,t,r){let a=t.filter(e=>e.isActive).map(e=>`<document category="${e.category}" name="${e.name}">
${e.content}
</document>`).join("\n\n"),n=[o[e]];return a&&n.push(`
## Brand Knowledge

${a}`),r&&n.push(`
## Additional Context

${r}`),n.join("\n")}function s(e,t){return e.map(e=>{let[r,a]=e.split("/");return t.find(e=>e.category===r&&e.name===a)}).filter(e=>void 0!==e)}e.s(["fetchKnowledgeForUser",()=>a],55935);let o={strategist:`# Content Strategist — Doctor Project

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
- NEVER update rules directly. Use the rule promotion process.`};e.s(["buildSystemPrompt",()=>n,"resolveKnowledge",()=>s],47834);var i=e.i(79257),l=e.i(20607);let c=e.i(57465).AGENT_CONFIGS.strategist;async function d(e){let t=s(c.requiredKnowledge,e.knowledge),r="";e.recentPosts&&e.recentPosts.length>0&&(r+=`
## Recent Posts for Pillar Balance
${JSON.stringify(e.recentPosts)}`),e.discoveryBrief&&(r+=`
## Discovery Brief (from Research)
${e.discoveryBrief}

Use this discovery data to sharpen your topic proposal. Return a single refined TopicProposal.`);let a=n("strategist",t,r),o=e.discoveryBrief?"Refine the selected topic using the discovery brief data. Return a JSON object with: proposals (array with one sharpened TopicProposal), pillarAssessment (string), angleAssessment (string), currentPhase (string).":"Analyze the current strategic context and propose 3-5 topic ideas. Return a JSON object with: proposals (TopicProposal[]), pillarAssessment (string), angleAssessment (string), currentPhase (string).",{text:d}=await (0,l.callAgentClaude)({apiKey:e.apiKey,model:c.model,maxTokens:c.maxTokens,systemPrompt:a,userMessage:o,signal:e.signal});return(0,i.extractJson)(d)}e.s(["runStrategist",()=>d],15990)},95410,e=>{"use strict";var t=e.i(96853),r=e.i(44480),a=e.i(81344),n=e.i(99336),s=e.i(51205),o=e.i(12877),i=e.i(92205),l=e.i(21099),c=e.i(84699),d=e.i(20176),p=e.i(84682),u=e.i(4865),h=e.i(61798),g=e.i(32211),m=e.i(81933),f=e.i(93695);e.i(84058);var y=e.i(23906),k=e.i(96712),w=e.i(55935),v=e.i(15990);async function C(e){let t=e.durationWeeks*e.postsPerWeek,r={},a={};for(let[n,s]of Object.entries(e.pillarWeights))r[n]=Math.round(s/100*t),a[n]=0;let n=[],s=new Date(e.startDate);for(let t=0;t<e.durationWeeks;t++){let o=[...(await (0,v.runStrategist)({apiKey:e.apiKey,knowledge:e.knowledge,recentPosts:[...e.recentPosts||[],...n.map(e=>({pillar:e.topicCard.pillar,date:e.slotDate}))],signal:e.signal})).proposals];for(let i=0;i<e.postsPerWeek;i++){let e=new Date(s);e.setDate(s.getDate()+7*t+2*i);let l=function(e,t,r){if(0===e.length)return;let a=e.map(e=>({topic:e,deficit:(r[e.pillar]||0)-(t[e.pillar]||0)}));return a.sort((e,t)=>t.deficit-e.deficit),a[0].topic}(o,a,r);if(l){a[l.pillar]=(a[l.pillar]||0)+1;let r=o.indexOf(l);-1!==r&&o.splice(r,1),n.push({weekNumber:t+1,slotOrder:i+1,slotDate:e.toISOString().split("T")[0],topicCard:l})}}}return{campaignId:e.campaignId,slots:n,pillarDistribution:a}}async function x(e,t,r){let a=`${k.CONFIG.dataApiUrl}/create/campaigns?instance=${k.CONFIG.instance}`,n=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json","X-Database-Instance":k.CONFIG.instance,Cookie:r},body:JSON.stringify({user_id:t,name:e.name,duration_weeks:e.durationWeeks,posts_per_week:e.postsPerWeek,goals:e.goals,pillar_weights:JSON.stringify(e.pillarWeights),status:"planning"})});if(!n.ok)throw Error(`Failed to create campaign: ${n.statusText}`);return(await n.json()).id}async function b(e,t,r){let a=`${k.CONFIG.dataApiUrl}/create/campaign_posts?instance=${k.CONFIG.instance}`,n=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json","X-Database-Instance":k.CONFIG.instance,Cookie:r},body:JSON.stringify({campaign_id:e,post_id:"",slot_date:t.slotDate,slot_order:t.slotOrder,topic_card:JSON.stringify(t.topicCard),generation_status:"pending"})});if(!n.ok)throw Error(`Failed to save campaign post: ${n.statusText}`)}async function R(e){let t,r=e.headers.get("cookie")||"",a=await (0,k.getSessionUser)(r);if(!a)return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});try{t=await e.json()}catch{return new Response(JSON.stringify({error:"Invalid JSON body"}),{status:400,headers:{"Content-Type":"application/json"}})}if(!t.name||!t.durationWeeks||!t.postsPerWeek||!t.keys?.claude)return new Response(JSON.stringify({error:"Missing required fields"}),{status:400,headers:{"Content-Type":"application/json"}});let n=t.keys.claude;if("__server_resolved__"===n){let e=await (0,k.fetchUserProfile)(r);if(!(n=e?.claude_api_key||""))return new Response(JSON.stringify({error:"No Claude API key configured. Please add your key in Settings."}),{status:400,headers:{"Content-Type":"application/json"}})}let s=await (0,w.fetchKnowledgeForUser)(a.id,r),o=new TextEncoder,i=new ReadableStream({async start(i){let l=(e,t)=>{i.enqueue(o.encode(`event: ${e}
data: ${JSON.stringify(t)}

`))};try{l("status",{phase:"creating",message:"Creating campaign..."});let o=await x(t,a.id,r);l("status",{phase:"planning",campaignId:o});let i=await C({apiKey:n,knowledge:s,campaignId:o,durationWeeks:t.durationWeeks,postsPerWeek:t.postsPerWeek,goals:t.goals,pillarWeights:t.pillarWeights,startDate:t.startDate,signal:e.signal});for(let e of(l("status",{phase:"saving",slotsCount:i.slots.length}),i.slots))await b(o,e,r),l("slot",e);l("complete",{campaignId:o,totalSlots:i.slots.length,pillarDistribution:i.pillarDistribution})}catch(e){l("error",{message:String(e)})}finally{i.close()}}});return new Response(i,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}e.s(["POST",()=>R],40257);var E=e.i(40257);let N=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/campaign/route",pathname:"/api/campaign",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/Desktop/doctorpost-v12/app/api/campaign/route.ts",nextConfigOutput:"",userland:E}),{workAsyncStorage:P,workUnitAsyncStorage:A,serverHooks:O}=N;function S(){return(0,a.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:A})}async function T(e,t,a){N.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let k="/api/campaign/route";k=k.replace(/\/index$/,"")||"/";let w=await N.prepare(e,t,{srcPage:k,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:v,params:C,nextConfig:x,parsedUrl:b,isDraftMode:R,prerenderManifest:E,routerServerContext:P,isOnDemandRevalidate:A,revalidateOnlyGenerated:O,resolvedPathname:S,clientReferenceManifest:T,serverActionsManifest:j}=w,_=(0,i.normalizeAppPath)(k),I=!!(E.dynamicRoutes[_]||E.routes[S]),D=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,b,!1):t.end("This page could not be found"),null);if(I&&!R){let e=!!E.routes[S],t=E.dynamicRoutes[_];if(t&&!1===t.fallback&&!e){if(x.experimental.adapterPath)return await D();throw new f.NoFallbackError}}let U=null;!I||N.isDev||R||(U="/index"===(U=S)?"/":U);let q=!0===N.isDev||!I,F=I&&!q;j&&T&&(0,o.setManifestsSingleton)({page:k,clientReferenceManifest:T,serverActionsManifest:j});let $=e.method||"GET",M=(0,s.getTracer)(),J=M.getActiveScopeSpan(),W={params:C,prerenderManifest:E,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:q,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:x.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>N.onRequestError(e,t,a,n,P)},sharedContext:{buildId:v}},H=new l.NodeNextRequest(e),L=new l.NodeNextResponse(t),V=c.NextRequestAdapter.fromNodeNextRequest(H,(0,c.signalFromNodeResponse)(t));try{let o=async e=>N.handle(V,W).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${$} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${$} ${k}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let c=async({previousCacheEntry:r})=>{try{if(!i&&A&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=W.renderOpts.fetchMetrics;let l=W.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=W.renderOpts.collectedTags;if(!I)return await (0,u.sendResponse)(H,L,s,W.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(s.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==W.renderOpts.collectedRevalidate&&!(W.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&W.renderOpts.collectedRevalidate,a=void 0===W.renderOpts.collectedExpire||W.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:W.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:k,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:A})},!1,P),t}},d=await N.handleResponse({req:e,nextConfig:x,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:E,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:O,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:i});if(!I)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",A?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),R&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&I||f.delete(m.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,u.sendResponse)(H,L,new Response(d.value.body,{headers:f,status:d.value.status||200})),null};J?await l(J):await M.withPropagatedContext(e.headers,()=>M.trace(d.BaseServerSpan.handleRequest,{spanName:`${$} ${k}`,kind:s.SpanKind.SERVER,attributes:{"http.method":$,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:A})},!1,P),I)throw t;return await (0,u.sendResponse)(H,L,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>S,"routeModule",()=>N,"serverHooks",()=>O,"workAsyncStorage",()=>P,"workUnitAsyncStorage",()=>A],95410)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__08b5ca2e._.js.map