"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Language } from "@/lib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const LOCAL_STORAGE_KEY = "ecb-language";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "es" || value === "pt";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const didHydrateFromProfile = useRef(false);
  const [localLanguage, setLocalLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "es";
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (isLanguage(stored)) {
      return stored;
    }
    return "es";
  });

  const persistLanguage = useCallback(
    async (nextLanguage: Language) => {
      if (!user || !supabaseConfigured()) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ native_language: nextLanguage })
        .eq("id", user.id);
      if (error) {
        console.error("Failed to save language preference", error.message);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!profile || !user) return;

    if (!didHydrateFromProfile.current && isLanguage(profile.native_language)) {
      didHydrateFromProfile.current = true;
      setLocalLanguage(profile.native_language);
      localStorage.setItem(LOCAL_STORAGE_KEY, profile.native_language);
      return;
    }

    if (!isLanguage(profile.native_language)) {
      void persistLanguage(localLanguage);
    }
  }, [localLanguage, persistLanguage, profile, user]);

  const language = localLanguage;

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setLocalLanguage(nextLanguage);
        localStorage.setItem(LOCAL_STORAGE_KEY, nextLanguage);
        void persistLanguage(nextLanguage);
      },
    }),
    [language, persistLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
