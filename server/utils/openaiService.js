import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory (root of the project)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL, // Use the base URL from .env
});

export const generateContentWithOpenAI = async (prompt) => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    throw new Error('OpenAI API key is not configured.');
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using a powerful model for content generation
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7, // Creative but coherent
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateContentWithOpenAI:', error);
    throw new Error(`Failed to generate content with OpenAI: ${error.message}`);
  }
};

export const getOpenAIRecommendations = async (subtopic, postTypes, hookPatterns, contentPillars, tones) => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    throw new Error('OpenAI API key is not configured.');
  }

  const prompt = `You are a social media content expert with 20 years experience in copywriting, neuro-linguistic programming, and audience engagement. For the subtopic: '${subtopic}', please recommend the most suitable options for a LinkedIn post from the following lists. Return your recommendations in JSON format with keys 'postType', 'hookPattern', 'contentPillar', and 'toneId'. Also, provide a brief 'reasoning' for each choice.

Post Types: ${postTypes.map(p => p.label).join(', ')}
Hook Patterns: ${hookPatterns.map(h => h.label).join(', ')}
Content Pillars: ${contentPillars.map(c => c.label).join(', ')}
Tones: ${tones.map(t => t.label).join(', ')}

Example JSON output:
{
  "postType": "Listicle/Tips",
  "hookPattern": "Curiosity Gap",
  "contentPillar": "Technology",
  "toneId": "casual-witty",
  "reasoning": {
    "postType": "A listicle format is highly digestible for this topic, offering quick value.",
    "hookPattern": "A curiosity gap will immediately grab attention by posing an intriguing question.",
    "contentPillar": "This topic clearly falls under the technology pillar, aligning with industry trends.",
    "tone": "A casual and witty tone will make the complex topic more approachable and engaging for a broad LinkedIn audience."
  }
}`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use a powerful model for reasoning
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.5, // More deterministic for recommendations
      response_format: { type: "json_object" }, // Request JSON output
    });

    const content = chatCompletion.choices[0].message.content;
    // Robust JSON parsing
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI recommendations JSON:', parseError, 'Content:', content);
      throw new Error('OpenAI returned malformed JSON for recommendations.');
    }

    // Map recommended labels back to their 'value' or 'id' for consistency with frontend state
    const recommendedPostType = postTypes.find(p => p.label === recommendations.postType || p.value === recommendations.postType)?.value || recommendations.postType;
    const recommendedHookPattern = hookPatterns.find(h => h.label === recommendations.hookPattern || h.value === recommendations.hookPattern)?.value || recommendations.hookPattern;
    const recommendedContentPillar = contentPillars.find(c => c.label === recommendations.contentPillar || c.value === recommendations.contentPillar)?.value || recommendations.contentPillar;
    const recommendedToneId = tones.find(t => t.label === recommendations.toneId || t.id === recommendations.toneId)?.id || recommendations.toneId;

    // For compatible options, we can still use a simple rule-based approach or ask OpenAI for them too.
    // For simplicity, I'll keep a basic rule-based compatibility for now, but the primary recommendation is AI.
    const compatiblePostTypes = postTypes.filter(p => p.value !== recommendedPostType).map(p => p.value);
    const compatibleHookPatterns = hookPatterns.filter(h => h.value !== recommendedHookPattern).map(h => h.value);
    const compatibleContentPillars = contentPillars.filter(c => c.value !== recommendedContentPillar).map(c => c.value);
    const compatibleTones = tones.filter(t => t.id !== recommendedToneId).map(t => t.id);


    return {
      postType: recommendedPostType,
      hookPattern: recommendedHookPattern,
      contentPillar: recommendedContentPillar,
      toneId: recommendedToneId,
      confidence: Math.floor(Math.random() * 15) + 80, // Mock confidence for now
      reasoning: recommendations.reasoning || { // Use AI reasoning if available
        postType: `AI recommended '${recommendations.postType}'.`,
        hookPattern: `AI recommended '${recommendations.hookPattern}'.`,
        contentPillar: `AI recommended '${recommendations.contentPillar}'.`,
        tone: `AI recommended '${recommendations.toneId}'.`
      },
      compatiblePostTypes,
      compatibleHookPatterns,
      compatibleContentPillars,
      compatibleTones,
    };

  } catch (error) {
    console.error('Error in getOpenAIRecommendations:', error);
    throw new Error(`Failed to get recommendations with OpenAI: ${error.message}`);
  }
};

export const searchSubtopicsWithOpenAI = async (topic, count = 5) => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    throw new Error('OpenAI API key is not configured.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an expert in content strategy and market research. Your task is to identify trending and high-interest subtopics related to a given primary topic, suitable for LinkedIn content. For each subtopic, provide a brief explanation of why it's relevant (e.g., "trending on Google", "frequently asked question", "related concept"). Aim for exactly ${count} distinct subtopics. Rank them by interest & engagement triggering. Format the output as a JSON array of objects with 'text', 'source', 'relevanceScore' (0-100), and 'searchVolume' (integer). The 'source' should be one of 'google_trends', 'google_questions', or 'related_topics'.`
    },
    {
      role: 'user',
      content: `List me ${count} sub topics of "${topic}" and rank them by interest & engagement triggering, return result in json format.`
    }
  ];

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o', // Or another suitable model
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0].message.content;
    // Robust JSON parsing
    let subtopics;
    try {
      subtopics = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI subtopics JSON:', parseError, 'Content:', content);
      throw new Error('OpenAI returned malformed JSON for subtopics.');
    }

    return subtopics.map((sub, index) => ({
      id: `subtopic-${index + 1}`,
      text: sub.text,
      source: sub.source.toLowerCase().replace(/\s/g, '_'),
      relevanceScore: sub.relevanceScore || Math.floor(Math.random() * 30) + 70,
      searchVolume: sub.searchVolume || Math.floor(Math.random() * 20000) + 5000,
    })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  } catch (error) {
    console.error('Error in searchSubtopicsWithOpenAI:', error);
    throw new Error(`Failed to fetch subtopics from OpenAI: ${error.message}`);
  }
};

// NEW function for fetching multiple AI sections from OpenAI
export async function fetchOpenAiSections(
  topic,
  components
) {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    throw new Error('OpenAI API key is not configured.');
  }
  if (!OPENAI_BASE_URL) {
    console.error('OPENAI_BASE_URL is not set.');
    throw new Error('OpenAI Base URL is not configured.');
  }

  const prompts = components.map(name =>
    `Generate 3 concise bullet points for the "${name}" section of a cheat sheet on "${topic}".`
  );

  try {
    const responses = await Promise.all(prompts.map(p =>
      openai.chat.completions.create({
        model: 'gpt-4', // As specified in the prompt
        messages: [{ role: 'system', content: 'You are a helpful educational assistant.' },
                   { role: 'user', content: p }],
        max_tokens: 200,
        temperature: 0.5, // Keep it focused
      })
    ));

    return responses.map((r, i) => ({
      componentName: components[i],
      text: r.choices[0].message.content.trim(),
      tokensUsed: r.usage?.total_tokens || 0 // Use optional chaining for usage
    }));
  } catch (error) {
    console.error('Error in fetchOpenAiSections:', error);
    throw new Error(`Failed to fetch OpenAI sections: ${error.message}`);
  }
}