import React, { useState } from 'react';
import {
  generatePostMockApi,
  mockPillars,
  mockPostTypes,
  mockHookPatterns,
  mockCtaIntents,
  mockBrandProfile, // Using mockBrandProfile directly
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
        mockBrandProfile.id,
        selectedPillar,
        selectedPostType,
        selectedHookPattern,
        topic,
        mockBrandProfile.tones[0], // Using the first tone from mock profile
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
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Create New Post</h1>
        <div className="neo-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="pillar" className="block text-sm font-medium text-neo-foreground/70">Content Pillar</label>
              <select
                id="pillar"
                className="neo-input mt-1"
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
              <label htmlFor="postType" className="block text-sm font-medium text-neo-foreground/70">Post Type</label>
              <select
                id="postType"
                className="neo-input mt-1"
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
              <label htmlFor="hookPattern" className="block text-sm font-medium text-neo-foreground/70">Hook Pattern</label>
              <select
                id="hookPattern"
                className="neo-input mt-1"
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
              <label htmlFor="ctaIntent" className="block text-sm font-medium text-neo-foreground/70">Call to Action Intent</label>
              <select
                id="ctaIntent"
                className="neo-input mt-1"
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

          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-neo-foreground/70">Topic / Keywords</label>
            <input
              type="text"
              id="topic"
              className="neo-input mt-1"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'AI in healthcare', 'personal branding on LinkedIn'"
            />
          </div>

          <button
            onClick={handleGeneratePost}
            className="neo-button w-full"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Post'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-100 text-red-800">
              {error}
            </div>
          )}

          {generatedPost && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-bold text-neo-foreground">Generated Posts</h2>

              <div className="neo-card">
                <h3 className="text-lg font-semibold text-neo-foreground mb-2">Variant A</h3>
                <p className="whitespace-pre-wrap text-neo-foreground/80">{generatedPost.variantA}</p>
              </div>

              <div className="neo-card">
                <h3 className="text-lg font-semibold text-neo-foreground mb-2">Variant B</h3>
                <p className="whitespace-pre-wrap text-neo-foreground/80">{generatedPost.variantB}</p>
              </div>

              {generatedPost.hashtags.length > 0 && (
                <div className="neo-card">
                  <h3 className="text-lg font-semibold text-neo-foreground mb-2">Hashtags</h3>
                  <p className="text-neo-foreground/80">{generatedPost.hashtags.join(' ')}</p>
                </div>
              )}

              {generatedPost.warnings.length > 0 && (
                <div className="neo-card bg-yellow-100 text-yellow-800 border-yellow-300">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Warnings</h3>
                  <ul className="list-disc list-inside text-yellow-800">
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
    </div>
  );
}