import type { CertificateInput } from "@/types/certificate";
import { allowedCertificateExtensions, allowedCertificateMimeTypes, maxCertificateFileBytes } from "@/lib/certificates/constants";

function asText(value: unknown, max = 5000) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function dateOrNull(value: unknown) {
  const text = asText(value, 10);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const date = new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) return undefined;
  return text;
}

function urlOrNull(value: unknown) {
  const text = asText(value, 1000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return text;
  } catch {
    return undefined;
  }
}

export function parseCertificateInput(body: Record<string, unknown> | null): { data?: CertificateInput; error?: string } {
  if (!body) return { error: "Dados do certificado inválidos." };
  const courseId = asText(body.courseId, 80);
  if (!courseId) return { error: "Selecione o curso ou certificação." };

  const completionDate = dateOrNull(body.completionDate);
  const issueDate = dateOrNull(body.issueDate);
  const expirationDate = dateOrNull(body.expirationDate);
  if (completionDate === undefined) return { error: "Informe uma data de conclusão válida." };
  if (issueDate === undefined) return { error: "Informe uma data de emissão válida." };
  if (expirationDate === undefined) return { error: "Informe uma data de validade válida." };
  if (issueDate && completionDate && issueDate < completionDate) return { error: "A data de emissão não pode ser anterior à conclusão." };
  if (expirationDate && issueDate && expirationDate < issueDate) return { error: "A validade não pode ser anterior à emissão." };

  const validationUrl = urlOrNull(body.validationUrl);
  if (validationUrl === undefined) return { error: "Informe um link de validação válido." };

  return {
    data: {
      courseId,
      isAvailable: body.isAvailable === true || body.isAvailable === "true" || body.isAvailable === "on",
      credentialCode: asText(body.credentialCode, 300),
      validationUrl,
      completionDate,
      issueDate,
      expirationDate,
      notes: asText(body.notes, 5000),
    },
  };
}

export function certificateInputToDatabase(input: CertificateInput) {
  return {
    course_id: input.courseId,
    is_available: input.isAvailable,
    credential_code: input.credentialCode,
    validation_url: input.validationUrl,
    completion_date: input.completionDate,
    issue_date: input.issueDate,
    expiration_date: input.expirationDate,
    notes: input.notes,
  };
}

export function validateCertificateFile(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (file.size > maxCertificateFileBytes) return "O arquivo deve ter no máximo 10 MB.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedCertificateExtensions.includes(extension as (typeof allowedCertificateExtensions)[number])) return "Envie um arquivo PDF, JPG, JPEG ou PNG.";
  if (file.type && !allowedCertificateMimeTypes.includes(file.type as (typeof allowedCertificateMimeTypes)[number])) return "O tipo do arquivo não é permitido.";
  return null;
}

export function safeCertificateFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "bin";
  const base = name.replace(/\.[^.]+$/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-_.]+|[-_.]+$/g, "").slice(0, 100) || "certificado";
  return `${base}.${extension}`;
}

export function certificateContentType(file: File) {
  if (file.type && allowedCertificateMimeTypes.includes(file.type as (typeof allowedCertificateMimeTypes)[number])) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  return "image/jpeg";
}
