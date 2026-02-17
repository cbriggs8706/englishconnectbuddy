"use client";

import { AppShell } from "@/components/app/app-shell";
import { GameCard } from "@/components/app/game-card";
import { HomeInstallPrompt } from "@/components/app/home-install-prompt";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default function Home() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user } = useAuth();
  const { courseStats } = useCourseProgress({ lessons, vocab, user });
  const activeCourse =
    courseStats.find((course) => course.wordPercent > 0 && course.wordPercent < 100) ??
    courseStats.find((course) => course.wordPercent < 100) ??
    courseStats[courseStats.length - 1];

  return (
    <AppShell title={copy.appName} subtitle={copy.tagline}>
      <HomeInstallPrompt />
      <Card className="border-lime-300 bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 text-white">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{copy.progress}</p>
            <Badge variant="secondary" className="rounded-full bg-white text-lime-700">
              {lessons.length} lessons
            </Badge>
          </div>
          <p className="text-sm text-lime-50">{copy.optionalLogin}</p>
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-lime-100">
                <span>{activeCourse ? `EC${activeCourse.level}` : copy.progress}</span>
                <span>
                  {activeCourse
                    ? `${Math.round(activeCourse.wordPercent)}% ${copy.masteredWords.toLowerCase()}`
                    : copy.noProgressYet}
                </span>
              </div>
              <Progress value={activeCourse?.wordPercent ?? 0} className="bg-white/20" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/profile">
                <Button size="sm" variant="secondary" className="bg-white text-lime-700 hover:bg-lime-100">
                  {copy.signUp}
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="secondary" className="bg-white text-lime-800 hover:bg-lime-100">
                  {copy.signIn}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <GameCard
          title={copy.flashcards}
          description={copy.homeFlashcardsDesc}
          href="/flashcards"
          tone="green"
          cta={copy.play}
        />
        <GameCard
          title={copy.matching}
          description={copy.homeMatchingDesc}
          href="/match"
          tone="blue"
          cta={copy.play}
        />
        <GameCard
          title={copy.unscramble}
          description={copy.homeUnscrambleDesc}
          href="/unscramble"
          tone="yellow"
          cta={copy.play}
        />
        <GameCard
          title="Live Quiz"
          description="Join teacher-led vocabulary challenges in real time."
          href="/quiz"
          tone="blue"
          cta={copy.play}
        />
      </section>

      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-violet-50 dark:from-sky-950/30 dark:to-violet-950/30">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">{copy.curriculum}</p>
          <p className="mt-1 text-sm text-sky-900/80 dark:text-sky-100/80">
            {vocab.length} {copy.vocabReady}
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
