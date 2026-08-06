import type { LanguageSkill, SessionStatus, StudySessionInput } from "@/types/study-session";

const statuses: SessionStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"];
const skills: LanguageSkill[] = ["READING", "WRITING", "SPEAKING", "LISTENING", "PRONUNCIATION", "GRAMMAR", "VOCABULARY", "REVIEW"];

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

function validTime(value: string | null) {
  return value === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseStudySessionInput(payload: unknown): { data?: StudySessionInput; error?: string } {
  if (!payload || typeof payload !== "object") return { error: "Dados da sessão inválidos." };
  const input = payload as Record<string, unknown>;

  const studyDate = String(input.studyDate ?? "").trim();
  const scheduledTime = nullableText(input.scheduledTime);
  const courseId = String(input.courseId ?? "").trim();
  const topic = String(input.topic ?? "").trim().replace(/\s+/g, " ");
  const plannedHours = parseOptionalHours(input.plannedHours);
  const studiedHours = parseHours(input.studiedHours);
  const status = input.status as SessionStatus;
  const languageSkill = nullableText(input.languageSkill) as LanguageSkill | null;
  const studyTypeId = String(input.studyTypeId ?? "").trim();
  const resource = nullableText(input.resource);
  const recurrenceRule = nullableText(input.recurrenceRule);
  const reminderAt = nullableText(input.reminderAt);
  const notes = nullableText(input.notes);

  if (!validDate(studyDate)) return { error: "Informe uma data de estudo válida." };
  if (!validTime(scheduledTime)) return { error: "Informe um horário válido." };
  if (!courseId) return { error: "Selecione um curso." };
  if (topic.length < 2 || topic.length > 240) return { error: "A atividade ou assunto deve ter entre 2 e 240 caracteres." };
  if (plannedHours !== null && (!Number.isFinite(plannedHours) || plannedHours < 0 || plannedHours > 24)) return { error: "As horas planejadas devem estar entre 0 e 24." };
  if (!Number.isFinite(studiedHours) || studiedHours < 0 || studiedHours > 24) return { error: "As horas estudadas devem estar entre 0 e 24." };
  if (!statuses.includes(status)) return { error: "Selecione um status válido." };
  if (languageSkill && !skills.includes(languageSkill)) return { error: "Selecione uma habilidade de idioma válida." };
  if (!studyTypeId) return { error: "Selecione um tipo de estudo." };
  if (resource && resource.length > 500) return { error: "O recurso pode ter no máximo 500 caracteres." };
  if (recurrenceRule && recurrenceRule.length > 200) return { error: "A recorrência pode ter no máximo 200 caracteres." };
  if (notes && notes.length > 5000) return { error: "As observações podem ter no máximo 5.000 caracteres." };

  return {
    data: {
      studyDate,
      scheduledTime,
      courseId,
      topic,
      plannedHours,
      studiedHours,
      status,
      languageSkill,
      studyTypeId,
      resource,
      recurrenceRule,
      reminderAt,
      notes,
    },
  };
}

export function studySessionInputToDatabase(input: StudySessionInput) {
  return {
    study_date: input.studyDate,
    scheduled_time: input.scheduledTime,
    course_id: input.courseId,
    topic: input.topic,
    planned_hours: input.plannedHours,
    studied_hours: input.studiedHours,
    status: input.status,
    language_skill: input.languageSkill,
    study_type_id: input.studyTypeId,
    resource: input.resource,
    recurrence_rule: input.recurrenceRule,
    reminder_at: input.reminderAt,
    notes: input.notes,
  };
}
