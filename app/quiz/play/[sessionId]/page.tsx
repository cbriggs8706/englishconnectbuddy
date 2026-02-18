"use client";

import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { QuizAnswer, QuizParticipant, QuizQuestion, QuizSession, VocabularyItem } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Live Quiz",
    waiting: "Waiting for the teacher to start",
    removed: "You were removed by the teacher.",
    finished: "Quiz finished",
    score: "Score",
    you: "You",
    correctAnswer: "Correct answer",
    youChose: "You chose",
    podium: "Top 3",
  },
  es: {
    title: "Quiz en vivo",
    waiting: "Esperando que inicie el maestro",
    removed: "El maestro te quito del juego.",
    finished: "Quiz terminado",
    score: "Puntaje",
    you: "Tu",
    correctAnswer: "Respuesta correcta",
    youChose: "Tu elegiste",
    podium: "Top 3",
  },
  pt: {
    title: "Quiz ao vivo",
    waiting: "Aguardando o professor iniciar",
    removed: "Voce foi removido pelo professor.",
    finished: "Quiz encerrado",
    score: "Pontuacao",
    you: "Voce",
    correctAnswer: "Resposta correta",
    youChose: "Voce escolheu",
    podium: "Top 3",
  },
} as const;

const optionToneClasses = [
  "bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white border-blue-900",
  "bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white border-red-900",
  "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-black border-amber-700",
  "bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500 text-white border-green-900",
];

export default function QuizPlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);

  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [vocabMap, setVocabMap] = useState<Record<string, VocabularyItem>>({});
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [myAnswersByQuestion, setMyAnswersByQuestion] = useState<Record<string, string>>({});
  const [participantId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(`quiz-participant-${sessionId}`)
  );
  const [guestToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(`quiz-guest-token-${sessionId}`)
  );
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [sessionRes, questionsRes, participantsRes, answersRes] = await Promise.all([
        supabase.from("quiz_sessions").select("*").eq("id", sessionId).single(),
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("session_id", sessionId)
          .order("question_order", { ascending: true }),
        supabase.from("quiz_participants").select("*").eq("session_id", sessionId),
        participantId
          ? supabase
              .from("quiz_answers")
              .select("question_id, selected_vocab_id")
              .eq("session_id", sessionId)
              .eq("participant_id", participantId)
          : Promise.resolve({ data: [] as Pick<QuizAnswer, "question_id" | "selected_vocab_id">[] }),
      ]);

      if (sessionRes.data) setSession(sessionRes.data as QuizSession);
      const loadedQuestions = (questionsRes.data as QuizQuestion[]) ?? [];
      setQuestions(loadedQuestions);
      setParticipants((participantsRes.data as QuizParticipant[]) ?? []);
      const nextAnswerMap: Record<string, string> = {};
      for (const answer of (answersRes.data as Pick<QuizAnswer, "question_id" | "selected_vocab_id">[]) ?? []) {
        nextAnswerMap[answer.question_id] = answer.selected_vocab_id;
      }
      setMyAnswersByQuestion(nextAnswerMap);

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

    void load();

    const channel = supabase
      .channel(`quiz-play-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as QuizSession;
          if (row) setSession(row);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_participants", filter: `session_id=eq.${sessionId}` },
        () => {
          void supabase
            .from("quiz_participants")
            .select("*")
            .eq("session_id", sessionId)
            .then(({ data }) => setParticipants((data as QuizParticipant[]) ?? []));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_answers", filter: `session_id=eq.${sessionId}` },
        () => {
          if (!participantId) return;
          void supabase
            .from("quiz_answers")
            .select("question_id, selected_vocab_id")
            .eq("session_id", sessionId)
            .eq("participant_id", participantId)
            .then(({ data }) => {
              const nextAnswerMap: Record<string, string> = {};
              for (const answer of (data as Pick<QuizAnswer, "question_id" | "selected_vocab_id">[]) ?? []) {
                nextAnswerMap[answer.question_id] = answer.selected_vocab_id;
              }
              setMyAnswersByQuestion(nextAnswerMap);
            });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, participantId]);

  const me = useMemo(
    () => participants.find((participant) => participant.id === participantId) ?? null,
    [participantId, participants]
  );

  const currentQuestion =
    session && session.current_question_index >= 0
      ? questions.find((question) => question.question_order === session.current_question_index) ?? null
      : null;

  const questionOpen =
    !!session?.question_ends_at && new Date(session.question_ends_at).getTime() > clock;
  const revealAnswer = session?.status === "active" && !questionOpen;
  const secondsLeft = session?.question_ends_at
    ? Math.max(0, Math.ceil((new Date(session.question_ends_at).getTime() - clock) / 1000))
    : 0;

  const leaderboard = useMemo(
    () => [...participants].filter((p) => !p.is_removed).sort((a, b) => b.score - a.score),
    [participants]
  );
  const selectedOptionId = currentQuestion ? myAnswersByQuestion[currentQuestion.id] : null;
  const selectedItem = selectedOptionId ? vocabMap[selectedOptionId] : null;
  const correctItem = currentQuestion ? vocabMap[currentQuestion.correct_vocab_id] : null;
  const selectedIsCorrect = !!currentQuestion && selectedOptionId === currentQuestion.correct_vocab_id;

  async function chooseAnswer(optionId: string) {
    if (!currentQuestion || !me || !questionOpen) return;
    setMyAnswersByQuestion((prev) => ({ ...prev, [currentQuestion.id]: optionId }));

    const supabase = createClient();
    await supabase.rpc("quiz_submit_answer", {
      p_session_id: sessionId,
      p_question_id: currentQuestion.id,
      p_participant_id: me.id,
      p_selected_vocab_id: optionId,
      p_guest_token: guestToken,
    });
  }

  return (
    <AppShell title={text.title}>
      {me?.is_removed ? (
        <Card>
          <CardContent className="p-4 text-sm">{text.removed}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Badge>{session?.status ?? "waiting"}</Badge>
            <Badge variant="secondary">{text.you}: {me?.nickname ?? "..."}</Badge>
          </div>
          <Badge variant="outline">{text.score}: {me?.score ?? 0}</Badge>
        </CardContent>
      </Card>
      {session?.status === "active" ? (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Timer</p>
            <p className="text-5xl font-black tabular-nums">{secondsLeft}</p>
          </CardContent>
        </Card>
      ) : null}

      {session?.status === "waiting" ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">{text.waiting}</CardContent>
        </Card>
      ) : null}

      {session?.status === "active" && currentQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Q{currentQuestion.question_order + 1} / {questions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.option_vocab_ids.map((optionId, index) => {
              const item = vocabMap[optionId];
              if (!item) return null;
              const isCorrect = optionId === currentQuestion.correct_vocab_id;
              const revealClass = revealAnswer
                ? isCorrect
                  ? "ring-4 ring-lime-300"
                  : "border-zinc-400 bg-zinc-300 text-zinc-700"
                : "";
              const selectedClass =
                !revealAnswer && selectedOptionId === optionId ? "ring-4 ring-white border-white" : "";

              return (
                <Button
                  key={optionId}
                  variant="outline"
                  className={`h-auto min-h-24 w-full justify-start whitespace-normal border-2 px-4 py-4 text-left text-xl font-black leading-tight sm:min-h-28 sm:text-2xl ${
                    optionToneClasses[index % optionToneClasses.length]
                  } ${revealClass} ${selectedClass}`}
                  onClick={() => void chooseAnswer(optionId)}
                  disabled={!questionOpen || !!me?.is_removed}
                >
                  {item.english_text}
                </Button>
              );
              })}
            </div>
            {revealAnswer && currentQuestion ? (
              <div className="mt-4 rounded-xl bg-slate-100 p-4 text-base font-semibold text-slate-900">
                <p>{text.correctAnswer}: {correctItem?.english_text ?? "—"}</p>
                {!selectedIsCorrect && selectedItem ? (
                  <p className="mt-1 text-slate-700">{text.youChose}: {selectedItem.english_text}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {session?.status === "finished" ? (
        <Card>
          <CardHeader>
            <CardTitle>{text.finished}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold">{text.podium}</p>
            {leaderboard.slice(0, 3).map((participant, index) => (
              <div key={participant.id} className="rounded-xl border p-3 font-semibold">
                {index + 1}. {participant.nickname} ({participant.score})
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
