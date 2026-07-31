"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { sessionStatuses, sessionStatusLabels } from "@/lib/study-sessions/constants";
import type { StudyCourseOption, StudySession, StudySessionInput, StudyTypeOption } from "@/types/study-session";

type Props = {
  session: StudySession | null;
  seed?: Partial<StudySessionInput> | null;
  courses: StudyCourseOption[];
  studyTypes: StudyTypeOption[];
  defaultCourseId?: string | null;
  onClose: () => void;
  onSaved: (session: StudySession, message: string) => void;
};

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hoursInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

function numeric(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function StudySessionFormModal({ session, seed, courses, studyTypes, defaultCourseId, onClose, onSaved }: Props) {
  const initial = useMemo(() => ({
    studyDate: session?.studyDate ?? seed?.studyDate ?? localToday(),
    courseId: session?.course.id ?? seed?.courseId ?? defaultCourseId ?? courses[0]?.id ?? "",
    topic: session?.topic ?? seed?.topic ?? "",
    plannedHours: hoursInput(session?.plannedHours ?? seed?.plannedHours),
    studiedHours: hoursInput(session?.studiedHours ?? seed?.studiedHours ?? 0),
    status: session?.status ?? seed?.status ?? "PLANNED",
    studyTypeId: session?.studyType.id ?? seed?.studyTypeId ?? studyTypes[0]?.id ?? "",
    notes: session?.notes ?? seed?.notes ?? "",
  }), [session, seed, defaultCourseId, courses, studyTypes]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const plannedHours = numeric(form.plannedHours);
    let studiedHours = numeric(form.studiedHours) ?? 0;
    if (Number.isNaN(plannedHours) || Number.isNaN(studiedHours)) {
      setError("Informe as horas utilizando números, por exemplo 1,5.");
      return;
    }

    if (form.status === "CANCELLED" && studiedHours > 0) {
      const keep = window.confirm("Esta sessão cancelada possui horas registradas. Clique em OK para manter as horas no histórico ou em Cancelar para zerá-las.");
      if (!keep) {
        studiedHours = 0;
        setForm((current) => ({ ...current, studiedHours: "0" }));
      }
    }

    const payload: StudySessionInput = {
      studyDate: form.studyDate,
      courseId: form.courseId,
      topic: form.topic,
      plannedHours,
      studiedHours,
      status: form.status as StudySessionInput["status"],
      studyTypeId: form.studyTypeId,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    const response = await fetch(session ? `/api/study-sessions/${session.id}` : "/api/study-sessions", {
      method: session ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setSaving(false);

    if (!response.ok || !result.session) {
      setError(result.message ?? "Não foi possível salvar a sessão de estudo.");
      return;
    }

    onSaved(result.session, result.message ?? (session ? "Sessão atualizada." : "Sessão registrada."));
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="modal-card study-session-modal" role="dialog" aria-modal="true" aria-labelledby="study-session-title">
        <div className="modal-header">
          <div><h2 id="study-session-title">{session ? "Editar sessão de estudo" : seed ? "Duplicar sessão de estudo" : "Registrar sessão de estudo"}</h2><p>Uma única inclusão atualiza as horas e o progresso do curso.</p></div>
          <button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="modal-body">
            {error && <div className="settings-notice error" role="alert">{error}</div>}
            {courses.length === 0 && <div className="settings-notice error">Cadastre ou importe pelo menos um curso antes de registrar estudos.</div>}
            {studyTypes.length === 0 && <div className="settings-notice error">Nenhum tipo de estudo está disponível nas Configurações.</div>}

            <div className="course-form-grid study-form-grid">
              <div className="form-field"><label htmlFor="session-date">Data</label><input id="session-date" className="form-control" type="date" value={form.studyDate} onChange={(event) => change("studyDate", event.target.value)} required /></div>
              <div className="form-field span-two"><label htmlFor="session-course">Curso</label><select id="session-course" className="form-control" value={form.courseId} onChange={(event) => change("courseId", event.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>
              <div className="form-field full"><label htmlFor="session-topic">Módulo ou assunto</label><input id="session-topic" className="form-control" value={form.topic} onChange={(event) => change("topic", event.target.value)} maxLength={240} placeholder="Ex.: Tabelas dinâmicas e segmentação de dados" required /></div>
              <div className="form-field"><label htmlFor="session-type">Tipo de estudo</label><select id="session-type" className="form-control" value={form.studyTypeId} onChange={(event) => change("studyTypeId", event.target.value)} required><option value="">Selecione</option>{studyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div className="form-field"><label htmlFor="session-status">Status</label><select id="session-status" className="form-control" value={form.status} onChange={(event) => change("status", event.target.value as StudySessionInput["status"])} required>{sessionStatuses.map((status) => <option key={status} value={status}>{sessionStatusLabels[status]}</option>)}</select></div>
              <div className="form-field"><label htmlFor="session-planned">Horas planejadas</label><input id="session-planned" className="form-control" inputMode="decimal" value={form.plannedHours} onChange={(event) => change("plannedHours", event.target.value)} placeholder="Ex.: 1,5" /></div>
              <div className="form-field"><label htmlFor="session-studied">Horas estudadas</label><input id="session-studied" className="form-control" inputMode="decimal" value={form.studiedHours} onChange={(event) => change("studiedHours", event.target.value)} placeholder="Ex.: 1,25" required /></div>
              <div className="form-field full"><label htmlFor="session-notes">Observações</label><textarea id="session-notes" className="form-control textarea session-notes" value={form.notes} onChange={(event) => change("notes", event.target.value)} maxLength={5000} placeholder="Dificuldades, materiais utilizados ou pontos para revisar..." /></div>
            </div>
            <p className="form-help">Use horas decimais: 0,5 = 30 minutos; 1,25 = 1h15; 1,5 = 1h30. A soma diária não pode ultrapassar 24 horas.</p>

          <footer className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || courses.length === 0 || studyTypes.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? "Salvando..." : session ? "Salvar alterações" : "Registrar estudo"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
