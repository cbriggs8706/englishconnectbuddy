"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default function AdminPage() {
  const { language } = useLanguage();
  const copy = t(language);

  return (
    <AppShell title={copy.adminPanel}>
      <AdminGate>
        <div className="grid gap-3">
          <Link href="/admin/lessons">
            <Card>
              <CardHeader>
                <CardTitle>{copy.addLesson}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {copy.adminManageLessonsDesc}
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/vocab">
            <Card>
              <CardHeader>
                <CardTitle>{copy.addVocab}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {copy.adminAddVocabDesc}
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/sentences">
            <Card>
              <CardHeader>
                <CardTitle>{copy.addSentence}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {copy.adminAddSentenceDesc}
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/patterns">
            <Card>
              <CardHeader>
                <CardTitle>{copy.addPatterns}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {copy.adminAddPatternsDesc}
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/quiz-results">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Review student quiz answers and accuracy trends.
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/confidence-poll">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Poll Report</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View each student&apos;s 0-5 lesson confidence poll and course progress.
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/priority-poll">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "es" ? "Reporte de encuesta de prioridades" : language === "pt" ? "Relatorio da enquete de prioridades" : "Priority Poll Report"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {language === "es"
                  ? "Ver las prioridades de aprendizaje ordenadas de cada estudiante."
                  : language === "pt"
                    ? "Ver as prioridades de aprendizado ordenadas de cada aluno."
                    : "View each student's ranked learning priorities."}
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/home-qr">
            <Card>
              <CardHeader>
                <CardTitle>Homepage QR</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Display a large QR code that opens the homepage and install prompt.
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/volunteer">
            <Card>
              <CardHeader>
                <CardTitle>Volunteer Scheduler</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manage volunteer timeslots, seat counts, and live signup names.
              </CardContent>
            </Card>
          </Link>
        </div>
      </AdminGate>
    </AppShell>
  );
}
