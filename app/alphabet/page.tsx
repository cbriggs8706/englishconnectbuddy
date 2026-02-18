"use client";

import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AudioLines, RotateCcw, ThumbsDown, ThumbsUp, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const TIME_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const QUIZ_SIZE = LETTERS.length;

type QuizStage = "study" | "setup" | "countdown" | "question" | "feedback" | "results";

type QuizQuestion = {
  letter: string;
  display: string;
};

type WrongAnswer = {
  letter: string;
  display: string;
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

function buildQuizQuestions() {
  return shuffle(LETTERS).map((letter) => {
    const upper = Math.random() >= 0.5;
    return {
      letter,
      display: upper ? letter.toUpperCase() : letter,
    } satisfies QuizQuestion;
  });
}

function publicAlphabetUrl(fileName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return fileName;
  return `${baseUrl}/storage/v1/object/public/alphabet/${fileName}`;
}

export default function AlphabetPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const [stage, setStage] = useState<QuizStage>("study");
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(3);
  const [countdownStep, setCountdownStep] = useState(3);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionEndsAt, setQuestionEndsAt] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [passed, setPassed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = questions[questionIndex];

  function applyTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
      template
    );
  }

  const countdownLabel = useMemo(() => {
    if (countdownStep === 3) return copy.ready;
    if (countdownStep === 2) return copy.set;
    return copy.go;
  }, [copy.go, copy.ready, copy.set, countdownStep]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  function playLetterAudio(letter: string) {
    const src = publicAlphabetUrl(`${letter}.mp3`);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    void audio.play();
  }

  useEffect(() => {
    if (stage !== "countdown") return;

    if (countdownStep <= 0) {
      const timeoutId = window.setTimeout(() => {
        const endsAt = Date.now() + secondsPerQuestion * 1000;
        setQuestionEndsAt(endsAt);
        setTimeLeftMs(secondsPerQuestion * 1000);
        setStage("question");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => setCountdownStep((prev) => prev - 1), 900);
    return () => window.clearTimeout(timeoutId);
  }, [countdownStep, secondsPerQuestion, stage]);

  useEffect(() => {
    if (stage !== "question" || !questionEndsAt) return;

    const tick = window.setInterval(() => {
      const remaining = Math.max(0, questionEndsAt - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(tick);
        setStage("feedback");
        if (current) {
          playLetterAudio(current.letter);
        }
      }
    }, 100);

    return () => window.clearInterval(tick);
  }, [current, questionEndsAt, stage]);

  function playSuccessTrumpet() {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      const start = now + index * 0.12;
      const stop = start + 0.18;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, start);
      noteGain.gain.setValueAtTime(0.001, start);
      noteGain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, stop);

      osc.connect(noteGain);
      noteGain.connect(master);
      osc.start(start);
      osc.stop(stop);
    });

    window.setTimeout(() => {
      void ctx.close();
    }, 1200);
  }

  function beginQuizFlow() {
    const nextQuestions = buildQuizQuestions();
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setWrongAnswers([]);
    setPassed(false);
    setShowCelebration(false);
    setConfettiPieces([]);
    setCountdownStep(3);
    setStage("countdown");
  }

  function abandonQuiz() {
    setStage("study");
    setQuestionIndex(0);
    setQuestions([]);
    setWrongAnswers([]);
    setPassed(false);
    setShowCelebration(false);
    setConfettiPieces([]);
    setCountdownStep(3);
    setQuestionEndsAt(null);
    setTimeLeftMs(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function endQuiz(nextWrongAnswers: WrongAnswer[]) {
    const didPass = nextWrongAnswers.length <= 2;
    setPassed(didPass);
    setShowCelebration(didPass);
    setStage("results");
    if (didPass) {
      playSuccessTrumpet();
      setConfettiPieces(createConfettiPieces());
      window.setTimeout(() => {
        setShowCelebration(false);
        setConfettiPieces([]);
      }, 2600);
    }
  }

  function handleFeedback(correct: boolean) {
    if (!current) return;

    const nextWrongAnswers = correct
      ? wrongAnswers
      : [...wrongAnswers, { letter: current.letter, display: current.display }];

    if (!correct) {
      setWrongAnswers(nextWrongAnswers);
    }

    const isLastQuestion = questionIndex >= QUIZ_SIZE - 1;
    if (isLastQuestion) {
      endQuiz(nextWrongAnswers);
      return;
    }

    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setStage("question");
    const endsAt = Date.now() + secondsPerQuestion * 1000;
    setQuestionEndsAt(endsAt);
    setTimeLeftMs(secondsPerQuestion * 1000);
  }

  const totalTime = secondsPerQuestion * 1000;
  const progress = totalTime ? Math.max(0, Math.min(1, timeLeftMs / totalTime)) : 0;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AppShell title={copy.alphabet} subtitle={copy.alphabetSubtitle}>
      {showCelebration ? (
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

      {stage !== "study" ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="icon-xs"
            variant="secondary"
            aria-label={copy.exitQuiz}
            className="rounded-full"
            onClick={abandonQuiz}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {stage === "study" ? (
        <>
          <Card className="border-0 bg-linear-to-r from-fuchsia-500 via-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/30">
            <CardContent className="space-y-4 p-5">
              <p className="text-lg font-black">{copy.alphabetStudyIntro}</p>
              <Button size="lg" className="w-full bg-white text-rose-700 hover:bg-rose-100" onClick={() => setStage("setup")}>
                {copy.startLetterQuiz}
              </Button>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => playLetterAudio(letter)}
                className="rounded-3xl border-0 bg-linear-to-br from-cyan-500 via-blue-500 to-indigo-600 p-4 text-white shadow-lg shadow-blue-500/25 transition-transform active:scale-[0.98]"
                aria-label={applyTemplate(copy.playLetterAriaTemplate, { letter })}
              >
                <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-white/10 px-2 py-4 backdrop-blur-sm">
                  <p className="text-[3.2rem] leading-none font-black">{letter.toUpperCase()}</p>
                  <p className="mt-2 text-[2.35rem] leading-none font-bold text-white/95">{letter}</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                    <Volume2 className="h-4 w-4" />
                    {copy.play}
                  </span>
                </div>
              </button>
            ))}
          </section>
        </>
      ) : null}

      {stage === "setup" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{copy.letterQuizTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="font-semibold text-foreground">{copy.chooseSecondsPerLetter}</p>
            <div className="grid grid-cols-3 gap-3">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="lg"
                  onClick={() => setSecondsPerQuestion(option)}
                  className={cn(
                    "w-full",
                    option === secondsPerQuestion
                      ? "bg-linear-to-r from-emerald-500 to-cyan-500 text-white"
                      : "bg-sky-100 text-slate-800 hover:bg-sky-200"
                  )}
                >
                  {option}s
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" onClick={beginQuizFlow}>
                {copy.beginQuiz}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setStage("study")}>
                {copy.studyMore}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stage === "countdown" ? (
        <Card className="border-0 bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-xl font-semibold">
              {applyTemplate(copy.questionOfTemplate, { current: questionIndex + 1, total: QUIZ_SIZE })}
            </p>
            <p className="text-6xl font-black">{countdownLabel}</p>
          </CardContent>
        </Card>
      ) : null}

      {stage === "question" && current ? (
        <Card className="border-0 bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-500/30">
          <CardContent className="p-5">
            <p className="mb-4 text-center text-lg font-semibold">
              {applyTemplate(copy.questionOfTemplate, { current: questionIndex + 1, total: QUIZ_SIZE })}
            </p>
            <div className="relative mx-auto flex h-[16.5rem] w-[16.5rem] items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 220 220" role="img" aria-label={copy.questionTimerAria}>
                <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.25)" strokeWidth="14" fill="none" />
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  stroke="white"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="flex h-52 w-52 items-center justify-center rounded-full bg-white text-[8rem] leading-none font-black text-indigo-700">
                {current.display}
              </div>
            </div>
            <p className="mt-4 text-center text-lg font-bold">{Math.ceil(timeLeftMs / 1000)}s</p>
          </CardContent>
        </Card>
      ) : null}

      {stage === "feedback" && current ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-sky-100 px-6 py-3 text-6xl font-black text-sky-700">{current.display}</div>
              <p className="text-lg font-semibold text-foreground">{copy.timesUpListenMark}</p>
              <Button size="lg" onClick={() => playLetterAudio(current.letter)}>
                <AudioLines className="h-5 w-5" />
                {copy.playAudioAgain}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFeedback(true)}>
                <ThumbsUp className="h-5 w-5" />
                {copy.iGotIt}
              </Button>
              <Button size="lg" variant="destructive" onClick={() => handleFeedback(false)}>
                <ThumbsDown className="h-5 w-5" />
                {copy.iMissedIt}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stage === "results" ? (
        <div className="space-y-4">
          <Card
            className={cn(
              "border-0 text-white",
              passed
                ? "bg-linear-to-r from-emerald-500 via-lime-500 to-green-600 shadow-lg shadow-green-500/25"
                : "bg-linear-to-r from-orange-500 via-rose-500 to-red-600 shadow-lg shadow-rose-500/25"
            )}
          >
            <CardContent className="space-y-3 p-5 text-center">
              <p className="text-3xl font-black">{passed ? copy.greatWork : copy.keepPracticing}</p>
              <p className="text-lg font-semibold">
                {applyTemplate(copy.missedSummaryTemplate, { count: wrongAnswers.length, total: QUIZ_SIZE })}
              </p>
              <p className="text-base">{passed ? copy.passedWithTwoOrFewer : copy.passRequirement}</p>
              {passed ? <p className="text-4xl" aria-label="celebration">🎉🎺</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{copy.wrongAnswers}</CardTitle>
            </CardHeader>
            <CardContent>
              {wrongAnswers.length === 0 ? (
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{copy.noWrongAnswersThisRound}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {wrongAnswers.map((item, index) => (
                    <button
                      key={`${item.letter}-${index}`}
                      type="button"
                      onClick={() => playLetterAudio(item.letter)}
                      className="rounded-2xl bg-sky-100 p-3 text-left transition-colors hover:bg-sky-200"
                    >
                      <p className="text-5xl leading-none font-black text-sky-700">{item.display}</p>
                      <p className="mt-1 text-2xl font-bold text-sky-600">
                        {item.letter.toUpperCase()} / {item.letter}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-sm font-semibold text-sky-700">
                        <Volume2 className="h-4 w-4" />
                        {copy.play}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={() => setStage("setup")}>
              <RotateCcw className="h-5 w-5" />
              {passed ? copy.quizAgain : copy.tryAgain}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setStage("study")}>
              {copy.studyMore}
            </Button>
          </div>
        </div>
      ) : null}
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
