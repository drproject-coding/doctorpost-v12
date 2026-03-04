import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock EnhancedDropdown to avoid rendering the full complex component
jest.mock("@/components/EnhancedDropdown", () => {
  const MockEnhancedDropdown = ({
    label,
    options,
    value,
    onChange,
    loading,
  }: {
    label: string;
    options: { id: string; value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
  }) => (
    <div data-testid={`dropdown-${label}`}>
      <label>{label}</label>
      {loading && <span data-testid="loading-indicator">Loading...</span>}
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
  MockEnhancedDropdown.displayName = "MockEnhancedDropdown";
  return { __esModule: true, default: MockEnhancedDropdown };
});

import PostTypeSelector from "@/components/factory/PostTypeSelector";
import HookPatternSelector from "@/components/factory/HookPatternSelector";
import ContentPillarSelector from "@/components/factory/ContentPillarSelector";
import ToneSelector from "@/components/factory/ToneSelector";
import {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";

describe("PostTypeSelector", () => {
  it("renders with correct label", () => {
    render(<PostTypeSelector value="" onChange={jest.fn()} />);
    expect(screen.getByText("Post Type")).toBeInTheDocument();
  });

  it("passes options from enhancedPostTypes", () => {
    render(<PostTypeSelector value="" onChange={jest.fn()} />);
    const select = screen.getByTestId("select-Post Type") as HTMLSelectElement;
    expect(select.options.length).toBe(enhancedPostTypes.length);
  });

  it("calls onChange when selection changes", () => {
    const handleChange = jest.fn();
    render(<PostTypeSelector value="" onChange={handleChange} />);
    const select = screen.getByTestId("select-Post Type");
    fireEvent.change(select, { target: { value: enhancedPostTypes[1].value } });
    expect(handleChange).toHaveBeenCalledWith(enhancedPostTypes[1].value);
  });

  it("passes loading prop", () => {
    render(<PostTypeSelector value="" onChange={jest.fn()} loading={true} />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("reflects current value", () => {
    const firstValue = enhancedPostTypes[0].value;
    render(<PostTypeSelector value={firstValue} onChange={jest.fn()} />);
    const select = screen.getByTestId("select-Post Type") as HTMLSelectElement;
    expect(select.value).toBe(firstValue);
  });
});

describe("HookPatternSelector", () => {
  it("renders with correct label", () => {
    render(<HookPatternSelector value="" onChange={jest.fn()} />);
    expect(screen.getByText("Hook Pattern")).toBeInTheDocument();
  });

  it("passes options from enhancedHookPatterns", () => {
    render(<HookPatternSelector value="" onChange={jest.fn()} />);
    const select = screen.getByTestId(
      "select-Hook Pattern",
    ) as HTMLSelectElement;
    expect(select.options.length).toBe(enhancedHookPatterns.length);
  });

  it("calls onChange when selection changes", () => {
    const handleChange = jest.fn();
    render(<HookPatternSelector value="" onChange={handleChange} />);
    const select = screen.getByTestId("select-Hook Pattern");
    fireEvent.change(select, {
      target: { value: enhancedHookPatterns[0].value },
    });
    expect(handleChange).toHaveBeenCalledWith(enhancedHookPatterns[0].value);
  });

  it("passes loading prop", () => {
    render(
      <HookPatternSelector value="" onChange={jest.fn()} loading={true} />,
    );
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});

describe("ContentPillarSelector", () => {
  it("renders with correct label", () => {
    render(<ContentPillarSelector value="" onChange={jest.fn()} />);
    expect(screen.getByText("Content Pillar")).toBeInTheDocument();
  });

  it("passes options from enhancedContentPillars", () => {
    render(<ContentPillarSelector value="" onChange={jest.fn()} />);
    const select = screen.getByTestId(
      "select-Content Pillar",
    ) as HTMLSelectElement;
    expect(select.options.length).toBe(enhancedContentPillars.length);
  });

  it("calls onChange when selection changes", () => {
    const handleChange = jest.fn();
    render(<ContentPillarSelector value="" onChange={handleChange} />);
    const select = screen.getByTestId("select-Content Pillar");
    fireEvent.change(select, {
      target: { value: enhancedContentPillars[0].value },
    });
    expect(handleChange).toHaveBeenCalledWith(enhancedContentPillars[0].value);
  });

  it("passes loading prop", () => {
    render(
      <ContentPillarSelector value="" onChange={jest.fn()} loading={true} />,
    );
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});

describe("ToneSelector", () => {
  it("renders with correct label", () => {
    render(<ToneSelector value="" onChange={jest.fn()} />);
    expect(screen.getByText("Tone")).toBeInTheDocument();
  });

  it("passes options from enhancedToneOptions", () => {
    render(<ToneSelector value="" onChange={jest.fn()} />);
    const select = screen.getByTestId("select-Tone") as HTMLSelectElement;
    expect(select.options.length).toBe(enhancedToneOptions.length);
  });

  it("calls onChange when selection changes", () => {
    const handleChange = jest.fn();
    render(<ToneSelector value="" onChange={handleChange} />);
    const select = screen.getByTestId("select-Tone");
    fireEvent.change(select, {
      target: { value: enhancedToneOptions[0].value },
    });
    expect(handleChange).toHaveBeenCalledWith(enhancedToneOptions[0].value);
  });

  it("passes loading prop", () => {
    render(<ToneSelector value="" onChange={jest.fn()} loading={true} />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});
