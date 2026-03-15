"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Icon,
  Input,
  Textarea,
  Loader as BruLoader,
} from "@doctorproject/react";
import {
  BrandProfile,
  SubtopicSuggestion,
  PostRecommendation,
  PostGenerationParameters,
  PostStatus,
  ScheduledPost,
  AiSettings,
} from "@/lib/types";
import {
  getBrandProfile,
  findSubtopics,
  enhancedContentPillars,
  savePostDraft,
  schedulePost,
} from "@/lib/api";
import { postStructureOptions, contentAngleOptions } from "@/lib/dropdownData";
import { getSmartDefaults } from "@/lib/post-creation/smartDefaults";
import EnhancedDropdown from "@/components/EnhancedDropdown";
import ContentAngleChips from "@/components/create/ContentAngleChips";
import PostStructureCards from "@/components/create/PostStructureCards";
import PostGenerator, { PostGeneratorRef } from "@/components/PostGenerator";
import SchedulePostModal from "@/components/SchedulePostModal";
import { TonePromptPreviewModal } from "@/components/TonePromptPreviewModal";
import { enhancedToneOptions } from "@/lib/dropdownData";
import { useAuth } from "@/lib/auth-context";

export default function CreatePage() {
  const { user, loadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [activeSubNav, setActiveSubNav] = useState("generate-post");

  // Form values
  const [postStructure, setPostStructure] = useState("");
  const [contentAngle, setContentAngle] = useState("");
  const [contentPillar, setContentPillar] = useState("");

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
  const [showRecommendationReasoning, setShowRecommendationReasoning] =
    useState(false);

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

  // Tone prompt preview
  const [previewToneId, setPreviewToneId] = useState<string | null>(null);
  const previewTone = previewToneId
    ? enhancedToneOptions.find((t) => t.id === previewToneId)
    : null;

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

        // Apply smart defaults
        const defaults = getSmartDefaults(data);
        const psOpt = postStructureOptions.find(
          (o) => o.id === defaults.selectedPostStructure,
        );
        const caOpt = contentAngleOptions.find(
          (o) => o.id === defaults.selectedContentAngle,
        );
        const cpOpt = enhancedContentPillars.find(
          (o) => o.id === defaults.selectedPillar,
        );

        if (psOpt) setPostStructure(psOpt.value);
        if (caOpt) setContentAngle(caOpt.value);
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

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setShowRecommendationReasoning(false);
    setTriggerPostGeneration(0);
    setGeneratedContent("");
  };

  const handleFindSubtopics = async () => {
    if (!topic.trim()) return;
    setLoadingSubtopics(true);
    setSubtopics([]);
    setSelectedSubtopic(null);
    setRecommendation(null);
    setShowRecommendationReasoning(false);
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

  const fetchRecommendation = async (
    topicText: string,
    subtopicText: string,
  ) => {
    setLoadingRecommendation(true);
    try {
      const res = await fetch("/api/create/recommend-params", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicText, subtopic: subtopicText }),
      });
      if (!res.ok) return;
      const result = (await res.json()) as PostRecommendation;
      setRecommendation(result);
      if (result.postStructure) setPostStructure(result.postStructure);
      if (result.contentAngle) setContentAngle(result.contentAngle);
      if (result.contentPillar) setContentPillar(result.contentPillar);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleSelectSubtopic = async (subtopic: SubtopicSuggestion) => {
    setSelectedSubtopic(subtopic);
    setTriggerPostGeneration(0);
    setGeneratedContent("");
    await fetchRecommendation(topic, subtopic.text);
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

    // If no AI recommendation yet, fetch one using the topic directly
    if (!recommendation && aiSettings) {
      await fetchRecommendation(topic, topic);
    }

    // Require form completeness before generating
    if (!postStructure || !contentAngle || !contentPillar) {
      setSaveFeedback(
        "Please select a Post Structure, Content Angle, and Content Pillar before generating.",
      );
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    setGeneratedContent("");
    setTriggerPostGeneration((prev) => prev + 1);
  };

  const handleContentGenerated = (content: string) => {
    setGeneratedContent(content);
    if (content && profile) {
      const newPost: ScheduledPost = {
        id: "",
        userId: profile.id,
        title: topic.substring(0, 100),
        content,
        scheduledAt: "",
        pillar: contentPillar,
        contentAngle,
        postStructure,
        status: "draft",
      };
      void savePostDraft(newPost).catch(() => {
        /* non-fatal */
      });
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
        contentAngle,
        postStructure,
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
        contentAngle,
        postStructure,
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

  const postGenerationParams: PostGenerationParameters = useMemo(
    () => ({
      topic: selectedSubtopic?.text ?? topic,
      audience: profile?.audience ?? [],
      coreTakeaway: coreTakeaway,
      ctaGoal: ctaGoal,
      contentPillar: contentPillar,
      contentAngle: contentAngle,
      postStructure: postStructure,
      triggerGeneration: triggerPostGeneration,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedSubtopic?.text,
      topic,
      coreTakeaway,
      ctaGoal,
      contentPillar,
      contentAngle,
      postStructure,
      triggerPostGeneration,
    ],
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
        <BruLoader label="Loading brand profile..." />
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
          fontSize: "var(--drp-text-h3)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-6)",
        }}
      >
        Create New Post
      </h1>

      {/* Sub-navigation tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--drp-space-2)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <Button
          onClick={() => setActiveSubNav("generate-post")}
          variant={activeSubNav === "generate-post" ? "primary" : "outline"}
        >
          Generate Post
        </Button>
        <Button
          onClick={() => setActiveSubNav("content-strategy")}
          variant={activeSubNav === "content-strategy" ? "primary" : "outline"}
        >
          Content Strategy
        </Button>
      </div>

      {activeSubNav === "generate-post" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--drp-space-6)",
          }}
          className="create-grid"
        >
          {/* Left Column: Input Form */}
          <Card variant="raised">
            <h2
              style={{
                fontSize: "var(--drp-text-h5)",
                fontWeight: 700,
                marginBottom: "var(--drp-space-4)",
              }}
            >
              Post Details
            </h2>

            <div className="drp-form-stack">
              {/* Topic field */}
              <div className="drp-field drp-field--has-icon">
                <label htmlFor="topic-input" className="drp-field__label">
                  Topic
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    id="topic-input"
                    className="drp-input"
                    style={{ width: "100%", paddingRight: 40 }}
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="e.g., 'AI in healthcare'"
                  />
                  <Button
                    onClick={() => void handleFindSubtopics()}
                    disabled={loadingSubtopics || !topic.trim()}
                    aria-label="Find Subtopics"
                    variant="ghost"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: 4,
                    }}
                  >
                    {loadingSubtopics ? "…" : "⌕"}
                  </Button>
                </div>

                {subtopics.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--drp-space-2)",
                      marginTop: "var(--drp-space-3)",
                    }}
                  >
                    <span className="drp-field__label">
                      Subtopic Suggestions
                    </span>
                    {subtopics.map((sub) => (
                      <Button
                        key={sub.id}
                        type="button"
                        onClick={() => void handleSelectSubtopic(sub)}
                        variant="ghost"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "var(--drp-space-2) var(--drp-space-3)",
                          border:
                            selectedSubtopic?.id === sub.id
                              ? "2px solid var(--drp-purple)"
                              : "var(--drp-border)",
                          background:
                            selectedSubtopic?.id === sub.id
                              ? "var(--drp-purple-20)"
                              : "var(--drp-cream)",
                          textAlign: "left",
                          width: "100%",
                          fontFamily: "var(--drp-font-primary)",
                          fontSize: "var(--drp-text-md)",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{sub.text}</span>
                        <span
                          className="drp-tag drp-tag--filled"
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            background:
                              sub.source === "google_trends"
                                ? "var(--drp-purple-20)"
                                : sub.source === "google_questions"
                                  ? "rgba(0, 170, 0, 0.12)"
                                  : "rgba(255, 170, 0, 0.15)",
                          }}
                        >
                          {getSourceBadgeLabel(sub.source)}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Takeaway */}
              <Textarea
                label="Core Takeaway (Optional)"
                id="coreTakeaway"
                style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                value={coreTakeaway}
                onChange={(e) => setCoreTakeaway(e.target.value)}
                placeholder="What's the single most important thing readers should remember?"
              />

              {/* CTA Goal */}
              <Input
                label="Call to Action Goal (Optional)"
                id="ctaGoal"
                type="text"
                style={{ width: "100%" }}
                value={ctaGoal}
                onChange={(e) => setCtaGoal(e.target.value)}
                placeholder="e.g., 'Visit my website', 'Share your thoughts'"
              />

              {/* Post Structure */}
              <div
                className="drp-field"
                style={{
                  borderLeft: "3px solid var(--drp-purple)",
                  paddingLeft: "var(--drp-space-3)",
                }}
              >
                <label
                  className="drp-field__label"
                  style={{ color: "var(--drp-purple)" }}
                >
                  Post Structure
                </label>
                <PostStructureCards
                  selected={postStructure}
                  onChange={setPostStructure}
                />
              </div>

              {/* Content Angle */}
              <div
                className="drp-field"
                style={{
                  borderLeft: "3px solid var(--drp-mint)",
                  paddingLeft: "var(--drp-space-3)",
                }}
              >
                <label
                  className="drp-field__label"
                  style={{ color: "var(--drp-mint)" }}
                >
                  Content Angle
                </label>
                <ContentAngleChips
                  selected={contentAngle}
                  suggested={
                    loadingRecommendation ? null : recommendation?.contentAngle
                  }
                  onChange={setContentAngle}
                />
              </div>

              {/* Content Pillar */}
              <div
                className="drp-field"
                style={{
                  borderLeft: "3px solid var(--drp-success-dark)",
                  paddingLeft: "var(--drp-space-3)",
                }}
              >
                <EnhancedDropdown
                  label="Content Pillar"
                  options={enhancedContentPillars}
                  value={contentPillar}
                  onChange={setContentPillar}
                  placeholder="Select a content pillar"
                  loading={loadingRecommendation}
                />
              </div>

              {/* AI Recommendation reasoning — collapsible */}
              {recommendation && recommendation.confidence > 0 && (
                <div
                  style={{
                    border: "1px solid rgba(99,29,237,0.2)",
                    background: "rgba(99,29,237,0.03)",
                    padding: "var(--drp-space-3)",
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => setShowRecommendationReasoning((v) => !v)}
                    variant="ghost"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: 0,
                      fontSize: "var(--drp-text-sm)",
                      fontWeight: 600,
                      color: "var(--drp-purple)",
                    }}
                  >
                    <span>
                      AI Recommendations (
                      {Math.round(recommendation.confidence * 100)}% confidence)
                    </span>
                    {showRecommendationReasoning ? (
                      <span>▲</span>
                    ) : (
                      <span>▼</span>
                    )}
                  </Button>

                  {showRecommendationReasoning && (
                    <div
                      style={{
                        marginTop: "var(--drp-space-3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--drp-space-2)",
                        fontSize: "var(--drp-text-sm)",
                        color: "var(--drp-grey)",
                      }}
                    >
                      {recommendation.reasoning.contentAngle && (
                        <p>
                          <strong>Content Angle:</strong>{" "}
                          {recommendation.reasoning.contentAngle}
                        </p>
                      )}
                      {recommendation.reasoning.postStructure && (
                        <p>
                          <strong>Post Structure:</strong>{" "}
                          {recommendation.reasoning.postStructure}
                        </p>
                      )}
                      {recommendation.reasoning.contentPillar && (
                        <p>
                          <strong>Content Pillar:</strong>{" "}
                          {recommendation.reasoning.contentPillar}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={() => void handleGeneratePostClick()}
                variant="primary"
                block
                disabled={
                  loadingRecommendation ||
                  !topic ||
                  !postStructure ||
                  !contentAngle ||
                  !contentPillar
                }
              >
                {loadingRecommendation ? (
                  "Getting Recommendations…"
                ) : (
                  <>
                    <Icon name="arrow-right" size="sm" />
                    Generate Post
                  </>
                )}
              </Button>

              {/* Tone prompt preview */}
              {profile.tones.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--drp-space-2)",
                    flexWrap: "wrap",
                    fontSize: "var(--drp-text-sm)",
                    color: "var(--drp-grey)",
                  }}
                >
                  <Icon name="eye" size="sm" />
                  <span>Preview tone prompt:</span>
                  {profile.tones.map((toneId) => {
                    const tone = enhancedToneOptions.find(
                      (t) => t.id === toneId,
                    );
                    return (
                      <Button
                        key={toneId}
                        type="button"
                        onClick={() => setPreviewToneId(toneId)}
                        variant="ghost"
                        style={{
                          fontSize: "var(--drp-text-sm)",
                          color: "var(--drp-purple)",
                          fontWeight: 600,
                          textDecoration: "underline",
                          padding: 0,
                        }}
                      >
                        {tone?.label ?? toneId}
                      </Button>
                    );
                  })}
                </div>
              )}

              {saveFeedback && (
                <Alert
                  variant={
                    saveFeedback.includes("successfully") ||
                    saveFeedback.includes("Saved")
                      ? "success"
                      : "error"
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
              gap: "var(--drp-space-4)",
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
              <div className="drp-form-actions">
                <Button
                  onClick={() => void handleSaveDraft()}
                  variant="outline"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
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
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-4)",
            }}
          >
            Your Content Strategy
          </h2>
          <div className="drp-form-stack">
            <div className="drp-field">
              <h3 className="drp-field__label">Content Strategy Overview</h3>
              <p>
                {profile.contentStrategy ??
                  "No content strategy defined yet. Go to Settings to add one."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Brand Definition</h3>
              <p>
                {profile.definition ??
                  "No brand definition provided. Go to Settings to add one."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Copy Guidelines</h3>
              <p>
                {profile.copyGuideline ??
                  "No copy guidelines set. Go to Settings to add them."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Audience</h3>
              <p>
                {profile.audience.join(", ") ||
                  "No audience defined. Go to Settings to add one."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Tones</h3>
              <p>
                {profile.tones.join(", ") ||
                  "No tones defined. Go to Settings to add them."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Offers</h3>
              <p>
                {profile.offers.join(", ") ||
                  "No offers defined. Go to Settings to add them."}
              </p>
            </div>
            <div className="drp-field">
              <h3 className="drp-field__label">Taboos</h3>
              <p>
                {profile.taboos.join(", ") ||
                  "No taboo topics defined. Go to Settings to add them."}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/settings" className="drp-btn">
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

      <TonePromptPreviewModal
        isOpen={!!previewToneId}
        onClose={() => setPreviewToneId(null)}
        toneId={previewToneId ?? ""}
        toneName={previewTone?.label ?? previewToneId ?? ""}
      />
    </>
  );
}
