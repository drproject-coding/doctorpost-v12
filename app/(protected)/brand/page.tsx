"use client";
import React, { useState, useEffect, useRef } from "react";
import { Loader } from "lucide-react";
import { getBrandProfile, updateBrandProfile } from "@/lib/api";
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
      const updated = await updateBrandProfile({ ...profile, ...updates });
      setProfile(updated);
      setDraft(updated);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
          <Loader size={32} className="animate-spin text-bru-purple" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-red-600 font-medium">{error}</p>
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
            <p className="text-gray-600 font-medium">
              Your brand identity, voice, and strategy in one place.
            </p>
          </div>
          <div style={{ position: "relative" }} ref={exportRef}>
            <button
              className="bru-btn bru-btn--secondary bru-btn--sm"
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
              onSave={() => handleSave("pillars", {})}
              saving={savingSection === "pillars"}
            >
              {(editing) => <PillarsSection editing={editing} />}
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
