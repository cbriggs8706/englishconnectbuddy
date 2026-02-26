"use client";

import { ConversationPatterns } from "@/components/app/conversation-patterns";
import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { t } from "@/lib/i18n";

export default function PatternsPage() {
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <AppShell title={copy.patterns}>
      <ConversationPatterns />
    </AppShell>
  );
}
