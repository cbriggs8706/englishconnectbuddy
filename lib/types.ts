export type Language = "en" | "es" | "pt";
export type FlashcardMode =
  | "image-audio"
  | "image-text"
  | "audio-text"
  | "text-translation";

export type Lesson = {
  id: string;
  level: number;
  unit: number;
  lesson_number: number;
  sequence_number: number;
  sort_order: number;
  title_en: string;
  title_es: string;
  title_pt: string;
  description_en: string | null;
  description_es: string | null;
  description_pt: string | null;
};

export type VocabularyItem = {
  id: string;
  lesson_id: string;
  source_row_id: number | null;
  item_type: string;
  english_text: string;
  english_sentence: string | null;
  spanish_text: string;
  portuguese_text: string;
  spanish_transliteration: string | null;
  portuguese_transliteration: string | null;
  ipa: string | null;
  part_of_speech: string | null;
  definition: string | null;
  image_url: string | null;
  audio_url: string | null;
  difficulty_level: number;
};

export type SentenceScramble = {
  id: string;
  lesson_id: string;
  english_sentence: string;
  spanish_hint: string | null;
  portuguese_hint: string | null;
};

export type UserProgress = {
  id: string;
  user_id: string;
  vocab_id: string;
  confidence: number;
  mastered: boolean;
  last_seen_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  real_name: string | null;
  nickname: string | null;
  native_language: Language | null;
  is_admin: boolean;
};

export type FlashcardProgress = {
  id: string;
  user_id: string;
  vocab_id: string;
  mode: FlashcardMode;
  streak_count: number;
  review_count: number;
  mastered: boolean;
  due_at: string;
  last_reviewed_at: string | null;
};

export type QuizSessionStatus = "waiting" | "active" | "finished";

export type QuizSession = {
  id: string;
  host_user_id: string;
  lesson_id: string;
  lesson_ids: string[];
  join_code: string;
  status: QuizSessionStatus;
  question_duration_seconds: number;
  current_question_index: number;
  question_started_at: string | null;
  question_ends_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  session_id: string;
  question_order: number;
  prompt_vocab_id: string;
  correct_vocab_id: string;
  option_vocab_ids: string[];
  prompt_image_url: string | null;
  created_at: string;
};

export type QuizParticipant = {
  id: string;
  session_id: string;
  user_id: string | null;
  guest_token: string | null;
  nickname: string;
  real_name: string | null;
  is_guest: boolean;
  is_removed: boolean;
  score: number;
  joined_at: string;
  last_seen_at: string;
};

export type QuizAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  selected_vocab_id: string;
  is_correct: boolean;
  points: number;
  answered_at: string;
};

export type VolunteerSlot = {
  id: string;
  starts_at: string;
  seats_available: number;
  details: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VolunteerSignup = {
  id: string;
  slot_id: string;
  volunteer_name: string;
  created_at: string;
};
