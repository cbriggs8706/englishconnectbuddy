"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lessonLabel } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Host Live Quiz",
    lesson: "Lessons",
    count: "Question count",
    duration: "Seconds per question",
    start: "Create quiz",
    chooseAtLeastOne: "Choose at least one lesson.",
  },
  es: {
    title: "Presentar quiz en vivo",
    lesson: "Lecciones",
    count: "Numero de preguntas",
    duration: "Segundos por pregunta",
    start: "Crear quiz",
    chooseAtLeastOne: "Selecciona por lo menos una leccion.",
  },
  pt: {
    title: "Apresentar quiz ao vivo",
    lesson: "Licoes",
    count: "Numero de perguntas",
    duration: "Segundos por pergunta",
    start: "Criar quiz",
    chooseAtLeastOne: "Selecione ao menos uma licao.",
  },
} as const;

export default function QuizHostSetupPage() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const { lessons } = useCurriculum();
  const router = useRouter();

  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(20);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleLesson(lessonId: string) {
    setLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const selectedLessons = lessonIds.length > 0 ? lessonIds : lessons[0] ? [lessons[0].id] : [];
    if (selectedLessons.length === 0) {
      setMessage(text.chooseAtLeastOne);
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("quiz_start_session_multi", {
      p_lesson_ids: selectedLessons,
      p_question_count: questionCount,
      p_question_duration_seconds: duration,
    });

    if (error || !data) {
      setMessage(error?.message ?? "Could not create session.");
      setLoading(false);
      return;
    }

    router.push(`/quiz/host/${data}`);
  }

  return (
    <AppShell title={text.title}>
      <AdminGate>
        <Card>
          <CardHeader>
            <CardTitle>{text.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <Label>{text.lesson}</Label>
                <div className="grid gap-2 rounded-xl border p-2">
                  {lessons.map((lesson) => {
                    const selected = lessonIds.includes(lesson.id);
                    return (
                      <Button
                        key={lesson.id}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => toggleLesson(lesson.id)}
                      >
                        {lessonLabel(lesson, language)}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label>{text.count}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>{text.duration}</Label>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {text.start}
              </Button>
            </form>
            {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
          </CardContent>
        </Card>
      </AdminGate>
    </AppShell>
  );
}
