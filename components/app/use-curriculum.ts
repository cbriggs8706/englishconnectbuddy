"use client";

import { demoLessons, demoScrambles, demoVocabulary } from "@/lib/demo-data";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Lesson, SentenceScramble, VocabularyItem } from "@/lib/types";
import { useEffect, useState } from "react";

const PAGE_SIZE = 1000;

type WordRow = {
  id: string;
  course: string;
  lesson: number;
  eng: string;
  spa: string;
  por: string;
  spa_transliteration: string | null;
  por_transliteration: string | null;
  ipa: string | null;
  part_of_speech: string | null;
  definition: string | null;
  image: string | null;
  eng_audio: string | null;
};

type PhraseRow = {
  id: string;
  course: string;
  lesson: number;
  eng: string;
  spa: string;
  por: string;
  eng_audio: string | null;
};

function lessonLookupKey(course: string, lessonNumber: number) {
  return `${course.trim().toUpperCase()}::${lessonNumber}`;
}

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
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllWords() {
  const supabase = createClient();
  const allRows: WordRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .order("course", { ascending: true })
      .order("lesson", { ascending: true })
      .order("eng", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No words data returned") };
    }

    const batch = data as WordRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

async function fetchAllPhrases() {
  const supabase = createClient();
  const allRows: PhraseRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("phrases")
      .select("*")
      .order("course", { ascending: true })
      .order("lesson", { ascending: true })
      .order("eng", { ascending: true })
      .range(from, to);

    if (error || !data) {
      return { data: null, error: error ?? new Error("No phrases data returned") };
    }

    const batch = data as PhraseRow[];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
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
      const [lessonsRes, wordsRes, phrasesRes, legacyVocabRes, scramblesRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .order("course", { ascending: true })
          .order("sequence_number", { ascending: true }),
        fetchAllWords(),
        fetchAllPhrases(),
        fetchAllVocabulary(),
        supabase
          .from("sentence_scrambles")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      const lessonRows = lessonsRes.data as Lesson[] | null;
      if (!lessonsRes.error && lessonRows && lessonRows.length > 0) {
        setLessons(lessonRows);
      }

      const lessonsForLookup = lessonRows && lessonRows.length > 0 ? lessonRows : demoLessons;
      const lessonLookup: Record<string, string> = {};
      for (const lesson of lessonsForLookup) {
        lessonLookup[lessonLookupKey(lesson.course, lesson.sequence_number)] = lesson.id;
      }

      const mergedRows: VocabularyItem[] = [];
      if (!wordsRes.error && wordsRes.data) {
        for (const word of wordsRes.data) {
          const lessonId = lessonLookup[lessonLookupKey(word.course, word.lesson)];
          if (!lessonId) continue;
          mergedRows.push({
            id: word.id,
            lesson_id: lessonId,
            source_row_id: null,
            item_type: "word",
            english_text: word.eng,
            english_sentence: null,
            spanish_text: word.spa,
            portuguese_text: word.por,
            spanish_transliteration: word.spa_transliteration,
            portuguese_transliteration: word.por_transliteration,
            ipa: word.ipa,
            part_of_speech: word.part_of_speech,
            definition: word.definition,
            image_url: word.image,
            audio_url: word.eng_audio,
            difficulty_level: 1,
          });
        }
      }

      if (!phrasesRes.error && phrasesRes.data) {
        for (const phrase of phrasesRes.data) {
          const lessonId = lessonLookup[lessonLookupKey(phrase.course, phrase.lesson)];
          if (!lessonId) continue;
          mergedRows.push({
            id: phrase.id,
            lesson_id: lessonId,
            source_row_id: null,
            item_type: "phrase",
            english_text: phrase.eng,
            english_sentence: null,
            spanish_text: phrase.spa,
            portuguese_text: phrase.por,
            spanish_transliteration: null,
            portuguese_transliteration: null,
            ipa: null,
            part_of_speech: null,
            definition: null,
            image_url: null,
            audio_url: phrase.eng_audio,
            difficulty_level: 1,
          });
        }
      }

      if (mergedRows.length > 0) {
        setVocab(mergedRows);
      } else if (!legacyVocabRes.error && legacyVocabRes.data && legacyVocabRes.data.length > 0) {
        setVocab(legacyVocabRes.data as VocabularyItem[]);
      }

      if (!scramblesRes.error && scramblesRes.data && scramblesRes.data.length > 0) {
        setScrambles(scramblesRes.data as SentenceScramble[]);
      }

      setLoading(false);
    }

    void load();
  }, []);

  return { lessons, vocab, scrambles, loading };
}
