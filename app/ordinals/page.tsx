"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { recordOrdinalsRound } from "@/lib/ordinals-achievements";
import { recordStreakActivity } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const ORDINAL_SUFFIXES = ["st", "nd", "rd", "th"] as const;
const REQUIRED_NUMBERS = [11, 12, 13] as const;
const ROUND_SIZE = 20;

type OrdinalSuffix = (typeof ORDINAL_SUFFIXES)[number];

type RoundResult = {
  number: number;
  guess: OrdinalSuffix;
  answer: OrdinalSuffix;
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

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
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

function ordinalSuffixFor(number: number): OrdinalSuffix {
  const lastTwoDigits = number % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return "th";

  const lastDigit = number % 10;
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

function buildRoundNumbers() {
  const pool = Array.from({ length: 200 }, (_, index) => index + 1).filter(
    (number) => !REQUIRED_NUMBERS.includes(number as (typeof REQUIRED_NUMBERS)[number])
  );
  const extras = shuffle(pool).slice(0, ROUND_SIZE - REQUIRED_NUMBERS.length);
  return shuffle([...REQUIRED_NUMBERS, ...extras]);
}

function applyTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function playCorrectPing() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  const notes = [784, 1046.5];

  notes.forEach((freq, index) => {
    const start = now + index * 0.06;
    const stop = start + 0.14;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    noteGain.gain.setValueAtTime(0.001, start);
    noteGain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, stop);

    osc.connect(noteGain);
    noteGain.connect(master);
    osc.start(start);
    osc.stop(stop);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 500);
}

function playSuccessTrumpet() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

export default function OrdinalsPage() {
  const { language } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const copy = t(language);
  const [roundNumbers, setRoundNumbers] = useState<number[]>(() => buildRoundNumbers());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedSuffix, setSelectedSuffix] = useState<OrdinalSuffix | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMedalPopup, setShowMedalPopup] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  const currentNumber = roundNumbers[questionIndex] ?? null;
  const currentAnswer = currentNumber ? ordinalSuffixFor(currentNumber) : null;
  const correctCount = results.filter((item) => item.guess === item.answer).length;
  const missedResults = results.filter((item) => item.guess !== item.answer);
  const isRoundComplete = roundNumbers.length > 0 && questionIndex >= roundNumbers.length;
  const isPerfectRound = isRoundComplete && correctCount === roundNumbers.length;

  const suffixButtonStyles: Record<OrdinalSuffix, string> = {
    st: "bg-gradient-to-br from-lime-500 via-green-500 to-emerald-600 text-white shadow-green-500/30",
    nd: "bg-gradient-to-br from-rose-500 via-red-500 to-red-700 text-white shadow-rose-500/30",
    rd: "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 text-slate-900 shadow-yellow-500/30",
    th: "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white shadow-purple-500/30",
  };

  const resultMessage = useMemo(() => {
    if (!currentNumber || !currentAnswer || !selectedSuffix) return "";
    if (selectedSuffix === currentAnswer) {
      return applyTemplate(copy.ordinalsCorrectAnswerTemplate, {
        number: currentNumber,
        suffix: currentAnswer,
      });
    }
    return applyTemplate(copy.ordinalsWrongAnswerTemplate, {
      number: currentNumber,
      suffix: currentAnswer,
    });
  }, [
    copy.ordinalsCorrectAnswerTemplate,
    copy.ordinalsWrongAnswerTemplate,
    currentAnswer,
    currentNumber,
    selectedSuffix,
  ]);

  function startRound() {
    setRoundNumbers(buildRoundNumbers());
    setQuestionIndex(0);
    setResults([]);
    setSelectedSuffix(null);
    setShowCelebration(false);
    setConfettiPieces([]);
  }

  function handleAnswer(guess: OrdinalSuffix) {
    if (!currentNumber || !currentAnswer || selectedSuffix) return;

    setSelectedSuffix(guess);
    if (guess === currentAnswer) {
      playCorrectPing();
    }

    const result: RoundResult = {
      number: currentNumber,
      guess,
      answer: currentAnswer,
    };

    window.setTimeout(() => {
      const nextResults = [...results, result];
      const nextQuestionIndex = questionIndex + 1;
      const roundComplete = nextQuestionIndex >= roundNumbers.length;
      const nextCorrectCount = nextResults.filter((item) => item.guess === item.answer).length;
      const perfectRound = roundComplete && nextCorrectCount === roundNumbers.length;

      setResults(nextResults);
      setQuestionIndex(nextQuestionIndex);
      setSelectedSuffix(null);

      if (roundComplete && user) {
        void recordStreakActivity({ activityType: "quiz" });
        void recordOrdinalsRound({ wasPerfect: perfectRound }).then((updatedProfile) => {
          if (updatedProfile && updatedProfile.has_ordinals_medal && !profile?.has_ordinals_medal) {
            setShowMedalPopup(true);
          }
          void refreshProfile();
        });
      }

      if (perfectRound) {
        playSuccessTrumpet();
        setConfettiPieces(createConfettiPieces());
        setShowCelebration(true);
        window.setTimeout(() => {
          setShowCelebration(false);
          setConfettiPieces([]);
        }, 2600);
      }
    }, 650);
  }

  return (
    <AppShell title={copy.ordinals} subtitle={copy.ordinalsSubtitle}>
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

      {showMedalPopup ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4">
          <Card className="w-full max-w-md border-0 bg-gradient-to-br from-amber-300 via-yellow-300 to-orange-400 text-slate-900 shadow-2xl shadow-amber-500/40">
            <CardContent className="space-y-4 p-6 text-center">
              <p className="text-6xl" aria-hidden="true">🏅</p>
              <p className="text-3xl font-black">{copy.ordinalsMedalTitle}</p>
              <p className="text-lg font-semibold">{copy.ordinalsPerfectRound}</p>
              <p className="text-base font-semibold">{copy.ordinalsMedalDescription}</p>
              <Button
                size="lg"
                className="w-full bg-white text-amber-700 hover:bg-amber-50"
                onClick={() => setShowMedalPopup(false)}
              >
                {copy.continueGuest}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="border-0 bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 text-white shadow-xl shadow-rose-500/25">
        <CardContent className="space-y-4 p-5">
          <p className="text-2xl font-black">{copy.ordinalsRoundTitle}</p>
          <Button
            size="lg"
            className="w-full bg-white text-rose-700 hover:bg-rose-100"
            onClick={startRound}
          >
            {copy.startOrdinalsRound}
          </Button>
        </CardContent>
      </Card>

      {!isRoundComplete && currentNumber ? (
        <div className="space-y-4">
          <Card className="border-0 bg-white shadow-xl shadow-slate-200">
            <CardContent className="space-y-5 p-5 text-center">
              <div className="flex items-center justify-between gap-3 text-base font-bold text-slate-600">
                <span>
                  {applyTemplate(copy.questionOfTemplate, {
                    current: questionIndex + 1,
                    total: roundNumbers.length,
                  })}
                </span>
                <span>{applyTemplate(copy.ordinalsScoreSummaryTemplate, { correct: correctCount, total: results.length })}</span>
              </div>
              <p className="text-xl font-semibold text-slate-700">{copy.ordinalsQuestionPrompt}</p>
              <div className="rounded-[2rem] bg-slate-50 px-6 py-8">
                <p className="text-[8rem] leading-none font-black tracking-tight text-slate-700 sm:text-[10rem]">
                  {currentNumber}
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-4">
            {ORDINAL_SUFFIXES.map((suffix) => {
              const isSelected = selectedSuffix === suffix;
              const isCorrect = selectedSuffix && suffix === currentAnswer;
              const isWrong = selectedSuffix === suffix && suffix !== currentAnswer;

              return (
                <Button
                  key={suffix}
                  type="button"
                  size="lg"
                  disabled={Boolean(selectedSuffix)}
                  onClick={() => handleAnswer(suffix)}
                  className={cn(
                    "h-40 rounded-full border-0 text-6xl font-black shadow-2xl transition-all hover:brightness-105 disabled:opacity-100 sm:h-52 sm:text-7xl",
                    suffixButtonStyles[suffix],
                    isSelected ? "scale-[0.98]" : "",
                    isCorrect ? "ring-8 ring-emerald-200" : "",
                    isWrong ? "ring-8 ring-rose-200" : ""
                  )}
                >
                  {suffix}
                </Button>
              );
            })}
          </section>

          <Card
            className={cn(
              "border-0 shadow-lg",
              !selectedSuffix
                ? "bg-slate-100 text-slate-600"
                : selectedSuffix === currentAnswer
                  ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white"
                  : "bg-gradient-to-r from-orange-500 to-rose-500 text-white"
            )}
          >
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold">
                {selectedSuffix ? resultMessage : copy.ordinalsQuestionPrompt}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isRoundComplete ? (
        <div className="space-y-4">
          <Card
            className={cn(
              "border-0 text-white shadow-xl",
              isPerfectRound
                ? "bg-gradient-to-r from-emerald-500 via-lime-500 to-green-600 shadow-green-500/25"
                : "bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 shadow-rose-500/25"
            )}
          >
            <CardContent className="space-y-3 p-5 text-center">
              <p className="text-3xl font-black">
                {isPerfectRound ? copy.ordinalsPerfectRound : copy.ordinalsKeepPracticing}
              </p>
              <p className="text-lg font-semibold">
                {applyTemplate(copy.ordinalsScoreSummaryTemplate, {
                  correct: correctCount,
                  total: roundNumbers.length,
                })}
              </p>
              {isPerfectRound ? <p className="text-4xl" aria-label="celebration">🎉🎺</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{copy.ordinalsReviewTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {missedResults.length === 0 ? (
                <p className="text-lg font-semibold text-emerald-700">{copy.noWrongAnswersThisRound}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {missedResults.map((item) => (
                    <div
                      key={`${item.number}-${item.guess}`}
                      className="rounded-3xl bg-slate-100 p-4"
                    >
                      <p className="text-4xl font-black text-slate-800">{item.number}</p>
                      <p className="mt-2 text-lg font-semibold text-rose-600">
                        {item.number}
                        {item.guess}
                      </p>
                      <p className="text-lg font-bold text-emerald-700">
                        {item.number}
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={startRound}>
            <RotateCcw className="h-5 w-5" />
            {copy.ordinalsPlayAgain}
          </Button>
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
