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
import {
  applyRating,
  loadGuestProgress,
  progressKey,
  Rating,
  saveGuestProgress,
} from "@/lib/spaced-repetition";
import { FlashcardMode, FlashcardProgress } from "@/lib/types";
import { Headphones } from "lucide-react";
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
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
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
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/30 p-2">
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
          className="h-16 w-16 rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            playAudio();
          }}
          aria-label={`${copy.play} ${copy.audio}`}
        >
          <Headphones className="h-8 w-8" />
        </Button>
      </div>
    );
  }

  function renderText() {
    return (
      <div className="space-y-2 text-center">
        <p className="text-3xl font-bold text-foreground">{current?.english_text}</p>
        {current?.english_sentence ? (
          <p className="text-sm text-muted-foreground">{current.english_sentence}</p>
        ) : null}
      </div>
    );
  }

  function renderTranslation() {
    return (
      <div className="space-y-2 text-center">
        <p className="text-3xl font-bold text-foreground">{translationForLanguage()}</p>
        <p className="text-sm text-muted-foreground">{language.toUpperCase()}</p>
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
    if (!current || !flipped) return;

    const existing = getProgress(current.id);
    const next = applyRating(existing, rating);

    if (user && supabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("user_flashcard_progress").upsert(
        {
          user_id: user.id,
          vocab_id: current.id,
          ...next,
        },
        { onConflict: "user_id,vocab_id" }
      );

      setDbProgressMap((prev) => ({
        ...prev,
        [current.id]: {
          id: prev[current.id]?.id ?? `${current.id}`,
          user_id: user.id,
          vocab_id: current.id,
          ...next,
        },
      }));
    } else {
      const key = progressKey(current.id);
      const updatedGuest = {
        ...guestProgressMap,
        [key]: {
          vocabId: current.id,
          streakCount: next.streak_count,
          reviewCount: next.review_count,
          mastered: next.mastered,
          dueAt: next.due_at,
          lastReviewedAt: next.last_reviewed_at,
        },
      };
      setGuestProgressMap(updatedGuest);
      saveGuestProgress(updatedGuest);
    }

    setIndex((prev) => prev + 1);
    setFlipped(false);
  }

  function handleNext() {
    setIndex((prev) => {
      if (activeDeck.length === 0) return 0;
      return (prev + 1) % activeDeck.length;
    });
    setFlipped(false);
  }

  return (
    <AppShell title={copy.flashcards}>
      <Card>
        <CardContent className="space-y-3 p-4">
          <Select
            value={activeLesson}
            onValueChange={(value) => {
              setSelectedLesson(value);
              setIndex(0);
              setFlipped(false);
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
              setIndex(0);
              setFlipped(false);
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

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{copy.dueCount}: {decks.due.length}</Badge>
            <Badge variant="secondary">{copy.newCount}: {decks.fresh.length}</Badge>
            <Badge variant="secondary">{studyStage === "review" ? copy.reviewSession : copy.learnSession}</Badge>
          </div>

          {studyStage === "review" && decks.due.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{copy.reviewAcrossLessons}</p>
              <Button type="button" variant="secondary" className="w-full" onClick={() => {
                setStudyStage("learn");
                setIndex(0);
                setFlipped(false);
              }}>
                {copy.skipReview}
              </Button>
            </div>
          ) : null}

          {studyStage === "learn" && decks.due.length > 0 ? (
            <Button type="button" className="w-full" onClick={() => {
              setStudyStage("review");
              setIndex(0);
              setFlipped(false);
            }}>
              {copy.reviewSession}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {studyStage === "review" && decks.due.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-base font-semibold">{copy.reviewComplete}</p>
            <Button type="button" className="w-full" onClick={() => {
              setStudyStage("learn");
              setIndex(0);
              setFlipped(false);
            }}>
              {copy.startLearningNew}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!current ? (
        studyStage === "review" && decks.due.length === 0 ? null : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.noData}</CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            className="flashcard-scene w-full"
            onClick={() => setFlipped((prev) => !prev)}
          >
            <div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
              <div className="flashcard-face flashcard-front">{frontContent()}</div>
              <div className="flashcard-face flashcard-back">{backContent()}</div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setFlipped((prev) => !prev)}>
              {flipped ? copy.showFront : copy.flipCard}
            </Button>
            <Button onClick={handleNext}>{copy.next}</Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button disabled={!flipped} variant="secondary" onClick={() => void applyReview("weak")}>{copy.ratingKeepInDeck}</Button>
            <Button disabled={!flipped} variant="secondary" onClick={() => void applyReview("improving")}>{copy.ratingKindOf}</Button>
            <Button disabled={!flipped} onClick={() => void applyReview("strong")}>{copy.ratingGotIt}</Button>
          </div>

          {isFirstExposure ? (
            <Button disabled={!flipped} className="w-full" onClick={() => void applyReview("master-now")}>
              {copy.masterNow}
            </Button>
          ) : null}

          {!flipped ? <p className="text-center text-xs text-muted-foreground">{copy.flipToRate}</p> : null}
        </div>
      )}
    </AppShell>
  );
}
