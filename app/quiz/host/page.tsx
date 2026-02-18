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
import { QuizSession } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Host Live Quiz",
    lesson: "Lessons",
    count: "Question count",
    duration: "Seconds per question",
    start: "Create quiz",
    chooseAtLeastOne: "Choose at least one lesson.",
    openQuizzes: "Open quizzes",
    noOpenQuizzes: "No open quizzes right now.",
    open: "Open",
    close: "Close",
    closing: "Closing...",
  },
  es: {
    title: "Presentar quiz en vivo",
    lesson: "Lecciones",
    count: "Numero de preguntas",
    duration: "Segundos por pregunta",
    start: "Crear quiz",
    chooseAtLeastOne: "Selecciona por lo menos una leccion.",
    openQuizzes: "Quizzes abiertos",
    noOpenQuizzes: "No hay quizzes abiertos ahora.",
    open: "Abrir",
    close: "Cerrar",
    closing: "Cerrando...",
  },
  pt: {
    title: "Apresentar quiz ao vivo",
    lesson: "Licoes",
    count: "Numero de perguntas",
    duration: "Segundos por pergunta",
    start: "Criar quiz",
    chooseAtLeastOne: "Selecione ao menos uma licao.",
    openQuizzes: "Quizzes abertos",
    noOpenQuizzes: "Nao ha quizzes abertos agora.",
    open: "Abrir",
    close: "Encerrar",
    closing: "Encerrando...",
  },
} as const;

export default function QuizHostSetupPage() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const { lessons, vocab } = useCurriculum();
  const router = useRouter();

  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [questionCountOverride, setQuestionCountOverride] = useState<number | null>(null);
  const [duration, setDuration] = useState(20);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openSessions, setOpenSessions] = useState<QuizSession[]>([]);
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
  const durationOptions = [10, 20, 30, 45, 60] as const;
  const vocabCountByLesson = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of vocab) {
      counts[item.lesson_id] = (counts[item.lesson_id] ?? 0) + 1;
    }
    return counts;
  }, [vocab]);
  const selectedVocabCount = useMemo(
    () => lessonIds.reduce((sum, lessonId) => sum + (vocabCountByLesson[lessonId] ?? 0), 0),
    [lessonIds, vocabCountByLesson]
  );
  const defaultQuestionCount =
    lessonIds.length === 1 ? Math.max(1, vocabCountByLesson[lessonIds[0]] ?? 1) : 10;
  const questionCount = questionCountOverride ?? defaultQuestionCount;
  const maxQuestionCount = Math.max(1, selectedVocabCount || vocab.length || 1);

  async function loadOpenSessions() {
    const supabase = createClient();
    const { data } = await supabase
      .from("quiz_sessions")
      .select("*")
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(30);
    setOpenSessions((data as QuizSession[]) ?? []);
  }

  useEffect(() => {
    void loadOpenSessions();
  }, []);

  function toggleLesson(lessonId: string) {
    setLessonIds((prev) => {
      const next = prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      if (next.length === 1) {
        setQuestionCountOverride(null);
      }
      return next;
    });
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
    const availableQuestionCount = selectedLessons.reduce(
      (sum, lessonId) => sum + (vocabCountByLesson[lessonId] ?? 0),
      0
    );
    const questionCountToSubmit = Math.max(
      1,
      Math.min(questionCount, availableQuestionCount > 0 ? availableQuestionCount : questionCount)
    );

    const supabase = createClient();
    const { data, error } = await supabase.rpc("quiz_start_session_multi", {
      p_lesson_ids: selectedLessons,
      p_question_count: questionCountToSubmit,
      p_question_duration_seconds: duration,
    });

    if (error || !data) {
      setMessage(error?.message ?? "Could not create session.");
      setLoading(false);
      return;
    }

    router.push(`/quiz/host/${data}`);
  }

  async function closeSession(sessionId: string) {
    setClosingSessionId(sessionId);
    const supabase = createClient();
    const { error } = await supabase.rpc("quiz_advance_session", {
      p_session_id: sessionId,
      p_action: "end",
    });
    if (error) {
      setMessage(error.message);
      setClosingSessionId(null);
      return;
    }
    await loadOpenSessions();
    setClosingSessionId(null);
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
                  max={maxQuestionCount}
                  value={questionCount}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    setQuestionCountOverride(Math.max(1, Math.min(next, maxQuestionCount)));
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>{text.duration}</Label>
                <div className="grid grid-cols-3 gap-2 rounded-xl border p-2 sm:grid-cols-5">
                  {durationOptions.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={duration === option ? "default" : "secondary"}
                      className="h-11 text-base font-bold"
                      onClick={() => setDuration(option)}
                    >
                      {option}s
                    </Button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {text.start}
              </Button>
            </form>
            {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.openQuizzes}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{text.noOpenQuizzes}</p>
            ) : (
              openSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{session.join_code}</p>
                    <p className="text-xs text-muted-foreground">{session.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/quiz/host/${session.id}`}>
                      <Button size="sm">{text.open}</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={closingSessionId === session.id}
                      onClick={() => void closeSession(session.id)}
                    >
                      {closingSessionId === session.id ? text.closing : text.close}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </AdminGate>
    </AppShell>
  );
}
