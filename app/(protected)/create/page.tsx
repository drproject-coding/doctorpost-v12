"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BrandProfile,
  SubtopicSuggestion,
  PostRecommendation,
  CompatibilityMap,
  PostGenerationParameters,
  PostStatus,
  ScheduledPost,
} from "@/lib/types";
import {
  getBrandProfile,
  findSubtopics,
  getPostRecommendations,
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
  savePostDraft,
  schedulePost,
} from "@/lib/api";
import { Search, TrendingUp, ArrowRight, Loader } from "lucide-react";
import EnhancedDropdown from "@/components/EnhancedDropdown";
import PostGenerator, { PostGeneratorRef } from "@/components/PostGenerator";
import SchedulePostModal from "@/components/SchedulePostModal";
import { useAuth } from "@/lib/auth-context";

export default function CreatePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [activeSubNav, setActiveSubNav] = useState("generate-post");

  // Form values
  const [postType, setPostType] = useState("");
  const [hookPattern, setHookPattern] = useState("");
  const [contentPillar, setContentPillar] = useState("");
  const [selectedToneId, setSelectedToneId] = useState("");

  // New state for subtopic feature
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState<SubtopicSuggestion[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] =
    useState<SubtopicSuggestion | null>(null);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // AI recommendation state
  const [recommendation, setRecommendation] =
    useState<PostRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Additional parameters for post generation
  const [coreTakeaway, setCoreTakeaway] = useState<string>("");
  const [ctaGoal, setCtaGoal] = useState<string>("");
  const [triggerPostGeneration, setTriggerPostGeneration] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const postGeneratorRef = useRef<PostGeneratorRef>(null);

  // State for Schedule Post Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);

        setSelectedToneId("casual-witty");
        if (enhancedContentPillars.length > 0) {
          setContentPillar(enhancedContentPillars[0].value);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.id]);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setTriggerPostGeneration(0);
    setGeneratedContent("");
  };

  const handleFindSubtopics = async () => {
    if (!topic.trim()) return;

    setLoadingSubtopics(true);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setTriggerPostGeneration(0);
    setGeneratedContent("");

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
    setTriggerPostGeneration(0);
    setGeneratedContent("");

    setLoadingRecommendation(true);
    try {
      const result = await getPostRecommendations(topic, subtopic.text);
      setRecommendation(result);

      setPostType(
        enhancedPostTypes.some((opt) => opt.value === result.postType)
          ? result.postType
          : "",
      );
      setHookPattern(
        enhancedHookPatterns.some((opt) => opt.value === result.hookPattern)
          ? result.hookPattern
          : "",
      );
      setContentPillar(
        enhancedContentPillars.some((opt) => opt.value === result.contentPillar)
          ? result.contentPillar
          : "",
      );
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const getSourceBadgeLabel = (source: string) => {
    switch (source) {
      case "google_trends":
        return "Google Trends";
      case "google_questions":
        return "Frequently Asked";
      case "related_topics":
        return "Related Topic";
      default:
        return source;
    }
  };

  const handleGeneratePostClick = () => {
    if (
      !profile ||
      !topic ||
      !postType ||
      !hookPattern ||
      !contentPillar ||
      !selectedToneId
    ) {
      setSaveFeedback(
        "Please fill in all required fields (Topic, Post Type, Hook Pattern, Content Pillar, Tone) before generating.",
      );
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaveFeedback(null);
    setGeneratedContent("");
    setTriggerPostGeneration((prev) => prev + 1);
  };

  const handleContentGenerated = (content: string) => {
    setGeneratedContent(content);
  };

  const handleSaveDraft = async () => {
    if (!profile || !generatedContent) {
      setSaveFeedback("No content to save. Please generate a post first.");
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaving(true);
    setSaveFeedback(null);
    try {
      const newPost: ScheduledPost = {
        id: "temp-draft-" + Date.now(),
        userId: profile.id,
        title: topic.substring(0, 100),
        content: generatedContent,
        scheduledAt: new Date().toISOString(),
        pillar: contentPillar,
        status: "draft",
      };
      await savePostDraft(newPost);
      setSaveFeedback("Post saved as draft successfully!");
    } catch (error) {
      console.error("Failed to save draft:", error);
      setSaveFeedback("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleOpenScheduleModal = () => {
    if (!generatedContent) {
      setSaveFeedback("No content to schedule. Please generate a post first.");
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }
    setIsScheduleModalOpen(true);
  };

  const handleSchedulePost = async (date: string, status: PostStatus) => {
    if (!profile || !generatedContent) {
      setSaveFeedback("No content to schedule. Please generate a post first.");
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaving(true);
    setSaveFeedback(null);
    try {
      const newPost: ScheduledPost = {
        id: "temp-scheduled-" + Date.now(),
        userId: profile.id,
        title: topic.substring(0, 100),
        content: generatedContent,
        scheduledAt: new Date(date).toISOString(),
        pillar: contentPillar,
        status: status,
      };
      await schedulePost(newPost);
      setSaveFeedback("Post scheduled successfully!");
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Failed to schedule post:", error);
      setSaveFeedback("Failed to schedule post. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const postGenerationParams: PostGenerationParameters = {
    topic: selectedSubtopic?.text ?? topic,
    audience: profile?.audience ?? [],
    coreTakeaway: coreTakeaway,
    ctaGoal: ctaGoal,
    contentPillar: contentPillar,
    hookPattern: hookPattern,
    postType: postType,
    toneId: selectedToneId,
    triggerGeneration: triggerPostGeneration,
  };

  const getCompatibilityMap = (rec: PostRecommendation | null) => {
    if (!rec) return {};

    const map: CompatibilityMap = {};

    enhancedPostTypes.forEach((opt) => {
      if (opt.value === rec.postType) {
        map[opt.id] = { status: "recommended", reason: rec.reasoning.postType };
      } else if (rec.compatiblePostTypes.includes(opt.value)) {
        map[opt.id] = {
          status: "caution",
          reason:
            "This is a compatible option, but not the primary recommendation for this subtopic.",
        };
      } else {
        map[opt.id] = { status: "neutral" };
      }
    });

    enhancedHookPatterns.forEach((opt) => {
      if (opt.value === rec.hookPattern) {
        map[opt.id] = {
          status: "recommended",
          reason: rec.reasoning.hookPattern,
        };
      } else if (rec.compatibleHookPatterns.includes(opt.value)) {
        map[opt.id] = {
          status: "caution",
          reason:
            "This is a compatible option, but not the primary recommendation for this subtopic.",
        };
      } else {
        map[opt.id] = { status: "neutral" };
      }
    });

    enhancedContentPillars.forEach((opt) => {
      if (opt.value === rec.contentPillar) {
        map[opt.id] = {
          status: "recommended",
          reason: rec.reasoning.contentPillar,
        };
      } else if (rec.compatibleContentPillars.includes(opt.value)) {
        map[opt.id] = {
          status: "caution",
          reason:
            "This is a compatible option, but not the primary recommendation for this subtopic.",
        };
      } else {
        map[opt.id] = { status: "neutral" };
      }
    });

    enhancedToneOptions.forEach((opt) => {
      if (opt.id === rec.toneId) {
        map[opt.id] = { status: "recommended", reason: rec.reasoning.tone };
      } else if (rec.compatibleTones.includes(opt.id)) {
        map[opt.id] = {
          status: "caution",
          reason:
            "This is a compatible option, but not the primary recommendation for this subtopic.",
        };
      } else {
        map[opt.id] = { status: "neutral" };
      }
    });

    return map;
  };

  const compatibilityMap = useMemo(
    () => getCompatibilityMap(recommendation),
    [recommendation],
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create Post</h1>
          <div className="bru-card bru-card--raised flex items-center justify-center p-12">
            <p>Loading brand profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create Post</h1>
          <div className="bru-card bru-card--raised flex items-center justify-center p-12 text-red-500 font-bold">
            <p>Failed to load brand profile. Please check settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Post</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveSubNav("generate-post")}
            className={`bru-btn ${activeSubNav === "generate-post" ? "bru-btn--primary" : ""}`}
          >
            Generate Post
          </button>
          <button
            onClick={() => setActiveSubNav("content-strategy")}
            className={`bru-btn ${activeSubNav === "content-strategy" ? "bru-btn--primary" : ""}`}
          >
            Content Strategy
          </button>
        </div>

        {activeSubNav === "generate-post" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Form */}
            <div className="bru-card bru-card--raised">
              <h2 className="text-xl font-bold mb-4">Post Details</h2>

              <div className="mb-4">
                <label htmlFor="topic-input" className="bru-field__label">
                  Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="topic-input"
                    className="bru-input pr-10"
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="e.g., 'AI in healthcare'"
                  />
                  <button
                    onClick={() => void handleFindSubtopics()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-bru-md hover:bg-gray-100"
                    disabled={loadingSubtopics || !topic.trim()}
                    aria-label="Find Subtopics"
                  >
                    {loadingSubtopics ? (
                      <Loader
                        size={20}
                        className="animate-spin text-bru-purple"
                      />
                    ) : (
                      <Search size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
                {subtopics.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold uppercase text-gray-500 mt-3 mb-1">
                      Subtopic Suggestions:
                    </p>
                    {subtopics.map((sub) => (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between p-2 border-2 border-black rounded-bru-md cursor-pointer transition-colors hover:border-bru-purple ${selectedSubtopic?.id === sub.id ? "bg-bru-purple/10 border-bru-purple" : "bg-bru-cream"}`}
                        onClick={() => void handleSelectSubtopic(sub)}
                      >
                        <span className="text-sm font-medium">{sub.text}</span>
                        <span
                          className={`bru-tag bru-tag--filled ${sub.source === "google_trends" ? "bru-tag--purple" : sub.source === "google_questions" ? "bru-tag--mint" : "bru-tag--yellow"}`}
                          style={{ fontSize: "11px", padding: "2px 8px" }}
                        >
                          {getSourceBadgeLabel(sub.source)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="coreTakeaway" className="bru-field__label">
                  Core Takeaway (Optional)
                </label>
                <textarea
                  id="coreTakeaway"
                  className="bru-input h-24 resize-y"
                  value={coreTakeaway}
                  onChange={(e) => setCoreTakeaway(e.target.value)}
                  placeholder="What's the single most important thing readers should remember?"
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="ctaGoal" className="bru-field__label">
                  Call to Action Goal (Optional)
                </label>
                <input
                  type="text"
                  id="ctaGoal"
                  className="bru-input"
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
                  {recommendation &&
                    hookPattern === recommendation.hookPattern && (
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
                  {recommendation &&
                    contentPillar === recommendation.contentPillar && (
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
                  {recommendation &&
                    selectedToneId === recommendation.toneId && (
                      <span className="recommendation-tag smart-choice-badge">
                        <TrendingUp size={12} className="mr-1" /> Smart Choice
                      </span>
                    )}
                </div>
              </div>

              <button
                onClick={handleGeneratePostClick}
                className="bru-btn bru-btn--primary w-full"
                disabled={
                  loadingRecommendation ||
                  !topic ||
                  !postType ||
                  !hookPattern ||
                  !contentPillar ||
                  !selectedToneId
                }
              >
                {loadingRecommendation ? (
                  <span className="flex items-center justify-center">
                    <Loader size={20} className="animate-spin mr-2" /> Getting
                    Recommendations...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <ArrowRight size={20} className="mr-2" /> Generate Post
                  </span>
                )}
              </button>

              {saveFeedback && (
                <div
                  className={`mt-4 p-3 rounded-bru-md text-sm font-medium ${saveFeedback.includes("successfully") ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"} border-2`}
                >
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
                    onClick={() => void handleSaveDraft()}
                    className="bru-btn flex-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : null}{" "}
                    Save as Draft
                  </button>
                  <button
                    onClick={handleOpenScheduleModal}
                    className="bru-btn bru-btn--primary flex-1"
                    disabled={saving}
                  >
                    Schedule Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubNav === "content-strategy" && (
          <div className="bru-card bru-card--raised">
            <h2 className="text-xl font-bold mb-4">Your Content Strategy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="bru-field__label">Content Strategy Overview</h3>
                <p>
                  {profile.contentStrategy ??
                    "No content strategy defined yet. Go to Settings to add one."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Brand Definition</h3>
                <p>
                  {profile.definition ??
                    "No brand definition provided. Go to Settings to add one."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Copy Guidelines</h3>
                <p>
                  {profile.copyGuideline ??
                    "No copy guidelines set. Go to Settings to add them."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Audience</h3>
                <p>
                  {profile.audience.join(", ") ||
                    "No audience defined. Go to Settings to add one."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Tones</h3>
                <p>
                  {profile.tones.join(", ") ||
                    "No tones defined. Go to Settings to add them."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Offers</h3>
                <p>
                  {profile.offers.join(", ") ||
                    "No offers defined. Go to Settings to add them."}
                </p>
              </div>
              <div>
                <h3 className="bru-field__label">Taboos</h3>
                <p>
                  {profile.taboos.join(", ") ||
                    "No taboo topics defined. Go to Settings to add them."}
                </p>
              </div>
              <div className="flex justify-end">
                <Link href="/settings" className="bru-btn">
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
        initialDate={new Date().toISOString().split("T")[0]}
        initialStatus="scheduled"
      />
    </div>
  );
}
