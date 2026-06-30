"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AdminFrontendService from "@/app/frontendServices/admin.frontendService";
import type { SessionUser } from "../lib/hr.types";

interface AuthContextType {
  session: SessionUser | null;
  isAuthenticated: boolean;
  isCommander: boolean;
  isGodMode: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await AdminFrontendService.verifyToken();
      const valid = response.success && response.data?.isValid === true;
      setSession(valid ? response.data?.session || null : null);
    } catch (error) {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AdminFrontendService.logout();
    setSession(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isCommander: session?.role === "COMMANDER",
        isGodMode: session?.role === "GOD",
        isLoading,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
