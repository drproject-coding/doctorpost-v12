"use client";

import React, { useState } from 'react';
import {
  generatePostMockApi,
  mockPillars,
  mockPostTypes,
  mockHookPatterns,
  mockCtaIntents,
  defaultBrandProfile,
} from '../../lib/api';
import {
  PostType,
  HookPattern,
  CtaIntent,
  PostGenerationResponse,
} from '../../lib/types';

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
        defaultBrandProfile.tones[0], // Using the first tone from default profile
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Generate New Post</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="pillar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content Pillar
            </label>
            <select
              id="pillar"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
            >
              {mockPillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="postType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Post Type
            </label>
            <select
              id="postType"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={selectedPostType}
              onChange={(e) => setSelectedPostType(e.target.value as PostType)}
            >
              {mockPostTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hookPattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hook Pattern
            </label>
            <select
              id="hookPattern"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={selectedHookPattern}
              onChange={(e) => setSelectedHookPattern(e.target.value as HookPattern)}
            >
              {mockHookPatterns.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {pattern}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ctaIntent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Call to Action Intent
            </label>
            <select
              id="ctaIntent"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={selectedCtaIntent}
              onChange={(e) => setSelectedCtaIntent(e.target.value as CtaIntent)}
            >
              {mockCtaIntents.map((intent) => (
                <option key={intent} value={intent}>
                  {intent}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Topic / Keywords
          </label>
          <input
            type="text"
            id="topic"
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'AI in healthcare', 'personal branding on LinkedIn'"
          />
        </div>

        <button
          onClick={handleGeneratePost}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Post'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-center">
            {error}
          </div>
        )}

        {generatedPost && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-center">Generated Posts</h2>

            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-medium mb-3">Variant A</h3>
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{generatedPost.variantA}</p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-medium mb-3">Variant B</h3>
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{generatedPost.variantB}</p>
            </div>

            {generatedPost.hashtags.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-medium mb-3">Hashtags</h3>
                <p className="text-gray-800 dark:text-gray-200">{generatedPost.hashtags.join(' ')}</p>
              </div>
            )}

            {generatedPost.warnings.length > 0 && (
              <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md">
                <h3 className="text-xl font-medium mb-3">Warnings</h3>
                <ul className="list-disc list-inside">
                  {generatedPost.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}