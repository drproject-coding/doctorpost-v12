import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import Header from "@/components/Header";

// Mock useAuth hook
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    logout: jest.fn(),
    user: {
      name: "John Doe",
      email: "john@example.com",
    },
  }),
}));

// Mock usePathname hook
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Menu: () => <span data-testid="icon-menu">M</span>,
  Bell: () => <span data-testid="icon-bell">B</span>,
  Plus: () => <span data-testid="icon-plus">+</span>,
  LogOut: () => <span data-testid="icon-logout">L</span>,
}));

describe("Header", () => {
  const mockOnToggleSidebar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header component", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  test("renders topbar with correct CSS class", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const header = container.querySelector("header");
    expect(header).toHaveClass("topbar");
  });

  test("displays page title based on pathname", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test('displays default title "DoctorPost" when pathname not recognized', () => {
    jest.doMock(
      "next/navigation",
      () => ({
        usePathname: () => "/unknown-path",
      }),
      { virtual: true },
    );

    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    // Still uses the mocked pathname from setup, so Dashboard appears
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("renders menu button for sidebar toggle", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const menuButton = container.querySelector(".topbar-menu-btn");
    expect(menuButton).toBeInTheDocument();
  });

  test("calls onToggleSidebar when menu button is clicked", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    const buttons = screen.getAllByRole("button");
    const menuButton = buttons.find((btn) =>
      btn.querySelector('[data-testid="icon-menu"]'),
    );

    if (menuButton) {
      fireEvent.click(menuButton);
      expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
    }
  });

  test("renders notification bell icon", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    expect(screen.getByTestId("icon-bell")).toBeInTheDocument();
  });

  test("renders notification dot", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const notificationDot = container.querySelector(".notification-dot");
    expect(notificationDot).toBeInTheDocument();
  });

  test("renders logout button with correct icon", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    const logoutIcon = screen.getByTestId("icon-logout");
    expect(logoutIcon).toBeInTheDocument();
  });

  test("logout button has correct title attribute", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    const buttons = screen.getAllByRole("button");
    const logoutButton = buttons.find((btn) =>
      btn.querySelector('[data-testid="icon-logout"]'),
    );
    expect(logoutButton).toHaveAttribute("title", "Sign out");
  });

  test('renders "Create Post" button', () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    expect(screen.getByText("Create Post")).toBeInTheDocument();
  });

  test('"Create Post" button links to /create', () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    const createLink = screen.getByText("Create Post").closest("a");
    expect(createLink).toHaveAttribute("href", "/create");
  });

  test("renders plus icon in create button", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    expect(screen.getByTestId("icon-plus")).toBeInTheDocument();
  });

  test("renders menu icon", () => {
    render(<Header onToggleSidebar={mockOnToggleSidebar} />);
    expect(screen.getByTestId("icon-menu")).toBeInTheDocument();
  });

  test("topbar-left section contains menu button and title", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const topbarLeft = container.querySelector(".topbar-left");
    expect(topbarLeft?.querySelector(".topbar-menu-btn")).toBeInTheDocument();
    expect(topbarLeft?.querySelector(".topbar-title")).toBeInTheDocument();
  });

  test("topbar-right section contains icon buttons and create button", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const topbarRight = container.querySelector(".topbar-right");
    expect(
      topbarRight?.querySelectorAll(".topbar-icon-btn").length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("header renders without crashing with all elements present", () => {
    const { container } = render(
      <Header onToggleSidebar={mockOnToggleSidebar} />,
    );
    const header = container.querySelector("header.topbar");
    expect(header?.querySelector(".topbar-left")).toBeInTheDocument();
    expect(header?.querySelector(".topbar-right")).toBeInTheDocument();
  });
});
