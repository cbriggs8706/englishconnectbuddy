"use client";

import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Language, Lesson, LessonPattern } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type PatternMap = Record<string, LessonPattern>;

type UnitConfig = {
  id: number;
  titleKey:
    | "conversationUnit1Title"
    | "conversationUnit2Title"
    | "conversationUnit3Title"
    | "conversationUnit4Title"
    | "conversationUnit5Title"
    | "conversationUnit6Title";
  fromSequence: number;
  toSequence: number;
  colors: string;
};

type ConversationImage = {
  id: string;
  lessonId: string;
  lessonSequence: number;
  slot: 1 | 2;
  kind: "question" | "answer";
  url: string;
};

const PATTERN_PAGE_SIZE = 1000;

const units: UnitConfig[] = [
  {
    id: 1,
    titleKey: "conversationUnit1Title",
    fromSequence: 1,
    toSequence: 5,
    colors: "from-blue-600 to-cyan-500",
  },
  {
    id: 2,
    titleKey: "conversationUnit2Title",
    fromSequence: 6,
    toSequence: 9,
    colors: "from-violet-600 to-fuchsia-500",
  },
  {
    id: 3,
    titleKey: "conversationUnit3Title",
    fromSequence: 10,
    toSequence: 13,
    colors: "from-rose-600 to-orange-500",
  },
  {
    id: 4,
    titleKey: "conversationUnit4Title",
    fromSequence: 14,
    toSequence: 17,
    colors: "from-emerald-600 to-teal-500",
  },
  {
    id: 5,
    titleKey: "conversationUnit5Title",
    fromSequence: 18,
    toSequence: 21,
    colors: "from-sky-600 to-blue-500",
  },
  {
    id: 6,
    titleKey: "conversationUnit6Title",
    fromSequence: 22,
    toSequence: 25,
    colors: "from-pink-600 to-rose-500",
  },
];

async function fetchAllLessonPatterns() {
  const supabase = createClient();
  const allRows: LessonPattern[] = [];
  let from = 0;

  while (true) {
    const to = from + PATTERN_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("lesson_patterns")
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No lesson pattern data returned") };
    }

    const batch = data as LessonPattern[];
    allRows.push(...batch);
    if (batch.length < PATTERN_PAGE_SIZE) break;
    from += PATTERN_PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

function lessonForUnit(lesson: Lesson, unit: UnitConfig) {
  const sequence = lesson.sequence_number || lesson.lesson_number;
  return sequence >= unit.fromSequence && sequence <= unit.toSequence;
}

function imageUrlFor(pattern: LessonPattern | undefined, patternLanguage: "en" | "es", slot: 1 | 2, kind: "question" | "answer") {
  if (!pattern) return null;
  const englishUrl =
    slot === 1 && kind === "question"
      ? pattern.en_pattern_1_question_image_url
      : slot === 1 && kind === "answer"
        ? pattern.en_pattern_1_answer_image_url
        : slot === 2 && kind === "question"
          ? pattern.en_pattern_2_question_image_url
          : pattern.en_pattern_2_answer_image_url;
  if (patternLanguage === "es") {
    const spanishUrl =
      slot === 1 && kind === "question"
        ? pattern.es_pattern_1_question_image_url
        : slot === 1 && kind === "answer"
          ? pattern.es_pattern_1_answer_image_url
          : slot === 2 && kind === "question"
            ? pattern.es_pattern_2_question_image_url
            : pattern.es_pattern_2_answer_image_url;
    return spanishUrl || englishUrl;
  }
  return englishUrl;
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, String(value));
  }
  return output;
}

function expandPartOfSpeechLabel(value: string, language: Language) {
  const raw = value.trim();
  const normalized = raw.toLowerCase().replace(/\./g, "");
  const isSw = language === "sw";
  const isChk = language === "chk";
  const localized = {
    noun: language === "es" ? "Sustantivo" : language === "pt" ? "Substantivo" : isSw ? "Nomino" : isChk ? "Noun" : "Noun",
    verb: language === "es" ? "Verbo" : language === "pt" ? "Verbo" : isSw ? "Kitenzi" : isChk ? "Verb" : "Verb",
    adjective: language === "es" ? "Adjetivo" : language === "pt" ? "Adjetivo" : isSw ? "Kivumishi" : isChk ? "Adjective" : "Adjective",
    adverb: language === "es" ? "Adverbio" : language === "pt" ? "Advérbio" : isSw ? "Kielezi" : isChk ? "Adverb" : "Adverb",
    pronoun: language === "es" ? "Pronombre" : language === "pt" ? "Pronome" : isSw ? "Kiwakilishi" : isChk ? "Pronoun" : "Pronoun",
    preposition:
      language === "es" ? "Preposición" : language === "pt" ? "Preposição" : isSw ? "Kihusishi" : isChk ? "Preposition" : "Preposition",
    conjunction:
      language === "es" ? "Conjunción" : language === "pt" ? "Conjunção" : isSw ? "Kiunganishi" : isChk ? "Conjunction" : "Conjunction",
    interjection:
      language === "es" ? "Interjección" : language === "pt" ? "Interjeição" : isSw ? "Kihisishi" : isChk ? "Interjection" : "Interjection",
    determiner:
      language === "es" ? "Determinante" : language === "pt" ? "Determinante" : isSw ? "Kibainishi" : isChk ? "Determiner" : "Determiner",
    article: language === "es" ? "Artículo" : language === "pt" ? "Artigo" : isSw ? "Makala" : isChk ? "Article" : "Article",
    phrase: language === "es" ? "Frase" : language === "pt" ? "Frase" : isSw ? "Kishazi" : isChk ? "Phrase" : "Phrase",
    expression: language === "es" ? "Expresión" : language === "pt" ? "Expressão" : isSw ? "Usemi" : isChk ? "Expression" : "Expression",
    other: language === "es" ? "Otro" : language === "pt" ? "Outro" : isSw ? "Nyingine" : isChk ? "Other" : "Other",
  } as const;
  const map: Record<string, string> = {
    n: localized.noun,
    noun: localized.noun,
    v: localized.verb,
    verb: localized.verb,
    adj: localized.adjective,
    adjective: localized.adjective,
    adv: localized.adverb,
    adverb: localized.adverb,
    pron: localized.pronoun,
    pronoun: localized.pronoun,
    prep: localized.preposition,
    preposition: localized.preposition,
    conj: localized.conjunction,
    conjunction: localized.conjunction,
    interj: localized.interjection,
    interjection: localized.interjection,
    det: localized.determiner,
    determiner: localized.determiner,
    article: localized.article,
    phrase: localized.phrase,
    expression: localized.expression,
    _other: localized.other,
  };
  return map[normalized] ?? (raw ? `${raw.charAt(0).toUpperCase()}${raw.slice(1)}` : localized.other);
}

export function ConversationPatterns() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;

  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [patternLanguage, setPatternLanguage] = useState<"en" | "es">("en");
  const [patternsByLesson, setPatternsByLesson] = useState<PatternMap>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => !selectedCourse || lesson.course === selectedCourse)
        .sort((a, b) => (a.sequence_number || a.lesson_number) - (b.sequence_number || b.lesson_number)),
    [lessons, selectedCourse]
  );

  const activeUnit = useMemo(() => units.find((unit) => unit.id === selectedUnit) ?? null, [selectedUnit]);
  const unitLessons = useMemo(
    () => (activeUnit ? visibleLessons.filter((lesson) => lessonForUnit(lesson, activeUnit)) : []),
    [activeUnit, visibleLessons]
  );

  const conversation = useMemo(() => {
    const rows: ConversationImage[] = [];

    for (const lesson of unitLessons) {
      const lessonPattern = patternsByLesson[lesson.id];
      const lessonSequence = lesson.sequence_number || lesson.lesson_number;
      for (const slot of [1, 2] as const) {
        const questionUrl = imageUrlFor(lessonPattern, patternLanguage, slot, "question");
        if (questionUrl) {
          rows.push({
            id: `${lesson.id}-${slot}-q`,
            lessonId: lesson.id,
            lessonSequence,
            slot,
            kind: "question",
            url: questionUrl,
          });
        }

        const answerUrl = imageUrlFor(lessonPattern, patternLanguage, slot, "answer");
        if (answerUrl) {
          rows.push({
            id: `${lesson.id}-${slot}-a`,
            lessonId: lesson.id,
            lessonSequence,
            slot,
            kind: "answer",
            url: answerUrl,
          });
        }
      }
    }

    return rows;
  }, [patternLanguage, patternsByLesson, unitLessons]);

  useEffect(() => {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    async function loadPatterns() {
      const result = await fetchAllLessonPatterns();
      if (result.error || !result.data) {
        setMessage(result.error?.message ?? copy.conversationPatternsLoadError);
        return;
      }

      const nextMap: PatternMap = {};
      for (const row of result.data) {
        nextMap[row.lesson_id] = row;
      }
      setPatternsByLesson(nextMap);
      setMessage(null);
    }

    void loadPatterns();
  }, [copy.conversationPatternsLoadError, copy.supabaseMissing]);

  const activeLesson = useMemo(() => visibleLessons.find((lesson) => lesson.id === activeLessonId) ?? null, [activeLessonId, visibleLessons]);
  const activeLessonWords = useMemo(
    () =>
      activeLessonId
        ? vocab
            .filter((item) => item.lesson_id === activeLessonId && (item.item_type ?? "").trim().toLowerCase() === "word")
            .sort((a, b) => a.english_text.localeCompare(b.english_text))
        : [],
    [activeLessonId, vocab]
  );
  const activeLessonWordsByPartOfSpeech = useMemo(() => {
    const grouped: Record<string, typeof activeLessonWords> = {};
    for (const word of activeLessonWords) {
      const key = (word.part_of_speech ?? "").trim() || "_other";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(word);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [activeLessonWords]);

  if (!selectedUnit) {
    return (
      <section className="space-y-4">
        <Card className="border-0 bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30">
          <CardContent className="space-y-3 p-5">
            <p className="text-3xl font-black">{copy.conversationPatternsTitle}</p>
            <p className="text-lg font-semibold text-blue-50">{copy.conversationPatternsSubtitle}</p>
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-100">{copy.conversationPatternLanguageLabel}</p>
              <Select value={patternLanguage} onValueChange={(value) => setPatternLanguage(value as "en" | "es")}>
                <SelectTrigger className="border-white/50 bg-white text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{copy.conversationPatternLanguageEnglish}</SelectItem>
                  <SelectItem value="es">{copy.conversationPatternLanguageSpanish}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {units.map((unit) => (
            <button key={unit.id} type="button" onClick={() => setSelectedUnit(unit.id)} className="w-full text-left">
              <Card className={`border-0 bg-linear-to-br ${unit.colors} text-white shadow-lg transition-transform hover:-translate-y-0.5`}>
                <CardContent className="space-y-2 p-5">
                  <p className="text-xl font-black">{fillTemplate(copy.conversationUnitLabel, { unit: unit.id })}</p>
                  <p className="text-2xl font-black leading-tight">{copy[unit.titleKey]}</p>
                  <p className="text-base font-semibold text-white/95">
                    {fillTemplate(copy.conversationLessonsRange, { from: unit.fromSequence, to: unit.toSequence })}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {message ? <p className="text-base font-semibold text-slate-700">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Card className="border-0 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-xl shadow-teal-500/30">
        <CardContent className="space-y-3 p-5">
          <p className="text-base font-bold uppercase tracking-wide">
            {fillTemplate(copy.conversationUnitLabel, { unit: activeUnit?.id ?? "-" })}
          </p>
          <p className="text-3xl font-black leading-tight">{activeUnit ? copy[activeUnit.titleKey] : "-"}</p>
          <p className="text-lg font-semibold text-emerald-50">
            {activeUnit
              ? fillTemplate(copy.conversationLessonsRange, { from: activeUnit.fromSequence, to: activeUnit.toSequence })
              : "-"}
          </p>
          <Button variant="secondary" size="sm" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setSelectedUnit(null)}>
            {copy.conversationChangeUnit}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-100 shadow-md">
        <CardContent className="space-y-4 p-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-linear-to-r from-fuchsia-500 via-rose-500 to-orange-400 p-[2px]">
              <div className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-rose-700">{copy.conversationPersonA}</div>
            </div>
            <div className="rounded-full bg-linear-to-r from-blue-600 via-cyan-500 to-emerald-400 p-[2px]">
              <div className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-blue-700">{copy.conversationPersonB}</div>
            </div>
          </div>

          {conversation.length > 0 ? (
            conversation.map((item) => (
              <div key={item.id} className={`flex ${item.kind === "question" ? "justify-start" : "justify-end"}`}>
                <button
                  type="button"
                  onClick={() => setActiveLessonId(item.lessonId)}
                  className={`max-w-[86%] rounded-3xl p-[4px] ${item.kind === "answer" ? "text-right" : "text-left"} ${
                    item.kind === "question"
                      ? "bg-linear-to-r from-fuchsia-500 via-rose-500 to-orange-400 shadow-md"
                      : "bg-linear-to-r from-blue-600 via-cyan-500 to-emerald-400 shadow-md"
                  }`}
                >
                  <div className={`rounded-[1.25rem] bg-white p-3 text-slate-900 ${item.kind === "answer" ? "text-right" : ""}`}>
                    <p className={`mb-2 text-sm font-bold ${item.kind === "question" ? "text-rose-700" : "text-blue-700"}`}>
                      {fillTemplate(copy.conversationLessonSlotLabel, { lesson: item.lessonSequence, slot: item.slot })}
                    </p>
                    <div className={item.kind === "answer" ? "flex w-full justify-end" : ""}>
                      <img
                        src={item.url}
                        alt={fillTemplate(copy.conversationPatternImageAlt, {
                          lesson: item.lessonSequence,
                          slot: item.slot,
                          role: item.kind === "question" ? copy.conversationPersonA : copy.conversationPersonB,
                        })}
                        className="block max-w-full object-contain"
                      />
                    </div>
                  </div>
                </button>
              </div>
            ))
          ) : (
            <p className="text-lg font-semibold text-slate-700">{copy.conversationNoPatternImages}</p>
          )}
        </CardContent>
      </Card>

      {activeLessonId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4" onClick={() => setActiveLessonId(null)}>
          <Card
            className="max-h-[82vh] w-full max-w-xl overflow-hidden border-0 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{copy.conversationVocabularyTitle}</p>
                  <p className="text-2xl font-black text-slate-900">
                    {fillTemplate(copy.conversationLessonHeading, {
                      lesson: activeLesson?.sequence_number || activeLesson?.lesson_number || "-",
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:brightness-105"
                  onClick={() => setActiveLessonId(null)}
                >
                  {copy.conversationClose}
                </Button>
              </div>

              <div className="max-h-[58vh] space-y-6 overflow-y-auto pr-1">
                {activeLessonWordsByPartOfSpeech.length > 0 ? (
                  activeLessonWordsByPartOfSpeech.map(([partOfSpeech, words]) => (
                    <div key={partOfSpeech} className="space-y-2">
                      <div className="inline-block rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-rose-500 p-[2px]">
                        <p className="rounded-full bg-white px-3 py-1 text-sm font-black uppercase tracking-wide text-fuchsia-700">
                          {expandPartOfSpeechLabel(partOfSpeech, language)}
                        </p>
                      </div>
                      {words.map((word) => (
                        <div key={word.id} className="flex items-start justify-between gap-3 border-b border-slate-200 py-1.5">
                          <p className="text-lg font-black text-slate-900">{word.english_text}</p>
                          <p className="text-sm font-semibold text-slate-600 text-right">
                            {copy.conversationSpanishShort}: {word.spanish_text} | {copy.conversationPortugueseShort}: {word.portuguese_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-lg font-semibold text-slate-700">{copy.conversationNoVocabularyWords}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {message ? <p className="text-base font-semibold text-slate-700">{message}</p> : null}
    </section>
  );
}
