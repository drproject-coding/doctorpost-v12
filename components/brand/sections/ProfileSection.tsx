"use client";
import React from "react";
import { BrandProfile } from "@/lib/types";

interface ProfileSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const NOT_SET = (
  <span
    style={{
      color: "var(--bru-grey-85)",
      fontStyle: "italic",
      fontSize: "var(--bru-text-sm)",
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
      <div className="bru-form-stack">
        {/* Name */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: "8px",
            alignItems: "baseline",
          }}
        >
          <span className="bru-field__label">Name</span>
          <span
            style={{
              fontFamily: "var(--bru-font-primary)",
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-black)",
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
            gap: "8px",
            alignItems: "baseline",
          }}
        >
          <span className="bru-field__label">Company</span>
          <span
            style={{
              fontFamily: "var(--bru-font-primary)",
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-black)",
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
            gap: "8px",
            alignItems: "baseline",
          }}
        >
          <span className="bru-field__label">Role</span>
          <span
            style={{
              fontFamily: "var(--bru-font-primary)",
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-black)",
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
            gap: "8px",
            alignItems: "baseline",
          }}
        >
          <span className="bru-field__label">Industry</span>
          <span
            style={{
              fontFamily: "var(--bru-font-primary)",
              fontSize: "var(--bru-text-md)",
              color: "var(--bru-black)",
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
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <span className="bru-field__label" style={{ paddingTop: "2px" }}>
            Audience
          </span>
          {profile.audience.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {profile.audience.map((tag) => (
                <span key={tag} className="bru-tag bru-tag--purple">
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
    <div className="bru-form-stack">
      {/* First + Last name row */}
      <div className="bru-form-row">
        <div className="bru-field">
          <label className="bru-field__label" htmlFor="profile-first-name">
            First Name
          </label>
          <input
            id="profile-first-name"
            type="text"
            className="bru-input"
            value={profile.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div className="bru-field">
          <label className="bru-field__label" htmlFor="profile-last-name">
            Last Name
          </label>
          <input
            id="profile-last-name"
            type="text"
            className="bru-input"
            value={profile.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Company */}
      <div className="bru-field">
        <label className="bru-field__label" htmlFor="profile-company">
          Company
        </label>
        <input
          id="profile-company"
          type="text"
          className="bru-input"
          style={{ width: "100%" }}
          value={profile.companyName}
          onChange={(e) => onChange({ companyName: e.target.value })}
          placeholder="Company name"
        />
      </div>

      {/* Role */}
      <div className="bru-field">
        <label className="bru-field__label" htmlFor="profile-role">
          Role
        </label>
        <input
          id="profile-role"
          type="text"
          className="bru-input"
          style={{ width: "100%" }}
          value={profile.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Your role or job title"
        />
      </div>

      {/* Industry */}
      <div className="bru-field">
        <label className="bru-field__label" htmlFor="profile-industry">
          Industry
        </label>
        <input
          id="profile-industry"
          type="text"
          className="bru-input"
          style={{ width: "100%" }}
          value={profile.industry}
          onChange={(e) => onChange({ industry: e.target.value })}
          placeholder="e.g. Technology, Healthcare, Finance"
        />
      </div>

      {/* Audience */}
      <div className="bru-field">
        <label className="bru-field__label" htmlFor="profile-audience">
          Audience
        </label>
        <input
          id="profile-audience"
          type="text"
          className="bru-input"
          style={{ width: "100%" }}
          value={profile.audience.join(", ")}
          onChange={(e) => handleAudienceChange(e.target.value)}
          placeholder="Comma-separated, e.g. Founders, Marketers, CTOs"
        />
        <span
          style={{
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-grey)",
            fontFamily: "var(--bru-font-primary)",
          }}
        >
          Separate multiple audiences with commas
        </span>
      </div>
    </div>
  );
};

export default ProfileSection;
