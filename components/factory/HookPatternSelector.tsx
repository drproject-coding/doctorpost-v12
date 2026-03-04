"use client";

import React from "react";
import EnhancedDropdown from "@/components/EnhancedDropdown";
import { enhancedHookPatterns } from "@/lib/dropdownData";

interface HookPatternSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

const HookPatternSelector: React.FC<HookPatternSelectorProps> = ({
  value,
  onChange,
  loading,
}) => {
  return (
    <EnhancedDropdown
      label="Hook Pattern"
      options={enhancedHookPatterns}
      value={value}
      onChange={onChange}
      loading={loading}
    />
  );
};

export default HookPatternSelector;
