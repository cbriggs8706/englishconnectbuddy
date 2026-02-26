"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { resolveVocabMediaUrl } from "@/lib/media";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { loadGuestProgress, progressKey } from "@/lib/spaced-repetition";
import { FlashcardProgress, VocabularyItem } from "@/lib/types";
import { ArrowUp, Headphones, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function matchesSearch(item: VocabularyItem, query: string) {
  const candidates = [
    item.english_text,
    item.spanish_text,
    item.portuguese_text,
    item.english_sentence,
    item.spanish_transliteration,
    item.portuguese_transliteration,
    item.ipa,
    item.part_of_speech,
    item.definition,
  ];

  return candidates.some((value) => normalizeSearchText(value).includes(query));
}

export default function DictionaryPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [searchTerm, setSearchTerm] = useState("");
  const [dbProgressMap, setDbProgressMap] = useState<Record<string, FlashcardProgress>>({});
  const [guestProgressMap] = useState(loadGuestProgress());
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );
  const courseVocab = useMemo(() => {
    const inCourse = !selectedCourse
      ? vocab
      : vocab.filter((item) => visibleLessons.some((lesson) => lesson.id === item.lesson_id));

    return inCourse.filter(
      (item) => (item.item_type ?? "").trim().toLowerCase() === "word"
    );
  }, [selectedCourse, visibleLessons, vocab]);

  const lessonOrder = useMemo(
    () => Object.fromEntries(visibleLessons.map((lesson, index) => [lesson.id, index])),
    [visibleLessons]
  );

  useEffect(() => {
    if (!user || !supabaseConfigured()) return;
    const userId = user.id;

    async function loadDbProgress() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_flashcard_progress")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const map: Record<string, FlashcardProgress> = {};
        for (const row of data) {
          map[row.vocab_id] = row as FlashcardProgress;
        }
        setDbProgressMap(map);
      }
    }

    void loadDbProgress();
  }, [user]);

  const filtered = useMemo(() => {
    const query = normalizeSearchText(searchTerm);
    const searched = query
      ? courseVocab.filter((item) => matchesSearch(item, query))
      : courseVocab;

    return [...searched].sort((a, b) => {
      const aLessonOrder = lessonOrder[a.lesson_id] ?? Number.MAX_SAFE_INTEGER;
      const bLessonOrder = lessonOrder[b.lesson_id] ?? Number.MAX_SAFE_INTEGER;
      if (aLessonOrder !== bLessonOrder) return aLessonOrder - bLessonOrder;
      return a.english_text.localeCompare(b.english_text);
    });
  }, [courseVocab, lessonOrder, searchTerm]);

  const lessonById = useMemo(
    () => Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons]
  );

  const groupedByLesson = useMemo(() => {
    const groups: Array<{ lesson: (typeof lessons)[number] | null; items: typeof filtered }> = [];
    const map = new Map<string, typeof filtered>();

    for (const item of filtered) {
      if (!map.has(item.lesson_id)) map.set(item.lesson_id, []);
      map.get(item.lesson_id)!.push(item);
    }

    for (const lesson of visibleLessons) {
      const items = map.get(lesson.id);
      if (!items || items.length === 0) continue;
      groups.push({ lesson, items });
      map.delete(lesson.id);
    }

    for (const [lessonId, items] of map.entries()) {
      const fallbackLesson = lessonById[lessonId] ?? null;
      groups.push({ lesson: fallbackLesson, items });
    }

    return groups;
  }, [filtered, lessonById, visibleLessons]);

  function isMastered(vocabId: string) {
    if (user) return dbProgressMap[vocabId]?.mastered ?? false;
    const guest = guestProgressMap[progressKey(vocabId)];
    return guest?.mastered ?? false;
  }

  function playAudio(url: string | null) {
    const src = resolveVocabMediaUrl(url);
    if (!src) return;
    const audio = new Audio(src);
    void audio.play();
  }

  function lessonSectionId(lessonId: string) {
    return `dictionary-lesson-${lessonId}`;
  }

  function scrollToLesson(lessonId: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(lessonSectionId(lessonId));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function lessonNumberOnly(lesson: (typeof lessons)[number]) {
    return String(lesson.sequence_number ?? lesson.lesson_number);
  }

  return (
    <AppShell title={copy.dictionary}>
      <Card>
        <CardContent className="space-y-3 p-4">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={copy.dictionarySearchPlaceholder}
            aria-label={copy.dictionarySearchPlaceholder}
          />

          {groupedByLesson.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {groupedByLesson.map(({ lesson }) =>
                lesson ? (
                  <Button
                    key={`jump-${lesson.id}`}
                    type="button"
                    size="sm"
                    onClick={() => scrollToLesson(lesson.id)}
                    className="rounded-full bg-linear-to-r from-fuchsia-500 via-rose-500 to-orange-400 text-white hover:from-fuchsia-600 hover:via-rose-600 hover:to-orange-500"
                  >
                    {lessonNumberOnly(lesson)}
                  </Button>
                ) : null
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <div className="space-y-4">
            {groupedByLesson.map(({ lesson: groupedLesson, items }) => (
              <section
                id={groupedLesson ? lessonSectionId(groupedLesson.id) : undefined}
                key={groupedLesson?.id ?? `lesson-${items[0]?.lesson_id ?? "unknown"}`}
                className="scroll-mt-24 space-y-2"
              >
                <div className="rounded-full bg-linear-to-r from-fuchsia-500 via-rose-500 to-orange-400 p-[2px]">
                  <div className="rounded-full bg-white px-4 py-2 text-base font-bold text-rose-700">
                    {groupedLesson ? lessonLabel(groupedLesson, language) : copy.lesson}
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {items.map((item) => {
                    const mastered = isMastered(item.id);
                    const lesson = lessonById[item.lesson_id];
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
                            {lesson ? (
                              <Badge variant="secondary">
                                {lessonLabel(lesson, language)}
                              </Badge>
                            ) : null}
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
              </section>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-base text-muted-foreground">{copy.dictionaryNoResults}</p>
          ) : null}
        </CardContent>
      </Card>

      <Button
        type="button"
        size="icon"
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-linear-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-lg hover:from-blue-700 hover:via-cyan-600 hover:to-emerald-600"
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </AppShell>
  );
}
