"use client";
import React from "react";
import { Input } from "@doctorproject/react";
import { BrandProfile } from "@/lib/types";

interface ProfileSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const NOT_SET = (
  <span
    style={{
      color: "var(--drp-grey-85)",
      fontStyle: "italic",
      fontSize: "var(--drp-text-sm)",
    }}
  >
    Not set
  </span>
);

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  const handleAudienceChange = (value: string) => {
    const tags = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ audience: tags });
  };

  if (!editing) {
    const fullName =
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") || null;

    return (
      <div className="drp-form-stack">
        {/* Name */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "var(--drp-space-2)",
            alignItems: "baseline",
          }}
        >
          <span className="drp-field__label">Name</span>
          <span
            style={{
              fontFamily: "var(--drp-font-primary)",
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-black)",
            }}
          >
            {fullName ?? NOT_SET}
          </span>
        </div>

        {/* Company */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "var(--drp-space-2)",
            alignItems: "baseline",
          }}
        >
          <span className="drp-field__label">Company</span>
          <span
            style={{
              fontFamily: "var(--drp-font-primary)",
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-black)",
            }}
          >
            {profile.companyName || NOT_SET}
          </span>
        </div>

        {/* Role */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "var(--drp-space-2)",
            alignItems: "baseline",
          }}
        >
          <span className="drp-field__label">Role</span>
          <span
            style={{
              fontFamily: "var(--drp-font-primary)",
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-black)",
            }}
          >
            {profile.role || NOT_SET}
          </span>
        </div>

        {/* Industry */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "var(--drp-space-2)",
            alignItems: "baseline",
          }}
        >
          <span className="drp-field__label">Industry</span>
          <span
            style={{
              fontFamily: "var(--drp-font-primary)",
              fontSize: "var(--drp-text-md)",
              color: "var(--drp-black)",
            }}
          >
            {profile.industry || NOT_SET}
          </span>
        </div>

        {/* Audience */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "var(--drp-space-2)",
            alignItems: "flex-start",
          }}
        >
          <span className="drp-field__label" style={{ paddingTop: "2px" }}>
            Audience
          </span>
          {profile.audience.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {profile.audience.map((tag) => (
                <span key={tag} className="drp-tag drp-tag--purple">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            NOT_SET
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="drp-form-stack">
      {/* First + Last name row */}
      <div className="drp-form-row">
        <div className="drp-field">
          <Input
            label="First Name"
            id="profile-first-name"
            value={profile.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div className="drp-field">
          <Input
            label="Last Name"
            id="profile-last-name"
            value={profile.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Company */}
      <Input
        label="Company"
        id="profile-company"
        value={profile.companyName}
        onChange={(e) => onChange({ companyName: e.target.value })}
        placeholder="Company name"
      />

      {/* Role */}
      <Input
        label="Role"
        id="profile-role"
        value={profile.role}
        onChange={(e) => onChange({ role: e.target.value })}
        placeholder="Your role or job title"
      />

      {/* Industry */}
      <Input
        label="Industry"
        id="profile-industry"
        value={profile.industry}
        onChange={(e) => onChange({ industry: e.target.value })}
        placeholder="e.g. Technology, Healthcare, Finance"
      />

      {/* Audience */}
      <div className="drp-field">
        <Input
          label="Audience"
          id="profile-audience"
          value={profile.audience.join(", ")}
          onChange={(e) => handleAudienceChange(e.target.value)}
          placeholder="Comma-separated, e.g. Founders, Marketers, CTOs"
        />
        <span
          style={{
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
            fontFamily: "var(--drp-font-primary)",
          }}
        >
          Separate multiple audiences with commas
        </span>
      </div>
    </div>
  );
};

export default ProfileSection;
