import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SchedulePostModal from "../../components/SchedulePostModal";
import type { PostStatus } from "../../lib/types";

describe("SchedulePostModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSchedule = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <SchedulePostModal
        isOpen={false}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    expect(screen.queryByText("Schedule Post")).not.toBeInTheDocument();
  });

  it("renders modal with title and form elements when isOpen is true", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    expect(screen.getByText("Schedule Post")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders all status options in the select", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("To Review")).toBeInTheDocument();
    expect(screen.getByText("To Plan")).toBeInTheDocument();
    expect(screen.getByText("To Publish")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders cancel and schedule buttons", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    const closeButton = screen.getAllByRole("button")[1];
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("uses initialDate when provided", () => {
    const testDate = "2026-05-10";
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialDate={testDate}
      />,
    );

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    expect(dateInput.value).toBe(testDate);
  });

  it("uses initialStatus when provided", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialStatus="to-publish"
      />,
    );

    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.value).toBe("to-publish");
  });

  it("defaults to scheduled status when initialStatus is not provided", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />,
    );

    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.value).toBe("scheduled");
  });

  it("allows changing date and status inputs", () => {
    render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialDate="2026-03-15"
        initialStatus="draft"
      />,
    );

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;

    fireEvent.change(dateInput, { target: { value: "2026-04-20" } });
    fireEvent.change(statusSelect, { target: { value: "to-review" } });

    expect(dateInput.value).toBe("2026-04-20");
    expect(statusSelect.value).toBe("to-review");
  });

  it("resets fields when modal is reopened with new props", () => {
    const { rerender } = render(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialDate="2026-03-15"
        initialStatus="draft"
      />,
    );

    let dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    expect(dateInput.value).toBe("2026-03-15");

    // Close modal
    rerender(
      <SchedulePostModal
        isOpen={false}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialDate="2026-03-15"
        initialStatus="draft"
      />,
    );

    // Reopen with different values
    rerender(
      <SchedulePostModal
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
        initialDate="2026-06-20"
        initialStatus="published"
      />,
    );

    dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(dateInput.value).toBe("2026-06-20");
    expect(statusSelect.value).toBe("published");
  });
});
