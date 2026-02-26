import { Language, Lesson, SentenceScramble, VocabularyItem } from "@/lib/types";

export function lessonTitle(lesson: Lesson, language: Language) {
  if (language === "es") return lesson.title_es;
  if (language === "pt") return lesson.title_pt;
  if (language === "sw") return lesson.title_en;
  if (language === "chk") return lesson.title_en;
  return lesson.title_en;
}

export function lessonLabel(lesson: Lesson, language: Language) {
  const title = lessonTitle(lesson, language);
  const sequence = lesson.sequence_number ?? lesson.lesson_number;
  const course = lesson.course?.trim() || `EC${lesson.level}`;
  return `${course}.${sequence} ${title}`;
}

export function lessonDescription(lesson: Lesson, language: Language) {
  if (language === "es") return lesson.description_es;
  if (language === "pt") return lesson.description_pt;
  if (language === "sw") return lesson.description_en;
  if (language === "chk") return lesson.description_en;
  return lesson.description_en;
}

export function promptText(item: VocabularyItem, language: Language) {
  if (language === "es") return item.spanish_text;
  if (language === "pt") return item.portuguese_text;
  if (language === "sw") return item.english_text;
  if (language === "chk") return item.english_text;
  return item.english_text;
}

export function sentenceHint(item: SentenceScramble, language: Language) {
  if (language === "es") return item.spanish_hint;
  if (language === "pt") return item.portuguese_hint;
  if (language === "sw") return null;
  if (language === "chk") return null;
  return null;
}
