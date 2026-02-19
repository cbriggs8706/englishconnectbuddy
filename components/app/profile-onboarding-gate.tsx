"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useEffect, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Complete your profile",
    subtitle: "Please add your real name, nickname, and course before continuing.",
    realName: "Real name",
    nickname: "Nickname",
    course: "Course",
    save: "Save",
    error: "Could not save your profile.",
  },
  es: {
    title: "Completa tu perfil",
    subtitle: "Agrega tu nombre real, apodo y curso antes de continuar.",
    realName: "Nombre real",
    nickname: "Apodo",
    course: "Curso",
    save: "Guardar",
    error: "No se pudo guardar tu perfil.",
  },
  pt: {
    title: "Complete seu perfil",
    subtitle: "Adicione seu nome real, apelido e curso antes de continuar.",
    realName: "Nome real",
    nickname: "Apelido",
    course: "Curso",
    save: "Salvar",
    error: "Nao foi possivel salvar seu perfil.",
  },
} as const;

export function ProfileOnboardingGate() {
  const { user, loading, profile, refreshProfile } = useAuth();
  const { lessons } = useCurriculum();
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const courseOptions = useMemo(
    () => Array.from(new Set(lessons.map((lesson) => lesson.course))).sort((a, b) => a.localeCompare(b)),
    [lessons]
  );

  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("EC1");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.selected_course?.trim()) {
      setSelectedCourse(profile.selected_course);
      return;
    }
    if (!profile?.selected_course && courseOptions.length > 0) {
      setSelectedCourse(courseOptions[0]);
    }
  }, [courseOptions, profile?.selected_course]);

  useEffect(() => {
    if (profile?.real_name?.trim()) {
      setRealName(profile.real_name);
    }
    if (profile?.nickname?.trim()) {
      setNickname(profile.nickname);
    }
  }, [profile?.nickname, profile?.real_name]);

  const needsProfile =
    !!user &&
    !loading &&
    (!profile?.real_name?.trim() || !profile?.nickname?.trim() || !profile?.selected_course?.trim());

  if (!needsProfile) {
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !supabaseConfigured()) return;

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        real_name: realName.trim() || profile?.real_name?.trim() || "",
        nickname: nickname.trim() || profile?.nickname?.trim() || "",
        display_name: nickname.trim() || profile?.nickname?.trim() || "",
        selected_course: selectedCourse.trim() || "EC1",
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message || text.error);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{text.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="real-name">{text.realName}</Label>
              <Input
                id="real-name"
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nickname">{text.nickname}</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{text.course}</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={text.course} />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.length > 0 ? (
                    courseOptions.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="EC1">EC1</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button
              type="submit"
              disabled={
                saving ||
                (!realName.trim() && !profile?.real_name?.trim()) ||
                (!nickname.trim() && !profile?.nickname?.trim()) ||
                !selectedCourse.trim()
              }
              className="w-full"
            >
              {text.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
