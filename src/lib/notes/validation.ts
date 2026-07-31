import type { NoteInput } from "@/types/note";

function nullableText(value: unknown, max = 5000): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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

function parseTags(value: unknown): string[] {
  const source = Array.isArray(value) ? value : String(value ?? "").split(",");
  const result: string[] = [];
  for (const item of source) {
    const normalized = String(item).trim().replace(/^#+/, "").replace(/\s+/g, "-").slice(0, 40);
    if (!normalized) continue;
    const tag = `#${normalized}`;
    if (!result.some((existing) => existing.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))) result.push(tag);
    if (result.length >= 20) break;
  }
  return result;
}

export function parseNoteInput(payload: unknown): { data?: NoteInput; error?: string } {
  if (!payload || typeof payload !== "object") return { error: "Dados da anotação inválidos." };
  const input = payload as Record<string, unknown>;

  const noteDate = String(input.noteDate ?? "").trim();
  const courseId = String(input.courseId ?? "").trim();
  const topic = nullableText(input.topic, 240);
  const title = String(input.title ?? "").trim().replace(/\s+/g, " ");
  const categoryId = String(input.categoryId ?? "").trim();
  const content = String(input.content ?? "").trim();
  const isImportant = Boolean(input.isImportant);
  const reviewAtRaw = String(input.reviewAt ?? "").trim();
  const reviewAt = reviewAtRaw || null;
  const isReviewed = Boolean(input.isReviewed);
  const externalUrl = nullableText(input.externalUrl, 1000);
  const tags = parseTags(input.tags);

  if (!validDate(noteDate)) return { error: "Informe uma data válida para a anotação." };
  if (!courseId) return { error: "Selecione um curso." };
  if (title.length < 2 || title.length > 180) return { error: "O título deve ter entre 2 e 180 caracteres." };
  if (!categoryId) return { error: "Selecione uma categoria." };
  if (content.length < 1 || content.length > 20000) return { error: "O conteúdo deve ter entre 1 e 20.000 caracteres." };
  if (topic && topic.length > 240) return { error: "O módulo ou assunto pode ter no máximo 240 caracteres." };
  if (reviewAt && !validDate(reviewAt)) return { error: "Informe uma data de revisão válida." };
  if (!validUrl(externalUrl)) return { error: "Informe um link externo válido começando com http:// ou https://." };

  return { data: { noteDate, courseId, topic, title, categoryId, content, isImportant, reviewAt, isReviewed, externalUrl, tags } };
}

export function noteInputToDatabase(input: NoteInput, previousReviewedAt?: string | null) {
  return {
    note_date: input.noteDate,
    course_id: input.courseId,
    topic: input.topic,
    title: input.title,
    category_id: input.categoryId,
    content: input.content,
    is_important: input.isImportant,
    review_at: input.reviewAt,
    is_reviewed: input.isReviewed,
    reviewed_at: input.isReviewed ? (previousReviewedAt ?? new Date().toISOString()) : null,
    external_url: input.externalUrl,
    tags: input.tags,
  };
}
