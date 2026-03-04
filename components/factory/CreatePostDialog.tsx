"use client";

import React, { useState, useEffect } from "react";
import { Alert, Button, Card } from "@bruddle/react";
import { ArrowRight, Loader, TrendingUp } from "lucide-react";
import PostTypeSelector from "@/components/factory/PostTypeSelector";
import HookPatternSelector from "@/components/factory/HookPatternSelector";
import ContentPillarSelector from "@/components/factory/ContentPillarSelector";
import ToneSelector from "@/components/factory/ToneSelector";
import { useProfileData } from "@/lib/hooks/useProfileData";
import { usePostPresets } from "@/lib/hooks/usePostPresets";
import { getSmartDefaults } from "@/lib/post-creation/smartDefaults";
import {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";
import type { PostRecommendation } from "@/lib/types";

export interface CreatePostFormValues {
  postType: string;
  hookPattern: string;
  contentPillar: string;
  toneId: string;
}

interface CreatePostDialogProps {
  /** AI recommendation from subtopic selection (optional) */
  recommendation?: PostRecommendation | null;
  /** Whether recommendations are loading */
  loadingRecommendation?: boolean;
  /** Called when the user clicks Generate */
  onGenerate: (values: CreatePostFormValues) => void;
  /** Called whenever form values change */
  onValuesChange?: (values: CreatePostFormValues) => void;
}

export default function CreatePostDialog({
  recommendation = null,
  loadingRecommendation = false,
  onGenerate,
  onValuesChange,
}: CreatePostDialogProps) {
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
  } = useProfileData();
  const { loading: presetsLoading, error: presetsError } = usePostPresets();

  // Form state
  const [postType, setPostType] = useState("");
  const [hookPattern, setHookPattern] = useState("");
  const [contentPillar, setContentPillar] = useState("");
  const [toneId, setToneId] = useState("");
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  // Apply smart defaults once profile data loads
  useEffect(() => {
    if (defaultsApplied || profileLoading) return;

    const defaults = getSmartDefaults(profileData);

    // Map ids back to values for the dropdown components
    const ptOpt = enhancedPostTypes.find(
      (o) => o.id === defaults.selectedPostType,
    );
    const hpOpt = enhancedHookPatterns.find(
      (o) => o.id === defaults.selectedHookPattern,
    );
    const cpOpt = enhancedContentPillars.find(
      (o) => o.id === defaults.selectedPillar,
    );
    const tOpt = enhancedToneOptions.find(
      (o) => o.id === defaults.selectedTone,
    );

    if (ptOpt) setPostType(ptOpt.value);
    if (hpOpt) setHookPattern(hpOpt.value);
    if (cpOpt) setContentPillar(cpOpt.value);
    if (tOpt) setToneId(tOpt.value);

    setDefaultsApplied(true);
  }, [profileData, profileLoading, defaultsApplied]);

  // Apply recommendation when it arrives (overrides smart defaults)
  useEffect(() => {
    if (!recommendation) return;
    if (
      enhancedPostTypes.some((opt) => opt.value === recommendation.postType)
    ) {
      setPostType(recommendation.postType);
    }
    if (
      enhancedHookPatterns.some(
        (opt) => opt.value === recommendation.hookPattern,
      )
    ) {
      setHookPattern(recommendation.hookPattern);
    }
    if (
      enhancedContentPillars.some(
        (opt) => opt.value === recommendation.contentPillar,
      )
    ) {
      setContentPillar(recommendation.contentPillar);
    }
    if (recommendation.toneId) {
      setToneId(recommendation.toneId);
    }
  }, [recommendation]);

  // Notify parent of value changes
  useEffect(() => {
    onValuesChange?.({ postType, hookPattern, contentPillar, toneId });
  }, [postType, hookPattern, contentPillar, toneId, onValuesChange]);

  const handleGenerate = () => {
    onGenerate({ postType, hookPattern, contentPillar, toneId });
  };

  const isLoading = profileLoading || presetsLoading;
  const isFormComplete = postType && hookPattern && contentPillar && toneId;
  const hasError = profileError ?? presetsError;

  // Loading state
  if (isLoading) {
    return (
      <Card variant="raised">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--bru-space-3)",
            minHeight: 120,
          }}
        >
          <Loader size={20} className="animate-spin" />
          <span>Loading post configuration...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="bru-form-stack">
      {/* Error banner */}
      {hasError && (
        <Alert variant="error" title="Configuration Error">
          {profileError && <p>Profile: {profileError}</p>}
          {presetsError && <p>Presets: {presetsError}</p>}
          <p style={{ marginTop: "var(--bru-space-2)", fontSize: "0.875rem" }}>
            Using default options. You can still create a post.
          </p>
        </Alert>
      )}

      {/* Selector grid: 2 columns */}
      <div className="bru-form-row">
        <div style={{ position: "relative" }}>
          <PostTypeSelector
            value={postType}
            onChange={setPostType}
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
          <HookPatternSelector
            value={hookPattern}
            onChange={setHookPattern}
            loading={loadingRecommendation}
          />
          {recommendation && hookPattern === recommendation.hookPattern && (
            <span
              className="smart-choice-badge"
              style={{ marginTop: "var(--bru-space-1)" }}
            >
              <TrendingUp size={12} /> Smart Choice
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <ContentPillarSelector
            value={contentPillar}
            onChange={setContentPillar}
            loading={loadingRecommendation}
          />
          {recommendation && contentPillar === recommendation.contentPillar && (
            <span
              className="smart-choice-badge"
              style={{ marginTop: "var(--bru-space-1)" }}
            >
              <TrendingUp size={12} /> Smart Choice
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <ToneSelector
            value={toneId}
            onChange={setToneId}
            loading={loadingRecommendation}
          />
          {recommendation && toneId === recommendation.toneId && (
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
        onClick={handleGenerate}
        variant="primary"
        block
        disabled={loadingRecommendation || !isFormComplete}
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
    </div>
  );
}
