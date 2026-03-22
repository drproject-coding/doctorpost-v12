"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";

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
        <button className="topbar-menu-btn" onClick={onToggleSidebar}>
          <Icon name="more" size="sm" />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn">
          <Icon name="bell" size="sm" />
          <span className="notification-dot" />
        </button>
        <button
          onClick={() => void logout()}
          className="topbar-icon-btn"
          title="Sign out"
        >
          <Icon name="arrow-right" size="sm" />
        </button>
        <Link href="/create">
          <button className="topbar-create-btn">
            <Icon name="plus" size="sm" />
            <span>Create Post</span>
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
