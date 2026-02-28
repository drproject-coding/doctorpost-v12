"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: SessionUser | null;
  loadingAuth: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: SessionUser };
        if (data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          return;
        }
      }
      setUser(null);
      setIsLoggedIn(false);
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setUser(null);
    setIsLoggedIn(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, loadingAuth, checkSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
