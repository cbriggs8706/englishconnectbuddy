"use client";

import { AppShell } from "@/components/app/app-shell";
import { ConversationBuddy } from "@/components/app/conversation-buddy";
import { useLanguage } from "@/components/providers/language-provider";

const titleByLanguage: Record<string, string> = {
  en: "Conversation Buddy",
  es: "Conversation Buddy",
  pt: "Conversation Buddy",
  sw: "Conversation Buddy",
  chk: "Conversation Buddy",
};

export default function ConversationPage() {
  const { language } = useLanguage();
  const title = titleByLanguage[language] ?? titleByLanguage.en;

  return (
    <AppShell title={title}>
      <ConversationBuddy />
    </AppShell>
  );
}
