import type { SessionStatus, StudySessionInput } from "@/types/study-session";

const statuses: SessionStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"];

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function parseOptionalHours(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

function parseHours(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseStudySessionInput(payload: unknown): { data?: StudySessionInput; error?: string } {
  if (!payload || typeof payload !== "object") return { error: "Dados da sessão inválidos." };
  const input = payload as Record<string, unknown>;

  const studyDate = String(input.studyDate ?? "").trim();
  const courseId = String(input.courseId ?? "").trim();
  const topic = String(input.topic ?? "").trim().replace(/\s+/g, " ");
  const plannedHours = parseOptionalHours(input.plannedHours);
  const studiedHours = parseHours(input.studiedHours);
  const status = input.status as SessionStatus;
  const studyTypeId = String(input.studyTypeId ?? "").trim();
  const notes = nullableText(input.notes);

  if (!validDate(studyDate)) return { error: "Informe uma data de estudo válida." };
  if (!courseId) return { error: "Selecione um curso." };
  if (topic.length < 2 || topic.length > 240) return { error: "O módulo ou assunto deve ter entre 2 e 240 caracteres." };
  if (plannedHours !== null && (!Number.isFinite(plannedHours) || plannedHours < 0 || plannedHours > 24)) return { error: "As horas planejadas devem estar entre 0 e 24." };
  if (!Number.isFinite(studiedHours) || studiedHours < 0 || studiedHours > 24) return { error: "As horas estudadas devem estar entre 0 e 24." };
  if (!statuses.includes(status)) return { error: "Selecione um status válido." };
  if (!studyTypeId) return { error: "Selecione um tipo de estudo." };
  if (notes && notes.length > 5000) return { error: "As observações podem ter no máximo 5.000 caracteres." };

  return {
    data: {
      studyDate,
      courseId,
      topic,
      plannedHours,
      studiedHours,
      status,
      studyTypeId,
      notes,
    },
  };
}

export function studySessionInputToDatabase(input: StudySessionInput) {
  return {
    study_date: input.studyDate,
    course_id: input.courseId,
    topic: input.topic,
    planned_hours: input.plannedHours,
    studied_hours: input.studiedHours,
    status: input.status,
    study_type_id: input.studyTypeId,
    notes: input.notes,
  };
}
