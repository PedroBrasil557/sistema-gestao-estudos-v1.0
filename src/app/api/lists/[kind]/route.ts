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
    .select("id, name, is_system, archived_at")
    .eq("user_id", authData.user.id)
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "Execute a migração da versão 0.4 no Supabase.", details: error.message }, { status: 503 });
  }

  return NextResponse.json({ items: (data ?? []).map((row: Record<string, unknown>) => mapListItem(row)) });
}

export async function POST(request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (!isConfigurableListKind(kind)) {
    return NextResponse.json({ message: "Lista inválida." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = payload?.name?.trim().replace(/\s+/g, " ") ?? "";
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ message: "O nome deve ter entre 2 e 80 caracteres." }, { status: 422 });
  }

  const { data, error } = await supabase
    .from(listTableMap[kind])
    .insert({
      user_id: authData.user.id,
      name,
      normalized_name: normalizeListName(name),
      is_system: false,
    })
    .select("id, name, is_system, archived_at")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ message: duplicate ? "Já existe um item ativo com esse nome." : "Não foi possível adicionar o item." }, { status: duplicate ? 409 : 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "list.created",
    entity_type: kind,
    entity_id: String(data.id),
    metadata: { name },
  });

  return NextResponse.json({ message: "Item adicionado com sucesso.", item: mapListItem(data as Record<string, unknown>) }, { status: 201 });
}
