"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loadingAuth } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !isLoggedIn) {
      router.push("/login");
    }
  }, [loadingAuth, isLoggedIn, router]);

  if (loadingAuth || !isLoggedIn) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--bru-cream)" }}
      >
        <Loader
          size={32}
          className="animate-spin"
          style={{ color: "var(--bru-purple)" }}
        />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="main-content">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="content">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
