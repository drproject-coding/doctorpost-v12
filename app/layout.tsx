import type { Metadata } from "next";
import type React from "react";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoctorPost - LinkedIn Post Generator",
  description: "AI-powered LinkedIn post creation and scheduling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "var(--drp-font-primary)",
          background: "var(--drp-cream)",
          color: "var(--drp-black)",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
