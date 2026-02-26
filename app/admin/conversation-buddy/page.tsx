"use client";
// locale-check: ignore - contains example swap-group JSON literals, not UI locale maps.

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ConversationKind,
  ConversationPhraseRow,
  normalizeSwapGroups,
  resolveTemplate,
  validateTemplateCoverage,
} from "@/lib/conversation-buddy";
import { lessonLabel } from "@/lib/content";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { LessonPattern } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 500;

type PatternMap = Record<string, LessonPattern>;

type ConversationForm = {
  template_en: string;
  template_es: string;
  template_pt: string;
  swap_groups_json: string;
};

const EMPTY_FORM: ConversationForm = {
  template_en: "",
  template_es: "",
  template_pt: "",
  swap_groups_json: "[]",
};

const EXAMPLE_SWAP_GROUPS = JSON.stringify(
  [
    {
      key: "subject",
      label: "Pronoun",
      default_option_id: "you",
      options: [
        { id: "you", en: "you", es: "tu", pt: "voce" },
        { id: "he", en: "he", es: "el", pt: "ele" },
        { id: "she", en: "she", es: "ella", pt: "ela" },
      ],
    },
  ],
  null,
  2,
);

function mapKey(course: string, lesson: number, slot: number, kind: ConversationKind) {
  return `${course.trim().toUpperCase()}::${lesson}::${slot}::${kind}`;
}

async function fetchAllConversationRows() {
  const supabase = createClient();
  const rows: ConversationPhraseRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("phrases")
      .select("id, course, lesson, pattern_slot, kind, template_en, template_es, template_pt, swap_groups, created_at, updated_at")
      .not("pattern_slot", "is", null)
      .not("kind", "is", null)
      .order("course", { ascending: true })
      .order("lesson", { ascending: true })
      .order("pattern_slot", { ascending: true })
      .order("kind", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const batch = (data ?? []) as ConversationPhraseRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export default function AdminConversationBuddyPage() {
  const { language } = useLanguage();
  const { lessons } = useCurriculum();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<ConversationPhraseRow[]>([]);
  const [patternsByLesson, setPatternsByLesson] = useState<PatternMap>({});

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<"1" | "2">("1");
  const [selectedKind, setSelectedKind] = useState<ConversationKind>("question");
  const [form, setForm] = useState<ConversationForm>(EMPTY_FORM);

  const courses = useMemo(() => {
    const unique = new Set<string>();
    for (const lesson of lessons) unique.add(lesson.course);
    return Array.from(unique.values()).sort();
  }, [lessons]);

  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(courses[0]);
    }
  }, [courses, selectedCourse]);

  const lessonsForCourse = useMemo(
    () =>
      lessons
        .filter((lesson) => !selectedCourse || lesson.course === selectedCourse)
        .sort((a, b) => a.sequence_number - b.sequence_number),
    [lessons, selectedCourse],
  );

  useEffect(() => {
    if (!selectedLessonId && lessonsForCourse[0]?.id) {
      setSelectedLessonId(lessonsForCourse[0].id);
      return;
    }
    const stillVisible = lessonsForCourse.some((lesson) => lesson.id === selectedLessonId);
    if (!stillVisible && lessonsForCourse[0]?.id) {
      setSelectedLessonId(lessonsForCourse[0].id);
    }
  }, [lessonsForCourse, selectedLessonId]);

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessonsForCourse[0] ?? null,
    [lessons, lessonsForCourse, selectedLessonId],
  );

  const rowMap = useMemo(() => {
    const next: Record<string, ConversationPhraseRow> = {};
    for (const row of rows) {
      if (!row.pattern_slot || !row.kind) continue;
      next[mapKey(row.course, row.lesson, row.pattern_slot, row.kind)] = row;
    }
    return next;
  }, [rows]);

  const selectedExisting = useMemo(() => {
    if (!activeLesson) return null;
    return rowMap[
      mapKey(activeLesson.course, activeLesson.sequence_number, Number(selectedSlot), selectedKind)
    ];
  }, [activeLesson, rowMap, selectedKind, selectedSlot]);

  const lessonRows = useMemo(() => {
    if (!activeLesson) return [];
    return rows
      .filter((row) => row.course === activeLesson.course && row.lesson === activeLesson.sequence_number)
      .sort((a, b) => {
        const aSlot = a.pattern_slot ?? 9;
        const bSlot = b.pattern_slot ?? 9;
        if (aSlot !== bSlot) return aSlot - bSlot;
        return (a.kind ?? "").localeCompare(b.kind ?? "");
      });
  }, [activeLesson, rows]);

  const activePattern = activeLesson ? patternsByLesson[activeLesson.id] : undefined;

  useEffect(() => {
    if (!selectedExisting) {
      setForm(EMPTY_FORM);
      return;
    }

    const normalized = normalizeSwapGroups(selectedExisting.swap_groups);
    setForm({
      template_en: selectedExisting.template_en ?? "",
      template_es: selectedExisting.template_es ?? "",
      template_pt: selectedExisting.template_pt ?? "",
      swap_groups_json: JSON.stringify(normalized, null, 2),
    });
  }, [selectedExisting?.id]);

  useEffect(() => {
    async function load() {
      if (!supabaseConfigured()) {
        setLoading(false);
        setMessage("Supabase is not configured.");
        return;
      }

      try {
        const supabase = createClient();
        const [phraseRows, patternsRes] = await Promise.all([
          fetchAllConversationRows(),
          supabase.from("lesson_patterns").select("*"),
        ]);

        setRows(phraseRows);
        const patternMap: PatternMap = {};
        for (const row of patternsRes.data ?? []) {
          const pattern = row as LessonPattern;
          patternMap[pattern.lesson_id] = pattern;
        }
        setPatternsByLesson(patternMap);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load conversation mappings.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function applyExample() {
    setForm((prev) => ({ ...prev, swap_groups_json: EXAMPLE_SWAP_GROUPS }));
  }

  async function saveMapping() {
    if (!activeLesson) {
      setMessage("Pick a lesson first.");
      return;
    }

    if (!supabaseConfigured()) {
      setMessage("Supabase is not configured.");
      return;
    }

    const templateEn = form.template_en.trim();
    const templateEs = form.template_es.trim();
    const templatePt = form.template_pt.trim();

    if (!templateEn || !templateEs || !templatePt) {
      setMessage("Template EN/ES/PT are required.");
      return;
    }

    let parsedGroups: unknown;
    try {
      parsedGroups = JSON.parse(form.swap_groups_json || "[]");
    } catch {
      setMessage("swap_groups must be valid JSON.");
      return;
    }

    const groups = normalizeSwapGroups(parsedGroups);
    const coverageErrors = validateTemplateCoverage(
      [
        { label: "English template", template: templateEn },
        { label: "Spanish template", template: templateEs },
        { label: "Portuguese template", template: templatePt },
      ],
      groups,
    );

    if (coverageErrors.length > 0) {
      setMessage(coverageErrors[0]);
      return;
    }

    const payload = {
      course: activeLesson.course,
      lesson: activeLesson.sequence_number,
      pattern_slot: Number(selectedSlot),
      kind: selectedKind,
      template_en: templateEn,
      template_es: templateEs,
      template_pt: templatePt,
      swap_groups: groups,
      eng: templateEn,
      spa: templateEs,
      por: templatePt,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      if (selectedExisting) {
        const { error } = await supabase.from("phrases").update(payload).eq("id", selectedExisting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("phrases").insert(payload);
        if (error) throw error;
      }

      const refreshed = await fetchAllConversationRows();
      setRows(refreshed);
      setMessage("Conversation mapping saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save mapping.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMapping() {
    if (!selectedExisting) {
      setMessage("No mapping selected to delete.");
      return;
    }

    if (!supabaseConfigured()) {
      setMessage("Supabase is not configured.");
      return;
    }

    setDeleting(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("phrases").delete().eq("id", selectedExisting.id);
      if (error) throw error;
      const refreshed = await fetchAllConversationRows();
      setRows(refreshed);
      setMessage("Conversation mapping deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete mapping.");
    } finally {
      setDeleting(false);
    }
  }

  const hintImageUrl =
    selectedKind === "question"
      ? selectedSlot === "1"
        ? activePattern?.en_pattern_1_question_image_url
        : activePattern?.en_pattern_2_question_image_url
      : selectedSlot === "1"
        ? activePattern?.en_pattern_1_answer_image_url
        : activePattern?.en_pattern_2_answer_image_url;

  return (
    <AdminShell title="Conversation Buddy Mapping" subtitle="Map lesson question/answer families to pattern slots.">
      <AdminGate>
        <div className="grid gap-4">
          <Card className="border-0 bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 text-white shadow-xl shadow-rose-500/30">
            <CardHeader>
              <CardTitle className="text-3xl font-black">Conversation Buddy Admin</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="h-12 border-white/50 bg-white text-base font-bold text-slate-900">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Lesson</Label>
                  <Select value={activeLesson?.id ?? ""} onValueChange={setSelectedLessonId}>
                    <SelectTrigger className="h-12 border-white/50 bg-white text-base font-bold text-slate-900">
                      <SelectValue placeholder="Select lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonsForCourse.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lessonLabel(lesson, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Pattern Slot</Label>
                  <Select value={selectedSlot} onValueChange={(value: "1" | "2") => setSelectedSlot(value)}>
                    <SelectTrigger className="h-12 border-white/50 bg-white text-base font-bold text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Pattern 1</SelectItem>
                      <SelectItem value="2">Pattern 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Kind</Label>
                  <Select value={selectedKind} onValueChange={(value: ConversationKind) => setSelectedKind(value)}>
                    <SelectTrigger className="h-12 border-white/50 bg-white text-base font-bold text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="answer">Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Template EN</Label>
                  <Textarea
                    value={form.template_en}
                    onChange={(event) => setForm((prev) => ({ ...prev, template_en: event.target.value }))}
                    placeholder="What is {{poss_pronoun}} name?"
                    className="min-h-28 text-base font-semibold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Template ES</Label>
                  <Textarea
                    value={form.template_es}
                    onChange={(event) => setForm((prev) => ({ ...prev, template_es: event.target.value }))}
                    placeholder="Cual es {{poss_pronoun}} nombre?"
                    className="min-h-28 text-base font-semibold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-bold text-white">Template PT</Label>
                  <Textarea
                    value={form.template_pt}
                    onChange={(event) => setForm((prev) => ({ ...prev, template_pt: event.target.value }))}
                    placeholder="Qual e {{poss_pronoun}} nome?"
                    className="min-h-28 text-base font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-white/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-base font-bold text-white">swap_groups (JSON)</Label>
                  <Button
                    type="button"
                    className="h-10 bg-white text-rose-700 hover:bg-rose-50"
                    onClick={applyExample}
                  >
                    Load Example JSON
                  </Button>
                </div>
                <Textarea
                  value={form.swap_groups_json}
                  onChange={(event) => setForm((prev) => ({ ...prev, swap_groups_json: event.target.value }))}
                  className="min-h-56 font-mono text-sm text-slate-900"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-12 bg-white px-6 text-base font-black text-rose-700 hover:bg-rose-50"
                  disabled={saving || loading}
                  onClick={() => void saveMapping()}
                >
                  {saving ? "Saving..." : "Save Mapping"}
                </Button>
                <Button
                  type="button"
                  className="h-12 bg-red-700 px-6 text-base font-black text-white hover:bg-red-800"
                  disabled={deleting || !selectedExisting}
                  onClick={() => void deleteMapping()}
                >
                  <Trash2 className="mr-1 h-5 w-5" />
                  {deleting ? "Deleting..." : "Delete Mapping"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-black text-slate-900">
                  Lesson Map {activeLesson ? `(${lessonLabel(activeLesson, language)})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessonRows.length === 0 ? <p className="text-base font-semibold text-slate-700">No mappings for this lesson yet.</p> : null}
                {lessonRows.map((row) => {
                  const active = selectedExisting?.id === row.id;
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`w-full rounded-2xl border-2 p-3 text-left transition ${
                        active ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:border-rose-300"
                      }`}
                      onClick={() => {
                        setSelectedSlot(String(row.pattern_slot ?? 1) as "1" | "2");
                        setSelectedKind((row.kind as ConversationKind) ?? "question");
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-800 text-white">Pattern {row.pattern_slot}</Badge>
                        <Badge className="bg-cyan-600 text-white">{row.kind}</Badge>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900">{resolveTemplate(row, language)}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-black text-slate-900">Hint Image Preview (English)</CardTitle>
              </CardHeader>
              <CardContent>
                {hintImageUrl ? (
                  <img src={hintImageUrl} alt="English pattern hint" className="w-full rounded-2xl border-2 border-cyan-200" />
                ) : (
                  <p className="text-base font-semibold text-slate-700">
                    No English image uploaded for this lesson slot/kind yet. Upload in /admin/patterns.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {message ? <p className="text-base font-semibold text-slate-800">{message}</p> : null}
          {loading ? <p className="text-base font-semibold text-slate-700">Loading mappings...</p> : null}
        </div>
      </AdminGate>
    </AdminShell>
  );
}
