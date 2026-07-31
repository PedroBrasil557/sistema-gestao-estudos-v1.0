import type { Note } from "@/types/note";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
}

export function mapNoteRow(row: Record<string, unknown>): Note {
  const course = relation(row.course);
  const category = relation(row.category);

  return {
    id: String(row.id ?? ""),
    noteDate: String(row.note_date ?? ""),
    topic: typeof row.topic === "string" ? row.topic : null,
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    isImportant: Boolean(row.is_important),
    reviewAt: typeof row.review_at === "string" ? row.review_at : null,
    isReviewed: Boolean(row.is_reviewed),
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    externalUrl: typeof row.external_url === "string" ? row.external_url : null,
    tags: stringArray(row.tags),
    deletedAt: typeof row.deleted_at === "string" ? row.deleted_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    course: {
      id: String(course.id ?? ""),
      name: String(course.name ?? "Curso não informado"),
    },
    category: {
      id: String(category.id ?? ""),
      name: String(category.name ?? "Categoria não informada"),
    },
  };
}

export const noteSelect = `
  id,
  note_date,
  topic,
  title,
  content,
  is_important,
  review_at,
  is_reviewed,
  reviewed_at,
  external_url,
  tags,
  deleted_at,
  created_at,
  updated_at,
  course:courses!notes_course_id_fkey(id, name),
  category:note_categories!notes_category_id_fkey(id, name)
`;
