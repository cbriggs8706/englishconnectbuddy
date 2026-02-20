"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { resolveVocabMediaUrl } from "@/lib/media";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { recordStreakActivity } from "@/lib/streak";
import {
  applyRating,
  loadGuestProgress,
  progressKey,
  Rating,
  saveGuestProgress,
} from "@/lib/spaced-repetition";
import { FlashcardMode, FlashcardProgress } from "@/lib/types";
import { Headphones, Settings, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StudyStage = "review" | "learn";

export default function FlashcardsPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [mode, setMode] = useState<FlashcardMode>("image-audio");
  const [studyStage, setStudyStage] = useState<StudyStage>("review");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isApplyingRating, setIsApplyingRating] = useState(false);
  const [failedImageSrcs, setFailedImageSrcs] = useState<Record<string, true>>({});
  const [dbProgressMap, setDbProgressMap] = useState<Record<string, FlashcardProgress>>({});
  const [guestProgressMap, setGuestProgressMap] = useState(loadGuestProgress());
  const { defaultLessonId } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse,
  });

  const activeLesson = selectedLesson || defaultLessonId || "all";
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );
  const visibleLessonIds = useMemo(
    () => new Set(visibleLessons.map((lesson) => lesson.id)),
    [visibleLessons]
  );
  const courseVocab = useMemo(() => {
    const inCourse = !selectedCourse
      ? vocab
      : vocab.filter((item) => visibleLessonIds.has(item.lesson_id));

    return inCourse.filter(
      (item) => (item.item_type ?? "").trim().toLowerCase() === "word"
    );
  }, [selectedCourse, visibleLessonIds, vocab]);

  useEffect(() => {
    if (!user || !supabaseConfigured()) return;
    const userId = user.id;

    async function loadDbProgress() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_flashcard_progress")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const map: Record<string, FlashcardProgress> = {};
        for (const row of data) {
          map[row.vocab_id] = row as FlashcardProgress;
        }
        setDbProgressMap(map);
      }
    }

    void loadDbProgress();
  }, [user]);

  function getProgress(vocabId: string) {
    if (user) {
      return dbProgressMap[vocabId] ?? null;
    }

    const key = progressKey(vocabId);
    const guest = guestProgressMap[key];
    if (!guest) return null;

    return {
      id: key,
      user_id: "guest",
      vocab_id: vocabId,
      streak_count: guest.streakCount,
      review_count: guest.reviewCount,
      mastered: guest.mastered,
      due_at: guest.dueAt,
      last_reviewed_at: guest.lastReviewedAt,
    } satisfies FlashcardProgress;
  }

  const decks = useMemo(() => {
    const now = new Date();

    const due = courseVocab.filter((item) => {
      const progress = getProgress(item.id);
      if (!progress || progress.mastered) return false;
      return new Date(progress.due_at) <= now;
    });

    const fresh = courseVocab.filter((item) => !getProgress(item.id));

    if (activeLesson === "all") {
      return {
        due,
        fresh,
        freshSelected: fresh,
        freshSpillover: [] as typeof fresh,
        learnDeck: fresh,
      };
    }

    const freshSelected = fresh.filter((item) => item.lesson_id === activeLesson);
    const freshSpillover = fresh.filter((item) => item.lesson_id !== activeLesson);

    return {
      due,
      fresh,
      freshSelected,
      freshSpillover,
      learnDeck: [...freshSelected, ...freshSpillover],
    };
  }, [activeLesson, courseVocab, dbProgressMap, guestProgressMap, user]);

  useEffect(() => {
    if (decks.due.length === 0 && studyStage === "review") {
      setIndex(0);
      setFlipped(false);
    }
  }, [decks.due.length, studyStage]);

  const activeDeck = studyStage === "review" ? decks.due : decks.learnDeck;

  useEffect(() => {
    if (index < activeDeck.length) return;
    setIndex(0);
    setFlipped(false);
  }, [activeDeck.length, index]);

  const current = activeDeck[index] ?? null;
  const currentProgress = current ? getProgress(current.id) : null;
  const isFirstExposure = Boolean(current && !currentProgress);

  const progressLabel = activeDeck.length > 0
    ? `${Math.min(index + 1, activeDeck.length)} / ${activeDeck.length}`
    : "0 / 0";

  function resetCardPosition() {
    setIndex(0);
    setFlipped(false);
  }

  function startSession(stage: StudyStage) {
    setStudyStage(stage);
    setSessionStarted(true);
    setSettingsOpen(false);
    resetCardPosition();
  }

  function exitSession() {
    setSessionStarted(false);
    setSettingsOpen(false);
    resetCardPosition();
  }

  function translationForLanguage() {
    if (!current) return "";
    if (language === "es") return current.spanish_text;
    if (language === "pt") return current.portuguese_text;
    return current.english_text;
  }

  function playAudio() {
    const src = resolveVocabMediaUrl(current?.audio_url);
    if (!src) return;
    const audio = new Audio(src);
    void audio.play();
  }

  function renderImage() {
    const src = resolveVocabMediaUrl(current?.image_url);
    if (!src || failedImageSrcs[src]) return null;

    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/20 p-4">
        <img
          src={src}
          alt={current?.english_text || copy.flashcards}
          className="h-full w-full object-contain"
          onError={() =>
            setFailedImageSrcs((prev) =>
              prev[src] ? prev : { ...prev, [src]: true }
            )
          }
        />
      </div>
    );
  }

  function renderAudioIcon() {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-20 w-20 rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            playAudio();
          }}
          aria-label={`${copy.play} ${copy.audio}`}
        >
          <Headphones className="h-10 w-10" />
        </Button>
      </div>
    );
  }

  function renderText() {
    return (
      <div className="space-y-3 text-center">
        <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{current?.english_text}</p>
        {current?.english_sentence ? (
          <p className="text-base text-muted-foreground sm:text-lg">{current.english_sentence}</p>
        ) : null}
      </div>
    );
  }

  function renderTranslation() {
    return (
      <div className="space-y-3 text-center">
        <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{translationForLanguage()}</p>
        <p className="text-base font-semibold text-muted-foreground">{language.toUpperCase()}</p>
      </div>
    );
  }

  function frontContent() {
    if (mode === "image-audio" || mode === "image-text") {
      const image = renderImage();
      if (image) return image;
      return renderText();
    }
    if (mode === "audio-text") return renderAudioIcon();
    return renderText();
  }

  function backContent() {
    if (mode === "image-audio") return renderAudioIcon();
    if (mode === "image-text" || mode === "audio-text") return renderText();
    return renderTranslation();
  }

  async function applyReview(rating: Rating) {
    if (!current || !flipped || isApplyingRating) return;

    const activeCard = current;
    const existing = getProgress(activeCard.id);
    const next = applyRating(existing, rating);
    const becameMastered = !Boolean(existing?.mastered) && next.mastered;

    setIsApplyingRating(true);
    setFlipped(false);

    try {
      if (user && supabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("user_flashcard_progress").upsert(
          {
            user_id: user.id,
            vocab_id: activeCard.id,
            ...next,
          },
          { onConflict: "user_id,vocab_id" }
        );

        setDbProgressMap((prev) => ({
          ...prev,
          [activeCard.id]: {
            id: prev[activeCard.id]?.id ?? `${activeCard.id}`,
            user_id: user.id,
            vocab_id: activeCard.id,
            ...next,
          },
        }));

        void recordStreakActivity({
          activityType: "flashcards",
          vocabId: activeCard.id,
          becameMastered,
        });
      } else {
        const key = progressKey(activeCard.id);
        setGuestProgressMap((prev) => {
          const updatedGuest = {
            ...prev,
            [key]: {
              vocabId: activeCard.id,
              streakCount: next.streak_count,
              reviewCount: next.review_count,
              mastered: next.mastered,
              dueAt: next.due_at,
              lastReviewedAt: next.last_reviewed_at,
            },
          };
          saveGuestProgress(updatedGuest);
          return updatedGuest;
        });
      }

      setIndex((prev) => prev + 1);
    } finally {
      setIsApplyingRating(false);
    }
  }

  return (
    <AppShell title={copy.flashcards}>
      {!sessionStarted ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <Select
              value={activeLesson}
              onValueChange={(value) => {
                setSelectedLesson(value);
                resetCardPosition();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={copy.lesson} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allLessons}</SelectItem>
                {visibleLessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lessonLabel(lesson, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={mode}
              onValueChange={(value) => {
                setMode(value as FlashcardMode);
                resetCardPosition();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={copy.cardMode} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image-audio">{copy.modeImageAudio}</SelectItem>
                <SelectItem value="image-text">{copy.modeImageText}</SelectItem>
                <SelectItem value="audio-text">{copy.modeAudioText}</SelectItem>
                <SelectItem value="text-translation">{copy.modeTextTranslation}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">{copy.dueCount}: {decks.due.length}</Badge>
              <Badge variant="secondary" className="text-sm">{copy.newCount}: {decks.fresh.length}</Badge>
            </div>

            {decks.due.length > 0 ? (
              <div className="space-y-3">
                <p className="text-base text-muted-foreground">{copy.reviewAcrossLessons}</p>
                <Button type="button" className="w-full text-base" onClick={() => startSession("review")}>
                  {copy.reviewSession}
                </Button>
                <Button type="button" variant="secondary" className="w-full text-base" onClick={() => startSession("learn")}>
                  {copy.skipReview}
                </Button>
              </div>
            ) : (
              <Button type="button" className="w-full text-base" onClick={() => startSession("learn")}>
                {copy.startLearningNew}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex h-[calc(100dvh-14.5rem)] min-h-[34rem] flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={exitSession}
              aria-label={copy.exitStudy}
            >
              <X className="h-7 w-7" />
            </Button>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">{progressLabel}</p>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-label={copy.settings}
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${activeDeck.length === 0 ? 0 : (Math.min(index + 1, activeDeck.length) / activeDeck.length) * 100}%` }}
            />
          </div>

          {settingsOpen ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <Select
                  value={activeLesson}
                  onValueChange={(value) => {
                    setSelectedLesson(value);
                    resetCardPosition();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={copy.lesson} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{copy.allLessons}</SelectItem>
                    {visibleLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lessonLabel(lesson, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as FlashcardMode);
                    resetCardPosition();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={copy.cardMode} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image-audio">{copy.modeImageAudio}</SelectItem>
                    <SelectItem value="image-text">{copy.modeImageText}</SelectItem>
                    <SelectItem value="audio-text">{copy.modeAudioText}</SelectItem>
                    <SelectItem value="text-translation">{copy.modeTextTranslation}</SelectItem>
                  </SelectContent>
                </Select>

                {decks.due.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={studyStage === "review" ? "default" : "secondary"}
                      onClick={() => startSession("review")}
                    >
                      {copy.reviewSession}
                    </Button>
                    <Button
                      type="button"
                      variant={studyStage === "learn" ? "default" : "secondary"}
                      onClick={() => startSession("learn")}
                    >
                      {copy.learnSession}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!current ? (
            <Card className="flex-1">
              <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {studyStage === "review" ? copy.reviewComplete : copy.noData}
                </p>
                {studyStage === "review" ? (
                  <Button type="button" className="w-full" onClick={() => startSession("learn")}>
                    {copy.startLearningNew}
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" className="w-full" onClick={exitSession}>
                    {copy.exitStudy}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label={flipped ? copy.showFront : copy.flipCard}
                className="flashcard-scene flashcard-scene-immersive w-full min-h-0 flex-1 cursor-pointer"
                onClick={() => {
                  if (isApplyingRating) return;
                  setFlipped((prev) => !prev);
                }}
                onKeyDown={(event) => {
                  if (isApplyingRating) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlipped((prev) => !prev);
                  }
                }}
              >
                <div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
                  <div className="flashcard-face flashcard-front">{frontContent()}</div>
                  <div className="flashcard-face flashcard-back">{backContent()}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pb-2">
                <Button
                  disabled={!flipped || isApplyingRating}
                  variant="secondary"
                  className="h-14 text-base font-bold"
                  onClick={() => void applyReview("weak")}
                >
                  {copy.ratingKeepInDeck}
                </Button>
                <Button
                  disabled={!flipped || isApplyingRating}
                  variant="secondary"
                  className="h-14 text-base font-bold"
                  onClick={() => void applyReview("improving")}
                >
                  {copy.ratingKindOf}
                </Button>
                <Button
                  disabled={!flipped || isApplyingRating}
                  className="h-14 text-base font-bold"
                  onClick={() => void applyReview("strong")}
                >
                  {copy.ratingGotIt}
                </Button>
              </div>

              {isFirstExposure ? (
                <Button
                  disabled={!flipped || isApplyingRating}
                  className="w-full"
                  onClick={() => void applyReview("master-now")}
                >
                  {copy.masterNow}
                </Button>
              ) : null}

              <p
                className={`min-h-6 text-center text-sm font-semibold text-muted-foreground transition-opacity ${
                  flipped ? "opacity-0" : "opacity-100"
                }`}
              >
                {copy.flipToRate}
              </p>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
