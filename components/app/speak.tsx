"use client";

import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonLabel } from "@/lib/content";
import { resolveVocabMediaUrl } from "@/lib/media";
import { Language, VocabularyItem } from "@/lib/types";
import { CheckCircle2, ImageIcon, Loader2, Mic, MicOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type SpeakMode = "vocabulary" | "phrases";

type ConfettiPiece = {
  id: string;
  left: number;
  top: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
};

type LocalCopy = {
  setupTitle: string;
  setupSubtitle: string;
  selectLesson: string;
  selectType: string;
  start: string;
  vocabulary: string;
  phrases: string;
  noItems: string;
  unsupported: string;
  micError: string;
  listening: string;
  startListening: string;
  stopListening: string;
  next: string;
  tryAgain: string;
  success: string;
  incorrect: string;
  heardYouSay: string;
  heardNothing: string;
  prompt: string;
  sayEnglishWord: string;
  sayMissingWord: string;
  needsImageFallback: string;
  nativeLanguageHint: string;
  allDone: string;
};

const baseCopyByLanguage: Record<"en" | "es" | "pt", LocalCopy> = {
  en: {
    setupTitle: "Speak",
    setupSubtitle: "See the prompt, speak the English answer, and keep moving.",
    selectLesson: "Select lesson",
    selectType: "Choose activity",
    start: "Start",
    vocabulary: "Vocabulary",
    phrases: "Phrases",
    noItems: "No items found for this lesson and activity yet.",
    unsupported: "Speech recognition is not supported in this browser.",
    micError: "Microphone error. Check browser permission and try again.",
    listening: "Listening...",
    startListening: "Start Speaking",
    stopListening: "Stop",
    next: "Next",
    tryAgain: "Try Again",
    success: "Correct!",
    incorrect: "Not quite. Try again.",
    heardYouSay: "I heard",
    heardNothing: "I didn't hear anything.",
    prompt: "Prompt",
    sayEnglishWord: "Speak the English word.",
    sayMissingWord: "Speak the missing English word.",
    needsImageFallback: "No image available. Use this translation prompt.",
    nativeLanguageHint: "Choose your native language by clicking the button at the top.",
    allDone: "Great work. Starting a new round.",
  },
  es: {
    setupTitle: "Hablar",
    setupSubtitle: "Mira la pista, habla la respuesta en inglés y continúa.",
    selectLesson: "Selecciona lección",
    selectType: "Elige actividad",
    start: "Comenzar",
    vocabulary: "Vocabulario",
    phrases: "Frases",
    noItems: "Todavía no hay elementos para esta lección y actividad.",
    unsupported: "El reconocimiento de voz no está disponible en este navegador.",
    micError: "Error del micrófono. Revisa permisos e inténtalo de nuevo.",
    listening: "Escuchando...",
    startListening: "Comenzar a hablar",
    stopListening: "Detener",
    next: "Siguiente",
    tryAgain: "Intentar de nuevo",
    success: "Correcto.",
    incorrect: "Casi. Inténtalo otra vez.",
    heardYouSay: "Escuché",
    heardNothing: "No escuché nada.",
    prompt: "Pista",
    sayEnglishWord: "Di la palabra en inglés.",
    sayMissingWord: "Di la palabra faltante en inglés.",
    needsImageFallback: "No hay imagen. Usa esta traducción como pista.",
    nativeLanguageHint: "",
    allDone: "Buen trabajo. Iniciando una nueva ronda.",
  },
  pt: {
    setupTitle: "Falar",
    setupSubtitle: "Veja a pista, fale a resposta em inglês e continue.",
    selectLesson: "Selecionar lição",
    selectType: "Escolher atividade",
    start: "Começar",
    vocabulary: "Vocabulário",
    phrases: "Frases",
    noItems: "Ainda não há itens para esta lição e atividade.",
    unsupported: "Reconhecimento de voz não está disponível neste navegador.",
    micError: "Erro de microfone. Verifique permissões e tente novamente.",
    listening: "Ouvindo...",
    startListening: "Começar a falar",
    stopListening: "Parar",
    next: "Próximo",
    tryAgain: "Tentar de novo",
    success: "Correto.",
    incorrect: "Quase. Tente novamente.",
    heardYouSay: "Ouvi",
    heardNothing: "Não ouvi nada.",
    prompt: "Pista",
    sayEnglishWord: "Fale a palavra em inglês.",
    sayMissingWord: "Fale a palavra em inglês que falta.",
    needsImageFallback: "Não há imagem. Use esta tradução como pista.",
    nativeLanguageHint: "",
    allDone: "Ótimo trabalho. Iniciando uma nova rodada.",
  },
};

const copyByLanguage: Record<Language, LocalCopy> = {
  ...baseCopyByLanguage,
  sw: {
    setupTitle: "Ongea",
    setupSubtitle: "Ona dokezo, sema jibu la Kiingereza, na endelea.",
    selectLesson: "Chagua somo",
    selectType: "Chagua shughuli",
    start: "Anza",
    vocabulary: "Msamiati",
    phrases: "Vifungu",
    noItems: "Hakuna vipengele kwa somo na shughuli hii bado.",
    unsupported: "Utambuzi wa sauti haupatikani kwenye kivinjari hiki.",
    micError: "Hitilafu ya kipaza sauti. Angalia ruhusa na ujaribu tena.",
    listening: "Inasikiliza...",
    startListening: "Anza kuongea",
    stopListening: "Acha",
    next: "Inayofuata",
    tryAgain: "Jaribu tena",
    success: "Sahihi!",
    incorrect: "Bado siyo. Jaribu tena.",
    heardYouSay: "Nimesikia",
    heardNothing: "Sijasikia chochote.",
    prompt: "Dokezo",
    sayEnglishWord: "Sema neno la Kiingereza.",
    sayMissingWord: "Sema neno la Kiingereza lililokosekana.",
    needsImageFallback: "Hakuna picha. Tumia dokezo hili la tafsiri.",
    nativeLanguageHint: "Chagua lugha yako ya asili kwa kubofya kitufe juu.",
    allDone: "Kazi nzuri. Raundi mpya inaanza.",
  },
  chk: {
    setupTitle: "Speak",
    setupSubtitle: "See the prompt, speak the English answer, and keep moving.",
    selectLesson: "Select lesson",
    selectType: "Choose activity",
    start: "Start",
    vocabulary: "Vocabulary",
    phrases: "Phrases",
    noItems: "No items found for this lesson and activity yet.",
    unsupported: "Speech recognition is not supported in this browser.",
    micError: "Microphone error. Check browser permission and try again.",
    listening: "Listening...",
    startListening: "Start Speaking",
    stopListening: "Stop",
    next: "Next",
    tryAgain: "Try Again",
    success: "Correct!",
    incorrect: "Not quite. Try again.",
    heardYouSay: "I heard",
    heardNothing: "I didn't hear anything.",
    prompt: "Prompt",
    sayEnglishWord: "Speak the English word.",
    sayMissingWord: "Speak the missing English word.",
    needsImageFallback: "No image available. Use this translation prompt.",
    nativeLanguageHint: "Choose your native language by clicking the button at the top.",
    allDone: "Great work. Starting a new round.",
  },
};

const PHRASE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "she",
  "the",
  "their",
  "they",
  "to",
  "we",
  "with",
  "you",
  "your",
]);

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function createConfettiPieces(count = 90): ConfettiPiece[] {
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
  return Array.from({ length: count }, (_, i) => ({
    id: `confetti-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    left: Math.random() * 100,
    top: -5 - Math.random() * 25,
    delay: Math.random() * 0.55,
    duration: 1.5 + Math.random() * 1.2,
    width: 6 + Math.random() * 7,
    height: 8 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function playSuccessTrumpet() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.15;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, index) => {
    const start = now + index * 0.12;
    const stop = start + 0.18;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);
    noteGain.gain.setValueAtTime(0.001, start);
    noteGain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, stop);

    osc.connect(noteGain);
    noteGain.connect(master);
    osc.start(start);
    osc.stop(stop);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, 1200);
}

function playErrorDrum() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(58, now + 0.18);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(380, now);
  filter.Q.setValueAtTime(1.2, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(now);
  osc.stop(now + 0.24);

  window.setTimeout(() => {
    void ctx.close();
  }, 500);
}

function chooseTranslation(item: VocabularyItem, language: Language) {
  if (language === "es") return item.spanish_text;
  if (language === "pt") return item.portuguese_text;
  if (language === "sw") return item.english_text;
  if (language === "chk") return item.english_text;
  return item.spanish_text || item.portuguese_text;
}

const HOMOPHONE_GROUPS: string[][] = [
  ["no", "know"],
  ["to", "too", "two"],
  ["for", "four"],
  ["be", "bee"],
  ["see", "sea"],
  ["right", "write"],
  ["one", "won"],
  ["here", "hear"],
  ["by", "buy", "bye"],
];

function areEquivalentByHomophone(expected: string, spoken: string) {
  return HOMOPHONE_GROUPS.some((group) => group.includes(expected as any) && group.includes(spoken as any));
}

function buildPhrasePrompt(englishText: string) {
  const matches = Array.from(englishText.matchAll(/[A-Za-z']+/g));
  if (matches.length === 0) {
    return {
      promptSentence: englishText,
      missingWord: "",
    };
  }

  const weighted = matches.filter((match) => {
    const word = normalizeText(match[0]);
    return word.length > 2 && !PHRASE_STOPWORDS.has(word);
  });

  const pool = weighted.length > 0 ? weighted : matches;
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? matches[0];
  const missingWord = normalizeText(chosen[0]);
  const start = chosen.index ?? 0;
  const end = start + chosen[0].length;
  const promptSentence = `${englishText.slice(0, start)}____${englishText.slice(end)}`;

  return {
    promptSentence,
    missingWord,
  };
}

function matchesExpected(transcript: string, expectedWord: string) {
  const expected = normalizeText(expectedWord);
  if (!expected) return false;

  const spokenTokens = tokenize(transcript);
  if (spokenTokens.length === 0) return false;
  if (spokenTokens.includes(expected)) return true;
  return spokenTokens.some((token) => areEquivalentByHomophone(expected, token));
}

export function Speak() {
  const { language } = useLanguage();
  const { lessons, vocab, loading } = useCurriculum();
  const { user, profile } = useAuth();
  const { defaultLessonId } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse: profile?.selected_course ?? null,
  });

  const copy = copyByLanguage[language];
  const selectedCourse = profile?.selected_course ?? null;

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [mode, setMode] = useState<SpeakMode>("vocabulary");
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<VocabularyItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phrasePrompt, setPhrasePrompt] = useState<{ promptSentence: string; missingWord: string } | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [heardText, setHeardText] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  const recognitionRef = useRef<any>(null);
  const nextTimeoutRef = useRef<number | null>(null);

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );

  useEffect(() => {
    if (!selectedLesson && (defaultLessonId || visibleLessons[0]?.id)) {
      setSelectedLesson(defaultLessonId || visibleLessons[0]?.id || "");
    }
  }, [defaultLessonId, selectedLesson, visibleLessons]);

  const lessonItems = useMemo(() => {
    if (!selectedLesson) return [];

    const base = vocab.filter((item) => item.lesson_id === selectedLesson);
    if (mode === "vocabulary") {
      return base.filter((item) => {
        if ((item.item_type ?? "").toLowerCase() !== "word") return false;
        const englishTokens = tokenize(item.english_text);
        return englishTokens.length === 1;
      });
    }

    return base.filter((item) => {
      if ((item.item_type ?? "").toLowerCase() !== "phrase") return false;
      return tokenize(item.english_text).length >= 2;
    });
  }, [mode, selectedLesson, vocab]);

  const currentItem = queue[queueIndex] ?? null;
  const currentExpectedWord = mode === "phrases" ? phrasePrompt?.missingWord ?? "" : normalizeText(currentItem?.english_text ?? "");
  const currentImage = resolveVocabMediaUrl(currentItem?.image_url ?? null);
  const translation = currentItem ? chooseTranslation(currentItem, language) : "";

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as typeof window & { SpeechRecognition?: any }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (nextTimeoutRef.current) {
        window.clearTimeout(nextTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setImageFailed(false);
    if (mode !== "phrases" || !currentItem) {
      setPhrasePrompt(null);
      return;
    }

    setPhrasePrompt(buildPhrasePrompt(currentItem.english_text));
  }, [currentItem?.id, mode]);

  function startRound() {
    if (lessonItems.length === 0) {
      setStatusText(copy.noItems);
      setRunning(false);
      return;
    }

    setQueue(shuffle(lessonItems));
    setQueueIndex(0);
    setFeedback("idle");
    setStatusText("");
    setHeardText("");
    setRunning(true);
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }

  function nextPrompt() {
    if (nextTimeoutRef.current) {
      window.clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }

    setFeedback("idle");
    setHeardText("");

    if (queue.length === 0) {
      startRound();
      return;
    }

    if (queueIndex >= queue.length - 1) {
      setStatusText(copy.allDone);
      setQueue(shuffle(queue));
      setQueueIndex(0);
      return;
    }

    setQueueIndex((prev) => prev + 1);
  }

  function onCorrect() {
    setFeedback("correct");
    setStatusText(copy.success);
    playSuccessTrumpet();
    setConfettiPieces(createConfettiPieces());
    setShowConfetti(true);

    window.setTimeout(() => {
      setShowConfetti(false);
      setConfettiPieces([]);
    }, 1200);

    nextTimeoutRef.current = window.setTimeout(() => {
      nextPrompt();
    }, 900);
  }

  function onIncorrect() {
    setFeedback("incorrect");
    setStatusText(copy.incorrect);
    playErrorDrum();
  }

  function startListening() {
    if (!speechSupported || !currentItem) return;
    const SpeechRecognitionCtor =
      (window as typeof window & { SpeechRecognition?: any }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback("idle");
      setStatusText(copy.listening);
      setHeardText("");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatusText(copy.micError);
      setHeardText("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results ?? [])
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setHeardText(transcript);

      if (matchesExpected(transcript, currentExpectedWord)) {
        onCorrect();
      } else {
        onIncorrect();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <div className="space-y-4">
      {showConfetti ? (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute rounded-sm confetti-piece"
              style={{
                left: `${piece.left}%`,
                top: `${piece.top}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      ) : null}

      <Card className="border-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-xl shadow-sky-500/30">
        <CardHeader>
          <CardTitle className="text-3xl font-black">{copy.setupTitle}</CardTitle>
          <p className="text-lg text-cyan-50">{copy.setupSubtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-base font-bold text-white">{copy.selectLesson}</p>
              <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                <SelectTrigger className="h-12 border-0 bg-white text-base font-bold text-slate-900">
                  <SelectValue placeholder={copy.selectLesson} />
                </SelectTrigger>
                <SelectContent>
                  {visibleLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lessonLabel(lesson, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-white">{copy.selectType}</p>
              <Select value={mode} onValueChange={(value) => setMode(value as SpeakMode)}>
                <SelectTrigger className="h-12 border-0 bg-white text-base font-bold text-slate-900">
                  <SelectValue placeholder={copy.selectType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vocabulary">{copy.vocabulary}</SelectItem>
                  <SelectItem value="phrases">{copy.phrases}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={startRound}
              disabled={loading || !selectedLesson || lessonItems.length === 0}
              className="h-12 rounded-xl bg-white px-6 text-base font-black text-sky-700 hover:bg-cyan-100"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : copy.start}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={startRound}
              disabled={loading || !selectedLesson || lessonItems.length === 0}
              className="h-12 rounded-xl bg-cyan-100 px-5 text-base font-black text-sky-900 hover:bg-cyan-200"
            >
              <RefreshCw className="h-5 w-5" />
              {copy.next}
            </Button>
          </div>

          {lessonItems.length === 0 && selectedLesson ? (
            <div className="rounded-xl bg-white/20 p-3 text-base font-semibold text-white">{copy.noItems}</div>
          ) : null}
        </CardContent>
      </Card>

      {running && currentItem ? (
        <Card className="border-0 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-slate-900">{copy.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "vocabulary" ? (
              <div className="space-y-3">
                {!imageFailed && currentImage ? (
                  <img
                    src={currentImage}
                    alt={copy.prompt}
                    className="h-64 w-full rounded-2xl bg-slate-100 object-contain"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 text-white shadow-lg">
                    <p className="text-sm font-bold uppercase tracking-wide text-orange-100">{copy.needsImageFallback}</p>
                    <p className="mt-3 text-4xl font-black leading-tight">{translation || <ImageIcon className="h-10 w-10" />}</p>
                    {language === "en" ? <p className="mt-2 text-base font-bold text-orange-50">{copy.nativeLanguageHint}</p> : null}
                  </div>
                )}
                <p className="text-xl font-bold text-slate-900">{copy.sayEnglishWord}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-lg">
                  <p className="text-4xl font-black leading-tight">{phrasePrompt?.promptSentence ?? currentItem.english_text}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{copy.sayMissingWord}</p>
              </div>
            )}

            {!speechSupported ? (
              <div className="flex items-center gap-2 rounded-xl bg-rose-100 p-3 text-base font-semibold text-rose-700">
                <TriangleAlert className="h-5 w-5" />
                {copy.unsupported}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={!speechSupported}
                className="h-12 rounded-xl bg-sky-600 px-6 text-base font-black text-white hover:bg-sky-700"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isListening ? copy.stopListening : copy.startListening}
              </Button>
              <Button
                type="button"
                onClick={nextPrompt}
                className="h-12 rounded-xl bg-emerald-600 px-6 text-base font-black text-white hover:bg-emerald-700"
              >
                <RefreshCw className="h-5 w-5" />
                {copy.next}
              </Button>
            </div>

            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-base font-bold ${
                feedback === "correct"
                  ? "bg-emerald-100 text-emerald-800"
                  : feedback === "incorrect"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {feedback === "correct" ? <CheckCircle2 className="h-5 w-5" /> : null}
              {feedback === "incorrect" ? <TriangleAlert className="h-5 w-5" /> : null}
              {isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {!feedback || feedback === "idle" ? <Mic className="h-5 w-5" /> : null}
              <span>{statusText || (isListening ? copy.listening : mode === "phrases" ? copy.sayMissingWord : copy.sayEnglishWord)}</span>
            </div>

            <div className="rounded-xl bg-sky-50 p-3 text-base font-semibold text-sky-900">
              {copy.heardYouSay}:{" "}
              <span className="font-black">{heardText || copy.heardNothing}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <style jsx>{`
        .confetti-piece {
          animation: confetti-fall 1.9s ease-in forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(125vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
