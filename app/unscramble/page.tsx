"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";

type PhraseRound = {
  id: string;
  sentence: string;
  lesson: string;
  translation: string | null;
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

function playSuccessTrumpet() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
  master.connect(context.destination);

  const notes = [523.25, 659.25, 783.99];
  notes.forEach((frequency, i) => {
    const start = now + i * 0.12;
    const duration = 0.28;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.03, start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration);
  });

  const closeAt = now + 1;
  window.setTimeout(() => {
    void context.close();
  }, Math.max(0, Math.ceil((closeAt - context.currentTime) * 1000)));
}

export default function UnscramblePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const didPlaySuccessRef = useRef(false);

  const lessonLabelsById = useMemo(() => {
    return new Map(lessons.map((lesson) => [lesson.id, lessonLabel(lesson, language)]));
  }, [language, lessons]);

  const rounds = useMemo<PhraseRound[]>(() => {
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
        lesson: lessonLabelsById.get(item.lesson_id) ?? "—",
        translation:
          language === "es"
            ? item.spanish_text
            : language === "pt"
              ? item.portuguese_text
              : item.english_text,
      }))
      .filter((item) => tokenize(item.sentence).length > 1);
  }, [language, lessonLabelsById, lessons, selectedCourse, vocab]);

  const current = rounds[index];

  const options = useMemo(() => {
    if (!current) return [];
    return shuffleWords(tokenize(current.sentence));
  }, [current]);

  useEffect(() => {
    setSelected([]);
    setShowHint(false);
    if (index >= rounds.length) {
      setIndex(0);
    }
  }, [index, rounds.length]);

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
      playSuccessTrumpet();
      return;
    }

    if (!isCorrect) {
      didPlaySuccessRef.current = false;
    }
  }, [isCorrect]);

  return (
    <AppShell title={copy.unscramble}>
      {!current ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {copy.noData}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.buildSentenceEnglish}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-semibold">{copy.lesson}: {current.lesson}</p>
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
                  setIndex((prev) => (prev + 1) % rounds.length);
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
    </AppShell>
  );
}
