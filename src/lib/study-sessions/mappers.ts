import type { StudySession } from "@/types/study-session";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapStudySessionRow(row: Record<string, unknown>): StudySession {
  const course = relation(row.course);
  const area = relation(course.area);
  const studyType = relation(row.study_type);

  return {
    id: String(row.id ?? ""),
    studyDate: String(row.study_date ?? ""),
    topic: String(row.topic ?? ""),
    plannedHours: row.planned_hours === null || row.planned_hours === undefined ? null : numeric(row.planned_hours),
    studiedHours: numeric(row.studied_hours),
    status: row.status as StudySession["status"],
    notes: typeof row.notes === "string" ? row.notes : null,
    deletedAt: typeof row.deleted_at === "string" ? row.deleted_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    course: {
      id: String(course.id ?? ""),
      name: String(course.name ?? "Curso não informado"),
      status: course.status as StudySession["course"]["status"],
      priority: course.priority as StudySession["course"]["priority"],
      workloadHours: numeric(course.workload_hours),
      studiedHours: numeric(course.studied_hours),
      area: {
        id: String(area.id ?? ""),
        name: String(area.name ?? "Área não informada"),
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
  topic,
  planned_hours,
  studied_hours,
  status,
  notes,
  deleted_at,
  created_at,
  updated_at,
  course:courses!study_sessions_course_id_fkey(
    id,
    name,
    status,
    priority,
    workload_hours,
    studied_hours,
    area:areas!courses_area_id_fkey(id, name)
  ),
  study_type:study_types!study_sessions_study_type_id_fkey(id, name)
`;
