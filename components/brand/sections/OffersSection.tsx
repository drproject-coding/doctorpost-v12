"use client";
import React, { useState } from "react";
import { Button, Input } from "@doctorproject/react";
import { BrandProfile } from "@/lib/types";

interface OffersSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
}

const OffersSection: React.FC<OffersSectionProps> = ({
  profile,
  editing,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange({ offers: [...(profile.offers ?? []), trimmed] });
    setInputValue("");
  };

  const handleRemove = (index: number) => {
    const updated = (profile.offers ?? []).filter((_, i) => i !== index);
    onChange({ offers: updated });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const offers = profile.offers ?? [];

  if (!editing) {
    return (
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: "var(--drp-space-2)" }}
      >
        {offers.length === 0 ? (
          <span
            style={{
              color: "var(--drp-text-muted)",
              fontSize: "var(--drp-text-sm)",
              fontFamily: "var(--drp-font-primary)",
            }}
          >
            No offers added yet
          </span>
        ) : (
          offers.map((offer, i) => (
            <span
              key={i}
              style={{
                backgroundColor: "#FAE8A4",
                color: "var(--drp-black)",
                padding: "4px 12px",
                fontSize: "var(--drp-text-sm)",
                fontFamily: "var(--drp-font-primary)",
                fontWeight: "500",
                borderRadius: 0,
              }}
            >
              {offer}
            </span>
          ))
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--drp-space-3)",
      }}
    >
      {offers.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--drp-space-2)",
          }}
        >
          {offers.map((offer, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#FAE8A4",
                color: "var(--drp-black)",
                padding: "4px 10px",
                fontSize: "var(--drp-text-sm)",
                fontFamily: "var(--drp-font-primary)",
                fontWeight: "500",
                borderRadius: 0,
              }}
            >
              {offer}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${offer}`}
                style={{
                  padding: "0",
                  lineHeight: 1,
                  color: "var(--drp-black)",
                  fontWeight: "700",
                  fontSize: "14px",
                  minWidth: "auto",
                }}
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--drp-space-2)" }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an offer..."
          style={{ flex: 1 }}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default OffersSection;
