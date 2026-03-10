"use client";
import React, { useState, useEffect, useRef } from "react";
import { Loader as LucideLoader } from "lucide-react";
import { Loader, Alert } from "@doctorproject/react";
import {
  getBrandProfile,
  updateBrandProfile,
  auditBrand,
  generateBrandSection,
} from "@/lib/api";
import { BrandProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import {
  exportAndDownloadMarkdown,
  exportAndDownloadJson,
  copyToClipboard,
  triggerPrint,
} from "@/lib/brand-export";
import BrandSection from "@/components/brand/BrandSection";
import ProfileSection from "@/components/brand/sections/ProfileSection";
import VoiceSection from "@/components/brand/sections/VoiceSection";
import StrategySection from "@/components/brand/sections/StrategySection";
import OffersSection from "@/components/brand/sections/OffersSection";
import PillarsSection from "@/components/brand/sections/PillarsSection";
import PositioningSection from "@/components/brand/sections/PositioningSection";
import AiToolsSection from "@/components/brand/sections/AiToolsSection";

export default function BrandPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [draft, setDraft] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [auditResult, setAuditResult] = useState<{
    strengths: string[];
    gaps: string[];
    suggestions: string[];
  } | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(event.target as Node)
      ) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);
        setDraft(data);
      } catch (err) {
        console.error("Failed to load brand profile:", err);
        setError("Failed to load brand profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id]);

  const handleSave = async (
    section: string,
    updates: Partial<BrandProfile>,
  ) => {
    if (!profile) return;
    setSavingSection(section);
    try {
      const merged = { ...profile, ...updates };
      await updateBrandProfile(merged);
      setProfile(merged);
      setDraft(merged);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSavingSection(null);
    }
  };

  const aiSettings = profile
    ? {
        activeProvider: profile.aiProvider,
        claudeApiKey: profile.claudeApiKey,
        straicoApiKey: profile.straicoApiKey,
        straicoModel: profile.straicoModel,
        straicoImageModel: profile.straicoImageModel,
        oneforallApiKey: profile.oneforallApiKey,
        oneforallModel: profile.oneforallModel,
        oneforallImageModel: profile.oneforallImageModel,
      }
    : null;

  const handleAudit = async () => {
    if (!profile || !aiSettings) return;
    setAuditing(true);
    setAuditOpen(true);
    try {
      const result = await auditBrand(profile, aiSettings);
      setAuditResult(result);
    } catch (e) {
      console.error("Audit failed:", e);
    } finally {
      setAuditing(false);
    }
  };

  const SECTION_FIELD: Record<string, keyof BrandProfile> = {
    "Brand Positioning": "positioning",
    "Content Strategy": "contentStrategy",
    Profile: "definition",
    "Voice & Guidelines": "copyGuideline",
  };

  const handleAiGenerate = async (section: string): Promise<void> => {
    if (!profile || !aiSettings || !draft) return;
    const generated = await generateBrandSection(section, profile, aiSettings);
    const field = SECTION_FIELD[section];
    if (field && generated) {
      setDraft((prev) => (prev ? { ...prev, [field]: generated } : null));
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <Loader label="Loading brand profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="error">{error}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Brand</h1>
            <p style={{ color: "var(--drp-grey)", fontWeight: 500 }}>
              Your brand identity, voice, and strategy in one place.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="drp-btn drp-btn--primary drp-btn--sm"
              onClick={() => void handleAudit()}
              disabled={auditing || !aiSettings}
            >
              {auditing ? "Auditing..." : "✦ Audit Brand"}
            </button>
            <div style={{ position: "relative" }} ref={exportRef}>
              <button
                className="drp-btn drp-btn--secondary drp-btn--sm"
                onClick={() => setExportOpen((o) => !o)}
              >
                Export ↓
              </button>
              {exportOpen && profile && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 4,
                    background: "white",
                    border: "1px solid #121212",
                    zIndex: 50,
                    minWidth: 180,
                  }}
                >
                  {[
                    {
                      label: "Download Markdown",
                      action: () => exportAndDownloadMarkdown(profile),
                    },
                    {
                      label: "Download JSON",
                      action: () => exportAndDownloadJson(profile),
                    },
                    {
                      label: "Copy as Text",
                      action: () => copyToClipboard(profile),
                    },
                    { label: "Print / PDF", action: () => triggerPrint() },
                  ].map((item) => (
                    <button
                      key={item.label}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        item.action();
                        setExportOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit panel */}
        {auditOpen && (
          <div
            style={{
              border: "1px solid #121212",
              padding: 16,
              marginBottom: 24,
              background: "#F2F2F2",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <strong>Brand Audit</strong>
              <button
                onClick={() => setAuditOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            {auditing ? (
              <div>Analyzing your brand...</div>
            ) : auditResult ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <strong style={{ color: "#00AA00" }}>Strengths</strong>
                  <ul>
                    {auditResult.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: "#FF4444" }}>Gaps</strong>
                  <ul>
                    {auditResult.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: "#631DED" }}>Suggestions</strong>
                  <ul>
                    {auditResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Sections */}
        {profile && (
          <div className="space-y-4">
            {/* Profile */}
            <BrandSection
              title="Profile"
              tag="PROFILE"
              color="#631DED"
              onSave={() => handleSave("profile", draft ? { ...draft } : {})}
              saving={savingSection === "profile"}
              onAiGenerate={() => handleAiGenerate("Profile")}
            >
              {(editing) => (
                <ProfileSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>

            {/* Voice & Guidelines */}
            <BrandSection
              title="Voice & Guidelines"
              tag="VOICE"
              color="#FF6C01"
              onSave={() => handleSave("voice", draft ? { ...draft } : {})}
              saving={savingSection === "voice"}
              onAiGenerate={() => handleAiGenerate("Voice & Guidelines")}
            >
              {(editing) => (
                <VoiceSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>

            {/* Content Strategy */}
            <BrandSection
              title="Content Strategy"
              tag="STRATEGY"
              color="#00A896"
              onSave={() => handleSave("strategy", draft ? { ...draft } : {})}
              saving={savingSection === "strategy"}
              onAiGenerate={() => handleAiGenerate("Content Strategy")}
            >
              {(editing) => (
                <StrategySection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>

            {/* Offers & Value Prop */}
            <BrandSection
              title="Offers & Value Prop"
              tag="OFFERS"
              color="#D4A800"
              onSave={() => handleSave("offers", draft ? { ...draft } : {})}
              saving={savingSection === "offers"}
              onAiGenerate={() => handleAiGenerate("Offers & Value Prop")}
            >
              {(editing) => (
                <OffersSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>

            {/* Content Pillars */}
            <BrandSection
              title="Content Pillars"
              tag="PILLARS"
              color="#2D8A6B"
              onSave={() =>
                handleSave(
                  "pillars",
                  draft
                    ? {
                        pillars: draft.pillars,
                        customPillars: draft.customPillars,
                      }
                    : {},
                )
              }
              saving={savingSection === "pillars"}
            >
              {(editing) => (
                <PillarsSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                  onAutoSave={(updates) => handleSave("pillars", updates)}
                />
              )}
            </BrandSection>

            {/* Brand Positioning */}
            <BrandSection
              title="Brand Positioning"
              tag="POSITIONING"
              color="#C97070"
              onSave={() =>
                handleSave("positioning", draft ? { ...draft } : {})
              }
              saving={savingSection === "positioning"}
              onAiGenerate={() => handleAiGenerate("Brand Positioning")}
            >
              {(editing) => (
                <PositioningSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>

            {/* AI & Tools */}
            <BrandSection
              title="AI & Tools"
              tag="AI & TOOLS"
              color="#282828"
              onSave={() => handleSave("aitools", draft ? { ...draft } : {})}
              saving={savingSection === "aitools"}
            >
              {(editing) => (
                <AiToolsSection
                  profile={draft ?? profile}
                  editing={editing}
                  onChange={(updates) =>
                    setDraft((prev) => (prev ? { ...prev, ...updates } : null))
                  }
                />
              )}
            </BrandSection>
          </div>
        )}
      </div>
    </div>
  );
}
