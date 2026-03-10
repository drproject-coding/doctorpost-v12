"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@doctorproject/react";
import { Upload, Wand2 } from "lucide-react";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

function OptionCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: OptionCardProps) {
  return (
    <div
      style={{
        border: "2px solid var(--drp-black)",
        borderRadius: 0,
        padding: "32px 28px",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        backgroundColor: "var(--drp-cream)",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f0ece4";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor =
          "var(--drp-cream)";
      }}
      onClick={onClick}
    >
      <div style={{ color: "var(--drp-purple)" }}>{icon}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--drp-black)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "var(--drp-grey)",
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>
      <div>
        <Button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onClick();
          }}
          style={{ borderRadius: 0, width: "100%" }}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingStartPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--drp-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "780px",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 800,
              color: "var(--drp-black)",
              lineHeight: 1.15,
            }}
          >
            Let&apos;s build your brand profile
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              color: "var(--drp-grey)",
              lineHeight: 1.5,
            }}
          >
            Choose how you&apos;d like to set up your brand.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <OptionCard
            icon={<Upload size={32} />}
            title="Upload brand files"
            description="Have existing brand docs? Upload PDFs, DOCX or text files and we'll extract your brand profile automatically."
            buttonLabel="Upload files"
            onClick={() => router.push("/onboarding/upload")}
          />
          <OptionCard
            icon={<Wand2 size={32} />}
            title="Build with the wizard"
            description="Answer a few questions to set up your brand profile step by step. Takes about 5 minutes."
            buttonLabel="Start wizard"
            onClick={() => router.push("/onboarding/wizard/1")}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--drp-grey)",
              padding: "4px 0",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--drp-black)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--drp-grey)";
            }}
          >
            Skip for now &rarr;
          </button>
        </div>
      </div>
    </main>
  );
}
