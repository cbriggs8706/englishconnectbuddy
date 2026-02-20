"use client";

import { AppShell } from "@/components/app/app-shell";
import { CourseLeaderboard } from "@/components/app/course-leaderboard";
import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";

export default function ProgressPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;
  const { courseStats, lessonStats, masteredMap } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse,
  });

  const lessonsByCourse = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const existing = lessonsByCourse.get(lesson.course) ?? [];
    existing.push(lesson);
    lessonsByCourse.set(lesson.course, existing);
  }

  return (
    <AppShell title={copy.progress}>
      <CourseLeaderboard
        lessons={lessons}
        vocab={vocab}
        masteredMap={masteredMap}
        currentCourse={selectedCourse}
      />
      {courseStats.map((course) => {
        const courseLessons = (lessonsByCourse.get(course.course) ?? []).sort(
          (a, b) => a.sequence_number - b.sequence_number
        );
        const nextLesson = course.nextLessonId
          ? courseLessons.find((lesson) => lesson.id === course.nextLessonId) ?? null
          : null;

        return (
          <Card key={course.course}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{course.course}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{copy.completedLessons}</span>
                  <span>{course.completedLessons}/{course.totalLessons}</span>
                </div>
                <Progress value={course.lessonPercent} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{copy.masteredWords}</span>
                  <span>{course.masteredWords}/{course.totalWords}</span>
                </div>
                <Progress value={course.wordPercent} />
              </div>

              {nextLesson ? (
                <p className="text-sm text-muted-foreground">
                  {copy.nextLesson}: {lessonLabel(nextLesson, language)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{copy.noProgressYet}</p>
              )}

              <div className="space-y-2">
                {courseLessons.map((lesson) => {
                  const stat = lessonStats[lesson.id];
                  if (!stat) return null;

                  const status = stat.completed
                    ? copy.completedStatus
                    : stat.masteredWords > 0
                      ? copy.inProgressStatus
                      : copy.notStartedStatus;
                  const badgeVariant = stat.completed
                    ? "default"
                    : stat.masteredWords > 0
                      ? "secondary"
                      : "outline";

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-xl border p-2 text-sm"
                    >
                      <span>{lessonLabel(lesson, language)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {stat.masteredWords}/{stat.totalWords}
                        </span>
                        <Badge variant={badgeVariant}>{status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </AppShell>
  );
}
