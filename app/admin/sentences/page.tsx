"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";

export default function AdminSentencePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons } = useCurriculum();
  const [lessonId, setLessonId] = useState<string>("");
  const [englishSentence, setEnglishSentence] = useState("");
  const [spanishHint, setSpanishHint] = useState("");
  const [portugueseHint, setPortugueseHint] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const chosenLessonId = lessonId || lessons[0]?.id;
    if (!chosenLessonId) {
      setMessage(copy.createLessonFirst);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("sentence_scrambles").insert({
      lesson_id: chosenLessonId,
      english_sentence: englishSentence,
      spanish_hint: spanishHint || null,
      portuguese_hint: portugueseHint || null,
    });

    setMessage(error ? error.message : copy.sentenceAdded);
    if (!error) {
      setEnglishSentence("");
      setSpanishHint("");
      setPortugueseHint("");
    }
  }

  return (
    <AdminShell title={copy.addSentence}>
      <AdminGate>
        <Card>
          <CardContent className="p-4">
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <Label>{copy.lesson}</Label>
                <Select value={lessonId} onValueChange={setLessonId}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.selectLesson} />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lessonLabel(lesson, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{copy.englishSentenceLabel}</Label>
                <Input
                  value={englishSentence}
                  onChange={(event) => setEnglishSentence(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{copy.spanishHint}</Label>
                <Input value={spanishHint} onChange={(event) => setSpanishHint(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{copy.portugueseHint}</Label>
                <Input
                  value={portugueseHint}
                  onChange={(event) => setPortugueseHint(event.target.value)}
                />
              </div>
              <Button type="submit">{copy.addSentenceButton}</Button>
            </form>
          </CardContent>
        </Card>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </AdminGate>
    </AdminShell>
  );
}
