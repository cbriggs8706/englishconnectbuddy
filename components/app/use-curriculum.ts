"use client";

import { demoLessons, demoScrambles, demoVocabulary } from "@/lib/demo-data";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Lesson, SentenceScramble, VocabularyItem } from "@/lib/types";
import { useEffect, useState } from "react";

const PAGE_SIZE = 1000;

async function fetchAllVocabulary() {
  const supabase = createClient();
  const allRows: VocabularyItem[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No vocabulary data returned") };
    }

    const batch = data as VocabularyItem[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

export function useCurriculum() {
  const [lessons, setLessons] = useState<Lesson[]>(demoLessons);
  const [vocab, setVocab] = useState<VocabularyItem[]>(demoVocabulary);
  const [scrambles, setScrambles] = useState<SentenceScramble[]>(demoScrambles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabaseConfigured()) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const [lessonsRes, vocabRes, scramblesRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .order("course", { ascending: true })
          .order("sequence_number", { ascending: true }),
        fetchAllVocabulary(),
        supabase
          .from("sentence_scrambles")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (!lessonsRes.error && lessonsRes.data && lessonsRes.data.length > 0) {
        setLessons(lessonsRes.data as Lesson[]);
      }

      if (!vocabRes.error && vocabRes.data && vocabRes.data.length > 0) {
        setVocab(vocabRes.data as VocabularyItem[]);
      }

      if (!scramblesRes.error && scramblesRes.data && scramblesRes.data.length > 0) {
        setScrambles(scramblesRes.data as SentenceScramble[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { lessons, vocab, scrambles, loading };
}
