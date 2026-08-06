"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, FileUp, LoaderCircle, X } from "lucide-react";
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
  const [form, setForm] = useState({
    courseId: initialCourseId,
    isAvailable: certificate?.isAvailable ?? true,
    credentialCode: certificate?.credentialCode ?? "",
    validationUrl: certificate?.validationUrl ?? "",
    completionDate: certificate?.completionDate ?? initialCourse?.completionDate ?? "",
    issueDate: certificate?.issueDate ?? "",
    expirationDate: certificate?.expirationDate ?? "",
    notes: certificate?.notes ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [moreOpen, setMoreOpen] = useState(Boolean(certificate?.credentialCode || certificate?.expirationDate || certificate?.notes));
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
    Object.entries(form).forEach(([key, value]) => data.set(key, String(value)));
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
      <div className="modal-card redesign-modal certificate-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-modal-title">
        <div className="modal-header">
          <div><h2 id="certificate-modal-title">{certificate ? "Editar certificado" : "Adicionar certificado"}</h2><p>Registre sua conquista com os dados essenciais. Os detalhes adicionais são opcionais.</p></div>
          <button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          {error && <div className="settings-notice error" role="alert">{error}</div>}
          <div className="certificate-primary-form">
            <div className="form-field full"><label htmlFor="certificate-course">Curso</label><select id="certificate-course" className="form-control" value={form.courseId} onChange={(event) => selectCourse(event.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>{selectedCourse && <span className="field-hint">{selectedCourse.platform.name} • {selectedCourse.area.name}</span>}</div>
            <div className="form-field"><label htmlFor="certificate-status">Status</label><select id="certificate-status" className="form-control" value={form.isAvailable ? "available" : "pending"} onChange={(event) => change("isAvailable", event.target.value === "available")}><option value="available">Obtido / disponível</option><option value="pending">Pendente</option></select></div>
            <div className="form-field"><label htmlFor="certificate-issue">Data de emissão</label><input id="certificate-issue" className="form-control" type="date" value={form.issueDate} onChange={(event) => change("issueDate", event.target.value)} /></div>
            <div className="form-field full"><label>Arquivo ou link</label><label className="certificate-file-picker" htmlFor="certificate-file"><FileUp size={24} /><span><strong>{file ? file.name : certificate?.fileName || "Selecionar PDF ou imagem"}</strong><small>PDF, JPG ou PNG • máximo 10 MB</small></span></label><input id="certificate-file" className="sr-only-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><input className="form-control certificate-url-input" type="url" value={form.validationUrl} onChange={(event) => change("validationUrl", event.target.value)} placeholder="Ou cole o link de validação" /></div>
          </div>

          <button className="more-options-toggle" type="button" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><span>Mais opções</span><ChevronDown size={17} className={moreOpen ? "open" : ""} /></button>
          {moreOpen && <div className="course-form-grid more-options-panel"><div className="form-field"><label htmlFor="certificate-completion">Conclusão</label><input id="certificate-completion" className="form-control" type="date" value={form.completionDate} onChange={(event) => change("completionDate", event.target.value)} /></div><div className="form-field"><label htmlFor="certificate-expiration">Validade</label><input id="certificate-expiration" className="form-control" type="date" value={form.expirationDate} onChange={(event) => change("expirationDate", event.target.value)} /></div><div className="form-field full"><label htmlFor="certificate-code">Código / Credencial</label><input id="certificate-code" className="form-control" value={form.credentialCode} onChange={(event) => change("credentialCode", event.target.value)} maxLength={300} placeholder="Ex.: ABC-12345" /></div><div className="form-field full"><label htmlFor="certificate-notes">Observações</label><textarea id="certificate-notes" className="form-control textarea" value={form.notes} onChange={(event) => change("notes", event.target.value)} maxLength={5000} /></div></div>}

          <div className="modal-footer"><button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" type="submit" disabled={saving || !form.courseId}>{saving ? <><LoaderCircle className="spin" size={16} /> Salvando...</> : certificate ? "Salvar alterações" : "Adicionar certificado"}</button></div>
        </form>
      </div>
    </div>
  );
}
