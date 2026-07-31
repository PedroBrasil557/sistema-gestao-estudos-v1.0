import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapStudySessionRow, studySessionSelect } from "@/lib/study-sessions/mappers";
import { parseStudySessionInput, studySessionInputToDatabase } from "@/lib/study-sessions/validation";

async function authenticatedSession(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { response: NextResponse.json({ message: "Sessão inválida." }, { status: 401 }) };
  const result = await supabase.from("study_sessions").select(studySessionSelect).eq("id", id).eq("user_id", authData.user.id).maybeSingle();
  if (result.error) return { response: NextResponse.json({ message: "Não foi possível consultar a sessão de estudo." }, { status: 500 }) };
  if (!result.data) return { response: NextResponse.json({ message: "Sessão de estudo não encontrada." }, { status: 404 }) };
  return { supabase, userId: authData.user.id, session: result.data as unknown as Record<string, unknown> };
}

async function validateDailyLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
  studyDate: string,
  studiedHours: number,
) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, studied_hours")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .is("deleted_at", null)
    .neq("id", sessionId);
  if (error) return { message: "Não foi possível validar o limite diário de horas.", status: 500 };
  const total = (data ?? []).reduce((sum: number, row: { studied_hours: unknown }) => sum + Number(row.studied_hours ?? 0), 0);
  if (total + studiedHours > 24.0001) return { message: "A soma das horas estudadas neste dia não pode ultrapassar 24 horas.", status: 422 };
  return null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedSession(id);
  if ("response" in result) return result.response;
  return NextResponse.json({ session: mapStudySessionRow(result.session) });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedSession(id);
  if ("response" in result) return result.response;

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });

  if (payload.restore === true && Object.keys(payload).length === 1) {
    const { data, error } = await result.supabase
      .from("study_sessions")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", result.userId)
      .select(studySessionSelect)
      .single();
    if (error) return NextResponse.json({ message: "Não foi possível restaurar a sessão.", details: error.message }, { status: 500 });
    await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "study_session.restored", entity_type: "study_session", entity_id: id, metadata: {} });
    return NextResponse.json({ message: "Sessão restaurada com sucesso.", session: mapStudySessionRow(data as unknown as Record<string, unknown>) });
  }

  if (result.session.deleted_at) return NextResponse.json({ message: "Restaure a sessão antes de editá-la." }, { status: 409 });

  const parsed = parseStudySessionInput(payload);
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [course, studyType] = await Promise.all([
    result.supabase.from("courses").select("id").eq("id", parsed.data.courseId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
    result.supabase.from("study_types").select("id").eq("id", parsed.data.studyTypeId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
  ]);
  if (!course.data) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });
  if (!studyType.data) return NextResponse.json({ message: "O tipo de estudo selecionado não está disponível." }, { status: 422 });

  const limitError = await validateDailyLimit(result.supabase, result.userId, id, parsed.data.studyDate, parsed.data.studiedHours);
  if (limitError) return NextResponse.json({ message: limitError.message }, { status: limitError.status });

  const { data, error } = await result.supabase
    .from("study_sessions")
    .update(studySessionInputToDatabase(parsed.data))
    .eq("id", id)
    .eq("user_id", result.userId)
    .select(studySessionSelect)
    .single();

  if (error) return NextResponse.json({ message: "Não foi possível atualizar a sessão de estudo.", details: error.message }, { status: 500 });

  await result.supabase.from("audit_logs").insert({
    user_id: result.userId,
    action: "study_session.updated",
    entity_type: "study_session",
    entity_id: id,
    metadata: { courseId: parsed.data.courseId, studyDate: parsed.data.studyDate, studiedHours: parsed.data.studiedHours },
  });

  return NextResponse.json({
    message: "Sessão de estudo atualizada. As horas e o progresso foram recalculados.",
    session: mapStudySessionRow(data as unknown as Record<string, unknown>),
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedSession(id);
  if ("response" in result) return result.response;
  if (result.session.deleted_at) return NextResponse.json({ message: "Esta sessão já está na lixeira." }, { status: 409 });

  const { data, error } = await result.supabase
    .from("study_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", result.userId)
    .select(studySessionSelect)
    .single();
  if (error) return NextResponse.json({ message: "Não foi possível excluir a sessão.", details: error.message }, { status: 500 });

  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "study_session.deleted", entity_type: "study_session", entity_id: id, metadata: {} });
  return NextResponse.json({ message: "Sessão movida para a lixeira. O histórico pode ser restaurado.", session: mapStudySessionRow(data as unknown as Record<string, unknown>) });
}
