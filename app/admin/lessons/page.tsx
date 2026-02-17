"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";

export default function AdminLessonsPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons } = useCurriculum();
  const [message, setMessage] = useState<string | null>(null);

  const [level, setLevel] = useState(1);
  const [unit, setUnit] = useState(1);
  const [lessonNumber, setLessonNumber] = useState(1);
  const [sequenceNumber, setSequenceNumber] = useState(1);
  const [titleEn, setTitleEn] = useState("");
  const [titleEs, setTitleEs] = useState("");
  const [titlePt, setTitlePt] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("lessons").insert({
      level,
      unit,
      lesson_number: lessonNumber,
      sequence_number: sequenceNumber,
      title_en: titleEn,
      title_es: titleEs,
      title_pt: titlePt,
      description_en: null,
      description_es: null,
      description_pt: null,
      sort_order: level * 100 + sequenceNumber,
    });

    setMessage(error ? error.message : copy.lessonAdded);
    if (!error) {
      setTitleEn("");
      setTitleEs("");
      setTitlePt("");
      setLessonNumber((prev) => prev + 1);
      setSequenceNumber((prev) => prev + 1);
    }
  }

  return (
    <AppShell title={copy.addLesson}>
      <AdminGate>
        <Card>
          <CardContent className="p-4">
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label>{copy.level}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={level}
                    onChange={(event) => setLevel(Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{copy.unit}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={unit}
                    onChange={(event) => setUnit(Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{copy.lessonNumber}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={lessonNumber}
                    onChange={(event) => setLessonNumber(Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{copy.ecNumber}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={sequenceNumber}
                    onChange={(event) => setSequenceNumber(Number(event.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{copy.titleEnglish}</Label>
                <Input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{copy.titleSpanish}</Label>
                <Input value={titleEs} onChange={(event) => setTitleEs(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{copy.titlePortuguese}</Label>
                <Input value={titlePt} onChange={(event) => setTitlePt(event.target.value)} required />
              </div>
              <Button type="submit">{copy.addLesson}</Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">{copy.currentLessons}: {lessons.length}</p>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </AdminGate>
    </AppShell>
  );
}
