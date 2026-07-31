import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowsToCsv, safeFilenamePart, type CsvColumn } from "@/lib/export/csv";

export const dynamic = "force-dynamic";

type Scope = "backup" | "courses" | "study-sessions" | "notes" | "certificates";
type Format = "json" | "csv";
type JsonRow = Record<string, unknown>;

const PAGE_SIZE = 1000;

function isScope(value: string | null): value is Scope {
  return value === "backup" || value === "courses" || value === "study-sessions" || value === "notes" || value === "certificates";
}

function isFormat(value: string | null): value is Format {
  return value === "json" || value === "csv";
}

async function fetchPaged<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function nestedName(value: unknown): string {
  if (Array.isArray(value)) return nestedName(value[0]);
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
}

function jsonDownload(body: unknown, filename: string) {
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function csvDownload(body: string, filename: string) {
  const bom = "\uFEFF";
  return new NextResponse(bom + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedScope = url.searchParams.get("scope");
  const requestedFormat = url.searchParams.get("format");
  const scope: Scope = isScope(requestedScope) ? requestedScope : "backup";
  const format: Format = isFormat(requestedFormat) ? requestedFormat : scope === "backup" ? "json" : "csv";

  if (scope === "backup" && format !== "json") {
    return NextResponse.json({ message: "O backup completo está disponível em JSON." }, { status: 422 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const prefix = `gestao-estudos-${safeFilenamePart(scope)}-${today}`;

  try {
    if (scope === "courses") {
      const rows = await fetchPaged<JsonRow>((from, to) => supabase
        .from("courses")
        .select("id,name,kind,workload_hours,studied_hours,status,priority,start_date,target_completion_date,completion_date,emits_certificate,url,notes,archived_at,created_at,updated_at,platform:platforms(name),area:areas(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .range(from, to));

      await supabase.from("audit_logs").insert({ user_id: user.id, action: "data.exported", entity_type: "courses", metadata: { format, count: rows.length } });
      if (format === "json") return jsonDownload(rows, `${prefix}.json`);

      const columns: CsvColumn<JsonRow>[] = [
        { header: "ID", value: (r) => r.id },
        { header: "Nome", value: (r) => r.name },
        { header: "Tipo", value: (r) => r.kind },
        { header: "Plataforma", value: (r) => nestedName(r.platform) },
        { header: "Área", value: (r) => nestedName(r.area) },
        { header: "Carga horária", value: (r) => r.workload_hours },
        { header: "Horas estudadas", value: (r) => r.studied_hours },
        { header: "Status", value: (r) => r.status },
        { header: "Prioridade", value: (r) => r.priority },
        { header: "Data de início", value: (r) => r.start_date },
        { header: "Meta de conclusão", value: (r) => r.target_completion_date },
        { header: "Data de conclusão", value: (r) => r.completion_date },
        { header: "Emite certificado", value: (r) => r.emits_certificate },
        { header: "Link", value: (r) => r.url },
        { header: "Observações", value: (r) => r.notes },
        { header: "Arquivado em", value: (r) => r.archived_at },
      ];
      return csvDownload(rowsToCsv(rows, columns), `${prefix}.csv`);
    }

    if (scope === "study-sessions") {
      const rows = await fetchPaged<JsonRow>((from, to) => supabase
        .from("study_sessions")
        .select("id,study_date,topic,planned_hours,studied_hours,status,notes,deleted_at,created_at,updated_at,course:courses(name),study_type:study_types(name)")
        .eq("user_id", user.id)
        .order("study_date", { ascending: true })
        .range(from, to));

      await supabase.from("audit_logs").insert({ user_id: user.id, action: "data.exported", entity_type: "study_sessions", metadata: { format, count: rows.length } });
      if (format === "json") return jsonDownload(rows, `${prefix}.json`);

      const columns: CsvColumn<JsonRow>[] = [
        { header: "ID", value: (r) => r.id },
        { header: "Data", value: (r) => r.study_date },
        { header: "Curso", value: (r) => nestedName(r.course) },
        { header: "Tipo de estudo", value: (r) => nestedName(r.study_type) },
        { header: "Módulo/Assunto", value: (r) => r.topic },
        { header: "Horas planejadas", value: (r) => r.planned_hours },
        { header: "Horas estudadas", value: (r) => r.studied_hours },
        { header: "Status", value: (r) => r.status },
        { header: "Observações", value: (r) => r.notes },
        { header: "Excluída em", value: (r) => r.deleted_at },
      ];
      return csvDownload(rowsToCsv(rows, columns), `${prefix}.csv`);
    }

    if (scope === "notes") {
      const rows = await fetchPaged<JsonRow>((from, to) => supabase
        .from("notes")
        .select("id,note_date,topic,title,content,is_important,review_at,is_reviewed,reviewed_at,external_url,tags,deleted_at,created_at,updated_at,course:courses(name),category:note_categories(name)")
        .eq("user_id", user.id)
        .order("note_date", { ascending: true })
        .range(from, to));

      await supabase.from("audit_logs").insert({ user_id: user.id, action: "data.exported", entity_type: "notes", metadata: { format, count: rows.length } });
      if (format === "json") return jsonDownload(rows, `${prefix}.json`);

      const columns: CsvColumn<JsonRow>[] = [
        { header: "ID", value: (r) => r.id },
        { header: "Data", value: (r) => r.note_date },
        { header: "Curso", value: (r) => nestedName(r.course) },
        { header: "Categoria", value: (r) => nestedName(r.category) },
        { header: "Módulo/Assunto", value: (r) => r.topic },
        { header: "Título", value: (r) => r.title },
        { header: "Conteúdo", value: (r) => r.content },
        { header: "Importante", value: (r) => r.is_important },
        { header: "Revisar em", value: (r) => r.review_at },
        { header: "Revisada", value: (r) => r.is_reviewed },
        { header: "Revisada em", value: (r) => r.reviewed_at },
        { header: "Link externo", value: (r) => r.external_url },
        { header: "Tags", value: (r) => r.tags },
        { header: "Excluída em", value: (r) => r.deleted_at },
      ];
      return csvDownload(rowsToCsv(rows, columns), `${prefix}.csv`);
    }

    if (scope === "certificates") {
      const rows = await fetchPaged<JsonRow>((from, to) => supabase
        .from("certificates")
        .select("id,is_available,credential_code,validation_url,file_key,file_name,mime_type,size,completion_date,issue_date,expiration_date,notes,deleted_at,created_at,updated_at,course:courses(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .range(from, to));

      await supabase.from("audit_logs").insert({ user_id: user.id, action: "data.exported", entity_type: "certificates", metadata: { format, count: rows.length } });
      if (format === "json") return jsonDownload(rows, `${prefix}.json`);

      const columns: CsvColumn<JsonRow>[] = [
        { header: "ID", value: (r) => r.id },
        { header: "Curso/Certificação", value: (r) => nestedName(r.course) },
        { header: "Disponível", value: (r) => r.is_available },
        { header: "Código/Credencial", value: (r) => r.credential_code },
        { header: "Link de validação", value: (r) => r.validation_url },
        { header: "Arquivo", value: (r) => r.file_name },
        { header: "Tipo do arquivo", value: (r) => r.mime_type },
        { header: "Tamanho (bytes)", value: (r) => r.size },
        { header: "Data de conclusão", value: (r) => r.completion_date },
        { header: "Data de emissão", value: (r) => r.issue_date },
        { header: "Validade", value: (r) => r.expiration_date },
        { header: "Observações", value: (r) => r.notes },
        { header: "Excluído em", value: (r) => r.deleted_at },
      ];
      return csvDownload(rowsToCsv(rows, columns), `${prefix}.csv`);
    }

    const [profileResult, settingsResult, platforms, areas, studyTypes, noteCategories, courses, sessions, notes, certificates, imports, auditLogs] = await Promise.all([
      supabase.from("profiles").select("id,name,avatar_url,created_at,updated_at,deleted_at").eq("id", user.id).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      fetchPaged<JsonRow>((from, to) => supabase.from("platforms").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("areas").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("study_types").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("note_categories").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("courses").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("study_sessions").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("notes").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("certificates").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("course_imports").select("*").eq("user_id", user.id).order("created_at").range(from, to)),
      fetchPaged<JsonRow>((from, to) => supabase.from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at").eq("user_id", user.id).order("created_at").range(from, to)),
    ]);

    if (profileResult.error || settingsResult.error) {
      return NextResponse.json({ message: "Não foi possível preparar o backup da conta." }, { status: 500 });
    }

    const backup = {
      backupFormat: "gestao-estudos-backup",
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      application: { name: "Sistema de Gestão de Estudos – Roberta", version: "1.0.0" },
      account: {
        id: user.id,
        email: user.email ?? null,
        profile: profileResult.data,
        settings: settingsResult.data,
      },
      lists: { platforms, areas, studyTypes, noteCategories },
      data: { courses, studySessions: sessions, notes, certificates, courseImports: imports, auditLogs },
      storageManifest: (certificates as JsonRow[])
        .filter((certificate: JsonRow) => Boolean(certificate.file_key))
        .map((certificate: JsonRow) => ({
          certificateId: certificate.id,
          fileKey: certificate.file_key,
          fileName: certificate.file_name,
          mimeType: certificate.mime_type,
          size: certificate.size,
        })),
      counts: {
        platforms: platforms.length,
        areas: areas.length,
        studyTypes: studyTypes.length,
        noteCategories: noteCategories.length,
        courses: courses.length,
        studySessions: sessions.length,
        notes: notes.length,
        certificates: certificates.length,
        courseImports: imports.length,
        auditLogs: auditLogs.length,
      },
      notes: [
        "Este é um backup lógico dos dados da conta.",
        "Arquivos privados de certificados não são incorporados ao JSON; o storageManifest preserva as referências e metadados dos arquivos.",
        "Mantenha este arquivo em local privado, pois pode conter anotações e dados pessoais.",
      ],
    };

    await supabase.from("audit_logs").insert({ user_id: user.id, action: "backup.downloaded", entity_type: "account", entity_id: user.id, metadata: { schemaVersion: "1.0", counts: backup.counts } });
    return jsonDownload(backup, `${prefix}.json`);
  } catch (error) {
    console.error("Erro ao exportar dados:", error instanceof Error ? error.message : "erro desconhecido");
    return NextResponse.json({ message: "Não foi possível exportar os dados agora. Tente novamente." }, { status: 500 });
  }
}
