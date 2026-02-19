export type CsvRow = Record<string, string>;

function normalizeLineEndings(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseCsvCells(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsv(input: string): CsvRow[] {
  const normalized = normalizeLineEndings(input).trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headers = parseCsvCells(lines[0]).map((header) => header.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvCells(lines[i]);
    if (values.every((value) => value === "")) {
      continue;
    }

    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j += 1) {
      const key = headers[j];
      row[key] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}
