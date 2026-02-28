import React, { useState } from 'react';
import {
  generatePostMockApi,
  mockPillars,
  mockPostTypes,
  mockHookPatterns,
  mockCtaIntents,
  defaultBrandProfile,
} from '../lib/api';
import {
  PostType,
  HookPattern,
  CtaIntent,
  PostGenerationResponse,
} from '../lib/types';

export default function CreatePostPage() {
  const [selectedPillar, setSelectedPillar] = useState(mockPillars[0].id);
  const [selectedPostType, setSelectedPostType] = useState<PostType>('Insight');
  const [selectedHookPattern, setSelectedHookPattern] = useState<HookPattern>('Curiosity Gap');
  const [selectedCtaIntent, setSelectedCtaIntent] = useState<CtaIntent>('Engagement');
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState<PostGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePost = async () => {
    setError(null);
    setLoading(true);
    setGeneratedPost(null);

    try {
      const response = await generatePostMockApi(
        defaultBrandProfile.id,
        selectedPillar,
        selectedPostType,
        selectedHookPattern,
        topic,
        defaultBrandProfile.tones[0],
        selectedCtaIntent
      );
      setGeneratedPost(response);
    } catch (err) {
      console.error('Failed to generate post:', err);
      setError('Failed to generate post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Generate New Post</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="pillar" className={labelClasses}>Content Pillar</label>
            <select id="pillar" className={inputClasses} value={selectedPillar} onChange={(e) => setSelectedPillar(e.target.value)}>
              {mockPillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="postType" className={labelClasses}>Post Type</label>
            <select id="postType" className={inputClasses} value={selectedPostType} onChange={(e) => setSelectedPostType(e.target.value as PostType)}>
              {mockPostTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hookPattern" className={labelClasses}>Hook Pattern</label>
            <select id="hookPattern" className={inputClasses} value={selectedHookPattern} onChange={(e) => setSelectedHookPattern(e.target.value as HookPattern)}>
              {mockHookPatterns.map((pattern) => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ctaIntent" className={labelClasses}>Call to Action Intent</label>
            <select id="ctaIntent" className={inputClasses} value={selectedCtaIntent} onChange={(e) => setSelectedCtaIntent(e.target.value as CtaIntent)}>
              {mockCtaIntents.map((intent) => (
                <option key={intent} value={intent}>{intent}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="topic" className={labelClasses}>Topic / Keywords</label>
          <input type="text" id="topic" className={inputClasses} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'AI in healthcare'"/>
        </div>

        <button onClick={handleGeneratePost} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Post'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-center">
            {error}
          </div>
        )}

        {generatedPost && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">Generated Posts</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Variant A</h3>
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{generatedPost.variantA}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Variant B</h3>
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{generatedPost.variantB}</p>
            </div>
            {generatedPost.hashtags.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Hashtags</h3>
                <p className="text-gray-800 dark:text-gray-200">{generatedPost.hashtags.join(' ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}