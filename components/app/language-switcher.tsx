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
      className="h-10 rounded-full border-0 bg-linear-to-r from-cyan-500 to-blue-500 px-4 text-white shadow-sm hover:from-cyan-500/90 hover:to-blue-500/90"
    >
      <Languages className="mr-1.5 h-4 w-4" />
      {languageNames[language]}
    </Button>
  );
}
