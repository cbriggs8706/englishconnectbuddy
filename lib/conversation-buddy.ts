// locale-check: ignore - swap option payloads are en/es/pt today; sw/chk intentionally fall back to en.
import { Language } from "@/lib/types";

export type ConversationKind = "question" | "answer";

export type SwapOption = {
  id: string;
  en: string;
  es: string;
  pt: string;
};

export type SwapGroup = {
  key: string;
  label: string;
  default_option_id?: string;
  options: SwapOption[];
};

export type ConversationPhraseRow = {
  id: string;
  course: string;
  lesson: number;
  pattern_slot: number | null;
  kind: ConversationKind | null;
  template_en: string | null;
  template_es: string | null;
  template_pt: string | null;
  swap_groups: unknown;
  created_at: string;
  updated_at: string;
};

export function extractTemplateKeys(template: string) {
  const keys = new Set<string>();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(template);
  while (match) {
    keys.add(match[1]);
    match = pattern.exec(template);
  }
  return Array.from(keys.values());
}

export function normalizeSwapGroups(value: unknown): SwapGroup[] {
  if (!Array.isArray(value)) return [];

  const groups: SwapGroup[] = [];
  for (const rawGroup of value) {
    if (!rawGroup || typeof rawGroup !== "object") continue;
    const group = rawGroup as Record<string, unknown>;
    const key = typeof group.key === "string" ? group.key.trim() : "";
    if (!key) continue;

    const label = typeof group.label === "string" && group.label.trim().length > 0 ? group.label.trim() : key;
    const defaultOptionId =
      typeof group.default_option_id === "string" && group.default_option_id.trim().length > 0
        ? group.default_option_id.trim()
        : undefined;

    const optionsRaw = Array.isArray(group.options) ? group.options : [];
    const options: SwapOption[] = [];
    for (const rawOption of optionsRaw) {
      if (!rawOption || typeof rawOption !== "object") continue;
      const option = rawOption as Record<string, unknown>;
      const id = typeof option.id === "string" ? option.id.trim() : "";
      const en = typeof option.en === "string" ? option.en.trim() : "";
      const es = typeof option.es === "string" ? option.es.trim() : "";
      const pt = typeof option.pt === "string" ? option.pt.trim() : "";
      if (!id || !en || !es || !pt) continue;
      options.push({ id, en, es, pt });
    }

    if (options.length === 0) continue;
    groups.push({
      key,
      label,
      default_option_id: defaultOptionId,
      options,
    });
  }

  return groups;
}

export function resolveTemplate(row: ConversationPhraseRow, language: Language) {
  if (language === "es") return row.template_es || row.template_en || "";
  if (language === "pt") return row.template_pt || row.template_en || "";
  if (language === "sw") return row.template_en || "";
  if (language === "chk") return row.template_en || "";
  return row.template_en || "";
}

export function renderTemplate(template: string, groups: SwapGroup[], selectedOptions: Record<string, string>, language: Language) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    const group = groups.find((entry) => entry.key === key);
    if (!group) return "";
    const selectedId = selectedOptions[key];
    const selected = group.options.find((option) => option.id === selectedId) || group.options[0];
    if (!selected) return "";
    if (language === "es") return selected.es;
    if (language === "pt") return selected.pt;
    if (language === "sw") return selected.en;
    if (language === "chk") return selected.en;
    return selected.en;
  });
}

export function defaultSelections(groups: SwapGroup[]) {
  const selections: Record<string, string> = {};
  for (const group of groups) {
    const explicit = group.default_option_id ? group.options.find((option) => option.id === group.default_option_id) : undefined;
    selections[group.key] = explicit?.id ?? group.options[0]?.id ?? "";
  }
  return selections;
}

export function validateTemplateCoverage(rows: Array<{ label: string; template: string }>, groups: SwapGroup[]) {
  const groupKeys = new Set(groups.map((group) => group.key));
  const errors: string[] = [];

  for (const row of rows) {
    const keys = extractTemplateKeys(row.template);
    for (const key of keys) {
      if (!groupKeys.has(key)) {
        errors.push(`${row.label} uses placeholder "${key}" but swap_groups has no matching key.`);
      }
    }
  }

  return errors;
}
