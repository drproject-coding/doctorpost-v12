import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { BrandProfile, SubtopicSuggestion, PostRecommendation, CompatibilityMap, PostGenerationParameters, PostStatus } from '../lib/types';
import { getBrandProfile, findSubtopics, getPostRecommendations, enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions, savePostDraft, schedulePost } from '../lib/api';
import { Search, TrendingUp, ArrowRight, Loader } from 'lucide-react';
import EnhancedDropdown from '../components/EnhancedDropdown';
import PostGenerator, { PostGeneratorRef } from '../components/PostGenerator';
import SchedulePostModal from '../components/SchedulePostModal'; // Import the new modal
import { useAuth } from '../context/AuthContext'; // Import useAuth to get user ID

export default function CreatePage() {
  const { user } = useAuth(); // Get user from AuthContext
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [activeSubNav, setActiveSubNav] = useState('generate-post');

  // Form values
  const [postType, setPostType] = useState('');
  const [hookPattern, setHookPattern] = useState('');
  const [contentPillar, setContentPillar] = useState('');
  const [selectedToneId, setSelectedToneId] = useState(''); // Use ID for tone

  // New state for subtopic feature
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState<SubtopicSuggestion[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubtopicSuggestion | null>(null);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // AI recommendation state
  const [recommendation, setRecommendation] = useState<PostRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Additional parameters for post generation
  const [coreTakeaway, setCoreTakeaway] = useState<string>('');
  const [ctaGoal, setCtaGoal] = useState<string>('');
  const [triggerPostGeneration, setTriggerPostGeneration] = useState(0); // Incremented to trigger generation
  const [generatedContent, setGeneratedContent] = useState<string>(''); // State to hold generated content
  const postGeneratorRef = useRef<PostGeneratorRef>(null); // Ref to access PostGenerator methods

  // State for Schedule Post Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // State for save/schedule loading

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);

        // Set initial tone to Casual & Witty
        setSelectedToneId('casual-witty');
        // Set initial pillar to the first enhanced content pillar
        if (enhancedContentPillars.length > 0) {
          setContentPillar(enhancedContentPillars[0].value);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile(); // Explicitly ignore the promise
  }, [user?.id]); // Depend on user.id

  // Handlers for subtopic feature
  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setTriggerPostGeneration(0); // Reset generation trigger
    setGeneratedContent(''); // Clear generated content
  };

  const handleFindSubtopics = async () => {
    if (!topic.trim()) return;

    setLoadingSubtopics(true);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setTriggerPostGeneration(0); // Reset generation trigger
    setGeneratedContent(''); // Clear generated content

    try {
      const results = await findSubtopics(topic);
      setSubtopics(results);
    } catch (error) {
      console.error("Failed to find subtopics:", error);
    } finally {
      setLoadingSubtopics(false);
    }
  };

  const handleSelectSubtopic = async (subtopic: SubtopicSuggestion) => {
    setSelectedSubtopic(subtopic);
    setTopic(subtopic.text);
    setTriggerPostGeneration(0); // Reset generation trigger
    setGeneratedContent(''); // Clear generated content

    // Get AI recommendations for the selected subtopic
    setLoadingRecommendation(true);
    try {
      const result = await getPostRecommendations(topic, subtopic.text);
      setRecommendation(result);

      // Set form values based on recommendations, with defensive checks
      setPostType(enhancedPostTypes.some(opt => opt.value === result.postType) ? result.postType : '');
      setHookPattern(enhancedHookPatterns.some(opt => opt.value === result.hookPattern) ? result.hookPattern : '');
      setContentPillar(enhancedContentPillars.some(opt => opt.value === result.contentPillar) ? result.contentPillar : '');

      // We don't automatically set the tone anymore as we want to use 'casual-witty' as default
      // but we could do this conditionally if needed
      // setSelectedToneId(enhancedToneOptions.some(opt => opt.id === result.toneId) ? result.toneId : '');

    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const getSourceBadgeLabel = (source: string) => {
    switch (source) {
      case 'google_trends':
        return 'Google Trends';
      case 'google_questions':
        return 'Frequently Asked';
      case 'related_topics':
        return 'Related Topic';
      default:
        return source;
    }
  };

  // Handler for generating post
  const handleGeneratePostClick = () => {
    if (!profile || !topic || !postType || !hookPattern || !contentPillar || !selectedToneId) {
      setSaveFeedback('Please fill in all required fields (Topic, Post Type, Hook Pattern, Content Pillar, Tone) before generating.');
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaveFeedback(null);
    setGeneratedContent(''); // Clear previous generated content
    setTriggerPostGeneration(prev => prev + 1); // Increment to trigger useEffect in PostGenerator
  };

  const handleContentGenerated = (content: string) => {
    setGeneratedContent(content);
  };

  const handleSaveDraft = async () => {
    if (!profile || !generatedContent) {
      setSaveFeedback('No content to save. Please generate a post first.');
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaving(true);
    setSaveFeedback(null);
    try {
      const newPost: ScheduledPost = {
        id: 'temp-draft-' + Date.now(), // Temporary ID, backend will assign real one
        userId: profile.id,
        title: topic.substring(0, 100), // Use topic as title, truncate if too long
        content: generatedContent,
        scheduledAt: new Date().toISOString(), // Save with current date as draft
        pillar: contentPillar,
        status: 'draft',
      };
      await savePostDraft(newPost);
      setSaveFeedback('Post saved as draft successfully!');
    } catch (error) {
      console.error("Failed to save draft:", error);
      setSaveFeedback('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleOpenScheduleModal = () => {
    if (!generatedContent) {
      setSaveFeedback('No content to schedule. Please generate a post first.');
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }
    setIsScheduleModalOpen(true);
  };

  const handleSchedulePost = async (date: string, status: PostStatus) => {
    if (!profile || !generatedContent) {
      setSaveFeedback('No content to schedule. Please generate a post first.');
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaving(true);
    setSaveFeedback(null);
    try {
      const newPost: ScheduledPost = {
        id: 'temp-scheduled-' + Date.now(), // Temporary ID, backend will assign real one
        userId: profile.id,
        title: topic.substring(0, 100), // Use topic as title, truncate if too long
        content: generatedContent,
        scheduledAt: new Date(date).toISOString(),
        pillar: contentPillar,
        status: status,
      };
      await schedulePost(newPost);
      setSaveFeedback('Post scheduled successfully!');
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Failed to schedule post:", error);
      setSaveFeedback('Failed to schedule post. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const postGenerationParams: PostGenerationParameters = {
    topic: selectedSubtopic?.text ?? topic, // Use nullish coalescing
    audience: profile?.audience ?? [],
    coreTakeaway: coreTakeaway,
    ctaGoal: ctaGoal,
    contentPillar: contentPillar,
    hookPattern: hookPattern,
    postType: postType,
    toneId: selectedToneId,
    triggerGeneration: triggerPostGeneration,
  };

  const getCompatibilityMap = (recommendation: PostRecommendation | null) => {
    if (!recommendation) return {};

    const map: CompatibilityMap = {};

    // Post Type compatibility
    enhancedPostTypes.forEach(opt => {
      if (opt.value === recommendation.postType) {
        map[opt.id] = { status: 'recommended', reason: recommendation.reasoning.postType };
      } else if (recommendation.compatiblePostTypes.includes(opt.value)) {
        map[opt.id] = { status: 'caution', reason: 'This is a compatible option, but not the primary recommendation for this subtopic.' };
      } else {
        map[opt.id] = { status: 'neutral' };
      }
    });

    // Hook Pattern compatibility
    enhancedHookPatterns.forEach(opt => {
      if (opt.value === recommendation.hookPattern) {
        map[opt.id] = { status: 'recommended', reason: recommendation.reasoning.hookPattern };
      } else if (recommendation.compatibleHookPatterns.includes(opt.value)) {
        map[opt.id] = { status: 'caution', reason: 'This is a compatible option, but not the primary recommendation for this subtopic.' };
      } else {
        map[opt.id] = { status: 'neutral' };
      }
    });

    // Content Pillar compatibility
    enhancedContentPillars.forEach(opt => {
      if (opt.value === recommendation.contentPillar) {
        map[opt.id] = { status: 'recommended', reason: recommendation.reasoning.contentPillar };
      } else if (recommendation.compatibleContentPillars.includes(opt.value)) {
        map[opt.id] = { status: 'caution', reason: 'This is a compatible option, but not the primary recommendation for this subtopic.' };
      } else {
        map[opt.id] = { status: 'neutral' };
      }
    });

    // Tone compatibility
    enhancedToneOptions.forEach(opt => {
      if (opt.id === recommendation.toneId) {
        map[opt.id] = { status: 'recommended', reason: recommendation.reasoning.tone };
      } else if (recommendation.compatibleTones.includes(opt.id)) {
        map[opt.id] = { status: 'caution', reason: 'This is a compatible option, but not the primary recommendation for this subtopic.' };
      } else {
        map[opt.id] = { status: 'neutral' };
      }
    });

    return map;
  };

  const compatibilityMap = useMemo(() => getCompatibilityMap(recommendation), [recommendation]);

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Create Post</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading brand profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Create Post</h1>
          <div className="neo-card flex items-center justify-center p-12 text-red-500 font-bold">
            <p>Failed to load brand profile. Please check settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Create New Post</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveSubNav('generate-post')}
            className={`neo-button secondary ${activeSubNav === 'generate-post' ? '!bg-purple-electric !text-white' : ''}`}
          >
            Generate Post
          </button>
          <button
            onClick={() => setActiveSubNav('content-strategy')}
            className={`neo-button secondary ${activeSubNav === 'content-strategy' ? '!bg-purple-electric !text-white' : ''}`}
          >
            Content Strategy
          </button>
        </div>

        {activeSubNav === 'generate-post' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Form */}
            <div className="neo-card">
              <h2 className="text-xl font-bold text-neo-foreground mb-4">Post Details</h2>

              <div className="mb-4">
                <label htmlFor="topic-input" className="neo-label">
                  Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="topic-input"
                    className="neo-input pr-10"
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="e.g., 'AI in healthcare'"
                  />
                  <button
                    onClick={void handleFindSubtopics}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-neo hover:bg-gray-100"
                    disabled={loadingSubtopics || !topic.trim()}
                    aria-label="Find Subtopics"
                  >
                    {loadingSubtopics ? <Loader size={20} className="animate-spin text-purple-electric" /> : <Search size={20} className="text-gray-600" />}
                  </button>
                </div>
                {subtopics.length > 0 && (
                  <div className="neo-subtopic-list">
                    <p className="text-xs font-bold uppercase text-gray-500 mt-3 mb-1">Subtopic Suggestions:</p>
                    {subtopics.map(sub => (
                      <div
                        key={sub.id}
                        className={`neo-subtopic-item ${selectedSubtopic?.id === sub.id ? 'selected' : ''}`}
                        onClick={() => void handleSelectSubtopic(sub)}
                      >
                        <span className="neo-subtopic-text">{sub.text}</span>
                        <span className={`neo-subtopic-badge ${sub.source}`}>
                          {getSourceBadgeLabel(sub.source)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="coreTakeaway" className="neo-label">
                  Core Takeaway (Optional)
                </label>
                <textarea
                  id="coreTakeaway"
                  className="neo-input h-24 resize-y"
                  value={coreTakeaway}
                  onChange={(e) => setCoreTakeaway(e.target.value)}
                  placeholder="What's the single most important thing readers should remember?"
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="ctaGoal" className="neo-label">
                  Call to Action Goal (Optional)
                </label>
                <input
                  type="text"
                  id="ctaGoal"
                  className="neo-input"
                  value={ctaGoal}
                  onChange={(e) => setCtaGoal(e.target.value)}
                  placeholder="e.g., 'Visit my website', 'Share your thoughts'"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-field-recommendation">
                  <EnhancedDropdown
                    label="Post Type"
                    options={enhancedPostTypes}
                    value={postType}
                    onChange={setPostType}
                    placeholder="Select a post type"
                    compatibilityMap={compatibilityMap}
                    loading={loadingRecommendation}
                  />
                  {recommendation && postType === recommendation.postType && (
                    <span className="recommendation-tag smart-choice-badge">
                      <TrendingUp size={12} className="mr-1" /> Smart Choice
                    </span>
                  )}
                </div>

                <div className="form-field-recommendation">
                  <EnhancedDropdown
                    label="Hook Pattern"
                    options={enhancedHookPatterns}
                    value={hookPattern}
                    onChange={setHookPattern}
                    placeholder="Select a hook pattern"
                    compatibilityMap={compatibilityMap}
                    loading={loadingRecommendation}
                  />
                  {recommendation && hookPattern === recommendation.hookPattern && (
                    <span className="recommendation-tag smart-choice-badge">
                      <TrendingUp size={12} className="mr-1" /> Smart Choice
                    </span>
                  )}
                </div>

                <div className="form-field-recommendation">
                  <EnhancedDropdown
                    label="Content Pillar"
                    options={enhancedContentPillars}
                    value={contentPillar}
                    onChange={setContentPillar}
                    placeholder="Select a content pillar"
                    compatibilityMap={compatibilityMap}
                    loading={loadingRecommendation}
                  />
                  {recommendation && contentPillar === recommendation.contentPillar && (
                    <span className="recommendation-tag smart-choice-badge">
                      <TrendingUp size={12} className="mr-1" /> Smart Choice
                    </span>
                  )}
                </div>

                <div className="form-field-recommendation">
                  <EnhancedDropdown
                    label="Tone"
                    options={enhancedToneOptions}
                    value={selectedToneId}
                    onChange={setSelectedToneId}
                    placeholder="Select a tone"
                    compatibilityMap={compatibilityMap}
                    loading={loadingRecommendation}
                  />
                  {recommendation && selectedToneId === recommendation.toneId && (
                    <span className="recommendation-tag smart-choice-badge">
                      <TrendingUp size={12} className="mr-1" /> Smart Choice
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleGeneratePostClick}
                className="neo-button w-full"
                disabled={loadingRecommendation || !topic || !postType || !hookPattern || !contentPillar || !selectedToneId}
              >
                {loadingRecommendation ? (
                  <span className="flex items-center justify-center">
                    <Loader size={20} className="animate-spin mr-2" /> Getting Recommendations...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <ArrowRight size={20} className="mr-2" /> Generate Post
                  </span>
                )}
              </button>

              {saveFeedback && (
                <div className={`mt-4 p-3 rounded-neo text-sm font-medium ${saveFeedback.includes('successfully') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} border-2`}>
                  {saveFeedback}
                </div>
              )}
            </div>

            {/* Right Column: Generated Post */}
            <div>
              <PostGenerator
                ref={postGeneratorRef}
                parameters={postGenerationParams}
                profile={profile}
                triggerGeneration={triggerPostGeneration}
                onContentGenerated={handleContentGenerated}
              />
              {generatedContent && (
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={void handleSaveDraft}
                    className="neo-button secondary flex-1"
                    disabled={saving}
                  >
                    {saving ? <Loader size={16} className="animate-spin mr-2" /> : null} Save as Draft
                  </button>
                  <button
                    onClick={void handleOpenScheduleModal}
                    className="neo-button flex-1"
                    disabled={saving}
                  >
                    Schedule Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubNav === 'content-strategy' && (
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Your Content Strategy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="neo-label">Content Strategy Overview</h3>
                <p className="text-neo-foreground/80">{profile.contentStrategy ?? 'No content strategy defined yet. Go to Settings to add one.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Brand Definition</h3>
                <p className="text-neo-foreground/80">{profile.definition ?? 'No brand definition provided. Go to Settings to add one.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Copy Guidelines</h3>
                <p className="text-neo-foreground/80">{profile.copyGuideline ?? 'No copy guidelines set. Go to Settings to add them.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Audience</h3>
                <p className="text-neo-foreground/80">{profile.audience.join(', ') ?? 'No audience defined. Go to Settings to add one.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Tones</h3>
                <p className="text-neo-foreground/80">{profile.tones.join(', ') ?? 'No tones defined. Go to Settings to add them.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Offers</h3>
                <p className="text-neo-foreground/80">{profile.offers.join(', ') ?? 'No offers defined. Go to Settings to add them.'}</p>
              </div>
              <div>
                <h3 className="neo-label">Taboos</h3>
                <p className="text-neo-foreground/80">{profile.taboos.join(', ') ?? 'No taboo topics defined. Go to Settings to add them.'}</p>
              </div>
              <div className="flex justify-end">
                <Link to="/settings" className="neo-button secondary">
                  Edit Strategy in Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleSchedulePost}
        initialDate={new Date().toISOString().split('T')[0]} // Default to today
        initialStatus="scheduled"
      />
    </div>
  );
}