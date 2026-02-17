"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
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
import { FormEvent, useState } from "react";

export default function AdminVocabPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { lessons } = useCurriculum();
  const [lessonId, setLessonId] = useState<string>("");
  const [english, setEnglish] = useState("");
  const [englishSentence, setEnglishSentence] = useState("");
  const [spanish, setSpanish] = useState("");
  const [portuguese, setPortuguese] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadFile(file: File, type: "image" | "audio") {
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "bin";
    const filePath = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage.from("vocab").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("vocab").getPublicUrl(filePath);
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

    setUploading(true);
    try {
      let uploadedImageUrl = imageUrl || null;
      let uploadedAudioUrl = audioUrl || null;

      if (imageFile) {
        uploadedImageUrl = await uploadFile(imageFile, "image");
      }

      if (audioFile) {
        uploadedAudioUrl = await uploadFile(audioFile, "audio");
      }

      const supabase = createClient();
      const { error } = await supabase.from("vocabulary").insert({
        lesson_id: chosenLessonId,
        english_text: english,
        english_sentence: englishSentence || null,
        spanish_text: spanish,
        portuguese_text: portuguese,
        image_url: uploadedImageUrl,
        audio_url: uploadedAudioUrl,
        difficulty_level: 1,
      });

      setMessage(error ? error.message : copy.vocabAdded);
      if (!error) {
        setEnglish("");
        setEnglishSentence("");
        setSpanish("");
        setPortuguese("");
        setImageUrl("");
        setAudioUrl("");
        setImageFile(null);
        setAudioFile(null);
      }
    } catch (uploadError) {
      const messageText = uploadError instanceof Error ? uploadError.message : copy.uploadFailed;
      setMessage(messageText);
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell title={copy.addVocab}>
      <AdminGate>
        <Card>
          <CardContent className="p-4">
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <Label>{copy.lesson}</Label>
                <Select value={lessonId} onValueChange={setLessonId}>
                  <SelectTrigger>
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
              <div className="space-y-1">
                <Label>{copy.englishWord}</Label>
                <Input value={english} onChange={(event) => setEnglish(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{copy.englishSentence}</Label>
                <Input value={englishSentence} onChange={(event) => setEnglishSentence(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{copy.spanishTranslation}</Label>
                <Input value={spanish} onChange={(event) => setSpanish(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{copy.portugueseTranslation}</Label>
                <Input value={portuguese} onChange={(event) => setPortuguese(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{copy.imageFileBucket}</Label>
                <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                <Input
                  placeholder={copy.orPasteImageUrl}
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{copy.audioFileBucket}</Label>
                <Input type="file" accept="audio/*" onChange={(event) => setAudioFile(event.target.files?.[0] || null)} />
                <Input
                  placeholder={copy.orPasteAudioUrl}
                  value={audioUrl}
                  onChange={(event) => setAudioUrl(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? copy.uploading : copy.addVocabularyButton}
              </Button>
            </form>
          </CardContent>
        </Card>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </AdminGate>
    </AppShell>
  );
}
