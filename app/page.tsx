"use client";

import { AppShell } from "@/components/app/app-shell";
import { GameCard } from "@/components/app/game-card";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";

export default function Home() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user } = useAuth();

  return (
    <AppShell title={copy.appName} subtitle={copy.tagline}>
      <Card className="border-lime-300 bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 text-white">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{copy.progress}</p>
            <Badge variant="secondary" className="rounded-full bg-white text-lime-700">
              {lessons.length} lessons
            </Badge>
          </div>
          <p className="text-sm text-lime-50">{copy.optionalLogin}</p>
          <p className="text-xs text-lime-100">
            {user ? copy.progressActive : copy.continueGuest}
          </p>
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
