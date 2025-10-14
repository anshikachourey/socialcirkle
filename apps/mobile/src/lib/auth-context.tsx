// src/lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthChanged, signInEmail, signUpEmail, signOutUser, auth } from "@/lib/firebase";
import type { FirebaseAuthTypes } from "@/lib/firebase";

type AuthContextType = {
  user: FirebaseAuthTypes["User"] | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes["User"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp: AuthContextType["signUp"] = async (email, password) => {
    try {
      await signUpEmail(email, password);
      return null;
    } catch (e: any) {
      return e?.message ?? "An error occurred during sign up";
    }
  };

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    try {
      await signInEmail(email, password);
      return null;
    } catch (e: any) {
      return e?.message ?? "An error occurred during log in";
    }
  };

  const signOutFn: AuthContextType["signOut"] = async () => {
    await signOutUser();
    // onAuthChanged will set user=null; updating immediately helps UI
    setUser(auth.currentUser);
  };

  const value = useMemo(() => ({ user, loading, signUp, signIn, signOut: signOutFn }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
