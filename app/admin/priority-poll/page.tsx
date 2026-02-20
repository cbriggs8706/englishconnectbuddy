"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrioritySectionLabel } from "@/lib/priority-poll";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Language } from "@/lib/types";

const PAGE_SIZE = 1000;

type StudentProfile = {
  id: string;
  display_name: string | null;
  real_name: string | null;
  nickname: string | null;
};

type PriorityRow = {
  user_id: string;
  section_key: string;
  rank_order: number;
  updated_at: string;
};

const copy: Record<
  Language,
  {
    shellTitle: string;
    shellSubtitle: string;
    loading: string;
    cardTitle: string;
    savedRows: string;
    students: string;
    ranked: string;
    noResponse: string;
    noSubmission: string;
    supabaseMissing: string;
    loadError: string;
  }
> = {
  en: {
    shellTitle: "Admin: Priority Poll",
    shellSubtitle: "See ranked learning priorities by student",
    loading: "Loading student priorities data...",
    cardTitle: "Student Priority Poll Report",
    savedRows: "Saved rows",
    students: "Students",
    ranked: "ranked",
    noResponse: "No response",
    noSubmission: "This student has not submitted this poll yet.",
    supabaseMissing: "Supabase env vars are missing.",
    loadError: "Could not load priorities poll data. Check admin permissions and try again.",
  },
  es: {
    shellTitle: "Admin: Encuesta de prioridades",
    shellSubtitle: "Ver prioridades de aprendizaje por estudiante",
    loading: "Cargando datos de prioridades...",
    cardTitle: "Reporte de encuesta de prioridades",
    savedRows: "Respuestas guardadas",
    students: "Estudiantes",
    ranked: "ordenadas",
    noResponse: "Sin respuesta",
    noSubmission: "Este estudiante no ha enviado esta encuesta todavia.",
    supabaseMissing: "Faltan variables de entorno de Supabase.",
    loadError: "No se pudieron cargar los datos de prioridades. Revisa permisos de admin.",
  },
  pt: {
    shellTitle: "Admin: Enquete de prioridades",
    shellSubtitle: "Ver prioridades de aprendizado por aluno",
    loading: "Carregando dados de prioridades...",
    cardTitle: "Relatorio da enquete de prioridades",
    savedRows: "Respostas salvas",
    students: "Alunos",
    ranked: "ordenadas",
    noResponse: "Sem resposta",
    noSubmission: "Este aluno ainda nao enviou esta enquete.",
    supabaseMissing: "As variaveis de ambiente do Supabase estao ausentes.",
    loadError: "Nao foi possivel carregar os dados de prioridades. Verifique permissoes de admin.",
  },
};

async function fetchAllProfiles() {
  const supabase = createClient();
  const allRows: StudentProfile[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, real_name, nickname")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No profile data returned") };
    }

    const batch = data as StudentProfile[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllPriorityRows() {
  const supabase = createClient();
  const allRows: PriorityRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("priority_section_polls")
      .select("user_id, section_key, rank_order, updated_at")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No priorities data returned") };
    }

    const batch = data as PriorityRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

function displayName(profile: StudentProfile) {
  return (
    profile.real_name?.trim() ||
    profile.nickname?.trim() ||
    profile.display_name?.trim() ||
    `User ${profile.id.slice(0, 8)}`
  );
}

export default function AdminPriorityPollPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [priorityRows, setPriorityRows] = useState<PriorityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!supabaseConfigured()) {
        setMessage(text.supabaseMissing);
        setLoading(false);
        return;
      }

      const [profilesRes, priorityRes] = await Promise.all([fetchAllProfiles(), fetchAllPriorityRows()]);
      if (cancelled) return;

      if (profilesRes.error || priorityRes.error) {
        setMessage(text.loadError);
        setLoading(false);
        return;
      }

      setProfiles(profilesRes.data ?? []);
      setPriorityRows(priorityRes.data ?? []);
      setLoading(false);
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [text.loadError, text.supabaseMissing]);

  const rowsByUser = useMemo(() => {
    const map = new Map<string, PriorityRow[]>();
    for (const row of priorityRows) {
      const existing = map.get(row.user_id) ?? [];
      existing.push(row);
      map.set(row.user_id, existing);
    }

    for (const [userId, rows] of map.entries()) {
      rows.sort((a, b) => a.rank_order - b.rank_order);
      map.set(userId, rows);
    }

    return map;
  }, [priorityRows]);

  return (
    <AdminShell title={text.shellTitle} subtitle={text.shellSubtitle}>
      <AdminGate>
        {loading ? (
          <p className="text-base text-muted-foreground">{text.loading}</p>
        ) : (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-r from-fuchsia-600 via-rose-600 to-orange-500 text-white shadow-xl shadow-rose-500/30">
              <CardHeader className="space-y-2 pb-2">
                <CardTitle className="text-2xl font-black">{text.cardTitle}</CardTitle>
                <p className="text-base text-rose-50">
                  {text.savedRows}: {priorityRows.length}
                </p>
                <p className="text-base text-rose-100">
                  {text.students}: {profiles.length}
                </p>
              </CardHeader>
            </Card>

            {message ? <p className="text-base font-semibold text-red-600">{message}</p> : null}

            <div className="space-y-3">
              {profiles.map((profile) => {
                const rows = rowsByUser.get(profile.id) ?? [];

                return (
                  <Card key={profile.id} className="border-2 border-rose-100 bg-white">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xl font-black text-slate-900">{displayName(profile)}</p>
                        <Badge variant={rows.length > 0 ? "default" : "outline"} className="text-sm">
                          {rows.length > 0 ? `${rows.length} ${text.ranked}` : text.noResponse}
                        </Badge>
                      </div>

                      {rows.length > 0 ? (
                        <ol className="space-y-1 pl-5 text-base font-semibold text-slate-700">
                          {rows.map((row) => (
                            <li key={`${row.user_id}:${row.section_key}`} className="list-decimal">
                              {getPrioritySectionLabel(row.section_key, language)}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-base text-muted-foreground">{text.noSubmission}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </AdminGate>
    </AdminShell>
  );
}
