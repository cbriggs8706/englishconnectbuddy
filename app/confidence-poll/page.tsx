"use client";

import { AppShell } from "@/components/app/app-shell";
import { LessonConfidencePoll } from "@/components/app/lesson-confidence-poll";

export default function ConfidencePollPage() {
  return (
    <AppShell title="Confidence Poll" subtitle="Rate your confidence for each lesson">
      <LessonConfidencePoll />
    </AppShell>
  );
}
