import type { StudySession } from "@/types/study-session";
import { isLanguageName, suggestedCourseColor } from "@/lib/visuals";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function time(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  return value.slice(0, 5);
}

export function mapStudySessionRow(row: Record<string, unknown>): StudySession {
  const course = relation(row.course);
  const area = relation(course.area);
  const studyType = relation(row.study_type);
  const courseName = String(course.name ?? "Curso não informado");
  const areaName = String(area.name ?? "Área não informada");

  return {
    id: String(row.id ?? ""),
    studyDate: String(row.study_date ?? ""),
    scheduledTime: time(row.scheduled_time),
    topic: String(row.topic ?? ""),
    plannedHours: row.planned_hours === null || row.planned_hours === undefined ? null : numeric(row.planned_hours),
    studiedHours: numeric(row.studied_hours),
    status: row.status as StudySession["status"],
    languageSkill: typeof row.language_skill === "string" ? row.language_skill as StudySession["languageSkill"] : null,
    resource: typeof row.resource === "string" ? row.resource : null,
    recurrenceRule: typeof row.recurrence_rule === "string" ? row.recurrence_rule : null,
    reminderAt: typeof row.reminder_at === "string" ? row.reminder_at : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    deletedAt: typeof row.deleted_at === "string" ? row.deleted_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    course: {
      id: String(course.id ?? ""),
      name: courseName,
      group: course.course_group === "LANGUAGE" || (course.course_group == null && isLanguageName(courseName, areaName)) ? "LANGUAGE" : "PROFESSIONAL",
      color: typeof course.color === "string" ? course.color : suggestedCourseColor(courseName, areaName),
      icon: typeof course.icon === "string" ? course.icon : "book-open",
      weeklyGoalMinutes: numeric(course.weekly_goal_minutes),
      status: course.status as StudySession["course"]["status"],
      priority: course.priority as StudySession["course"]["priority"],
      workloadHours: numeric(course.workload_hours),
      studiedHours: numeric(course.studied_hours),
      area: {
        id: String(area.id ?? ""),
        name: areaName,
      },
    },
    studyType: {
      id: String(studyType.id ?? ""),
      name: String(studyType.name ?? "Tipo não informado"),
    },
  };
}

export const studySessionSelect = `
  id,
  study_date,
  scheduled_time,
  topic,
  planned_hours,
  studied_hours,
  status,
  language_skill,
  resource,
  recurrence_rule,
  reminder_at,
  notes,
  deleted_at,
  created_at,
  updated_at,
  course:courses!study_sessions_course_id_fkey(
    id,
    name,
    course_group,
    color,
    icon,
    weekly_goal_minutes,
    status,
    priority,
    workload_hours,
    studied_hours,
    area:areas!courses_area_id_fkey(id, name)
  ),
  study_type:study_types!study_sessions_study_type_id_fkey(id, name)
`;
