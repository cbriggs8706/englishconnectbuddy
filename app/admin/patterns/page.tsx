"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { LessonPattern } from "@/lib/types";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PatternMap = Record<string, LessonPattern>;

type UploadField =
  | "en_pattern_1_question_image_url"
  | "en_pattern_1_answer_image_url"
  | "en_pattern_2_question_image_url"
  | "en_pattern_2_answer_image_url"
  | "es_pattern_1_question_image_url"
  | "es_pattern_1_answer_image_url"
  | "es_pattern_2_question_image_url"
  | "es_pattern_2_answer_image_url"
  | "pt_pattern_1_question_image_url"
  | "pt_pattern_1_answer_image_url"
  | "pt_pattern_2_question_image_url"
  | "pt_pattern_2_answer_image_url";

const FIELD_GROUPS: Array<{
  title: string;
  items: Array<{ key: UploadField; label: string }>;
}> = [
  {
    title: "English",
    items: [
      { key: "en_pattern_1_question_image_url", label: "Pattern 1 Question" },
      { key: "en_pattern_1_answer_image_url", label: "Pattern 1 Answer" },
      { key: "en_pattern_2_question_image_url", label: "Pattern 2 Question" },
      { key: "en_pattern_2_answer_image_url", label: "Pattern 2 Answer" },
    ],
  },
  {
    title: "Spanish",
    items: [
      { key: "es_pattern_1_question_image_url", label: "Pattern 1 Question" },
      { key: "es_pattern_1_answer_image_url", label: "Pattern 1 Answer" },
      { key: "es_pattern_2_question_image_url", label: "Pattern 2 Question" },
      { key: "es_pattern_2_answer_image_url", label: "Pattern 2 Answer" },
    ],
  },
  {
    title: "Portuguese",
    items: [
      { key: "pt_pattern_1_question_image_url", label: "Pattern 1 Question" },
      { key: "pt_pattern_1_answer_image_url", label: "Pattern 1 Answer" },
      { key: "pt_pattern_2_question_image_url", label: "Pattern 2 Question" },
      { key: "pt_pattern_2_answer_image_url", label: "Pattern 2 Answer" },
    ],
  },
];

export default function AdminPatternsPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons } = useCurriculum();
  const [lessonId, setLessonId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [patternsByLesson, setPatternsByLesson] = useState<PatternMap>({});
  const [files, setFiles] = useState<Partial<Record<UploadField, File | null>>>({});

  const activeLessonId = lessonId || lessons[0]?.id || "";
  const activePattern = useMemo(
    () => (activeLessonId ? patternsByLesson[activeLessonId] : undefined),
    [activeLessonId, patternsByLesson]
  );

  useEffect(() => {
    if (!supabaseConfigured()) return;

    async function loadPatterns() {
      const supabase = createClient();
      const { data } = await supabase.from("lesson_patterns").select("*");
      if (!data) return;

      const nextMap: PatternMap = {};
      for (const row of data) {
        const pattern = row as LessonPattern;
        nextMap[pattern.lesson_id] = pattern;
      }
      setPatternsByLesson(nextMap);
    }

    void loadPatterns();
  }, []);

  useEffect(() => {
    setFiles({});
  }, [activeLessonId]);

  function setFile(field: UploadField, file: File | null) {
    setFiles((prev) => ({ ...prev, [field]: file }));
  }

  async function uploadPatternFile(file: File, targetLessonId: string, field: UploadField) {
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "bin";
    const filePath = `${targetLessonId}/${field}.${extension}`;

    const { error } = await supabase.storage.from("patterns").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("patterns").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const chosenLessonId = lessonId || lessons[0]?.id;
    if (!chosenLessonId) {
      setMessage(copy.createLessonFirst);
      return;
    }

    const fieldsToUpload = Object.entries(files).filter(
      (entry): entry is [string, File] => Boolean(entry[1])
    );

    if (fieldsToUpload.length === 0) {
      setMessage("Select at least one image to upload.");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const existing = patternsByLesson[chosenLessonId];
      const payload: Record<string, string | null> = {
        lesson_id: chosenLessonId,
        updated_at: new Date().toISOString(),
        en_pattern_1_question_image_url: existing?.en_pattern_1_question_image_url ?? null,
        en_pattern_1_answer_image_url: existing?.en_pattern_1_answer_image_url ?? null,
        en_pattern_2_question_image_url: existing?.en_pattern_2_question_image_url ?? null,
        en_pattern_2_answer_image_url: existing?.en_pattern_2_answer_image_url ?? null,
        es_pattern_1_question_image_url: existing?.es_pattern_1_question_image_url ?? null,
        es_pattern_1_answer_image_url: existing?.es_pattern_1_answer_image_url ?? null,
        es_pattern_2_question_image_url: existing?.es_pattern_2_question_image_url ?? null,
        es_pattern_2_answer_image_url: existing?.es_pattern_2_answer_image_url ?? null,
        pt_pattern_1_question_image_url: existing?.pt_pattern_1_question_image_url ?? null,
        pt_pattern_1_answer_image_url: existing?.pt_pattern_1_answer_image_url ?? null,
        pt_pattern_2_question_image_url: existing?.pt_pattern_2_question_image_url ?? null,
        pt_pattern_2_answer_image_url: existing?.pt_pattern_2_answer_image_url ?? null,
      };

      for (const [fieldName, file] of fieldsToUpload) {
        const field = fieldName as UploadField;
        payload[field] = await uploadPatternFile(file, chosenLessonId, field);
      }

      payload.english_image_url = payload.en_pattern_1_question_image_url;
      payload.spanish_image_url = payload.es_pattern_1_question_image_url;
      payload.portuguese_image_url = payload.pt_pattern_1_question_image_url;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("lesson_patterns")
        .upsert(payload, { onConflict: "lesson_id" })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
      } else {
        const saved = data as LessonPattern;
        setPatternsByLesson((prev) => ({ ...prev, [saved.lesson_id]: saved }));
        setFiles({});
        setMessage(copy.patternsSaved);
      }
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : copy.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminShell title={copy.addPatterns}>
      <AdminGate>
        <Card className="border-0 bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-xl shadow-cyan-500/30">
          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label className="text-base text-white">{copy.lesson}</Label>
                <Select value={lessonId} onValueChange={setLessonId}>
                  <SelectTrigger className="border-white/40 bg-white text-slate-900">
                    <SelectValue placeholder={copy.selectLesson} />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lessonLabel(lesson, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3 rounded-2xl bg-white/15 p-3">
                  <p className="text-lg font-extrabold">{group.title}</p>
                  {group.items.map((item) => (
                    <div key={item.key} className="space-y-1">
                      <Label className="text-white">{item.label}</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setFile(item.key, event.target.files?.[0] || null)}
                      />
                      <p className="text-sm font-semibold text-white/95">
                        {files[item.key]?.name ? `Selected: ${files[item.key]?.name}` : "No file selected"}
                      </p>
                    </div>
                  ))}
                </div>
              ))}

              <Button type="submit" disabled={uploading} className="h-12 w-full bg-white text-sky-700 hover:bg-sky-100">
                {uploading ? copy.uploading : copy.savePatterns}
              </Button>
            </form>
          </CardContent>
        </Card>

        {activePattern ? (
          <Card className="border-0 bg-slate-100">
            <CardContent className="space-y-4 p-4">
              <p className="text-lg font-bold text-slate-900">{copy.patterns}</p>
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-base font-bold text-slate-900">{group.title}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) => {
                      const url = activePattern[item.key];
                      return (
                        <div key={item.key} className="rounded-xl border-2 border-slate-200 bg-white p-3">
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          {url ? (
                            <img src={url} alt={`${group.title} ${item.label}`} className="mt-2 w-full rounded-lg object-contain" />
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-slate-500">Missing</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {message ? <p className="text-base font-semibold text-slate-700">{message}</p> : null}
      </AdminGate>
    </AdminShell>
  );
}
