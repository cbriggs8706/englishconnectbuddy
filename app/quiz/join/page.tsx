"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { quizDisplayName, getOrCreateGuestToken, nicknameAllowed } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Join Live Quiz",
    joinCode: "Join code",
    nickname: "Nickname",
    join: "Join quiz",
    badNickname: "Please choose a different nickname.",
  },
  es: {
    title: "Unirse al quiz",
    joinCode: "Codigo",
    nickname: "Apodo",
    join: "Unirse",
    badNickname: "Elige un apodo diferente.",
  },
  pt: {
    title: "Entrar no quiz",
    joinCode: "Codigo",
    nickname: "Apelido",
    join: "Entrar",
    badNickname: "Escolha outro apelido.",
  },
} as const;

function QuizJoinContent() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [nickname, setNickname] = useState(quizDisplayName(profile) ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nicknameAllowed(nickname)) {
      setMessage(text.badNickname);
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const guestToken = user ? null : getOrCreateGuestToken();

    const { data, error } = await supabase.rpc("quiz_join_session", {
      p_join_code: code.trim(),
      p_nickname: nickname.trim(),
      p_guest_token: guestToken,
    });

    if (error || !data) {
      setMessage(error?.message ?? "Join failed");
      setLoading(false);
      return;
    }

    const payload = data as { session_id: string; participant_id: string };
    if (typeof window !== "undefined") {
      localStorage.setItem(`quiz-participant-${payload.session_id}`, payload.participant_id);
      if (!user && guestToken) {
        localStorage.setItem(`quiz-guest-token-${payload.session_id}`, guestToken);
      }
    }

    router.push(`/quiz/play/${payload.session_id}`);
  }

  return (
    <AppShell title={text.title}>
      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">{text.joinCode}</label>
              <Input value={code} onChange={(event) => setCode(event.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{text.nickname}</label>
              <Input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {text.join}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default function QuizJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QuizJoinContent />
    </Suspense>
  );
}
