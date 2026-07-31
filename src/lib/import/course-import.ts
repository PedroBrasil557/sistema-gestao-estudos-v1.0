import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OFFICIAL_IMPORT_KEY, OFFICIAL_IMPORT_SOURCE_NAME, officialCourseRows } from "@/lib/import/official-courses";
import type {
  CourseImportPreview,
  CourseImportPreviewRow,
  CourseImportReport,
  CourseImportReportRow,
  CourseImportSource,
  DuplicateStrategy,
  NormalizedCourseImportRow,
  RawCourseImportRow,
} from "@/types/course-import";
import type { CourseKind, CoursePriority, CourseStatus } from "@/types/course";

const MAX_IMPORT_ROWS = 500;

type ExistingCourseRow = { id: unknown; kind: unknown; normalized_name: unknown; archived_at: unknown };
type ExistingListRow = { id: unknown; normalized_name: unknown; archived_at: unknown; created_at?: unknown };

const kindMap = new Map<string, CourseKind>([
  ["course", "COURSE"], ["curso", "COURSE"],
  ["certification", "CERTIFICATION"], ["certificacao", "CERTIFICATION"], ["certificação", "CERTIFICATION"],
]);

const statusMap = new Map<string, CourseStatus>([
  ["planned", "PLANNED"], ["planejado", "PLANNED"], ["planejada", "PLANNED"],
  ["not started", "NOT_STARTED"], ["nao iniciado", "NOT_STARTED"], ["não iniciado", "NOT_STARTED"], ["nao iniciada", "NOT_STARTED"], ["não iniciada", "NOT_STARTED"],
  ["in progress", "IN_PROGRESS"], ["em andamento", "IN_PROGRESS"],
  ["paused", "PAUSED"], ["pausado", "PAUSED"], ["pausada", "PAUSED"],
  ["completed", "COMPLETED"], ["concluido", "COMPLETED"], ["concluído", "COMPLETED"], ["concluida", "COMPLETED"], ["concluída", "COMPLETED"],
  ["cancelled", "CANCELLED"], ["canceled", "CANCELLED"], ["cancelado", "CANCELLED"], ["cancelada", "CANCELLED"],
]);

const priorityMap = new Map<string, CoursePriority>([
  ["high", "HIGH"], ["alta", "HIGH"], ["alto", "HIGH"],
  ["medium", "MEDIUM"], ["media", "MEDIUM"], ["média", "MEDIUM"], ["medio", "MEDIUM"], ["médio", "MEDIUM"],
  ["low", "LOW"], ["baixa", "LOW"], ["baixo", "LOW"],
]);

function compactText(value: unknown, maxLength = 5000) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function normalizeImportKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function nullableText(value: unknown, maxLength = 5000) {
  const text = compactText(value, maxLength);
  return text ? text : null;
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  const text = compactText(value, 50).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!text) return 0;
  return Number(text);
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  const key = normalizeImportKey(compactText(value, 20));
  if (["sim", "yes", "true", "1"].includes(key)) return true;
  if (["nao", "não", "no", "false", "0"].includes(key)) return false;
  return fallback;
}

function parseDate(value: unknown): { value: string | null; invalid: boolean } {
  const text = compactText(value, 20);
  if (!text) return { value: null, invalid: false };
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { value: text, invalid: false };
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const iso = `${match[3]}-${month}-${day}`;
    const date = new Date(`${iso}T00:00:00Z`);
    if (date.getUTCFullYear() === Number(match[3]) && date.getUTCMonth() + 1 === Number(month) && date.getUTCDate() === Number(day)) {
      return { value: iso, invalid: false };
    }
  }
  return { value: null, invalid: true };
}

function validUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeRow(raw: RawCourseImportRow, rowNumber: number): { data: NormalizedCourseImportRow | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const name = compactText(raw.name, 160);
  const platform = compactText(raw.platform, 80);
  const area = compactText(raw.area, 80);
  const kindKey = normalizeImportKey(compactText(raw.kind || "Curso", 30));
  const statusKey = normalizeImportKey(compactText(raw.status || "Planejado", 30));
  const priorityText = compactText(raw.priority, 30);
  const priorityKey = normalizeImportKey(priorityText || "Média");
  const workloadHours = parseNumber(raw.workloadHours);
  const startDate = parseDate(raw.startDate);
  const targetCompletionDate = parseDate(raw.targetCompletionDate);
  const completionDate = parseDate(raw.completionDate);
  const url = nullableText(raw.url, 2048);
  const notes = nullableText(raw.notes, 5000);
  const kind = kindMap.get(kindKey);
  const status = statusMap.get(statusKey);
  const priority = priorityMap.get(priorityKey);

  if (name.length < 2) errors.push("Nome não informado ou muito curto.");
  if (!platform) errors.push("Plataforma não informada.");
  if (!area) errors.push("Área não informada.");
  if (!kind) errors.push("Tipo inválido. Use Curso ou Certificação.");
  if (!status) errors.push("Status inválido.");
  if (!priority) errors.push("Prioridade inválida.");
  if (!Number.isFinite(workloadHours) || workloadHours < 0 || workloadHours > 9999.99) errors.push("Carga horária inválida.");
  if (startDate.invalid) errors.push("Data de início inválida.");
  if (targetCompletionDate.invalid) errors.push("Meta de conclusão inválida.");
  if (completionDate.invalid) errors.push("Data de conclusão inválida.");
  if (targetCompletionDate.value && startDate.value && targetCompletionDate.value < startDate.value) errors.push("A meta de conclusão é anterior à data de início.");
  if (completionDate.value && startDate.value && completionDate.value < startDate.value) errors.push("A data de conclusão é anterior à data de início.");
  if (!validUrl(url)) errors.push("Link inválido. Use http:// ou https://.");

  if (!priorityText) warnings.push("Prioridade não informada; Média será utilizada.");
  if (status === "IN_PROGRESS" && !startDate.value) warnings.push("Curso em andamento sem data de início; poderá ser ajustado depois.");
  if (status === "COMPLETED" && !completionDate.value) warnings.push("Curso concluído sem data de conclusão; permanecerá sem data após a importação.");

  if (errors.length || !kind || !status || !priority) return { data: null, errors, warnings };

  return {
    data: {
      sourceId: nullableText(raw.sourceId, 80),
      name,
      kind,
      platform,
      area,
      workloadHours: Math.round(workloadHours * 100) / 100,
      status,
      priority,
      startDate: startDate.value,
      targetCompletionDate: targetCompletionDate.value,
      completionDate: completionDate.value,
      emitsCertificate: parseBoolean(raw.emitsCertificate, kind === "CERTIFICATION"),
      url,
      notes,
    },
    errors,
    warnings,
  };
}

function canonicalRows(rows: NormalizedCourseImportRow[]) {
  return rows.map((row) => ({
    sourceId: row.sourceId,
    name: normalizeImportKey(row.name),
    kind: row.kind,
    platform: normalizeImportKey(row.platform),
    area: normalizeImportKey(row.area),
    workloadHours: row.workloadHours,
    status: row.status,
    priority: row.priority,
    startDate: row.startDate,
    targetCompletionDate: row.targetCompletionDate,
    completionDate: row.completionDate,
    emitsCertificate: row.emitsCertificate,
    url: row.url,
    notes: row.notes,
  }));
}

function hashRows(rows: NormalizedCourseImportRow[]) {
  return `csv-${createHash("sha256").update(JSON.stringify(canonicalRows(rows))).digest("hex").slice(0, 32)}`;
}

export function resolveImportRows(source: CourseImportSource, rows: RawCourseImportRow[] | undefined) {
  if (source === "official") return officialCourseRows;
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, MAX_IMPORT_ROWS);
}

export async function buildCourseImportPreview(
  supabase: SupabaseClient,
  userId: string,
  source: CourseImportSource,
  rows?: RawCourseImportRow[],
  sourceNameInput?: string,
): Promise<CourseImportPreview> {
  const rawRows = resolveImportRows(source, rows);
  const sourceName = source === "official" ? OFFICIAL_IMPORT_SOURCE_NAME : compactText(sourceNameInput || "Arquivo CSV", 160);

  const [coursesResult, platformsResult, areasResult] = await Promise.all([
    supabase.from("courses").select("id, kind, normalized_name, archived_at").eq("user_id", userId),
    supabase.from("platforms").select("id, name, normalized_name, archived_at").eq("user_id", userId),
    supabase.from("areas").select("id, name, normalized_name, archived_at").eq("user_id", userId),
  ]);

  if (coursesResult.error) throw new Error(`Não foi possível consultar os cursos: ${coursesResult.error.message}`);
  if (platformsResult.error) throw new Error(`Não foi possível consultar as plataformas: ${platformsResult.error.message}`);
  if (areasResult.error) throw new Error(`Não foi possível consultar as áreas: ${areasResult.error.message}`);

  const existingCourses = new Map<string, { id: string; archived: boolean }>();
  for (const course of (coursesResult.data ?? []) as ExistingCourseRow[]) {
    const key = `${String(course.kind)}:${String(course.normalized_name)}`;
    const candidate = { id: String(course.id), archived: Boolean(course.archived_at) };
    const current = existingCourses.get(key);
    if (!current || (current.archived && !candidate.archived)) existingCourses.set(key, candidate);
  }
  const platformRows = (platformsResult.data ?? []) as ExistingListRow[];
  const areaRows = (areasResult.data ?? []) as ExistingListRow[];
  const activePlatforms = new Set(platformRows.filter((item: ExistingListRow) => !item.archived_at).map((item: ExistingListRow) => String(item.normalized_name)));
  const activeAreas = new Set(areaRows.filter((item: ExistingListRow) => !item.archived_at).map((item: ExistingListRow) => String(item.normalized_name)));
  const seenRows = new Set<string>();
  const previewRows: CourseImportPreviewRow[] = [];
  const normalizedValidRows: NormalizedCourseImportRow[] = [];

  rawRows.forEach((raw, index) => {
    const normalized = normalizeRow(raw, index + 1);
    const data = normalized.data;
    let state: CourseImportPreviewRow["state"] = data ? "READY" : "INVALID";
    let existingCourseId: string | null = null;
    let existingArchived = false;

    if (data) {
      const rowKey = `${data.kind}:${normalizeImportKey(data.name)}`;
      if (seenRows.has(rowKey)) {
        normalized.errors.push("Registro duplicado dentro do próprio arquivo.");
        state = "INVALID";
      } else {
        seenRows.add(rowKey);
        normalizedValidRows.push(data);
        const existing = existingCourses.get(rowKey);
        if (existing) {
          state = "DUPLICATE";
          existingCourseId = existing.id;
          existingArchived = existing.archived;
          normalized.warnings.push(existing.archived ? "Já existe uma versão arquivada deste registro." : "Já existe um registro ativo com este nome e tipo.");
        }
      }
    }

    previewRows.push({
      rowNumber: index + 1,
      sourceId: data?.sourceId ?? nullableText(raw.sourceId, 80),
      state,
      data: state === "INVALID" ? null : data,
      errors: normalized.errors,
      warnings: normalized.warnings,
      existingCourseId,
      existingArchived,
      createsPlatform: Boolean(data && !activePlatforms.has(normalizeImportKey(data.platform))),
      createsArea: Boolean(data && !activeAreas.has(normalizeImportKey(data.area))),
    });
  });

  const importKey = source === "official" ? OFFICIAL_IMPORT_KEY : hashRows(normalizedValidRows);
  const importResult = await supabase
    .from("course_imports")
    .select("id")
    .eq("user_id", userId)
    .eq("import_key", importKey)
    .eq("status", "COMPLETED")
    .maybeSingle();
  if (importResult.error) throw new Error(`A migração da versão 0.6 ainda não foi executada: ${importResult.error.message}`);

  const newPlatforms = [...new Set(previewRows.filter((row) => row.createsPlatform && row.data).map((row) => row.data!.platform))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const newAreas = [...new Set(previewRows.filter((row) => row.createsArea && row.data).map((row) => row.data!.area))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    importKey,
    source,
    sourceName,
    alreadyImported: Boolean(importResult.data),
    summary: {
      total: previewRows.length,
      ready: previewRows.filter((row) => row.state === "READY").length,
      duplicates: previewRows.filter((row) => row.state === "DUPLICATE").length,
      invalid: previewRows.filter((row) => row.state === "INVALID").length,
      newPlatforms,
      newAreas,
    },
    rows: previewRows,
  };
}

async function ensureListItem(supabase: SupabaseClient, table: "platforms" | "areas", userId: string, name: string) {
  const normalizedName = normalizeImportKey(name);
  const existing = await supabase
    .from(table)
    .select("id, archived_at, created_at")
    .eq("user_id", userId)
    .eq("normalized_name", normalizedName)
    .order("created_at", { ascending: false });
  if (existing.error) throw new Error(existing.error.message);
  const existingRows = (existing.data ?? []) as ExistingListRow[];
  const active = existingRows.find((item: ExistingListRow) => !item.archived_at);
  if (active) return { id: String(active.id), created: false };
  const archived = existingRows[0];
  if (archived) {
    const restored = await supabase.from(table).update({ archived_at: null, name }).eq("id", archived.id).eq("user_id", userId).select("id").single();
    if (restored.error) throw new Error(restored.error.message);
    return { id: String(restored.data.id), created: false };
  }
  const inserted = await supabase.from(table).insert({ user_id: userId, name, normalized_name: normalizedName, is_system: false }).select("id").single();
  if (inserted.error) throw new Error(inserted.error.message);
  return { id: String(inserted.data.id), created: true };
}

function databaseCourse(row: NormalizedCourseImportRow, platformId: string, areaId: string) {
  return {
    name: row.name,
    normalized_name: normalizeImportKey(row.name),
    kind: row.kind,
    platform_id: platformId,
    area_id: areaId,
    workload_hours: row.workloadHours,
    status: row.status,
    priority: row.priority,
    start_date: row.startDate,
    target_completion_date: row.targetCompletionDate,
    completion_date: row.completionDate,
    emits_certificate: row.emitsCertificate,
    url: row.url,
    notes: row.notes,
    archived_at: null,
  };
}

export async function executeCourseImport(
  supabase: SupabaseClient,
  userId: string,
  source: CourseImportSource,
  strategy: DuplicateStrategy,
  rows?: RawCourseImportRow[],
  sourceNameInput?: string,
): Promise<CourseImportReport> {
  const preview = await buildCourseImportPreview(supabase, userId, source, rows, sourceNameInput);
  if (preview.alreadyImported) throw new Error("Esta mesma importação já foi concluída anteriormente.");

  const importInsert = await supabase.from("course_imports").insert({
    user_id: userId,
    import_key: preview.importKey,
    source_name: preview.sourceName,
    source_type: source.toUpperCase(),
    duplicate_strategy: strategy.toUpperCase(),
    total_rows: preview.summary.total,
    valid_rows: preview.summary.ready + preview.summary.duplicates,
    error_rows: preview.summary.invalid,
    status: "PROCESSING",
    report: { preview: preview.summary },
  }).select("id").single();
  if (importInsert.error) {
    if (importInsert.error.code === "23505") throw new Error("Esta mesma importação já foi registrada.");
    throw new Error(`Não foi possível iniciar a importação: ${importInsert.error.message}`);
  }

  const importId = String(importInsert.data.id);
  const createdPlatforms: string[] = [];
  const createdAreas: string[] = [];
  const platformIds = new Map<string, string>();
  const areaIds = new Map<string, string>();
  const reportRows: CourseImportReportRow[] = [];
  let importedRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;
  let errorRows = preview.summary.invalid;

  for (const row of preview.rows) {
    if (!row.data || row.state === "INVALID") {
      reportRows.push({
        rowNumber: row.rowNumber,
        sourceId: row.sourceId,
        name: row.data?.name ?? `Linha ${row.rowNumber}`,
        result: "ERROR",
        message: row.errors.join(" ") || "Linha inválida.",
        courseId: null,
      });
      continue;
    }

    const data = row.data;
    if (row.state === "DUPLICATE" && strategy === "skip") {
      skippedRows += 1;
      reportRows.push({ rowNumber: row.rowNumber, sourceId: row.sourceId, name: data.name, result: "SKIPPED", message: "Registro existente mantido sem alteração.", courseId: row.existingCourseId });
      continue;
    }

    try {
      const platformKey = normalizeImportKey(data.platform);
      const areaKey = normalizeImportKey(data.area);
      let platformId = platformIds.get(platformKey);
      let areaId = areaIds.get(areaKey);
      if (!platformId) {
        const ensured = await ensureListItem(supabase, "platforms", userId, data.platform);
        platformId = ensured.id;
        platformIds.set(platformKey, platformId);
        if (ensured.created) createdPlatforms.push(data.platform);
      }
      if (!areaId) {
        const ensured = await ensureListItem(supabase, "areas", userId, data.area);
        areaId = ensured.id;
        areaIds.set(areaKey, areaId);
        if (ensured.created) createdAreas.push(data.area);
      }

      const payload = databaseCourse(data, platformId, areaId);
      if (row.state === "DUPLICATE" && row.existingCourseId) {
        const updated = await supabase.from("courses").update(payload).eq("id", row.existingCourseId).eq("user_id", userId).select("id").single();
        if (updated.error) throw new Error(updated.error.message);
        if (data.status === "COMPLETED" && !data.completionDate) {
          const cleared = await supabase.from("courses").update({ completion_date: null }).eq("id", row.existingCourseId).eq("user_id", userId);
          if (cleared.error) throw new Error(cleared.error.message);
        }
        updatedRows += 1;
        reportRows.push({ rowNumber: row.rowNumber, sourceId: row.sourceId, name: data.name, result: "UPDATED", message: row.existingArchived ? "Registro arquivado restaurado e atualizado." : "Registro existente atualizado.", courseId: row.existingCourseId });
      } else {
        const inserted = await supabase.from("courses").insert({ user_id: userId, ...payload }).select("id").single();
        if (inserted.error) throw new Error(inserted.error.message);
        const courseId = String(inserted.data.id);
        if (data.status === "COMPLETED" && !data.completionDate) {
          const cleared = await supabase.from("courses").update({ completion_date: null }).eq("id", courseId).eq("user_id", userId);
          if (cleared.error) throw new Error(cleared.error.message);
        }
        importedRows += 1;
        reportRows.push({ rowNumber: row.rowNumber, sourceId: row.sourceId, name: data.name, result: "IMPORTED", message: "Registro importado com sucesso.", courseId });
      }
    } catch (error) {
      errorRows += 1;
      reportRows.push({ rowNumber: row.rowNumber, sourceId: row.sourceId, name: data.name, result: "ERROR", message: error instanceof Error ? error.message : "Erro inesperado.", courseId: row.existingCourseId });
    }
  }

  const completedAt = new Date().toISOString();
  const report: CourseImportReport = {
    importId,
    importKey: preview.importKey,
    source,
    sourceName: preview.sourceName,
    totalRows: preview.summary.total,
    importedRows,
    updatedRows,
    skippedRows,
    errorRows,
    createdPlatforms: [...new Set(createdPlatforms)],
    createdAreas: [...new Set(createdAreas)],
    rows: reportRows,
    completedAt,
  };

  const importUpdate = await supabase.from("course_imports").update({
    imported_rows: importedRows,
    updated_rows: updatedRows,
    skipped_rows: skippedRows,
    error_rows: errorRows,
    status: errorRows > 0 && importedRows + updatedRows === 0 ? "FAILED" : "COMPLETED",
    report,
    completed_at: completedAt,
  }).eq("id", importId).eq("user_id", userId);
  if (importUpdate.error) throw new Error(`A importação foi processada, mas o relatório não pôde ser salvo: ${importUpdate.error.message}`);

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "courses.imported",
    entity_type: "course_import",
    entity_id: importId,
    metadata: { source, importedRows, updatedRows, skippedRows, errorRows },
  });

  return report;
}
