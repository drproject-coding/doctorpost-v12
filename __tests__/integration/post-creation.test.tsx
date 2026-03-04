import "@testing-library/jest-dom";
import {
  getSmartDefaults,
  getRecommendedOptions,
} from "@/lib/post-creation/smartDefaults";
import {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";
import type { ProfileCreationData } from "@/lib/hooks/useProfileData";

// Helper: find the first high-performance option in a list
function firstHighPerf(
  options: { id: string; performanceIndicator?: string }[],
) {
  return options.find((o) => o.performanceIndicator === "high") ?? options[0];
}

describe("Smart Defaults — getSmartDefaults", () => {
  it("returns high-performance defaults when profile is null", () => {
    const defaults = getSmartDefaults(null);

    expect(defaults.selectedPostType).toBe(firstHighPerf(enhancedPostTypes).id);
    expect(defaults.selectedHookPattern).toBe(
      firstHighPerf(enhancedHookPatterns).id,
    );
    expect(defaults.selectedPillar).toBe(
      firstHighPerf(enhancedContentPillars).id,
    );
    expect(defaults.selectedTone).toBe(firstHighPerf(enhancedToneOptions).id);
  });

  it("matches tone from profile tones array", () => {
    // Use the actual label of a tone option for matching
    const knownTone = enhancedToneOptions[2]; // pick 3rd tone
    const profile: ProfileCreationData = {
      audience: [],
      tones: [knownTone.label],
      offers: [],
      industry: "",
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const defaults = getSmartDefaults(profile);
    expect(defaults.selectedTone).toBe(knownTone.id);
  });

  it("falls back to high-performance tone when profile tones don't match", () => {
    const profile: ProfileCreationData = {
      audience: [],
      tones: ["nonexistent-tone-xyz"],
      offers: [],
      industry: "",
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const defaults = getSmartDefaults(profile);
    expect(defaults.selectedTone).toBe(firstHighPerf(enhancedToneOptions).id);
  });

  it("matches pillar from profile industry", () => {
    const knownPillar = enhancedContentPillars[1]; // pick 2nd pillar
    const profile: ProfileCreationData = {
      audience: [],
      tones: [],
      offers: [],
      industry: knownPillar.label,
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const defaults = getSmartDefaults(profile);
    expect(defaults.selectedPillar).toBe(knownPillar.id);
  });

  it("falls back to high-performance pillar when industry doesn't match", () => {
    const profile: ProfileCreationData = {
      audience: [],
      tones: [],
      offers: [],
      industry: "underwater-basket-weaving",
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const defaults = getSmartDefaults(profile);
    expect(defaults.selectedPillar).toBe(
      firstHighPerf(enhancedContentPillars).id,
    );
  });

  it("always returns valid option IDs for all four dimensions", () => {
    const defaults = getSmartDefaults(null);

    const allPostTypeIds = enhancedPostTypes.map((o) => o.id);
    const allHookPatternIds = enhancedHookPatterns.map((o) => o.id);
    const allPillarIds = enhancedContentPillars.map((o) => o.id);
    const allToneIds = enhancedToneOptions.map((o) => o.id);

    expect(allPostTypeIds).toContain(defaults.selectedPostType);
    expect(allHookPatternIds).toContain(defaults.selectedHookPattern);
    expect(allPillarIds).toContain(defaults.selectedPillar);
    expect(allToneIds).toContain(defaults.selectedTone);
  });

  it("handles profile with empty tones array", () => {
    const profile: ProfileCreationData = {
      audience: [],
      tones: [],
      offers: [],
      industry: "",
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const defaults = getSmartDefaults(profile);
    expect(defaults.selectedTone).toBe(firstHighPerf(enhancedToneOptions).id);
  });
});

describe("Recommended Options — getRecommendedOptions", () => {
  it("returns all options for each dimension when profile is null", () => {
    const recommended = getRecommendedOptions(null);

    expect(recommended.postTypes.length).toBe(enhancedPostTypes.length);
    expect(recommended.hookPatterns.length).toBe(enhancedHookPatterns.length);
    expect(recommended.contentPillars.length).toBe(
      enhancedContentPillars.length,
    );
    expect(recommended.tones.length).toBe(enhancedToneOptions.length);
  });

  it("sorts high-performance options before others when no profile", () => {
    const recommended = getRecommendedOptions(null);

    // High-perf options should be sorted earlier
    const highPerfPostTypes = recommended.postTypes.filter(
      (o) => o.performanceIndicator === "high",
    );
    if (highPerfPostTypes.length > 0) {
      const firstHighIdx = recommended.postTypes.findIndex(
        (o) => o.performanceIndicator === "high",
      );
      const firstNonHighIdx = recommended.postTypes.findIndex(
        (o) => o.performanceIndicator !== "high" && !o.isTrending,
      );
      // At least one high-perf option should appear before non-high, non-trending options
      if (firstNonHighIdx >= 0) {
        expect(firstHighIdx).toBeLessThan(firstNonHighIdx);
      }
    }
  });

  it("prioritises profile-matching tones over non-matching", () => {
    const knownTone = enhancedToneOptions[enhancedToneOptions.length - 1]; // last tone
    const profile: ProfileCreationData = {
      audience: [],
      tones: [knownTone.label],
      offers: [],
      industry: "",
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const recommended = getRecommendedOptions(profile);
    // The matched tone should be the first item (score 100+)
    expect(recommended.tones[0].id).toBe(knownTone.id);
  });

  it("prioritises profile-matching pillars from industry", () => {
    const knownPillar =
      enhancedContentPillars[enhancedContentPillars.length - 1];
    const profile: ProfileCreationData = {
      audience: [],
      tones: [],
      offers: [],
      industry: knownPillar.label,
      contentStrategy: "",
      definition: "",
      copyGuideline: "",
    };

    const recommended = getRecommendedOptions(profile);
    expect(recommended.contentPillars[0].id).toBe(knownPillar.id);
  });

  it("does not mutate the original option arrays", () => {
    const originalPostTypesOrder = [...enhancedPostTypes.map((o) => o.id)];
    const originalTonesOrder = [...enhancedToneOptions.map((o) => o.id)];

    getRecommendedOptions(null);

    expect(enhancedPostTypes.map((o) => o.id)).toEqual(originalPostTypesOrder);
    expect(enhancedToneOptions.map((o) => o.id)).toEqual(originalTonesOrder);
  });
});

describe("Post Creation Integration — end-to-end data flow", () => {
  it("smart defaults IDs can be looked up in dropdown options", () => {
    const defaults = getSmartDefaults(null);

    const postType = enhancedPostTypes.find(
      (o) => o.id === defaults.selectedPostType,
    );
    const hookPattern = enhancedHookPatterns.find(
      (o) => o.id === defaults.selectedHookPattern,
    );
    const pillar = enhancedContentPillars.find(
      (o) => o.id === defaults.selectedPillar,
    );
    const tone = enhancedToneOptions.find(
      (o) => o.id === defaults.selectedTone,
    );

    expect(postType).toBeDefined();
    expect(hookPattern).toBeDefined();
    expect(pillar).toBeDefined();
    expect(tone).toBeDefined();

    // Each resolved option should have a non-empty value for the form
    expect(postType!.value).toBeTruthy();
    expect(hookPattern!.value).toBeTruthy();
    expect(pillar!.value).toBeTruthy();
    expect(tone!.value).toBeTruthy();
  });

  it("profile with all fields produces valid defaults", () => {
    const profile: ProfileCreationData = {
      audience: ["Tech professionals", "Startup founders"],
      tones: [enhancedToneOptions[0].label],
      offers: ["Consulting"],
      industry: enhancedContentPillars[0].label,
      contentStrategy: "Educational focus",
      definition: "B2B SaaS",
      copyGuideline: "Professional tone",
    };

    const defaults = getSmartDefaults(profile);

    // All defaults should be valid IDs
    expect(
      enhancedPostTypes.some((o) => o.id === defaults.selectedPostType),
    ).toBe(true);
    expect(
      enhancedHookPatterns.some((o) => o.id === defaults.selectedHookPattern),
    ).toBe(true);
    expect(
      enhancedContentPillars.some((o) => o.id === defaults.selectedPillar),
    ).toBe(true);
    expect(
      enhancedToneOptions.some((o) => o.id === defaults.selectedTone),
    ).toBe(true);

    // With matching profile data, tone and pillar should match profile
    expect(defaults.selectedTone).toBe(enhancedToneOptions[0].id);
    expect(defaults.selectedPillar).toBe(enhancedContentPillars[0].id);
  });
});
