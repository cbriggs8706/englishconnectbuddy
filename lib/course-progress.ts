import { loadGuestProgress } from "@/lib/spaced-repetition";
import { Lesson, VocabularyItem } from "@/lib/types";

export type LessonProgressStat = {
  lessonId: string;
  course: string;
  level: number;
  sequenceNumber: number;
  totalWords: number;
  masteredWords: number;
  completed: boolean;
};

export type CourseProgressStat = {
  course: string;
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
  if (a.course !== b.course) {
    if (a.level !== b.level) return a.level - b.level;
    return a.course.localeCompare(b.course);
  }
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
      course: lesson.course,
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
  lessonStats: Record<string, LessonProgressStat>,
  course?: string
) {
  const ordered = [...lessons]
    .filter((lesson) => !course || lesson.course === course)
    .sort(lessonSort);
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
  const byCourse = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const existing = byCourse.get(lesson.course) ?? [];
    existing.push(lesson);
    byCourse.set(lesson.course, existing);
  }

  const stats: CourseProgressStat[] = [];
  for (const [course, grouped] of byCourse.entries()) {
    const ordered = [...grouped].sort((a, b) => a.sequence_number - b.sequence_number);
    const totalLessons = ordered.length;
    const level = ordered[0]?.level ?? 0;

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
      course,
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

  return stats.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.course.localeCompare(b.course);
  });
}

export function highestMasteredUnitForCourse(
  lessons: Lesson[],
  vocab: VocabularyItem[],
  masteredMap: Record<string, true>,
  course: string
) {
  const courseLessons = lessons.filter((lesson) => lesson.course === course);
  if (courseLessons.length === 0) return 0;

  const unitByLessonId = new Map(courseLessons.map((lesson) => [lesson.id, lesson.unit]));
  const totalsByUnit = new Map<number, { total: number; mastered: number }>();

  for (const lesson of courseLessons) {
    if (!totalsByUnit.has(lesson.unit)) {
      totalsByUnit.set(lesson.unit, { total: 0, mastered: 0 });
    }
  }

  for (const item of vocab) {
    const unit = unitByLessonId.get(item.lesson_id);
    if (unit === undefined) continue;

    const totals = totalsByUnit.get(unit);
    if (!totals) continue;

    totals.total += 1;
    if (masteredMap[item.id]) {
      totals.mastered += 1;
    }
  }

  let highest = 0;
  for (const [unit, totals] of totalsByUnit.entries()) {
    const completed = totals.total > 0 && totals.mastered === totals.total;
    if (completed && unit > highest) {
      highest = unit;
    }
  }

  return highest;
}
