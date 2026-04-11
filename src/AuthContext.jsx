/**
 * AuthContext.jsx — Mock auth layer
 *
 * Temporary stand-in until Clerk is integrated.
 * All routes are effectively public for cross-device testing.
 * Replace this file with the real Clerk-backed implementation
 * when Clerk + Supabase BAA is finalised.
 *
 * Exports:
 *   AuthProvider  — wraps the app, required by useAuth()
 *   useAuth       — returns { user, signUp, signIn, signOut, loading }
 */

import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Persist a mock session across page refreshes
    try {
      const stored = localStorage.getItem("cc-mock-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);

  const signUp = async ({ email, password, firstName } = {}) => {
    // Clerk integration point: replace with real SignUp flow
    const mockUser = { id: "mock-" + Date.now(), email, firstName: firstName || "" };
    setUser(mockUser);
    try { localStorage.setItem("cc-mock-user", JSON.stringify(mockUser)); } catch {}
    return mockUser;
  };

  const signIn = async ({ email } = {}) => {
    // Clerk integration point: replace with real SignIn flow
    const mockUser = { id: "mock-" + Date.now(), email };
    setUser(mockUser);
    try { localStorage.setItem("cc-mock-user", JSON.stringify(mockUser)); } catch {}
    return mockUser;
  };

  const signOut = async () => {
    // Clerk integration point: replace with real SignOut flow
    setUser(null);
    try { localStorage.removeItem("cc-mock-user"); } catch {}
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
