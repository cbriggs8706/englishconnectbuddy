"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lessonLabel } from "@/lib/content";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const PAGE_SIZE = 1000;

type StudentProfile = {
  id: string;
  display_name: string | null;
  real_name: string | null;
  nickname: string | null;
  selected_course: string;
};

type ConfidenceRow = {
  user_id: string;
  lesson_id: string;
  confidence: number;
};

type MasteredRow = {
  user_id: string;
  vocab_id: string;
};

type StudentProgress = {
  userId: string;
  course: string;
  completedLessons: number;
  totalLessons: number;
  masteredWords: number;
  totalWords: number;
  lessonPercent: number;
  wordPercent: number;
};

type StudentProgressByCourse = Map<string, StudentProgress>;

async function fetchAllProfiles() {
  const supabase = createClient();
  const allRows: StudentProfile[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, real_name, nickname, selected_course")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No profile data returned") };
    }

    const batch = data as StudentProfile[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllConfidenceRows() {
  const supabase = createClient();
  const allRows: ConfidenceRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("lesson_confidence_polls")
      .select("user_id, lesson_id, confidence")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No confidence poll data returned") };
    }

    const batch = data as ConfidenceRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllMasteredRows() {
  const supabase = createClient();
  const allRows: MasteredRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("user_flashcard_progress")
      .select("user_id, vocab_id")
      .eq("mastered", true)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No mastered data returned") };
    }

    const batch = data as MasteredRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

function displayName(profile: StudentProfile) {
  return (
    profile.real_name?.trim() ||
    profile.nickname?.trim() ||
    profile.display_name?.trim() ||
    `User ${profile.id.slice(0, 8)}`
  );
}

export default function AdminConfidencePollPage() {
  const { lessons, vocab, loading: curriculumLoading } = useCurriculum();
  const { language } = useLanguage();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [confidenceRows, setConfidenceRows] = useState<ConfidenceRow[]>([]);
  const [masteredRows, setMasteredRows] = useState<MasteredRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!supabaseConfigured()) {
        setMessage("Supabase env vars are missing.");
        setLoading(false);
        return;
      }

      const [profilesRes, confidenceRes, masteredRes] = await Promise.all([
        fetchAllProfiles(),
        fetchAllConfidenceRows(),
        fetchAllMasteredRows(),
      ]);

      if (cancelled) return;

      if (profilesRes.error || confidenceRes.error || masteredRes.error) {
        setMessage("Could not load student poll data. Check admin permissions and try again.");
        setLoading(false);
        return;
      }

      setProfiles(profilesRes.data ?? []);
      setConfidenceRows(confidenceRes.data ?? []);
      setMasteredRows(masteredRes.data ?? []);
      setLoading(false);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const vocabLessonMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of vocab) {
      map.set(item.id, item.lesson_id);
    }
    return map;
  }, [vocab]);

  const totalWordsByLesson = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of vocab) {
      map.set(item.lesson_id, (map.get(item.lesson_id) ?? 0) + 1);
    }
    return map;
  }, [vocab]);

  const lessonsByCourse = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const existing = map.get(lesson.course) ?? [];
      existing.push(lesson);
      map.set(lesson.course, existing);
    }

    for (const [course, grouped] of map.entries()) {
      map.set(
        course,
        grouped.sort((a, b) => a.sequence_number - b.sequence_number)
      );
    }

    return map;
  }, [lessons]);

  const confidenceByUserLesson = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of confidenceRows) {
      map.set(`${row.user_id}:${row.lesson_id}`, row.confidence);
    }
    return map;
  }, [confidenceRows]);

  const masteredByUserLesson = useMemo(() => {
    const uniqueUserVocab = new Set<string>();
    for (const row of masteredRows) {
      uniqueUserVocab.add(`${row.user_id}:${row.vocab_id}`);
    }

    const map = new Map<string, number>();
    for (const key of uniqueUserVocab) {
      const [userId, vocabId] = key.split(":");
      const lessonId = vocabLessonMap.get(vocabId);
      if (!lessonId) continue;

      const userLessonKey = `${userId}:${lessonId}`;
      map.set(userLessonKey, (map.get(userLessonKey) ?? 0) + 1);
    }

    return map;
  }, [masteredRows, vocabLessonMap]);

  const courseKeys = useMemo(
    () => Array.from(lessonsByCourse.keys()).sort((a, b) => a.localeCompare(b)),
    [lessonsByCourse]
  );

  const studentProgress = useMemo(() => {
    const rows = new Map<string, StudentProgressByCourse>();

    for (const profile of profiles) {
      const perCourse = new Map<string, StudentProgress>();

      for (const course of courseKeys) {
        const courseLessons = lessonsByCourse.get(course) ?? [];

        let completedLessons = 0;
        let totalWords = 0;
        let masteredWords = 0;

        for (const lesson of courseLessons) {
          const lessonTotalWords = totalWordsByLesson.get(lesson.id) ?? 0;
          const lessonMasteredWords = masteredByUserLesson.get(`${profile.id}:${lesson.id}`) ?? 0;

          totalWords += lessonTotalWords;
          masteredWords += lessonMasteredWords;

          if (lessonTotalWords > 0 && lessonMasteredWords >= lessonTotalWords) {
            completedLessons += 1;
          }
        }

        const totalLessons = courseLessons.length;
        perCourse.set(course, {
          userId: profile.id,
          course,
          completedLessons,
          totalLessons,
          masteredWords,
          totalWords,
          lessonPercent: totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100,
          wordPercent: totalWords === 0 ? 0 : (masteredWords / totalWords) * 100,
        });
      }

      rows.set(profile.id, perCourse);
    }

    return rows;
  }, [profiles, courseKeys, lessonsByCourse, totalWordsByLesson, masteredByUserLesson]);

  const studentsWithNames = useMemo(
    () => [...profiles].sort((a, b) => displayName(a).localeCompare(displayName(b))),
    [profiles]
  );

  return (
    <AdminShell title="Admin: Confidence Poll" subtitle="Students, poll results, and course progress">
      <AdminGate>
        {loading || curriculumLoading ? (
          <p className="text-base text-muted-foreground">Loading student confidence data...</p>
        ) : (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-black">Student Confidence Poll Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-base text-blue-50">
                <p>Students: {studentsWithNames.length}</p>
                <p>Saved poll responses: {confidenceRows.length}</p>
                {message ? <p className="font-semibold text-amber-100">{message}</p> : null}
              </CardContent>
            </Card>

            {studentsWithNames.map((profile) => {
              const progressByCourse = studentProgress.get(profile.id) ?? new Map<string, StudentProgress>();
              const selectedCourse = profile.selected_course?.trim() || "EC1";

              return (
                <Card key={profile.id} className="border-2 border-sky-100 bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl font-black text-slate-900">{displayName(profile)}</CardTitle>
                      <Badge className="bg-emerald-600 text-white">Selected: {selectedCourse}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {courseKeys.map((course) => {
                      const progress = progressByCourse.get(course);
                      const courseLessons = lessonsByCourse.get(course) ?? [];

                      return (
                        <div key={course} className="space-y-3 rounded-2xl bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-base font-black text-slate-900">{course}</p>
                            {course === selectedCourse ? (
                              <Badge className="bg-cyan-600 text-white">Current course</Badge>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                              <span>Completed lessons</span>
                              <span>
                                {progress?.completedLessons ?? 0}/{progress?.totalLessons ?? 0}
                              </span>
                            </div>
                            <Progress value={progress?.lessonPercent ?? 0} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                              <span>Mastered words</span>
                              <span>
                                {progress?.masteredWords ?? 0}/{progress?.totalWords ?? 0}
                              </span>
                            </div>
                            <Progress value={progress?.wordPercent ?? 0} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-800">Lesson confidence (0-5)</p>
                            {courseLessons.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No lessons found for this course.</p>
                            ) : (
                              courseLessons.map((lesson) => {
                                const confidence = confidenceByUserLesson.get(`${profile.id}:${lesson.id}`);

                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between rounded-2xl bg-sky-50 px-3 py-2"
                                  >
                                    <p className="text-sm font-semibold text-slate-900">{lessonLabel(lesson, language)}</p>
                                    <Badge variant={confidence === undefined ? "outline" : "default"}>
                                      {confidence === undefined ? "No response" : confidence}
                                    </Badge>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </AdminGate>
    </AdminShell>
  );
}
