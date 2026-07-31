"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { courseKindLabels, courseKinds, coursePriorities, coursePriorityLabels, courseStatuses, courseStatusLabels } from "@/lib/courses/constants";
import type { Course, CourseInput, CourseListOption } from "@/types/course";

type Notice = { type: "error" | "success"; text: string } | null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyInput(platforms: CourseListOption[], areas: CourseListOption[]): CourseInput {
  return {
    name: "",
    kind: "COURSE",
    platformId: platforms[0]?.id ?? "",
    areaId: areas[0]?.id ?? "",
    workloadHours: 0,
    status: "PLANNED",
    priority: "MEDIUM",
    startDate: null,
    targetCompletionDate: null,
    completionDate: null,
    emitsCertificate: false,
    url: null,
    notes: null,
  };
}

function courseToInput(course: Course): CourseInput {
  return {
    name: course.name,
    kind: course.kind,
    platformId: course.platform.id,
    areaId: course.area.id,
    workloadHours: course.workloadHours,
    status: course.status,
    priority: course.priority,
    startDate: course.startDate,
    targetCompletionDate: course.targetCompletionDate,
    completionDate: course.completionDate,
    emitsCertificate: course.emitsCertificate,
    url: course.url,
    notes: course.notes,
  };
}

export function CourseFormModal({
  course,
  platforms,
  areas,
  onClose,
  onSaved,
}: {
  course: Course | null;
  platforms: CourseListOption[];
  areas: CourseListOption[];
  onClose: () => void;
  onSaved: (course: Course, message: string) => void;
}) {
  const [form, setForm] = useState<CourseInput>(() => course ? courseToInput(course) : emptyInput(platforms, areas));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function update<K extends keyof CourseInput>(key: K, value: CourseInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeStatus(value: CourseInput["status"]) {
    setForm((current) => ({
      ...current,
      status: value,
      startDate: value === "IN_PROGRESS" && !current.startDate ? today() : current.startDate,
      completionDate: value === "COMPLETED" ? current.completionDate ?? today() : null,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    const response = await fetch(course ? `/api/courses/${course.id}` : "/api/courses", {
      method: course ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => ({})) as { message?: string; course?: Course };
    setSaving(false);

    if (!response.ok || !payload.course) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível salvar o curso." });
      return;
    }

    onSaved(payload.course, payload.message ?? "Curso salvo com sucesso.");
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <header className="modal-header">
          <div><h2 id="course-modal-title">{course ? "Editar curso" : "Novo curso"}</h2><p>Preencha os dados principais. As horas estudadas serão calculadas pelas sessões nas próximas versões.</p></div>
          <button type="button" className="icon-action" aria-label="Fechar" onClick={onClose}><X size={18} /></button>
        </header>

        <form onSubmit={submit} className="modal-body">
          {notice && <div className={`settings-notice ${notice.type}`} role="alert">{notice.text}</div>}
          <div className="course-form-grid">
            <div className="form-field full"><label htmlFor="course-name">Nome *</label><input id="course-name" className="form-control" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={160} autoFocus required /></div>
            <div className="form-field"><label htmlFor="course-kind">Tipo *</label><select id="course-kind" className="form-control" value={form.kind} onChange={(event) => update("kind", event.target.value as CourseInput["kind"])}>{courseKinds.map((kind) => <option key={kind} value={kind}>{courseKindLabels[kind]}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-platform">Plataforma *</label><select id="course-platform" className="form-control" value={form.platformId} onChange={(event) => update("platformId", event.target.value)} required><option value="">Selecione</option>{platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-area">Área *</label><select id="course-area" className="form-control" value={form.areaId} onChange={(event) => update("areaId", event.target.value)} required><option value="">Selecione</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-workload">Carga horária</label><input id="course-workload" className="form-control" type="number" min="0" max="9999.99" step="0.25" value={form.workloadHours} onChange={(event) => update("workloadHours", Number(event.target.value))} /></div>
            <div className="form-field"><label htmlFor="course-status">Status *</label><select id="course-status" className="form-control" value={form.status} onChange={(event) => changeStatus(event.target.value as CourseInput["status"])}>{courseStatuses.map((status) => <option key={status} value={status}>{courseStatusLabels[status]}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-priority">Prioridade *</label><select id="course-priority" className="form-control" value={form.priority} onChange={(event) => update("priority", event.target.value as CourseInput["priority"])}>{coursePriorities.map((priority) => <option key={priority} value={priority}>{coursePriorityLabels[priority]}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-start">Data de início</label><input id="course-start" className="form-control" type="date" value={form.startDate ?? ""} onChange={(event) => update("startDate", event.target.value || null)} /></div>
            <div className="form-field"><label htmlFor="course-target">Meta de conclusão</label><input id="course-target" className="form-control" type="date" value={form.targetCompletionDate ?? ""} onChange={(event) => update("targetCompletionDate", event.target.value || null)} /></div>
            <div className="form-field"><label htmlFor="course-completion">Data de conclusão</label><input id="course-completion" className="form-control" type="date" value={form.completionDate ?? ""} disabled={form.status !== "COMPLETED"} onChange={(event) => update("completionDate", event.target.value || null)} /></div>
            <div className="form-field full"><label className="checkbox-field"><input type="checkbox" checked={form.emitsCertificate} onChange={(event) => update("emitsCertificate", event.target.checked)} /><span>Este curso ou certificação emite certificado/credencial</span></label></div>
            <div className="form-field full"><label htmlFor="course-url">Link do curso</label><input id="course-url" className="form-control" type="url" placeholder="https://..." value={form.url ?? ""} onChange={(event) => update("url", event.target.value || null)} maxLength={2048} /></div>
            <div className="form-field full"><label htmlFor="course-notes">Observações</label><textarea id="course-notes" className="form-control textarea course-notes" value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value || null)} maxLength={5000} /></div>
          </div>

          <footer className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || platforms.length === 0 || areas.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{saving ? "Salvando..." : course ? "Salvar alterações" : "Criar curso"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
