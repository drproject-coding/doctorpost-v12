"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, Plus, LogOut } from "lucide-react";
import Link from "next/link";
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
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
        <button
          onClick={() => void logout()}
          className="topbar-icon-btn"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
        <Link href="/create">
          <button className="topbar-create-btn">
            <Plus size={18} />
            <span>Create Post</span>
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
