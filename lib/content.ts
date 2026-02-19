import { Language, Lesson, SentenceScramble, VocabularyItem } from "@/lib/types";

export function lessonTitle(lesson: Lesson, language: Language) {
  if (language === "es") return lesson.title_es;
  if (language === "pt") return lesson.title_pt;
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
  return lesson.description_en;
}

export function promptText(item: VocabularyItem, language: Language) {
  if (language === "es") return item.spanish_text;
  if (language === "pt") return item.portuguese_text;
  return item.english_text;
}

export function sentenceHint(item: SentenceScramble, language: Language) {
  if (language === "es") return item.spanish_hint;
  if (language === "pt") return item.portuguese_hint;
  return null;
}
