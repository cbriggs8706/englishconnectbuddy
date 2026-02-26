"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { Language } from "@/lib/types";
import Link from "next/link";

export default function AdminPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const priorityPollRouteCopy: Record<Language, { title: string; description: string }> = {
    en: {
      title: "Priority Poll Report",
      description: "View each student's ranked learning priorities.",
    },
    es: {
      title: "Reporte de encuesta de prioridades",
      description: "Ver las prioridades de aprendizaje ordenadas de cada estudiante.",
    },
    pt: {
      title: "Relatorio da enquete de prioridades",
      description: "Ver as prioridades de aprendizado ordenadas de cada aluno.",
    },
    sw: {
      title: "Ripoti ya Kura ya Vipaumbele",
      description: "Tazama vipaumbele vya kujifunza vya kila mwanafunzi vilivyopangwa.",
    },
    chk: {
      title: "Priority Poll Report",
      description: "View each student's ranked learning priorities.",
    },
  };
  const routes = [
    { href: "/admin/lessons", title: copy.addLesson, description: copy.adminManageLessonsDesc, colors: "from-blue-600 to-cyan-500" },
    { href: "/admin/vocab", title: copy.addVocab, description: copy.adminAddVocabDesc, colors: "from-violet-600 to-fuchsia-500" },
    { href: "/admin/sentences", title: copy.addSentence, description: copy.adminAddSentenceDesc, colors: "from-rose-600 to-orange-500" },
    { href: "/admin/patterns", title: copy.addPatterns, description: copy.adminAddPatternsDesc, colors: "from-emerald-600 to-teal-500" },
    {
      href: "/admin/quiz-results",
      title: "Quiz Results",
      description: "Review student quiz answers and accuracy trends.",
      colors: "from-sky-600 to-blue-500",
    },
    {
      href: "/admin/confidence-poll",
      title: "Confidence Poll Report",
      description: "View each student's 0-5 lesson confidence poll and course progress.",
      colors: "from-indigo-600 to-blue-500",
    },
    {
      href: "/admin/priority-poll",
      title: priorityPollRouteCopy[language].title,
      description: priorityPollRouteCopy[language].description,
      colors: "from-pink-600 to-rose-500",
    },
    {
      href: "/admin/home-qr",
      title: "Homepage QR",
      description: "Display a large QR code that opens the homepage and install prompt.",
      colors: "from-amber-500 to-orange-500",
    },
    {
      href: "/admin/volunteer",
      title: "Volunteer Scheduler",
      description: "Manage volunteer timeslots, seat counts, and live signup names.",
      colors: "from-lime-600 to-emerald-500",
    },
  ];

  return (
    <AdminShell title={copy.adminPanel} subtitle="Desktop administration workspace">
      <AdminGate>
        <Card className="border-0 bg-linear-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-black">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold text-blue-50">
            Open any admin tool from this hub. All admin pages are now in the `/admin` route and optimized for
            full-width desktop use.
          </CardContent>
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="block">
              <Card
                className={`aspect-square border-0 bg-linear-to-br ${route.colors} text-white shadow-lg transition-transform hover:-translate-y-0.5`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-black">{route.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-full items-end text-base font-semibold text-white/95">
                  {route.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </AdminGate>
    </AdminShell>
  );
}
