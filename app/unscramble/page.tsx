"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";

type PhraseRound = {
  id: string;
  sentence: string;
  hint: string | null;
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

export default function UnscramblePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { vocab } = useCurriculum();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const rounds = useMemo<PhraseRound[]>(() => {
    return vocab
      .filter((item) => item.item_type?.toLowerCase() === "phrase")
      .map((item) => ({
        id: item.id,
        sentence: item.english_text,
        hint: language === "es" ? item.spanish_text : language === "pt" ? item.portuguese_text : null,
      }))
      .filter((item) => tokenize(item.sentence).length > 1);
  }, [language, vocab]);

  const current = rounds[index];

  const options = useMemo(() => {
    if (!current) return [];
    return shuffleWords(tokenize(current.sentence));
  }, [current]);

  useEffect(() => {
    setSelected([]);
    if (index >= rounds.length) {
      setIndex(0);
    }
  }, [index, rounds.length]);

  const builtSentence = selected.join(" ");
  const isCorrect = current && builtSentence === normalizeSentence(current.sentence);
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
            {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
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

            {isCorrect ? (
              <p className="text-sm font-semibold text-emerald-700">{copy.correct}</p>
            ) : builtSentence ? (
              <p className="text-sm font-semibold text-rose-700">{copy.incorrect}</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
