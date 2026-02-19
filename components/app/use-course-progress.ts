"use client";

import {
  buildCourseStats,
  buildGuestMasteredMap,
  buildLessonStats,
  defaultLessonAfterLargestCompleted,
} from "@/lib/course-progress";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Lesson, VocabularyItem } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export function useCourseProgress({
  lessons,
  vocab,
  user,
  selectedCourse,
}: {
  lessons: Lesson[];
  vocab: VocabularyItem[];
  user: User | null;
  selectedCourse?: string | null;
}) {
  const [masteredMap, setMasteredMap] = useState<Record<string, true>>(() =>
    user ? {} : buildGuestMasteredMap()
  );
  const [loading, setLoading] = useState<boolean>(Boolean(user && supabaseConfigured()));

  useEffect(() => {
    let cancelled = false;

    async function loadSignedInProgress() {
      if (!user || !supabaseConfigured()) return;

      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_flashcard_progress")
        .select("vocab_id")
        .eq("user_id", user.id)
        .eq("mastered", true);

      if (cancelled) return;

      if (error || !data) {
        setMasteredMap({});
        setLoading(false);
        return;
      }

      const nextMap: Record<string, true> = {};
      for (const row of data) {
        nextMap[row.vocab_id as string] = true;
      }
      setMasteredMap(nextMap);
      setLoading(false);
    }

    function loadGuest() {
      setMasteredMap(buildGuestMasteredMap());
      setLoading(false);
    }

    if (!user || !supabaseConfigured()) {
      loadGuest();
      return () => {
        cancelled = true;
      };
    }

    void loadSignedInProgress();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const lessonStats = useMemo(
    () => buildLessonStats(lessons, vocab, masteredMap),
    [lessons, vocab, masteredMap]
  );

  const defaultLessonId = useMemo(
    () => defaultLessonAfterLargestCompleted(lessons, lessonStats, selectedCourse ?? undefined),
    [lessons, lessonStats, selectedCourse]
  );

  const courseStats = useMemo(
    () => buildCourseStats(lessons, lessonStats),
    [lessons, lessonStats]
  );

  return {
    loading,
    masteredMap,
    lessonStats,
    defaultLessonId,
    courseStats,
  };
}
