import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory (root of the project)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai/v1';

// Existing function for subtopic search
export const searchSubtopicsWithPerplexity = async (topic, count = 5) => {
  if (!PERPLEXITY_API_KEY) {
    console.error('PERPLEXITY_API_KEY is not set.');
    throw new Error('Perplexity API key is not configured.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an expert in content strategy and market research. Your task is to identify trending and high-interest subtopics related to a given primary topic, suitable for LinkedIn content. For each subtopic, provide a brief explanation of why it's relevant (e.g., "trending on Google", "frequently asked question", "related concept"). Aim for exactly ${count} distinct subtopics. Rank them by interest & engagement triggering. Format the output as a JSON array of objects with 'text', 'source', and 'relevanceScore' (0-100).`
    },
    {
      role: 'user',
      content: `List me ${count} sub topics of "${topic}" and rank them by interest & engagement triggering, return result in json format.`
    }
  ];

  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, { // Use chat/completions for subtopics
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-small-32k-online',
        messages: messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API error (subtopics):', response.status, errorData);
      throw new Error(`Perplexity API error (subtopics): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let parsedContent = content;
    if (content.startsWith('```json') && content.endsWith('```')) {
      parsedContent = content.substring(7, content.length - 3).trim();
    }

    const subtopics = JSON.parse(parsedContent);
    return subtopics.map((sub, index) => ({
      id: `subtopic-${index + 1}`,
      text: sub.text,
      source: sub.source.toLowerCase().replace(/\s/g, '_'),
      relevanceScore: sub.relevanceScore || Math.floor(Math.random() * 30) + 70,
      searchVolume: sub.searchVolume || Math.floor(Math.random() * 20000) + 5000,
    })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  } catch (error) {
    console.error('Error in searchSubtopicsWithPerplexity:', error);
    throw new Error(`Failed to fetch subtopics from Perplexity: ${error.message}`);
  }
};

// NEW function for fetching a specific AI section from Perplexity
export async function fetchPerplexitySection(
  topic,
  componentName
) {
  if (!PERPLEXITY_API_KEY) {
    console.error('PERPLEXITY_API_KEY is not set.');
    throw new Error('Perplexity API key is not configured.');
  }
  if (!PERPLEXITY_BASE_URL) {
    console.error('PERPLEXITY_BASE_URL is not set.');
    throw new Error('Perplexity Base URL is not configured.');
  }

  const url = `${PERPLEXITY_BASE_URL}/chat/completions`; // Use chat/completions endpoint
  const query = `Generate a concise section for a cheat sheet on "${topic}" focusing on the "${componentName}" aspect. Provide key definitions, facts, or bullet points relevant to this component.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-small-32k-online', // Use an online model for search capabilities
        messages: [{ role: 'user', content: query }],
        max_tokens: 300,
        temperature: 0.2, // Keep it factual
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Perplexity API error (fetchPerplexitySection):', res.status, errorData);
      throw new Error(`Perplexity API error: ${errorData.error?.message || res.statusText}`);
    }
    const data = await res.json();
    const content = data.choices[0].message.content;

    // Perplexity might return markdown code block, try to parse it
    let parsedContent = content;
    if (content.startsWith('```json') && content.endsWith('```')) {
      parsedContent = content.substring(7, content.length - 3).trim();
    } else if (content.startsWith('```') && content.endsWith('```')) {
      // Handle generic code blocks
      parsedContent = content.substring(3, content.length - 3).trim();
    }

    // Attempt to extract a source if available, or mock one
    const sourceMatch = content.match(/\[\[(?:citation|source):\d+\]\]\((https?:\/\/[^\s]+)\)/);
    const sourceUrl = sourceMatch ? sourceMatch[1] : `https://perplexity.ai/search?q=${encodeURIComponent(query)}`;

    return {
      componentName,
      text: parsedContent,
      source: sourceUrl
    };
  } catch (error) {
    console.error('Error in fetchPerplexitySection:', error);
    throw new Error(`Failed to fetch Perplexity section: ${error.message}`);
  }
}