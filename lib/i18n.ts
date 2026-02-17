import { Language } from "@/lib/types";

export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

type Dictionary = {
  appName: string;
  tagline: string;
  flashcards: string;
  matching: string;
  unscramble: string;
  profile: string;
  admin: string;
  home: string;
  progress: string;
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
  play: string;
  curriculum: string;
  vocabReady: string;
  progressActive: string;
  homeFlashcardsDesc: string;
  homeMatchingDesc: string;
  homeUnscrambleDesc: string;
  themeToggle: string;
  adminManageLessonsDesc: string;
  adminAddVocabDesc: string;
  adminAddSentenceDesc: string;
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
  loggedInAs: string;
  gamesOpenNotice: string;
  createLessonFirst: string;
  uploadFailed: string;
  lessonAdded: string;
  vocabAdded: string;
  sentenceAdded: string;
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
  allLessons: string;
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
  flipToRate: string;
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
};

export const dictionary: Record<Language, Dictionary> = {
  en: {
    appName: "EnglishConnect Buddy",
    tagline: "Learn English with quick games and lessons",
    flashcards: "Flashcards",
    matching: "Matching",
    unscramble: "Unscramble",
    profile: "Profile",
    admin: "Admin",
    home: "Home",
    progress: "Progress",
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
    reveal: "Reveal",
    selectLanguage: "Language",
    adminPanel: "Admin Panel",
    addLesson: "Add Lesson",
    addVocab: "Add Vocabulary",
    addSentence: "Add Sentence",
    play: "Play",
    curriculum: "Curriculum",
    vocabReady: "vocabulary items ready for gameplay.",
    progressActive: "Progress saving is active.",
    homeFlashcardsDesc: "Learn key words by revealing English meanings.",
    homeMatchingDesc: "Match your language to English words quickly.",
    homeUnscrambleDesc: "Build correct English sentence order.",
    themeToggle: "Toggle dark mode",
    adminManageLessonsDesc: "Manage EnglishConnect lessons.",
    adminAddVocabDesc: "Add vocabulary words, audio and images.",
    adminAddSentenceDesc: "Add sentence scramble practice.",
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
    loggedInAs: "Logged in as",
    gamesOpenNotice: "All games are open without login. Login only saves progress and admin access.",
    createLessonFirst: "Please create a lesson first.",
    uploadFailed: "Upload failed.",
    lessonAdded: "Lesson added.",
    vocabAdded: "Vocabulary added.",
    sentenceAdded: "Sentence added.",
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
    allLessons: "All Lessons",
    cardMode: "Card Mode",
    modeImageAudio: "Picture front / Audio back",
    modeImageText: "Picture front / Text back",
    modeAudioText: "Audio front / Text back",
    modeTextTranslation: "Text front / Translation back",
    noImageAvailable: "No image available",
    showFront: "Show Front",
    flipCard: "Flip Card",
    dictionary: "Dictionary",
    ratingGotIt: "I've got it",
    ratingKindOf: "Kind of",
    ratingKeepInDeck: "Keep in deck",
    flipToRate: "Flip card to rate",
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
  },
  es: {
    appName: "EnglishConnect Buddy",
    tagline: "Aprende inglés con juegos y lecciones rápidas",
    flashcards: "Tarjetas",
    matching: "Relacionar",
    unscramble: "Ordenar",
    profile: "Perfil",
    admin: "Admin",
    home: "Inicio",
    progress: "Progreso",
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
    reveal: "Mostrar",
    selectLanguage: "Idioma",
    adminPanel: "Panel Admin",
    addLesson: "Agregar Lección",
    addVocab: "Agregar Vocabulario",
    addSentence: "Agregar Oración",
    play: "Jugar",
    curriculum: "Currículo",
    vocabReady: "elementos de vocabulario listos para practicar.",
    progressActive: "El guardado de progreso está activo.",
    homeFlashcardsDesc: "Aprende palabras clave revelando su significado en inglés.",
    homeMatchingDesc: "Relaciona rápidamente tu idioma con palabras en inglés.",
    homeUnscrambleDesc: "Construye el orden correcto de las oraciones en inglés.",
    themeToggle: "Cambiar modo oscuro",
    adminManageLessonsDesc: "Gestiona las lecciones de EnglishConnect.",
    adminAddVocabDesc: "Agrega vocabulario, audio e imágenes.",
    adminAddSentenceDesc: "Agrega práctica de ordenar oraciones.",
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
    loggedInAs: "Conectado como",
    gamesOpenNotice: "Todos los juegos están abiertos sin inicio de sesión. Iniciar sesión solo guarda progreso y acceso admin.",
    createLessonFirst: "Primero crea una lección.",
    uploadFailed: "Error al subir archivos.",
    lessonAdded: "Lección agregada.",
    vocabAdded: "Vocabulario agregado.",
    sentenceAdded: "Oración agregada.",
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
    allLessons: "Todas las lecciones",
    cardMode: "Modo de tarjeta",
    modeImageAudio: "Imagen frente / Audio atrás",
    modeImageText: "Imagen frente / Texto atrás",
    modeAudioText: "Audio frente / Texto atrás",
    modeTextTranslation: "Texto frente / Traducción atrás",
    noImageAvailable: "Imagen no disponible",
    showFront: "Mostrar frente",
    flipCard: "Voltear tarjeta",
    dictionary: "Diccionario",
    ratingGotIt: "Ya lo sé",
    ratingKindOf: "Más o menos",
    ratingKeepInDeck: "Mantener en mazo",
    flipToRate: "Voltea la tarjeta para calificar",
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
  },
  pt: {
    appName: "EnglishConnect Buddy",
    tagline: "Aprenda inglês com jogos e lições rápidas",
    flashcards: "Cartões",
    matching: "Combinar",
    unscramble: "Ordenar",
    profile: "Perfil",
    admin: "Admin",
    home: "Início",
    progress: "Progresso",
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
    reveal: "Mostrar",
    selectLanguage: "Idioma",
    adminPanel: "Painel Admin",
    addLesson: "Adicionar Lição",
    addVocab: "Adicionar Vocabulário",
    addSentence: "Adicionar Frase",
    play: "Jogar",
    curriculum: "Currículo",
    vocabReady: "itens de vocabulário prontos para prática.",
    progressActive: "Salvar progresso está ativo.",
    homeFlashcardsDesc: "Aprenda palavras-chave revelando significados em inglês.",
    homeMatchingDesc: "Combine rapidamente seu idioma com palavras em inglês.",
    homeUnscrambleDesc: "Monte a ordem correta das frases em inglês.",
    themeToggle: "Alternar modo escuro",
    adminManageLessonsDesc: "Gerencie as lições do EnglishConnect.",
    adminAddVocabDesc: "Adicione vocabulário, áudio e imagens.",
    adminAddSentenceDesc: "Adicione prática de ordenar frases.",
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
    loggedInAs: "Conectado como",
    gamesOpenNotice: "Todos os jogos estão abertos sem login. O login salva apenas progresso e acesso admin.",
    createLessonFirst: "Crie uma lição primeiro.",
    uploadFailed: "Falha no upload.",
    lessonAdded: "Lição adicionada.",
    vocabAdded: "Vocabulário adicionado.",
    sentenceAdded: "Frase adicionada.",
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
    allLessons: "Todas as lições",
    cardMode: "Modo do cartão",
    modeImageAudio: "Imagem frente / Áudio verso",
    modeImageText: "Imagem frente / Texto verso",
    modeAudioText: "Áudio frente / Texto verso",
    modeTextTranslation: "Texto frente / Tradução verso",
    noImageAvailable: "Imagem indisponível",
    showFront: "Mostrar frente",
    flipCard: "Virar cartão",
    dictionary: "Dicionário",
    ratingGotIt: "Já sei",
    ratingKindOf: "Mais ou menos",
    ratingKeepInDeck: "Manter no baralho",
    flipToRate: "Vire o cartão para avaliar",
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
  },
};

export function t(language: Language) {
  return dictionary[language];
}
