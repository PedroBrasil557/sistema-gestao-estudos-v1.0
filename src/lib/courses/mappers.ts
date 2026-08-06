import type { Course } from "@/types/course";
import { isLanguageName, suggestedCourseColor } from "@/lib/visuals";

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

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
}

export function mapCourseRow(row: Record<string, unknown>): Course {
  const workloadHours = number(row.workload_hours);
  const studiedHours = number(row.studied_hours);
  const completed = row.status === "COMPLETED";
  const progress = completed ? 100 : workloadHours > 0 ? Math.min((studiedHours / workloadHours) * 100, 100) : 0;
  const platform = relation(row.platform);
  const area = relation(row.area);
  const name = String(row.name ?? "Curso");

  return {
    id: String(row.id),
    name,
    kind: row.kind as Course["kind"],
    group: row.course_group === "LANGUAGE" || (row.course_group == null && isLanguageName(name, area.name)) ? "LANGUAGE" : "PROFESSIONAL",
    color: typeof row.color === "string" ? row.color : suggestedCourseColor(name, area.name),
    icon: typeof row.icon === "string" ? row.icon : "book-open",
    weeklyGoalMinutes: number(row.weekly_goal_minutes),
    currentLevel: typeof row.current_level === "string" ? row.current_level : null,
    targetLevel: typeof row.target_level === "string" ? row.target_level : null,
    objective: typeof row.objective === "string" ? row.objective : null,
    complementaryResources: stringArray(row.complementary_resources),
    platform,
    area,
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
  course_group,
  color,
  icon,
  weekly_goal_minutes,
  current_level,
  target_level,
  objective,
  complementary_resources,
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
