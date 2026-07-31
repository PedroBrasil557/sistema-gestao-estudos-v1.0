import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { certificateBucket } from "@/lib/certificates/constants";
import { certificateSelect, mapCertificateRow } from "@/lib/certificates/mappers";
import { certificateContentType, certificateInputToDatabase, parseCertificateInput, safeCertificateFileName, validateCertificateFile } from "@/lib/certificates/validation";

function cleanSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

function formToBody(formData: FormData) {
  return {
    courseId: formData.get("courseId"),
    isAvailable: formData.get("isAvailable"),
    credentialCode: formData.get("credentialCode"),
    validationUrl: formData.get("validationUrl"),
    completionDate: formData.get("completionDate"),
    issueDate: formData.get("issueDate"),
    expirationDate: formData.get("expirationDate"),
    notes: formData.get("notes"),
  };
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

  let query = supabase.from("certificates").select(certificateSelect, { count: "exact" }).eq("user_id", authData.user.id);
  const deleted = params.get("deleted");
  if (deleted === "true") query = query.not("deleted_at", "is", null);
  else if (deleted !== "all") query = query.is("deleted_at", null);

  const courseId = params.get("courseId");
  if (courseId) query = query.eq("course_id", courseId);
  if (params.get("available") === "true") query = query.eq("is_available", true);
  if (params.get("available") === "false") query = query.eq("is_available", false);

  const expirationBefore = params.get("expirationBefore");
  if (expirationBefore) query = query.lte("expiration_date", expirationBefore);

  const search = cleanSearch(params.get("search") ?? "");
  if (search) query = query.or(`credential_code.ilike.%${search}%,notes.ilike.%${search}%`);

  const { data, error, count } = await query.order("issue_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).range(from, to);
  if (error) return NextResponse.json({ message: "Não foi possível carregar os certificados.", details: error.message }, { status: 500 });

  return NextResponse.json({
    certificates: (data ?? []).map((row: unknown) => mapCertificateRow(row as Record<string, unknown>)),
    pagination: { page, pageSize, total: count ?? 0, pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ message: "Dados do certificado inválidos." }, { status: 422 });
  const parsed = parseCertificateInput(formToBody(formData));
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const fileError = validateCertificateFile(file);
  if (fileError) return NextResponse.json({ message: fileError }, { status: 422 });

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, completion_date")
    .eq("id", parsed.data.courseId)
    .eq("user_id", authData.user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (courseError) return NextResponse.json({ message: "Não foi possível validar o curso.", details: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });

  const dbInput = certificateInputToDatabase({
    ...parsed.data,
    completionDate: parsed.data.completionDate ?? (typeof course.completion_date === "string" ? course.completion_date : null),
  });

  const { data: created, error } = await supabase
    .from("certificates")
    .insert({ user_id: authData.user.id, ...dbInput })
    .select(certificateSelect)
    .single();
  if (error) return NextResponse.json({ message: "Não foi possível criar o certificado.", details: error.message }, { status: 500 });

  let finalRow = created as unknown as Record<string, unknown>;
  if (file) {
    const certificateId = String(created.id);
    const fileName = safeCertificateFileName(file.name);
    const fileKey = `${authData.user.id}/${certificateId}/${Date.now()}-${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(certificateBucket).upload(fileKey, bytes, {
      contentType: certificateContentType(file),
      upsert: false,
    });
    if (uploadError) {
      await supabase.from("certificates").delete().eq("id", certificateId).eq("user_id", authData.user.id);
      return NextResponse.json({ message: "O registro não foi salvo porque o arquivo não pôde ser enviado.", details: uploadError.message }, { status: 500 });
    }
    const { data: updated, error: updateError } = await supabase
      .from("certificates")
      .update({ file_key: fileKey, file_name: file.name.slice(0, 255), mime_type: certificateContentType(file), size: file.size })
      .eq("id", certificateId)
      .eq("user_id", authData.user.id)
      .select(certificateSelect)
      .single();
    if (updateError) {
      await supabase.storage.from(certificateBucket).remove([fileKey]);
      await supabase.from("certificates").delete().eq("id", certificateId).eq("user_id", authData.user.id);
      return NextResponse.json({ message: "O arquivo foi recusado ao finalizar o certificado.", details: updateError.message }, { status: 500 });
    }
    finalRow = updated as unknown as Record<string, unknown>;
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "certificate.created",
    entity_type: "certificate",
    entity_id: String(created.id),
    metadata: { courseId: parsed.data.courseId, hasFile: Boolean(file), available: parsed.data.isAvailable },
  });

  return NextResponse.json({ message: "Certificado criado com sucesso.", certificate: mapCertificateRow(finalRow) }, { status: 201 });
}
