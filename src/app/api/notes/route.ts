import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapNoteRow, noteSelect } from "@/lib/notes/mappers";
import { noteInputToDatabase, parseNoteInput } from "@/lib/notes/validation";

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

  let query = supabase.from("notes").select(noteSelect, { count: "exact" }).eq("user_id", authData.user.id);

  const deleted = params.get("deleted");
  if (deleted === "true") query = query.not("deleted_at", "is", null);
  else if (deleted !== "all") query = query.is("deleted_at", null);

  const courseId = params.get("courseId");
  const categoryId = params.get("categoryId");
  if (courseId) query = query.eq("course_id", courseId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (params.get("important") === "true") query = query.eq("is_important", true);
  if (params.get("reviewed") === "true") query = query.eq("is_reviewed", true);
  if (params.get("reviewed") === "false") query = query.eq("is_reviewed", false);

  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  if (dateFrom) query = query.gte("note_date", dateFrom);
  if (dateTo) query = query.lte("note_date", dateTo);

  const search = cleanSearch(params.get("search") ?? "");
  if (search) query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%,content.ilike.%${search}%`);

  const { data, error, count } = await query
    .order("is_important", { ascending: false })
    .order("note_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ message: "Não foi possível carregar as anotações.", details: error.message }, { status: 500 });

  return NextResponse.json({
    notes: (data ?? []).map((row: unknown) => mapNoteRow(row as Record<string, unknown>)),
    pagination: { page, pageSize, total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const parsed = parseNoteInput(await request.json().catch(() => null));
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const [course, category] = await Promise.all([
    supabase.from("courses").select("id, name").eq("id", parsed.data.courseId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
    supabase.from("note_categories").select("id, name").eq("id", parsed.data.categoryId).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
  ]);

  if (!course.data) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });
  if (!category.data) return NextResponse.json({ message: "A categoria selecionada não está disponível." }, { status: 422 });

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: authData.user.id, ...noteInputToDatabase(parsed.data) })
    .select(noteSelect)
    .single();

  if (error) return NextResponse.json({ message: "Não foi possível salvar a anotação.", details: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "note.created",
    entity_type: "note",
    entity_id: String(data.id),
    metadata: { courseId: parsed.data.courseId, categoryId: parsed.data.categoryId },
  });

  return NextResponse.json({ message: "Anotação criada com sucesso.", note: mapNoteRow(data as unknown as Record<string, unknown>) }, { status: 201 });
}
