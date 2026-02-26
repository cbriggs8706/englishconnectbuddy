"use client";

import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ConversationKind,
  ConversationPhraseRow,
  defaultSelections,
  normalizeSwapGroups,
  renderTemplate,
  resolveTemplate,
  SwapGroup,
} from "@/lib/conversation-buddy";
import { lessonLabel } from "@/lib/content";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { LessonPattern } from "@/lib/types";
import { HelpCircle, Languages, StepForward } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 500;

type PatternMap = Record<string, LessonPattern>;

type LocalCopy = {
  title: string;
  subtitle: string;
  course: string;
  lesson: string;
  pattern: string;
  question: string;
  answer: string;
  hint: string;
  hideHint: string;
  next: string;
  swaps: string;
  localizedPrompt: string;
  englishHint: string;
  noMapping: string;
  done: string;
};

const copyByLanguage = {
  en: {
    title: "Conversation Buddy",
    subtitle: "Tap the swaps, ask real questions, and move lesson by lesson.",
    course: "Course",
    lesson: "Lesson",
    pattern: "Pattern",
    question: "Question",
    answer: "Answer",
    hint: "Show Hint",
    hideHint: "Hide Hint",
    next: "Next",
    swaps: "Swap Words",
    localizedPrompt: "Prompt",
    englishHint: "English hint",
    noMapping: "No Conversation Buddy mapping exists yet for this lesson slot.",
    done: "You reached the end of mapped lessons.",
  },
  es: {
    title: "Conversation Buddy",
    subtitle: "Toca las opciones, haz preguntas reales y avanza lección por lección.",
    course: "Curso",
    lesson: "Lección",
    pattern: "Patrón",
    question: "Pregunta",
    answer: "Respuesta",
    hint: "Mostrar pista",
    hideHint: "Ocultar pista",
    next: "Siguiente",
    swaps: "Cambiar palabras",
    localizedPrompt: "Frase",
    englishHint: "Pista en inglés",
    noMapping: "Aún no hay configuración de Conversation Buddy para este patrón.",
    done: "Ya llegaste al final de las lecciones configuradas.",
  },
  pt: {
    title: "Conversation Buddy",
    subtitle: "Toque nas opcoes, faca perguntas reais e avance licao por licao.",
    course: "Curso",
    lesson: "Lição",
    pattern: "Padrao",
    question: "Pergunta",
    answer: "Resposta",
    hint: "Mostrar dica",
    hideHint: "Ocultar dica",
    next: "Proximo",
    swaps: "Trocar palavras",
    localizedPrompt: "Frase",
    englishHint: "Dica em inglês",
    noMapping: "Ainda nao ha mapeamento do Conversation Buddy para este padrao.",
    done: "Voce chegou ao final das licoes mapeadas.",
  },
  sw: {
    title: "Conversation Buddy",
    subtitle: "Tap the swaps, ask real questions, and move lesson by lesson.",
    course: "Course",
    lesson: "Lesson",
    pattern: "Pattern",
    question: "Question",
    answer: "Answer",
    hint: "Show Hint",
    hideHint: "Hide Hint",
    next: "Next",
    swaps: "Swap Words",
    localizedPrompt: "Prompt",
    englishHint: "English hint",
    noMapping: "No Conversation Buddy mapping exists yet for this lesson slot.",
    done: "You reached the end of mapped lessons.",
  },
  chk: {
    title: "Conversation Buddy",
    subtitle: "Tap the swaps, ask real questions, and move lesson by lesson.",
    course: "Course",
    lesson: "Lesson",
    pattern: "Pattern",
    question: "Question",
    answer: "Answer",
    hint: "Show Hint",
    hideHint: "Hide Hint",
    next: "Next",
    swaps: "Swap Words",
    localizedPrompt: "Prompt",
    englishHint: "English hint",
    noMapping: "No Conversation Buddy mapping exists yet for this lesson slot.",
    done: "You reached the end of mapped lessons.",
  },
} as const;

function mappingKey(course: string, lesson: number, slot: number, kind: ConversationKind) {
  return `${course.trim().toUpperCase()}::${lesson}::${slot}::${kind}`;
}

async function fetchAllMappedRows() {
  const supabase = createClient();
  const rows: ConversationPhraseRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("phrases")
      .select("id, course, lesson, pattern_slot, kind, template_en, template_es, template_pt, swap_groups, created_at, updated_at")
      .not("pattern_slot", "is", null)
      .not("kind", "is", null)
      .order("course", { ascending: true })
      .order("lesson", { ascending: true })
      .order("pattern_slot", { ascending: true })
      .order("kind", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const batch = (data ?? []) as ConversationPhraseRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export function ConversationBuddy() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language as keyof typeof copyByLanguage] ?? copyByLanguage.en;
  const { lessons } = useCurriculum();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<ConversationPhraseRow[]>([]);
  const [patternsByLesson, setPatternsByLesson] = useState<PatternMap>({});

  const [selectedCourse, setSelectedCourse] = useState<string>(profile?.selected_course ?? "");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [slot, setSlot] = useState<1 | 2>(1);
  const [kind, setKind] = useState<ConversationKind>("question");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [hintOpen, setHintOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const courses = useMemo(() => {
    const set = new Set<string>();
    for (const lesson of lessons) set.add(lesson.course);
    return Array.from(set.values()).sort();
  }, [lessons]);

  useEffect(() => {
    if (selectedCourse) return;
    if (profile?.selected_course) {
      setSelectedCourse(profile.selected_course);
      return;
    }
    if (courses[0]) setSelectedCourse(courses[0]);
  }, [courses, profile?.selected_course, selectedCourse]);

  const courseLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => !selectedCourse || lesson.course === selectedCourse)
        .sort((a, b) => a.sequence_number - b.sequence_number),
    [lessons, selectedCourse],
  );

  const rowMap = useMemo(() => {
    const map: Record<string, ConversationPhraseRow> = {};
    for (const row of rows) {
      if (!row.pattern_slot || !row.kind) continue;
      map[mappingKey(row.course, row.lesson, row.pattern_slot, row.kind)] = row;
    }
    return map;
  }, [rows]);

  const activeLesson = courseLessons[lessonIndex] ?? null;

  const activeQuestion = useMemo(() => {
    if (!activeLesson) return null;
    return rowMap[mappingKey(activeLesson.course, activeLesson.sequence_number, slot, "question")] ?? null;
  }, [activeLesson, rowMap, slot]);

  const activeAnswer = useMemo(() => {
    if (!activeLesson) return null;
    return rowMap[mappingKey(activeLesson.course, activeLesson.sequence_number, slot, "answer")] ?? null;
  }, [activeLesson, rowMap, slot]);

  const activeRow = kind === "question" ? activeQuestion : activeAnswer;

  const swapGroups = useMemo<SwapGroup[]>(() => normalizeSwapGroups(activeRow?.swap_groups), [activeRow?.id]);

  useEffect(() => {
    const defaults = defaultSelections(swapGroups);
    setSelectedOptions(defaults);
    setHintOpen(false);
  }, [activeRow?.id, slot, kind]);

  useEffect(() => {
    if (!activeLesson) {
      setKind("question");
      return;
    }

    const hasQuestion = Boolean(activeQuestion);
    const hasAnswer = Boolean(activeAnswer);

    if (kind === "question" && hasQuestion) return;
    if (kind === "answer" && hasAnswer) return;

    if (hasQuestion) setKind("question");
    else if (hasAnswer) setKind("answer");
  }, [activeAnswer?.id, activeLesson?.id, activeQuestion?.id, kind]);

  useEffect(() => {
    async function load() {
      if (!supabaseConfigured()) {
        setMessage("Supabase is not configured.");
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const [mappedRows, patternsRes] = await Promise.all([
          fetchAllMappedRows(),
          supabase.from("lesson_patterns").select("*"),
        ]);

        setRows(mappedRows);
        const nextPatterns: PatternMap = {};
        for (const row of patternsRes.data ?? []) {
          const pattern = row as LessonPattern;
          nextPatterns[pattern.lesson_id] = pattern;
        }
        setPatternsByLesson(nextPatterns);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load Conversation Buddy data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    setLessonIndex(0);
    setSlot(1);
    setKind("question");
    setIsComplete(false);
  }, [selectedCourse]);

  const renderedLocalized = activeRow
    ? renderTemplate(resolveTemplate(activeRow, language), swapGroups, selectedOptions, language)
    : "";
  const renderedEnglish = activeRow
    ? renderTemplate(resolveTemplate(activeRow, "en"), swapGroups, selectedOptions, "en")
    : "";

  const activePattern = activeLesson ? patternsByLesson[activeLesson.id] : undefined;
  const hintImageUrl =
    kind === "question"
      ? slot === 1
        ? activePattern?.en_pattern_1_question_image_url
        : activePattern?.en_pattern_2_question_image_url
      : slot === 1
        ? activePattern?.en_pattern_1_answer_image_url
        : activePattern?.en_pattern_2_answer_image_url;

  function jumpToSlot(nextSlot: 1 | 2) {
    setSlot(nextSlot);
    setHintOpen(false);
  }

  function nextPrompt() {
    if (!activeLesson || courseLessons.length === 0) return;

    const hasAnyFor = (lessonIdx: number, nextSlot: 1 | 2) => {
      const lesson = courseLessons[lessonIdx];
      if (!lesson) return false;
      return (
        Boolean(rowMap[mappingKey(lesson.course, lesson.sequence_number, nextSlot, "question")]) ||
        Boolean(rowMap[mappingKey(lesson.course, lesson.sequence_number, nextSlot, "answer")])
      );
    };

    const candidates: Array<{ lessonIdx: number; slot: 1 | 2 }> = [];
    if (slot === 1) candidates.push({ lessonIdx: lessonIndex, slot: 2 });
    for (let index = lessonIndex + 1; index < courseLessons.length; index += 1) {
      candidates.push({ lessonIdx: index, slot: 1 });
      candidates.push({ lessonIdx: index, slot: 2 });
    }

    const next = candidates.find((candidate) => hasAnyFor(candidate.lessonIdx, candidate.slot));
    if (!next) {
      setIsComplete(true);
      return;
    }

    setLessonIndex(next.lessonIdx);
    jumpToSlot(next.slot);
    setKind("question");
    setIsComplete(false);
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30">
        <CardHeader>
          <CardTitle className="text-4xl font-black">{copy.title}</CardTitle>
          <p className="text-lg font-semibold text-blue-100">{copy.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl bg-white/15 p-3">
              <p className="text-base font-bold text-white">{copy.course}</p>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-12 border-white/40 bg-white text-base font-bold text-slate-900">
                  <SelectValue placeholder={copy.course} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-2xl bg-white/15 p-3">
              <p className="text-base font-bold text-white">{copy.lesson}</p>
              <p className="text-2xl font-black text-white">{activeLesson ? lessonLabel(activeLesson, language) : "-"}</p>
            </div>

            <div className="space-y-2 rounded-2xl bg-white/15 p-3">
              <p className="text-base font-bold text-white">{copy.pattern}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className={`h-11 px-4 text-base font-black ${slot === 1 ? "bg-white text-blue-700" : "bg-white/15 text-white hover:bg-white/25"}`}
                  onClick={() => jumpToSlot(1)}
                >
                  1
                </Button>
                <Button
                  type="button"
                  className={`h-11 px-4 text-base font-black ${slot === 2 ? "bg-white text-blue-700" : "bg-white/15 text-white hover:bg-white/25"}`}
                  onClick={() => jumpToSlot(2)}
                >
                  2
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setKind("question")}
              className={`h-11 px-5 text-base font-black ${
                kind === "question" ? "bg-lime-300 text-slate-900 hover:bg-lime-200" : "bg-white/15 text-white hover:bg-white/25"
              }`}
              disabled={!activeQuestion}
            >
              {copy.question}
            </Button>
            <Button
              type="button"
              onClick={() => setKind("answer")}
              className={`h-11 px-5 text-base font-black ${
                kind === "answer" ? "bg-amber-300 text-slate-900 hover:bg-amber-200" : "bg-white/15 text-white hover:bg-white/25"
              }`}
              disabled={!activeAnswer}
            >
              {copy.answer}
            </Button>
          </div>

          {activeRow ? (
            <div className="space-y-3 rounded-3xl bg-white p-5 text-slate-900">
              <Badge className="w-fit bg-blue-600 text-base font-black text-white">{copy.localizedPrompt}</Badge>
              <p className="text-4xl font-black leading-tight">{renderedLocalized || resolveTemplate(activeRow, language)}</p>

              {swapGroups.length > 0 ? (
                <div className="space-y-2 rounded-2xl border-2 border-sky-100 bg-sky-50 p-3">
                  <p className="text-base font-black text-sky-800">{copy.swaps}</p>
                  {swapGroups.map((group) => (
                    <div key={group.key} className="space-y-2">
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-600">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((option) => {
                          const selected = selectedOptions[group.key] === option.id;
                          const label =
                            language === "es"
                              ? option.es
                              : language === "pt"
                                ? option.pt
                                : language === "sw"
                                  ? option.en
                                  : language === "chk"
                                    ? option.en
                                    : option.en;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`rounded-full px-4 py-2 text-base font-black transition ${
                                selected ? "bg-blue-600 text-white" : "bg-white text-slate-800 hover:bg-blue-100"
                              }`}
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [group.key]: option.id,
                                }))
                              }
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-12 bg-blue-600 px-5 text-base font-black text-white hover:bg-blue-700"
                  onClick={() => setHintOpen((prev) => !prev)}
                >
                  <HelpCircle className="h-5 w-5" />
                  {hintOpen ? copy.hideHint : copy.hint}
                </Button>
                <Button
                  type="button"
                  className="h-12 bg-lime-500 px-5 text-base font-black text-white hover:bg-lime-600"
                  onClick={nextPrompt}
                >
                  <StepForward className="h-5 w-5" />
                  {copy.next}
                </Button>
              </div>

              {hintOpen ? (
                <div className="space-y-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-base font-black text-emerald-800">{copy.englishHint}</p>
                  <p className="text-2xl font-black text-slate-900">{renderedEnglish || resolveTemplate(activeRow, "en")}</p>
                  {hintImageUrl ? (
                    <img src={hintImageUrl} alt="English pattern" className="w-full rounded-2xl border-2 border-emerald-200" />
                  ) : (
                    <p className="text-base font-semibold text-slate-700">No English pattern image uploaded for this slot.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/20 p-4 text-base font-bold text-white">{copy.noMapping}</div>
          )}
        </CardContent>
      </Card>

      {isComplete ? (
        <Card className="border-0 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 text-white">
          <CardContent className="flex items-center gap-2 p-4 text-lg font-black">
            <Languages className="h-5 w-5" />
            {copy.done}
          </CardContent>
        </Card>
      ) : null}

      {loading ? <p className="text-base font-semibold text-slate-700">Loading Conversation Buddy...</p> : null}
      {message ? <p className="text-base font-semibold text-slate-700">{message}</p> : null}
    </div>
  );
}
