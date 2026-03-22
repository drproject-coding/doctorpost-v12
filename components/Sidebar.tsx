"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Pictogram } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", pictogram: "Apps" as const },
  { name: "Studio", path: "/studio", pictogram: "Video" as const },
  { name: "Create", path: "/create", pictogram: "Add" as const },
  { name: "Factory", path: "/factory", pictogram: "Layout" as const },
  { name: "Campaigns", path: "/campaigns", pictogram: "Message" as const },
  { name: "Calendar", path: "/calendar", pictogram: "Time" as const },
  { name: "Knowledge", path: "/knowledge", pictogram: "Bookmark" as const },
  { name: "Learning", path: "/learning", pictogram: "Info" as const },
  { name: "Library", path: "/library", pictogram: "Folder" as const },
  { name: "Analytics", path: "/analytics", pictogram: "Analytics" as const },
  { name: "Brand", path: "/brand", pictogram: "Photo" as const },
  { name: "Settings", path: "/settings", pictogram: "Filters" as const },
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
                  <Pictogram name={item.pictogram} size={28} aria-hidden />
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
        <ChevronLeft size={14} />
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
