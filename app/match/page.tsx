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
import { useMemo, useState } from "react";

type ContentKind = "text" | "image" | "audio";
type MatchingMode =
  | "audio-text"
  | "audio-image"
  | "image-text"
  | "image-audio"
  | "text-image"
  | "text-audio";

type Pair = { id: string; item: VocabularyItem };

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function MatchingPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user } = useAuth();

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [mode, setMode] = useState<MatchingMode>("image-text");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "good" | "bad">("idle");
  const [failedImageSrcs, setFailedImageSrcs] = useState<Record<string, true>>({});
  const { defaultLessonId } = useCourseProgress({ lessons, vocab, user });
  const activeLesson = selectedLesson || defaultLessonId || "all";

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
  const lessonFilteredVocab = useMemo(() => {
    if (activeLesson === "all") return vocab;
    return vocab.filter((item) => item.lesson_id === activeLesson);
  }, [vocab, activeLesson]);

  const pairs = useMemo<Pair[]>(() => {
    const filtered = lessonFilteredVocab.filter((item) => {
      if (!modeUsesImage) return true;
      const src = resolveVocabMediaUrl(item.image_url);
      if (!src) return false;
      return !failedImageSrcs[src];
    });

    return filtered.slice(0, 6).map((item) => ({
      id: item.id,
      item,
    }));
  }, [lessonFilteredVocab, modeUsesImage, failedImageSrcs]);

  const answers = useMemo(() => shuffle(pairs), [pairs]);

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
          <Headphones className="h-4 w-4" />
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
        className="h-20 w-full rounded-md object-contain"
        onError={() =>
          setFailedImageSrcs((prev) =>
            prev[src] ? prev : { ...prev, [src]: true }
          )
        }
      />
    );
  }

  function chooseAnswer(answerId: string) {
    if (!selectedPrompt) return;

    if (selectedPrompt === answerId) {
      setMatched((prev) => (prev.includes(answerId) ? prev : [...prev, answerId]));
      setFeedback("good");
    } else {
      setFeedback("bad");
    }
    setSelectedPrompt(null);
  }

  return (
    <AppShell title={copy.matching}>
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
              setMatched([]);
              setFeedback("idle");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={copy.lesson} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.allLessons}</SelectItem>
              {lessons.map((lesson) => (
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
              setMatched([]);
              setFeedback("idle");
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
        <>
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              <div className="space-y-2">
                {pairs.map((pair) => (
                  <Button
                    key={pair.id}
                    type="button"
                    variant={selectedPrompt === pair.id ? "default" : "outline"}
                    disabled={matched.includes(pair.id)}
                    onClick={() => {
                      if (promptKind === "audio") {
                        playAudio(pair.item);
                      }
                      setSelectedPrompt(pair.id);
                    }}
                    className="h-auto min-h-16 w-full justify-start py-3 text-left"
                  >
                    {renderContent(pair.item, promptKind)}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                {answers.map((answer) => (
                  <Button
                    key={answer.id}
                    type="button"
                    variant="secondary"
                    disabled={matched.includes(answer.id)}
                    onClick={() => {
                      if (answerKind === "audio") {
                        playAudio(answer.item);
                      }
                      chooseAnswer(answer.id);
                    }}
                    className="h-auto min-h-16 w-full justify-start py-3 text-left"
                  >
                    {renderContent(answer.item, answerKind)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
