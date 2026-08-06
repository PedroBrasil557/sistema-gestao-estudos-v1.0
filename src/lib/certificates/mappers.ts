import type { Certificate } from "@/types/certificate";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function nestedRelation(value: unknown) {
  const row = relation(value);
  return { id: String(row.id ?? ""), name: String(row.name ?? "Não informado") };
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapCertificateRow(row: Record<string, unknown>): Certificate {
  const course = relation(row.course);
  return {
    id: String(row.id ?? ""),
    isAvailable: Boolean(row.is_available),
    credentialCode: typeof row.credential_code === "string" ? row.credential_code : null,
    validationUrl: typeof row.validation_url === "string" ? row.validation_url : null,
    fileKey: typeof row.file_key === "string" ? row.file_key : null,
    fileName: typeof row.file_name === "string" ? row.file_name : null,
    mimeType: typeof row.mime_type === "string" ? row.mime_type : null,
    size: numberOrNull(row.size),
    completionDate: typeof row.completion_date === "string" ? row.completion_date : null,
    issueDate: typeof row.issue_date === "string" ? row.issue_date : null,
    expirationDate: typeof row.expiration_date === "string" ? row.expiration_date : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    deletedAt: typeof row.deleted_at === "string" ? row.deleted_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    course: {
      id: String(course.id ?? ""),
      name: String(course.name ?? "Curso não informado"),
      kind: course.kind === "CERTIFICATION" ? "CERTIFICATION" : "COURSE",
      group: course.course_group === "LANGUAGE" ? "LANGUAGE" : "PROFESSIONAL",
      color: typeof course.color === "string" ? course.color : "#2F6BFF",
      icon: typeof course.icon === "string" ? course.icon : "award",
      workloadHours: Number(course.workload_hours ?? 0) || 0,
      completionDate: typeof course.completion_date === "string" ? course.completion_date : null,
      targetCompletionDate: typeof course.target_completion_date === "string" ? course.target_completion_date : null,
      status: String(course.status ?? ""),
      emitsCertificate: Boolean(course.emits_certificate),
      platform: nestedRelation(course.platform),
      area: nestedRelation(course.area),
    },
  };
}

export const certificateSelect = `
  id,
  is_available,
  credential_code,
  validation_url,
  file_key,
  file_name,
  mime_type,
  size,
  completion_date,
  issue_date,
  expiration_date,
  notes,
  deleted_at,
  created_at,
  updated_at,
  course:courses!certificates_course_id_fkey(
    id,
    name,
    kind,
    course_group,
    color,
    icon,
    workload_hours,
    completion_date,
    target_completion_date,
    status,
    emits_certificate,
    platform:platforms!courses_platform_id_fkey(id, name),
    area:areas!courses_area_id_fkey(id, name)
  )
`;
