import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapNoteRow, noteSelect } from "@/lib/notes/mappers";
import { noteInputToDatabase, parseNoteInput } from "@/lib/notes/validation";

async function authenticatedNote(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { response: NextResponse.json({ message: "Sessão inválida." }, { status: 401 }) };
  const { data, error } = await supabase.from("notes").select("id, user_id, deleted_at, reviewed_at, is_reviewed, is_important, review_at").eq("id", id).eq("user_id", authData.user.id).maybeSingle();
  if (error) return { response: NextResponse.json({ message: "Não foi possível localizar a anotação.", details: error.message }, { status: 500 }) };
  if (!data) return { response: NextResponse.json({ message: "Anotação não encontrada." }, { status: 404 }) };
  return { supabase, userId: authData.user.id, note: data };
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedNote(id);
  if ("response" in result) return result.response;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Dados da anotação inválidos." }, { status: 422 });

  if (typeof body.action === "string") {
    let update: Record<string, unknown> | null = null;
    let message = "Anotação atualizada.";
    let action = "note.updated";

    if (body.action === "toggle-important") {
      update = { is_important: !Boolean(result.note.is_important) };
      message = Boolean(result.note.is_important) ? "Anotação removida dos importantes." : "Anotação marcada como importante.";
      action = "note.importance_toggled";
    } else if (body.action === "mark-reviewed") {
      update = { is_reviewed: true, reviewed_at: new Date().toISOString() };
      message = "Anotação marcada como revisada.";
      action = "note.reviewed";
    } else if (body.action === "reopen") {
      update = { is_reviewed: false };
      message = "Anotação reaberta para revisão.";
      action = "note.reopened";
    } else if (body.action === "reschedule") {
      const reviewAt = String(body.reviewAt ?? "").trim();
      if (!validDate(reviewAt)) return NextResponse.json({ message: "Informe uma nova data de revisão válida." }, { status: 422 });
      update = { review_at: reviewAt, is_reviewed: false };
      message = "Próxima revisão reagendada.";
      action = "note.review_rescheduled";
    } else if (body.action === "restore") {
      if (!result.note.deleted_at) return NextResponse.json({ message: "Esta anotação não está na lixeira." }, { status: 409 });
      update = { deleted_at: null };
      message = "Anotação restaurada.";
      action = "note.restored";
    }

    if (!update) return NextResponse.json({ message: "Ação inválida." }, { status: 422 });

    const { data, error } = await result.supabase.from("notes").update(update).eq("id", id).eq("user_id", result.userId).select(noteSelect).single();
    if (error) return NextResponse.json({ message: "Não foi possível atualizar a anotação.", details: error.message }, { status: 500 });
    await result.supabase.from("audit_logs").insert({ user_id: result.userId, action, entity_type: "note", entity_id: id, metadata: update });
    return NextResponse.json({ message, note: mapNoteRow(data as unknown as Record<string, unknown>) });
  }

  if (result.note.deleted_at) return NextResponse.json({ message: "Restaure a anotação antes de editá-la." }, { status: 409 });
  const parsed = parseNoteInput(body);
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [course, category] = await Promise.all([
    result.supabase.from("courses").select("id").eq("id", parsed.data.courseId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
    result.supabase.from("note_categories").select("id").eq("id", parsed.data.categoryId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
  ]);
  if (!course.data) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });
  if (!category.data) return NextResponse.json({ message: "A categoria selecionada não está disponível." }, { status: 422 });

  const previousReviewedAt = typeof result.note.reviewed_at === "string" ? result.note.reviewed_at : null;
  const { data, error } = await result.supabase.from("notes").update(noteInputToDatabase(parsed.data, previousReviewedAt)).eq("id", id).eq("user_id", result.userId).select(noteSelect).single();
  if (error) return NextResponse.json({ message: "Não foi possível atualizar a anotação.", details: error.message }, { status: 500 });

  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "note.updated", entity_type: "note", entity_id: id, metadata: { courseId: parsed.data.courseId, categoryId: parsed.data.categoryId } });
  return NextResponse.json({ message: "Anotação atualizada com sucesso.", note: mapNoteRow(data as unknown as Record<string, unknown>) });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedNote(id);
  if ("response" in result) return result.response;
  if (result.note.deleted_at) return NextResponse.json({ message: "Esta anotação já está na lixeira." }, { status: 409 });

  const { data, error } = await result.supabase.from("notes").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", result.userId).select(noteSelect).single();
  if (error) return NextResponse.json({ message: "Não foi possível excluir a anotação.", details: error.message }, { status: 500 });
  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "note.deleted", entity_type: "note", entity_id: id, metadata: {} });
  return NextResponse.json({ message: "Anotação movida para a lixeira. Você pode restaurá-la.", note: mapNoteRow(data as unknown as Record<string, unknown>) });
}
