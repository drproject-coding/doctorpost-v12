"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const { checkSession } = useAuth();

  useEffect(() => {
    void checkSession().then(() => {
      router.replace("/dashboard");
    });
  }, [checkSession, router]);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "var(--drp-cream)" }}
    >
      <div className="flex items-center gap-2">
        <Loader size={24} className="animate-spin text-drp-purple" />
        <span className="font-medium">Authenticating...</span>
      </div>
    </div>
  );
}
