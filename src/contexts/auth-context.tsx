"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, clearTokens } from "@/lib/api";

interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (phone: string) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone }),
      skipAuth: true,
    });

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
