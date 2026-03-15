"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

type NavItem =
  | {
      name: string;
      path: string;
      dsIcon: "dashboard" | "analytics" | "settings" | "calendar" | "edit";
      emoji?: never;
    }
  | {
      name: string;
      path: string;
      emoji: string;
      dsIcon?: never;
    };

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", dsIcon: "dashboard" },
  { name: "Studio", path: "/studio", emoji: "▶" },
  { name: "Create", path: "/create", dsIcon: "edit" },
  { name: "Factory", path: "/factory", emoji: "⚙" },
  { name: "Campaigns", path: "/campaigns", emoji: "◎" },
  { name: "Calendar", path: "/calendar", dsIcon: "calendar" },
  { name: "Knowledge", path: "/knowledge", emoji: "⊕" },
  { name: "Learning", path: "/learning", emoji: "◈" },
  { name: "Library", path: "/library", emoji: "⊞" },
  { name: "Analytics", path: "/analytics", dsIcon: "analytics" },
  { name: "Brand", path: "/brand", emoji: "◇" },
  { name: "Settings", path: "/settings", dsIcon: "settings" },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">DoctorPost</span>
        <span className="sidebar-brand-dot" />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-label">Main</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`sidebar-nav-item${isActive ? " active" : ""}`}
              >
                <span className="sidebar-nav-icon">
                  {item.dsIcon ? (
                    <Icon name={item.dsIcon} size="md" />
                  ) : (
                    <span style={{ fontSize: "var(--drp-text-md)" }}>
                      {item.emoji}
                    </span>
                  )}
                </span>
                <span className="sidebar-nav-text">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toggle */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label="Toggle sidebar"
      >
        ‹
      </button>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.image ? (
            <img src={user.image} alt={user?.name ?? "User"} />
          ) : (
            initials
          )}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name ?? "User"}</div>
          <div className="sidebar-user-role">Free Plan</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
