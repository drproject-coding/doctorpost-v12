"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pictogram, type PictogramName } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { name: string; path: string; icon: PictogramName }[] = [
  { name: "Dashboard", path: "/dashboard", icon: "Layout" },
  { name: "Studio", path: "/studio", icon: "Video" },
  { name: "Create", path: "/create", icon: "Add" },
  { name: "Factory", path: "/factory", icon: "Apps" },
  { name: "Campaigns", path: "/campaigns", icon: "Hashtag" },
  { name: "Calendar", path: "/calendar", icon: "Time" },
  { name: "Knowledge", path: "/knowledge", icon: "Bookmark" },
  { name: "Learning", path: "/learning", icon: "Info" },
  { name: "Library", path: "/library", icon: "Folder" },
  { name: "Analytics", path: "/analytics", icon: "Analytics" },
  { name: "Brand", path: "/brand", icon: "Photo" },
  { name: "Settings", path: "/settings", icon: "Filters" },
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
                  <Pictogram name={item.icon} size={20} />
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
        <Pictogram
          name="Right"
          size={14}
          className={collapsed ? "rotate-0" : "rotate-180"}
        />
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
