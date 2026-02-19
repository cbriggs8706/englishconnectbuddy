"use client";

import { AppShell } from "@/components/app/app-shell";
import { Hearing } from "@/components/app/hearing";
import { useLanguage } from "@/components/providers/language-provider";
import { t } from "@/lib/i18n";

export default function HearingPage() {
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <AppShell title={copy.hearing} subtitle={copy.hearingSubtitle}>
      <Hearing />
    </AppShell>
  );
}
