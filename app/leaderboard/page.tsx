"use client";

import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { highestMasteredUnitForCourse } from "@/lib/course-progress";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

type LeaderboardProfile = {
  id: string;
  display_name: string | null;
  real_name: string | null;
  last_name: string | null;
  nickname: string | null;
  selected_course: string | null;
  is_admin: boolean;
};

type MasteredRow = {
  user_id: string;
  vocab_id: string;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  course: string;
  highestUnit: number;
};

const PAGE_SIZE = 1000;

async function fetchAllProfiles() {
  const supabase = createClient();
  const allRows: LeaderboardProfile[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, real_name, last_name, nickname, selected_course, is_admin")
      .eq("is_admin", false)
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No profile data returned") };
    }

    const batch = data as LeaderboardProfile[];
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
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No mastered progress data returned") };
    }

    const batch = data as MasteredRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

function displayNameForProfile(profile: LeaderboardProfile) {
  const nick = profile.nickname?.trim();
  if (nick) return nick;

  const displayName = profile.display_name?.trim();
  if (displayName) return displayName;

  const fullName = [profile.real_name?.trim(), profile.last_name?.trim()].filter(Boolean).join(" ");
  if (fullName) return fullName;

  return "";
}

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const [profiles, setProfiles] = useState<LeaderboardProfile[]>([]);
  const [masteredRows, setMasteredRows] = useState<MasteredRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabaseConfigured()) {
        setLoading(false);
        return;
      }

      const [profilesRes, masteredRes] = await Promise.all([
        fetchAllProfiles(),
        fetchAllMasteredRows(),
      ]);

      if (!profilesRes.error && profilesRes.data) {
        setProfiles(profilesRes.data);
      }
      if (!masteredRes.error && masteredRes.data) {
        setMasteredRows(masteredRes.data);
      }

      setLoading(false);
    }

    void load();
  }, []);

  const entries = useMemo(() => {
    const masteredByUser = new Map<string, Record<string, true>>();
    for (const row of masteredRows) {
      const existing = masteredByUser.get(row.user_id) ?? {};
      existing[row.vocab_id] = true;
      masteredByUser.set(row.user_id, existing);
    }

    const nextEntries: LeaderboardEntry[] = [];
    for (const profile of profiles) {
      const course = profile.selected_course?.trim() || "EC1";
      const masteredMap = masteredByUser.get(profile.id) ?? {};
      const highestUnit = highestMasteredUnitForCourse(lessons, vocab, masteredMap, course);
      nextEntries.push({
        id: profile.id,
        name: displayNameForProfile(profile),
        course,
        highestUnit,
      });
    }

    return nextEntries.sort((a, b) => {
      if (b.highestUnit !== a.highestUnit) return b.highestUnit - a.highestUnit;
      return a.name.localeCompare(b.name);
    });
  }, [lessons, masteredRows, profiles, vocab]);

  return (
    <AppShell title={copy.leaderboard} subtitle={copy.progress}>
      <Card className="border-0 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-xl shadow-rose-400/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-black">{copy.leaderboardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold text-orange-50">
            {copy.leaderboardDescription}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {loading ? (
            <p className="text-base font-semibold text-slate-600">{copy.adminLoading}</p>
          ) : entries.length === 0 ? (
            <p className="text-base text-muted-foreground">{copy.noData}</p>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl bg-linear-to-r from-sky-100 via-cyan-100 to-emerald-100 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-900">
                    {index + 1}. {entry.name || `${copy.learnerLabel} ${entry.id.slice(0, 6)}`}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{copy.currentCourseLabel}: {entry.course}</p>
                </div>
                <Badge className="rounded-2xl bg-emerald-600 px-4 py-2 text-2xl font-black text-white">
                  {entry.course} {entry.highestUnit}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
