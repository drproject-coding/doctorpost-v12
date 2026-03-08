import "@testing-library/jest-dom";
import {
  getSmartDefaults,
  getRecommendedOptions,
} from "@/lib/post-creation/smartDefaults";
import {
  postStructureOptions,
  contentAngleOptions,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";
import type { ProfileCreationData } from "@/lib/hooks/useProfileData";

describe("Smart Defaults — getSmartDefaults", () => {
  it("returns first options as defaults when profile is null", () => {
    const defaults = getSmartDefaults(null);

    expect(defaults.selectedPostStructure).toBe(postStructureOptions[0].id);
    expect(defaults.selectedContentAngle).toBe(contentAngleOptions[0].id);
    expect(defaults.selectedPillar).toBeDefined();
    expect(defaults.selectedTone).toBeDefined();
  });

  it("matches tone from profile tones array", () => {
    const knownTone = enhancedToneOptions[2];
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
    // Should fall back to a valid tone
    const allToneIds = enhancedToneOptions.map((o) => o.id);
    expect(allToneIds).toContain(defaults.selectedTone);
  });

  it("matches pillar from profile industry", () => {
    const knownPillar = enhancedContentPillars[1];
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
    const allPillarIds = enhancedContentPillars.map((o) => o.id);
    expect(allPillarIds).toContain(defaults.selectedPillar);
  });

  it("always returns valid option IDs for all four dimensions", () => {
    const defaults = getSmartDefaults(null);

    const allPostStructureIds = postStructureOptions.map((o) => o.id);
    const allContentAngleIds = contentAngleOptions.map((o) => o.id);
    const allPillarIds = enhancedContentPillars.map((o) => o.id);
    const allToneIds = enhancedToneOptions.map((o) => o.id);

    expect(allPostStructureIds).toContain(defaults.selectedPostStructure);
    expect(allContentAngleIds).toContain(defaults.selectedContentAngle);
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
    const allToneIds = enhancedToneOptions.map((o) => o.id);
    expect(allToneIds).toContain(defaults.selectedTone);
  });
});

describe("Recommended Options — getRecommendedOptions", () => {
  it("returns all options for each dimension when profile is null", () => {
    const recommended = getRecommendedOptions(null);

    expect(recommended.postStructures.length).toBe(postStructureOptions.length);
    expect(recommended.contentAngles.length).toBe(contentAngleOptions.length);
    expect(recommended.contentPillars.length).toBe(
      enhancedContentPillars.length,
    );
    expect(recommended.tones.length).toBe(enhancedToneOptions.length);
  });

  it("prioritises profile-matching tones over non-matching", () => {
    const knownTone = enhancedToneOptions[enhancedToneOptions.length - 1];
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
    const originalPostStructuresOrder = [
      ...postStructureOptions.map((o) => o.id),
    ];
    const originalTonesOrder = [...enhancedToneOptions.map((o) => o.id)];

    getRecommendedOptions(null);

    expect(postStructureOptions.map((o) => o.id)).toEqual(
      originalPostStructuresOrder,
    );
    expect(enhancedToneOptions.map((o) => o.id)).toEqual(originalTonesOrder);
  });
});

describe("Post Creation Integration — end-to-end data flow", () => {
  it("smart defaults IDs can be looked up in dropdown options", () => {
    const defaults = getSmartDefaults(null);

    const postStructure = postStructureOptions.find(
      (o) => o.id === defaults.selectedPostStructure,
    );
    const contentAngle = contentAngleOptions.find(
      (o) => o.id === defaults.selectedContentAngle,
    );
    const pillar = enhancedContentPillars.find(
      (o) => o.id === defaults.selectedPillar,
    );
    const tone = enhancedToneOptions.find(
      (o) => o.id === defaults.selectedTone,
    );

    expect(postStructure).toBeDefined();
    expect(contentAngle).toBeDefined();
    expect(pillar).toBeDefined();
    expect(tone).toBeDefined();

    expect(postStructure!.value).toBeTruthy();
    expect(contentAngle!.value).toBeTruthy();
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

    expect(
      postStructureOptions.some((o) => o.id === defaults.selectedPostStructure),
    ).toBe(true);
    expect(
      contentAngleOptions.some((o) => o.id === defaults.selectedContentAngle),
    ).toBe(true);
    expect(
      enhancedContentPillars.some((o) => o.id === defaults.selectedPillar),
    ).toBe(true);
    expect(
      enhancedToneOptions.some((o) => o.id === defaults.selectedTone),
    ).toBe(true);

    expect(defaults.selectedTone).toBe(enhancedToneOptions[0].id);
    expect(defaults.selectedPillar).toBe(enhancedContentPillars[0].id);
  });
});
