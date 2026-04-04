/**
 * AuthContext.jsx
 * 
 * Mock auth layer — drop-in ready for Clerk.
 * 
 * TO INTEGRATE CLERK:
 * 1. npm install @clerk/clerk-react
 * 2. Wrap App in <ClerkProvider publishableKey={...}>
 * 3. Replace useAuth() calls with Clerk's useUser() / useAuth()
 * 4. Replace signIn / signOut / signUp with Clerk equivalents
 * 5. Remove this file
 * 
 * The AUTH_KEY in localStorage mimics a session token.
 * Real Clerk sessions are managed server-side and far more secure.
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const AUTH_KEY = "cc-auth-session";
const PROFILE_KEY = "cc-auth-profile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    try {
      const session = localStorage.getItem(AUTH_KEY);
      const profile = localStorage.getItem(PROFILE_KEY);
      if (session && profile) {
        setUser(JSON.parse(profile));
      }
    } catch {}
    setLoading(false);
  }, []);

  /**
   * signIn — mock login
   * Replace with: await signIn.create({ identifier: email, password })
   */
  const signIn = async ({ email, password }) => {
    // Mock: any email/password works
    const profile = {
      id: "mock-" + Date.now(),
      email,
      firstName: email.split("@")[0],
      displayName: email.split("@")[0],
      subscriptionTier: "pro",
      isNewUser: false,
      createdAt: new Date().toISOString(),
    };
    // Restore display name from account settings if set
    try {
      const stored = localStorage.getItem("cc-display-name");
      if (stored) profile.displayName = stored;
      const fullName = localStorage.getItem("cc-full-name");
      if (fullName) profile.firstName = fullName.split(" ")[0];
    } catch {}
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: "mock-token", expires: Date.now() + 86400000 * 30 }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  /**
   * signUp — mock registration
   * Replace with: await signUp.create({ emailAddress, password, firstName })
   */
  const signUp = async ({ email, password, firstName }) => {
    const displayName = firstName || email.split("@")[0];
    const profile = {
      id: "mock-" + Date.now(),
      email,
      firstName: displayName,
      displayName,
      subscriptionTier: "pro",
      isNewUser: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: "mock-token", expires: Date.now() + 86400000 * 30 }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem("cc-display-name", displayName);
    localStorage.setItem("cc-full-name", firstName || "");
    // Mark as new user — dismisses after first dashboard visit
    localStorage.removeItem("cc-onboarded");
    localStorage.setItem("cc-onboarding-step", "1"); // Start at step 1
    setUser(profile);
    return profile;
  };

  /**
   * signOut — clears session
   * Replace with: await signOut()
   */
  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setUser(null);
    window.location.href = "/";
  };

  /**
   * updateUser — update display name etc after account settings save
   */
  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(updated)); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
