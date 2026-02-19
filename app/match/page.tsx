"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel, promptText } from "@/lib/content";
import { resolveVocabMediaUrl } from "@/lib/media";
import { t } from "@/lib/i18n";
import { VocabularyItem } from "@/lib/types";
import { Headphones } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ContentKind = "text" | "image" | "audio";
type MatchingMode =
  | "audio-text"
  | "audio-image"
  | "image-text"
  | "image-audio"
  | "text-image"
  | "text-audio";

type Pair = { id: string; item: VocabularyItem };
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
  return [...items].sort(() => Math.random() - 0.5);
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

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchContentKey(item: VocabularyItem, kind: ContentKind) {
  if (kind === "text") return `text:${normalizeKey(item.english_text)}`;
  if (kind === "audio") return `audio:${normalizeKey(resolveVocabMediaUrl(item.audio_url) ?? item.id)}`;
  return `image:${normalizeKey(resolveVocabMediaUrl(item.image_url) ?? item.id)}`;
}

export default function MatchingPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [mode, setMode] = useState<MatchingMode>("image-text");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"prompt" | "answer" | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "good" | "bad">("idle");
  const [failedImageSrcs, setFailedImageSrcs] = useState<Record<string, true>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [roundNonce, setRoundNonce] = useState(0);
  const { defaultLessonId } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse,
  });
  const activeLesson = selectedLesson || defaultLessonId || "all";
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );
  const visibleLessonIds = useMemo(
    () => new Set(visibleLessons.map((lesson) => lesson.id)),
    [visibleLessons]
  );

  const modeOptions = [
    { value: "audio-text", label: `${copy.audio} -> ${copy.englishWord}` },
    { value: "audio-image", label: `${copy.audio} -> ${copy.image}` },
    { value: "image-text", label: `${copy.image} -> ${copy.englishWord}` },
    { value: "image-audio", label: `${copy.image} -> ${copy.audio}` },
    { value: "text-image", label: `${copy.englishWord} -> ${copy.image}` },
    { value: "text-audio", label: `${copy.englishWord} -> ${copy.audio}` },
  ] as const;

  const [promptKind, answerKind] = mode.split("-") as [ContentKind, ContentKind];
  const modeUsesImage = promptKind === "image" || answerKind === "image";
  const promptUsesImage = promptKind === "image";
  const answerUsesImage = answerKind === "image";
  const answerIsWordBank = answerKind === "text";
  const promptIsWordBank = promptKind === "text";

  const lessonFilteredVocab = useMemo(() => {
    const courseVocab = !selectedCourse
      ? vocab
      : vocab.filter((item) => visibleLessonIds.has(item.lesson_id));
    if (activeLesson === "all") return courseVocab;
    return courseVocab.filter((item) => item.lesson_id === activeLesson);
  }, [activeLesson, selectedCourse, visibleLessonIds, vocab]);

  const pairs = useMemo<Pair[]>(() => {
    const filtered = lessonFilteredVocab.filter((item) => {
      if (!modeUsesImage) return true;
      const src = resolveVocabMediaUrl(item.image_url);
      if (!src) return false;
      return !failedImageSrcs[src];
    });
    const uniquePairs: Pair[] = [];
    const seenPromptKeys = new Set<string>();
    const seenAnswerKeys = new Set<string>();

    for (const item of shuffle(filtered)) {
      const promptKey = matchContentKey(item, promptKind);
      const answerKey = matchContentKey(item, answerKind);
      if (seenPromptKeys.has(promptKey) || seenAnswerKeys.has(answerKey)) continue;

      seenPromptKeys.add(promptKey);
      seenAnswerKeys.add(answerKey);
      uniquePairs.push({ id: item.id, item });

      if (uniquePairs.length >= 6) break;
    }

    return uniquePairs;
  }, [
    lessonFilteredVocab,
    modeUsesImage,
    failedImageSrcs,
    roundNonce,
    promptKind,
    answerKind,
  ]);

  const answers = useMemo(() => shuffle(pairs), [pairs]);
  const remainingPairs = useMemo(
    () => pairs.filter((pair) => !matched.includes(pair.id)),
    [pairs, matched]
  );
  const remainingAnswers = useMemo(
    () => answers.filter((answer) => !matched.includes(answer.id)),
    [answers, matched]
  );
  const isRoundComplete = pairs.length > 0 && matched.length === pairs.length;

  function playSuccessTrumpet() {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

  function canUseMode(value: MatchingMode) {
    const [candidatePromptKind, candidateAnswerKind] = value.split("-") as [ContentKind, ContentKind];
    const usesImage = candidatePromptKind === "image" || candidateAnswerKind === "image";
    if (!usesImage) return lessonFilteredVocab.length > 0;

    return lessonFilteredVocab.some((item) => {
      const src = resolveVocabMediaUrl(item.image_url);
      return Boolean(src && !failedImageSrcs[src]);
    });
  }

  function pickDifferentMode(currentMode: MatchingMode) {
    const validModes = modeOptions
      .map((option) => option.value as MatchingMode)
      .filter(canUseMode);
    const alternatives = validModes.filter((value) => value !== currentMode);
    if (alternatives.length === 0) return currentMode;
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  useEffect(() => {
    if (!isRoundComplete) return;
    playSuccessTrumpet();
    setConfettiPieces(createConfettiPieces());
    setShowConfetti(true);
    const timeout = window.setTimeout(() => {
      setMode((prev) => pickDifferentMode(prev));
      setSelectedPrompt(null);
      setSelectedSide(null);
      setMatched([]);
      setFeedback("idle");
      setShowConfetti(false);
      setConfettiPieces([]);
      setRoundNonce((prev) => prev + 1);
    }, 2600);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [isRoundComplete]);

  function playAudio(item: VocabularyItem) {
    const src = resolveVocabMediaUrl(item.audio_url);
    if (!src) return;
    const audio = new Audio(src);
    void audio.play();
  }

  function renderContent(item: VocabularyItem, kind: ContentKind) {
    if (kind === "text") {
      return <span>{item.english_text || promptText(item, language)}</span>;
    }

    if (kind === "audio") {
      return (
        <span className="inline-flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          {copy.play} {copy.audio}
        </span>
      );
    }

    const src = resolveVocabMediaUrl(item.image_url);
    if (!src || failedImageSrcs[src]) return null;

    return (
      <img
        src={src}
        alt={item.english_text}
        className="h-32 w-full rounded-lg object-contain"
        onError={() =>
          setFailedImageSrcs((prev) =>
            prev[src] ? prev : { ...prev, [src]: true }
          )
        }
      />
    );
  }

  function chooseTile(tileId: string, side: "prompt" | "answer") {
    if (!selectedPrompt || !selectedSide) {
      setSelectedPrompt(tileId);
      setSelectedSide(side);
      return;
    }

    if (selectedSide === side) {
      setSelectedPrompt(tileId);
      setSelectedSide(side);
      return;
    }

    if (selectedPrompt === tileId) {
      setMatched((prev) => (prev.includes(tileId) ? prev : [...prev, tileId]));
      setFeedback("good");
    } else {
      setFeedback("bad");
    }
    setSelectedPrompt(null);
    setSelectedSide(null);
  }

  return (
    <AppShell title={copy.matching}>
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

      <div className="flex items-center gap-2">
        <Badge>{matched.length}/{pairs.length}</Badge>
        {feedback === "good" ? (
          <p className="text-sm text-emerald-700">{copy.correct}</p>
        ) : null}
        {feedback === "bad" ? (
          <p className="text-sm text-rose-700">{copy.incorrect}</p>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <Select
            value={activeLesson}
            onValueChange={(value) => {
              setSelectedLesson(value);
              setSelectedPrompt(null);
              setSelectedSide(null);
              setMatched([]);
              setFeedback("idle");
              setShowConfetti(false);
              setConfettiPieces([]);
              setRoundNonce((prev) => prev + 1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={copy.lesson} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.allLessons}</SelectItem>
              {visibleLessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  {lessonLabel(lesson, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={mode}
            onValueChange={(value) => {
              setMode(value as MatchingMode);
              setSelectedPrompt(null);
              setSelectedSide(null);
              setMatched([]);
              setFeedback("idle");
              setShowConfetti(false);
              setConfettiPieces([]);
              setRoundNonce((prev) => prev + 1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={copy.mode} />
            </SelectTrigger>
            <SelectContent>
              {modeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {pairs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {copy.noData}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-4">
            {promptIsWordBank ? (
              <div className="flex flex-wrap gap-3">
                {remainingPairs.map((pair) => (
                  <Button
                    key={pair.id}
                    type="button"
                    variant={
                      selectedPrompt === pair.id && selectedSide === "prompt"
                        ? "default"
                        : "secondary"
                    }
                    onClick={() => {
                      chooseTile(pair.id, "prompt");
                    }}
                    className="h-auto min-h-14 px-5 py-3 text-base"
                  >
                    {renderContent(pair.item, promptKind)}
                  </Button>
                ))}
              </div>
            ) : null}

            {answerIsWordBank ? (
              <div className="flex flex-wrap gap-3">
                {remainingAnswers.map((answer) => (
                  <Button
                    key={answer.id}
                    type="button"
                    variant={
                      selectedPrompt === answer.id && selectedSide === "answer"
                        ? "default"
                        : "secondary"
                    }
                    onClick={() => {
                      chooseTile(answer.id, "answer");
                    }}
                    className="h-auto min-h-14 px-5 py-3 text-base"
                  >
                    {renderContent(answer.item, answerKind)}
                  </Button>
                ))}
              </div>
            ) : null}

            <div
              className={`grid grid-cols-1 gap-3 ${
                promptIsWordBank || answerIsWordBank ? "" : "sm:grid-cols-2"
              }`}
            >
              {!promptIsWordBank ? (
                <div className={promptUsesImage ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                  {remainingPairs.map((pair) => (
                    <Button
                      key={pair.id}
                      type="button"
                      variant={
                        selectedPrompt === pair.id && selectedSide === "prompt"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        if (promptKind === "audio") {
                          playAudio(pair.item);
                        }
                        chooseTile(pair.id, "prompt");
                      }}
                      className={`h-auto w-full justify-start py-3 text-left text-base ${
                        promptUsesImage ? "min-h-36" : "min-h-16"
                      }`}
                    >
                      {renderContent(pair.item, promptKind)}
                    </Button>
                  ))}
                </div>
              ) : null}

              {!answerIsWordBank ? (
                <div className={answerUsesImage ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                  {remainingAnswers.map((answer) => (
                  <Button
                    key={answer.id}
                    type="button"
                    variant={
                      selectedPrompt === answer.id && selectedSide === "answer"
                        ? "default"
                        : "secondary"
                    }
                    onClick={() => {
                      if (answerKind === "audio") {
                        playAudio(answer.item);
                      }
                      chooseTile(answer.id, "answer");
                    }}
                    className={`h-auto w-full justify-start py-3 text-left text-base ${
                      answerUsesImage ? "min-h-36" : "min-h-16"
                      }`}
                    >
                      {renderContent(answer.item, answerKind)}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
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
