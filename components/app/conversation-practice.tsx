"use client";

import { useCourseProgress } from "@/components/app/use-course-progress";
import { useCurriculum } from "@/components/app/use-curriculum";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
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
import { Language } from "@/lib/types";
import { Mic, MicOff, MessageCircleQuestion, RefreshCw, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  title: string;
  subtitle: string;
  pickLesson: string;
  askQuestion: string;
  startSpeaking: string;
  stopListening: string;
  nextPrompt: string;
  promptLabel: string;
  youSaid: string;
  noPhrases: string;
  unsupported: string;
  micError: string;
  tries: string;
  accepted: string;
  accuracy: string;
  speakHint: string;
  responseHint: string;
  keepGoing: string[];
  corrections: {
    strong: string;
    close: string;
    retry: string;
    missingWords: string;
    extraWords: string;
    wordOrder: string;
    pronunciation: string;
    targetPhrase: string;
    grammarLabel: string;
    dontBeforeVerb: string;
    doQuestionOrder: string;
    likeToVerb: string;
    negativeNeedsAux: string;
  };
};

const baseCopyByLanguage: Record<"en" | "es" | "pt", LocalCopy> = {
  en: {
    title: "Conversation",
    subtitle: "Listen to the question, then speak your response clearly.",
    pickLesson: "Select lesson",
    askQuestion: "Ask Question",
    startSpeaking: "Start Speaking",
    stopListening: "Stop Listening",
    nextPrompt: "Next Prompt",
    promptLabel: "Question phrase",
    youSaid: "You said",
    noPhrases: "No question phrases found for this lesson yet.",
    unsupported: "Speech recognition is not available in this browser.",
    micError: "Microphone could not capture speech. Check browser microphone permission.",
    tries: "Tries",
    accepted: "Accepted",
    accuracy: "Accuracy",
    speakHint: "Tap Ask Question to hear it. Then tap Start Speaking and respond in English.",
    responseHint: "Tip: focus on English grammar and word order.",
    keepGoing: ["Great pronunciation!", "Excellent clarity!", "Nice job speaking confidently!", "Strong response!"],
    corrections: {
      strong: "Excellent. That response was clear and accurate.",
      close: "Close. Try again and stress each key word.",
      retry: "Keep going. Repeat the full phrase with steady pacing.",
      missingWords: "Try including",
      extraWords: "Try removing",
      wordOrder: "Word order tip",
      pronunciation: "Pronunciation tip: slow down and stress",
      targetPhrase: "Target phrase",
      grammarLabel: "Grammar tip",
      dontBeforeVerb: "In English, use \"don't\" (or \"doesn't\") before a base verb, not \"no\".",
      doQuestionOrder: "In English questions, use auxiliary order like \"Why do you...\".",
      likeToVerb: "After \"like\", use \"to + verb\" or \"verb + ing\" (for example, \"like to sing\").",
      negativeNeedsAux: "Use an auxiliary for negatives (\"don't/doesn't\") instead of direct \"no\".",
    },
  },
  es: {
    title: "Conversación",
    subtitle: "Escucha la pregunta y luego responde hablando claramente.",
    pickLesson: "Selecciona lección",
    askQuestion: "Escuchar pregunta",
    startSpeaking: "Comenzar a hablar",
    stopListening: "Detener",
    nextPrompt: "Siguiente frase",
    promptLabel: "Frase de pregunta",
    youSaid: "Dijiste",
    noPhrases: "Todavía no hay frases de pregunta para esta lección.",
    unsupported: "El reconocimiento de voz no está disponible en este navegador.",
    micError: "No se pudo capturar tu voz. Revisa permisos del micrófono.",
    tries: "Intentos",
    accepted: "Aceptadas",
    accuracy: "Precisión",
    speakHint: "Pulsa Escuchar pregunta, luego Comenzar a hablar y responde en inglés.",
    responseHint: "Consejo: enfócate en gramática y orden natural en inglés.",
    keepGoing: ["Muy buena pronunciación.", "Excelente claridad.", "Buen trabajo, hablas con confianza.", "Respuesta fuerte."],
    corrections: {
      strong: "Excelente. Tu respuesta fue clara y precisa.",
      close: "Casi. Intenta otra vez y enfatiza cada palabra clave.",
      retry: "Sigue. Repite toda la frase con ritmo constante.",
      missingWords: "Intenta incluir",
      extraWords: "Intenta quitar",
      wordOrder: "Consejo de orden",
      pronunciation: "Consejo de pronunciación: habla más despacio y enfatiza",
      targetPhrase: "Frase objetivo",
      grammarLabel: "Consejo de gramática",
      dontBeforeVerb: "En inglés usamos \"don't\" (o \"doesn't\") antes de un verbo base, no \"no\".",
      doQuestionOrder: "En preguntas en inglés, usa orden auxiliar como \"Why do you...\".",
      likeToVerb: "Después de \"like\", usa \"to + verbo\" o \"verbo + ing\" (por ejemplo, \"like to sing\").",
      negativeNeedsAux: "Usa auxiliar en negativas (\"don't/doesn't\") en lugar de \"no\" directo.",
    },
  },
  pt: {
    title: "Conversa",
    subtitle: "Ouça a pergunta e depois responda falando com clareza.",
    pickLesson: "Selecionar lição",
    askQuestion: "Ouvir pergunta",
    startSpeaking: "Começar a falar",
    stopListening: "Parar",
    nextPrompt: "Próxima frase",
    promptLabel: "Frase de pergunta",
    youSaid: "Você disse",
    noPhrases: "Ainda não há frases de pergunta para esta lição.",
    unsupported: "Reconhecimento de fala não está disponível neste navegador.",
    micError: "Não foi possível capturar sua fala. Verifique a permissão do microfone.",
    tries: "Tentativas",
    accepted: "Aceitas",
    accuracy: "Precisão",
    speakHint: "Toque em Ouvir pergunta, depois em Começar a falar e responda em inglês.",
    responseHint: "Dica: foque em gramática e ordem natural em inglês.",
    keepGoing: ["Ótima pronúncia.", "Excelente clareza.", "Boa resposta com confiança.", "Resposta forte."],
    corrections: {
      strong: "Excelente. Sua resposta foi clara e precisa.",
      close: "Quase lá. Tente de novo destacando cada palavra-chave.",
      retry: "Continue. Repita a frase completa com ritmo estável.",
      missingWords: "Tente incluir",
      extraWords: "Tente remover",
      wordOrder: "Dica de ordem",
      pronunciation: "Dica de pronúncia: fale mais devagar e enfatize",
      targetPhrase: "Frase alvo",
      grammarLabel: "Dica de gramática",
      dontBeforeVerb: "Em inglês usamos \"don't\" (ou \"doesn't\") antes de verbo base, não \"no\".",
      doQuestionOrder: "Em perguntas em inglês, use ordem auxiliar como \"Why do you...\".",
      likeToVerb: "Depois de \"like\", use \"to + verbo\" ou \"verbo + ing\" (ex.: \"like to sing\").",
      negativeNeedsAux: "Use auxiliar nas negativas (\"don't/doesn't\") em vez de \"no\" direto.",
    },
  },
};

const copyByLanguage: Record<Language, LocalCopy> = {
  ...baseCopyByLanguage,
  sw: {
    title: "Mazungumzo",
    subtitle: "Sikiliza swali, kisha sema jibu lako wazi.",
    pickLesson: "Chagua somo",
    askQuestion: "Uliza swali",
    startSpeaking: "Anza kuongea",
    stopListening: "Acha kusikiliza",
    nextPrompt: "Kidokezo kinachofuata",
    promptLabel: "Kifungu cha swali",
    youSaid: "Umesema",
    noPhrases: "Hakuna vifungu vya swali kwa somo hili bado.",
    unsupported: "Utambuzi wa sauti haupatikani kwenye kivinjari hiki.",
    micError: "Kipaza sauti hakikuweza kunasa sauti. Angalia ruhusa ya kipaza sauti.",
    tries: "Majaribio",
    accepted: "Yaliyokubaliwa",
    accuracy: "Usahihi",
    speakHint: "Gusa Uliza swali kusikia. Kisha gusa Anza kuongea na ujibu kwa Kiingereza.",
    responseHint: "Dokezo: zingatia sarufi na mpangilio wa maneno ya Kiingereza.",
    keepGoing: ["Matamshi mazuri!", "Uwazi bora!", "Kazi nzuri kuongea kwa ujasiri!", "Jibu zuri!"],
    corrections: baseCopyByLanguage.en.corrections,
  },
  chk: {
    title: "Conversation",
    subtitle: "Listen to the question, then speak your response clearly.",
    pickLesson: "Select lesson",
    askQuestion: "Ask Question",
    startSpeaking: "Start Speaking",
    stopListening: "Stop Listening",
    nextPrompt: "Next Prompt",
    promptLabel: "Question phrase",
    youSaid: "You said",
    noPhrases: "No question phrases found for this lesson yet.",
    unsupported: "Speech recognition is not available in this browser.",
    micError: "Microphone could not capture speech. Check browser microphone permission.",
    tries: "Tries",
    accepted: "Accepted",
    accuracy: "Accuracy",
    speakHint: "Tap Ask Question to hear it. Then tap Start Speaking and respond in English.",
    responseHint: "Tip: focus on English grammar and word order.",
    keepGoing: ["Great pronunciation!", "Excellent clarity!", "Nice job speaking confidently!", "Strong response!"],
    corrections: baseCopyByLanguage.en.corrections,
  },
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, row) =>
    Array.from({ length: a.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      const cost = a[col - 1] === b[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
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

function randomEncouragement(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)] ?? messages[0] ?? "";
}

function buildGrammarHints(expected: string, actual: string, copy: LocalCopy["corrections"]) {
  const hints: string[] = [];
  const auxBaseVerbPattern =
    /\b(?:like|want|need|know|have|go|do|sing|eat|play|speak|study|work|live|read|write|teach|learn)\b/;

  if (/\bno\s+[a-z]+\b/.test(actual) && /\bno\s+(?:\w+)\b/.test(actual) && auxBaseVerbPattern.test(actual)) {
    hints.push(copy.dontBeforeVerb);
  }

  const expectedNeedsDoOrder =
    /^(why|what|where|when|how)\s+do\s+you\b/.test(expected) ||
    /^(why|what|where|when|how)\s+does\s+he\b/.test(expected) ||
    /^(why|what|where|when|how)\s+does\s+she\b/.test(expected);
  if (expectedNeedsDoOrder && !/\b(?:do|does)\s+(?:you|he|she)\b/.test(actual)) {
    hints.push(copy.doQuestionOrder);
  }

  if (/\blike\s+[a-z]+\b/.test(actual) && !/\blike\s+to\s+[a-z]+\b/.test(actual) && !/\blike\s+[a-z]+ing\b/.test(actual)) {
    hints.push(copy.likeToVerb);
  }

  if (/\bi\s+no\s+[a-z]+\b/.test(actual) || /\byou\s+no\s+[a-z]+\b/.test(actual)) {
    hints.push(copy.negativeNeedsAux);
  }

  return Array.from(new Set(hints)).slice(0, 2);
}

function pickBestEnglishVoice(voices: SpeechSynthesisVoice[]) {
  if (voices.length === 0) return null;
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (english.length === 0) return voices[0] ?? null;

  const preferredNames = [
    "Google US English",
    "Samantha",
    "Microsoft Aria",
    "Microsoft Jenny",
    "Microsoft Guy",
    "Aaron",
    "Daniel",
    "Karen",
    "Moira",
    "Zira",
  ];

  const preferred = english.find((voice) =>
    preferredNames.some((name) => voice.name.toLowerCase().includes(name.toLowerCase()))
  );
  if (preferred) return preferred;

  const premium = english.find((voice) => /(neural|natural|enhanced|premium)/i.test(voice.name));
  if (premium) return premium;

  return english.find((voice) => voice.lang.toLowerCase() === "en-us") ?? english[0] ?? null;
}

export function ConversationPractice() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const { lessons, vocab } = useCurriculum();
  const { user, profile } = useAuth();
  const selectedCourse = profile?.selected_course ?? null;
  const { defaultLessonId } = useCourseProgress({
    lessons,
    vocab,
    user,
    selectedCourse,
  });

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [spokenText, setSpokenText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechConfidence, setSpeechConfidence] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const recognitionRef = useRef<any>(null);
  const phraseAudioRef = useRef<HTMLAudioElement | null>(null);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !selectedCourse || lesson.course === selectedCourse),
    [lessons, selectedCourse]
  );

  const activeLesson = selectedLesson || defaultLessonId || visibleLessons[0]?.id || "";

  useEffect(() => {
    if (!selectedLesson && defaultLessonId) {
      setSelectedLesson(defaultLessonId);
    }
  }, [defaultLessonId, selectedLesson]);

  const lessonPhrases = useMemo(() => {
    if (!activeLesson) return [];
    return vocab.filter((item) => {
      const type = (item.item_type ?? "").trim().toLowerCase();
      return item.lesson_id === activeLesson && type === "phrase" && item.english_text.includes("?");
    });
  }, [activeLesson, vocab]);

  const currentPhrase = lessonPhrases[phraseIndex] ?? null;

  function resetResult() {
    setSpokenText("");
    setFeedback("");
    setAccuracy(null);
    setMicError("");
    setSpeechConfidence(null);
    setShowConfetti(false);
    setConfettiPieces([]);
  }

  useEffect(() => {
    setPhraseIndex(0);
    resetResult();
  }, [activeLesson]);

  useEffect(() => {
    if (lessonPhrases.length === 0) return;
    if (phraseIndex > lessonPhrases.length - 1) {
      setPhraseIndex(0);
    }
  }, [lessonPhrases, phraseIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const RecognitionClass =
      (window as typeof window & { SpeechRecognition?: any }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!RecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new RecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setMicError("");
    };

    recognition.onerror = () => {
      setListening(false);
      setMicError(copy.micError);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let latestConfidence: number | null = null;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alternative = result[0];
        finalTranscript += alternative?.transcript ?? "";
        if (typeof alternative?.confidence === "number" && !Number.isNaN(alternative.confidence)) {
          latestConfidence = alternative.confidence;
        }
      }

      const cleaned = finalTranscript.trim();
      if (!cleaned) return;
      setSpeechConfidence(latestConfidence);
      setSpokenText(cleaned);
    };

    recognitionRef.current = recognition;
  }, [copy.micError]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setPreferredVoice(pickBestEnglishVoice(voices));
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
      phraseAudioRef.current?.pause();
      phraseAudioRef.current = null;
    };
  }, []);

  function scoreResponse(rawSpoken: string) {
    if (!currentPhrase) return;
    const expected = normalizeText(currentPhrase.english_text);
    const actual = normalizeText(rawSpoken);
    if (!actual) return;

    const distance = levenshteinDistance(expected, actual);
    const maxLength = Math.max(expected.length, actual.length, 1);
    const score = Math.max(0, Math.round((1 - distance / maxLength) * 100));
    const expectedTokens = tokenize(expected);
    const actualTokenList = tokenize(actual);
    const actualTokens = new Set(actualTokenList);
    const expectedTokenSet = new Set(expectedTokens);
    const missingWords = expectedTokens.filter((word) => !actualTokens.has(word));
    const extraWords = actualTokenList.filter((word, index, list) => !expectedTokenSet.has(word) && list.indexOf(word) === index);
    const sameWordsDifferentOrder =
      missingWords.length === 0 &&
      extraWords.length === 0 &&
      expectedTokens.join(" ") !== actualTokenList.join(" ");
    const pronunciationWords = expectedTokens.filter((word, index) => {
      const heard = actualTokenList[index];
      if (!heard) return false;
      const wordDistance = levenshteinDistance(word, heard);
      const ratio = wordDistance / Math.max(word.length, heard.length, 1);
      return ratio > 0.45;
    });
    const grammarHints = buildGrammarHints(expected, actual, copy.corrections);

    setAttempts((value) => value + 1);
    setAccuracy(score);

    const strictAccept =
      score >= 86 &&
      missingWords.length === 0 &&
      extraWords.length === 0 &&
      !sameWordsDifferentOrder;

    if (strictAccept) {
      setAccepted((value) => value + 1);
      setFeedback(`${copy.corrections.strong} ${randomEncouragement(copy.keepGoing)}`);
      playSuccessTrumpet();
      setConfettiPieces(createConfettiPieces());
      setShowConfetti(true);
      window.setTimeout(() => {
        setShowConfetti(false);
        setConfettiPieces([]);
      }, 2200);
      return;
    }

    if (score >= 70) {
      const hints: string[] = [copy.corrections.close];
      if (grammarHints.length > 0) {
        hints.push(`${copy.corrections.grammarLabel}: ${grammarHints.join(" ")}`);
      }
      if (sameWordsDifferentOrder) {
        hints.push(`${copy.corrections.wordOrder}: "${currentPhrase.english_text}"`);
      }
      if (missingWords.length > 0) {
        hints.push(`${copy.corrections.missingWords}: ${missingWords.slice(0, 3).join(", ")}.`);
      }
      if (extraWords.length > 0) {
        hints.push(`${copy.corrections.extraWords}: ${extraWords.slice(0, 3).join(", ")}.`);
      }
      if (((speechConfidence !== null && speechConfidence < 0.8) || pronunciationWords.length > 0) && grammarHints.length === 0) {
        const focus = pronunciationWords.slice(0, 3).join(", ");
        hints.push(focus ? `${copy.corrections.pronunciation} ${focus}.` : `${copy.corrections.pronunciation}.`);
      }
      setFeedback(hints.join(" "));
      return;
    }

    const retryHints: string[] = [copy.corrections.retry, `${copy.corrections.targetPhrase}: "${currentPhrase.english_text}"`];
    if (grammarHints.length > 0) {
      retryHints.push(`${copy.corrections.grammarLabel}: ${grammarHints.join(" ")}`);
    } else if ((speechConfidence !== null && speechConfidence < 0.8) || pronunciationWords.length > 0) {
      const focus = pronunciationWords.slice(0, 3).join(", ");
      retryHints.push(focus ? `${copy.corrections.pronunciation} ${focus}.` : `${copy.corrections.pronunciation}.`);
    }
    setFeedback(retryHints.join(" "));
  }

  useEffect(() => {
    if (!spokenText) return;
    scoreResponse(spokenText);
  }, [spokenText]);

  function speakQuestion() {
    if (!currentPhrase || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    phraseAudioRef.current?.pause();
    phraseAudioRef.current = null;

    const phraseAudioSrc = resolveVocabMediaUrl(currentPhrase.audio_url);
    if (phraseAudioSrc) {
      const audio = new Audio(phraseAudioSrc);
      audio.playbackRate = 1;
      audio.preservesPitch = true;
      phraseAudioRef.current = audio;
      void audio.play().catch(() => {
        const fallback = new SpeechSynthesisUtterance(currentPhrase.english_text);
        fallback.lang = "en-US";
        fallback.rate = 0.9;
        fallback.pitch = 1.02;
        fallback.volume = 1;
        if (preferredVoice) fallback.voice = preferredVoice;
        window.speechSynthesis.speak(fallback);
      });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentPhrase.english_text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      return;
    }
    setShowConfetti(false);
    setConfettiPieces([]);
    setSpokenText("");
    setFeedback("");
    setAccuracy(null);
    setSpeechConfidence(null);
    setMicError("");
    recognitionRef.current.start();
  }

  function nextPrompt() {
    if (lessonPhrases.length <= 1) return;
    setPhraseIndex((current) => {
      const next = Math.floor(Math.random() * lessonPhrases.length);
      return next === current ? (next + 1) % lessonPhrases.length : next;
    });
    resetResult();
  }

  return (
    <div className="space-y-4">
      {showConfetti ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute rounded-sm confetti-piece"
              style={{
                left: `${piece.left}%`,
                top: `${piece.top}%`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <Card className="border-0 bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-black tracking-tight">{copy.title}</CardTitle>
          <p className="text-lg font-semibold text-white/95">{copy.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Badge className="justify-center rounded-xl bg-white text-base font-black text-cyan-700">
              {copy.tries}: {attempts}
            </Badge>
            <Badge className="justify-center rounded-xl bg-white text-base font-black text-cyan-700">
              {copy.accepted}: {accepted}
            </Badge>
            <Badge className="justify-center rounded-xl bg-white text-base font-black text-cyan-700">
              {copy.accuracy}: {accuracy ?? 0}%
            </Badge>
          </div>

          <div className="space-y-2 rounded-2xl bg-white/15 p-4">
            <p className="text-base font-bold">{copy.pickLesson}</p>
            <Select value={activeLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger className="h-12 border-white/30 bg-white text-base font-bold text-slate-900">
                <SelectValue placeholder={copy.pickLesson} />
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

          {currentPhrase ? (
            <div className="space-y-3 rounded-2xl bg-white/15 p-4">
              <p className="text-base font-bold text-white/95">{copy.promptLabel}</p>
              <p className="text-2xl font-black leading-tight">{currentPhrase.english_text}</p>
              <p className="text-base font-semibold text-white/90">{copy.speakHint}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Button
                  type="button"
                  onClick={speakQuestion}
                  className="h-auto min-h-14 w-full min-w-0 whitespace-normal rounded-2xl bg-white px-3 py-3 text-center text-base font-black leading-tight text-cyan-700 hover:bg-cyan-50 sm:text-lg"
                >
                  <Volume2 className="h-5 w-5 shrink-0" />
                  {copy.askQuestion}
                </Button>
                <Button
                  type="button"
                  onClick={toggleListening}
                  disabled={!speechSupported}
                  className="h-auto min-h-14 w-full min-w-0 whitespace-normal rounded-2xl bg-white px-3 py-3 text-center text-base font-black leading-tight text-cyan-700 hover:bg-cyan-50 sm:text-lg"
                >
                  {listening ? <MicOff className="h-5 w-5 shrink-0" /> : <Mic className="h-5 w-5 shrink-0" />}
                  {listening ? copy.stopListening : copy.startSpeaking}
                </Button>
                <Button
                  type="button"
                  onClick={nextPrompt}
                  className="h-auto min-h-14 w-full min-w-0 whitespace-normal rounded-2xl bg-white/20 px-3 py-3 text-center text-base font-black leading-tight text-white hover:bg-white/30 sm:text-lg"
                >
                  <RefreshCw className="h-5 w-5 shrink-0" />
                  {copy.nextPrompt}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/15 p-4 text-base font-bold text-white">
              {copy.noPhrases}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-cyan-200">
        <CardContent className="space-y-3 p-4">
          <p className="text-base font-bold text-slate-700">{copy.responseHint}</p>
          {!speechSupported ? (
            <p className="text-base font-bold text-red-600">{copy.unsupported}</p>
          ) : null}
          {micError ? (
            <p className="text-base font-bold text-red-600">{micError}</p>
          ) : null}
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{copy.youSaid}</p>
            <p className="mt-2 break-words text-xl font-black text-slate-900">{spokenText || "..."}</p>
          </div>
          {feedback ? (
            <div className="rounded-2xl bg-emerald-100 p-4 text-base font-black text-emerald-800">
              <MessageCircleQuestion className="mr-2 inline h-5 w-5 align-text-bottom" />
              <span className="break-words">{feedback}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

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
