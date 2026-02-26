"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  AudioLines,
  BookOpen,
  ChartNoAxesColumn,
  ClipboardList,
  Hash,
  Home,
  Layers,
  Menu,
  Mic,
  Shuffle,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { Language } from "@/lib/types";

const primaryNav = [
  { href: "/", key: "home", icon: Home },
  { href: "/flashcards", key: "flashcards", icon: Layers },
  { href: "/match", key: "matching", icon: Shuffle },
  { href: "/quiz", key: "liveQuiz", icon: Trophy },
] as const;

const priorityPollLabelByLanguage: Record<Language, string> = {
  en: "Priority Poll",
  es: "Encuesta de prioridades",
  pt: "Enquete de prioridades",
  sw: "Priority Poll",
  chk: "Priority Poll",
};

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy = t(language);
  const [menuOpen, setMenuOpen] = useState(false);

  const activityLinks = useMemo(
    () => [
      { href: "/alphabet", label: copy.alphabet, icon: BookOpen },
      { href: "/numbers", label: copy.numbers, icon: Hash },
      { href: "/hearing", label: copy.hearing, icon: AudioLines },
      {
        href: "/speak",
        label: copy.speak,
        icon: Mic,
      },
      { href: "/flashcards", label: copy.flashcards, icon: Layers },
      { href: "/match", label: copy.matching, icon: Shuffle },
      { href: "/unscramble", label: copy.unscramble, icon: BookOpen },
      { href: "/patterns", label: copy.patterns, icon: BookOpen },
      { href: "/quiz", label: copy.liveQuiz, icon: Trophy },
      { href: "/dictionary", label: copy.dictionary, icon: BookOpen },
      { href: "/confidence-poll", label: "Confidence Poll", icon: ClipboardList },
      { href: "/priority-poll", label: priorityPollLabelByLanguage[language], icon: ClipboardList },
      { href: "/progress", label: copy.progress, icon: ChartNoAxesColumn },
      { href: "/leaderboard", label: copy.leaderboard, icon: Trophy },
      { href: "/volunteer", label: copy.volunteer, icon: Users },
      { href: "/profile", label: copy.profile, icon: UserRound },
    ],
    [copy, language]
  );

  const moreActive =
    !primaryNav.some((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) &&
    activityLinks.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 mx-auto max-w-xl bg-slate-900/45 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close activities menu"
            className="h-full w-full"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t-2 border-sky-200 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl">
            <p className="text-lg font-black tracking-wide text-slate-900">{copy.allActivities}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {activityLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex min-h-16 items-center gap-3 rounded-2xl px-4 text-base font-extrabold transition-colors",
                        active
                          ? "bg-linear-to-r from-emerald-500 to-cyan-500 text-white shadow-sm"
                          : "bg-sky-100 text-slate-800 hover:bg-sky-200"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl border-t-2 border-sky-200/80 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <ul className={cn("grid grid-cols-5 gap-1 px-2")}>
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const label = copy[item.key];
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-bold transition-colors",
                    active
                      ? "bg-linear-to-r from-emerald-500 to-cyan-500 text-white shadow-sm"
                      : "text-slate-500 hover:bg-sky-50"
                  )}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center rounded-2xl text-xs font-bold transition-colors",
                moreActive ? "bg-linear-to-r from-emerald-500 to-cyan-500 text-white shadow-sm" : "text-slate-500 hover:bg-sky-50"
              )}
            >
              <Menu className="mb-1 h-4 w-4" />
              {copy.more}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
