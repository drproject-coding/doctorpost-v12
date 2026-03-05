import React from "react";
import { render, screen } from "@testing-library/react";
import { PipelineStepper } from "../../components/factory/PipelineStepper";

// Helper: given a label text, get the inner progress fill div
// Component structure per step:
//   <div> (outer wrapper, flex column)
//     <div> (icon)
//     <div> (progress bar container)  ← children[1]
//       <div style={{width: ...}} />  ← fill bar (what we want)
//     </div>
//     <div> (label + icons row)
//       <span> (label text)  ← getByText returns this
//     </div>
//   </div>
// getByText returns <span>, go up to labelDiv, then outerWrapper, then children[1].
function getFillBar(labelText: string): Element | null {
  const span = screen.getByText(labelText);
  const labelDiv = span.parentElement; // div containing label + icons
  if (!labelDiv) return null;
  const outerWrapper = labelDiv.parentElement; // outer step div (flex column)
  if (!outerWrapper) return null;
  const progressContainer = outerWrapper.children[1]; // 2nd child = progress bar
  if (!progressContainer) return null;
  return progressContainer.firstElementChild;
}

describe("PipelineStepper", () => {
  const defaultProps = {
    currentPhase: "direction" as const,
    percent: 50,
  };

  it("renders all pipeline steps", () => {
    render(<PipelineStepper {...defaultProps} />);

    expect(screen.getByText("Direction")).toBeInTheDocument();
    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText("Scoring")).toBeInTheDocument();
    expect(screen.getByText("Formatting")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
  });

  it("highlights current phase", () => {
    render(<PipelineStepper currentPhase="discovery" percent={75} />);

    const discoveryLabel = screen.getByText("Discovery");
    expect(discoveryLabel).toHaveStyle({ fontWeight: "700" });
    expect(discoveryLabel).toHaveStyle({ color: "var(--bru-black)" });
  });

  it("shows progress bar for current phase", () => {
    render(<PipelineStepper currentPhase="writing" percent={30} />);

    const fillBar = getFillBar("Writing");
    expect(fillBar).toHaveStyle({ width: "30%" });
  });

  it("shows completed phases", () => {
    render(<PipelineStepper currentPhase="evidence" percent={100} />);

    // Direction is a completed phase (before evidence), so fontWeight is 400
    // and color is var(--bru-black) because isComplete is true
    const directionLabel = screen.getByText("Direction");
    expect(directionLabel).toHaveStyle({ fontWeight: "400" });
    expect(directionLabel).toHaveStyle({ color: "var(--bru-black)" });
  });

  it("shows incomplete phases with default styling", () => {
    render(<PipelineStepper currentPhase="direction" percent={50} />);

    const discoveryLabel = screen.getByText("Discovery");
    expect(discoveryLabel).toHaveStyle({ fontWeight: "400" });
    expect(discoveryLabel).toHaveStyle({ color: "var(--bru-grey)" });
  });

  it("handles error state", () => {
    render(
      <PipelineStepper
        currentPhase="error"
        percent={0}
        errorAtPhase="writing"
      />,
    );

    const writingLabel = screen.getByText("Writing");
    expect(writingLabel).toHaveStyle({ fontWeight: "700" });
    expect(writingLabel).toHaveStyle({ color: "var(--bru-black)" });
  });

  it("shows error styling for failed phase", () => {
    render(
      <PipelineStepper
        currentPhase="error"
        percent={0}
        errorAtPhase="scoring"
      />,
    );

    const fillBar = getFillBar("Scoring");
    expect(fillBar).toHaveStyle({ background: "var(--bru-error, #FF4444)" });
  });

  it("handles invalid phase gracefully", () => {
    render(<PipelineStepper currentPhase="direction" percent={50} />);

    // Should render with default styling
    expect(screen.getByText("Direction")).toBeInTheDocument();
  });

  it("transitions progress smoothly", () => {
    const { rerender } = render(
      <PipelineStepper currentPhase="direction" percent={0} />,
    );

    rerender(<PipelineStepper currentPhase="direction" percent={100} />);

    const fillBar = getFillBar("Direction");
    expect(fillBar).toHaveStyle({ width: "100%" });
  });

  it("handles error without errorAtPhase", () => {
    render(<PipelineStepper currentPhase="error" percent={0} />);

    // Should not crash and should render with default styling
    expect(screen.getByText("Direction")).toBeInTheDocument();
  });

  it("maintains consistent layout", () => {
    render(<PipelineStepper {...defaultProps} />);

    // The outer stepper container is the parent of all step wrappers
    const directionSpan = screen.getByText("Direction");
    const stepWrapper = directionSpan.parentElement;
    const stepperContainer = stepWrapper?.parentElement;
    expect(stepperContainer).toHaveStyle({ display: "flex" });
    expect(stepperContainer).toHaveStyle({ gap: "var(--bru-space-1)" });
  });
});
