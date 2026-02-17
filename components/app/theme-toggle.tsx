"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-8 w-8 rounded-xl"
      onClick={toggleTheme}
      aria-label={copy.themeToggle}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
