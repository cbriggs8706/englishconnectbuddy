"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { recordStreakActivity } from "@/lib/streak";
import { useEffect, useMemo, useRef, useState } from "react";

type PhraseRound = {
  id: string;
  sentence: string;
  lessonId: string;
  lessonLabel: string;
  translation: string | null;
};

type ConfettiPiece = {
  id: string;
  left: number;
  top: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
};

function normalizeSentence(sentence: string) {
  return sentence.trim().replace(/\s+/g, " ");
}

function tokenize(sentence: string) {
  return normalizeSentence(sentence).split(" ").filter(Boolean);
}

function shuffleWords(words: string[]) {
  const next = [...words];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }
  return next;
}

function createConfettiPieces(count = 90): ConfettiPiece[] {
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
  return Array.from({ length: count }, (_, i) => ({
    id: `confetti-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    left: Math.random() * 100,
    top: -5 - Math.random() * 25,
    delay: Math.random() * 0.55,
    duration: 1.5 + Math.random() * 1.2,
    width: 6 + Math.random() * 7,
    height: 8 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function playSuccessTrumpet() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.15;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, i) => {
    const start = now + i * 0.12;
    const stop = start + 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, stop);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(stop);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 1200);
}

export default function UnscramblePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const didPlaySuccessRef = useRef(false);
  const didPlayLessonCompleteRef = useRef(false);

  const lessonLabelsById = useMemo(() => {
    return new Map(lessons.map((lesson) => [lesson.id, lessonLabel(lesson, language)]));
  }, [language, lessons]);

  const allRounds = useMemo<PhraseRound[]>(() => {
    return vocab
      .filter((item) => {
        if (!selectedCourse) return true;
        const lesson = lessons.find((entry) => entry.id === item.lesson_id);
        return lesson?.course === selectedCourse;
      })
      .filter((item) => item.item_type?.toLowerCase() === "phrase")
      .map((item) => ({
        id: item.id,
        sentence: item.english_text,
        lessonId: item.lesson_id,
        lessonLabel: lessonLabelsById.get(item.lesson_id) ?? "—",
        translation:
          language === "es"
            ? item.spanish_text
            : language === "pt"
              ? item.portuguese_text
              : language === "sw"
                ? item.english_text
                : language === "chk"
                  ? item.english_text
                  : item.english_text,
      }))
      .filter((item) => tokenize(item.sentence).length > 1);
  }, [language, lessonLabelsById, lessons, selectedCourse, vocab]);

  const visibleLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => !selectedCourse || lesson.course === selectedCourse)
        .filter((lesson) => allRounds.some((round) => round.lessonId === lesson.id)),
    [allRounds, lessons, selectedCourse]
  );

  useEffect(() => {
    if (visibleLessons.length === 0) {
      setSelectedLesson("");
      return;
    }

    if (!selectedLesson || !visibleLessons.some((lesson) => lesson.id === selectedLesson)) {
      setSelectedLesson(visibleLessons[0].id);
    }
  }, [selectedLesson, visibleLessons]);

  const rounds = useMemo(() => {
    if (!selectedLesson) return [];
    return allRounds.filter((item) => item.lessonId === selectedLesson);
  }, [allRounds, selectedLesson]);

  const completedCount = useMemo(
    () => rounds.filter((round) => completedIds.includes(round.id)).length,
    [completedIds, rounds]
  );
  const progressValue = rounds.length > 0 ? (completedCount / rounds.length) * 100 : 0;
  const pendingRounds = useMemo(
    () => rounds.filter((round) => !completedIds.includes(round.id)),
    [completedIds, rounds]
  );
  const current = pendingRounds[index];
  const isLessonComplete = rounds.length > 0 && completedCount >= rounds.length;

  const options = useMemo(() => {
    if (!current) return [];
    return shuffleWords(tokenize(current.sentence));
  }, [current]);

  useEffect(() => {
    setSelected([]);
    setShowHint(false);
    if (index >= pendingRounds.length) {
      setIndex(0);
    }
  }, [index, pendingRounds.length]);

  useEffect(() => {
    setIndex(0);
    setSelected([]);
    setShowHint(false);
    setCompletedIds([]);
    setShowConfetti(false);
    setConfettiPieces([]);
    didPlaySuccessRef.current = false;
    didPlayLessonCompleteRef.current = false;
  }, [selectedLesson]);

  const builtSentence = selected.join(" ");
  const isCorrect = Boolean(current) && builtSentence === normalizeSentence(current.sentence);
  const selectedCountByWord = useMemo(() => {
    const counts = new Map<string, number>();
    for (const word of selected) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    return counts;
  }, [selected]);
  const optionCountByWord = useMemo(() => {
    const counts = new Map<string, number>();
    for (const word of options) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    return counts;
  }, [options]);

  useEffect(() => {
    if (isCorrect && !didPlaySuccessRef.current) {
      didPlaySuccessRef.current = true;
      setCompletedIds((prev) => {
        if (!current || prev.includes(current.id)) return prev;
        return [...prev, current.id];
      });
      return;
    }

    if (!isCorrect) {
      didPlaySuccessRef.current = false;
    }
  }, [isCorrect]);

  useEffect(() => {
    if (!isLessonComplete || didPlayLessonCompleteRef.current) return;
    didPlayLessonCompleteRef.current = true;
    if (user) {
      void recordStreakActivity({ activityType: "matching" });
    }
    playSuccessTrumpet();
    setConfettiPieces(createConfettiPieces());
    setShowConfetti(true);
    const timeout = window.setTimeout(() => {
      setShowConfetti(false);
      setConfettiPieces([]);
    }, 2600);
    return () => window.clearTimeout(timeout);
  }, [isLessonComplete, user]);

  return (
    <AppShell title={copy.unscramble}>
      {showConfetti ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute rounded-sm confetti-piece"
              style={{
                left: `${piece.left}%`,
                top: `${piece.top}%`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4">
          <Select value={selectedLesson} onValueChange={setSelectedLesson}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={copy.lesson} />
            </SelectTrigger>
            <SelectContent>
              {visibleLessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  {lessonLabel(lesson, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <p className="text-base font-semibold">
              {completedCount}/{rounds.length}
            </p>
            <Progress value={progressValue} className="h-3 rounded-full bg-primary/20 [&_[data-slot=progress-indicator]]:bg-primary" />
          </div>
        </CardContent>
      </Card>

      {rounds.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {copy.noData}
          </CardContent>
        </Card>
      ) : isLessonComplete ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-2xl font-black text-emerald-700">{copy.correct}</p>
            <Button
              type="button"
              onClick={() => {
                setCompletedIds([]);
                setIndex(0);
                setSelected([]);
                setShowHint(false);
                didPlaySuccessRef.current = false;
                didPlayLessonCompleteRef.current = false;
              }}
              className="w-full"
            >
              {copy.reset}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.buildSentenceEnglish}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showHint && current.translation ? (
              <p className="text-base font-semibold text-primary">{current.translation}</p>
            ) : null}
            <div className="min-h-20 rounded-xl border border-dashed bg-muted/30 p-3 text-sm">
              {selected.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.map((word, idx) => (
                    <Button
                      key={`selected-${word}-${idx}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))}
                    >
                      {word}
                    </Button>
                  ))}
                </div>
              ) : (
                copy.tapWordsBelow
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((word, idx) => (
                <Button
                  key={`${word}-${idx}`}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isCorrect || (selectedCountByWord.get(word) ?? 0) >= (optionCountByWord.get(word) ?? 0)}
                  onClick={() => setSelected((prev) => [...prev, word])}
                >
                  {word}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              {current.translation && !showHint ? (
                <Button type="button" onClick={() => setShowHint(true)} className="flex-1">
                  {copy.reveal}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected([])}
                className="flex-1"
              >
                {copy.reset}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelected([]);
                  setIndex((prev) => (prev + 1) % Math.max(1, pendingRounds.length));
                }}
                className="flex-1"
              >
                {copy.next}
              </Button>
            </div>

            {isCorrect ? <p className="text-2xl font-black text-emerald-700">{copy.correct}</p> : null}
          </CardContent>
        </Card>
      )}
      <style jsx>{`
        .confetti-piece {
          animation: confetti-fall 1.9s ease-in forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(125vh) rotate(720deg);
          }
        }
      `}</style>
    </AppShell>
  );
}
