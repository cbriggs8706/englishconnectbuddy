"use client";

import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { getLocalDay, recordStreakLogin } from "@/lib/streak";
import { Profile } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  async function refreshProfile() {
    if (!supabaseConfigured()) {
      setProfile(null);
      setUser(null);
      return;
    }

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;
    setUser(currentUser ?? null);

    if (!currentUser) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, real_name, last_name, nickname, selected_course, native_language, is_admin")
      .eq("id", currentUser.id)
      .maybeSingle();

    setProfile((data as Profile | null) ?? null);
  }

  useEffect(() => {
    if (!supabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const timer = setTimeout(() => {
      void refreshProfile();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user: user ?? null,
      profile: profile ?? null,
      loading:
        supabaseConfigured() &&
        (user === undefined || (user !== null && profile === undefined)),
      refreshProfile,
    }),
    [user, profile]
  );

  useEffect(() => {
    if (!user || !supabaseConfigured() || typeof window === "undefined") return;

    const day = getLocalDay();
    const cacheKey = `ecb-streak-login:${user.id}:${day}`;
    if (localStorage.getItem(cacheKey) === "1") return;

    void recordStreakLogin().finally(() => {
      localStorage.setItem(cacheKey, "1");
    });
  }, [user?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
