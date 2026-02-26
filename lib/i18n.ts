import { Language } from "@/lib/types";

export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  sw: "Swahili",
  chk: "Chuukese",
};

type Dictionary = {
  appName: string;
  tagline: string;
  flashcards: string;
  alphabet: string;
  numbers: string;
  hearing: string;
  speak: string;
  matching: string;
  unscramble: string;
  profile: string;
  admin: string;
  home: string;
  liveQuiz: string;
  volunteer: string;
  more: string;
  allActivities: string;
  progress: string;
  leaderboard: string;
  leaderboardTitle: string;
  leaderboardDescription: string;
  leaderboardBadgeDescription: string;
  currentCourseLabel: string;
  learnerLabel: string;
  optionalLogin: string;
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  continueGuest: string;
  lesson: string;
  noData: string;
  start: string;
  next: string;
  check: string;
  correct: string;
  incorrect: string;
  reveal: string;
  selectLanguage: string;
  adminPanel: string;
  addLesson: string;
  addVocab: string;
  addSentence: string;
  patterns: string;
  addPatterns: string;
  play: string;
  curriculum: string;
  vocabReady: string;
  progressActive: string;
  homeFlashcardsDesc: string;
  homeAlphabetDesc: string;
  homeNumbersDesc: string;
  homeHearingDesc: string;
  homeMatchingDesc: string;
  homeUnscrambleDesc: string;
  homePatternsDesc: string;
  homeLiveQuizDesc: string;
  conversationPatternsTitle: string;
  conversationPatternsSubtitle: string;
  conversationPatternLanguageLabel: string;
  conversationPatternLanguageEnglish: string;
  conversationPatternLanguageSpanish: string;
  conversationPatternsLoadError: string;
  conversationUnitLabel: string;
  conversationLessonsRange: string;
  conversationChangeUnit: string;
  conversationPersonA: string;
  conversationPersonB: string;
  conversationLessonSlotLabel: string;
  conversationPatternImageAlt: string;
  conversationNoPatternImages: string;
  conversationVocabularyTitle: string;
  conversationLessonHeading: string;
  conversationClose: string;
  conversationNoVocabularyWords: string;
  conversationSpanishShort: string;
  conversationPortugueseShort: string;
  conversationUnit1Title: string;
  conversationUnit2Title: string;
  conversationUnit3Title: string;
  conversationUnit4Title: string;
  conversationUnit5Title: string;
  conversationUnit6Title: string;
  themeToggle: string;
  adminManageLessonsDesc: string;
  adminAddVocabDesc: string;
  adminAddSentenceDesc: string;
  adminAddPatternsDesc: string;
  adminLoading: string;
  adminOnly: string;
  adminNeedAccount: string;
  buildSentenceEnglish: string;
  tapWordsBelow: string;
  reset: string;
  supabaseMissing: string;
  accountCreated: string;
  signedIn: string;
  signedOut: string;
  continueWithGoogle: string;
  googleSignInEasier: string;
  useEmailInstead: string;
  loggedInAs: string;
  gamesOpenNotice: string;
  createLessonFirst: string;
  uploadFailed: string;
  lessonAdded: string;
  vocabAdded: string;
  sentenceAdded: string;
  patternsSaved: string;
  currentLessons: string;
  level: string;
  unit: string;
  lessonNumber: string;
  ecNumber: string;
  titleEnglish: string;
  titleSpanish: string;
  titlePortuguese: string;
  selectLesson: string;
  englishWord: string;
  englishSentence: string;
  spanishTranslation: string;
  portugueseTranslation: string;
  imageFileBucket: string;
  audioFileBucket: string;
  orPasteImageUrl: string;
  orPasteAudioUrl: string;
  uploading: string;
  addVocabularyButton: string;
  englishSentenceLabel: string;
  spanishHint: string;
  portugueseHint: string;
  addSentenceButton: string;
  englishPatternImage: string;
  spanishPatternImage: string;
  portuguesePatternImage: string;
  savePatterns: string;
  chooseImageFile: string;
  noPatternForLesson: string;
  englishPattern: string;
  selectedLanguagePattern: string;
  allLessons: string;
  dictionarySearchPlaceholder: string;
  dictionaryNoResults: string;
  cardMode: string;
  modeImageAudio: string;
  modeImageText: string;
  modeAudioText: string;
  modeTextTranslation: string;
  noImageAvailable: string;
  showFront: string;
  flipCard: string;
  dictionary: string;
  ratingGotIt: string;
  ratingKindOf: string;
  ratingKeepInDeck: string;
  masterNow: string;
  flipToRate: string;
  reviewSession: string;
  learnSession: string;
  reviewAcrossLessons: string;
  skipReview: string;
  reviewComplete: string;
  startLearningNew: string;
  dueCount: string;
  newCount: string;
  mastered: string;
  needsWork: string;
  transliterationSpanish: string;
  transliterationPortuguese: string;
  ipa: string;
  partOfSpeech: string;
  definition: string;
  image: string;
  audio: string;
  mode: string;
  completedLessons: string;
  masteredWords: string;
  nextLesson: string;
  noProgressYet: string;
  completedStatus: string;
  inProgressStatus: string;
  notStartedStatus: string;
  alphabetSubtitle: string;
  numbersSubtitle: string;
  hearingSubtitle: string;
  hearingSpeedLabel: string;
  hearingPlay: string;
  hearingPlaying: string;
  hearingNextWord: string;
  hearingTip: string;
  alphabetStudyIntro: string;
  numbersStudyIntro: string;
  startLetterQuiz: string;
  startNumberQuiz: string;
  letterQuizTitle: string;
  numberQuizTitle: string;
  chooseSecondsPerLetter: string;
  chooseSecondsPerNumber: string;
  beginQuiz: string;
  studyMore: string;
  ready: string;
  set: string;
  go: string;
  questionOfTemplate: string;
  questionTimerAria: string;
  timesUpListenMark: string;
  playAudioAgain: string;
  iGotIt: string;
  iMissedIt: string;
  greatWork: string;
  keepPracticing: string;
  missedSummaryTemplate: string;
  passedWithTwoOrFewer: string;
  passRequirement: string;
  wrongAnswers: string;
  noWrongAnswersThisRound: string;
  quizAgain: string;
  tryAgain: string;
  playLetterAriaTemplate: string;
  playNumberAriaTemplate: string;
  missedNumbersSummaryTemplate: string;
  passedWithTwoOrFewerNumbers: string;
  passNumberRequirement: string;
  exitQuiz: string;
  exitStudy: string;
  settings: string;
  currentStreak: string;
  longestStreak: string;
  streakDays: string;
};

const baseDictionary: Record<"en" | "es" | "pt", Dictionary> = {
  en: {
    appName: "EnglishConnect Buddy",
    tagline: "Learn English with quick games and lessons",
    flashcards: "Flashcards",
    alphabet: "Alphabet",
    numbers: "Numbers",
    hearing: "Hearing",
    speak: "Speak",
    matching: "Matching",
    unscramble: "Unscramble",
    profile: "Profile",
    admin: "Admin",
    home: "Home",
    liveQuiz: "Live Quiz",
    volunteer: "Volunteer",
    more: "More",
    allActivities: "All Activities",
    progress: "Progress",
    leaderboard: "Leaderboard",
    leaderboardTitle: "Course Badge Rankings",
    leaderboardDescription: "Highest mastered unit in each learner's current course.",
    leaderboardBadgeDescription: "See all active learners and their current-course unit badge.",
    currentCourseLabel: "Current course",
    learnerLabel: "Learner",
    optionalLogin: "Login is optional and only saves your progress.",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    continueGuest: "Continue as guest",
    lesson: "Lesson",
    noData: "No content yet. Add data in Admin.",
    start: "Start",
    next: "Next",
    check: "Check",
    correct: "Correct!",
    incorrect: "Try again",
    reveal: "Hint",
    selectLanguage: "Language",
    adminPanel: "Admin Panel",
    addLesson: "Add Lesson",
    addVocab: "Add Vocabulary",
    addSentence: "Add Sentence",
    patterns: "Patterns",
    addPatterns: "Add Patterns",
    play: "Play",
    curriculum: "Curriculum",
    vocabReady: "vocabulary items ready for gameplay.",
    progressActive: "Progress saving is active.",
    homeFlashcardsDesc: "Learn key words by revealing English meanings.",
    homeAlphabetDesc: "Study uppercase and lowercase letters with audio.",
    homeNumbersDesc: "Practice number sounds from 1 to 9000 with audio.",
    homeHearingDesc: "Listen to words spelled letter by letter at your pace.",
    homeMatchingDesc: "Match your language to English words quickly.",
    homeUnscrambleDesc: "Build correct English sentence order.",
    homePatternsDesc: "Review lesson sentence patterns side by side.",
    homeLiveQuizDesc: "Join teacher-led vocabulary challenges in real time.",
    conversationPatternsTitle: "Conversation Patterns",
    conversationPatternsSubtitle: "Choose a unit to open a full text-message conversation flow.",
    conversationPatternLanguageLabel: "Pattern image language",
    conversationPatternLanguageEnglish: "English Patterns",
    conversationPatternLanguageSpanish: "Spanish Patterns",
    conversationPatternsLoadError: "Could not load conversation patterns.",
    conversationUnitLabel: "Unit {unit}",
    conversationLessonsRange: "Lessons {from}-{to}",
    conversationChangeUnit: "Change Unit",
    conversationPersonA: "Person A",
    conversationPersonB: "Person B",
    conversationLessonSlotLabel: "Lesson {lesson} - {slot}",
    conversationPatternImageAlt: "Lesson {lesson} pattern {slot} from {role}",
    conversationNoPatternImages: "No pattern images found for this unit yet.",
    conversationVocabularyTitle: "Vocabulary",
    conversationLessonHeading: "Lesson {lesson}",
    conversationClose: "Close",
    conversationNoVocabularyWords: "No vocabulary words found for this lesson.",
    conversationSpanishShort: "ES",
    conversationPortugueseShort: "PT",
    conversationUnit1Title: "Introducing Myself",
    conversationUnit2Title: "Describing Family & Things",
    conversationUnit3Title: "Talking About My Day",
    conversationUnit4Title: "Describing My Job and What I Eat",
    conversationUnit5Title: "Describing My Home",
    conversationUnit6Title: "Talking About My Health & Community",
    themeToggle: "Toggle dark mode",
    adminManageLessonsDesc: "Manage EnglishConnect lessons.",
    adminAddVocabDesc: "Add vocabulary words, audio and images.",
    adminAddSentenceDesc: "Add sentence scramble practice.",
    adminAddPatternsDesc: "Upload English, Spanish, and Portuguese pattern images by lesson.",
    adminLoading: "Loading admin access...",
    adminOnly: "Admin only",
    adminNeedAccount: "You need an admin account to access this section.",
    buildSentenceEnglish: "Build the sentence in English",
    tapWordsBelow: "Tap words below",
    reset: "Reset",
    supabaseMissing: "Supabase env vars are missing.",
    accountCreated: "Account created. Check your email if confirmation is enabled.",
    signedIn: "Signed in.",
    signedOut: "Signed out.",
    continueWithGoogle: "Continue with Google",
    googleSignInEasier: "Signing in with Google is faster and easier.",
    useEmailInstead: "Or use email and password",
    loggedInAs: "Logged in as",
    gamesOpenNotice: "All games are open without login. Login only saves progress and admin access.",
    createLessonFirst: "Please create a lesson first.",
    uploadFailed: "Upload failed.",
    lessonAdded: "Lesson added.",
    vocabAdded: "Vocabulary added.",
    sentenceAdded: "Sentence added.",
    patternsSaved: "Pattern images saved.",
    currentLessons: "Current lessons",
    level: "Level",
    unit: "Unit",
    lessonNumber: "Lesson #",
    ecNumber: "EC #",
    titleEnglish: "Title (English)",
    titleSpanish: "Title (Spanish)",
    titlePortuguese: "Title (Portuguese)",
    selectLesson: "Select lesson",
    englishWord: "English Word",
    englishSentence: "English Sentence",
    spanishTranslation: "Spanish Translation",
    portugueseTranslation: "Portuguese Translation",
    imageFileBucket: "Image File (bucket: vocab)",
    audioFileBucket: "Audio File (bucket: vocab)",
    orPasteImageUrl: "or paste image URL",
    orPasteAudioUrl: "or paste audio URL",
    uploading: "Uploading...",
    addVocabularyButton: "Add Vocabulary",
    englishSentenceLabel: "English sentence",
    spanishHint: "Spanish hint",
    portugueseHint: "Portuguese hint",
    addSentenceButton: "Add sentence",
    englishPatternImage: "English Pattern Image",
    spanishPatternImage: "Spanish Pattern Image",
    portuguesePatternImage: "Portuguese Pattern Image",
    savePatterns: "Save Patterns",
    chooseImageFile: "Choose image file",
    noPatternForLesson: "No pattern image uploaded for this lesson yet.",
    englishPattern: "English Pattern",
    selectedLanguagePattern: "Selected Language Pattern",
    allLessons: "All Lessons",
    dictionarySearchPlaceholder: "Search any word in any language",
    dictionaryNoResults: "No matching words found.",
    cardMode: "Card Mode",
    modeImageAudio: "Picture front / Audio back",
    modeImageText: "Picture front / Text back",
    modeAudioText: "Audio front / Text back",
    modeTextTranslation: "Text front / Translation back",
    noImageAvailable: "No image available",
    showFront: "Show Front",
    flipCard: "Flip Card",
    dictionary: "Dictionary",
    ratingGotIt: "Strong",
    ratingKindOf: "Improving",
    ratingKeepInDeck: "Weak",
    masterNow: "Master now (skip future reviews)",
    flipToRate: "Flip card to rate",
    reviewSession: "Review due cards",
    learnSession: "Learn new cards",
    reviewAcrossLessons: "Due review pulls from all lessons in your course.",
    skipReview: "Skip review and learn new",
    reviewComplete: "Great work. Your due review batch is complete.",
    startLearningNew: "Start learning new words",
    dueCount: "Due",
    newCount: "New",
    mastered: "Mastered",
    needsWork: "Needs work",
    transliterationSpanish: "Spanish transliteration",
    transliterationPortuguese: "Portuguese transliteration",
    ipa: "IPA",
    partOfSpeech: "Part of speech",
    definition: "Definition",
    image: "Image",
    audio: "Audio",
    mode: "Mode",
    completedLessons: "Completed lessons",
    masteredWords: "Mastered words",
    nextLesson: "Next lesson",
    noProgressYet: "No progress yet",
    completedStatus: "Completed",
    inProgressStatus: "In progress",
    notStartedStatus: "Not started",
    alphabetSubtitle: "Study letters and sounds",
    numbersSubtitle: "Study numbers and sounds",
    hearingSubtitle: "Hear words spelled out one letter at a time",
    hearingSpeedLabel: "Spelling speed",
    hearingPlay: "Play Spelling",
    hearingPlaying: "Playing...",
    hearingNextWord: "Next Word",
    hearingTip: "Tip: Adjust the slider, listen, and repeat until you can catch every letter.",
    alphabetStudyIntro: "Learn uppercase and lowercase letters with audio.",
    numbersStudyIntro: "Practice number pronunciation with audio.",
    startLetterQuiz: "Start Letter Quiz",
    startNumberQuiz: "Start Number Quiz",
    letterQuizTitle: "Letter Quiz",
    numberQuizTitle: "Number Quiz",
    chooseSecondsPerLetter: "Choose how many seconds you want to answer each letter.",
    chooseSecondsPerNumber: "Choose how many seconds you want to answer each number.",
    beginQuiz: "Begin Quiz",
    studyMore: "Study More",
    ready: "Ready",
    set: "Set",
    go: "Go!",
    questionOfTemplate: "Question {current} of {total}",
    questionTimerAria: "Question timer",
    timesUpListenMark: "Time's up. Listen and mark your answer.",
    playAudioAgain: "Play Audio Again",
    iGotIt: "I Got It",
    iMissedIt: "I Missed It",
    greatWork: "Great Work!",
    keepPracticing: "Keep Practicing!",
    missedSummaryTemplate: "Missed {count} of {total} letters.",
    passedWithTwoOrFewer: "You passed with 2 or fewer misses.",
    passRequirement: "Pass requirement: miss no more than 2 letters.",
    wrongAnswers: "Wrong Answers",
    noWrongAnswersThisRound: "No wrong answers this round.",
    quizAgain: "Quiz Again",
    tryAgain: "Try Again",
    playLetterAriaTemplate: "Play letter {letter}",
    playNumberAriaTemplate: "Play number {number}",
    missedNumbersSummaryTemplate: "Missed {count} of {total} numbers.",
    passedWithTwoOrFewerNumbers: "You passed with 2 or fewer misses.",
    passNumberRequirement: "Pass requirement: miss no more than 2 numbers.",
    exitQuiz: "Exit quiz",
    exitStudy: "Exit study",
    settings: "Settings",
    currentStreak: "Current streak",
    longestStreak: "Longest streak",
    streakDays: "days",
  },
  es: {
    appName: "EnglishConnect Buddy",
    tagline: "Aprende inglés con juegos y lecciones rápidas",
    flashcards: "Tarjetas",
    alphabet: "Alfabeto",
    numbers: "Números",
    hearing: "Escuchar",
    speak: "Hablar",
    matching: "Relacionar",
    unscramble: "Ordenar",
    profile: "Perfil",
    admin: "Admin",
    home: "Inicio",
    liveQuiz: "Quiz en vivo",
    volunteer: "Voluntariado",
    more: "Más",
    allActivities: "Todas las actividades",
    progress: "Progreso",
    leaderboard: "Clasificación",
    leaderboardTitle: "Ranking de insignias por curso",
    leaderboardDescription: "Unidad más alta dominada en el curso actual de cada estudiante.",
    leaderboardBadgeDescription: "Mira a todos los estudiantes activos y su insignia de unidad del curso actual.",
    currentCourseLabel: "Curso actual",
    learnerLabel: "Estudiante",
    optionalLogin: "Iniciar sesión es opcional y solo guarda tu progreso.",
    signIn: "Ingresar",
    signUp: "Crear cuenta",
    signOut: "Cerrar sesión",
    email: "Correo",
    password: "Contraseña",
    continueGuest: "Continuar como invitado",
    lesson: "Lección",
    noData: "Aún no hay contenido. Agrega datos en Admin.",
    start: "Empezar",
    next: "Siguiente",
    check: "Verificar",
    correct: "Correcto",
    incorrect: "Intenta de nuevo",
    reveal: "Pista",
    selectLanguage: "Idioma",
    adminPanel: "Panel Admin",
    addLesson: "Agregar Lección",
    addVocab: "Agregar Vocabulario",
    addSentence: "Agregar Oración",
    patterns: "Patrones",
    addPatterns: "Agregar Patrones",
    play: "Jugar",
    curriculum: "Currículo",
    vocabReady: "elementos de vocabulario listos para practicar.",
    progressActive: "El guardado de progreso está activo.",
    homeFlashcardsDesc: "Aprende palabras clave revelando su significado en inglés.",
    homeAlphabetDesc: "Estudia letras mayúsculas y minúsculas con audio.",
    homeNumbersDesc: "Practica los sonidos de números del 1 al 9000 con audio.",
    homeHearingDesc: "Escucha palabras deletreadas letra por letra a tu ritmo.",
    homeMatchingDesc: "Relaciona rápidamente tu idioma con palabras en inglés.",
    homeUnscrambleDesc: "Construye el orden correcto de las oraciones en inglés.",
    homePatternsDesc: "Revisa patrones de la lección en paralelo.",
    homeLiveQuizDesc: "Únete a desafíos de vocabulario guiados por el maestro en tiempo real.",
    conversationPatternsTitle: "Patrones de conversación",
    conversationPatternsSubtitle: "Elige una unidad para abrir un flujo completo de conversación tipo mensajes.",
    conversationPatternLanguageLabel: "Idioma de imágenes de patrones",
    conversationPatternLanguageEnglish: "Patrones en inglés",
    conversationPatternLanguageSpanish: "Patrones en español",
    conversationPatternsLoadError: "No se pudieron cargar los patrones de conversación.",
    conversationUnitLabel: "Unidad {unit}",
    conversationLessonsRange: "Lecciones {from}-{to}",
    conversationChangeUnit: "Cambiar unidad",
    conversationPersonA: "Persona A",
    conversationPersonB: "Persona B",
    conversationLessonSlotLabel: "Lección {lesson} - {slot}",
    conversationPatternImageAlt: "Lección {lesson} patrón {slot} de {role}",
    conversationNoPatternImages: "Aún no hay imágenes de patrón para esta unidad.",
    conversationVocabularyTitle: "Vocabulario",
    conversationLessonHeading: "Lección {lesson}",
    conversationClose: "Cerrar",
    conversationNoVocabularyWords: "No se encontraron palabras de vocabulario para esta lección.",
    conversationSpanishShort: "ES",
    conversationPortugueseShort: "PT",
    conversationUnit1Title: "Presentándome",
    conversationUnit2Title: "Describiendo la familia y las cosas",
    conversationUnit3Title: "Hablando de mi día",
    conversationUnit4Title: "Describiendo mi trabajo y lo que como",
    conversationUnit5Title: "Describiendo mi hogar",
    conversationUnit6Title: "Hablando de mi salud y comunidad",
    themeToggle: "Cambiar modo oscuro",
    adminManageLessonsDesc: "Gestiona las lecciones de EnglishConnect.",
    adminAddVocabDesc: "Agrega vocabulario, audio e imágenes.",
    adminAddSentenceDesc: "Agrega práctica de ordenar oraciones.",
    adminAddPatternsDesc: "Sube imágenes de patrones en inglés, español y portugués por lección.",
    adminLoading: "Cargando acceso de admin...",
    adminOnly: "Solo admin",
    adminNeedAccount: "Necesitas una cuenta de admin para acceder a esta sección.",
    buildSentenceEnglish: "Construye la oración en inglés",
    tapWordsBelow: "Toca las palabras abajo",
    reset: "Reiniciar",
    supabaseMissing: "Faltan variables de entorno de Supabase.",
    accountCreated: "Cuenta creada. Revisa tu correo si la confirmación está habilitada.",
    signedIn: "Sesión iniciada.",
    signedOut: "Sesión cerrada.",
    continueWithGoogle: "Continuar con Google",
    googleSignInEasier: "Ingresar con Google es más rápido y fácil.",
    useEmailInstead: "O usa correo y contraseña",
    loggedInAs: "Conectado como",
    gamesOpenNotice: "Todos los juegos están abiertos sin inicio de sesión. Iniciar sesión solo guarda progreso y acceso admin.",
    createLessonFirst: "Primero crea una lección.",
    uploadFailed: "Error al subir archivos.",
    lessonAdded: "Lección agregada.",
    vocabAdded: "Vocabulario agregado.",
    sentenceAdded: "Oración agregada.",
    patternsSaved: "Imágenes de patrones guardadas.",
    currentLessons: "Lecciones actuales",
    level: "Nivel",
    unit: "Unidad",
    lessonNumber: "Lección #",
    ecNumber: "EC #",
    titleEnglish: "Título (Inglés)",
    titleSpanish: "Título (Español)",
    titlePortuguese: "Título (Portugués)",
    selectLesson: "Selecciona lección",
    englishWord: "Palabra en inglés",
    englishSentence: "Oración en inglés",
    spanishTranslation: "Traducción al español",
    portugueseTranslation: "Traducción al portugués",
    imageFileBucket: "Archivo de imagen (bucket: vocab)",
    audioFileBucket: "Archivo de audio (bucket: vocab)",
    orPasteImageUrl: "o pega URL de imagen",
    orPasteAudioUrl: "o pega URL de audio",
    uploading: "Subiendo...",
    addVocabularyButton: "Agregar vocabulario",
    englishSentenceLabel: "Oración en inglés",
    spanishHint: "Pista en español",
    portugueseHint: "Pista en portugués",
    addSentenceButton: "Agregar oración",
    englishPatternImage: "Imagen del patrón en inglés",
    spanishPatternImage: "Imagen del patrón en español",
    portuguesePatternImage: "Imagen del patrón en portugués",
    savePatterns: "Guardar patrones",
    chooseImageFile: "Elegir archivo de imagen",
    noPatternForLesson: "Aún no hay imagen de patrón para esta lección.",
    englishPattern: "Patrón en inglés",
    selectedLanguagePattern: "Patrón del idioma seleccionado",
    allLessons: "Todas las lecciones",
    dictionarySearchPlaceholder: "Busca cualquier palabra en cualquier idioma",
    dictionaryNoResults: "No se encontraron palabras.",
    cardMode: "Modo de tarjeta",
    modeImageAudio: "Imagen frente / Audio atrás",
    modeImageText: "Imagen frente / Texto atrás",
    modeAudioText: "Audio frente / Texto atrás",
    modeTextTranslation: "Texto frente / Traducción atrás",
    noImageAvailable: "Imagen no disponible",
    showFront: "Mostrar frente",
    flipCard: "Voltear tarjeta",
    dictionary: "Diccionario",
    ratingGotIt: "Fuerte",
    ratingKindOf: "Mejorando",
    ratingKeepInDeck: "Débil",
    masterNow: "Dominar ahora (sin revisiones futuras)",
    flipToRate: "Voltea la tarjeta para calificar",
    reviewSession: "Revisar pendientes",
    learnSession: "Aprender nuevas",
    reviewAcrossLessons: "La revisión pendiente toma tarjetas de todas las lecciones del curso.",
    skipReview: "Saltar revisión y aprender nuevas",
    reviewComplete: "Excelente. Terminaste tu revisión pendiente.",
    startLearningNew: "Empezar palabras nuevas",
    dueCount: "Pendientes",
    newCount: "Nuevas",
    mastered: "Dominada",
    needsWork: "Necesita práctica",
    transliterationSpanish: "Transliteración en español",
    transliterationPortuguese: "Transliteración en portugués",
    ipa: "IPA",
    partOfSpeech: "Categoría gramatical",
    definition: "Definición",
    image: "Imagen",
    audio: "Audio",
    mode: "Modo",
    completedLessons: "Lecciones completadas",
    masteredWords: "Palabras dominadas",
    nextLesson: "Próxima lección",
    noProgressYet: "Sin progreso aún",
    completedStatus: "Completada",
    inProgressStatus: "En progreso",
    notStartedStatus: "Sin empezar",
    alphabetSubtitle: "Estudia letras y sonidos",
    numbersSubtitle: "Estudia números y sonidos",
    hearingSubtitle: "Escucha palabras deletreadas una letra a la vez",
    hearingSpeedLabel: "Velocidad de deletreo",
    hearingPlay: "Reproducir deletreo",
    hearingPlaying: "Reproduciendo...",
    hearingNextWord: "Siguiente palabra",
    hearingTip: "Consejo: Ajusta el control, escucha y repite hasta captar cada letra.",
    alphabetStudyIntro: "Aprende letras mayúsculas y minúsculas con audio.",
    numbersStudyIntro: "Practica la pronunciación de números con audio.",
    startLetterQuiz: "Comenzar quiz de letras",
    startNumberQuiz: "Comenzar quiz de números",
    letterQuizTitle: "Quiz de letras",
    numberQuizTitle: "Quiz de números",
    chooseSecondsPerLetter: "Elige cuántos segundos quieres para responder cada letra.",
    chooseSecondsPerNumber: "Elige cuántos segundos quieres para responder cada número.",
    beginQuiz: "Comenzar quiz",
    studyMore: "Estudiar más",
    ready: "Listos",
    set: "Preparados",
    go: "¡Ya!",
    questionOfTemplate: "Pregunta {current} de {total}",
    questionTimerAria: "Temporizador de pregunta",
    timesUpListenMark: "Se acabó el tiempo. Escucha y marca tu respuesta.",
    playAudioAgain: "Reproducir audio otra vez",
    iGotIt: "La acerté",
    iMissedIt: "La fallé",
    greatWork: "¡Excelente trabajo!",
    keepPracticing: "Sigue practicando",
    missedSummaryTemplate: "Fallaste {count} de {total} letras.",
    passedWithTwoOrFewer: "Aprobaste con 2 o menos fallos.",
    passRequirement: "Para aprobar: no fallar más de 2 letras.",
    wrongAnswers: "Respuestas incorrectas",
    noWrongAnswersThisRound: "No hubo respuestas incorrectas en esta ronda.",
    quizAgain: "Quiz otra vez",
    tryAgain: "Intentar de nuevo",
    playLetterAriaTemplate: "Reproducir letra {letter}",
    playNumberAriaTemplate: "Reproducir número {number}",
    missedNumbersSummaryTemplate: "Fallaste {count} de {total} números.",
    passedWithTwoOrFewerNumbers: "Aprobaste con 2 o menos fallos.",
    passNumberRequirement: "Para aprobar: no fallar más de 2 números.",
    exitQuiz: "Salir del quiz",
    exitStudy: "Salir del estudio",
    settings: "Configuración",
    currentStreak: "Racha actual",
    longestStreak: "Mejor racha",
    streakDays: "días",
  },
  pt: {
    appName: "EnglishConnect Buddy",
    tagline: "Aprenda inglês com jogos e lições rápidas",
    flashcards: "Cartões",
    alphabet: "Alfabeto",
    numbers: "Números",
    hearing: "Escuta",
    speak: "Falar",
    matching: "Combinar",
    unscramble: "Ordenar",
    profile: "Perfil",
    admin: "Admin",
    home: "Início",
    liveQuiz: "Quiz ao vivo",
    volunteer: "Voluntariado",
    more: "Mais",
    allActivities: "Todas as atividades",
    progress: "Progresso",
    leaderboard: "Classificação",
    leaderboardTitle: "Ranking de insígnias por curso",
    leaderboardDescription: "Unidade mais alta dominada no curso atual de cada aluno.",
    leaderboardBadgeDescription: "Veja todos os alunos ativos e sua insígnia de unidade do curso atual.",
    currentCourseLabel: "Curso atual",
    learnerLabel: "Aluno",
    optionalLogin: "O login é opcional e só salva seu progresso.",
    signIn: "Entrar",
    signUp: "Criar conta",
    signOut: "Sair",
    email: "Email",
    password: "Senha",
    continueGuest: "Continuar como visitante",
    lesson: "Lição",
    noData: "Ainda sem conteúdo. Adicione dados no Admin.",
    start: "Começar",
    next: "Próxima",
    check: "Verificar",
    correct: "Correto",
    incorrect: "Tente novamente",
    reveal: "Dica",
    selectLanguage: "Idioma",
    adminPanel: "Painel Admin",
    addLesson: "Adicionar Lição",
    addVocab: "Adicionar Vocabulário",
    addSentence: "Adicionar Frase",
    patterns: "Padrões",
    addPatterns: "Adicionar Padrões",
    play: "Jogar",
    curriculum: "Currículo",
    vocabReady: "itens de vocabulário prontos para prática.",
    progressActive: "Salvar progresso está ativo.",
    homeFlashcardsDesc: "Aprenda palavras-chave revelando significados em inglês.",
    homeAlphabetDesc: "Estude letras maiúsculas e minúsculas com áudio.",
    homeNumbersDesc: "Pratique sons de números de 1 a 9000 com áudio.",
    homeHearingDesc: "Ouça palavras soletradas letra por letra no seu ritmo.",
    homeMatchingDesc: "Combine rapidamente seu idioma com palavras em inglês.",
    homeUnscrambleDesc: "Monte a ordem correta das frases em inglês.",
    homePatternsDesc: "Revise padrões da lição lado a lado.",
    homeLiveQuizDesc: "Participe de desafios de vocabulário ao vivo com o professor.",
    conversationPatternsTitle: "Padrões de conversa",
    conversationPatternsSubtitle: "Escolha uma unidade para abrir um fluxo completo de conversa em estilo de mensagens.",
    conversationPatternLanguageLabel: "Idioma das imagens de padrões",
    conversationPatternLanguageEnglish: "Padrões em inglês",
    conversationPatternLanguageSpanish: "Padrões em espanhol",
    conversationPatternsLoadError: "Não foi possível carregar os padrões de conversa.",
    conversationUnitLabel: "Unidade {unit}",
    conversationLessonsRange: "Lições {from}-{to}",
    conversationChangeUnit: "Trocar unidade",
    conversationPersonA: "Pessoa A",
    conversationPersonB: "Pessoa B",
    conversationLessonSlotLabel: "Lição {lesson} - {slot}",
    conversationPatternImageAlt: "Lição {lesson} padrão {slot} de {role}",
    conversationNoPatternImages: "Nenhuma imagem de padrão encontrada para esta unidade ainda.",
    conversationVocabularyTitle: "Vocabulário",
    conversationLessonHeading: "Lição {lesson}",
    conversationClose: "Fechar",
    conversationNoVocabularyWords: "Nenhuma palavra de vocabulário encontrada para esta lição.",
    conversationSpanishShort: "ES",
    conversationPortugueseShort: "PT",
    conversationUnit1Title: "Apresentando-me",
    conversationUnit2Title: "Descrevendo família e coisas",
    conversationUnit3Title: "Falando sobre meu dia",
    conversationUnit4Title: "Descrevendo meu trabalho e o que como",
    conversationUnit5Title: "Descrevendo minha casa",
    conversationUnit6Title: "Falando sobre minha saúde e comunidade",
    themeToggle: "Alternar modo escuro",
    adminManageLessonsDesc: "Gerencie as lições do EnglishConnect.",
    adminAddVocabDesc: "Adicione vocabulário, áudio e imagens.",
    adminAddSentenceDesc: "Adicione prática de ordenar frases.",
    adminAddPatternsDesc: "Envie imagens de padrões em inglês, espanhol e português por lição.",
    adminLoading: "Carregando acesso de admin...",
    adminOnly: "Somente admin",
    adminNeedAccount: "Você precisa de uma conta admin para acessar esta seção.",
    buildSentenceEnglish: "Monte a frase em inglês",
    tapWordsBelow: "Toque nas palavras abaixo",
    reset: "Redefinir",
    supabaseMissing: "As variáveis de ambiente do Supabase estão faltando.",
    accountCreated: "Conta criada. Verifique seu email se a confirmação estiver ativa.",
    signedIn: "Login realizado.",
    signedOut: "Sessão encerrada.",
    continueWithGoogle: "Continuar com Google",
    googleSignInEasier: "Entrar com Google é mais rápido e fácil.",
    useEmailInstead: "Ou use email e senha",
    loggedInAs: "Conectado como",
    gamesOpenNotice: "Todos os jogos estão abertos sem login. O login salva apenas progresso e acesso admin.",
    createLessonFirst: "Crie uma lição primeiro.",
    uploadFailed: "Falha no upload.",
    lessonAdded: "Lição adicionada.",
    vocabAdded: "Vocabulário adicionado.",
    sentenceAdded: "Frase adicionada.",
    patternsSaved: "Imagens de padrões salvas.",
    currentLessons: "Lições atuais",
    level: "Nível",
    unit: "Unidade",
    lessonNumber: "Lição #",
    ecNumber: "EC #",
    titleEnglish: "Título (Inglês)",
    titleSpanish: "Título (Espanhol)",
    titlePortuguese: "Título (Português)",
    selectLesson: "Selecione a lição",
    englishWord: "Palavra em inglês",
    englishSentence: "Frase em inglês",
    spanishTranslation: "Tradução em espanhol",
    portugueseTranslation: "Tradução em português",
    imageFileBucket: "Arquivo de imagem (bucket: vocab)",
    audioFileBucket: "Arquivo de áudio (bucket: vocab)",
    orPasteImageUrl: "ou cole URL da imagem",
    orPasteAudioUrl: "ou cole URL do áudio",
    uploading: "Enviando...",
    addVocabularyButton: "Adicionar vocabulário",
    englishSentenceLabel: "Frase em inglês",
    spanishHint: "Dica em espanhol",
    portugueseHint: "Dica em português",
    addSentenceButton: "Adicionar frase",
    englishPatternImage: "Imagem do padrão em inglês",
    spanishPatternImage: "Imagem do padrão em espanhol",
    portuguesePatternImage: "Imagem do padrão em português",
    savePatterns: "Salvar padrões",
    chooseImageFile: "Escolher arquivo de imagem",
    noPatternForLesson: "Nenhuma imagem de padrão enviada para esta lição ainda.",
    englishPattern: "Padrão em inglês",
    selectedLanguagePattern: "Padrão do idioma selecionado",
    allLessons: "Todas as lições",
    dictionarySearchPlaceholder: "Pesquise qualquer palavra em qualquer idioma",
    dictionaryNoResults: "Nenhuma palavra encontrada.",
    cardMode: "Modo do cartão",
    modeImageAudio: "Imagem frente / Áudio verso",
    modeImageText: "Imagem frente / Texto verso",
    modeAudioText: "Áudio frente / Texto verso",
    modeTextTranslation: "Texto frente / Tradução verso",
    noImageAvailable: "Imagem indisponível",
    showFront: "Mostrar frente",
    flipCard: "Virar cartão",
    dictionary: "Dicionário",
    ratingGotIt: "Forte",
    ratingKindOf: "Melhorando",
    ratingKeepInDeck: "Fraco",
    masterNow: "Dominar agora (sem revisões futuras)",
    flipToRate: "Vire o cartão para avaliar",
    reviewSession: "Revisar vencidas",
    learnSession: "Aprender novas",
    reviewAcrossLessons: "A revisão vencida usa cartões de todas as lições do curso.",
    skipReview: "Pular revisão e aprender novas",
    reviewComplete: "Ótimo trabalho. Sua revisão vencida terminou.",
    startLearningNew: "Começar palavras novas",
    dueCount: "Vencidas",
    newCount: "Novas",
    mastered: "Dominada",
    needsWork: "Precisa praticar",
    transliterationSpanish: "Transliteração em espanhol",
    transliterationPortuguese: "Transliteração em português",
    ipa: "IPA",
    partOfSpeech: "Classe gramatical",
    definition: "Definição",
    image: "Imagem",
    audio: "Áudio",
    mode: "Modo",
    completedLessons: "Lições concluídas",
    masteredWords: "Palavras dominadas",
    nextLesson: "Próxima lição",
    noProgressYet: "Sem progresso ainda",
    completedStatus: "Concluída",
    inProgressStatus: "Em progresso",
    notStartedStatus: "Não iniciada",
    alphabetSubtitle: "Estude letras e sons",
    numbersSubtitle: "Estude números e sons",
    hearingSubtitle: "Ouça palavras soletradas uma letra por vez",
    hearingSpeedLabel: "Velocidade da soletração",
    hearingPlay: "Tocar soletração",
    hearingPlaying: "Tocando...",
    hearingNextWord: "Próxima palavra",
    hearingTip: "Dica: Ajuste o controle, escute e repita até captar cada letra.",
    alphabetStudyIntro: "Aprenda letras maiúsculas e minúsculas com áudio.",
    numbersStudyIntro: "Pratique a pronúncia dos números com áudio.",
    startLetterQuiz: "Iniciar quiz de letras",
    startNumberQuiz: "Iniciar quiz de números",
    letterQuizTitle: "Quiz de letras",
    numberQuizTitle: "Quiz de números",
    chooseSecondsPerLetter: "Escolha quantos segundos você quer para responder cada letra.",
    chooseSecondsPerNumber: "Escolha quantos segundos você quer para responder cada número.",
    beginQuiz: "Iniciar quiz",
    studyMore: "Estudar mais",
    ready: "Preparar",
    set: "Apontar",
    go: "Vai!",
    questionOfTemplate: "Pergunta {current} de {total}",
    questionTimerAria: "Temporizador da pergunta",
    timesUpListenMark: "Tempo esgotado. Ouça e marque sua resposta.",
    playAudioAgain: "Tocar áudio novamente",
    iGotIt: "Eu acertei",
    iMissedIt: "Eu errei",
    greatWork: "Ótimo trabalho!",
    keepPracticing: "Continue praticando",
    missedSummaryTemplate: "Errou {count} de {total} letras.",
    passedWithTwoOrFewer: "Você passou com 2 ou menos erros.",
    passRequirement: "Regra para passar: errar no máximo 2 letras.",
    wrongAnswers: "Respostas erradas",
    noWrongAnswersThisRound: "Nenhuma resposta errada nesta rodada.",
    quizAgain: "Quiz novamente",
    tryAgain: "Tentar novamente",
    playLetterAriaTemplate: "Tocar letra {letter}",
    playNumberAriaTemplate: "Tocar número {number}",
    missedNumbersSummaryTemplate: "Errou {count} de {total} números.",
    passedWithTwoOrFewerNumbers: "Você passou com 2 ou menos erros.",
    passNumberRequirement: "Regra para passar: errar no máximo 2 números.",
    exitQuiz: "Sair do quiz",
    exitStudy: "Sair do estudo",
    settings: "Configurações",
    currentStreak: "Sequência atual",
    longestStreak: "Maior sequência",
    streakDays: "dias",
  },
};

const swDictionary: Dictionary = {
  ...baseDictionary.en,
  appName: "EnglishConnect Rafiki",
  tagline: "Jifunze Kiingereza kwa michezo na masomo ya haraka",
  flashcards: "Kadi za kujifunza",
  alphabet: "Alfabeti",
  numbers: "Nambari",
  hearing: "Sikiliza",
  speak: "Ongea",
  matching: "Oanisha",
  unscramble: "Panga sentensi",
  profile: "Wasifu",
  admin: "Msimamizi",
  home: "Nyumbani",
  liveQuiz: "Quiz ya moja kwa moja",
  volunteer: "Kujitolea",
  more: "Zaidi",
  allActivities: "Shughuli zote",
  progress: "Maendeleo",
  leaderboard: "Ubao wa alama",
  leaderboardBadgeDescription: "Tazama wanafunzi wote wanaoshiriki na beji yao ya kitengo ya kozi ya sasa.",
  curriculum: "Mtaala",
  vocabReady: "vipengele vya msamiati viko tayari kwa mchezo.",
  signIn: "Ingia",
  signUp: "Fungua akaunti",
  signOut: "Toka",
  continueGuest: "Endelea kama mgeni",
  selectLanguage: "Lugha",
  lesson: "Somo",
  play: "Cheza",
  dictionary: "Kamusi",
  settings: "Mipangilio",
  currentStreak: "Mfululizo wa sasa",
  longestStreak: "Mfululizo mrefu zaidi",
  streakDays: "siku",
  noData: "Hakuna maudhui bado. Ongeza data kwenye Admin.",
  noProgressYet: "Bado hakuna maendeleo",
  nextLesson: "Somo linalofuata",
  completedStatus: "Imekamilika",
  inProgressStatus: "Inaendelea",
  notStartedStatus: "Haijaanza",
  homeFlashcardsDesc: "Jifunze maneno muhimu kwa kufunua maana za Kiingereza.",
  homeAlphabetDesc: "Soma herufi kubwa na ndogo kwa sauti.",
  homeNumbersDesc: "Fanya mazoezi ya sauti za nambari 1 hadi 9000 kwa sauti.",
  homeHearingDesc: "Sikiliza maneno yakitamkwa herufi kwa herufi kwa kasi yako.",
  homeMatchingDesc: "Oanisha lugha yako na maneno ya Kiingereza haraka.",
  homeUnscrambleDesc: "Panga sentensi za Kiingereza kwa mpangilio sahihi.",
  homePatternsDesc: "Pitia mifumo ya sentensi ya somo kwa pamoja.",
  homeLiveQuizDesc: "Jiunge na changamoto za msamiati za moja kwa moja zinazoongozwa na mwalimu.",
  start: "Anza",
  next: "Inayofuata",
  check: "Kagua",
  correct: "Sahihi!",
  incorrect: "Jaribu tena",
  reveal: "Dokezo",
  reset: "Weka upya",
  conversationPatternsTitle: "Mifumo ya Mazungumzo",
  conversationPatternsSubtitle: "Chagua kitengo ili kufungua mtiririko kamili wa mazungumzo ya ujumbe.",
  conversationPatternLanguageLabel: "Lugha ya picha za mifumo",
  conversationPatternLanguageEnglish: "Mifumo ya Kiingereza",
  conversationPatternLanguageSpanish: "Mifumo ya Kihispania",
  conversationPatternsLoadError: "Haikuwezekana kupakia mifumo ya mazungumzo.",
  conversationUnitLabel: "Kitengo {unit}",
  conversationLessonsRange: "Masomo {from}-{to}",
  conversationChangeUnit: "Badilisha kitengo",
  conversationPersonA: "Mtu A",
  conversationPersonB: "Mtu B",
  conversationLessonSlotLabel: "Somo {lesson} - {slot}",
  conversationPatternImageAlt: "Somo {lesson} mfumo {slot} kutoka {role}",
  conversationNoPatternImages: "Hakuna picha za mifumo zilizopatikana kwa kitengo hiki bado.",
  conversationVocabularyTitle: "Msamiati",
  conversationLessonHeading: "Somo {lesson}",
  conversationClose: "Funga",
  conversationNoVocabularyWords: "Hakuna maneno ya msamiati yaliyopatikana kwa somo hili.",
  conversationSpanishShort: "ES",
  conversationPortugueseShort: "PT",
  conversationUnit1Title: "Kujitambulisha",
  conversationUnit2Title: "Kuelezea Familia na Vitu",
  conversationUnit3Title: "Kuzungumza Kuhusu Siku Yangu",
  conversationUnit4Title: "Kuelezea Kazi Yangu na Ninachokula",
  conversationUnit5Title: "Kuelezea Nyumba Yangu",
  conversationUnit6Title: "Kuzungumza Kuhusu Afya Yangu na Jamii",
};

const chkDictionary: Dictionary = {
  ...baseDictionary.en,
  appName: "EnglishConnect Buddy",
  tagline: "Suk awenese me non game me lesson mi kukkun",
  flashcards: "Kaaten suuk",
  alphabet: "Alphabet",
  numbers: "Nampa",
  hearing: "Rongorong",
  speak: "Fos",
  matching: "Fiti",
  unscramble: "Anomu sentence",
  profile: "Porofail",
  admin: "Admin",
  home: "Imw",
  liveQuiz: "Quiz mi live",
  volunteer: "Volunteer",
  more: "More",
  allActivities: "Mettoch meinisin",
  progress: "Progress",
  leaderboard: "Leaderboard",
  leaderboardBadgeDescription: "Nengeni chon suuk meinisin me badge ren non course ra fen fori.",
  curriculum: "Curriculum",
  vocabReady: "vocabulary item ra kan redi fan game.",
  optionalLogin: "Log in ese kan awewe. Iwe epwe chok iseis progress omw.",
  masteredWords: "word ra fen kono",
  noProgressYet: "Ese wor progress tori ikenai",
  currentStreak: "Streak fan itan",
  longestStreak: "Streak nap seni",
  streakDays: "ran",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  selectLanguage: "Language",
  lesson: "Lesson",
  play: "Play",
  homeFlashcardsDesc: "Suuk kapas mi auchea ren kopwe kuna wewen fosin Merika.",
  homeAlphabetDesc: "Suk letter lap me kukkun ngeni audio.",
  homeNumbersDesc: "Practice aninisin nampa seni 1 tori 9000 ngeni audio.",
  homeHearingDesc: "Rongo kapas ra spell letter fengen non omw speed.",
  homeMatchingDesc: "Fiti fosomw ngeni kapasin Merika non esapw fansoun.",
  homeUnscrambleDesc: "Anomu sentence in Merika ngeni order mi pung.",
  homePatternsDesc: "Nengeni lesson sentence pattern ra paralelo.",
  homeLiveQuizDesc: "Join vocabulary challenge mi live me kaeo.",
  conversationPatternsTitle: "Conversation Patterns",
  conversationPatternsSubtitle: "Choose a unit to open the full text-message conversation flow.",
  conversationPatternLanguageLabel: "Pattern image language",
  conversationPatternLanguageEnglish: "English Patterns",
  conversationPatternLanguageSpanish: "Spanish Patterns",
  conversationPatternsLoadError: "Unable to load conversation patterns.",
  conversationUnitLabel: "Unit {unit}",
  conversationLessonsRange: "Lessons {from}-{to}",
  conversationChangeUnit: "Change Unit",
  conversationPersonA: "Person A",
  conversationPersonB: "Person B",
  conversationLessonSlotLabel: "Lesson {lesson} - {slot}",
  conversationPatternImageAlt: "Lesson {lesson} pattern {slot} from {role}",
  conversationNoPatternImages: "No pattern images found for this unit yet.",
  conversationVocabularyTitle: "Vocabulary",
  conversationLessonHeading: "Lesson {lesson}",
  conversationClose: "Close",
  conversationNoVocabularyWords: "No vocabulary words found for this lesson.",
  conversationSpanishShort: "ES",
  conversationPortugueseShort: "PT",
  conversationUnit1Title: "Introducing Myself",
  conversationUnit2Title: "Describing Family & Things",
  conversationUnit3Title: "Talking About My Day",
  conversationUnit4Title: "Describing My Job and What I Eat",
  conversationUnit5Title: "Describing My Home",
  conversationUnit6Title: "Talking About My Health & Community",
};

export const dictionary: Record<Language, Dictionary> = {
  ...baseDictionary,
  sw: swDictionary,
  chk: chkDictionary,
};

export function t(language: Language) {
  return dictionary[language];
}
