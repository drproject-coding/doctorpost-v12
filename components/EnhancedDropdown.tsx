"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button, Loader } from "@doctorproject/react";
import {
  DropdownOption,
  CompatibilityMap,
  CompatibilityStatus,
} from "@/lib/types";

interface EnhancedDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compatibilityMap?: CompatibilityMap; // Map of option IDs to their compatibility status
  loading?: boolean;
}

const categoryIcons: Record<string, string> = {
  "Educational Content": "◈",
  "Data-Driven Content": "◈",
  "Engagement Content": "◈",
  "Authority Content": "◈",
  "Intrigue & Discovery": "✦",
  "Pain & Solution": "⚠",
  "Credibility & Trust": "✓",
  "Challenge & Debate": "✕",
  "Expertise & Value": "◈",
  "Learning & Guidance": "◈",
  "Market & Future": "↗",
  "Personal Wellbeing": "◈",
  "Proof & Results": "◈",
  "Formal & Expert": "◈",
  "Informal & Engaging": "◈",
  Storytelling: "◈",
  "Emotional & Relatable": "◈",
  Visionary: "⚡",
  "Niche & Specific": "◈",
};

// PerformanceBadge removed — performance claims were inaccurate

// Helper for compatibility badges
const CompatibilityBadge: React.FC<{
  status?: CompatibilityStatus;
  reason?: string;
}> = ({ status, reason }) => {
  if (!status || status === "neutral") return null;

  const baseClasses = "text-xs font-bold py-0.5 px-1.5 border ml-1";
  let statusClasses = "";
  let statusIcon: string = "";
  let statusLabel = "";

  switch (status) {
    case "recommended":
      statusClasses = "badge-compatibility-recommended";
      statusIcon = "✓";
      statusLabel = "Recommended";
      break;
    case "caution":
      statusClasses = "badge-compatibility-caution";
      statusIcon = "⚠";
      statusLabel = "Caution";
      break;
    case "not-recommended":
      statusClasses = "badge-compatibility-not-recommended";
      statusIcon = "✕";
      statusLabel = "Not Recommended";
      break;
  }

  return (
    <div className="relative group">
      <span className={`${baseClasses} ${statusClasses} flex items-center`}>
        {statusIcon} {statusLabel}
      </span>
      {reason && (
        <div className="enhanced-dropdown-tooltip hidden group-hover:block">
          <p>{reason}</p>
        </div>
      )}
    </div>
  );
};

const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  compatibilityMap = {},
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setActiveFilters([]);
  };

  const handleFilterToggle = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const filteredOptions = useMemo(() => {
    let filtered = options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (activeFilters.includes("trending")) {
      filtered = filtered.filter((opt) => opt.isTrending);
    }
    if (activeFilters.includes("recommended")) {
      filtered = filtered.filter(
        (opt) => compatibilityMap[opt.id]?.status === "recommended",
      );
    }

    const grouped: Record<string, DropdownOption[]> = {};
    filtered.forEach((option) => {
      if (!grouped[option.category]) {
        grouped[option.category] = [];
      }
      grouped[option.category].push(option);
    });
    return grouped;
  }, [options, searchTerm, activeFilters, compatibilityMap]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterTags = [
    { id: "all", label: "All", filter: "" },
    { id: "trending", label: "Trending 🔥", filter: "trending" },
    { id: "recommended", label: "Recommended ✅", filter: "recommended" },
  ];

  return (
    <div className="enhanced-dropdown-container" ref={dropdownRef}>
      <label htmlFor={`dropdown-${label}`} className="drp-field__label">
        {label}
      </label>
      {/* Keep raw button — DS Button would override the drp-input dropdown trigger styling */}
      <button
        id={`dropdown-${label}`}
        type="button"
        className="enhanced-dropdown-trigger drp-input"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={loading}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.category &&
                categoryIcons[selectedOption.category] && (
                  <span
                    className="shrink-0"
                    style={{ color: "var(--drp-grey)" }}
                  >
                    {categoryIcons[selectedOption.category]}
                  </span>
                )}
              <span className="truncate">{selectedOption.label}</span>
              <CompatibilityBadge
                status={compatibilityMap[selectedOption.id]?.status}
                reason={compatibilityMap[selectedOption.id]?.reason}
              />
            </>
          ) : (
            <span style={{ color: "var(--drp-grey)" }}>{placeholder}</span>
          )}
        </span>
        <span
          style={{
            display: "inline-block",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 200ms",
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="enhanced-dropdown-content">
          <div className="enhanced-dropdown-search">
            {/* Keep raw input — DS Input wrapper would break the custom dropdown layout */}
            <input
              type="text"
              placeholder="Search options..."
              className="drp-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={`Search ${label} options`}
            />
          </div>
          <div className="enhanced-dropdown-filters">
            {/* Keep raw button — DS Button would override filter tag chip styling */}
            {filterTags.map((tag) => (
              <button
                key={tag.id}
                className={`enhanced-dropdown-filter-tag ${activeFilters.includes(tag.filter) || (tag.id === "all" && activeFilters.length === 0) ? "active" : ""}`}
                onClick={() =>
                  tag.id === "all"
                    ? setActiveFilters([])
                    : handleFilterToggle(tag.filter)
                }
              >
                {tag.label}
              </button>
            ))}
          </div>
          {Object.keys(filteredOptions).length === 0 ? (
            <div
              style={{
                padding: "var(--drp-space-3)",
                textAlign: "center",
                color: "var(--drp-grey)",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              No options found.
            </div>
          ) : (
            Object.entries(filteredOptions).map(([category, optionsInCat]) => (
              <div key={category}>
                <div className="enhanced-dropdown-category-header flex items-center gap-1.5">
                  {categoryIcons[category] && (
                    <span style={{ color: "var(--drp-text-muted)" }}>
                      {categoryIcons[category]}
                    </span>
                  )}
                  <span>{category}</span>
                </div>
                {optionsInCat.map((option) => (
                  <div
                    key={option.id}
                    className={`enhanced-dropdown-option ${option.value === value ? "selected" : ""}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <div className="enhanced-dropdown-option-content">
                      <span className="shrink-0 w-4">
                        {option.value === value && (
                          <span style={{ color: "var(--drp-purple)" }}>✓</span>
                        )}
                      </span>
                      <span className="flex-1 text-sm leading-tight">
                        {option.label}
                      </span>
                      <div className="shrink-0 flex items-center gap-1">
                        {option.isTrending && (
                          <span className="text-xs text-orange-500">🔥</span>
                        )}
                        <CompatibilityBadge
                          status={compatibilityMap[option.id]?.status}
                          reason={compatibilityMap[option.id]?.reason}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {loading && (
        <div className="recommendation-loading">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default EnhancedDropdown;
