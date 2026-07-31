import { NextResponse, type NextRequest } from "next/server";
import { executeCourseImport } from "@/lib/import/course-import";
import { createClient } from "@/lib/supabase/server";
import type { CourseImportSource, DuplicateStrategy, RawCourseImportRow } from "@/types/course-import";

function isSource(value: unknown): value is CourseImportSource {
  return value === "official" || value === "csv";
}

function isStrategy(value: unknown): value is DuplicateStrategy {
  return value === "skip" || value === "update";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const source = payload?.source;
  const strategy = payload?.duplicateStrategy;
  if (!isSource(source)) return NextResponse.json({ message: "Fonte de importação inválida." }, { status: 422 });
  if (!isStrategy(strategy)) return NextResponse.json({ message: "Escolha como tratar os registros duplicados." }, { status: 422 });

  const rows = Array.isArray(payload?.rows) ? payload.rows as RawCourseImportRow[] : undefined;
  if (source === "csv" && (!rows || rows.length === 0)) {
    return NextResponse.json({ message: "O arquivo não possui linhas para importar." }, { status: 422 });
  }

  try {
    const report = await executeCourseImport(
      supabase,
      authData.user.id,
      source,
      strategy,
      rows,
      typeof payload?.sourceName === "string" ? payload.sourceName : undefined,
    );
    return NextResponse.json({ message: "Importação concluída.", report }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a importação.";
    const status = message.includes("já foi") || message.includes("já foi registrada") ? 409 : 500;
    return NextResponse.json({ message }, { status });
  }
}
