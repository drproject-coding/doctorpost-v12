import { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions } from './dropdownData.js';
import { getOpenAIRecommendations } from './openaiService.js'; // Import the new OpenAI recommendation function

export const getPostRecommendations = async (topic, subtopic) => {
  // Call OpenAI for recommendations
  try {
    const aiRecommendations = await getOpenAIRecommendations(
      subtopic,
      enhancedPostTypes,
      enhancedHookPatterns,
      enhancedContentPillars,
      enhancedToneOptions
    );

    // Ensure the recommended values exist in our static lists, fallback if not
    const finalPostType = enhancedPostTypes.some(opt => opt.value === aiRecommendations.postType) ? aiRecommendations.postType : 'industryInsights';
    const finalHookPattern = enhancedHookPatterns.some(opt => opt.value === aiRecommendations.hookPattern) ? aiRecommendations.hookPattern : 'curiosityGap';
    const finalContentPillar = enhancedContentPillars.some(opt => opt.value === aiRecommendations.contentPillar) ? aiRecommendations.contentPillar : 'Technology';
    const finalToneId = enhancedToneOptions.some(opt => opt.id === aiRecommendations.toneId) ? aiRecommendations.toneId : 'professional-authority';

    // For compatible options, we can still use a simple rule-based approach or refine with AI.
    // For now, let's make them all compatible except the recommended one, for simplicity.
    const compatiblePostTypes = enhancedPostTypes.filter(p => p.value !== finalPostType).map(p => p.value);
    const compatibleHookPatterns = enhancedHookPatterns.filter(h => h.value !== finalHookPattern).map(h => h.value);
    const compatibleContentPillars = enhancedContentPillars.filter(c => c.value !== finalContentPillar).map(c => c.value);
    const compatibleTones = enhancedToneOptions.filter(t => t.id !== finalToneId).map(t => t.id);

    return {
      postType: finalPostType,
      hookPattern: finalHookPattern,
      contentPillar: finalContentPillar,
      toneId: finalToneId,
      confidence: aiRecommendations.confidence || Math.floor(Math.random() * 15) + 80, // Use AI confidence or mock
      reasoning: aiRecommendations.reasoning,
      compatiblePostTypes,
      compatibleHookPatterns,
      compatibleContentPillars,
      compatibleTones,
    };

  } catch (error) {
    console.error('Error in getPostRecommendations (calling OpenAI):', error);
    // Fallback to a default or simple rule-based recommendation if AI call fails
    return {
      postType: "industryInsights",
      hookPattern: "curiosityGap",
      contentPillar: "Technology",
      toneId: "professional-authority",
      confidence: 50, // Lower confidence for fallback
      reasoning: {
        postType: "Fallback: Could not get AI recommendation for post type.",
        hookPattern: "Fallback: Could not get AI recommendation for hook pattern.",
        contentPillar: "Fallback: Could not get AI recommendation for content pillar.",
        tone: "Fallback: Could not get AI recommendation for tone."
      },
      compatiblePostTypes: enhancedPostTypes.map(p => p.value),
      compatibleHookPatterns: enhancedHookPatterns.map(h => h.value),
      compatibleContentPillars: enhancedContentPillars.map(c => c.value),
      compatibleTones: enhancedToneOptions.map(t => t.id),
    };
  }
};