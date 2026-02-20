"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lessonLabel } from "@/lib/content";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Language } from "@/lib/types";

type ConfidenceMap = Record<string, number>;

const topCopy: Record<
  Language,
  {
    signInTitle: string;
    signInBody: string;
    profileCta: string;
    cardTitle: string;
    courseLabel: string;
    courseNotSelected: string;
    rateHelp: string;
    answeredLabel: string;
  }
> = {
  en: {
    signInTitle: "Sign in to answer the confidence poll",
    signInBody: "We save one 0-5 confidence score for each lesson in your selected course.",
    profileCta: "Go to Profile",
    cardTitle: "Lesson Confidence Poll",
    courseLabel: "Course",
    courseNotSelected: "Not selected",
    rateHelp: "Rate each lesson from 0 (not confident) to 5 (very confident).",
    answeredLabel: "Answered",
  },
  es: {
    signInTitle: "Inicia sesion para responder la encuesta de confianza",
    signInBody: "Guardamos una calificacion de confianza de 0 a 5 para cada leccion de tu curso seleccionado.",
    profileCta: "Ir al perfil",
    cardTitle: "Encuesta de confianza por leccion",
    courseLabel: "Curso",
    courseNotSelected: "No seleccionado",
    rateHelp: "Califica cada leccion de 0 (sin confianza) a 5 (muy confiado).",
    answeredLabel: "Respondidas",
  },
  pt: {
    signInTitle: "Faca login para responder a enquete de confianca",
    signInBody: "Salvamos uma nota de confianca de 0 a 5 para cada licao do curso selecionado.",
    profileCta: "Ir para Perfil",
    cardTitle: "Enquete de confianca por licao",
    courseLabel: "Curso",
    courseNotSelected: "Nao selecionado",
    rateHelp: "Avalie cada licao de 0 (sem confianca) a 5 (muito confiante).",
    answeredLabel: "Respondidas",
  },
};

export function LessonConfidencePoll() {
  const { lessons, loading: curriculumLoading } = useCurriculum();
  const { user, profile, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = topCopy[language];

  const selectedCourse = profile?.selected_course ?? null;
  const [ratings, setRatings] = useState<ConfidenceMap>({});
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [message, setMessage] = useState<string>("");

  const courseLessons = useMemo(() => {
    const filtered = lessons
      .filter((lesson) => (selectedCourse ? lesson.course === selectedCourse : true))
      .sort((a, b) => a.sequence_number - b.sequence_number);
    return filtered;
  }, [lessons, selectedCourse]);

  const answeredCount = useMemo(
    () => courseLessons.filter((lesson) => Number.isInteger(ratings[lesson.id])).length,
    [courseLessons, ratings]
  );

  const completionPercent = courseLessons.length === 0 ? 0 : (answeredCount / courseLessons.length) * 100;

  useEffect(() => {
    let cancelled = false;

    async function loadExistingRatings() {
      if (!user || !supabaseConfigured() || courseLessons.length === 0) return;

      const supabase = createClient();
      const lessonIds = courseLessons.map((lesson) => lesson.id);
      const { data, error } = await supabase
        .from("lesson_confidence_polls")
        .select("lesson_id, confidence")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds);

      if (cancelled || error || !data) return;

      const next: ConfidenceMap = {};
      for (const row of data) {
        next[row.lesson_id as string] = Number(row.confidence);
      }
      setRatings(next);
    }

    void loadExistingRatings();

    return () => {
      cancelled = true;
    };
  }, [courseLessons, user?.id]);

  async function handleSave() {
    if (!user) {
      setMessage("Please sign in first to save your poll responses.");
      return;
    }

    if (!supabaseConfigured()) {
      setMessage("Supabase env vars are missing.");
      return;
    }

    const rows = courseLessons
      .map((lesson) => {
        const confidence = ratings[lesson.id];
        if (!Number.isInteger(confidence)) return null;

        return {
          user_id: user.id,
          lesson_id: lesson.id,
          confidence,
          updated_at: new Date().toISOString(),
        };
      })
      .filter((row): row is { user_id: string; lesson_id: string; confidence: number; updated_at: string } => Boolean(row));

    if (rows.length === 0) {
      setMessage("Select at least one lesson rating before saving.");
      return;
    }

    setLoadingSaved(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("lesson_confidence_polls").upsert(rows, {
      onConflict: "user_id,lesson_id",
    });

    if (error) {
      setMessage("Could not save poll responses. Please try again.");
      setLoadingSaved(false);
      return;
    }

    setMessage("Poll responses saved.");
    setLoadingSaved(false);
  }

  if (authLoading || curriculumLoading) {
    return <p className="text-base text-muted-foreground">Loading poll...</p>;
  }

  if (!user) {
    return (
      <Card className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30">
        <CardHeader>
          <CardTitle className="text-2xl font-black">{copy.signInTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-white/95">{copy.signInBody}</p>
          <Link href="/profile">
            <Button className="h-12 rounded-2xl bg-white px-6 text-lg font-extrabold text-orange-700 hover:bg-orange-100">
              {copy.profileCta}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white shadow-xl shadow-sky-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-black">{copy.cardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base text-sky-50">
            {copy.courseLabel}: <span className="font-extrabold">{selectedCourse ?? copy.courseNotSelected}</span>
          </p>
          <p className="text-base text-sky-100">{copy.rateHelp}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-sky-100">
              <span>{copy.answeredLabel}</span>
              <span>
                {answeredCount}/{courseLessons.length}
              </span>
            </div>
            <Progress value={completionPercent} className="bg-white/25" />
          </div>
        </CardContent>
      </Card>

      {courseLessons.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-base text-muted-foreground">
            No lessons found for your selected course.
          </CardContent>
        </Card>
      ) : null}

      {courseLessons.map((lesson) => {
        const current = ratings[lesson.id];

        return (
          <Card key={lesson.id} className="border-2 border-sky-100 bg-white">
            <CardContent className="space-y-3 p-4">
              <p className="text-lg font-black text-slate-900">{lessonLabel(lesson, language)}</p>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }, (_, index) => {
                  const selected = current === index;
                  return (
                    <Button
                      key={index}
                      type="button"
                      onClick={() => {
                        setRatings((prev) => ({ ...prev, [lesson.id]: index }));
                        setMessage("");
                      }}
                      className={selected
                        ? "h-12 rounded-2xl bg-emerald-600 text-lg font-black text-white hover:bg-emerald-600"
                        : "h-12 rounded-2xl bg-sky-100 text-lg font-extrabold text-sky-900 hover:bg-sky-200"
                      }
                    >
                      {index}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
        <CardContent className="flex flex-col gap-3 p-5">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={loadingSaved}
            className="h-12 rounded-2xl bg-white text-lg font-black text-emerald-700 hover:bg-emerald-50"
          >
            {loadingSaved ? "Saving..." : "Save poll responses"}
          </Button>
          {message ? <p className="text-base font-semibold text-white/95">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
