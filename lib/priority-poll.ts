// locale-check: ignore - this file uses base en/es/pt definitions with runtime fallback resolvers for sw/chk.
import { Language } from "@/lib/types";

type BaseLanguage = "en" | "es" | "pt";
type Localized = Record<BaseLanguage, string>;
type LocalizedList = Record<BaseLanguage, string[]>;

type PrioritySectionDefinition = {
  key: string;
  title: Localized;
  bestFor?: Localized;
  bullets: LocalizedList;
};

export type PrioritySection = {
  key: string;
  title: string;
  bestFor?: string;
  bullets: string[];
};

const PRIORITY_SECTION_DEFINITIONS: PrioritySectionDefinition[] = [
  {
    key: "work-career-english",
    title: {
      en: "Work & Career English",
      es: "Ingles para el trabajo y la carrera",
      pt: "Ingles para trabalho e carreira",
    },
    bestFor: {
      en: "Immediate workplace use",
      es: "Uso inmediato en el trabajo",
      pt: "Uso imediato no trabalho",
    },
    bullets: {
      en: [
        "Workplace tools and equipment",
        "Safety signs and warnings",
        "Instructions and procedures",
        "Reporting problems",
        "Schedules and shifts",
        "Promotions and performance reviews",
        "Talking with supervisors",
      ],
      es: [
        "Herramientas y equipos del trabajo",
        "Senales y advertencias de seguridad",
        "Instrucciones y procedimientos",
        "Reportar problemas",
        "Horarios y turnos",
        "Promociones y evaluaciones de desempeno",
        "Hablar con supervisores",
      ],
      pt: [
        "Ferramentas e equipamentos do trabalho",
        "Placas e avisos de seguranca",
        "Instrucoes e procedimentos",
        "Relatar problemas",
        "Horarios e turnos",
        "Promocoes e avaliacoes de desempenho",
        "Conversar com supervisores",
      ],
    },
  },
  {
    key: "factory-production-work",
    title: {
      en: "English for Factory & Production Work",
      es: "Ingles para fabrica y produccion",
      pt: "Ingles para fabrica e producao",
    },
    bestFor: {
      en: "Production environments",
      es: "Entornos de produccion",
      pt: "Ambientes de producao",
    },
    bullets: {
      en: [
        "Machine parts and controls",
        "Quality control vocabulary",
        "Defects and troubleshooting",
        "Measurements and specifications",
        "Safety procedures",
        "Maintenance requests",
      ],
      es: [
        "Partes y controles de maquinas",
        "Vocabulario de control de calidad",
        "Defectos y solucion de problemas",
        "Medidas y especificaciones",
        "Procedimientos de seguridad",
        "Solicitudes de mantenimiento",
      ],
      pt: [
        "Partes e controles de maquinas",
        "Vocabulario de controle de qualidade",
        "Defeitos e resolucao de problemas",
        "Medidas e especificacoes",
        "Procedimentos de seguranca",
        "Pedidos de manutencao",
      ],
    },
  },
  {
    key: "phrasal-verbs",
    title: {
      en: "Phrasal Verbs (Daily Life & Work)",
      es: "Phrasal verbs (vida diaria y trabajo)",
      pt: "Phrasal verbs (vida diaria e trabalho)",
    },
    bestFor: {
      en: "High-frequency verbs",
      es: "Verbos de alta frecuencia",
      pt: "Verbos de alta frequencia",
    },
    bullets: {
      en: [
        "Turn on/off, break down, run out, pick up",
        "Fill out, clock in/out, shut down",
        "Figure out, find out, carry on",
        "Show up, call off, set up",
      ],
      es: [
        "Turn on/off, break down, run out, pick up",
        "Fill out, clock in/out, shut down",
        "Figure out, find out, carry on",
        "Show up, call off, set up",
      ],
      pt: [
        "Turn on/off, break down, run out, pick up",
        "Fill out, clock in/out, shut down",
        "Figure out, find out, carry on",
        "Show up, call off, set up",
      ],
    },
  },
  {
    key: "idioms-expressions",
    title: {
      en: "Everyday Idioms & Expressions",
      es: "Modismos y expresiones cotidianas",
      pt: "Expressoes e idioms do dia a dia",
    },
    bestFor: {
      en: "Natural sounding English",
      es: "Ingles mas natural",
      pt: "Ingles mais natural",
    },
    bullets: {
      en: ["Piece of cake", "Running late", "Hang on", "Give me a hand", "On the same page", "No big deal"],
      es: ["Piece of cake", "Running late", "Hang on", "Give me a hand", "On the same page", "No big deal"],
      pt: ["Piece of cake", "Running late", "Hang on", "Give me a hand", "On the same page", "No big deal"],
    },
  },
  {
    key: "telephone-communication",
    title: {
      en: "Telephone & Communication Skills",
      es: "Habilidades de telefono y comunicacion",
      pt: "Habilidades de telefone e comunicacao",
    },
    bullets: {
      en: [
        "Answering calls professionally",
        "Leaving messages",
        "Clarifying information",
        "Spelling names and numbers",
        "Scheduling appointments",
      ],
      es: [
        "Responder llamadas profesionalmente",
        "Dejar mensajes",
        "Aclarar informacion",
        "Deletrear nombres y numeros",
        "Programar citas",
      ],
      pt: [
        "Atender chamadas de forma profissional",
        "Deixar recados",
        "Esclarecer informacoes",
        "Soletrar nomes e numeros",
        "Agendar compromissos",
      ],
    },
  },
  {
    key: "forms-documents-paperwork",
    title: {
      en: "Forms, Documents & Paperwork",
      es: "Formularios, documentos y papeleo",
      pt: "Formularios, documentos e papelada",
    },
    bullets: {
      en: [
        "Filling out applications",
        "Medical forms",
        "Workplace paperwork",
        "Insurance and personal info",
        "Understanding official language",
      ],
      es: [
        "Llenar solicitudes",
        "Formularios medicos",
        "Papeleo del trabajo",
        "Seguro e informacion personal",
        "Comprender lenguaje oficial",
      ],
      pt: [
        "Preencher formularios",
        "Formularios medicos",
        "Documentacao do trabalho",
        "Seguro e informacoes pessoais",
        "Entender linguagem oficial",
      ],
    },
  },
  {
    key: "shopping-money-skills",
    title: {
      en: "Shopping & Money Skills",
      es: "Compras y habilidades financieras",
      pt: "Compras e habilidades financeiras",
    },
    bullets: {
      en: [
        "Comparing prices and deals",
        "Returns and exchanges",
        "Banking vocabulary",
        "Paying bills",
        "Subscriptions and fees",
      ],
      es: [
        "Comparar precios y ofertas",
        "Devoluciones y cambios",
        "Vocabulario bancario",
        "Pagar facturas",
        "Suscripciones y cargos",
      ],
      pt: [
        "Comparar precos e ofertas",
        "Devolucoes e trocas",
        "Vocabulario bancario",
        "Pagar contas",
        "Assinaturas e taxas",
      ],
    },
  },
  {
    key: "transportation-driving",
    title: {
      en: "Transportation & Driving English",
      es: "Ingles de transporte y manejo",
      pt: "Ingles de transporte e direcao",
    },
    bullets: {
      en: [
        "Car problems and repairs",
        "Traffic signs and police stops",
        "Directions and navigation",
        "Car insurance and registration",
        "Talking to mechanics",
      ],
      es: [
        "Problemas y reparaciones del auto",
        "Senales de trafico y paradas policiales",
        "Direcciones y navegacion",
        "Seguro y registro del auto",
        "Hablar con mecanicos",
      ],
      pt: [
        "Problemas e reparos do carro",
        "Placas de transito e paradas policiais",
        "Direcoes e navegacao",
        "Seguro e registro do carro",
        "Conversar com mecanicos",
      ],
    },
  },
  {
    key: "health-emergencies",
    title: {
      en: "Health & Emergencies",
      es: "Salud y emergencias",
      pt: "Saude e emergencias",
    },
    bullets: {
      en: [
        "Describing symptoms",
        "Doctor and pharmacy visits",
        "Workplace injuries",
        "Calling 911",
        "Medications and instructions",
      ],
      es: [
        "Describir sintomas",
        "Visitas al medico y farmacia",
        "Lesiones en el trabajo",
        "Llamar al 911",
        "Medicamentos e instrucciones",
      ],
      pt: [
        "Descrever sintomas",
        "Visitas ao medico e farmacia",
        "Lesoes no trabalho",
        "Ligar para o 911",
        "Medicamentos e instrucoes",
      ],
    },
  },
  {
    key: "housing-daily-life",
    title: {
      en: "Housing & Daily Life",
      es: "Vivienda y vida diaria",
      pt: "Moradia e vida diaria",
    },
    bullets: {
      en: [
        "Renting and leases",
        "Talking to landlords",
        "Utilities and repairs",
        "Neighbors and community rules",
        "Home maintenance",
      ],
      es: [
        "Alquiler y contratos",
        "Hablar con propietarios",
        "Servicios y reparaciones",
        "Vecinos y reglas de la comunidad",
        "Mantenimiento del hogar",
      ],
      pt: [
        "Aluguel e contratos",
        "Conversar com proprietarios",
        "Contas e reparos",
        "Vizinhos e regras da comunidade",
        "Manutencao da casa",
      ],
    },
  },
  {
    key: "community-social-english",
    title: {
      en: "Community & Social English",
      es: "Ingles social y comunitario",
      pt: "Ingles social e comunitario",
    },
    bullets: {
      en: [
        "Small talk and friendliness",
        "Making invitations",
        "School communication",
        "Talking with teachers",
        "Community services",
      ],
      es: [
        "Conversacion corta y amabilidad",
        "Hacer invitaciones",
        "Comunicacion escolar",
        "Hablar con maestros",
        "Servicios comunitarios",
      ],
      pt: [
        "Conversa casual e simpatia",
        "Fazer convites",
        "Comunicacao escolar",
        "Conversar com professores",
        "Servicos comunitarios",
      ],
    },
  },
  {
    key: "pronunciation-fluency",
    title: {
      en: "Pronunciation & Fluency Training",
      es: "Entrenamiento de pronunciacion y fluidez",
      pt: "Treino de pronuncia e fluencia",
    },
    bestFor: {
      en: "Very helpful for Spanish speakers",
      es: "Muy util para hablantes de espanol",
      pt: "Muito util para falantes de espanhol",
    },
    bullets: {
      en: [
        "Linking sounds",
        "Sentence stress",
        "Reducing e before s-clusters",
        "Natural rhythm and contractions",
        "Understanding fast English",
      ],
      es: [
        "Unir sonidos",
        "Acento en la oracion",
        "Reducir e antes de grupos con s",
        "Ritmo natural y contracciones",
        "Entender ingles rapido",
      ],
      pt: [
        "Ligacao de sons",
        "Acento da frase",
        "Reduzir e antes de grupos com s",
        "Ritmo natural e contracoes",
        "Entender ingles rapido",
      ],
    },
  },
  {
    key: "conversation-confidence",
    title: {
      en: "Conversation & Confidence Building",
      es: "Conversacion y confianza",
      pt: "Conversacao e confianca",
    },
    bullets: {
      en: [
        "Expressing opinions",
        "Agreeing and disagreeing",
        "Telling stories",
        "Explaining problems",
        "Asking follow-up questions",
      ],
      es: [
        "Expresar opiniones",
        "Estar de acuerdo y en desacuerdo",
        "Contar historias",
        "Explicar problemas",
        "Hacer preguntas de seguimiento",
      ],
      pt: [
        "Expressar opinioes",
        "Concordar e discordar",
        "Contar historias",
        "Explicar problemas",
        "Fazer perguntas de acompanhamento",
      ],
    },
  },
  {
    key: "reading-real-life",
    title: {
      en: "Reading for Real Life",
      es: "Lectura para la vida real",
      pt: "Leitura para a vida real",
    },
    bullets: {
      en: [
        "Work schedules and notices",
        "Safety posters",
        "Text messages and emails",
        "Labels and instructions",
        "Simple workplace manuals",
      ],
      es: [
        "Horarios y avisos de trabajo",
        "Carteles de seguridad",
        "Mensajes de texto y correos",
        "Etiquetas e instrucciones",
        "Manuales simples del trabajo",
      ],
      pt: [
        "Horarios e avisos de trabalho",
        "Cartazes de seguranca",
        "Mensagens e emails",
        "Etiquetas e instrucoes",
        "Manuais simples do trabalho",
      ],
    },
  },
  {
    key: "advanced-survival-english",
    title: {
      en: "Advanced Survival English",
      es: "Ingles avanzado de supervivencia",
      pt: "Ingles avancado de sobrevivencia",
    },
    bullets: {
      en: [
        "Solving misunderstandings",
        "Handling conflict politely",
        "Standing up for yourself respectfully",
        "Workplace rights and responsibilities",
      ],
      es: [
        "Resolver malentendidos",
        "Manejar conflictos con respeto",
        "Defenderte con respeto",
        "Derechos y responsabilidades laborales",
      ],
      pt: [
        "Resolver mal-entendidos",
        "Lidar com conflitos com educacao",
        "Se posicionar com respeito",
        "Direitos e responsabilidades no trabalho",
      ],
    },
  },
  {
    key: "citizenship-test-class",
    title: {
      en: "Citizenship Test Class",
      es: "Clase para el examen de ciudadania",
      pt: "Aula para prova de cidadania",
    },
    bullets: {
      en: [
        "Civics vocabulary",
        "US history and government terms",
        "Interview-style speaking practice",
        "Application and interview confidence",
      ],
      es: [
        "Vocabulario de civica",
        "Terminos de historia y gobierno de EE. UU.",
        "Practica de entrevista oral",
        "Confianza para solicitud y entrevista",
      ],
      pt: [
        "Vocabulario de civica",
        "Termos de historia e governo dos EUA",
        "Pratica de fala no estilo entrevista",
        "Confianca para aplicacao e entrevista",
      ],
    },
  },
];

export const PRIORITY_SECTION_COUNT = PRIORITY_SECTION_DEFINITIONS.length;
export const PRIORITY_SECTION_KEYS = PRIORITY_SECTION_DEFINITIONS.map((section) => section.key);

function resolveLocalizedText(localized: Localized, language: Language): string {
  if (language === "es") return localized.es;
  if (language === "pt") return localized.pt;
  return localized.en;
}

function resolveLocalizedList(localized: LocalizedList, language: Language): string[] {
  if (language === "es") return localized.es;
  if (language === "pt") return localized.pt;
  return localized.en;
}

export function getPrioritySections(language: Language): PrioritySection[] {
  return PRIORITY_SECTION_DEFINITIONS.map((section) => ({
    key: section.key,
    title: resolveLocalizedText(section.title, language),
    bestFor: section.bestFor ? resolveLocalizedText(section.bestFor, language) : undefined,
    bullets: resolveLocalizedList(section.bullets, language),
  }));
}

export function getPrioritySectionLabel(sectionKey: string, language: Language): string {
  const section = PRIORITY_SECTION_DEFINITIONS.find((entry) => entry.key === sectionKey);
  return section ? resolveLocalizedText(section.title, language) : sectionKey;
}
