import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { certificateBucket } from "@/lib/certificates/constants";
import { certificateSelect, mapCertificateRow } from "@/lib/certificates/mappers";
import { certificateContentType, certificateInputToDatabase, parseCertificateInput, safeCertificateFileName, validateCertificateFile } from "@/lib/certificates/validation";

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

async function authenticatedCertificate(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { response: NextResponse.json({ message: "Sessão inválida." }, { status: 401 }) };
  const { data, error } = await supabase.from("certificates").select("id, user_id, course_id, file_key, file_name, deleted_at").eq("id", id).eq("user_id", authData.user.id).maybeSingle();
  if (error) return { response: NextResponse.json({ message: "Não foi possível localizar o certificado.", details: error.message }, { status: 500 }) };
  if (!data) return { response: NextResponse.json({ message: "Certificado não encontrado." }, { status: 404 }) };
  return { supabase, userId: authData.user.id, certificate: data };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedCertificate(id);
  if ("response" in result) return result.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (body?.action === "restore") {
      if (!result.certificate.deleted_at) return NextResponse.json({ message: "Este certificado não está na lixeira." }, { status: 409 });
      const { data, error } = await result.supabase.from("certificates").update({ deleted_at: null }).eq("id", id).eq("user_id", result.userId).select(certificateSelect).single();
      if (error) return NextResponse.json({ message: "Não foi possível restaurar o certificado.", details: error.message }, { status: 500 });
      await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "certificate.restored", entity_type: "certificate", entity_id: id, metadata: {} });
      return NextResponse.json({ message: "Certificado restaurado.", certificate: mapCertificateRow(data as unknown as Record<string, unknown>) });
    }
    return NextResponse.json({ message: "Ação inválida." }, { status: 422 });
  }

  if (result.certificate.deleted_at) return NextResponse.json({ message: "Restaure o certificado antes de editá-lo." }, { status: 409 });
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ message: "Dados do certificado inválidos." }, { status: 422 });
  const parsed = parseCertificateInput(formToBody(formData));
  if (!parsed.data) return NextResponse.json({ message: parsed.error }, { status: 422 });

  const { data: course } = await result.supabase.from("courses").select("id, completion_date").eq("id", parsed.data.courseId).eq("user_id", result.userId).is("archived_at", null).maybeSingle();
  if (!course) return NextResponse.json({ message: "O curso selecionado não está disponível." }, { status: 422 });

  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const fileError = validateCertificateFile(file);
  if (fileError) return NextResponse.json({ message: fileError }, { status: 422 });

  let newFileKey: string | null = null;
  if (file) {
    const fileName = safeCertificateFileName(file.name);
    newFileKey = `${result.userId}/${id}/${Date.now()}-${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await result.supabase.storage.from(certificateBucket).upload(newFileKey, bytes, { contentType: certificateContentType(file), upsert: false });
    if (uploadError) return NextResponse.json({ message: "Não foi possível enviar o novo arquivo.", details: uploadError.message }, { status: 500 });
  }

  const update: Record<string, unknown> = certificateInputToDatabase({
    ...parsed.data,
    completionDate: parsed.data.completionDate ?? (typeof course.completion_date === "string" ? course.completion_date : null),
  });
  if (file && newFileKey) Object.assign(update, { file_key: newFileKey, file_name: file.name.slice(0, 255), mime_type: certificateContentType(file), size: file.size });

  const { data, error } = await result.supabase.from("certificates").update(update).eq("id", id).eq("user_id", result.userId).select(certificateSelect).single();
  if (error) {
    if (newFileKey) await result.supabase.storage.from(certificateBucket).remove([newFileKey]);
    return NextResponse.json({ message: "Não foi possível atualizar o certificado.", details: error.message }, { status: 500 });
  }

  if (file && newFileKey && result.certificate.file_key) await result.supabase.storage.from(certificateBucket).remove([String(result.certificate.file_key)]);
  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "certificate.updated", entity_type: "certificate", entity_id: id, metadata: { courseId: parsed.data.courseId, replacedFile: Boolean(file) } });
  return NextResponse.json({ message: file ? "Certificado e arquivo atualizados." : "Certificado atualizado com sucesso.", certificate: mapCertificateRow(data as unknown as Record<string, unknown>) });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await authenticatedCertificate(id);
  if ("response" in result) return result.response;
  if (result.certificate.deleted_at) return NextResponse.json({ message: "Este certificado já está na lixeira." }, { status: 409 });
  const { data, error } = await result.supabase.from("certificates").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", result.userId).select(certificateSelect).single();
  if (error) return NextResponse.json({ message: "Não foi possível excluir o certificado.", details: error.message }, { status: 500 });
  await result.supabase.from("audit_logs").insert({ user_id: result.userId, action: "certificate.deleted", entity_type: "certificate", entity_id: id, metadata: {} });
  return NextResponse.json({ message: "Certificado movido para a lixeira. O arquivo privado foi preservado.", certificate: mapCertificateRow(data as unknown as Record<string, unknown>) });
}
