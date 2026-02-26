"use client";

import { AppShell } from "@/components/app/app-shell";
import { LessonConfidencePoll } from "@/components/app/lesson-confidence-poll";
import { useLanguage } from "@/components/providers/language-provider";
import { Language } from "@/lib/types";

const shellCopy: Record<Language, { title: string; subtitle: string }> = {
  en: {
    title: "Confidence Poll",
    subtitle: "Rate your confidence for each lesson",
  },
  es: {
    title: "Encuesta de confianza",
    subtitle: "Califica tu confianza en cada leccion",
  },
  pt: {
    title: "Enquete de confianca",
    subtitle: "Avalie sua confianca em cada licao",
  },
  sw: {
    title: "Kura ya Kujiamini",
    subtitle: "Pima kujiamini kwako kwa kila somo",
  },
  chk: {
    title: "Confidence Poll",
    subtitle: "Rate your confidence for each lesson",
  },
};

export default function ConfidencePollPage() {
  const { language } = useLanguage();
  const copy = shellCopy[language];

  return (
    <AppShell title={copy.title} subtitle={copy.subtitle}>
      <LessonConfidencePoll />
    </AppShell>
  );
}
