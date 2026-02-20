"use client";

import { AppShell } from "@/components/app/app-shell";
import { Speak } from "@/components/app/speak";
import { useLanguage } from "@/components/providers/language-provider";
import { t } from "@/lib/i18n";
import { Language } from "@/lib/types";

const subtitleByLanguage: Record<Language, string> = {
  en: "Say the English word for each prompt.",
  es: "Di la palabra en inglés para cada pista.",
  pt: "Diga a palavra em inglês para cada pista.",
};

export default function SpeakPage() {
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <AppShell title={copy.speak} subtitle={subtitleByLanguage[language]}>
      <Speak />
    </AppShell>
  );
}
