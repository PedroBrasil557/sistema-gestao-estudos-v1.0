import type { Course } from "@/types/course";

function relation(value: unknown): { id: string; name: string } {
  const row = Array.isArray(value) ? value[0] : value;
  if (row && typeof row === "object") {
    const candidate = row as Record<string, unknown>;
    return {
      id: String(candidate.id ?? ""),
      name: String(candidate.name ?? "Não informado"),
    };
  }
  return { id: "", name: "Não informado" };
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapCourseRow(row: Record<string, unknown>): Course {
  const workloadHours = number(row.workload_hours);
  const studiedHours = number(row.studied_hours);
  const completed = row.status === "COMPLETED";
  const progress = completed ? 100 : workloadHours > 0 ? Math.min((studiedHours / workloadHours) * 100, 100) : 0;

  return {
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as Course["kind"],
    platform: relation(row.platform),
    area: relation(row.area),
    workloadHours,
    studiedHours,
    progress: Math.round(progress * 10) / 10,
    status: row.status as Course["status"],
    priority: row.priority as Course["priority"],
    startDate: typeof row.start_date === "string" ? row.start_date : null,
    targetCompletionDate: typeof row.target_completion_date === "string" ? row.target_completion_date : null,
    completionDate: typeof row.completion_date === "string" ? row.completion_date : null,
    emitsCertificate: Boolean(row.emits_certificate),
    url: typeof row.url === "string" ? row.url : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export const courseSelect = `
  id,
  name,
  kind,
  workload_hours,
  studied_hours,
  status,
  priority,
  start_date,
  target_completion_date,
  completion_date,
  emits_certificate,
  url,
  notes,
  archived_at,
  created_at,
  updated_at,
  platform:platforms!courses_platform_id_fkey(id, name),
  area:areas!courses_area_id_fkey(id, name)
`;
