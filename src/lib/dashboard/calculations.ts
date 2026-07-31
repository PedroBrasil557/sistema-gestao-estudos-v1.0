import type { CourseStatus } from "@/types/course";
import type { DashboardRange } from "@/types/dashboard";
import { addDays, dateFromKey, dateKey } from "@/lib/study-sessions/analytics";

export const courseStatusLabels: Record<CourseStatus, string> = {
  PLANNED: "Planejado",
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const priorityWeight = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export function parseDateKey(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = dateFromKey(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

export function startOfMonth(value: string) {
  return `${value.slice(0, 7)}-01`;
}

export function startOfYear(value: string) {
  return `${value.slice(0, 4)}-01-01`;
}

export function endOfMonth(value: string) {
  const [year, month] = value.slice(0, 7).split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1, 12));
  next.setUTCDate(0);
  return dateKey(next);
}

export function resolvePeriod(range: DashboardRange, today: string, customStart: string | null, customEnd: string | null) {
  if (range === "7d") return { start: addDays(today, -6), end: today };
  if (range === "30d") return { start: addDays(today, -29), end: today };
  if (range === "month") return { start: startOfMonth(today), end: today };
  if (range === "year") return { start: startOfYear(today), end: today };
  if (range === "custom") {
    const start = parseDateKey(customStart);
    const end = parseDateKey(customEnd);
    if (start && end && start <= end) return { start, end };
    return { start: addDays(today, -29), end: today };
  }
  return { start: null, end: null };
}

export function formatDatePt(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatPeriodLabel(range: DashboardRange, start: string | null, end: string | null) {
  const name: Record<Exclude<DashboardRange, "custom">, string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    month: "Mês atual",
    year: "Ano atual",
    all: "Todo o período",
  };
  if (range !== "custom") return name[range];
  if (!start || !end) return "Período personalizado";
  return `${formatDatePt(start)} a ${formatDatePt(end)}`;
}

export function monthsCovered(start: string | null, end: string | null, dates: string[]) {
  if (start && end) {
    const startDate = dateFromKey(start);
    const endDate = dateFromKey(end);
    return Math.max(1, (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + endDate.getUTCMonth() - startDate.getUTCMonth() + 1);
  }
  const months = new Set(dates.filter(Boolean).map((date) => date.slice(0, 7)));
  return Math.max(1, months.size);
}

export function monthSequence(start: string | null, end: string | null, availableDates: string[], maxItems = 12) {
  let first = start;
  let last = end;
  if (!first || !last) {
    const sorted = availableDates.filter(Boolean).sort();
    if (!sorted.length) return [];
    first = `${sorted[0].slice(0, 7)}-01`;
    last = `${sorted[sorted.length - 1].slice(0, 7)}-01`;
  }
  const [startYear, startMonth] = first.slice(0, 7).split("-").map(Number);
  const [endYear, endMonth] = last.slice(0, 7).split("-").map(Number);
  const result: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) { month = 1; year += 1; }
    if (result.length > 240) break;
  }
  return result.slice(-maxItems);
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1, 12))).replace(".", "");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}/${String(year).slice(-2)}`;
}
