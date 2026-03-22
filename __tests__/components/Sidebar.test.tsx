import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import Sidebar from "@/components/Sidebar";

// Mock useAuth hook
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      name: "John Doe",
      email: "john@example.com",
      image: null,
    },
  }),
}));

// Mock usePathname hook (already mocked in jest.setup.tsx but we'll ensure it's working)
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

describe("Sidebar", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders sidebar component", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const sidebar = document.querySelector("aside");
    expect(sidebar).toBeInTheDocument();
  });

  test('displays brand name "DoctorPost"', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText("DoctorPost")).toBeInTheDocument();
  });

  test("displays user name from auth context", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test('displays plan information "Free Plan"', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText("Free Plan")).toBeInTheDocument();
  });

  test("displays user initials when no image provided", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const avatar = document.querySelector(".sidebar-avatar");
    expect(avatar).toHaveTextContent("J");
  });

  test("renders navigation items", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Factory")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("applies collapsed class when collapsed prop is true", () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={mockOnToggle} />,
    );
    const sidebar = container.querySelector("aside");
    expect(sidebar).toHaveClass("collapsed");
  });

  test("does not apply collapsed class when collapsed prop is false", () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />,
    );
    const sidebar = container.querySelector("aside");
    expect(sidebar).not.toHaveClass("collapsed");
  });

  test("calls onToggle callback when toggle button is clicked", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const toggleButton = screen.getByLabelText("Toggle sidebar");
    fireEvent.click(toggleButton);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  test("toggle button calls onToggle multiple times on multiple clicks", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const toggleButton = screen.getByLabelText("Toggle sidebar");

    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(3);
  });

  test("marks Dashboard as active when pathname matches", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("active");
  });

  test('renders navigation section label "Main"', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  test("navigation items have proper href attributes", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("Create").closest("a")).toHaveAttribute(
      "href",
      "/create",
    );
    expect(screen.getByText("Factory").closest("a")).toHaveAttribute(
      "href",
      "/factory",
    );
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  test("renders toggle button with chevron icon", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    const chevronIcon = screen.getByTestId("icon-chevron");
    expect(chevronIcon).toBeInTheDocument();
  });

  test("renders all navigation icons", () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByTestId("icon-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("icon-create")).toBeInTheDocument();
    expect(screen.getByTestId("icon-factory")).toBeInTheDocument();
    expect(screen.getByTestId("icon-campaigns")).toBeInTheDocument();
  });
});
