"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bell, Check, ChevronDown, Clock3, LoaderCircle, X } from "lucide-react";
import type { LanguageSkill, StudyCourseOption, StudySession, StudySessionInput, StudyTypeOption } from "@/types/study-session";

type Mode = "register" | "plan";
type Props = {
  mode: Mode;
  session: StudySession | null;
  seed?: Partial<StudySessionInput> | null;
  courses: StudyCourseOption[];
  studyTypes: StudyTypeOption[];
  defaultCourseId?: string | null;
  onClose: () => void;
  onSaved: (session: StudySession, message: string) => void;
};

const shortcuts = [15, 30, 45, 60, 90, 120];
const skills: Array<{ value: LanguageSkill; label: string }> = [
  { value: "READING", label: "Leitura" },
  { value: "WRITING", label: "Escrita" },
  { value: "SPEAKING", label: "Conversação" },
  { value: "LISTENING", label: "Escuta" },
  { value: "PRONUNCIATION", label: "Pronúncia" },
  { value: "GRAMMAR", label: "Gramática" },
  { value: "VOCABULARY", label: "Vocabulário" },
  { value: "REVIEW", label: "Revisão" },
];

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hoursToMinutes(value: number | null | undefined) { return Math.round((value ?? 0) * 60); }
function minutesToHours(value: number) { return Math.round((value / 60) * 100) / 100; }
function durationLabel(value: number) { const hours = Math.floor(value / 60); const minutes = value % 60; return hours ? (minutes ? `${hours}h${minutes}` : `${hours}h`) : `${minutes} min`; }

export function StudySessionFormModal({ mode, session, seed, courses, studyTypes, defaultCourseId, onClose, onSaved }: Props) {
  const initial = useMemo(() => {
    const selectedCourseId = session?.course.id ?? seed?.courseId ?? defaultCourseId ?? courses[0]?.id ?? "";
    const initialMinutes = mode === "plan" ? hoursToMinutes(session?.plannedHours ?? seed?.plannedHours ?? 60) : hoursToMinutes(session?.studiedHours ?? seed?.studiedHours ?? 60);
    return {
      studyDate: session?.studyDate ?? seed?.studyDate ?? localToday(),
      scheduledTime: session?.scheduledTime ?? seed?.scheduledTime ?? "",
      courseId: selectedCourseId,
      topic: session?.topic ?? seed?.topic ?? "",
      durationMinutes: initialMinutes || 60,
      studyTypeId: session?.studyType.id ?? seed?.studyTypeId ?? studyTypes[0]?.id ?? "",
      languageSkill: session?.languageSkill ?? seed?.languageSkill ?? "",
      resource: session?.resource ?? seed?.resource ?? "",
      recurrenceRule: session?.recurrenceRule ?? seed?.recurrenceRule ?? "",
      reminder: Boolean(session?.reminderAt ?? seed?.reminderAt),
      notes: session?.notes ?? seed?.notes ?? "",
    };
  }, [mode, session, seed, defaultCourseId, courses, studyTypes]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(Boolean(session));
  const selectedCourse = courses.find((course) => course.id === form.courseId) ?? null;
  const isLanguage = selectedCourse?.group === "LANGUAGE";

  function change<K extends keyof typeof form>(field: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (form.durationMinutes <= 0 || form.durationMinutes > 1440) { setError("A duração deve estar entre 1 minuto e 24 horas."); return; }

    const hours = minutesToHours(form.durationMinutes);
    const reminderAt = form.reminder && form.scheduledTime ? `${form.studyDate}T${form.scheduledTime}:00` : null;
    const payload: StudySessionInput = {
      studyDate: form.studyDate,
      scheduledTime: mode === "plan" ? form.scheduledTime || null : session?.scheduledTime ?? null,
      courseId: form.courseId,
      topic: form.topic,
      plannedHours: mode === "plan" ? hours : (session?.plannedHours ?? seed?.plannedHours ?? null),
      studiedHours: mode === "register" ? hours : 0,
      status: mode === "plan" ? "PLANNED" : "COMPLETED",
      languageSkill: isLanguage && form.languageSkill ? form.languageSkill as LanguageSkill : null,
      studyTypeId: form.studyTypeId,
      resource: form.resource.trim() || null,
      recurrenceRule: mode === "plan" ? form.recurrenceRule.trim() || null : null,
      reminderAt,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    const response = await fetch(session ? `/api/study-sessions/${session.id}` : "/api/study-sessions", { method: session ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setSaving(false);
    if (!response.ok || !result.session) { setError(result.message ?? "Não foi possível salvar o estudo."); return; }
    onSaved(result.session, result.message ?? (mode === "plan" ? "Estudo planejado." : "Estudo registrado."));
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="modal-card redesign-modal quick-study-modal" role="dialog" aria-modal="true" aria-labelledby="study-session-title">
        <div className="modal-header"><div><h2 id="study-session-title">{session ? "Editar estudo" : mode === "plan" ? "Planejar estudo" : "Registrar estudo"}</h2><p>{mode === "plan" ? "Organize o que será estudado sem misturar com as horas já realizadas." : "Registre rapidamente o que você estudou. As métricas serão atualizadas automaticamente."}</p></div><button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button></div>
        <form onSubmit={submit} className="modal-body">
          {error && <div className="settings-notice error" role="alert">{error}</div>}
          <div className="quick-study-grid">
            <div className="form-field"><label htmlFor="session-date">Data</label><input id="session-date" className="form-control" type="date" value={form.studyDate} onChange={(event) => change("studyDate", event.target.value)} required /></div>
            {mode === "plan" && <div className="form-field"><label htmlFor="session-time">Horário opcional</label><input id="session-time" className="form-control" type="time" value={form.scheduledTime} onChange={(event) => change("scheduledTime", event.target.value)} /></div>}
            <div className="form-field full"><label htmlFor="session-course">Curso</label><select id="session-course" className="form-control" value={form.courseId} onChange={(event) => change("courseId", event.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>
            <div className="form-field full"><label htmlFor="session-topic">Atividade ou assunto</label><input id="session-topic" className="form-control" value={form.topic} onChange={(event) => change("topic", event.target.value)} maxLength={240} placeholder="Ex.: Conversação sobre viagens" required /></div>
            <div className="form-field full"><label>Duração</label><div className="duration-shortcuts">{shortcuts.map((minutes) => <button key={minutes} type="button" className={form.durationMinutes === minutes ? "active" : ""} onClick={() => change("durationMinutes", minutes)}>{durationLabel(minutes)}</button>)}</div><div className="duration-custom"><Clock3 size={17} /><input type="number" min="1" max="1440" value={form.durationMinutes} onChange={(event) => change("durationMinutes", Number(event.target.value))} aria-label="Duração em minutos" /><span>minutos</span></div></div>
            <div className="form-field"><label htmlFor="session-type">Tipo de estudo</label><select id="session-type" className="form-control" value={form.studyTypeId} onChange={(event) => change("studyTypeId", event.target.value)} required><option value="">Selecione</option>{studyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            {isLanguage && <div className="form-field"><label htmlFor="language-skill">Habilidade do idioma</label><select id="language-skill" className="form-control" value={form.languageSkill} onChange={(event) => change("languageSkill", event.target.value as LanguageSkill | "")}><option value="">Selecione</option>{skills.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>}
            <div className="form-field full"><label htmlFor="session-notes">Observação opcional</label><textarea id="session-notes" className="form-control textarea" value={form.notes} onChange={(event) => change("notes", event.target.value)} maxLength={5000} placeholder="O que funcionou, dificuldades ou pontos para revisar..." /></div>
          </div>

          {mode === "plan" && <><button className="more-options-toggle" type="button" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><span>Mais opções</span><ChevronDown size={17} className={moreOpen ? "open" : ""} /></button>{moreOpen && <div className="more-options-panel quick-study-grid"><div className="form-field full"><label htmlFor="session-resource">Recurso</label><input id="session-resource" className="form-control" value={form.resource} onChange={(event) => change("resource", event.target.value)} placeholder="Ex.: aula 4, livro, vídeo, exercício" /></div><div className="form-field"><label htmlFor="session-recurrence">Recorrência</label><select id="session-recurrence" className="form-control" value={form.recurrenceRule} onChange={(event) => change("recurrenceRule", event.target.value)}><option value="">Sem recorrência</option><option value="WEEKLY">Semanal</option><option value="WEEKDAYS">Dias úteis</option><option value="DAILY">Diária</option></select></div><div className="form-field"><label className="checkbox-field"><input type="checkbox" checked={form.reminder} onChange={(event) => change("reminder", event.target.checked)} /><Bell size={16} /><span>Lembrete no horário</span></label></div></div>}</>}

          <footer className="modal-footer"><button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" type="submit" disabled={saving || courses.length === 0 || studyTypes.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? "Salvando..." : mode === "plan" ? "Salvar planejamento" : "Registrar estudo"}</button></footer>
        </form>
      </div>
    </div>
  );
}
