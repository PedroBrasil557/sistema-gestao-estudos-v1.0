"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Award, BookOpen, Download, ExternalLink, FilePenLine, Pencil, Plus, ShieldCheck, Star } from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui";
import { CourseFormModal } from "@/components/courses/course-form-modal";
import { courseKindLabels, coursePriorityLabels, coursePriorityTones, courseStatusLabels, courseStatusTones } from "@/lib/courses/constants";
import { sessionStatusLabels, sessionStatusTones } from "@/lib/study-sessions/constants";
import { noteCategoryTone } from "@/lib/notes/constants";
import type { Course, CourseListOption } from "@/types/course";
import type { StudySession } from "@/types/study-session";
import type { Note } from "@/types/note";
import type { Certificate } from "@/types/certificate";

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatHours(value: number) {
  const totalMinutes = Math.round(Math.max(0, value) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function CourseDetailClient({ initialCourse, platforms, areas, isCurrent, initialSessions, initialNotes, initialCertificates }: { initialCourse: Course; platforms: CourseListOption[]; areas: CourseListOption[]; isCurrent: boolean; initialSessions: StudySession[]; initialNotes: Note[]; initialCertificates: Certificate[] }) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(isCurrent);
  const [notice, setNotice] = useState<string | null>(null);
  const remaining = Math.max(course.workloadHours - course.studiedHours, 0);

  async function setAsCurrent() {
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentCourseId: course.id }) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) { setNotice(payload.message ?? "Não foi possível definir o curso atual."); return; }
    setCurrent(true); setNotice("Curso atual atualizado com sucesso."); router.refresh();
  }

  async function archive() {
    if (!window.confirm(`Arquivar “${course.name}”?`)) return;
    const response = await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: true }) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) { setNotice(payload.message ?? "Não foi possível arquivar."); return; }
    router.push("/cursos"); router.refresh();
  }

  return (
    <div className="course-detail-page">
      <div className="course-detail-toolbar"><Link className="secondary-button" href="/cursos">← Voltar para cursos</Link><div><Link className="primary-button" href={`/estudos?curso=${course.id}&novo=1`}><BookOpen size={15} /> Registrar estudo</Link><Link className="secondary-button" href={`/anotacoes?curso=${course.id}&novo=1`}><FilePenLine size={15} /> Nova anotação</Link><button className="secondary-button" type="button" onClick={() => setEditing(true)}><Pencil size={15} /> Editar</button><button className="secondary-button" type="button" onClick={setAsCurrent} disabled={current}><Star size={15} /> {current ? "Curso atual" : "Definir como atual"}</button><button className="danger-button" type="button" onClick={archive}><Archive size={15} /> Arquivar</button></div></div>
      {notice && <div className="settings-notice success" role="status">{notice}</div>}

      <section className="card course-detail-hero">
        <div className="course-detail-icon">{course.kind === "CERTIFICATION" ? "C" : course.name.slice(0, 1).toUpperCase()}</div>
        <div className="course-detail-title"><div className="detail-badges"><Badge tone={courseStatusTones[course.status]}>{courseStatusLabels[course.status]}</Badge><Badge tone={coursePriorityTones[course.priority]}>Prioridade {coursePriorityLabels[course.priority]}</Badge>{current && <Badge tone="blue">Curso atual</Badge>}</div><h1>{course.name}</h1><p>{courseKindLabels[course.kind]} • {course.platform.name} • {course.area.name}</p></div>
        <div className="course-detail-progress"><div><span>Progresso</span><strong>{course.progress}%</strong></div><ProgressBar value={course.progress} /><small>{formatHours(course.studiedHours)} estudadas de {formatHours(course.workloadHours)}</small></div>
      </section>

      <div className="course-detail-grid">
        <section className="card course-detail-card"><h2>Resumo</h2><dl><div><dt>Tipo</dt><dd>{courseKindLabels[course.kind]}</dd></div><div><dt>Plataforma</dt><dd>{course.platform.name}</dd></div><div><dt>Área</dt><dd>{course.area.name}</dd></div><div><dt>Carga horária</dt><dd>{formatHours(course.workloadHours)}</dd></div><div><dt>Horas estudadas</dt><dd>{formatHours(course.studiedHours)}</dd></div><div><dt>Horas restantes</dt><dd>{formatHours(remaining)}</dd></div><div><dt>Emite certificado</dt><dd>{course.emitsCertificate ? "Sim" : "Não"}</dd></div></dl></section>
        <section className="card course-detail-card"><h2>Datas</h2><dl><div><dt>Início</dt><dd>{formatDate(course.startDate)}</dd></div><div><dt>Meta de conclusão</dt><dd>{formatDate(course.targetCompletionDate)}</dd></div><div><dt>Conclusão</dt><dd>{formatDate(course.completionDate)}</dd></div><div><dt>Criado em</dt><dd>{new Date(course.createdAt).toLocaleDateString("pt-BR")}</dd></div><div><dt>Última alteração</dt><dd>{new Date(course.updatedAt).toLocaleDateString("pt-BR")}</dd></div></dl></section>
        <section className="card course-detail-card course-detail-wide"><h2>Observações e acesso</h2><p className="course-detail-notes">{course.notes || "Nenhuma observação registrada."}</p>{course.url && <a className="primary-button detail-link" href={course.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir página do curso</a>}</section>
        <section className="card course-detail-card course-detail-wide"><div className="course-history-header"><h2>Anotações vinculadas</h2><Link className="secondary-button compact-button" href={`/anotacoes?curso=${course.id}&novo=1`}><FilePenLine size={14} /> Nova anotação</Link></div>{initialNotes.length ? <div className="list">{initialNotes.slice(0, 5).map((note) => <Link href={`/anotacoes?curso=${course.id}`} className="list-item" key={note.id}><div><span className="table-title">{note.title}</span><span className="table-subtitle">{note.topic || note.content.slice(0, 100)}</span></div><Badge tone={noteCategoryTone(note.category.name)}>{note.category.name}</Badge></Link>)}</div> : <div className="courses-empty compact"><p>Nenhuma anotação vinculada a este curso.</p><Link className="primary-button" href={`/anotacoes?curso=${course.id}&novo=1`}><FilePenLine size={15} /> Criar anotação</Link></div>}</section>
        <section className="card course-detail-card course-detail-wide"><div className="course-history-header"><h2>Certificados vinculados</h2><Link className="secondary-button compact-button" href={`/certificados?curso=${course.id}&novo=1`}><Plus size={14} /> Novo certificado</Link></div>{initialCertificates.length ? <div className="list">{initialCertificates.map((certificate) => <div className="list-item" key={certificate.id}><div className="list-item-main"><div className="list-icon" style={{ color: certificate.isAvailable ? "var(--success)" : "var(--warning)", background: certificate.isAvailable ? "var(--success-soft)" : "var(--warning-soft)" }}><Award size={15} /></div><div><strong>{certificate.isAvailable ? "Certificado disponível" : "Certificado pendente"}</strong><small>{certificate.issueDate ? `Emitido em ${formatDate(certificate.issueDate)}` : certificate.completionDate ? `Conclusão ${formatDate(certificate.completionDate)}` : "Sem data de emissão"}{certificate.credentialCode ? ` • ${certificate.credentialCode}` : ""}</small></div></div><div className="table-actions">{certificate.fileKey && <a className="table-icon-button" href={`/api/certificates/${certificate.id}/file?download=1`} title="Baixar arquivo"><Download size={14} /></a>}{certificate.validationUrl && <a className="table-icon-button" href={certificate.validationUrl} target="_blank" rel="noreferrer" title="Validar credencial"><ShieldCheck size={14} /></a>}</div></div>)}</div> : <div className="courses-empty compact"><p>Nenhum certificado vinculado a este curso.</p><Link className="primary-button" href={`/certificados?curso=${course.id}&novo=1`}><Award size={15} /> Adicionar certificado</Link></div>}</section>
        <section className="card course-detail-card course-detail-wide"><div className="course-history-header"><h2>Histórico de estudos</h2><Link className="secondary-button compact-button" href={`/estudos?curso=${course.id}&novo=1`}><BookOpen size={14} /> Nova sessão</Link></div>{initialSessions.length ? <div className="data-table-wrap"><table className="data-table course-session-history"><thead><tr><th>Data</th><th>Assunto</th><th>Tipo</th><th>Planejado</th><th>Estudado</th><th>Status</th></tr></thead><tbody>{initialSessions.map((session) => <tr key={session.id}><td><span className="table-title">{formatDate(session.studyDate)}</span></td><td data-label="Assunto"><span className="table-title">{session.topic}</span><span className="table-subtitle">{session.notes || "Sem observações"}</span></td><td data-label="Tipo">{session.studyType.name}</td><td data-label="Planejado">{session.plannedHours === null ? "—" : formatHours(session.plannedHours)}</td><td data-label="Estudado"><strong>{formatHours(session.studiedHours)}</strong></td><td data-label="Status"><Badge tone={sessionStatusTones[session.status]}>{sessionStatusLabels[session.status]}</Badge></td></tr>)}</tbody></table></div> : <div className="courses-empty compact"><p>Nenhuma sessão registrada para este curso.</p><Link className="primary-button" href={`/estudos?curso=${course.id}&novo=1`}><BookOpen size={15} /> Registrar primeiro estudo</Link></div>}</section>
      </div>

      {editing && <CourseFormModal course={course} platforms={platforms} areas={areas} onClose={() => setEditing(false)} onSaved={(saved, message) => { setCourse(saved); setEditing(false); setNotice(message); router.refresh(); }} />}
    </div>
  );
}
