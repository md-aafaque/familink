"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabaseClient";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log("[Initial Session]", session);

        setSession(session);
        setUser(session?.user ?? null);

        if (session) {
          localStorage.setItem("token", session.access_token);
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("[InitializeAuth Error]", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth Event]", event);

      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (session) {
          localStorage.setItem("token", session.access_token);

          // Sync user with backend
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            await api.post(
              "/auth/sync",
              {},
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
            );
          }
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("[Auth Sync] Failed:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      localStorage.removeItem("token");

      setUser(null);
      setSession(null);

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("[SignOut Error]", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};