"use client";

import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { VocabularyItem } from "@/lib/types";
import { AudioLines, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const MIN_SPEED = 0.6;
const MAX_SPEED = 1.6;
const DEFAULT_SPEED = 1;
const AUTO_NEXT_DELAY_MS = 5000;

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

function publicAlphabetUrl(fileName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return fileName;
  return `${baseUrl}/storage/v1/object/public/alphabet/${fileName}`;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function tokenizeWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "").split("").filter(Boolean);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
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

export function Hearing() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [current, setCurrent] = useState<VocabularyItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoNextTimeoutRef = useRef<number | null>(null);

  const courseLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );

  const courseLessonIds = useMemo(() => new Set(courseLessons.map((lesson) => lesson.id)), [courseLessons]);

  const courseVocab = useMemo(() => {
    const filtered = vocab.filter((item) => courseLessonIds.has(item.lesson_id));
    return filtered.filter((item) => {
      const isWord = (item.item_type ?? "").trim().toLowerCase() === "word";
      const hasSpaces = /\s/.test(item.english_text ?? "");
      return isWord && !hasSpaces && tokenizeWord(item.english_text).length > 0;
    });
  }, [courseLessonIds, vocab]);

  useEffect(() => {
    if (current || courseVocab.length === 0) return;
    setCurrent(randomItem(courseVocab));
  }, [courseVocab, current]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (autoNextTimeoutRef.current) {
        window.clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, []);

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

  async function playSpelling() {
    if (!current || isPlaying) return;

    const letters = tokenizeWord(current.english_text);
    if (letters.length === 0) return;

    cancelledRef.current = false;
    setIsPlaying(true);

    try {
      for (const letter of letters) {
        if (cancelledRef.current) break;

        const audio = new Audio(publicAlphabetUrl(`${letter}.mp3`));
        audio.playbackRate = speed;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          void audio.play().catch(() => resolve());
        });

        if (cancelledRef.current) break;
        await wait(Math.max(70, 240 / speed));
      }
    } finally {
      if (!cancelledRef.current) {
        setIsPlaying(false);
      }
    }
  }

  function loadNextWord() {
    if (courseVocab.length === 0) return;
    if (autoNextTimeoutRef.current) {
      window.clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    cancelledRef.current = true;
    setIsPlaying(false);
    setAnswer("");
    setResult(null);
    setShowConfetti(false);
    setConfettiPieces([]);

    const options = current ? courseVocab.filter((item) => item.id !== current.id) : courseVocab;
    setCurrent(randomItem(options.length > 0 ? options : courseVocab));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function normalizeLettersOnly(value: string) {
    return value.toLowerCase().replace(/[^a-z]/g, "");
  }

  function checkAnswer() {
    if (!current) return;
    const expected = normalizeLettersOnly(current.english_text);
    const typed = normalizeLettersOnly(answer);
    const isCorrect = typed === expected;
    setResult(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      playSuccessTrumpet();
      setConfettiPieces(createConfettiPieces());
      setShowConfetti(true);
      autoNextTimeoutRef.current = window.setTimeout(() => {
        loadNextWord();
      }, AUTO_NEXT_DELAY_MS);
    }

    inputRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      {showConfetti ? (
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
      <Card className="border-0 bg-gradient-to-br from-orange-500 via-rose-500 to-red-500 text-white shadow-xl shadow-rose-500/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-black tracking-tight">{copy.hearing}</CardTitle>
          <p className="text-lg font-semibold text-white/95">{copy.hearingSubtitle}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="hearing-speed" className="text-base font-bold text-white">
              {copy.hearingSpeedLabel}: {speed.toFixed(1)}x
            </label>
            <input
              id="hearing-speed"
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.1}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-4 w-full cursor-pointer accent-white"
              aria-label={copy.hearingSpeedLabel}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => void playSpelling()}
              disabled={!current || isPlaying}
              className="h-14 rounded-2xl bg-white text-lg font-black text-rose-700 hover:bg-rose-50"
            >
              <AudioLines className="h-5 w-5" />
              {isPlaying ? copy.hearingPlaying : copy.hearingPlay}
            </Button>
            <Button
              type="button"
              onClick={loadNextWord}
              className="h-14 rounded-2xl bg-white/20 text-lg font-black text-white hover:bg-white/25"
            >
              <RefreshCw className="h-5 w-5" />
              {copy.hearingNextWord}
            </Button>
          </div>

          <form
            className="space-y-3 rounded-2xl bg-white/15 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              checkAnswer();
            }}
          >
            <label htmlFor="hearing-answer" className="text-base font-bold text-white">
              {copy.englishWord}
            </label>
            <Input
              id="hearing-answer"
              ref={inputRef}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={answer}
              disabled={result === "correct"}
              onChange={(event) => {
                setAnswer(event.target.value);
                if (result) setResult(null);
              }}
              className="h-14 border-white/40 bg-white text-xl font-bold text-slate-900"
            />
            <Button
              type="submit"
              disabled={!current || answer.trim().length === 0 || result === "correct"}
              className="h-12 w-full rounded-2xl bg-white text-base font-black text-rose-700 hover:bg-rose-50"
            >
              {copy.check}
            </Button>
            {result ? (
              <p className={result === "correct" ? "text-5xl font-black text-white" : "text-base font-black text-white"}>
                {result === "correct" ? copy.correct : copy.incorrect}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{copy.hearingTip}</p>
        </CardContent>
      </Card>
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
    </div>
  );
}
