"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { resolveVocabMediaUrl } from "@/lib/media";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { loadGuestProgress, progressKey } from "@/lib/spaced-repetition";
import { FlashcardMode, FlashcardProgress } from "@/lib/types";
import { Headphones, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function DictionaryPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user } = useAuth();

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [mode, setMode] = useState<FlashcardMode>("image-audio");
  const [dbProgressMap, setDbProgressMap] = useState<Record<string, FlashcardProgress>>({});
  const [guestProgressMap] = useState(loadGuestProgress());
  const { defaultLessonId } = useCourseProgress({ lessons, vocab, user });
  const activeLesson = selectedLesson || defaultLessonId || "all";

  useEffect(() => {
    if (!user || !supabaseConfigured()) return;
    const userId = user.id;

    async function loadDbProgress() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_flashcard_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("mode", mode);

      if (!error && data) {
        const map: Record<string, FlashcardProgress> = {};
        for (const row of data) {
          map[row.vocab_id] = row as FlashcardProgress;
        }
        setDbProgressMap(map);
      }
    }

    void loadDbProgress();
  }, [user, mode]);

  const filtered = useMemo(() => {
    if (activeLesson === "all") return vocab;
    return vocab.filter((item) => item.lesson_id === activeLesson);
  }, [activeLesson, vocab]);

  function isMastered(vocabId: string) {
    if (user) return dbProgressMap[vocabId]?.mastered ?? false;
    const guest = guestProgressMap[progressKey(vocabId, mode)];
    return guest?.mastered ?? false;
  }

  function playAudio(url: string | null) {
    const src = resolveVocabMediaUrl(url);
    if (!src) return;
    const audio = new Audio(src);
    void audio.play();
  }

  return (
    <AppShell title={copy.dictionary}>
      <Card>
        <CardContent className="space-y-3 p-4">
          <Select value={activeLesson} onValueChange={setSelectedLesson}>
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

          <Select value={mode} onValueChange={(value) => setMode(value as FlashcardMode)}>
            <SelectTrigger>
              <SelectValue placeholder={copy.mode} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image-audio">{copy.modeImageAudio}</SelectItem>
              <SelectItem value="image-text">{copy.modeImageText}</SelectItem>
              <SelectItem value="audio-text">{copy.modeAudioText}</SelectItem>
              <SelectItem value="text-translation">{copy.modeTextTranslation}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <Accordion type="single" collapsible className="w-full">
            {filtered.map((item) => {
              const mastered = isMastered(item.id);
              return (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="px-3">
                    <div className="flex w-full items-center justify-between gap-2 text-left">
                      <span>{item.english_text}</span>
                      <Star className={`h-4 w-4 ${mastered ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"}`} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={mastered ? "default" : "secondary"}>
                        {mastered ? copy.mastered : copy.needsWork}
                      </Badge>
                    </div>

                    {item.image_url ? (
                      <div className="rounded-xl border bg-muted/20 p-2">
                        <img
                          src={resolveVocabMediaUrl(item.image_url) ?? undefined}
                          alt={item.english_text}
                          className="h-40 w-full object-contain"
                        />
                      </div>
                    ) : null}

                    {item.audio_url ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => playAudio(item.audio_url)}>
                        <Headphones className="h-4 w-4" /> {copy.audio}
                      </Button>
                    ) : null}

                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">EN:</span> {item.english_text}</p>
                      <p><span className="font-semibold">ES:</span> {item.spanish_text}</p>
                      <p><span className="font-semibold">PT:</span> {item.portuguese_text}</p>
                      {item.spanish_transliteration ? (
                        <p><span className="font-semibold">{copy.transliterationSpanish}:</span> {item.spanish_transliteration}</p>
                      ) : null}
                      {item.portuguese_transliteration ? (
                        <p><span className="font-semibold">{copy.transliterationPortuguese}:</span> {item.portuguese_transliteration}</p>
                      ) : null}
                      {item.ipa ? (
                        <p><span className="font-semibold">{copy.ipa}:</span> {item.ipa}</p>
                      ) : null}
                      {item.part_of_speech ? (
                        <p><span className="font-semibold">{copy.partOfSpeech}:</span> {item.part_of_speech}</p>
                      ) : null}
                      {item.definition ? (
                        <p><span className="font-semibold">{copy.definition}:</span> {item.definition}</p>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </AppShell>
  );
}
