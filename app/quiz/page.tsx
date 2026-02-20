"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeJoinCode } from "@/lib/quiz";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { QuizSession } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const copy = {
  en: {
    title: "Live Quiz",
    subtitle: "Kahoot-style vocabulary challenge",
    host: "Host quiz",
    joinByCode: "Join with code",
    codePlaceholder: "Enter join code",
    join: "Join",
    activeQuizzes: "Live quizzes",
    none: "No live quizzes right now.",
    open: "Open",
  },
  es: {
    title: "Quiz en vivo",
    subtitle: "Desafio de vocabulario estilo Kahoot",
    host: "Presentar quiz",
    joinByCode: "Unirse con codigo",
    codePlaceholder: "Ingresa codigo",
    join: "Unirse",
    activeQuizzes: "Quizzes en vivo",
    none: "No hay quizzes en vivo ahora.",
    open: "Abrir",
  },
  pt: {
    title: "Quiz ao vivo",
    subtitle: "Desafio de vocabulario estilo Kahoot",
    host: "Apresentar quiz",
    joinByCode: "Entrar com codigo",
    codePlaceholder: "Digite o codigo",
    join: "Entrar",
    activeQuizzes: "Quizzes ao vivo",
    none: "Nao ha quizzes ao vivo agora.",
    open: "Abrir",
  },
} as const;

export default function QuizHomePage() {
  const { language } = useLanguage();
  const text = useMemo(() => copy[language], [language]);
  const { user, profile } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [sessions, setSessions] = useState<QuizSession[]>([]);

  useEffect(() => {
    async function load() {
      if (!supabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("quiz_sessions")
        .select("*")
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(25);

      setSessions((data as QuizSession[]) ?? []);
    }

    void load();
  }, []);

  function onJoinSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedCode = normalizeJoinCode(code);
    if (!normalizedCode) return;
    router.push(`/quiz/join?code=${encodeURIComponent(normalizedCode)}`);
  }

  return (
    <AppShell title={text.title} subtitle={text.subtitle}>
      {user && profile?.is_admin ? (
        <Card>
          <CardHeader>
            <CardTitle>{text.host}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/quiz/host">
              <Button className="w-full">{text.host}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{text.joinByCode}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={onJoinSubmit}>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={text.codePlaceholder}
              autoCapitalize="characters"
              autoCorrect="off"
            />
            <Button type="submit">{text.join}</Button>
          </form>
        </CardContent>
      </Card>

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>{text.activeQuizzes}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{text.none}</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{session.join_code}</p>
                    <p className="text-xs text-muted-foreground">{session.status}</p>
                  </div>
                  <Link href={`/quiz/join?code=${encodeURIComponent(session.join_code)}`}>
                    <Button size="sm" variant="outline">
                      {text.open}
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
