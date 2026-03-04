"use client";

import EnhancedDropdown from "@/components/EnhancedDropdown";
import { enhancedPostTypes } from "@/lib/dropdownData";

interface PostTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

const PostTypeSelector = ({
  value,
  onChange,
  loading,
}: PostTypeSelectorProps) => {
  return (
    <EnhancedDropdown
      label="Post Type"
      options={enhancedPostTypes}
      value={value}
      onChange={onChange}
      loading={loading}
    />
  );
};

export default PostTypeSelector;
