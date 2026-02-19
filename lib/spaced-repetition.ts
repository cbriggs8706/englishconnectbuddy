import { FlashcardProgress } from "@/lib/types";

export type Rating = "weak" | "improving" | "strong" | "master-now";

export type ProgressLike = Pick<
  FlashcardProgress,
  "streak_count" | "review_count" | "mastered"
>;

const STORAGE_KEY = "ecb-flashcard-progress-v2";

type GuestProgressRecord = {
  vocabId: string;
  streakCount: number;
  reviewCount: number;
  mastered: boolean;
  dueAt: string;
  lastReviewedAt: string | null;
};

export type GuestProgressMap = Record<string, GuestProgressRecord>;

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function strongDueDate(now: Date, nextStreak: number) {
  if (nextStreak <= 1) return addDays(now, 3);
  if (nextStreak === 2) return addDays(now, 7);
  if (nextStreak === 3) return addDays(now, 14);
  if (nextStreak === 4) return addDays(now, 30);
  if (nextStreak === 5) return addDays(now, 60);
  return addDays(now, 120);
}

export function progressKey(vocabId: string) {
  return vocabId;
}

export function applyRating(current: ProgressLike | null, rating: Rating, now = new Date()) {
  const previousStreak = current?.streak_count ?? 0;
  const previousReviews = current?.review_count ?? 0;

  let streakCount = previousStreak;
  let dueAt = now;
  let mastered = current?.mastered ?? false;

  if (rating === "strong") {
    streakCount = previousStreak + 1;
    dueAt = strongDueDate(now, streakCount);
  }

  if (rating === "improving") {
    streakCount = 0;
    dueAt = addDays(now, 1);
  }

  if (rating === "weak") {
    streakCount = 0;
    dueAt = addMinutes(now, 1);
  }

  if (rating === "master-now") {
    mastered = true;
    streakCount = previousStreak;
    dueAt = addYears(now, 100);
  }

  return {
    streak_count: streakCount,
    review_count: previousReviews + 1,
    mastered,
    due_at: dueAt.toISOString(),
    last_reviewed_at: now.toISOString(),
  };
}

export function loadGuestProgress(): GuestProgressMap {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as GuestProgressMap;
  } catch {
    return {};
  }
}

export function saveGuestProgress(map: GuestProgressMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
