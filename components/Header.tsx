"use client";

import React from "react";
import { usePathname } from "next/navigation";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@doctorproject/react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/create": "Create Post",
  "/calendar": "Calendar",
  "/library": "Library",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const title = pageTitles[pathname] || "DoctorPost";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Button
          variant="ghost"
          icon
          aria-label="Toggle menu"
          onClick={onToggleSidebar}
          className="topbar-menu-btn"
        >
          ☰
        </Button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <Button
          variant="ghost"
          icon
          aria-label="Notifications"
          className="topbar-icon-btn"
        >
          ◉
          <span className="notification-dot" />
        </Button>
        <Button
          variant="ghost"
          icon
          aria-label="Sign out"
          onClick={() => void logout()}
          className="topbar-icon-btn"
          title="Sign out"
        >
          ⎋
        </Button>
        <Link href="/create">
          <Button variant="primary" size="sm">
            + Create Post
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
