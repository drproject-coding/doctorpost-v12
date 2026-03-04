import { NextResponse } from "next/server";

interface PostPreset {
  id: string;
  name: string;
  description: string;
  postType: string;
  hookPattern: string;
  contentPillar: string;
  tone: string;
}

const POST_PRESETS: PostPreset[] = [
  {
    id: "thought-leader",
    name: "Thought Leader",
    description:
      "Establish authority with expert industry commentary. Position yourself as the go-to voice on sector developments with evidence-backed insight.",
    postType: "industryInsights",
    hookPattern: "authority",
    contentPillar: "Industry Trends",
    tone: "professional-authority",
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description:
      "Turn personal experiences into relatable lessons. Draw readers in with a compelling scene, then land an unexpected insight.",
    postType: "personalStory",
    hookPattern: "curiosityGap",
    contentPillar: "Leadership",
    tone: "anecdote-to-aha",
  },
  {
    id: "educator",
    name: "Educator",
    description:
      "Break down complex ideas into practical, actionable steps. Teach your audience a repeatable framework they can apply immediately.",
    postType: "howTo",
    hookPattern: "educational",
    contentPillar: "Technology",
    tone: "approachable-expert",
  },
  {
    id: "provocateur",
    name: "Provocateur",
    description:
      "Challenge conventional wisdom with a bold, counterintuitive take. Spark meaningful debate and stand out in a crowded feed.",
    postType: "contrarian",
    hookPattern: "contrarian",
    contentPillar: "Industry Trends",
    tone: "snap-snark",
  },
  {
    id: "case-builder",
    name: "Case Builder",
    description:
      "Let results speak for themselves. Ground your argument in real outcomes and social proof to build trust and credibility.",
    postType: "caseStudy",
    hookPattern: "socialProof",
    contentPillar: "Case Studies",
    tone: "professional-authority",
  },
  {
    id: "trend-spotter",
    name: "Trend Spotter",
    description:
      "Be first to name the shift. Analyse emerging signals in your industry and paint a vivid picture of what comes next.",
    postType: "trendAnalysis",
    hookPattern: "curiosityGap",
    contentPillar: "Industry Trends",
    tone: "future-forward-glow",
  },
  {
    id: "myth-buster",
    name: "Myth Buster",
    description:
      "Expose the misconceptions holding your audience back. Debunk a widely held belief with clear evidence and a fresh perspective.",
    postType: "mythBusting",
    hookPattern: "contrarian",
    contentPillar: "Technology",
    tone: "bias-buster",
  },
];

export async function GET() {
  return NextResponse.json(POST_PRESETS, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
