import type { CourseGroup, CourseInput, CourseKind, CoursePriority, CourseStatus } from "@/types/course";

const kinds: CourseKind[] = ["COURSE", "CERTIFICATION"];
const groups: CourseGroup[] = ["LANGUAGE", "PROFESSIONAL"];
const statuses: CourseStatus[] = ["PLANNED", "NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"];
const priorities: CoursePriority[] = ["HIGH", "MEDIUM", "LOW"];

function normalizedNullable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function validDate(value: string | null) {
  return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resourceList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
}

export function parseCourseInput(payload: unknown): { data?: CourseInput; error?: string } {
  if (!payload || typeof payload !== "object") return { error: "Dados do curso inválidos." };
  const input = payload as Record<string, unknown>;

  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const kind = input.kind as CourseKind;
  const group = input.group as CourseGroup;
  const color = String(input.color ?? "#2F6BFF").trim().toUpperCase();
  const icon = String(input.icon ?? "book-open").trim().slice(0, 60);
  const weeklyGoalMinutes = Number(input.weeklyGoalMinutes ?? 0);
  const currentLevel = normalizedNullable(input.currentLevel);
  const targetLevel = normalizedNullable(input.targetLevel);
  const objective = normalizedNullable(input.objective);
  const complementaryResources = resourceList(input.complementaryResources);
  const platformId = String(input.platformId ?? "").trim();
  const areaId = String(input.areaId ?? "").trim();
  const workloadHours = Number(input.workloadHours ?? 0);
  const status = input.status as CourseStatus;
  const priority = input.priority as CoursePriority;
  const startDate = normalizedNullable(input.startDate);
  const targetCompletionDate = normalizedNullable(input.targetCompletionDate);
  const completionDate = normalizedNullable(input.completionDate);
  const emitsCertificate = Boolean(input.emitsCertificate);
  const url = normalizedNullable(input.url);
  const notes = normalizedNullable(input.notes);

  if (name.length < 2 || name.length > 160) return { error: "O nome deve ter entre 2 e 160 caracteres." };
  if (!kinds.includes(kind)) return { error: "Selecione um tipo de registro válido." };
  if (!groups.includes(group)) return { error: "Selecione Idioma ou Profissionalizante." };
  if (!/^#[0-9A-F]{6}$/.test(color)) return { error: "Selecione uma cor válida." };
  if (!platformId) return { error: "Selecione uma plataforma." };
  if (!areaId) return { error: "Selecione uma área." };
  if (!Number.isFinite(weeklyGoalMinutes) || weeklyGoalMinutes < 0 || weeklyGoalMinutes > 10080) return { error: "A meta semanal deve estar entre 0 e 10.080 minutos." };
  if (!Number.isFinite(workloadHours) || workloadHours < 0 || workloadHours > 9999.99) return { error: "A carga horária deve estar entre 0 e 9.999,99 horas." };
  if (!statuses.includes(status)) return { error: "Selecione um status válido." };
  if (!priorities.includes(priority)) return { error: "Selecione uma prioridade válida." };
  if (![startDate, targetCompletionDate, completionDate].every(validDate)) return { error: "Informe datas válidas." };
  if (targetCompletionDate && startDate && targetCompletionDate < startDate) return { error: "A meta de conclusão não pode ser anterior à data de início." };
  if (completionDate && startDate && completionDate < startDate) return { error: "A conclusão não pode ser anterior à data de início." };
  if (status === "IN_PROGRESS" && !startDate) return { error: "Informe a data de início para um curso em andamento." };
  if (status === "COMPLETED" && !completionDate) return { error: "Informe a data de conclusão para um curso concluído." };
  if (!validUrl(url)) return { error: "Informe um link válido iniciado por http:// ou https://." };
  if (notes && notes.length > 5000) return { error: "As observações podem ter no máximo 5.000 caracteres." };
  if (objective && objective.length > 2000) return { error: "O objetivo pode ter no máximo 2.000 caracteres." };

  return {
    data: {
      name,
      kind,
      group,
      color,
      icon: icon || "book-open",
      weeklyGoalMinutes: Math.round(weeklyGoalMinutes),
      currentLevel,
      targetLevel,
      objective,
      complementaryResources,
      platformId,
      areaId,
      workloadHours: Math.round(workloadHours * 100) / 100,
      status,
      priority,
      startDate,
      targetCompletionDate,
      completionDate,
      emitsCertificate,
      url,
      notes,
    },
  };
}

export function courseInputToDatabase(input: CourseInput) {
  return {
    name: input.name,
    normalized_name: input.name,
    kind: input.kind,
    course_group: input.group,
    color: input.color,
    icon: input.icon,
    weekly_goal_minutes: input.weeklyGoalMinutes,
    current_level: input.group === "LANGUAGE" ? input.currentLevel : null,
    target_level: input.group === "LANGUAGE" ? input.targetLevel : null,
    objective: input.objective,
    complementary_resources: input.complementaryResources,
    platform_id: input.platformId,
    area_id: input.areaId,
    workload_hours: input.group === "LANGUAGE" ? 0 : input.workloadHours,
    status: input.status,
    priority: input.priority,
    start_date: input.startDate,
    target_completion_date: input.group === "LANGUAGE" ? null : input.targetCompletionDate,
    completion_date: input.status === "COMPLETED" ? input.completionDate : null,
    emits_certificate: input.group === "LANGUAGE" ? false : input.emitsCertificate,
    url: input.url,
    notes: input.notes,
  };
}
