export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const normalized = Array.isArray(value)
    ? value.join("; ")
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  // Neutraliza CSV/formula injection: valores iniciando com = + - @ TAB ou CR
  // podem ser interpretados como fórmula pelo Excel/LibreOffice. Prefixa com '.
  const guarded = /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;
  const escaped = guarded.replace(/"/g, '""');
  return /[",\n\r;]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(";");
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(";"));
  return [header, ...body].join("\r\n");
}

export function safeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
