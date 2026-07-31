import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courseSelect, mapCourseRow } from "@/lib/courses/mappers";
import { courseInputToDatabase, parseCourseInput } from "@/lib/courses/validation";

const validSorts = new Set(["name", "priority", "status", "target_completion_date", "created_at", "workload_hours"]);

function cleanSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
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
  const sort = validSorts.has(params.get("sort") ?? "") ? params.get("sort")! : "created_at";
  const ascending = params.get("direction") === "asc";

  let query = supabase
    .from("courses")
    .select(courseSelect, { count: "exact" })
    .eq("user_id", authData.user.id);

  const archived = params.get("archived");
  if (archived === "true") query = query.not("archived_at", "is", null);
  else if (archived !== "all") query = query.is("archived_at", null);

  const search = cleanSearch(params.get("search") ?? "");
  if (search) query = query.or(`name.ilike.%${search}%,notes.ilike.%${search}%`);

  const filters: [string, string | null][] = [
    ["status", params.get("status")],
    ["kind", params.get("kind")],
    ["priority", params.get("priority")],
    ["platform_id", params.get("platformId")],
    ["area_id", params.get("areaId")],
  ];
  for (const [column, value] of filters) if (value) query = query.eq(column, value);

  const { data, error, count } = await query
    .order(sort, { ascending, nullsFirst: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ message: "Não foi possível carregar os cursos.", details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    courses: (data ?? []).map((row: unknown) => mapCourseRow(row as Record<string, unknown>)),
    pagination: { page, pageSize, total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const parsed = parseCourseInput(await request.json().catch(() => null));
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [platform, area] = await Promise.all([
    supabase.from("platforms").select("id").eq("id", parsed.data.platformId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
    supabase.from("areas").select("id").eq("id", parsed.data.areaId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
  ]);

  if (!platform.data) return NextResponse.json({ message: "A plataforma selecionada não está disponível." }, { status: 422 });
  if (!area.data) return NextResponse.json({ message: "A área selecionada não está disponível." }, { status: 422 });

  const { data, error } = await supabase
    .from("courses")
    .insert({ user_id: authData.user.id, ...courseInputToDatabase(parsed.data) })
    .select(courseSelect)
    .single();

  if (error) {
    return NextResponse.json({
      message: error.code === "23505" ? "Já existe um registro ativo deste tipo com o mesmo nome." : "Não foi possível criar o curso.",
      details: error.message,
    }, { status: error.code === "23505" ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "course.created",
    entity_type: "course",
    entity_id: String(data.id),
    metadata: { name: parsed.data.name, kind: parsed.data.kind },
  });

  return NextResponse.json({ message: "Curso criado com sucesso.", course: mapCourseRow(data as unknown as Record<string, unknown>) }, { status: 201 });
}
