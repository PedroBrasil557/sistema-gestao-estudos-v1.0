import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courseSelect, mapCourseRow } from "@/lib/courses/mappers";
import { courseInputToDatabase, parseCourseInput } from "@/lib/courses/validation";

async function authenticatedCourse(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { response: NextResponse.json({ message: "Sessão inválida." }, { status: 401 }) };
  const result = await supabase.from("courses").select(courseSelect).eq("id", id).eq("user_id", authData.user.id).maybeSingle();
  if (result.error) return { response: NextResponse.json({ message: "Não foi possível consultar o curso." }, { status: 500 }) };
  if (!result.data) return { response: NextResponse.json({ message: "Curso não encontrado." }, { status: 404 }) };
  return { supabase, userId: authData.user.id, course: result.data };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedCourse(id);
  if ("response" in result) return result.response;
  return NextResponse.json({ course: mapCourseRow(result.course as unknown as Record<string, unknown>) });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedCourse(id);
  if ("response" in result) return result.response;

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });

  if (typeof payload.archived === "boolean" && Object.keys(payload).length === 1) {
    const archivedAt = payload.archived ? new Date().toISOString() : null;
    const { data, error } = await result.supabase
      .from("courses")
      .update({ archived_at: archivedAt })
      .eq("id", id)
      .eq("user_id", result.userId)
      .select(courseSelect)
      .single();

    if (error) {
      return NextResponse.json({ message: error.code === "23505" ? "Já existe um registro ativo com o mesmo nome." : "Não foi possível atualizar o arquivamento." }, { status: error.code === "23505" ? 409 : 500 });
    }

    await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: payload.archived ? "course.archived" : "course.restored", entity_type: "course", entity_id: id, metadata: {} });
    return NextResponse.json({ message: payload.archived ? "Curso arquivado com sucesso." : "Curso restaurado com sucesso.", course: mapCourseRow(data as unknown as Record<string, unknown>) });
  }

  const parsed = parseCourseInput(payload);
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [platform, area] = await Promise.all([
    result.supabase.from("platforms").select("id").eq("id", parsed.data.platformId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
    result.supabase.from("areas").select("id").eq("id", parsed.data.areaId).eq("user_id", result.userId).is("archived_at", null).maybeSingle(),
  ]);
  if (!platform.data) return NextResponse.json({ message: "A plataforma selecionada não está disponível." }, { status: 422 });
  if (!area.data) return NextResponse.json({ message: "A área selecionada não está disponível." }, { status: 422 });

  const { data, error } = await result.supabase
    .from("courses")
    .update(courseInputToDatabase(parsed.data))
    .eq("id", id)
    .eq("user_id", result.userId)
    .select(courseSelect)
    .single();

  if (error) {
    return NextResponse.json({ message: error.code === "23505" ? "Já existe um registro ativo deste tipo com o mesmo nome." : "Não foi possível atualizar o curso.", details: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "course.updated", entity_type: "course", entity_id: id, metadata: { name: parsed.data.name, status: parsed.data.status } });
  return NextResponse.json({ message: "Curso atualizado com sucesso.", course: mapCourseRow(data as unknown as Record<string, unknown>) });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedCourse(id);
  if ("response" in result) return result.response;

  if (!request.nextUrl.searchParams.has("permanent")) {
    return NextResponse.json({ message: "Use o arquivamento para preservar o histórico. A exclusão permanente exige confirmação explícita." }, { status: 409 });
  }
  if (!(result.course as Record<string, unknown>).archived_at) {
    return NextResponse.json({ message: "Arquive o curso antes de excluí-lo permanentemente." }, { status: 409 });
  }

  const { error } = await result.supabase.from("courses").delete().eq("id", id).eq("user_id", result.userId);
  if (error) return NextResponse.json({ message: "Não foi possível excluir o curso permanentemente.", details: error.message }, { status: 500 });

  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "course.deleted", entity_type: "course", entity_id: id, metadata: { name: (result.course as Record<string, unknown>).name } });
  return NextResponse.json({ message: "Curso excluído permanentemente." });
}
