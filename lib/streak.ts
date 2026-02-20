import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { UserStreak } from "@/lib/types";

type ActivityType = "flashcards" | "matching" | "quiz";

function localDateFallback(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDeviceTimeZone() {
  if (typeof Intl === "undefined") return null;
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
}

export function getLocalDay(date = new Date()) {
  const timeZone = getDeviceTimeZone();
  if (!timeZone || typeof Intl === "undefined") {
    return localDateFallback(date);
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      return localDateFallback(date);
    }

    return `${year}-${month}-${day}`;
  } catch {
    return localDateFallback(date);
  }
}

export async function recordStreakLogin() {
  if (!supabaseConfigured()) return;

  const supabase = createClient();
  const localDay = getLocalDay();
  const timeZone = getDeviceTimeZone();

  await supabase.rpc("upsert_streak_login", {
    p_local_day: localDay,
    p_time_zone: timeZone,
  });
}

export async function recordStreakActivity({
  activityType,
  vocabId,
  becameMastered,
}: {
  activityType: ActivityType;
  vocabId?: string;
  becameMastered?: boolean;
}) {
  if (!supabaseConfigured()) return null;

  const supabase = createClient();
  const localDay = getLocalDay();
  const timeZone = getDeviceTimeZone();

  const { data } = await supabase.rpc("record_streak_activity", {
    p_activity_type: activityType,
    p_local_day: localDay,
    p_time_zone: timeZone,
    p_vocab_id: vocabId ?? null,
    p_became_mastered: Boolean(becameMastered),
  });

  return (data as UserStreak | null) ?? null;
}

export async function fetchMyStreak() {
  if (!supabaseConfigured()) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("user_streaks")
    .select("user_id, current_streak, longest_streak, last_qualified_day")
    .maybeSingle();

  return (data as UserStreak | null) ?? null;
}
