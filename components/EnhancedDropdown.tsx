"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Check,
  Info,
  XCircle,
  AlertTriangle,
  Book,
  BarChart,
  MessageSquare,
  Target,
  Sparkles,
  TrendingUp,
  Heart,
  UserCheck,
  Smile,
  BookOpen,
  Zap,
  Loader,
} from "lucide-react";
import { Button } from "@doctorproject/react";
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

const categoryIcons: Record<string, React.ReactNode> = {
  "Educational Content": <Book size={16} />,
  "Data-Driven Content": <BarChart size={16} />,
  "Engagement Content": <MessageSquare size={16} />,
  "Authority Content": <Target size={16} />,
  "Intrigue & Discovery": <Sparkles size={16} />,
  "Pain & Solution": <AlertTriangle size={16} />,
  "Credibility & Trust": <Check size={16} />,
  "Challenge & Debate": <XCircle size={16} />,
  "Expertise & Value": <Info size={16} />,
  "Learning & Guidance": <Book size={16} />,
  "Market & Future": <TrendingUp size={16} />,
  "Personal Wellbeing": <Heart size={16} />,
  "Proof & Results": <BarChart size={16} />,
  "Formal & Expert": <UserCheck size={16} />,
  "Informal & Engaging": <Smile size={16} />,
  Storytelling: <BookOpen size={16} />,
  "Emotional & Relatable": <Heart size={16} />,
  Visionary: <Zap size={16} />,
  "Niche & Specific": <Target size={16} />,
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
  let statusIcon: React.ReactNode = null;
  let statusLabel = "";

  switch (status) {
    case "recommended":
      statusClasses = "badge-compatibility-recommended";
      statusIcon = <Check size={12} />;
      statusLabel = "Recommended";
      break;
    case "caution":
      statusClasses = "badge-compatibility-caution";
      statusIcon = <AlertTriangle size={12} />;
      statusLabel = "Caution";
      break;
    case "not-recommended":
      statusClasses = "badge-compatibility-not-recommended";
      statusIcon = <XCircle size={12} />;
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
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
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
                          <Check size={14} className="text-drp-purple" />
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
          <Loader size={24} className="animate-spin text-drp-purple" />
        </div>
      )}
    </div>
  );
};

export default EnhancedDropdown;
