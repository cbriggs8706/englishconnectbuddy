"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Complete your profile",
    subtitle: "Please add your real name and a nickname before continuing.",
    realName: "Real name",
    nickname: "Nickname",
    save: "Save",
    error: "Could not save your profile.",
  },
  es: {
    title: "Completa tu perfil",
    subtitle: "Agrega tu nombre real y un apodo antes de continuar.",
    realName: "Nombre real",
    nickname: "Apodo",
    save: "Guardar",
    error: "No se pudo guardar tu perfil.",
  },
  pt: {
    title: "Complete seu perfil",
    subtitle: "Adicione seu nome real e um apelido antes de continuar.",
    realName: "Nome real",
    nickname: "Apelido",
    save: "Salvar",
    error: "Nao foi possivel salvar seu perfil.",
  },
} as const;

export function ProfileOnboardingGate() {
  const { user, loading, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);

  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsProfile =
    !!user &&
    !loading &&
    (!profile?.real_name?.trim() || !profile?.nickname?.trim());

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
        real_name: realName.trim(),
        nickname: nickname.trim(),
        display_name: nickname.trim(),
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
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button type="submit" disabled={saving || !realName.trim() || !nickname.trim()} className="w-full">
              {text.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
