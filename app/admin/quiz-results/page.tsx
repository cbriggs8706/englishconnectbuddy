"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { QuizAnswer, QuizParticipant, QuizQuestion, QuizSession, VocabularyItem } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

const copy = {
  en: { title: "Quiz Results", load: "Load", sessionId: "Session ID", accuracy: "Accuracy" },
  es: { title: "Resultados del quiz", load: "Cargar", sessionId: "ID de sesion", accuracy: "Precision" },
  pt: { title: "Resultados do quiz", load: "Carregar", sessionId: "ID da sessao", accuracy: "Precisao" },
} as const;

function QuizResultsContent() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState(searchParams.get("sessionId") ?? "");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [vocabMap, setVocabMap] = useState<Record<string, VocabularyItem>>({});

  async function load(event?: FormEvent) {
    event?.preventDefault();
    if (!sessionId.trim()) return;

    const supabase = createClient();
    const [sessionRes, questionsRes, participantsRes, answersRes] = await Promise.all([
      supabase.from("quiz_sessions").select("*").eq("id", sessionId).single(),
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("question_order", { ascending: true }),
      supabase.from("quiz_participants").select("*").eq("session_id", sessionId),
      supabase.from("quiz_answers").select("*").eq("session_id", sessionId),
    ]);

    setSession((sessionRes.data as QuizSession) ?? null);
    const loadedQuestions = (questionsRes.data as QuizQuestion[]) ?? [];
    setQuestions(loadedQuestions);
    setParticipants((participantsRes.data as QuizParticipant[]) ?? []);
    setAnswers((answersRes.data as QuizAnswer[]) ?? []);

    const vocabIds = Array.from(
      new Set(loadedQuestions.flatMap((question) => [question.correct_vocab_id, ...question.option_vocab_ids]))
    );
    if (vocabIds.length > 0) {
      const { data: vocabRows } = await supabase.from("vocabulary").select("*").in("id", vocabIds);
      const nextMap: Record<string, VocabularyItem> = {};
      for (const row of (vocabRows as VocabularyItem[]) ?? []) {
        nextMap[row.id] = row;
      }
      setVocabMap(nextMap);
    }
  }

  const questionStats = useMemo(
    () =>
      questions.map((question) => {
        const questionAnswers = answers.filter((answer) => answer.question_id === question.id);
        const correct = questionAnswers.filter((answer) => answer.is_correct).length;
        const total = questionAnswers.length;
        const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
        return { question, correct, total, accuracy };
      }),
    [answers, questions]
  );

  return (
    <AppShell title={text.title}>
      <AdminGate>
        <Card>
          <CardContent className="p-4">
            <form className="flex gap-2" onSubmit={load}>
              <Input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder={text.sessionId} />
              <Button type="submit">{text.load}</Button>
            </form>
          </CardContent>
        </Card>

        {session ? (
          <Card>
            <CardHeader>
              <CardTitle>{session.join_code}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.status}</p>
            </CardContent>
          </Card>
        ) : null}

        {questionStats.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{text.accuracy}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questionStats.map((stat) => (
                <div key={stat.question.id} className="rounded-xl border p-3">
                  <p className="font-semibold">Q{stat.question.question_order + 1}</p>
                  <p className="text-sm text-muted-foreground">
                    {stat.correct}/{stat.total} ({stat.accuracy}%)
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {participants.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants
                .sort((a, b) => b.score - a.score)
                .map((participant) => {
                  const studentAnswers = answers.filter((answer) => answer.participant_id === participant.id);

                  return (
                    <div key={participant.id} className="rounded-xl border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold">{participant.nickname}</p>
                        <Badge>{participant.score}</Badge>
                      </div>
                      <div className="space-y-1">
                        {questions.map((question) => {
                          const answer = studentAnswers.find((row) => row.question_id === question.id);
                          const selected = answer ? vocabMap[answer.selected_vocab_id] : null;
                          const correct = vocabMap[question.correct_vocab_id];

                          return (
                            <p key={question.id} className="text-sm text-muted-foreground">
                              Q{question.question_order + 1}: {selected?.english_text ?? "-"} / {correct?.english_text ?? "-"}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ) : null}
      </AdminGate>
    </AppShell>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QuizResultsContent />
    </Suspense>
  );
}
