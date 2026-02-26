"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { quizDisplayName, getOrCreateGuestToken, nicknameAllowed, normalizeJoinCode } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";
import { Language } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";

const baseCopy: Record<
  "en" | "es" | "pt",
  {
    title: string;
    joinCode: string;
    nickname: string;
    join: string;
    badNickname: string;
  }
> = {
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
};

const copy: Record<Language, (typeof baseCopy)["en"]> = {
  ...baseCopy,
  sw: {
    ...baseCopy.en,
    title: "Jiunge na Quiz ya moja kwa moja",
    joinCode: "Msimbo wa kujiunga",
    nickname: "Jina la utani",
    join: "Jiunge na quiz",
    badNickname: "Tafadhali chagua jina tofauti.",
  },
  chk: {
    ...baseCopy.en,
  },
};

function QuizJoinContent() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCodeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState(initialCodeFromUrl);
  const [nickname, setNickname] = useState(quizDisplayName(profile) ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const signedInJoinName = useMemo(() => {
    if (!user) return "";
    const preferred = quizDisplayName(profile);
    if (preferred) return preferred;
    const emailName = user.email?.split("@")[0]?.trim();
    if (emailName) return emailName;
    return "Student";
  }, [profile, user]);

  useEffect(() => {
    if (!user || authLoading || autoJoinAttemptedRef.current) return;
    const normalizedCode = normalizeJoinCode(initialCodeFromUrl);
    if (!normalizedCode) return;
    autoJoinAttemptedRef.current = true;
    void joinSession(normalizedCode, signedInJoinName, true);
  }, [authLoading, initialCodeFromUrl, signedInJoinName, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (authLoading) return;
    const normalizedCode = normalizeJoinCode(code);
    if (!normalizedCode) {
      setMessage("Join failed");
      return;
    }

    const nextNickname = user ? signedInJoinName : nickname.trim();
    if (!nextNickname || !nicknameAllowed(nextNickname)) {
      setMessage(text.badNickname);
      return;
    }

    await joinSession(normalizedCode, nextNickname, false);
  }

  async function joinSession(normalizedCode: string, resolvedNickname: string, silent: boolean) {
    if (!silent) {
      setMessage(null);
    }

    setLoading(true);

    const supabase = createClient();
    const guestToken = user ? null : getOrCreateGuestToken();

    const { data, error } = await supabase.rpc("quiz_join_session", {
      p_join_code: normalizedCode,
      p_nickname: resolvedNickname,
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
            {!authLoading && !user ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">{text.nickname}</label>
                <Input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
              </div>
            ) : null}
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
