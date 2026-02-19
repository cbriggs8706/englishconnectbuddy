"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
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
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { LessonPattern } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type PatternMap = Record<string, LessonPattern>;

type PatternSlot = {
  label: string;
  url: string | null | undefined;
};

function PatternImageGrid({ title, slots, fallback }: { title: string; slots: PatternSlot[]; fallback: string }) {
  const hasAny = slots.some((slot) => Boolean(slot.url));

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="space-y-3 p-5">
        <p className="text-xl font-black text-slate-900">{title}</p>
        {hasAny ? (
          <div className="grid gap-3">
            {slots.map((slot) => (
              <div key={slot.label} className="rounded-2xl border-2 border-sky-100 bg-sky-50 p-3">
                <p className="mb-2 text-base font-bold text-slate-900">{slot.label}</p>
                {slot.url ? (
                  <img src={slot.url} alt={`${title} ${slot.label}`} className="w-full rounded-xl object-contain" />
                ) : (
                  <p className="text-base font-semibold text-slate-700">{fallback}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base font-semibold text-slate-700">{fallback}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PatternsPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;
  const { defaultLessonId } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse,
  });
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [patternsByLesson, setPatternsByLesson] = useState<PatternMap>({});
  const [message, setMessage] = useState<string | null>(null);

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );
  const activeLessonId = selectedLesson || defaultLessonId || visibleLessons[0]?.id || "";
  const activePattern = useMemo(
    () => (activeLessonId ? patternsByLesson[activeLessonId] : undefined),
    [activeLessonId, patternsByLesson]
  );

  useEffect(() => {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    async function loadPatterns() {
      const supabase = createClient();
      const { data, error } = await supabase.from("lesson_patterns").select("*");

      if (error) {
        setMessage(error.message);
        return;
      }

      const nextMap: PatternMap = {};
      for (const row of data || []) {
        const pattern = row as LessonPattern;
        nextMap[pattern.lesson_id] = pattern;
      }
      setPatternsByLesson(nextMap);
      setMessage(null);
    }

    void loadPatterns();
  }, [copy.supabaseMissing]);

  const englishSlots: PatternSlot[] = [
    { label: "Pattern 1 Question", url: activePattern?.en_pattern_1_question_image_url },
    { label: "Pattern 1 Answer", url: activePattern?.en_pattern_1_answer_image_url },
    { label: "Pattern 2 Question", url: activePattern?.en_pattern_2_question_image_url },
    { label: "Pattern 2 Answer", url: activePattern?.en_pattern_2_answer_image_url },
  ];

  const selectedSlots: PatternSlot[] =
    language === "pt"
      ? [
          { label: "Pattern 1 Question", url: activePattern?.pt_pattern_1_question_image_url },
          { label: "Pattern 1 Answer", url: activePattern?.pt_pattern_1_answer_image_url },
          { label: "Pattern 2 Question", url: activePattern?.pt_pattern_2_question_image_url },
          { label: "Pattern 2 Answer", url: activePattern?.pt_pattern_2_answer_image_url },
        ]
      : [
          { label: "Pattern 1 Question", url: activePattern?.es_pattern_1_question_image_url },
          { label: "Pattern 1 Answer", url: activePattern?.es_pattern_1_answer_image_url },
          { label: "Pattern 2 Question", url: activePattern?.es_pattern_2_question_image_url },
          { label: "Pattern 2 Answer", url: activePattern?.es_pattern_2_answer_image_url },
        ];

  const selectedTitle = language === "pt" ? "Portuguese Patterns" : "Spanish Patterns";

  return (
    <AppShell title={copy.patterns}>
      <Card className="border-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/30">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-lg font-extrabold">{copy.lesson}</p>
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger className="border-white/40 bg-white text-slate-900">
                <SelectValue placeholder={copy.selectLesson} />
              </SelectTrigger>
              <SelectContent>
                {visibleLessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lessonLabel(lesson, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <PatternImageGrid title="English Patterns" slots={englishSlots} fallback={copy.noPatternForLesson} />
      <PatternImageGrid title={selectedTitle} slots={selectedSlots} fallback={copy.noPatternForLesson} />

      {message ? <p className="text-base font-semibold text-slate-700">{message}</p> : null}
    </AppShell>
  );
}
