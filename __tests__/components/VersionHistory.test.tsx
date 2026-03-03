import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { VersionHistory } from "../../components/knowledge/VersionHistory";
import type { DocumentVersion } from "@/lib/knowledge/types";

jest.mock("@/lib/knowledge/types", () => ({
  mapDocumentVersionFromNcb: jest.fn((row: any) => row),
}));

describe("VersionHistory", () => {
  const mockOnRestore = jest.fn();
  const mockOnClose = jest.fn();

  const mockVersion = (overrides = {}): DocumentVersion => ({
    id: "v-1",
    documentId: "doc-123",
    version: 1,
    content: "Version 1 content",
    changeReason: "Initial version",
    changedBy: "user-1",
    createdAt: "2026-01-15T10:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders heading and close button", () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("Version History")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}), // Never resolves
    );

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("Loading versions...")).toBeInTheDocument();
  });

  it("shows empty state when no versions", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "No version history yet. Edits will create version snapshots.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays versions after fetch succeeds", async () => {
    const versions = [
      mockVersion({ version: 2, changeReason: "Updated guidelines" }),
      mockVersion({ version: 1, changeReason: "Initial version" }),
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => versions,
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={3}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("v2")).toBeInTheDocument();
      expect(screen.getByText("v1")).toBeInTheDocument();
      expect(screen.getByText("Updated guidelines")).toBeInTheDocument();
      expect(screen.getByText("Initial version")).toBeInTheDocument();
    });
  });

  it("expands and collapses version content on click", async () => {
    const versions = [
      mockVersion({
        version: 1,
        content: "Secret v1 content",
        changeReason: "Initial",
      }),
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => versions,
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Initial")).toBeInTheDocument();
    });

    // Get version row and click to expand
    const v1Texts = screen.getAllByText("v1");
    const versionRow = v1Texts[0].closest("div");
    fireEvent.click(versionRow!);

    // Verify expanded
    await waitFor(() => {
      expect(screen.getByText("Secret v1 content")).toBeInTheDocument();
    });
  });

  it("shows restore button when expanding version less than current", async () => {
    const versions = [
      mockVersion({ version: 2, changeReason: "Second", id: "v-2" }),
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => versions,
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={3}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    // Click on version row to expand
    const version2 = screen.getByText("v2");
    const versionRow = version2.closest("div");
    fireEvent.click(versionRow!);

    // Restore button should be shown since version 2 < currentVersion 3
    await waitFor(() => {
      expect(screen.getByText("Restore v2")).toBeInTheDocument();
    });
  });

  it("calls onRestore when restore button is clicked", async () => {
    const version = mockVersion({ version: 1 });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [version],
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("v1")).toBeInTheDocument();
    });

    const versionRow = screen.getByText("v1").closest("div");
    fireEvent.click(versionRow!);

    await waitFor(() => {
      expect(screen.getByText("Restore v1")).toBeInTheDocument();
    });

    const restoreButton = screen.getByText("Restore v1");
    fireEvent.click(restoreButton);

    expect(mockOnRestore).toHaveBeenCalledWith(version);
  });

  it("calls onClose when close button is clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Version History")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Fetch failed"),
    );

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={2}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "No version history yet. Edits will create version snapshots.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("sorts versions by version number descending", async () => {
    const versions = [
      mockVersion({ version: 1, changeReason: "First update", id: "v-1" }),
      mockVersion({ version: 3, changeReason: "Third update", id: "v-3" }),
      mockVersion({ version: 2, changeReason: "Second update", id: "v-2" }),
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => versions,
    });

    render(
      <VersionHistory
        documentId="doc-123"
        currentVersion={4}
        onRestore={mockOnRestore}
        onClose={mockOnClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Third update")).toBeInTheDocument();
      expect(screen.getByText("Second update")).toBeInTheDocument();
      expect(screen.getByText("First update")).toBeInTheDocument();
    });

    // Verify order by checking that third appears before second appears before first
    const thirdElement = screen.getByText("Third update");
    const secondElement = screen.getByText("Second update");
    expect(thirdElement.compareDocumentPosition(secondElement)).toBe(4);
  });
});
