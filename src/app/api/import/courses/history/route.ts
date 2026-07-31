import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const { data, error } = await supabase
    .from("course_imports")
    .select("id, source_name, source_type, duplicate_strategy, total_rows, imported_rows, updated_rows, skipped_rows, error_rows, status, created_at, completed_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ message: "Não foi possível carregar o histórico de importações.", details: error.message }, { status: 500 });
  return NextResponse.json({ imports: data ?? [] });
}
