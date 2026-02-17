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
        </div>
      </AdminGate>
    </AppShell>
  );
}
