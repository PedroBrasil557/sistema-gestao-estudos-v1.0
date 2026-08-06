"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, LoaderCircle, Save, X } from "lucide-react";
import { ColorPicker } from "@/components/ui";
import { coursePalette } from "@/lib/visuals";
import { coursePriorities, coursePriorityLabels, courseStatuses, courseStatusLabels } from "@/lib/courses/constants";
import type { Course, CourseInput, CourseListOption } from "@/types/course";

type Notice = { type: "error" | "success"; text: string } | null;

function today() { return new Date().toISOString().slice(0, 10); }

function emptyInput(platforms: CourseListOption[], areas: CourseListOption[]): CourseInput {
  return {
    name: "",
    kind: "COURSE",
    group: "PROFESSIONAL",
    color: "#2F6BFF",
    icon: "book-open",
    weeklyGoalMinutes: 180,
    currentLevel: null,
    targetLevel: null,
    objective: null,
    complementaryResources: [],
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
    group: course.group,
    color: course.color,
    icon: course.icon,
    weeklyGoalMinutes: course.weeklyGoalMinutes,
    currentLevel: course.currentLevel,
    targetLevel: course.targetLevel,
    objective: course.objective,
    complementaryResources: course.complementaryResources,
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

const iconOptions = [
  ["book-open", "Livro"], ["languages", "Idiomas"], ["sheet", "Planilha"],
  ["file-text", "Documento"], ["bar-chart", "Gráfico"], ["database", "Banco de dados"],
  ["wallet", "Finanças"], ["award", "Certificação"], ["code", "Programação"],
];

export function CourseFormModal({ course, platforms, areas, onClose, onSaved }: { course: Course | null; platforms: CourseListOption[]; areas: CourseListOption[]; onClose: () => void; onSaved: (course: Course, message: string) => void }) {
  const [form, setForm] = useState<CourseInput>(() => course ? courseToInput(course) : emptyInput(platforms, areas));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [moreOpen, setMoreOpen] = useState(Boolean(course));

  function update<K extends keyof CourseInput>(key: K, value: CourseInput[K]) { setForm((current) => ({ ...current, [key]: value })); }

  function changeStatus(value: CourseInput["status"]) {
    setForm((current) => ({ ...current, status: value, startDate: value === "IN_PROGRESS" && !current.startDate ? today() : current.startDate, completionDate: value === "COMPLETED" ? current.completionDate ?? today() : null }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    const response = await fetch(course ? `/api/courses/${course.id}` : "/api/courses", { method: course ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json().catch(() => ({})) as { message?: string; course?: Course };
    setSaving(false);
    if (!response.ok || !payload.course) { setNotice({ type: "error", text: payload.message ?? "Não foi possível salvar o curso." }); return; }
    onSaved(payload.course, payload.message ?? "Curso salvo com sucesso.");
  }

  const isLanguage = form.group === "LANGUAGE";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card redesign-modal course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <header className="modal-header"><div><h2 id="course-modal-title">{course ? "Editar curso" : "Novo curso"}</h2><p>Cadastre apenas o essencial agora. Os detalhes opcionais ficam organizados em uma seção separada.</p></div><button type="button" className="icon-action" aria-label="Fechar" onClick={onClose}><X size={18} /></button></header>
        <form onSubmit={submit} className="modal-body">
          {notice && <div className={`settings-notice ${notice.type}`} role="alert">{notice.text}</div>}
          <div className="segmented-control" aria-label="Tipo de curso">
            <button type="button" className={isLanguage ? "active" : ""} onClick={() => update("group", "LANGUAGE")}>Idioma</button>
            <button type="button" className={!isLanguage ? "active" : ""} onClick={() => update("group", "PROFESSIONAL")}>Profissionalizante</button>
          </div>

          <div className="course-form-grid simplified">
            <div className="form-field full"><label htmlFor="course-name">Nome *</label><input id="course-name" className="form-control" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={160} autoFocus required placeholder={isLanguage ? "Ex.: Inglês" : "Ex.: Excel Avançado"} /></div>
            <div className="form-field"><label htmlFor="course-area">Área ou categoria *</label><select id="course-area" className="form-control" value={form.areaId} onChange={(event) => update("areaId", event.target.value)} required><option value="">Selecione</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-platform">Plataforma principal *</label><select id="course-platform" className="form-control" value={form.platformId} onChange={(event) => update("platformId", event.target.value)} required><option value="">Selecione</option>{platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="form-field"><label htmlFor="course-icon">Ícone</label><select id="course-icon" className="form-control" value={form.icon} onChange={(event) => update("icon", event.target.value)}>{iconOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="form-field"><label>Cor do curso</label><ColorPicker value={form.color} onChange={(color) => update("color", color)} colors={coursePalette} /></div>
            <div className="form-field full"><label htmlFor="course-url">Link principal</label><input id="course-url" className="form-control" type="url" placeholder="https://..." value={form.url ?? ""} onChange={(event) => update("url", event.target.value || null)} maxLength={2048} /></div>
          </div>

          <section className="conditional-form-section">
            <h3>{isLanguage ? "Plano do idioma" : "Dados do curso"}</h3>
            <div className="course-form-grid">
              {isLanguage ? <>
                <div className="form-field"><label htmlFor="current-level">Nível atual</label><input id="current-level" className="form-control" value={form.currentLevel ?? ""} onChange={(event) => update("currentLevel", event.target.value || null)} placeholder="Ex.: A1" /></div>
                <div className="form-field"><label htmlFor="target-level">Nível desejado</label><input id="target-level" className="form-control" value={form.targetLevel ?? ""} onChange={(event) => update("targetLevel", event.target.value || null)} placeholder="Ex.: B2" /></div>
                <div className="form-field"><label htmlFor="weekly-goal">Meta semanal (minutos)</label><input id="weekly-goal" className="form-control" type="number" min="0" max="10080" step="15" value={form.weeklyGoalMinutes} onChange={(event) => update("weeklyGoalMinutes", Number(event.target.value))} /></div>
                <div className="form-field full"><label htmlFor="objective">Objetivo</label><textarea id="objective" className="form-control textarea" value={form.objective ?? ""} onChange={(event) => update("objective", event.target.value || null)} placeholder="Ex.: conversar com segurança em viagens e reuniões" /></div>
                <div className="form-field full"><label htmlFor="resources">Recursos complementares</label><input id="resources" className="form-control" value={form.complementaryResources.join(", ")} onChange={(event) => update("complementaryResources", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="YouTube, podcast, livro..." /></div>
              </> : <>
                <div className="form-field"><label htmlFor="course-workload">Carga horária</label><input id="course-workload" className="form-control" type="number" min="0" max="9999.99" step="0.25" value={form.workloadHours} onChange={(event) => update("workloadHours", Number(event.target.value))} /></div>
                <div className="form-field"><label htmlFor="course-status">Status *</label><select id="course-status" className="form-control" value={form.status} onChange={(event) => changeStatus(event.target.value as CourseInput["status"])}>{courseStatuses.map((status) => <option key={status} value={status}>{courseStatusLabels[status]}</option>)}</select></div>
                <div className="form-field"><label htmlFor="course-start">Data de início</label><input id="course-start" className="form-control" type="date" value={form.startDate ?? ""} onChange={(event) => update("startDate", event.target.value || null)} /></div>
                <div className="form-field"><label htmlFor="course-target">Meta de conclusão</label><input id="course-target" className="form-control" type="date" value={form.targetCompletionDate ?? ""} onChange={(event) => update("targetCompletionDate", event.target.value || null)} /></div>
                <div className="form-field full"><label className="checkbox-field"><input type="checkbox" checked={form.emitsCertificate} onChange={(event) => update("emitsCertificate", event.target.checked)} /><span>Este curso emite certificado</span></label></div>
              </>}
            </div>
          </section>

          <button className="more-options-toggle" type="button" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><span>Mais detalhes</span><ChevronDown size={17} className={moreOpen ? "open" : ""} /></button>
          {moreOpen && <div className="course-form-grid more-options-panel">
            {isLanguage && <div className="form-field"><label htmlFor="language-status">Status</label><select id="language-status" className="form-control" value={form.status} onChange={(event) => changeStatus(event.target.value as CourseInput["status"])}>{courseStatuses.map((status) => <option key={status} value={status}>{courseStatusLabels[status]}</option>)}</select></div>}
            {isLanguage && <div className="form-field"><label htmlFor="language-start">Data de início</label><input id="language-start" className="form-control" type="date" value={form.startDate ?? ""} onChange={(event) => update("startDate", event.target.value || null)} /></div>}
            <div className="form-field"><label htmlFor="course-priority">Prioridade</label><select id="course-priority" className="form-control" value={form.priority} onChange={(event) => update("priority", event.target.value as CourseInput["priority"])}>{coursePriorities.map((priority) => <option key={priority} value={priority}>{coursePriorityLabels[priority]}</option>)}</select></div>
            {!isLanguage && <div className="form-field"><label htmlFor="course-completion">Data de conclusão</label><input id="course-completion" className="form-control" type="date" value={form.completionDate ?? ""} disabled={form.status !== "COMPLETED"} onChange={(event) => update("completionDate", event.target.value || null)} /></div>}
            <div className="form-field full"><label htmlFor="course-notes">Observações</label><textarea id="course-notes" className="form-control textarea course-notes" value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value || null)} maxLength={5000} /></div>
          </div>}

          <footer className="modal-footer"><button className="secondary-button" type="button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={saving || platforms.length === 0 || areas.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{saving ? "Salvando..." : course ? "Salvar alterações" : "Criar curso"}</button></footer>
        </form>
      </section>
    </div>
  );
}
