import { FlashcardMode, FlashcardProgress } from "@/lib/types";

export type Rating = "got-it" | "kind-of" | "keep-in-deck";

export type ProgressLike = Pick<
  FlashcardProgress,
  "streak_count" | "review_count" | "mastered"
>;

const STORAGE_KEY = "ecb-flashcard-progress";

type GuestProgressRecord = {
  vocabId: string;
  mode: FlashcardMode;
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

function gotItDueDate(now: Date, nextStreak: number) {
  if (nextStreak <= 1) return addDays(now, 3);
  if (nextStreak === 2) return addDays(now, 7);
  if (nextStreak === 3) return addDays(now, 14);
  if (nextStreak === 4) return addDays(now, 30);
  return addDays(now, 45);
}

export function progressKey(vocabId: string, mode: FlashcardMode) {
  return `${vocabId}::${mode}`;
}

export function applyRating(current: ProgressLike | null, rating: Rating, now = new Date()) {
  const previousStreak = current?.streak_count ?? 0;
  const previousReviews = current?.review_count ?? 0;

  let streakCount = previousStreak;
  let dueAt = now;

  if (rating === "got-it") {
    streakCount = previousStreak + 1;
    dueAt = gotItDueDate(now, streakCount);
  }

  if (rating === "kind-of") {
    streakCount = 0;
    dueAt = addDays(now, 1);
  }

  if (rating === "keep-in-deck") {
    streakCount = 0;
    dueAt = addMinutes(now, 1);
  }

  return {
    streak_count: streakCount,
    review_count: previousReviews + 1,
    mastered: streakCount >= 5,
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
