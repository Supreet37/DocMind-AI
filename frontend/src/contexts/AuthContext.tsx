import React, { createContext, useContext, useState, useEffect } from "react";

type Plan = "Free" | "Pro" | "Team";

export interface User {
  name: string;
  email: string;
  plan: Plan;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("docmind_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    if (user) {
      localStorage.setItem("docmind_user", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("docmind_user");
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const continueAsGuest = () => {
    setUser({
      name: "Guest User",
      email: "guest@example.com",
      plan: "Free",
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, continueAsGuest }}>
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
