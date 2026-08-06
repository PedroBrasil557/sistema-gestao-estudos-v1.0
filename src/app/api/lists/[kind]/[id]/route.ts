import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigurableListKind, listTableMap, mapListItem, normalizeListName } from "@/lib/settings/lists";

export async function PATCH(request: NextRequest, context: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await context.params;
  if (!isConfigurableListKind(kind)) {
    return NextResponse.json({ message: "Lista inválida." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as { name?: string; archived?: boolean; color?: string } | null;
  if (!payload || (payload.name === undefined && payload.archived === undefined && payload.color === undefined)) {
    return NextResponse.json({ message: "Nenhuma alteração foi informada." }, { status: 400 });
  }

  if (payload.archived === true && (kind === "platforms" || kind === "areas")) {
    const foreignKey = kind === "platforms" ? "platform_id" : "area_id";
    const { count, error: usageError } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authData.user.id)
      .eq(foreignKey, id);
    if (!usageError && (count ?? 0) > 0) {
      return NextResponse.json({ message: `Este item está vinculado a ${count} curso(s). Renomeie-o em vez de arquivar.` }, { status: 409 });
    }
  }

  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = payload.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ message: "O nome deve ter entre 2 e 80 caracteres." }, { status: 422 });
    }
    update.name = name;
    update.normalized_name = normalizeListName(name);
  }
  if (payload.archived !== undefined) {
    update.archived_at = payload.archived ? new Date().toISOString() : null;
  }
  if (payload.color !== undefined) {
    const color = String(payload.color).toUpperCase();
    if (kind !== "note-categories") return NextResponse.json({ message: "Esta lista não utiliza cores." }, { status: 422 });
    if (!/^#[0-9A-F]{6}$/.test(color)) return NextResponse.json({ message: "Selecione uma cor válida." }, { status: 422 });
    update.color = color;
  }

  const { data, error } = await supabase
    .from(listTableMap[kind])
    .update(update)
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ message: duplicate ? "Já existe um item ativo com esse nome." : "Não foi possível atualizar o item." }, { status: duplicate ? 409 : 500 });
  }
  if (!data) return NextResponse.json({ message: "Item não encontrado." }, { status: 404 });

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: payload.archived === true ? "list.archived" : payload.archived === false ? "list.restored" : "list.renamed",
    entity_type: kind,
    entity_id: id,
    metadata: update,
  });

  const item = mapListItem(data as unknown as Record<string, unknown>);

  return NextResponse.json({
    message: "Item atualizado com sucesso.",
    item,
  });
}
