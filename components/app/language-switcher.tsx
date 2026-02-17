"use client";

import { Button } from "@/components/ui/button";
import { languageNames, t } from "@/lib/i18n";
import { Language } from "@/lib/types";
import { useLanguage } from "@/components/providers/language-provider";
import { Languages } from "lucide-react";

const languages: Language[] = ["es", "en", "pt"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const copy = t(language);
  const currentIndex = languages.indexOf(language);
  const nextLanguage = languages[(currentIndex + 1) % languages.length];

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={`${copy.selectLanguage}: ${languageNames[language]}. Next: ${languageNames[nextLanguage]}`}
      className="h-9 rounded-full border border-border/70 bg-card/90 px-3 shadow-sm"
    >
      <Languages className="mr-1.5 h-3.5 w-3.5" />
      {languageNames[language]}
    </Button>
  );
}
