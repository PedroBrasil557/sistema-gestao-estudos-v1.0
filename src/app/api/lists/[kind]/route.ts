import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigurableListKind, listTableMap, mapListItem, normalizeListName } from "@/lib/settings/lists";

export async function GET(_request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (!isConfigurableListKind(kind)) {
    return NextResponse.json({ message: "Lista inválida." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const { data, error } = await supabase
    .from(listTableMap[kind])
    .select("*")
    .eq("user_id", authData.user.id)
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "Execute a migração da versão 0.4 no Supabase.", details: error.message }, { status: 503 });
  }

  const items = (data ?? []).map((row) =>
    mapListItem(row as unknown as Record<string, unknown>),
  );

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (!isConfigurableListKind(kind)) {
    return NextResponse.json({ message: "Lista inválida." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as { name?: string; color?: string } | null;
  const name = payload?.name?.trim().replace(/\s+/g, " ") ?? "";
  const color = String(payload?.color ?? "#7C3AED").toUpperCase();
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ message: "O nome deve ter entre 2 e 80 caracteres." }, { status: 422 });
  }
  if (kind === "note-categories" && !/^#[0-9A-F]{6}$/.test(color)) {
    return NextResponse.json({ message: "Selecione uma cor válida para a categoria." }, { status: 422 });
  }

  const insertData: Record<string, unknown> = {
    user_id: authData.user.id,
    name,
    normalized_name: normalizeListName(name),
    is_system: false,
  };
  if (kind === "note-categories") insertData.color = color;

  const { data, error } = await supabase
    .from(listTableMap[kind])
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ message: duplicate ? "Já existe um item ativo com esse nome." : "Não foi possível adicionar o item." }, { status: duplicate ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "list.created",
    entity_type: kind,
    entity_id: String((data as unknown as Record<string, unknown>).id),
    metadata: { name },
  });

  const item = mapListItem(data as unknown as Record<string, unknown>);

  return NextResponse.json(
    { message: "Item adicionado com sucesso.", item },
    { status: 201 },
  );
}
