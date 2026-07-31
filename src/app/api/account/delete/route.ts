import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Supabase não configurado." }, { status: 503 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !url) {
    return NextResponse.json(
      { message: "Configure SUPABASE_SERVICE_ROLE_KEY somente no servidor para ativar a exclusão." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 });
  }

  const admin = createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);

  if (deleteError) {
    return NextResponse.json({ message: "Não foi possível excluir a conta agora." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
