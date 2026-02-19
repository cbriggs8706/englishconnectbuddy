"use client";

import { AppShell } from "@/components/app/app-shell";
import { ConversationPractice } from "@/components/app/conversation-practice";
import { useLanguage } from "@/components/providers/language-provider";
import { Language } from "@/lib/types";

const titleByLanguage: Record<Language, string> = {
  en: "Conversation",
  es: "Conversación",
  pt: "Conversa",
};

export default function ConversationPage() {
  const { language } = useLanguage();
  return (
    <AppShell title={titleByLanguage[language]}>
      <ConversationPractice />
    </AppShell>
  );
}
