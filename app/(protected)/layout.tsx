"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout, Loader, Button } from "@doctorproject/react";
import type {
  SidebarNavSection,
  SidebarTeamMember,
} from "@doctorproject/react";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Book,
  BarChart2,
  Settings,
  Factory,
  Megaphone,
  BookOpen,
  Brain,
  Palette,
  Clapperboard,
  Plus,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  { id: "studio", label: "Studio", icon: Clapperboard, path: "/studio" },
  { id: "create", label: "Create", icon: PenSquare, path: "/create" },
  { id: "factory", label: "Factory", icon: Factory, path: "/factory" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, path: "/campaigns" },
  { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, path: "/knowledge" },
  { id: "learning", label: "Learning", icon: Brain, path: "/learning" },
  { id: "library", label: "Library", icon: Book, path: "/library" },
  { id: "analytics", label: "Analytics", icon: BarChart2, path: "/analytics" },
  { id: "brand", label: "Brand", icon: Palette, path: "/brand" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/studio": "Studio",
  "/create": "Create Post",
  "/factory": "Factory",
  "/campaigns": "Campaigns",
  "/calendar": "Calendar",
  "/knowledge": "Knowledge",
  "/learning": "Learning",
  "/library": "Library",
  "/analytics": "Analytics",
  "/brand": "Brand",
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/subscription": "Subscription",
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loadingAuth, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loadingAuth && !isLoggedIn) {
      router.push("/login");
    }
  }, [loadingAuth, isLoggedIn, router]);

  if (loadingAuth || !isLoggedIn) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--drp-cream)",
        }}
      >
        <Loader />
      </div>
    );
  }

  const sidebarSections: SidebarNavSection[] = [
    {
      label: "Main",
      items: NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        icon: <item.icon size={20} />,
        active: pathname === item.path || pathname.startsWith(item.path + "/"),
        onClick: () => router.push(item.path),
      })),
    },
  ];

  const teamMembers: SidebarTeamMember[] = user
    ? [
        {
          name: user.name ?? "User",
          initials: (user.name ?? "U").charAt(0).toUpperCase(),
          avatar: user.image ?? undefined,
        },
      ]
    : [];

  const pageTitle =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ??
    "DoctorPost";

  const topBarActions = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--drp-space-2)",
      }}
    >
      <Button
        variant="primary"
        size="sm"
        onClick={() => router.push("/create")}
        iconLeft={<Plus size={16} />}
      >
        Create Post
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label="Sign out"
        onClick={() => void logout()}
      >
        <LogOut size={18} />
      </Button>
    </div>
  );

  return (
    <ToastProvider>
      <ConfirmProvider>
        <DashboardLayout
          sidebarProps={{
            brandName: "DoctorPost",
            sections: sidebarSections,
            teamMembers,
            teamLabel: "Account",
          }}
          topBarProps={{
            title: pageTitle,
            menuButton: true,
            actions: topBarActions,
          }}
        >
          <div className="container" style={{ padding: "var(--drp-space-6)" }}>
            {children}
          </div>
        </DashboardLayout>
      </ConfirmProvider>
    </ToastProvider>
  );
}
