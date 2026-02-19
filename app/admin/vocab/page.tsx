"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AppShell } from "@/components/app/app-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCsv } from "@/lib/csv";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  created_at: string;
  updated_at: string;
};

type WordUpsertInput = {
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
  updated_at: string;
};

type PhraseRow = {
  id: string;
  course: string;
  lesson: number;
  eng: string;
  spa: string;
  por: string;
  eng_audio: string | null;
  created_at: string;
  updated_at: string;
};

type PhraseUpsertInput = {
  course: string;
  lesson: number;
  eng: string;
  spa: string;
  por: string;
  eng_audio: string | null;
  updated_at: string;
};

const PAGE_SIZE = 1000;
const UPSERT_CHUNK_SIZE = 250;

function nullIfEmpty(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function chunkArray<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

async function fetchAllRows<T extends { created_at: string }>(table: "words" | "phrases") {
  const supabase = createClient();
  const all: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("course", { ascending: true })
      .order("lesson", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as T[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

function readField(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (Object.hasOwn(row, key)) {
      return row[key] ?? "";
    }
  }
  return "";
}

function parseLesson(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeTriplet(eng: string, spa: string, por: string) {
  const fallback = eng || spa || por || "";
  return {
    eng: eng || fallback,
    spa: spa || fallback,
    por: por || fallback,
  };
}

function dedupeByConflictKey<T extends { course: string; lesson: number; eng: string; spa: string; por: string }>(
  rows: T[],
) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.course.trim().toUpperCase()}::${row.lesson}::${row.eng.trim().toLowerCase()}::${row.spa
      .trim()
      .toLowerCase()}::${row.por.trim().toLowerCase()}`;
    map.set(key, row);
  }
  return Array.from(map.values());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  const record = asRecord(error);
  if (!record) return fallback;

  const message = typeof record.message === "string" ? record.message : null;
  const code = typeof record.code === "string" ? record.code : null;
  const details = typeof record.details === "string" ? record.details : null;
  const hint = typeof record.hint === "string" ? record.hint : null;

  const parts = [message, code ? `code: ${code}` : null, details ? `details: ${details}` : null, hint ? `hint: ${hint}` : null]
    .filter(Boolean)
    .join(" | ");

  return parts || fallback;
}

type LessonLookup = Record<string, string>;

function lessonLookupKey(course: string, lessonNumber: number) {
  return `${course.trim().toUpperCase()}::${lessonNumber}`;
}

async function loadLessonLookup() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, course, sequence_number")
    .order("course", { ascending: true })
    .order("sequence_number", { ascending: true });

  if (error) throw error;

  const lookup: LessonLookup = {};
  for (const lesson of data ?? []) {
    const key = lessonLookupKey(String(lesson.course ?? ""), Number(lesson.sequence_number ?? 0));
    if (key.endsWith("::0")) continue;
    lookup[key] = String(lesson.id);
  }
  return lookup;
}

function resolveLessonId(lookup: LessonLookup, course: string, lessonNumber: number) {
  return lookup[lessonLookupKey(course, lessonNumber)] ?? null;
}

export default function AdminVocabPage() {
  const { language } = useLanguage();
  const copy = t(language);
  const [loading, setLoading] = useState(true);
  const [uploadingWords, setUploadingWords] = useState(false);
  const [uploadingPhrases, setUploadingPhrases] = useState(false);
  const [savingWord, setSavingWord] = useState(false);
  const [savingPhrase, setSavingPhrase] = useState(false);
  const [deletingVocabulary, setDeletingVocabulary] = useState(false);
  const [wordsCsvFile, setWordsCsvFile] = useState<File | null>(null);
  const [phrasesCsvFile, setPhrasesCsvFile] = useState<File | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);
  const [phrases, setPhrases] = useState<PhraseRow[]>([]);
  const [lessonLookup, setLessonLookup] = useState<LessonLookup>({});
  const [message, setMessage] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [phraseSearch, setPhraseSearch] = useState("");
  const [selectedWord, setSelectedWord] = useState<WordRow | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseRow | null>(null);

  async function loadData() {
    if (!supabaseConfigured()) return;
    const [wordRows, phraseRows, lessonsByCourseSequence] = await Promise.all([
      fetchAllRows<WordRow>("words"),
      fetchAllRows<PhraseRow>("phrases"),
      loadLessonLookup(),
    ]);
    setWords(wordRows);
    setPhrases(phraseRows);
    setLessonLookup(lessonsByCourseSequence);
  }

  useEffect(() => {
    async function boot() {
      if (!supabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not load words/phrases."));
    } finally {
      setLoading(false);
    }
    }

    void boot();
  }, []);

  const filteredWords = useMemo(() => {
    const query = wordSearch.trim().toLowerCase();
    if (!query) return words;
    return words.filter((row) =>
      [row.id, row.course, row.eng, row.spa, row.por].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [wordSearch, words]);

  const filteredPhrases = useMemo(() => {
    const query = phraseSearch.trim().toLowerCase();
    if (!query) return phrases;
    return phrases.filter((row) =>
      [row.id, row.course, row.eng, row.spa, row.por].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [phraseSearch, phrases]);

  async function mirrorWordsToVocabulary(rows: WordRow[], lessonsByCourseSequence: LessonLookup) {
    if (rows.length === 0) return;

    const payload = rows.map((row) => {
      const lessonId = resolveLessonId(lessonsByCourseSequence, row.course, row.lesson);
      if (!lessonId) {
        throw new Error(`No lesson found for course ${row.course}, lesson ${row.lesson}.`);
      }

      return {
        id: row.id,
        lesson_id: lessonId,
        item_type: "word",
        english_text: row.eng,
        english_sentence: null,
        spanish_text: row.spa,
        portuguese_text: row.por,
        spanish_transliteration: nullIfEmpty(row.spa_transliteration),
        portuguese_transliteration: nullIfEmpty(row.por_transliteration),
        ipa: nullIfEmpty(row.ipa),
        part_of_speech: nullIfEmpty(row.part_of_speech),
        definition: nullIfEmpty(row.definition),
        image_url: nullIfEmpty(row.image),
        audio_url: nullIfEmpty(row.eng_audio),
        difficulty_level: 1,
      };
    });

    const supabase = createClient();
    const chunks = chunkArray(payload, UPSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      const { error } = await supabase.from("vocabulary").upsert(chunk, { onConflict: "id" });
      if (error) throw error;
    }
  }

  async function mirrorPhrasesToVocabulary(rows: PhraseRow[], lessonsByCourseSequence: LessonLookup) {
    if (rows.length === 0) return;

    const payload = rows.map((row) => {
      const lessonId = resolveLessonId(lessonsByCourseSequence, row.course, row.lesson);
      if (!lessonId) {
        throw new Error(`No lesson found for course ${row.course}, lesson ${row.lesson}.`);
      }

      return {
        id: row.id,
        lesson_id: lessonId,
        item_type: "phrase",
        english_text: row.eng,
        english_sentence: null,
        spanish_text: row.spa,
        portuguese_text: row.por,
        spanish_transliteration: null,
        portuguese_transliteration: null,
        ipa: null,
        part_of_speech: null,
        definition: null,
        image_url: null,
        audio_url: nullIfEmpty(row.eng_audio),
        difficulty_level: 1,
      };
    });

    const supabase = createClient();
    const chunks = chunkArray(payload, UPSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      const { error } = await supabase.from("vocabulary").upsert(chunk, { onConflict: "id" });
      if (error) throw error;
    }
  }

  async function onUploadWords(event: FormEvent) {
    event.preventDefault();
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }
    if (!wordsCsvFile) {
      setMessage("Choose a words CSV file first.");
      return;
    }

    setUploadingWords(true);
    try {
      const fileText = await wordsCsvFile.text();
      const rows = parseCsv(fileText);
      if (rows.length === 0) {
        setMessage("Words CSV is empty.");
        return;
      }

      const parsed = rows.map((row, index): WordUpsertInput => {
        const course = readField(row, "course").trim();
        const lessonRaw = readField(row, "lesson").trim();
        const lesson = parseLesson(lessonRaw);
        const eng = readField(row, "eng").trim();
        const spa = readField(row, "spa").trim();
        const por = readField(row, "por").trim();

        if (!course || !lesson) {
          throw new Error(`Missing required course/lesson in words CSV row ${index + 2}.`);
        }

        if (!eng && !spa && !por) {
          throw new Error(`Need at least one text value (eng/spa/por) in words CSV row ${index + 2}.`);
        }

        const normalized = normalizeTriplet(eng, spa, por);

        return {
          course,
          lesson,
          eng: normalized.eng,
          spa: normalized.spa,
          por: normalized.por,
          spa_transliteration: nullIfEmpty(readField(row, "spaTransliteration", "spa_transliteration")),
          por_transliteration: nullIfEmpty(readField(row, "porTransliteration", "por_transliteration")),
          ipa: nullIfEmpty(readField(row, "ipa")),
          part_of_speech: nullIfEmpty(readField(row, "partOfSpeech", "part_of_speech")),
          definition: nullIfEmpty(readField(row, "definition")),
          image: nullIfEmpty(readField(row, "image")),
          eng_audio: nullIfEmpty(readField(row, "engAudio", "eng_audio")),
          updated_at: new Date().toISOString(),
        };
      });

      const deduped = dedupeByConflictKey(parsed);
      const supabase = createClient();
      const chunks = chunkArray(deduped, UPSERT_CHUNK_SIZE);
      const savedRows: WordRow[] = [];
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from("words")
          .upsert(chunk, { onConflict: "course,lesson,eng,spa,por" })
          .select("*");
        if (error) throw error;
        savedRows.push(...((data ?? []) as WordRow[]));
      }

      await mirrorWordsToVocabulary(savedRows, lessonLookup);
      await loadData();
      setWordsCsvFile(null);
      const duplicateCount = parsed.length - deduped.length;
      setMessage(
        `Words upload complete. Imported/updated ${deduped.length} rows.${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicate rows in this file.` : ""}`,
      );
    } catch (error) {
      setMessage(getErrorMessage(error, "Words upload failed."));
    } finally {
      setUploadingWords(false);
    }
  }

  async function onUploadPhrases(event: FormEvent) {
    event.preventDefault();

    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }
    if (!phrasesCsvFile) {
      setMessage("Choose a phrases CSV file first.");
      return;
    }

    setUploadingPhrases(true);
    try {
      const fileText = await phrasesCsvFile.text();
      const rows = parseCsv(fileText);
      if (rows.length === 0) {
        setMessage("Phrases CSV is empty.");
        return;
      }

      const parsed = rows.map((row, index): PhraseUpsertInput => {
        const course = readField(row, "course").trim();
        const lessonRaw = readField(row, "lesson").trim();
        const lesson = parseLesson(lessonRaw);
        const eng = readField(row, "eng").trim();
        const spa = readField(row, "spa").trim();
        const por = readField(row, "por").trim();

        if (!course || !lesson) {
          throw new Error(`Missing required course/lesson in phrases CSV row ${index + 2}.`);
        }

        if (!eng && !spa && !por) {
          throw new Error(`Need at least one text value (eng/spa/por) in phrases CSV row ${index + 2}.`);
        }

        const normalized = normalizeTriplet(eng, spa, por);

        return {
          course,
          lesson,
          eng: normalized.eng,
          spa: normalized.spa,
          por: normalized.por,
          eng_audio: nullIfEmpty(readField(row, "engAudio", "eng_audio")),
          updated_at: new Date().toISOString(),
        };
      });

      const deduped = dedupeByConflictKey(parsed);
      const supabase = createClient();
      const chunks = chunkArray(deduped, UPSERT_CHUNK_SIZE);
      const savedRows: PhraseRow[] = [];
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from("phrases")
          .upsert(chunk, { onConflict: "course,lesson,eng,spa,por" })
          .select("*");
        if (error) throw error;
        savedRows.push(...((data ?? []) as PhraseRow[]));
      }

      await mirrorPhrasesToVocabulary(savedRows, lessonLookup);
      await loadData();
      setPhrasesCsvFile(null);
      const duplicateCount = parsed.length - deduped.length;
      setMessage(
        `Phrases upload complete. Imported/updated ${deduped.length} rows.${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicate rows in this file.` : ""}`,
      );
    } catch (error) {
      setMessage(getErrorMessage(error, "Phrases upload failed."));
    } finally {
      setUploadingPhrases(false);
    }
  }

  async function onDeleteLegacyVocabulary() {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }
    if (clearConfirm.trim().toUpperCase() !== "DELETE") {
      setMessage('Type "DELETE" to confirm clearing vocabulary.');
      return;
    }

    setDeletingVocabulary(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("vocabulary").delete().not("id", "is", null);
      if (error) throw error;
      setMessage("All rows were removed from vocabulary.");
      setClearConfirm("");
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not clear vocabulary."));
    } finally {
      setDeletingVocabulary(false);
    }
  }

  async function onSaveWord(event: FormEvent) {
    event.preventDefault();
    if (!selectedWord) return;
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    setSavingWord(true);
    try {
      const lessonId = resolveLessonId(lessonLookup, selectedWord.course, selectedWord.lesson);
      if (!lessonId) {
        throw new Error(`No lesson found for course ${selectedWord.course}, lesson ${selectedWord.lesson}.`);
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("words")
        .update({
          course: selectedWord.course.trim(),
          lesson: selectedWord.lesson,
          eng: selectedWord.eng.trim(),
          spa: selectedWord.spa.trim(),
          por: selectedWord.por.trim(),
          spa_transliteration: nullIfEmpty(selectedWord.spa_transliteration),
          por_transliteration: nullIfEmpty(selectedWord.por_transliteration),
          ipa: nullIfEmpty(selectedWord.ipa),
          part_of_speech: nullIfEmpty(selectedWord.part_of_speech),
          definition: nullIfEmpty(selectedWord.definition),
          image: nullIfEmpty(selectedWord.image),
          eng_audio: nullIfEmpty(selectedWord.eng_audio),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWord.id);

      if (error) throw error;

      const { error: vocabularyError } = await supabase
        .from("vocabulary")
        .upsert(
          {
            id: selectedWord.id,
            lesson_id: lessonId,
            item_type: "word",
            english_text: selectedWord.eng.trim(),
            english_sentence: null,
            spanish_text: selectedWord.spa.trim(),
            portuguese_text: selectedWord.por.trim(),
            spanish_transliteration: nullIfEmpty(selectedWord.spa_transliteration),
            portuguese_transliteration: nullIfEmpty(selectedWord.por_transliteration),
            ipa: nullIfEmpty(selectedWord.ipa),
            part_of_speech: nullIfEmpty(selectedWord.part_of_speech),
            definition: nullIfEmpty(selectedWord.definition),
            image_url: nullIfEmpty(selectedWord.image),
            audio_url: nullIfEmpty(selectedWord.eng_audio),
            difficulty_level: 1,
          },
          { onConflict: "id" },
        );

      if (vocabularyError) throw vocabularyError;
      await loadData();
      setMessage(`Word ${selectedWord.id} updated.`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not save word."));
    } finally {
      setSavingWord(false);
    }
  }

  async function onSavePhrase(event: FormEvent) {
    event.preventDefault();
    if (!selectedPhrase) return;
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    setSavingPhrase(true);
    try {
      const lessonId = resolveLessonId(lessonLookup, selectedPhrase.course, selectedPhrase.lesson);
      if (!lessonId) {
        throw new Error(`No lesson found for course ${selectedPhrase.course}, lesson ${selectedPhrase.lesson}.`);
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("phrases")
        .update({
          course: selectedPhrase.course.trim(),
          lesson: selectedPhrase.lesson,
          eng: selectedPhrase.eng.trim(),
          spa: selectedPhrase.spa.trim(),
          por: selectedPhrase.por.trim(),
          eng_audio: nullIfEmpty(selectedPhrase.eng_audio),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPhrase.id);

      if (error) throw error;

      const { error: vocabularyError } = await supabase
        .from("vocabulary")
        .upsert(
          {
            id: selectedPhrase.id,
            lesson_id: lessonId,
            item_type: "phrase",
            english_text: selectedPhrase.eng.trim(),
            english_sentence: null,
            spanish_text: selectedPhrase.spa.trim(),
            portuguese_text: selectedPhrase.por.trim(),
            spanish_transliteration: null,
            portuguese_transliteration: null,
            ipa: null,
            part_of_speech: null,
            definition: null,
            image_url: null,
            audio_url: nullIfEmpty(selectedPhrase.eng_audio),
            difficulty_level: 1,
          },
          { onConflict: "id" },
        );

      if (vocabularyError) throw vocabularyError;
      await loadData();
      setMessage(`Phrase ${selectedPhrase.id} updated.`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not save phrase."));
    } finally {
      setSavingPhrase(false);
    }
  }

  return (
    <AppShell title="Words & Phrases Admin">
      <AdminGate>
        <div className="grid gap-4">
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-red-800">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base text-red-900">
                This removes all rows from the old <code>vocabulary</code> table.
              </p>
              <Label htmlFor="clear-vocab-confirm" className="text-base font-bold text-red-900">
                Type DELETE to confirm
              </Label>
              <Input
                id="clear-vocab-confirm"
                value={clearConfirm}
                onChange={(event) => setClearConfirm(event.target.value)}
                placeholder="DELETE"
              />
              <Button
                type="button"
                className="h-12 bg-red-700 text-white hover:bg-red-800"
                disabled={deletingVocabulary}
                onClick={() => void onDeleteLegacyVocabulary()}
              >
                {deletingVocabulary ? "Clearing..." : "Clear legacy vocabulary table"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl font-black">Upload Words CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onUploadWords}>
                <Label htmlFor="words-file" className="text-base font-bold text-white">
                  Headers: course, lesson, eng, spa, por, spaTransliteration, porTransliteration, ipa, partOfSpeech, definition, image, engAudio
                </Label>
                <Input
                  id="words-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setWordsCsvFile(event.target.files?.[0] ?? null)}
                  className="border-white/50 bg-white text-slate-900"
                />
                <Button type="submit" className="h-12 bg-white text-sky-700 hover:bg-sky-100" disabled={uploadingWords}>
                  {uploadingWords ? "Uploading words..." : "Upload words CSV"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl font-black">Upload Phrases CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onUploadPhrases}>
                <Label htmlFor="phrases-file" className="text-base font-bold text-white">
                  Headers: course, lesson, eng, spa, por, engAudio
                </Label>
                <Input
                  id="phrases-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setPhrasesCsvFile(event.target.files?.[0] ?? null)}
                  className="border-white/50 bg-white text-slate-900"
                />
                <Button type="submit" className="h-12 bg-white text-teal-700 hover:bg-teal-100" disabled={uploadingPhrases}>
                  {uploadingPhrases ? "Uploading phrases..." : "Upload phrases CSV"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-black text-slate-900">Words ({words.length})</CardTitle>
              <Input
                placeholder="Search words by id/course/text..."
                value={wordSearch}
                onChange={(event) => setWordSearch(event.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-base text-slate-600">Loading...</p> : null}
              <div className="max-h-[420px] overflow-auto rounded-xl border bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-slate-900">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Lesson</th>
                      <th className="px-3 py-2">English</th>
                      <th className="px-3 py-2">Spanish</th>
                      <th className="px-3 py-2">Portuguese</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWords.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-t hover:bg-sky-50"
                        onClick={() => setSelectedWord(row)}
                      >
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2">{row.course}</td>
                        <td className="px-3 py-2">{row.lesson}</td>
                        <td className="px-3 py-2">{row.eng}</td>
                        <td className="px-3 py-2">{row.spa}</td>
                        <td className="px-3 py-2">{row.por}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedWord ? (
            <Card className="bg-sky-50">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900">Edit Word: {selectedWord.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveWord}>
                  <div className="space-y-1">
                    <Label>Course</Label>
                    <Input
                      value={selectedWord.course}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, course: event.target.value } : prev))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Lesson</Label>
                    <Input
                      type="number"
                      min={1}
                      value={selectedWord.lesson}
                      onChange={(event) =>
                        setSelectedWord((prev) =>
                          prev ? { ...prev, lesson: Number.parseInt(event.target.value || "1", 10) || 1 } : prev,
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>English</Label>
                    <Input
                      value={selectedWord.eng}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, eng: event.target.value } : prev))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Spanish</Label>
                    <Input
                      value={selectedWord.spa}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, spa: event.target.value } : prev))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Portuguese</Label>
                    <Input
                      value={selectedWord.por}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, por: event.target.value } : prev))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Spanish Transliteration</Label>
                    <Input
                      value={selectedWord.spa_transliteration ?? ""}
                      onChange={(event) =>
                        setSelectedWord((prev) => (prev ? { ...prev, spa_transliteration: event.target.value } : prev))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Portuguese Transliteration</Label>
                    <Input
                      value={selectedWord.por_transliteration ?? ""}
                      onChange={(event) =>
                        setSelectedWord((prev) => (prev ? { ...prev, por_transliteration: event.target.value } : prev))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>IPA</Label>
                    <Input
                      value={selectedWord.ipa ?? ""}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, ipa: event.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Part of Speech</Label>
                    <Input
                      value={selectedWord.part_of_speech ?? ""}
                      onChange={(event) =>
                        setSelectedWord((prev) => (prev ? { ...prev, part_of_speech: event.target.value } : prev))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Definition</Label>
                    <Input
                      value={selectedWord.definition ?? ""}
                      onChange={(event) =>
                        setSelectedWord((prev) => (prev ? { ...prev, definition: event.target.value } : prev))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Image URL</Label>
                    <Input
                      value={selectedWord.image ?? ""}
                      onChange={(event) => setSelectedWord((prev) => (prev ? { ...prev, image: event.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>English Audio URL</Label>
                    <Input
                      value={selectedWord.eng_audio ?? ""}
                      onChange={(event) =>
                        setSelectedWord((prev) => (prev ? { ...prev, eng_audio: event.target.value } : prev))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="h-12" disabled={savingWord}>
                      {savingWord ? "Saving..." : "Save word changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-black text-slate-900">Phrases ({phrases.length})</CardTitle>
              <Input
                placeholder="Search phrases by id/course/text..."
                value={phraseSearch}
                onChange={(event) => setPhraseSearch(event.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-base text-slate-600">Loading...</p> : null}
              <div className="max-h-[420px] overflow-auto rounded-xl border bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-slate-900">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Lesson</th>
                      <th className="px-3 py-2">English</th>
                      <th className="px-3 py-2">Spanish</th>
                      <th className="px-3 py-2">Portuguese</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPhrases.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-t hover:bg-emerald-50"
                        onClick={() => setSelectedPhrase(row)}
                      >
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2">{row.course}</td>
                        <td className="px-3 py-2">{row.lesson}</td>
                        <td className="px-3 py-2">{row.eng}</td>
                        <td className="px-3 py-2">{row.spa}</td>
                        <td className="px-3 py-2">{row.por}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedPhrase ? (
            <Card className="bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900">Edit Phrase: {selectedPhrase.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 md:grid-cols-2" onSubmit={onSavePhrase}>
                <Input
                  placeholder="Course"
                  value={selectedPhrase.course}
                  onChange={(event) => setSelectedPhrase((prev) => (prev ? { ...prev, course: event.target.value } : prev))}
                  required
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Lesson"
                  value={selectedPhrase.lesson}
                  onChange={(event) =>
                    setSelectedPhrase((prev) =>
                      prev ? { ...prev, lesson: Number.parseInt(event.target.value || "1", 10) || 1 } : prev,
                    )
                  }
                  required
                />
                <Input
                  placeholder="English"
                  value={selectedPhrase.eng}
                  onChange={(event) => setSelectedPhrase((prev) => (prev ? { ...prev, eng: event.target.value } : prev))}
                  required
                />
                <Input
                  placeholder="Spanish"
                  value={selectedPhrase.spa}
                  onChange={(event) => setSelectedPhrase((prev) => (prev ? { ...prev, spa: event.target.value } : prev))}
                  required
                />
                <Input
                  placeholder="Portuguese"
                  value={selectedPhrase.por}
                  onChange={(event) => setSelectedPhrase((prev) => (prev ? { ...prev, por: event.target.value } : prev))}
                  required
                />
                <Input
                  placeholder="English Audio URL"
                  value={selectedPhrase.eng_audio ?? ""}
                  onChange={(event) =>
                    setSelectedPhrase((prev) => (prev ? { ...prev, eng_audio: event.target.value } : prev))
                  }
                />
                <div className="md:col-span-2">
                  <Button type="submit" className="h-12" disabled={savingPhrase}>
                    {savingPhrase ? "Saving..." : "Save phrase changes"}
                  </Button>
                </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {message ? <p className="text-base text-slate-700">{message}</p> : null}
        </div>
      </AdminGate>
    </AppShell>
  );
}
