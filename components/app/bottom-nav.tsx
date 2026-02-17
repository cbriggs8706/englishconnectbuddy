"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { BookOpenText, ChartNoAxesColumn, Home, Layers, Shuffle, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";

const nav = [
  { href: "/", key: "home", icon: Home },
  { href: "/progress", key: "progress", icon: ChartNoAxesColumn },
  { href: "/flashcards", key: "flashcards", icon: Layers },
  { href: "/match", key: "matching", icon: Shuffle },
  { href: "/quiz", key: "liveQuiz", icon: Trophy },
  { href: "/dictionary", key: "dictionary", icon: BookOpenText },
  { href: "/profile", key: "profile", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl border-t bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="grid grid-cols-7 gap-1 px-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const label = item.key === "liveQuiz" ? "Quiz" : copy[item.key];
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
