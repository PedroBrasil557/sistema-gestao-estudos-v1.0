"use client";

import { useState, type FormEvent } from "react";
import { FileUp, LoaderCircle, X } from "lucide-react";
import type { Certificate, CertificateCourse } from "@/types/certificate";

type Props = {
  certificate: Certificate | null;
  courses: CertificateCourse[];
  defaultCourseId?: string | null;
  onClose: () => void;
  onSaved: (certificate: Certificate, message: string) => void;
};

export function CertificateFormModal({ certificate, courses, defaultCourseId, onClose, onSaved }: Props) {
  const initialCourseId = certificate?.course.id ?? defaultCourseId ?? courses[0]?.id ?? "";
  const initialCourse = courses.find((course) => course.id === initialCourseId);
  const initial = {
    courseId: initialCourseId,
    isAvailable: certificate?.isAvailable ?? false,
    credentialCode: certificate?.credentialCode ?? "",
    validationUrl: certificate?.validationUrl ?? "",
    completionDate: certificate?.completionDate ?? initialCourse?.completionDate ?? "",
    issueDate: certificate?.issueDate ?? "",
    expirationDate: certificate?.expirationDate ?? "",
    notes: certificate?.notes ?? "",
  };

  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectCourse(courseId: string) {
    const course = courses.find((item) => item.id === courseId);
    setForm((current) => ({ ...current, courseId, completionDate: current.completionDate || course?.completionDate || "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData();
    data.set("courseId", form.courseId);
    data.set("isAvailable", String(form.isAvailable));
    data.set("credentialCode", form.credentialCode);
    data.set("validationUrl", form.validationUrl);
    data.set("completionDate", form.completionDate);
    data.set("issueDate", form.issueDate);
    data.set("expirationDate", form.expirationDate);
    data.set("notes", form.notes);
    if (file) data.set("file", file);

    setSaving(true);
    const response = await fetch(certificate ? `/api/certificates/${certificate.id}` : "/api/certificates", { method: certificate ? "PATCH" : "POST", body: data });
    const result = await response.json().catch(() => ({})) as { message?: string; certificate?: Certificate };
    setSaving(false);
    if (!response.ok || !result.certificate) {
      setError(result.message ?? "Não foi possível salvar o certificado.");
      return;
    }
    onSaved(result.certificate, result.message ?? "Certificado salvo.");
  }

  const selectedCourse = courses.find((course) => course.id === form.courseId);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="modal-card certificate-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-modal-title">
        <div className="modal-header">
          <div><h2 id="certificate-modal-title">{certificate ? "Editar certificado" : "Novo certificado"}</h2><p>O arquivo é opcional. Você também pode registrar somente um código ou link de validação.</p></div>
          <button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          {error && <div className="settings-notice error" role="alert">{error}</div>}
          {courses.length === 0 && <div className="settings-notice error">Cadastre ou importe um curso antes de registrar certificados.</div>}
          <div className="course-form-grid certificate-form-grid">
            <div className="form-field full"><label htmlFor="certificate-course">Curso / Certificação</label><select id="certificate-course" className="form-control" value={form.courseId} onChange={(e) => selectCourse(e.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} — {course.platform.name}</option>)}</select>{selectedCourse && <span className="field-hint">{selectedCourse.area.name} • {selectedCourse.workloadHours || 0}h • {selectedCourse.kind === "CERTIFICATION" ? "Certificação profissional" : "Curso"}</span>}</div>
            <label className="checkbox-field certificate-available"><input type="checkbox" checked={form.isAvailable} onChange={(e) => change("isAvailable", e.target.checked)} /><span>Certificado já emitido / disponível</span></label>
            <div className="form-field"><label htmlFor="certificate-completion">Conclusão</label><input id="certificate-completion" className="form-control" type="date" value={form.completionDate} onChange={(e) => change("completionDate", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="certificate-issue">Emissão</label><input id="certificate-issue" className="form-control" type="date" value={form.issueDate} onChange={(e) => change("issueDate", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="certificate-expiration">Validade</label><input id="certificate-expiration" className="form-control" type="date" value={form.expirationDate} onChange={(e) => change("expirationDate", e.target.value)} /><span className="field-hint">Deixe em branco se não expira.</span></div>
            <div className="form-field"><label htmlFor="certificate-code">Código / Credencial</label><input id="certificate-code" className="form-control" value={form.credentialCode} onChange={(e) => change("credentialCode", e.target.value)} maxLength={300} placeholder="Ex.: ABC-12345" /></div>
            <div className="form-field full"><label htmlFor="certificate-validation">Link de validação</label><input id="certificate-validation" className="form-control" type="url" value={form.validationUrl} onChange={(e) => change("validationUrl", e.target.value)} placeholder="https://..." /></div>
            <div className="form-field full"><label htmlFor="certificate-file">Arquivo privado</label><label className="certificate-file-picker" htmlFor="certificate-file"><FileUp size={22} /><span><strong>{file ? file.name : certificate?.fileName || "Selecionar PDF ou imagem"}</strong><small>PDF, JPG, JPEG ou PNG • máximo 10 MB{certificate?.fileName && !file ? " • escolha outro arquivo apenas para substituir" : ""}</small></span></label><input id="certificate-file" className="sr-only-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <div className="form-field full"><label htmlFor="certificate-notes">Observações</label><textarea id="certificate-notes" className="form-control textarea" value={form.notes} onChange={(e) => change("notes", e.target.value)} maxLength={5000} placeholder="Informações adicionais sobre a emissão, prova ou credencial." /></div>
          </div>
          <div className="modal-footer"><button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" type="submit" disabled={saving || !form.courseId}>{saving ? <><LoaderCircle className="spin" size={16} /> Salvando...</> : certificate ? "Salvar alterações" : "Criar certificado"}</button></div>
        </form>
      </div>
    </div>
  );
}
