"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProfileOnboardingGate } from "@/components/app/profile-onboarding-gate";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          {children}
          <ProfileOnboardingGate />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
