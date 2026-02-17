"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sentenceHint } from "@/lib/content";
import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";

function shuffleWords(sentence: string) {
  return sentence.split(" ").sort(() => Math.random() - 0.5);
}

export default function UnscramblePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { scrambles } = useCurriculum();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const current = scrambles[index];

  const options = useMemo(() => {
    if (!current) return [];
    return shuffleWords(current.english_sentence);
  }, [current]);

  const builtSentence = selected.join(" ");
  const isCorrect = current && builtSentence === current.english_sentence;

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
            <p className="text-sm text-muted-foreground">{sentenceHint(current, language)}</p>
            <div className="min-h-20 rounded-xl border border-dashed bg-muted/30 p-3 text-sm">
              {builtSentence || copy.tapWordsBelow}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((word, idx) => (
                <Button
                  key={`${word}-${idx}`}
                  type="button"
                  variant="secondary"
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
                  setIndex((prev) => (prev + 1) % scrambles.length);
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
