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
      variant="secondary"
      size="icon"
      className="h-10 w-10 rounded-xl border-0 bg-linear-to-r from-fuchsia-500 to-violet-500 text-white hover:from-fuchsia-500/90 hover:to-violet-500/90"
      onClick={toggleTheme}
      aria-label={copy.themeToggle}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
