import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapStudySessionRow, studySessionSelect } from "@/lib/study-sessions/mappers";
import { parseStudySessionInput, studySessionInputToDatabase } from "@/lib/study-sessions/validation";

const validSorts = new Set(["study_date", "studied_hours", "planned_hours", "created_at", "updated_at"]);

function cleanSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

async function dailyStudiedHours(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studyDate: string,
  excludeId?: string,
) {
  let query = supabase
    .from("study_sessions")
    .select("id, studied_hours")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) return { error };
  const total = (data ?? []).reduce((sum: number, row: { studied_hours: unknown }) => sum + Number(row.studied_hours ?? 0), 0);
  return { total };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = validSorts.has(params.get("sort") ?? "") ? params.get("sort")! : "study_date";
  const ascending = params.get("direction") === "asc";

  let query = supabase
    .from("study_sessions")
    .select(studySessionSelect, { count: "exact" })
    .eq("user_id", authData.user.id);

  const deleted = params.get("deleted");
  if (deleted === "true") query = query.not("deleted_at", "is", null);
  else if (deleted !== "all") query = query.is("deleted_at", null);

  const filters: [string, string | null][] = [
    ["course_id", params.get("courseId")],
    ["status", params.get("status")],
    ["study_type_id", params.get("studyTypeId")],
  ];
  for (const [column, value] of filters) if (value) query = query.eq(column, value);

  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  if (dateFrom) query = query.gte("study_date", dateFrom);
  if (dateTo) query = query.lte("study_date", dateTo);

  const search = cleanSearch(params.get("search") ?? "");
  if (search) {
    const { data: matchingCourses } = await supabase
      .from("courses")
      .select("id")
      .eq("user_id", authData.user.id)
      .ilike("name", `%${search}%`)
      .limit(100);
    const ids = (matchingCourses ?? []).map((row: { id: string }) => row.id);
    const conditions = [`topic.ilike.%${search}%`, `notes.ilike.%${search}%`];
    if (ids.length) conditions.push(`course_id.in.(${ids.join(",")})`);
    query = query.or(conditions.join(","));
  }

  const { data, error, count } = await query
    .order(sort, { ascending, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ message: "Não foi possível carregar as sessões de estudo.", details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sessions: (data ?? []).map((row: unknown) => mapStudySessionRow(row as Record<string, unknown>)),
    pagination: { page, pageSize, total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const parsed = parseStudySessionInput(await request.json().catch(() => null));
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [course, studyType, dayHours] = await Promise.all([
    supabase.from("courses").select("id, name").eq("id", parsed.data.courseId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
    supabase.from("study_types").select("id, name").eq("id", parsed.data.studyTypeId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
    dailyStudiedHours(supabase, authData.user.id, parsed.data.studyDate),
  ]);

  if (!course.data) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });
  if (!studyType.data) return NextResponse.json({ message: "O tipo de estudo selecionado não está disponível." }, { status: 422 });
  if ("error" in dayHours) return NextResponse.json({ message: "Não foi possível validar o limite diário de horas." }, { status: 500 });
  if ((dayHours.total ?? 0) + parsed.data.studiedHours > 24.0001) {
    return NextResponse.json({ message: "A soma das horas estudadas neste dia não pode ultrapassar 24 horas." }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: authData.user.id, ...studySessionInputToDatabase(parsed.data) })
    .select(studySessionSelect)
    .single();

  if (error) {
    return NextResponse.json({ message: "Não foi possível registrar a sessão de estudo.", details: error.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "study_session.created",
    entity_type: "study_session",
    entity_id: String(data.id),
    metadata: { courseId: parsed.data.courseId, studyDate: parsed.data.studyDate, studiedHours: parsed.data.studiedHours },
  });

  return NextResponse.json({
    message: "Sessão de estudo registrada com sucesso. As horas e o progresso foram atualizados.",
    session: mapStudySessionRow(data as unknown as Record<string, unknown>),
  }, { status: 201 });
}
