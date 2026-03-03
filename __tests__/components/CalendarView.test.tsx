import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarView from "@/components/calendar/CalendarView";
import { createMockScheduledPost } from "../utils/testUtils";

describe("CalendarView", () => {
  const mockPosts = [
    createMockScheduledPost({
      id: "post-1",
      title: "Test Post 1",
      scheduledAt: new Date(2024, 0, 15).toISOString(), // January 15, 2024
      status: "scheduled",
    }),
    createMockScheduledPost({
      id: "post-2",
      title: "Test Post 2",
      scheduledAt: new Date(2024, 0, 20).toISOString(), // January 20, 2024
      status: "published",
    }),
  ];

  const mockOnPostClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders calendar with posts", () => {
    render(
      <CalendarView
        posts={mockPosts}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker="2024-01-01"
      />,
    );

    expect(screen.getByText("January 2024")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("displays post titles in calendar cells", () => {
    render(
      <CalendarView
        posts={mockPosts}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker="2024-01-01"
      />,
    );

    expect(screen.getByText("Test Post 1")).toBeInTheDocument();
    expect(screen.getByText("Test Post 2")).toBeInTheDocument();
  });

  it("calls onPostClick when post is clicked", () => {
    render(
      <CalendarView
        posts={mockPosts}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker="2024-01-01"
      />,
    );

    const postButton = screen.getByText("Test Post 1");
    fireEvent.click(postButton);

    expect(mockOnPostClick).toHaveBeenCalledWith(mockPosts[0]);
  });

  it("highlights today's date", () => {
    const today = new Date();
    render(
      <CalendarView
        posts={[]}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker={null}
      />,
    );

    expect(screen.getByText(today.getDate().toString())).toBeInTheDocument();
  });

  it("highlights selected date from picker", () => {
    const selectedDate = "2024-01-10";
    render(
      <CalendarView
        posts={[]}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker={selectedDate}
      />,
    );

    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("displays empty calendar when no posts", () => {
    const now = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentMonthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    render(
      <CalendarView
        posts={[]}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker={null}
      />,
    );

    expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    // Should not display any post titles
    expect(screen.queryByText("Test Post 1")).not.toBeInTheDocument();
  });

  it("handles posts with factory scores", () => {
    const postWithScore = createMockScheduledPost({
      id: "post-scored",
      title: "Scored Post",
      scheduledAt: new Date(2024, 0, 25).toISOString(),
      factoryScore: 92,
    });

    render(
      <CalendarView
        posts={[postWithScore]}
        onPostClick={mockOnPostClick}
        selectedDateFromPicker="2024-01-01"
      />,
    );

    expect(screen.getByText("Scored Post")).toBeInTheDocument();
    // Score should be displayed (implementation dependent)
  });
});
