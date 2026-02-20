"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { highestMasteredUnitForCourse } from "@/lib/course-progress";
import { Lesson, VocabularyItem } from "@/lib/types";
import { useMemo } from "react";

type CourseLeaderboardProps = {
  lessons: Lesson[];
  vocab: VocabularyItem[];
  masteredMap: Record<string, true>;
  currentCourse: string | null;
};

export function CourseLeaderboard({
  lessons,
  vocab,
  masteredMap,
  currentCourse,
}: CourseLeaderboardProps) {
  const highestMasteredUnit = useMemo(() => {
    if (!currentCourse) return null;
    return highestMasteredUnitForCourse(lessons, vocab, masteredMap, currentCourse);
  }, [currentCourse, lessons, masteredMap, vocab]);

  if (!currentCourse || highestMasteredUnit === null) {
    return null;
  }

  return (
    <Card className="border-0 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-wide text-white/90">Leaderboard</p>
          <p className="text-2xl font-black">{currentCourse}</p>
        </div>
        <Badge className="rounded-2xl bg-white px-5 py-3 text-3xl font-black text-rose-700">
          {highestMasteredUnit}
        </Badge>
      </CardContent>
    </Card>
  );
}
