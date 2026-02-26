"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/app-url";
import { resolveVocabMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { Language, QuizAnswer, QuizParticipant, QuizQuestion, QuizSession, VocabularyItem } from "@/lib/types";
import QRCode from "qrcode";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const baseCopy: Record<
  "en" | "es" | "pt",
  {
    title: string;
    joinCode: string;
    start: string;
    next: string;
    end: string;
    waiting: string;
    noImage: string;
    participants: string;
    remove: string;
    review: string;
    podium: string;
    questionTime: string;
    updating: string;
    showQr: string;
    hideQr: string;
    closeSession: string;
    closing: string;
    home: string;
  }
> = {
  en: {
    title: "Live Quiz Host",
    joinCode: "Join code",
    start: "Start quiz",
    next: "Next question",
    end: "End quiz",
    waiting: "Waiting to start",
    noImage: "No image for this question",
    participants: "Participants",
    remove: "Remove",
    review: "Review answers",
    podium: "Winners",
    questionTime: "Question time",
    updating: "Updating...",
    showQr: "Show QR",
    hideQr: "Hide QR",
    closeSession: "Close session",
    closing: "Closing...",
    home: "Back to home",
  },
  es: {
    title: "Presentador del quiz",
    joinCode: "Codigo",
    start: "Iniciar quiz",
    next: "Siguiente pregunta",
    end: "Terminar quiz",
    waiting: "Esperando inicio",
    noImage: "No hay imagen para esta pregunta",
    participants: "Participantes",
    remove: "Quitar",
    review: "Revisar respuestas",
    podium: "Ganadores",
    questionTime: "Tiempo por pregunta",
    updating: "Actualizando...",
    showQr: "Mostrar QR",
    hideQr: "Ocultar QR",
    closeSession: "Cerrar sesion",
    closing: "Cerrando...",
    home: "Volver al inicio",
  },
  pt: {
    title: "Apresentador do quiz",
    joinCode: "Codigo",
    start: "Iniciar quiz",
    next: "Proxima pergunta",
    end: "Encerrar quiz",
    waiting: "Aguardando inicio",
    noImage: "Sem imagem para esta pergunta",
    participants: "Participantes",
    remove: "Remover",
    review: "Revisar respostas",
    podium: "Vencedores",
    questionTime: "Tempo por pergunta",
    updating: "Atualizando...",
    showQr: "Mostrar QR",
    hideQr: "Ocultar QR",
    closeSession: "Encerrar sessao",
    closing: "Encerrando...",
    home: "Voltar ao inicio",
  },
};

const copy: Record<Language, (typeof baseCopy)["en"]> = {
  ...baseCopy,
  sw: {
    ...baseCopy.en,
    title: "Msimamizi wa Quiz ya moja kwa moja",
    joinCode: "Msimbo wa kujiunga",
    start: "Anzisha quiz",
    next: "Swali linalofuata",
    end: "Maliza quiz",
    waiting: "Inasubiri kuanza",
    noImage: "Hakuna picha kwa swali hili",
    participants: "Washiriki",
    remove: "Ondoa",
    review: "Kagua majibu",
    podium: "Washindi",
    questionTime: "Muda wa swali",
    updating: "Inasasisha...",
    showQr: "Onyesha QR",
    hideQr: "Ficha QR",
    closeSession: "Funga kipindi",
    closing: "Inafunga...",
    home: "Rudi nyumbani",
  },
  chk: {
    ...baseCopy.en,
  },
};

function optionLabel(item: VocabularyItem) {
  return item.english_text;
}

function promptLabel(item: VocabularyItem) {
  return item.spanish_text || item.portuguese_text || item.english_text;
}

const optionToneClasses = [
  "bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white border-blue-900",
  "bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white border-red-900",
  "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-black border-amber-700",
  "bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500 text-white border-green-900",
];
const durationOptions = [10, 20, 30, 45, 60] as const;

export default function QuizHostSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);

  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [vocabMap, setVocabMap] = useState<Record<string, VocabularyItem>>({});
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [qrData, setQrData] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [clock, setClock] = useState(0);
  const [failedImageQuestionId, setFailedImageQuestionId] = useState<string | null>(null);
  const [updatingDuration, setUpdatingDuration] = useState<number | null>(null);
  const [showJoinQrPanel, setShowJoinQrPanel] = useState(false);
  const [autoClosingQuestionId, setAutoClosingQuestionId] = useState<string | null>(null);
  const [closingSession, setClosingSession] = useState(false);

  const currentQuestion =
    session && session.current_question_index >= 0
      ? questions.find((question) => question.question_order === session.current_question_index) ?? null
      : null;

  const secondsLeft = session?.question_ends_at
    ? Math.max(0, Math.ceil((new Date(session.question_ends_at).getTime() - clock) / 1000))
    : 0;
  const isWaiting = session?.status === "waiting";
  const isActive = session?.status === "active";
  const questionOpen =
    isActive && !!session?.question_ends_at && new Date(session.question_ends_at).getTime() > clock;
  const revealAnswer = isActive && !questionOpen;
  const promptImageUrl = resolveVocabMediaUrl(
    currentQuestion?.prompt_image_url ?? (currentQuestion ? vocabMap[currentQuestion.prompt_vocab_id]?.image_url : null)
  );
  const promptItem = currentQuestion ? vocabMap[currentQuestion.prompt_vocab_id] : null;

  const leaderboard = useMemo(
    () =>
      [...participants]
        .filter((participant) => !participant.is_removed)
        .sort((a, b) => b.score - a.score),
    [participants]
  );
  const activeParticipants = useMemo(
    () => participants.filter((participant) => !participant.is_removed),
    [participants]
  );
  const submittedCount = useMemo(() => {
    if (!currentQuestion) return 0;
    const activeIds = new Set(activeParticipants.map((participant) => participant.id));
    const submittedIds = new Set(
      answers
        .filter((answer) => answer.question_id === currentQuestion.id)
        .map((answer) => answer.participant_id)
        .filter((participantId) => activeIds.has(participantId))
    );
    return submittedIds.size;
  }, [answers, activeParticipants, currentQuestion]);

  useEffect(() => {
    if (!currentQuestion || !questionOpen) return;
    if (activeParticipants.length === 0) return;
    if (submittedCount < activeParticipants.length) return;
    if (autoClosingQuestionId === currentQuestion.id) return;

    setAutoClosingQuestionId(currentQuestion.id);
    const supabase = createClient();
    void supabase.rpc("quiz_close_current_question", {
      p_session_id: sessionId,
    });
  }, [
    currentQuestion,
    questionOpen,
    submittedCount,
    activeParticipants.length,
    autoClosingQuestionId,
    sessionId,
  ]);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
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
        supabase.from("quiz_answers").select("*").eq("session_id", sessionId),
      ]);

      if (sessionRes.data) setSession(sessionRes.data as QuizSession);
      const loadedQuestions = (questionsRes.data as QuizQuestion[]) ?? [];
      setQuestions(loadedQuestions);
      setParticipants((participantsRes.data as QuizParticipant[]) ?? []);
      setAnswers((answersRes.data as QuizAnswer[]) ?? []);

      const vocabIds = Array.from(
        new Set(
          loadedQuestions.flatMap((question) => [question.prompt_vocab_id, ...question.option_vocab_ids])
        )
      );
      if (vocabIds.length > 0) {
        const { data: vocabRows } = await supabase.from("vocabulary").select("*").in("id", vocabIds);
        const nextMap: Record<string, VocabularyItem> = {};
        for (const row of (vocabRows as VocabularyItem[]) ?? []) {
          nextMap[row.id] = row;
        }
        setVocabMap(nextMap);
      }

      if (sessionRes.data) {
        const joinUrl = absoluteUrl(`/quiz/join?code=${sessionRes.data.join_code}`);
        const dataUrl = await QRCode.toDataURL(joinUrl, { margin: 1, width: 1200 });
        setQrData(dataUrl);
        setJoinUrl(joinUrl);
      }
    }

    void load();

    const channel = supabase
      .channel(`quiz-host-${sessionId}`)
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
          void supabase
            .from("quiz_answers")
            .select("*")
            .eq("session_id", sessionId)
            .then(({ data }) => setAnswers((data as QuizAnswer[]) ?? []));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  async function advance(action: "next" | "end") {
    const supabase = createClient();
    const { data } = await supabase.rpc("quiz_advance_session", {
      p_session_id: sessionId,
      p_action: action,
    });
    if (data) {
      setSession(data as QuizSession);
    }
  }

  async function removeParticipant(participantId: string) {
    const supabase = createClient();
    await supabase.rpc("quiz_remove_participant", {
      p_session_id: sessionId,
      p_participant_id: participantId,
    });
  }

  const podium = leaderboard.slice(0, 3);

  async function updateQuestionDuration(seconds: number) {
    setUpdatingDuration(seconds);
    const supabase = createClient();
    const { data } = await supabase.rpc("quiz_set_question_duration", {
      p_session_id: sessionId,
      p_question_duration_seconds: seconds,
    });
    if (data) setSession(data as QuizSession);
    setUpdatingDuration(null);
  }

  async function closeSession() {
    if (!session || session.status === "finished" || closingSession) return;
    setClosingSession(true);
    await advance("end");
    setClosingSession(false);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <AdminGate>
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{text.title}</h1>
              {!isWaiting ? (
                <Button
                  type="button"
                  size="sm"
                  variant={showJoinQrPanel ? "default" : "secondary"}
                  className="h-10 rounded-full px-4 text-base font-black tracking-wide"
                  onClick={() => setShowJoinQrPanel((prev) => !prev)}
                >
                  {session?.join_code ?? "..."} · {showJoinQrPanel ? text.hideQr : text.showQr}
                </Button>
              ) : null}
              <Badge variant="outline">{session?.status ?? "waiting"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-muted-foreground">{joinUrl || "/quiz/join"}</p>
              {session?.status !== "finished" ? (
                <Button type="button" variant="destructive" size="sm" disabled={closingSession} onClick={() => void closeSession()}>
                  {closingSession ? text.closing : text.closeSession}
                </Button>
              ) : null}
            </div>
            {isActive ? (
              <div className="rounded-2xl bg-rose-600 px-6 py-3 text-center text-white">
                <p className="text-xs uppercase tracking-wide">Timer</p>
                <p className="text-5xl font-black tabular-nums">{secondsLeft}</p>
              </div>
            ) : null}
          </div>

          {!isWaiting && showJoinQrPanel && qrData ? (
            <div className="fixed bottom-4 right-4 z-40 w-56 rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">{text.joinCode}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowJoinQrPanel(false)}
                >
                  {text.hideQr}
                </Button>
              </div>
              <img
                src={qrData}
                alt="Join quiz QR code"
                className="aspect-square w-full rounded-xl border bg-white p-1"
              />
              <p className="mt-2 text-center text-lg font-black tracking-[0.14em] text-slate-900">
                {session?.join_code ?? "..."}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {isWaiting ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{text.waiting}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex justify-center">
                      {qrData ? (
                        <img
                          src={qrData}
                          alt="Join quiz QR code"
                          className="aspect-square w-full max-w-[70vh] rounded-2xl border bg-white p-2"
                        />
                      ) : null}
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black tracking-wide">EnglishConnect Buddy</p>
                      <p className="mt-2 text-sm text-muted-foreground">URL</p>
                      <p className="text-5xl font-black leading-tight">
                        {(joinUrl || "/quiz/join").replace(/^https?:\/\//, "")}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">{text.joinCode}</p>
                      <div className="mx-auto mt-2 w-fit rounded-3xl bg-green-500 px-8 py-4">
                        <p className="text-7xl font-black tracking-[0.15em] text-white">
                          {session?.join_code ?? "..."}
                        </p>
                      </div>
                    </div>
                    <Button className="h-14 w-full text-lg" onClick={() => void advance("next")}>
                      {text.start}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {`Q${(session?.current_question_index ?? 0) + 1} / ${questions.length}`}
                    </CardTitle>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {submittedCount} / {activeParticipants.length} submitted
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {promptImageUrl && failedImageQuestionId !== currentQuestion?.id ? (
                      <img
                        src={promptImageUrl}
                        alt="Quiz prompt"
                        className="max-h-[38vh] w-full rounded-xl object-contain"
                        onError={() => setFailedImageQuestionId(currentQuestion?.id ?? null)}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{text.noImage}</p>
                        <p className="mt-2 text-5xl font-bold text-foreground">
                          {promptItem ? promptLabel(promptItem) : ""}
                        </p>
                      </div>
                    )}

                    {currentQuestion ? (
                      <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.option_vocab_ids.map((optionId, index) => {
                          const item = vocabMap[optionId];
                          const isCorrect = optionId === currentQuestion.correct_vocab_id;
                          const toneClass = optionToneClasses[index % optionToneClasses.length];
                          return (
                            <div
                              key={optionId}
                              className={`flex min-h-24 items-center justify-between rounded-xl border px-4 py-4 text-xl font-black leading-tight sm:min-h-28 sm:text-2xl ${toneClass} ${
                                revealAnswer && isCorrect
                                  ? "ring-4 ring-lime-300"
                                  : revealAnswer
                                    ? "border-zinc-400 bg-zinc-300 text-zinc-700"
                                    : ""
                              }`}
                            >
                              <span>{item ? optionLabel(item) : optionId}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{text.questionTime}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {session?.question_duration_seconds ?? 20}s
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {durationOptions.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={session?.question_duration_seconds === option ? "default" : "secondary"}
                        className="h-11 text-base font-bold"
                        disabled={updatingDuration !== null}
                        onClick={() => void updateQuestionDuration(option)}
                      >
                        {updatingDuration === option ? text.updating : `${option}s`}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{text.participants}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leaderboard.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-semibold">{participant.nickname}</p>
                        <p className="text-xs text-muted-foreground">{participant.score} pts</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => void removeParticipant(participant.id)}>
                        {text.remove}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {session?.status !== "finished" ? (
                <Card>
                  <CardContent className="grid grid-cols-2 gap-2 p-3">
                    <Button className="h-12 text-base" onClick={() => void advance("next")}>
                      {text.next}
                    </Button>
                    <Button className="h-12 text-base" variant="outline" onClick={() => void advance("end")}>
                      {text.end}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              {session?.status === "finished" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{text.podium}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {podium.map((participant, index) => (
                      <div key={participant.id} className="rounded-xl border p-3 font-semibold">
                        {index + 1}. {participant.nickname} ({participant.score})
                      </div>
                    ))}
                    <Link href={`/admin/quiz-results?sessionId=${sessionId}`}>
                      <Button className="w-full">{text.review}</Button>
                    </Link>
                    <Link href="/">
                      <Button className="w-full" variant="secondary">
                        {text.home}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </AdminGate>
    </div>
  );
}
