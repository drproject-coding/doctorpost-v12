"use client";
import React from "react";
import EnhancedDropdown from "@/components/EnhancedDropdown";
import { enhancedToneOptions } from "@/lib/dropdownData";

interface ToneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

const ToneSelector: React.FC<ToneSelectorProps> = ({
  value,
  onChange,
  loading,
}) => {
  return (
    <EnhancedDropdown
      label="Tone"
      options={enhancedToneOptions}
      value={value}
      onChange={onChange}
      loading={loading}
    />
  );
};

export default ToneSelector;
