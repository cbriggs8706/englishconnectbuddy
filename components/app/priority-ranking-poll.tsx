"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Language } from "@/lib/types";
import { PRIORITY_SECTION_COUNT, PRIORITY_SECTION_KEYS, getPrioritySections } from "@/lib/priority-poll";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const baseCopy: Record<
  "en" | "es" | "pt",
  {
    loading: string;
    signInTitle: string;
    signInBody: string;
    goToProfile: string;
    title: string;
    subtitle: string;
    tip: string;
    ranked: string;
    moveUp: string;
    moveDown: string;
    bestFor: string;
    save: string;
    saving: string;
    signInFirst: string;
    saveFailed: string;
    saveSuccess: string;
    supabaseMissing: string;
  }
> = {
  en: {
    loading: "Loading poll...",
    signInTitle: "Sign in to answer the priorities poll",
    signInBody: "Drag and drop sections to rank what matters most for you.",
    goToProfile: "Go to Profile",
    title: "Learning Priorities Poll",
    subtitle: "Put your most important section at the top. Rank all sections.",
    tip: "Tip: You can drag cards, or use Move up / Move down for easier control.",
    ranked: "Ranked",
    moveUp: "Move up",
    moveDown: "Move down",
    bestFor: "Best for",
    save: "Save priority ranking",
    saving: "Saving...",
    signInFirst: "Please sign in first to save your ranking.",
    saveFailed: "Could not save ranking. Please try again.",
    saveSuccess: "Priority ranking saved.",
    supabaseMissing: "Supabase env vars are missing.",
  },
  es: {
    loading: "Cargando encuesta...",
    signInTitle: "Inicia sesion para responder la encuesta de prioridades",
    signInBody: "Arrastra y suelta secciones para ordenar lo mas importante para ti.",
    goToProfile: "Ir al perfil",
    title: "Encuesta de prioridades de aprendizaje",
    subtitle: "Pon la seccion mas importante arriba. Ordena todas las secciones.",
    tip: "Consejo: Puedes arrastrar tarjetas o usar Subir / Bajar para mas control.",
    ranked: "Ordenadas",
    moveUp: "Subir",
    moveDown: "Bajar",
    bestFor: "Ideal para",
    save: "Guardar orden de prioridades",
    saving: "Guardando...",
    signInFirst: "Inicia sesion primero para guardar tu orden.",
    saveFailed: "No se pudo guardar el orden. Intenta de nuevo.",
    saveSuccess: "Orden de prioridades guardado.",
    supabaseMissing: "Faltan variables de entorno de Supabase.",
  },
  pt: {
    loading: "Carregando enquete...",
    signInTitle: "Entre para responder a enquete de prioridades",
    signInBody: "Arraste e solte secoes para ordenar o que mais importa para voce.",
    goToProfile: "Ir para perfil",
    title: "Enquete de prioridades de aprendizado",
    subtitle: "Coloque a secao mais importante no topo. Ordene todas as secoes.",
    tip: "Dica: Voce pode arrastar cartoes ou usar Subir / Descer para mais controle.",
    ranked: "Ordenadas",
    moveUp: "Subir",
    moveDown: "Descer",
    bestFor: "Melhor para",
    save: "Salvar ordem de prioridades",
    saving: "Salvando...",
    signInFirst: "Entre primeiro para salvar sua ordem.",
    saveFailed: "Nao foi possivel salvar a ordem. Tente novamente.",
    saveSuccess: "Ordem de prioridades salva.",
    supabaseMissing: "As variaveis de ambiente do Supabase estao ausentes.",
  },
};

const copy: Record<Language, (typeof baseCopy)["en"]> = {
  ...baseCopy,
  sw: {
    ...baseCopy.en,
    loading: "Inapakia kura...",
    signInTitle: "Ingia kujaza kura ya vipaumbele",
    signInBody: "Buruta na udondoshe sehemu ili kupanga yaliyo muhimu zaidi kwako.",
    goToProfile: "Nenda Wasifu",
    title: "Kura ya Vipaumbele vya Kujifunza",
    subtitle: "Weka sehemu muhimu zaidi juu. Panga sehemu zote.",
    tip: "Dokezo: Unaweza kuburuta kadi au kutumia Panda / Shusha kwa udhibiti rahisi.",
    ranked: "Zimepangwa",
    moveUp: "Panda",
    moveDown: "Shusha",
    bestFor: "Inafaa kwa",
    save: "Hifadhi mpangilio wa vipaumbele",
    saving: "Inahifadhi...",
    signInFirst: "Tafadhali ingia kwanza ili kuhifadhi mpangilio wako.",
    saveFailed: "Imeshindwa kuhifadhi. Jaribu tena.",
    saveSuccess: "Mpangilio umehifadhiwa.",
    supabaseMissing: "Vigezo vya mazingira vya Supabase havipo.",
  },
  chk: {
    ...baseCopy.en,
  },
};

function reorderItems(items: string[], draggedKey: string, targetKey: string) {
  if (draggedKey === targetKey) return items;

  const next = [...items];
  const fromIndex = next.indexOf(draggedKey);
  const toIndex = next.indexOf(targetKey);
  if (fromIndex === -1 || toIndex === -1) return items;

  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, draggedKey);
  return next;
}

export function PriorityRankingPoll() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const sections = useMemo(() => getPrioritySections(language), [language]);
  const text = copy[language];
  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => PRIORITY_SECTION_KEYS);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingRanking() {
      if (!user || !supabaseConfigured()) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("priority_section_polls")
        .select("section_key, rank_order")
        .eq("user_id", user.id)
        .order("rank_order", { ascending: true });

      if (cancelled || error || !data || data.length === 0) return;

      const savedKeys = data.map((row) => row.section_key as string);
      const missingKeys = PRIORITY_SECTION_KEYS.filter((key) => !savedKeys.includes(key));
      setOrderedKeys([...savedKeys, ...missingKeys]);
    }

    void loadExistingRanking();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function moveByStep(sectionKey: string, step: number) {
    setOrderedKeys((prev) => {
      const index = prev.indexOf(sectionKey);
      if (index === -1) return prev;
      const nextIndex = index + step;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      next.splice(index, 1);
      next.splice(nextIndex, 0, sectionKey);
      return next;
    });
    setMessage("");
  }

  async function handleSave() {
    if (!user) {
      setMessage(text.signInFirst);
      return;
    }

    if (!supabaseConfigured()) {
      setMessage(text.supabaseMissing);
      return;
    }

    const timestamp = new Date().toISOString();
    const rows = orderedKeys.map((sectionKey, index) => ({
      user_id: user.id,
      section_key: sectionKey,
      rank_order: index + 1,
      updated_at: timestamp,
    }));

    setLoadingSaved(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("priority_section_polls").upsert(rows, {
      onConflict: "user_id,section_key",
    });

    if (error) {
      setMessage(text.saveFailed);
      setLoadingSaved(false);
      return;
    }

    setMessage(text.saveSuccess);
    setLoadingSaved(false);
  }

  if (authLoading) {
    return <p className="text-base text-muted-foreground">{text.loading}</p>;
  }

  if (!user) {
    return (
      <Card className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30">
        <CardHeader>
          <CardTitle className="text-2xl font-black">{text.signInTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-white/95">{text.signInBody}</p>
          <Link href="/profile">
            <Button className="h-12 rounded-2xl bg-white px-6 text-lg font-extrabold text-orange-700 hover:bg-orange-100">
              {text.goToProfile}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-gradient-to-r from-fuchsia-600 via-rose-600 to-orange-500 text-white shadow-xl shadow-rose-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-black">{text.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base text-rose-50">{text.subtitle}</p>
          <p className="text-sm font-semibold text-rose-100">{text.tip}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-rose-100">
              <span>{text.ranked}</span>
              <span>
                {orderedKeys.length}/{PRIORITY_SECTION_COUNT}
              </span>
            </div>
            <Progress value={100} className="bg-white/25" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {orderedKeys.map((sectionKey, index) => {
          const section = sections.find((entry) => entry.key === sectionKey);
          if (!section) return null;

          return (
            <Card
              key={section.key}
              draggable
              onDragStart={() => {
                setDraggedKey(section.key);
                setMessage("");
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggedKey) return;
                setOrderedKeys((prev) => reorderItems(prev, draggedKey, section.key));
                setDraggedKey(null);
              }}
              className="border-2 border-rose-100 bg-white"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xl font-black text-slate-900">{section.title}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => moveByStep(section.key, -1)}
                      disabled={index === 0}
                      className="h-10 rounded-xl bg-sky-100 px-4 text-sm font-black text-sky-900 hover:bg-sky-200 disabled:opacity-50"
                    >
                      {text.moveUp}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => moveByStep(section.key, 1)}
                      disabled={index === orderedKeys.length - 1}
                      className="h-10 rounded-xl bg-sky-100 px-4 text-sm font-black text-sky-900 hover:bg-sky-200 disabled:opacity-50"
                    >
                      {text.moveDown}
                    </Button>
                  </div>
                </div>
                {section.bestFor ? (
                  <p className="text-base font-bold text-rose-700">
                    {text.bestFor}: {section.bestFor}
                  </p>
                ) : null}
                <ul className="space-y-1 pl-5 text-base font-semibold text-slate-700">
                  {section.bullets.map((item) => (
                    <li key={item} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
        <CardContent className="flex flex-col gap-3 p-5">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={loadingSaved}
            className="h-12 rounded-2xl bg-white text-lg font-black text-emerald-700 hover:bg-emerald-50"
          >
            {loadingSaved ? text.saving : text.save}
          </Button>
          {message ? <p className="text-base font-semibold text-white/95">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
