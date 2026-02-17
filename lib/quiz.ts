import { Language, Profile } from "@/lib/types";

const GUEST_TOKEN_KEY = "ecb-quiz-guest-token";

export function getOrCreateGuestToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = localStorage.getItem(GUEST_TOKEN_KEY);
  if (existing) return existing;

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(GUEST_TOKEN_KEY, token);
  return token;
}

export function quizDisplayName(profile: Profile | null) {
  if (!profile) return null;
  const nickname = profile.nickname?.trim();
  if (nickname) return nickname;

  const realName = profile.real_name?.trim();
  if (!realName) return null;

  return realName.split(/\s+/)[0] ?? realName;
}

const bannedTerms = ["badword", "curseword", "offensive"];

export function nicknameAllowed(value: string) {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return false;
  return !bannedTerms.some((term) => normalized.includes(term));
}

export function quizWord(item: {
  english_text: string;
  spanish_text: string;
  portuguese_text: string;
}, language: Language) {
  if (language === "es") return item.spanish_text;
  if (language === "pt") return item.portuguese_text;
  return item.english_text;
}
