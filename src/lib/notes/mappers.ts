import type { ChecklistItem, Note } from "@/types/note";
import { suggestedCourseColor } from "@/lib/visuals";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
}

function checklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const text = String(row.text ?? "").trim();
    if (!text) return [];
    return [{ id: String(row.id ?? `item-${index}`), text: text.slice(0, 240), done: Boolean(row.done) }];
  }).slice(0, 50);
}

export function mapNoteRow(row: Record<string, unknown>): Note {
  const course = relation(row.course);
  const category = relation(row.category);
  const courseName = String(course.name ?? "Curso não informado");

  return {
    id: String(row.id ?? ""),
    noteDate: String(row.note_date ?? ""),
    topic: typeof row.topic === "string" ? row.topic : null,
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    color: typeof row.color === "string" ? row.color : null,
    isDraft: Boolean(row.is_draft),
    checklist: checklist(row.checklist_data),
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
      name: courseName,
      color: typeof course.color === "string" ? course.color : suggestedCourseColor(courseName),
      group: course.course_group === "LANGUAGE" ? "LANGUAGE" : "PROFESSIONAL",
      icon: typeof course.icon === "string" ? course.icon : "book-open",
    },
    category: {
      id: String(category.id ?? ""),
      name: String(category.name ?? "Categoria não informada"),
      color: typeof category.color === "string" ? category.color : "#7C3AED",
    },
  };
}

export const noteSelect = `
  id,
  note_date,
  topic,
  title,
  content,
  color,
  is_draft,
  checklist_data,
  is_important,
  review_at,
  is_reviewed,
  reviewed_at,
  external_url,
  tags,
  deleted_at,
  created_at,
  updated_at,
  course:courses!notes_course_id_fkey(id, name, color, icon, course_group),
  category:note_categories!notes_category_id_fkey(id, name, color)
`;
