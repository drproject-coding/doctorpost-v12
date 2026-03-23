"use client";
import React, { useState } from "react";
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {offers.length === 0 ? (
          <span
            style={{
              color: "var(--drp-muted, #888)",
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
                color: "#121212",
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--drp-text-sm)" }}>
      {offers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {offers.map((offer, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#FAE8A4",
                color: "#121212",
                padding: "4px 10px",
                fontSize: "var(--drp-text-sm)",
                fontFamily: "var(--drp-font-primary)",
                fontWeight: "500",
                borderRadius: 0,
              }}
            >
              {offer}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${offer}`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: 1,
                  color: "#121212",
                  fontWeight: "700",
                  fontSize: "var(--drp-text-md)",
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          className="drp-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an offer..."
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="drp-btn drp-btn--primary drp-btn--sm"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default OffersSection;
