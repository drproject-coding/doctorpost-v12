import express from 'express';
import { fetchOpenAiSections } from '../utils/openaiService.js';
import { fetchPerplexitySection } from '../utils/perplexityService.js';

const router = express.Router();

// POST /api/ai/openai - Multi-section content generation via OpenAI
router.post('/openai', async (req, res) => {
  const { topic, components } = req.body;

  if (!topic || !components || !Array.isArray(components)) {
    return res.status(400).json({ message: 'Topic and components array are required.' });
  }

  try {
    const sections = await fetchOpenAiSections(topic, components);
    res.json({ sections });
  } catch (error) {
    console.error('AI Route (OpenAI sections) error:', error);
    res.status(500).json({ message: 'Failed to generate OpenAI sections.', error: error.message });
  }
});

// GET /api/ai/perplexity - Single-section detail lookup via Perplexity
router.get('/perplexity', async (req, res) => {
  const { topic, componentName } = req.query;

  if (!topic || !componentName) {
    return res.status(400).json({ message: 'Topic and componentName query parameters are required.' });
  }

  try {
    const section = await fetchPerplexitySection(topic, componentName);
    res.json(section);
  } catch (error) {
    console.error('AI Route (Perplexity section) error:', error);
    res.status(500).json({ message: 'Failed to fetch Perplexity section.', error: error.message });
  }
});

export default router;
