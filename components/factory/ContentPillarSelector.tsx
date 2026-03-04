"use client";

import EnhancedDropdown from "@/components/EnhancedDropdown";
import { enhancedContentPillars } from "@/lib/dropdownData";

interface ContentPillarSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export default function ContentPillarSelector({
  value,
  onChange,
  loading,
}: ContentPillarSelectorProps) {
  return (
    <EnhancedDropdown
      label="Content Pillar"
      options={enhancedContentPillars}
      value={value}
      onChange={onChange}
      loading={loading}
    />
  );
}
