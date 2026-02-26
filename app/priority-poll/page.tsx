"use client";

import { AppShell } from "@/components/app/app-shell";
import { PriorityRankingPoll } from "@/components/app/priority-ranking-poll";
import { useLanguage } from "@/components/providers/language-provider";
import { Language } from "@/lib/types";

const shellCopy: Record<Language, { title: string; subtitle: string }> = {
  en: {
    title: "Learning Priorities Poll",
    subtitle: "Drag and drop to rank your goals",
  },
  es: {
    title: "Encuesta de prioridades de aprendizaje",
    subtitle: "Arrastra y suelta para ordenar tus objetivos",
  },
  pt: {
    title: "Enquete de prioridades de aprendizado",
    subtitle: "Arraste e solte para ordenar seus objetivos",
  },
  sw: {
    title: "Kura ya Vipaumbele vya Kujifunza",
    subtitle: "Buruta na udondoshe kupanga malengo yako",
  },
  chk: {
    title: "Learning Priorities Poll",
    subtitle: "Drag and drop to rank your goals",
  },
};

export default function PriorityPollPage() {
  const { language } = useLanguage();
  const copy = shellCopy[language];

  return (
    <AppShell title={copy.title} subtitle={copy.subtitle}>
      <PriorityRankingPoll />
    </AppShell>
  );
}
