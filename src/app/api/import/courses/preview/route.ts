import { NextResponse, type NextRequest } from "next/server";
import { buildCourseImportPreview } from "@/lib/import/course-import";
import { createClient } from "@/lib/supabase/server";
import type { CourseImportSource, RawCourseImportRow } from "@/types/course-import";

function isSource(value: unknown): value is CourseImportSource {
  return value === "official" || value === "csv";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const source = payload?.source;
  if (!isSource(source)) return NextResponse.json({ message: "Fonte de importação inválida." }, { status: 422 });

  const rows = Array.isArray(payload?.rows) ? payload.rows as RawCourseImportRow[] : undefined;
  if (source === "csv" && (!rows || rows.length === 0)) {
    return NextResponse.json({ message: "O arquivo não possui linhas válidas para pré-visualização." }, { status: 422 });
  }

  try {
    const preview = await buildCourseImportPreview(
      supabase,
      authData.user.id,
      source,
      rows,
      typeof payload?.sourceName === "string" ? payload.sourceName : undefined,
    );
    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível preparar a importação." }, { status: 500 });
  }
}
