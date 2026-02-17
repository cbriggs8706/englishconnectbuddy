"use client";

import { demoLessons, demoScrambles, demoVocabulary } from "@/lib/demo-data";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Lesson, SentenceScramble, VocabularyItem } from "@/lib/types";
import { useEffect, useState } from "react";

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
          .order("level", { ascending: true })
          .order("sequence_number", { ascending: true }),
        supabase.from("vocabulary").select("*").order("created_at", { ascending: true }),
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
