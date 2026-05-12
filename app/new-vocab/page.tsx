"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { languageNames } from "@/lib/i18n";
import { resolveVocabMediaUrl } from "@/lib/media";
import { Language, VocabularyItem } from "@/lib/types";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import { TouchEvent, useEffect, useMemo, useRef, useState } from "react";

type TranslationOption = {
  id: Language;
  getText: (item: VocabularyItem) => string;
};

const pageCopy: Record<
  Language,
  {
    subtitle: string;
    heroTitle: string;
    heroBody: string;
    lessonLabel: string;
    languageLabel: string;
    languageHint: string;
    start: string;
    exit: string;
    previous: string;
    next: string;
    audio: string;
    noWords: string;
    noImage: string;
    progress: string;
  }
> = {
  en: {
    subtitle: "Projector-friendly vocabulary slides",
    heroTitle: "New Vocab",
    heroBody: "Choose one lesson, then show each vocabulary image with the English word on top and selected languages across the bottom.",
    lessonLabel: "Lesson",
    languageLabel: "Native languages to show",
    languageHint: "Choose any app languages. If a translation is missing, this view will fall back to English.",
    start: "Start slideshow",
    exit: "Back to setup",
    previous: "Previous",
    next: "Next",
    audio: "Play audio",
    noWords: "No vocabulary words with images were found for this lesson.",
    noImage: "No image available for this word.",
    progress: "Word",
  },
  es: {
    subtitle: "Diapositivas de vocabulario para proyector",
    heroTitle: "New Vocab",
    heroBody: "Elige una lección y muestra cada imagen de vocabulario con la palabra en inglés arriba y los idiomas elegidos abajo.",
    lessonLabel: "Lección",
    languageLabel: "Idiomas nativos para mostrar",
    languageHint: "Elige cualquier idioma de la app. Si falta una traducción, esta vista usará inglés.",
    start: "Iniciar presentación",
    exit: "Volver a configuración",
    previous: "Anterior",
    next: "Siguiente",
    audio: "Reproducir audio",
    noWords: "No se encontraron palabras de vocabulario con imágenes para esta lección.",
    noImage: "No hay imagen para esta palabra.",
    progress: "Palabra",
  },
  pt: {
    subtitle: "Slides de vocabulário para projetor",
    heroTitle: "New Vocab",
    heroBody: "Escolha uma lição e mostre cada imagem de vocabulário com a palavra em inglês em cima e os idiomas escolhidos embaixo.",
    lessonLabel: "Lição",
    languageLabel: "Idiomas nativos para mostrar",
    languageHint: "Escolha qualquer idioma do app. Se faltar tradução, esta tela usará inglês.",
    start: "Iniciar apresentação",
    exit: "Voltar à configuração",
    previous: "Anterior",
    next: "Próxima",
    audio: "Tocar áudio",
    noWords: "Nenhuma palavra de vocabulário com imagem foi encontrada para esta lição.",
    noImage: "Nenhuma imagem disponível para esta palavra.",
    progress: "Palavra",
  },
  sw: {
    subtitle: "Slaydi za msamiati za projektor",
    heroTitle: "New Vocab",
    heroBody: "Chagua somo moja, kisha onyesha kila picha ya msamiati na neno la Kiingereza juu na lugha ulizochagua chini.",
    lessonLabel: "Somo",
    languageLabel: "Lugha za nyumbani za kuonyesha",
    languageHint: "Chagua lugha yoyote ya app. Tafsiri ikikosekana, mwonekano huu utatumia Kiingereza.",
    start: "Anza maonyesho",
    exit: "Rudi kwenye mipangilio",
    previous: "Iliyopita",
    next: "Inayofuata",
    audio: "Cheza sauti",
    noWords: "Hakuna maneno ya msamiati yenye picha yaliyopatikana kwa somo hili.",
    noImage: "Hakuna picha kwa neno hili.",
    progress: "Neno",
  },
  chk: {
    subtitle: "Vocabulary slide fan projector",
    heroTitle: "New Vocab",
    heroBody: "Kose ngeni lesson, iwe kopwe pwisin noun pichcha me English asan me language ke finata fan.",
    lessonLabel: "Lesson",
    languageLabel: "Native language repwe pwisin",
    languageHint: "Kose angei app language meinisin. Ika esapw wor translation, ei view epwe noun noun English.",
    start: "Poputa slideshow",
    exit: "Nofe ngeni setup",
    previous: "Mwu",
    next: "Mwurin",
    audio: "Play audio",
    noWords: "Esapw wor vocabulary word mei wor pichcha non ei lesson.",
    noImage: "Esapw wor pichcha fan ei word.",
    progress: "Word",
  },
};

const translationOptions: TranslationOption[] = [
  {
    id: "en",
    getText: (item) => item.english_text,
  },
  {
    id: "es",
    getText: (item) => item.spanish_text || item.english_text,
  },
  {
    id: "pt",
    getText: (item) => item.portuguese_text || item.english_text,
  },
  {
    id: "sw",
    getText: (item) => item.english_text,
  },
  {
    id: "chk",
    getText: (item) => item.english_text,
  },
];

function sortLessonWords(items: VocabularyItem[]) {
  return [...items].sort((a, b) => {
    const aSort = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bSort = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (aSort !== bSort) return aSort - bSort;
    return a.english_text.localeCompare(b.english_text);
  });
}

export default function NewVocabPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const { lessons, vocab, loading } = useCurriculum();
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<Array<TranslationOption["id"]>>(["es"]);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageSrcs, setFailedImageSrcs] = useState<Record<string, true>>({});
  const touchStartX = useRef<number | null>(null);

  const wordLessons = useMemo(() => {
    const wordLessonIds = new Set(
      vocab
        .filter((item) => (item.item_type ?? "").trim().toLowerCase() === "word")
        .map((item) => item.lesson_id),
    );

    return lessons.filter((lesson) => wordLessonIds.has(lesson.id));
  }, [lessons, vocab]);

  useEffect(() => {
    if (!selectedLessonId && wordLessons[0]?.id) {
      setSelectedLessonId(wordLessons[0].id);
    }
  }, [selectedLessonId, wordLessons]);

  const lessonWords = useMemo(() => {
    if (!selectedLessonId) return [];

    const filtered = vocab.filter((item) => {
      const isWord = (item.item_type ?? "").trim().toLowerCase() === "word";
      if (!isWord || item.lesson_id !== selectedLessonId) return false;

      const src = resolveVocabMediaUrl(item.image_url);
      if (!src) return false;
      return !failedImageSrcs[src];
    });

    return sortLessonWords(filtered);
  }, [failedImageSrcs, selectedLessonId, vocab]);

  useEffect(() => {
    setCurrentIndex((prev) => (lessonWords.length === 0 ? 0 : Math.min(prev, lessonWords.length - 1)));
  }, [lessonWords.length]);

  const currentWord = lessonWords[currentIndex] ?? null;

  function toggleLanguage(optionId: TranslationOption["id"]) {
    setSelectedLanguages((prev) =>
      prev.includes(optionId) ? prev.filter((entry) => entry !== optionId) : [...prev, optionId],
    );
  }

  function startSlideshow() {
    if (!selectedLessonId || selectedLanguages.length === 0 || lessonWords.length === 0) return;
    setCurrentIndex(0);
    setStarted(true);
  }

  function goPrevious() {
    setCurrentIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  }

  function goNext() {
    setCurrentIndex((prev) => (prev >= lessonWords.length - 1 ? lessonWords.length - 1 : prev + 1));
  }

  function playAudio() {
    const src = resolveVocabMediaUrl(currentWord?.audio_url);
    if (!src) return;
    const audio = new Audio(src);
    void audio.play();
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? null;
    if (endX === null) return;

    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 45) return;
    if (deltaX > 0) {
      goPrevious();
      return;
    }
    goNext();
  }

  useEffect(() => {
    if (!started) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [started, lessonWords.length]);

  if (started && currentWord) {
    const imageSrc = resolveVocabMediaUrl(currentWord.image_url);

    return (
      <main className="flex min-h-screen flex-col bg-white text-slate-950">
        <header className="border-b border-slate-200 bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 px-4 py-4 text-white sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="hidden min-w-[8rem] md:block">
              <p className="text-[clamp(1rem,1.6vw,1.25rem)] font-black uppercase tracking-[0.18em] text-white/90">
                {copy.progress} {currentIndex + 1} / {lessonWords.length}
              </p>
            </div>
            <div className="min-w-0 text-center">
              <h1 className="text-[clamp(2.8rem,6vw,6.5rem)] font-black leading-[0.92] tracking-tight text-white">
                {currentWord.english_text}
              </h1>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white/85 md:hidden">
                {copy.progress} {currentIndex + 1} / {lessonWords.length}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Button
                type="button"
                size="icon-lg"
                className="rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50"
                onClick={playAudio}
                aria-label={copy.audio}
              >
                <Play className="h-7 w-7 fill-current" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                className="rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50"
                onClick={() => setStarted(false)}
                aria-label={copy.exit}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-6">
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={currentWord.english_text}
                  className="h-full max-h-[calc(100vh-18rem)] w-full object-contain"
                  onError={() =>
                    setFailedImageSrcs((prev) => (prev[imageSrc] ? prev : { ...prev, [imageSrc]: true }))
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-8 text-center text-[clamp(1.4rem,2.5vw,2.6rem)] font-bold text-slate-500">
                  {copy.noImage}
                </div>
              )}

              <button
                type="button"
                onClick={goPrevious}
                className="absolute inset-y-0 left-0 w-1/2 outline-none focus-visible:bg-black/5"
                aria-label={copy.previous}
              />
              <button
                type="button"
                onClick={goNext}
                className="absolute inset-y-0 right-0 w-1/2 outline-none focus-visible:bg-black/5"
                aria-label={copy.next}
              />

              <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg md:block">
                <ArrowLeft className="h-8 w-8" />
              </div>
              <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg md:block">
                <ArrowRight className="h-8 w-8" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-between px-4 md:hidden">
                <div className="rounded-full bg-white/92 p-3 text-slate-800 shadow-lg">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <div className="rounded-full bg-white/92 p-3 text-slate-800 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <footer className="bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 px-4 py-5 text-white sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
              {selectedLanguages.map((optionId) => {
                const option = translationOptions.find((entry) => entry.id === optionId);
                if (!option) return null;

                return (
                  <p key={option.id} className="text-[clamp(2rem,5vw,5.5rem)] font-black leading-none tracking-tight">
                    {option.getText(currentWord)}
                  </p>
                );
              })}
            </div>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <AppShell title="New Vocab" subtitle={copy.subtitle}>
      <Card className="border-0 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700 text-white shadow-xl shadow-sky-500/30">
        <CardHeader className="space-y-3">
          <Badge className="w-fit rounded-full bg-white text-sky-700">Projector Mode</Badge>
          <CardTitle className="text-3xl font-black">{copy.heroTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-white/95">{copy.heroBody}</p>
          <div className="rounded-3xl bg-white/16 p-4 text-base font-semibold text-white/95">
            {copy.languageHint}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-lg shadow-slate-200/80">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-slate-950">Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-black text-slate-900">{copy.lessonLabel}</p>
            <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
              <SelectTrigger className="h-14 rounded-2xl border-2 text-left text-lg font-semibold">
                <SelectValue placeholder={copy.lessonLabel} />
              </SelectTrigger>
              <SelectContent>
                {wordLessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lessonLabel(lesson, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-black text-slate-900">{copy.languageLabel}</p>
            <div className="grid gap-3">
              {translationOptions.map((option) => {
                const selected = selectedLanguages.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleLanguage(option.id)}
                    className={`rounded-3xl border-2 px-5 py-4 text-left text-lg font-black transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:border-emerald-300"
                    }`}
                  >
                    {languageNames[option.id]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-base font-semibold text-slate-700">
            {loading
              ? "Loading lesson vocabulary..."
              : lessonWords.length > 0
                ? `${lessonWords.length} words ready in this lesson.`
                : copy.noWords}
          </div>

          <Button
            type="button"
            size="lg"
            className="h-16 w-full rounded-3xl bg-emerald-600 text-xl font-black text-white hover:bg-emerald-700"
            disabled={!selectedLessonId || selectedLanguages.length === 0 || lessonWords.length === 0}
            onClick={startSlideshow}
          >
            <Play className="h-6 w-6" />
            {copy.start}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
