import { loadGuestProgress } from "@/lib/spaced-repetition";
import { Lesson, VocabularyItem } from "@/lib/types";

export type LessonProgressStat = {
  lessonId: string;
  level: number;
  sequenceNumber: number;
  totalWords: number;
  masteredWords: number;
  completed: boolean;
};

export type CourseProgressStat = {
  level: number;
  totalLessons: number;
  completedLessons: number;
  totalWords: number;
  masteredWords: number;
  nextLessonId: string | null;
  largestCompletedSequence: number | null;
  lessonPercent: number;
  wordPercent: number;
};

function lessonSort(a: Lesson, b: Lesson) {
  if (a.level !== b.level) return a.level - b.level;
  return a.sequence_number - b.sequence_number;
}

export function buildGuestMasteredMap() {
  const map: Record<string, true> = {};
  const guest = loadGuestProgress();

  for (const entry of Object.values(guest)) {
    if (entry.mastered) {
      map[entry.vocabId] = true;
    }
  }

  return map;
}

export function buildLessonStats(
  lessons: Lesson[],
  vocab: VocabularyItem[],
  masteredMap: Record<string, true>
) {
  const vocabByLesson = new Map<string, VocabularyItem[]>();
  for (const item of vocab) {
    const existing = vocabByLesson.get(item.lesson_id) ?? [];
    existing.push(item);
    vocabByLesson.set(item.lesson_id, existing);
  }

  const stats: Record<string, LessonProgressStat> = {};
  for (const lesson of lessons) {
    const words = vocabByLesson.get(lesson.id) ?? [];
    const totalWords = words.length;
    const masteredWords = words.filter((word) => masteredMap[word.id]).length;

    stats[lesson.id] = {
      lessonId: lesson.id,
      level: lesson.level,
      sequenceNumber: lesson.sequence_number,
      totalWords,
      masteredWords,
      completed: totalWords > 0 && masteredWords === totalWords,
    };
  }

  return stats;
}

export function defaultLessonAfterLargestCompleted(
  lessons: Lesson[],
  lessonStats: Record<string, LessonProgressStat>
) {
  const ordered = [...lessons].sort(lessonSort);
  if (ordered.length === 0) return null;

  let largestCompletedIndex = -1;
  ordered.forEach((lesson, index) => {
    if (lessonStats[lesson.id]?.completed) {
      largestCompletedIndex = index;
    }
  });

  if (largestCompletedIndex < 0) {
    return ordered[0].id;
  }

  const nextIndex = Math.min(largestCompletedIndex + 1, ordered.length - 1);
  return ordered[nextIndex].id;
}

export function buildCourseStats(
  lessons: Lesson[],
  lessonStats: Record<string, LessonProgressStat>
) {
  const byLevel = new Map<number, Lesson[]>();
  for (const lesson of lessons) {
    const existing = byLevel.get(lesson.level) ?? [];
    existing.push(lesson);
    byLevel.set(lesson.level, existing);
  }

  const stats: CourseProgressStat[] = [];
  for (const [level, grouped] of byLevel.entries()) {
    const ordered = [...grouped].sort((a, b) => a.sequence_number - b.sequence_number);
    const totalLessons = ordered.length;

    let completedLessons = 0;
    let totalWords = 0;
    let masteredWords = 0;
    let largestCompletedSequence: number | null = null;

    for (const lesson of ordered) {
      const lessonStat = lessonStats[lesson.id];
      if (!lessonStat) continue;

      totalWords += lessonStat.totalWords;
      masteredWords += lessonStat.masteredWords;
      if (lessonStat.completed) {
        completedLessons += 1;
        largestCompletedSequence = lesson.sequence_number;
      }
    }

    let nextLessonId: string | null = ordered[0]?.id ?? null;
    if (largestCompletedSequence !== null) {
      const next = ordered.find(
        (lesson) => lesson.sequence_number === largestCompletedSequence + 1
      );
      nextLessonId = next?.id ?? ordered[ordered.length - 1]?.id ?? null;
    }

    stats.push({
      level,
      totalLessons,
      completedLessons,
      totalWords,
      masteredWords,
      nextLessonId,
      largestCompletedSequence,
      lessonPercent: totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100,
      wordPercent: totalWords === 0 ? 0 : (masteredWords / totalWords) * 100,
    });
  }

  return stats.sort((a, b) => a.level - b.level);
}
