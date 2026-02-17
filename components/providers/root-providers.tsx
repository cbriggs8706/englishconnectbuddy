"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProfileOnboardingGate } from "@/components/app/profile-onboarding-gate";
import { PwaRegister } from "@/components/app/pwa-register";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <PwaRegister />
          {children}
          <ProfileOnboardingGate />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
