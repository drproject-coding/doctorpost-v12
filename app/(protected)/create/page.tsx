"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Alert, Button, Card } from "@bruddle/react";
import {
  BrandProfile,
  SubtopicSuggestion,
  PostRecommendation,
  CompatibilityMap,
  PostGenerationParameters,
  PostStatus,
  ScheduledPost,
  AiSettings,
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
import { getSmartDefaults } from "@/lib/post-creation/smartDefaults";
import { Search, TrendingUp, ArrowRight, Loader } from "lucide-react";
import EnhancedDropdown from "@/components/EnhancedDropdown";
import PostGenerator, { PostGeneratorRef } from "@/components/PostGenerator";
import SchedulePostModal from "@/components/SchedulePostModal";
import { useAuth } from "@/lib/auth-context";

export default function CreatePage() {
  const { user, loadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [activeSubNav, setActiveSubNav] = useState("generate-post");

  // Form values
  const [postType, setPostType] = useState("");
  const [hookPattern, setHookPattern] = useState("");
  const [contentPillar, setContentPillar] = useState("");
  const [selectedToneId, setSelectedToneId] = useState("");

  // Subtopic feature
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState<SubtopicSuggestion[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] =
    useState<SubtopicSuggestion | null>(null);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // AI recommendation state
  const [recommendation, setRecommendation] =
    useState<PostRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Additional parameters
  const [coreTakeaway, setCoreTakeaway] = useState<string>("");
  const [ctaGoal, setCtaGoal] = useState<string>("");
  const [triggerPostGeneration, setTriggerPostGeneration] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const postGeneratorRef = useRef<PostGeneratorRef>(null);

  // Schedule Post Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loadingAuth) return;
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);

        // Use smart defaults based on profile
        const defaults = getSmartDefaults(data);

        // Map IDs to values
        const toneOpt = enhancedToneOptions.find(
          (o) => o.id === defaults.selectedTone,
        );
        const ptOpt = enhancedPostTypes.find(
          (o) => o.id === defaults.selectedPostType,
        );
        const hpOpt = enhancedHookPatterns.find(
          (o) => o.id === defaults.selectedHookPattern,
        );
        const cpOpt = enhancedContentPillars.find(
          (o) => o.id === defaults.selectedPillar,
        );

        if (toneOpt) setSelectedToneId(toneOpt.value);
        if (ptOpt) setPostType(ptOpt.value);
        if (hpOpt) setHookPattern(hpOpt.value);
        if (cpOpt) setContentPillar(cpOpt.value);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id, loadingAuth]);

  const aiSettings: AiSettings | null = useMemo(() => {
    if (!profile) return null;
    return {
      activeProvider: profile.aiProvider,
      claudeApiKey: profile.claudeApiKey,
      straicoApiKey: profile.straicoApiKey,
      straicoModel: profile.straicoModel,
      straicoImageModel: profile.straicoImageModel,
      oneforallApiKey: profile.oneforallApiKey,
      oneforallModel: profile.oneforallModel,
      oneforallImageModel: profile.oneforallImageModel,
    };
  }, [profile]);

  const brandContext = useMemo(() => {
    if (!profile) return undefined;
    return {
      industry: profile.industry,
      role: profile.role,
      audience: profile.audience,
      tones: profile.tones,
      contentStrategy: profile.contentStrategy,
      definition: profile.definition,
    };
  }, [profile]);

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
      const results = await findSubtopics(topic, 5, aiSettings ?? undefined);
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
      const result = await getPostRecommendations(
        topic,
        subtopic.text,
        aiSettings ?? undefined,
        brandContext,
      );
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

  const handleGeneratePostClick = async () => {
    if (!profile || !topic) {
      setSaveFeedback("Please fill in a topic before generating.");
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setSaveFeedback(null);

    // If no AI recommendation yet, fetch one now using the topic directly
    if (!recommendation && aiSettings) {
      setLoadingRecommendation(true);
      try {
        const result = await getPostRecommendations(
          topic,
          topic, // use topic as subtopic when no subtopic selected
          aiSettings,
          brandContext,
        );
        setRecommendation(result);
        if (enhancedPostTypes.some((opt) => opt.value === result.postType)) {
          setPostType(result.postType);
        }
        if (
          enhancedHookPatterns.some((opt) => opt.value === result.hookPattern)
        ) {
          setHookPattern(result.hookPattern);
        }
        if (
          enhancedContentPillars.some(
            (opt) => opt.value === result.contentPillar,
          )
        ) {
          setContentPillar(result.contentPillar);
        }
        if (result.toneId) {
          setSelectedToneId(result.toneId);
        }
      } catch (error) {
        console.error("Failed to get recommendations:", error);
        // Non-fatal: proceed with current dropdown values
      } finally {
        setLoadingRecommendation(false);
      }
    }

    // Require form completeness before generating
    if (!postType || !hookPattern || !contentPillar || !selectedToneId) {
      setSaveFeedback(
        "Please fill in all required fields (Post Type, Hook Pattern, Content Pillar, Tone) before generating.",
      );
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setGeneratedContent("");
    setTriggerPostGeneration((prev) => prev + 1);
  };

  const handleContentGenerated = (content: string) => {
    setGeneratedContent(content);
    // Auto-save to library
    if (content && profile) {
      const newPost: ScheduledPost = {
        id: "",
        userId: profile.id,
        title: topic.substring(0, 100),
        content,
        scheduledAt: "",
        pillar: contentPillar,
        status: "draft",
      };
      void savePostDraft(newPost).catch(() => {/* non-fatal */});
    }
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
      setSaveFeedback("Saved to Library!");
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
          reason: "Compatible option, but not the primary recommendation.",
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
          reason: "Compatible option, but not the primary recommendation.",
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
          reason: "Compatible option, but not the primary recommendation.",
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
          reason: "Compatible option, but not the primary recommendation.",
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
      <Card
        variant="raised"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <p>Loading brand profile...</p>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Alert variant="error" title="No brand profile found">
        Please go to{" "}
        <a
          href="/settings"
          style={{ fontWeight: 700, textDecoration: "underline" }}
        >
          Settings
        </a>{" "}
        to set up your brand profile before creating content.
      </Alert>
    );
  }

  return (
    <>
      <h1
        style={{
          fontSize: "var(--bru-text-h3)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-6)",
        }}
      >
        Create New Post
      </h1>

      {/* Sub-navigation tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--bru-space-2)",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <Button
          onClick={() => setActiveSubNav("generate-post")}
          variant={activeSubNav === "generate-post" ? "primary" : undefined}
        >
          Generate Post
        </Button>
        <Button
          onClick={() => setActiveSubNav("content-strategy")}
          variant={activeSubNav === "content-strategy" ? "primary" : undefined}
        >
          Content Strategy
        </Button>
      </div>

      {activeSubNav === "generate-post" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--bru-space-6)",
          }}
          className="create-grid"
        >
          {/* Left Column: Input Form */}
          <Card variant="raised">
            <h2
              style={{
                fontSize: "var(--bru-text-h5)",
                fontWeight: 700,
                marginBottom: "var(--bru-space-4)",
              }}
            >
              Post Details
            </h2>

            <div className="bru-form-stack">
              {/* Topic field */}
              <div className="bru-field bru-field--has-icon">
                <label htmlFor="topic-input" className="bru-field__label">
                  Topic
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    id="topic-input"
                    className="bru-input"
                    style={{ width: "100%", paddingRight: 40 }}
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="e.g., 'AI in healthcare'"
                  />
                  <button
                    onClick={() => void handleFindSubtopics()}
                    disabled={loadingSubtopics || !topic.trim()}
                    aria-label="Find Subtopics"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    {loadingSubtopics ? (
                      <Loader
                        size={20}
                        className="animate-spin"
                        style={{ color: "var(--bru-purple)" }}
                      />
                    ) : (
                      <Search size={20} style={{ color: "var(--bru-grey)" }} />
                    )}
                  </button>
                </div>

                {subtopics.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--bru-space-2)",
                      marginTop: "var(--bru-space-3)",
                    }}
                  >
                    <span className="bru-field__label">
                      Subtopic Suggestions
                    </span>
                    {subtopics.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => void handleSelectSubtopic(sub)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "var(--bru-space-2) var(--bru-space-3)",
                          border:
                            selectedSubtopic?.id === sub.id
                              ? "2px solid var(--bru-purple)"
                              : "var(--bru-border)",
                          background:
                            selectedSubtopic?.id === sub.id
                              ? "var(--bru-purple-20)"
                              : "var(--bru-cream)",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                          fontFamily: "var(--bru-font-primary)",
                          fontSize: "var(--bru-text-md)",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{sub.text}</span>
                        <span
                          className="bru-tag bru-tag--filled"
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            background:
                              sub.source === "google_trends"
                                ? "var(--bru-purple-20)"
                                : sub.source === "google_questions"
                                  ? "rgba(0, 170, 0, 0.12)"
                                  : "rgba(255, 170, 0, 0.15)",
                          }}
                        >
                          {getSourceBadgeLabel(sub.source)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Takeaway */}
              <div className="bru-field">
                <label htmlFor="coreTakeaway" className="bru-field__label">
                  Core Takeaway (Optional)
                </label>
                <textarea
                  id="coreTakeaway"
                  className="bru-input"
                  style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                  value={coreTakeaway}
                  onChange={(e) => setCoreTakeaway(e.target.value)}
                  placeholder="What's the single most important thing readers should remember?"
                />
              </div>

              {/* CTA Goal */}
              <div className="bru-field">
                <label htmlFor="ctaGoal" className="bru-field__label">
                  Call to Action Goal (Optional)
                </label>
                <input
                  type="text"
                  id="ctaGoal"
                  className="bru-input"
                  style={{ width: "100%" }}
                  value={ctaGoal}
                  onChange={(e) => setCtaGoal(e.target.value)}
                  placeholder="e.g., 'Visit my website', 'Share your thoughts'"
                />
              </div>

              {/* Dropdown grid: 2 columns */}
              <div className="bru-form-row">
                <div style={{ position: "relative" }}>
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
                    <span
                      className="smart-choice-badge"
                      style={{ marginTop: "var(--bru-space-1)" }}
                    >
                      <TrendingUp size={12} /> Smart Choice
                    </span>
                  )}
                </div>

                <div style={{ position: "relative" }}>
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
                      <span
                        className="smart-choice-badge"
                        style={{ marginTop: "var(--bru-space-1)" }}
                      >
                        <TrendingUp size={12} /> Smart Choice
                      </span>
                    )}
                </div>

                <div style={{ position: "relative" }}>
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
                      <span
                        className="smart-choice-badge"
                        style={{ marginTop: "var(--bru-space-1)" }}
                      >
                        <TrendingUp size={12} /> Smart Choice
                      </span>
                    )}
                </div>

                <div style={{ position: "relative" }}>
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
                      <span
                        className="smart-choice-badge"
                        style={{ marginTop: "var(--bru-space-1)" }}
                      >
                        <TrendingUp size={12} /> Smart Choice
                      </span>
                    )}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGeneratePostClick}
                variant="primary"
                block
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
                  <>
                    <Loader size={18} className="animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Generate Post
                  </>
                )}
              </Button>

              {saveFeedback && (
                <Alert
                  variant={
                    saveFeedback.includes("successfully") ? "success" : "error"
                  }
                >
                  {saveFeedback}
                </Alert>
              )}
            </div>
          </Card>

          {/* Right Column: Generated Post */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--bru-space-4)",
            }}
          >
            <PostGenerator
              ref={postGeneratorRef}
              parameters={postGenerationParams}
              profile={profile}
              aiSettings={aiSettings!}
              triggerGeneration={triggerPostGeneration}
              onContentGenerated={handleContentGenerated}
            />
            {generatedContent && (
              <div className="bru-form-actions">
                <Button
                  onClick={() => void handleSaveDraft()}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? <Loader size={16} className="animate-spin" /> : null}
                  {saving ? "Saving…" : "Save to Library"}
                </Button>
                <Button
                  onClick={handleOpenScheduleModal}
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  Schedule Post
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubNav === "content-strategy" && (
        <Card variant="raised">
          <h2
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-4)",
            }}
          >
            Your Content Strategy
          </h2>
          <div className="bru-form-stack">
            <div className="bru-field">
              <h3 className="bru-field__label">Content Strategy Overview</h3>
              <p>
                {profile.contentStrategy ??
                  "No content strategy defined yet. Go to Settings to add one."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Brand Definition</h3>
              <p>
                {profile.definition ??
                  "No brand definition provided. Go to Settings to add one."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Copy Guidelines</h3>
              <p>
                {profile.copyGuideline ??
                  "No copy guidelines set. Go to Settings to add them."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Audience</h3>
              <p>
                {profile.audience.join(", ") ||
                  "No audience defined. Go to Settings to add one."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Tones</h3>
              <p>
                {profile.tones.join(", ") ||
                  "No tones defined. Go to Settings to add them."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Offers</h3>
              <p>
                {profile.offers.join(", ") ||
                  "No offers defined. Go to Settings to add them."}
              </p>
            </div>
            <div className="bru-field">
              <h3 className="bru-field__label">Taboos</h3>
              <p>
                {profile.taboos.join(", ") ||
                  "No taboo topics defined. Go to Settings to add them."}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/settings" className="bru-btn">
                Edit Strategy in Settings
              </Link>
            </div>
          </div>
        </Card>
      )}

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleSchedulePost}
        initialDate={new Date().toISOString().split("T")[0]}
        initialStatus="scheduled"
      />
    </>
  );
}
