"use client";
import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { getBrandProfile } from "@/lib/api";
import { BrandProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const SECTIONS = [
  "Profile",
  "Voice & Guidelines",
  "Content Strategy",
  "Offers & Value Prop",
  "Content Pillars",
  "Brand Positioning",
  "AI & Tools",
] as const;

export default function BrandPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load brand profile:", err);
        setError("Failed to load brand profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id]);

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
          <button
            disabled
            className="py-2 px-4 text-sm font-bold border-2 border-black bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Export ↓
          </button>
        </div>

        {/* Section placeholders */}
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div
              key={section}
              className="p-4 border-2 border-black bg-white font-medium"
            >
              Section: {section}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
