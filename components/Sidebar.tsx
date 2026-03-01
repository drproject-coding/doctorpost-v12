"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Book,
  BarChart2,
  Settings,
  ChevronLeft,
  Factory,
  Megaphone,
  BookOpen,
  Brain,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Create", path: "/create", icon: PenSquare },
  { name: "Factory", path: "/factory", icon: Factory },
  { name: "Campaigns", path: "/campaigns", icon: Megaphone },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Knowledge", path: "/knowledge", icon: BookOpen },
  { name: "Learning", path: "/learning", icon: Brain },
  { name: "Library", path: "/library", icon: Book },
  { name: "Analytics", path: "/analytics", icon: BarChart2 },
  { name: "Settings", path: "/settings", icon: Settings },
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
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`sidebar-nav-item${isActive ? " active" : ""}`}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={20} />
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
