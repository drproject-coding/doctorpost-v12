"use client";
import React, { useState, useEffect } from "react";
import {
  getBrandProfile,
  updateBrandProfile,
  validateOpenAIKey,
} from "@/lib/api";
import { BrandProfile } from "@/lib/types";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");
  const [keyValidation, setKeyValidation] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [keyValidating, setKeyValidating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);
        setOpenAIKey(data.openAIKey ?? "");
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.id]);

  const handleOpenAIKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
    setKeyValidation(null);
  };

  const handleValidateKey = async () => {
    if (!openAIKey) {
      setKeyValidation({
        success: false,
        message: "API key cannot be empty.",
      });
      return;
    }

    setKeyValidating(true);
    try {
      const result = await validateOpenAIKey(openAIKey);
      setKeyValidation(result);

      if (result.success) {
        await handleSaveProfile(true);
        setKeyValidation((prev) =>
          prev
            ? { ...prev, message: "API key validated and saved successfully!" }
            : null,
        );
      }
    } catch (error) {
      console.error("Error validating OpenAI key:", error);
      setKeyValidation({
        success: false,
        message: "An error occurred during validation. Please try again.",
      });
    } finally {
      setKeyValidating(false);
    }
  };

  const handleSaveProfile = async (isAutoSave = false) => {
    if (!profile) return;

    setSaving(true);
    try {
      const updatedProfile = { ...profile, openAIKey: openAIKey };
      await updateBrandProfile(updatedProfile);
      setProfile(updatedProfile);
      if (!isAutoSave) {
        alert("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      if (!isAutoSave) {
        alert("Failed to save settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="bru-card bru-card--raised flex items-center justify-center p-12">
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="bru-card bru-card--raised lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Brand Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="bru-field__label">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="bru-input"
                  value={profile?.firstName ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, firstName: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div>
                <label htmlFor="lastName" className="bru-field__label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="bru-input"
                  value={profile?.lastName ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, lastName: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div>
                <label htmlFor="companyName" className="bru-field__label">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  className="bru-input"
                  value={profile?.companyName ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, companyName: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div>
                <label htmlFor="role" className="bru-field__label">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  className="bru-input"
                  value={profile?.role ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, role: e.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="industry" className="bru-field__label">
                Industry
              </label>
              <input
                type="text"
                id="industry"
                className="bru-input"
                value={profile?.industry ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, industry: e.target.value } : prev,
                  )
                }
              />
            </div>

            <div className="mb-6">
              <label className="bru-field__label">Audience</label>
              <div className="bru-card bru-card--raised p-3 bg-gray-50">
                {profile?.audience.map((audience, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between mb-2 last:mb-0"
                  >
                    <span className="text-sm font-medium">{audience}</span>
                    <button className="text-xs bg-gray-200 p-1 px-2 rounded-bru-md border-2 border-black font-bold">
                      Edit
                    </button>
                  </div>
                ))}
                <button className="text-sm text-bru-purple font-bold mt-2">
                  + Add Audience
                </button>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="bru-btn bru-btn--primary px-6 py-2"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>

          {/* API Keys & Integration */}
          <div className="bru-card bru-card--raised">
            <h2 className="text-xl font-bold mb-6">API Keys & Integration</h2>

            <div className="mb-6">
              <label htmlFor="openAIKey" className="bru-field__label">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="openAIKey"
                className="bru-input mb-2"
                value={openAIKey}
                onChange={handleOpenAIKeyChange}
                placeholder="sk-..."
              />

              <div className="flex space-x-2 items-center">
                <button
                  className="bru-btn bru-btn--primary px-4 py-2 text-sm"
                  onClick={() => void handleValidateKey()}
                  disabled={keyValidating}
                >
                  {keyValidating ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />{" "}
                      Validating...
                    </>
                  ) : (
                    "Validate Key"
                  )}
                </button>

                {keyValidation && (
                  <div
                    className={`text-sm flex items-center font-bold mt-1 ${keyValidation.success ? "text-green-600" : "text-red-600"}`}
                  >
                    {keyValidation.success ? (
                      <CheckCircle size={16} className="mr-1" />
                    ) : (
                      <XCircle size={16} className="mr-1" />
                    )}
                    {keyValidation.message}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="bru-field__label">LinkedIn Integration</label>
              <div className="bru-card bru-card--raised p-3 bg-gray-50">
                <p className="text-sm font-medium mb-2">
                  Status: Not Connected
                </p>
                <button className="bru-btn bru-btn--primary px-4 py-2 text-sm w-full">
                  Connect LinkedIn
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-4">Notifications</h3>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotif"
                  className="rounded-bru-md border-2 border-black h-5 w-5 mr-2"
                />
                <label htmlFor="emailNotif" className="text-sm font-medium">
                  Email Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="slackNotif"
                  className="rounded-bru-md border-2 border-black h-5 w-5 mr-2"
                />
                <label htmlFor="slackNotif" className="text-sm font-medium">
                  Slack Notifications
                </label>
              </div>
            </div>
          </div>

          {/* Brand Guidelines */}
          <div className="bru-card bru-card--raised lg:col-span-3">
            <h2 className="text-xl font-bold mb-6">Brand Guidelines</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="copyGuideline" className="bru-field__label">
                  Copy Guideline
                </label>
                <textarea
                  id="copyGuideline"
                  className="bru-input h-32"
                  value={profile?.copyGuideline ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, copyGuideline: e.target.value } : prev,
                    )
                  }
                ></textarea>
              </div>

              <div>
                <label htmlFor="contentStrategy" className="bru-field__label">
                  Content Strategy
                </label>
                <textarea
                  id="contentStrategy"
                  className="bru-input h-32"
                  value={profile?.contentStrategy ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev
                        ? { ...prev, contentStrategy: e.target.value }
                        : prev,
                    )
                  }
                ></textarea>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="definition" className="bru-field__label">
                Brand Definition
              </label>
              <textarea
                id="definition"
                className="bru-input"
                value={profile?.definition ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, definition: e.target.value } : prev,
                  )
                }
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="bru-btn bru-btn--primary px-6 py-2"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Guidelines"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
