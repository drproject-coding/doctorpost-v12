"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Loader } from "@doctorproject/react";
import { getBrandProfile, updateBrandProfile } from "@/lib/api";
import type { BrandProfile } from "@/lib/types";

// --- Completeness ---

function isComplete(profile: BrandProfile, section: number): boolean {
  switch (section) {
    case 1:
      return !!(profile.firstName || profile.companyName) && !!profile.role;
    case 2:
      return profile.tones.length > 0;
    case 3:
      return !!profile.contentStrategy;
    case 4:
      return profile.audience.length > 0;
    case 5:
      return !!profile.positioning;
    default:
      return false;
  }
}

// --- Tag pill ---

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        border: `1.5px solid ${color}`,
        color,
        lineHeight: 1.5,
        marginRight: 6,
        marginBottom: 6,
        borderRadius: 0,
      }}
    >
      {label}
    </span>
  );
}

// --- Incomplete badge ---

function IncompleteBadge() {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        background: "#FEF3C7",
        color: "#92400E",
        border: "1.5px solid #F59E0B",
        letterSpacing: "0.04em",
        borderRadius: 0,
      }}
    >
      INCOMPLETE
    </span>
  );
}

// --- Complete badge ---

function CompleteBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        background: "#D1FAE5",
        color: "#065F46",
        border: "1.5px solid #10B981",
        letterSpacing: "0.04em",
        borderRadius: 0,
      }}
    >
      <Icon name="check" size="sm" />
      COMPLETE
    </span>
  );
}

// --- Section card ---

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  sectionIndex: number;
  complete: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}

function SectionCard({
  title,
  icon,
  accentColor,
  complete,
  onEdit,
  children,
}: SectionCardProps) {
  return (
    <div
      style={{
        border: "2px solid var(--drp-black)",
        borderLeft: `5px solid ${accentColor}`,
        borderRadius: 0,
        background: "white",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1.5px solid #E5E7EB",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: accentColor, display: "flex" }}>{icon}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "var(--drp-black)",
            }}
          >
            {title}
          </span>
          <span style={{ marginLeft: 8 }}>
            {complete ? <CompleteBadge /> : <IncompleteBadge />}
          </span>
        </div>
        <button
          onClick={onEdit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "1.5px solid var(--drp-black)",
            cursor: "pointer",
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--drp-black)",
            borderRadius: 0,
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--drp-cream)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <Icon name="edit" size="sm" />
          Edit
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

// --- Empty placeholder ---

function EmptyValue({ label }: { label: string }) {
  return (
    <span
      style={{
        color: "var(--drp-text-muted)",
        fontSize: 13,
        fontStyle: "italic",
      }}
    >
      {label}
    </span>
  );
}

// --- Row helper ---

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--drp-text-muted)",
          minWidth: 120,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{ fontSize: 13, color: "var(--drp-black)", lineHeight: 1.5 }}
      >
        {value || <EmptyValue label="Not set" />}
      </span>
    </div>
  );
}

// --- Main page ---

export default function OnboardingReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBrandProfile("")
      .then((p) => setProfile(p))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      await updateBrandProfile(profile);
      router.push("/studio");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: 10,
          color: "var(--drp-text-muted)",
          fontSize: 14,
        }}
      >
        <Loader size="sm" />
        Loading your profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ color: "var(--drp-text-muted)", fontSize: 14 }}>
          {error ?? "Could not load profile."}
        </p>
        <button
          onClick={() => router.push("/onboarding/wizard/1")}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--drp-purple)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ← Go to wizard
        </button>
      </div>
    );
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(22px, 4vw, 30px)",
            fontWeight: 800,
            color: "var(--drp-black)",
            lineHeight: 1.15,
          }}
        >
          Review your brand profile
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--drp-text-muted)",
            lineHeight: 1.5,
          }}
        >
          Check everything looks right before we get you started.
        </p>
      </div>

      {/* Section 1 — Identity */}
      <SectionCard
        title="Identity"
        icon={null}
        accentColor="#631DED"
        sectionIndex={1}
        complete={isComplete(profile, 1)}
        onEdit={() => router.push("/onboarding/wizard/1")}
      >
        <FieldRow label="Name" value={fullName} />
        <FieldRow label="Company" value={profile.companyName} />
        <FieldRow label="Role" value={profile.role} />
        <FieldRow label="Industry" value={profile.industry} />
      </SectionCard>

      {/* Section 2 — Voice & Tone */}
      <SectionCard
        title="Voice & Tone"
        icon={null}
        accentColor="#FF6C01"
        sectionIndex={2}
        complete={isComplete(profile, 2)}
        onEdit={() => router.push("/onboarding/wizard/2")}
      >
        {profile.tones.length > 0 ? (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Tones
            </div>
            <div>
              {profile.tones.map((t) => (
                <Tag key={t} label={t} color="#FF6C01" />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <EmptyValue label="No tones selected" />
          </div>
        )}

        {profile.taboos.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Taboos
            </div>
            <div>
              {profile.taboos.map((t) => (
                <Tag key={t} label={t} color="#6B7280" />
              ))}
            </div>
          </div>
        )}

        {profile.copyGuideline && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 4,
              }}
            >
              Copy Guideline
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--drp-black)",
                lineHeight: 1.6,
              }}
            >
              {profile.copyGuideline}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Section 3 — Content Strategy */}
      <SectionCard
        title="Content Strategy"
        icon={null}
        accentColor="#00A896"
        sectionIndex={3}
        complete={isComplete(profile, 3)}
        onEdit={() => router.push("/onboarding/wizard/3")}
      >
        {profile.contentStrategy ? (
          <div style={{ marginBottom: profile.definition ? 12 : 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 4,
              }}
            >
              Strategy
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--drp-black)",
                lineHeight: 1.6,
              }}
            >
              {profile.contentStrategy}
            </p>
          </div>
        ) : (
          <EmptyValue label="No content strategy defined" />
        )}

        {profile.definition && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 4,
              }}
            >
              Definition
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--drp-black)",
                lineHeight: 1.6,
              }}
            >
              {profile.definition}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Section 4 — Audience */}
      <SectionCard
        title="Audience"
        icon={<Icon name="users" size="sm" />}
        accentColor="#B45309"
        sectionIndex={4}
        complete={isComplete(profile, 4)}
        onEdit={() => router.push("/onboarding/wizard/4")}
      >
        {profile.audience.length > 0 ? (
          <div style={{ marginBottom: profile.offers.length > 0 ? 10 : 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Audience
            </div>
            <div>
              {profile.audience.map((a) => (
                <Tag key={a} label={a} color="#B45309" />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: profile.offers.length > 0 ? 10 : 0 }}>
            <EmptyValue label="No audience defined" />
          </div>
        )}

        {profile.offers.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--drp-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Offers
            </div>
            <div>
              {profile.offers.map((o) => (
                <Tag key={o} label={o} color="#6B7280" />
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Section 5 — Positioning */}
      <SectionCard
        title="Positioning"
        icon={null}
        accentColor="#E99898"
        sectionIndex={5}
        complete={isComplete(profile, 5)}
        onEdit={() => router.push("/onboarding/wizard/5")}
      >
        {profile.positioning ? (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--drp-black)",
              lineHeight: 1.6,
            }}
          >
            {profile.positioning}
          </p>
        ) : (
          <EmptyValue label="No positioning statement written yet" />
        )}
      </SectionCard>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 16px",
            background: "#FEF2F2",
            border: "1.5px solid #F87171",
            color: "#B91C1C",
            fontSize: 13,
            marginBottom: 16,
            borderRadius: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{
            borderRadius: 0,
            minWidth: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            padding: "12px 28px",
          }}
        >
          {saving ? (
            <>
              <Loader size="sm" />
              Saving…
            </>
          ) : (
            <>
              <Icon name="check" size="sm" />
              Save &amp; Start Creating
            </>
          )}
        </Button>

        <button
          onClick={() => router.push("/onboarding/wizard/5")}
          disabled={saving}
          style={{
            background: "none",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 13,
            color: "var(--drp-text-muted)",
            padding: "4px 0",
            transition: "color 0.12s",
            opacity: saving ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving)
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--drp-black)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--drp-text-muted)";
          }}
        >
          ← Go back to wizard
        </button>
      </div>
    </div>
  );
}
