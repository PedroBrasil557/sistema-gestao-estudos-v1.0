"use client";

import Link from "next/link";
import { createElement, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Archive, Award, BookOpen, Download, ExternalLink, FilePenLine, MoreHorizontal, Pencil, ShieldCheck, Star } from "lucide-react";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { CourseFormModal } from "@/components/courses/course-form-modal";
import { courseStatusLabels, courseStatusTones } from "@/lib/courses/constants";
import { courseIcon, pastelColor } from "@/lib/visuals";
import type { Course, CourseListOption } from "@/types/course";
import type { StudySession } from "@/types/study-session";
import type { Note } from "@/types/note";
import type { Certificate } from "@/types/certificate";

type Tab = "overview" | "progress" | "resources" | "notes" | "certificates" | "history";

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatHours(value: number) {
  const minutes = Math.round(Math.max(0, value) * 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${hours}h`;
}

export function CourseDetailClient({ initialCourse, platforms, areas, isCurrent, initialSessions, initialNotes, initialCertificates }: { initialCourse: Course; platforms: CourseListOption[]; areas: CourseListOption[]; isCurrent: boolean; initialSessions: StudySession[]; initialNotes: Note[]; initialCertificates: Certificate[] }) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState(isCurrent);
  const [notice, setNotice] = useState<string | null>(null);
  const remaining = Math.max(course.workloadHours - course.studiedHours, 0);

  async function setAsCurrent() {
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentCourseId: course.id }) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) { setNotice(payload.message ?? "Não foi possível definir o curso atual."); return; }
    setCurrent(true); setNotice("Curso atual atualizado com sucesso."); setMenuOpen(false); router.refresh();
  }

  async function archive() {
    if (!window.confirm(`Arquivar “${course.name}”?`)) return;
    const response = await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: true }) });
    if (!response.ok) { const payload = await response.json().catch(() => ({})) as { message?: string }; setNotice(payload.message ?? "Não foi possível arquivar."); return; }
    router.push("/cursos"); router.refresh();
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Visão geral" }, { id: "progress", label: "Progresso" }, { id: "resources", label: "Recursos" },
    { id: "notes", label: "Anotações" }, { id: "certificates", label: "Certificados" }, { id: "history", label: "Histórico" },
  ];

  return <main className="course-detail-redesign" style={{ "--course-color": course.color, "--course-pastel": pastelColor(course.color) } as CSSProperties}>
    <div className="course-detail-topbar"><Link className="text-button" href="/cursos">← Voltar para cursos</Link><div className="course-detail-actions"><Link className="primary-button" href={`/estudos?curso=${course.id}&novo=1`}><BookOpen size={16} /> Registrar estudo</Link><Link className="secondary-button" href={`/estudos?curso=${course.id}&planejar=1`}><BookOpen size={16} /> Planejar estudo</Link><Link className="secondary-button" href={`/anotacoes?curso=${course.id}&novo=1`}><FilePenLine size={16} /> Nova anotação</Link><button className="secondary-button" type="button" onClick={() => setEditing(true)}><Pencil size={16} /> Editar</button><div className="action-menu-wrap"><button className="icon-action" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Mais ações"><MoreHorizontal size={18} /></button>{menuOpen && <div className="floating-action-menu"><button type="button" onClick={() => void setAsCurrent()} disabled={current}><Star size={15} /> {current ? "Curso atual" : "Definir como atual"}</button><button className="danger" type="button" onClick={() => void archive()}><Archive size={15} /> Arquivar</button></div>}</div></div></div>
    {notice && <div className="settings-notice success" role="status">{notice}</div>}

    <section className="course-detail-hero-redesign"><div className="course-detail-icon-redesign">{createElement(courseIcon(course.icon, course.name), { size: 34 })}</div><div className="course-detail-heading"><div>{current && <Badge color={course.color}>Curso atual</Badge>}<Badge tone={courseStatusTones[course.status]}>{courseStatusLabels[course.status]}</Badge></div><h1>{course.name}</h1><p>{course.group === "LANGUAGE" ? "Idioma" : "Profissionalizante"} • {course.platform.name} • {course.area.name}</p></div><div className="course-detail-progress-redesign"><span>Progresso do curso</span><strong>{course.progress}%</strong><ProgressBar value={course.progress} color={course.color} /><small>{formatHours(course.studiedHours)} estudadas{course.workloadHours ? ` de ${formatHours(course.workloadHours)}` : ""}</small></div></section>

    <nav className="course-detail-tabs" aria-label="Seções do curso">{tabs.map((item) => <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>

    <section className="course-detail-tab-content">
      {tab === "overview" && <div className="course-overview-grid"><article><h2>Informações principais</h2><dl><div><dt>Plataforma</dt><dd>{course.platform.name}</dd></div><div><dt>Categoria</dt><dd>{course.area.name}</dd></div><div><dt>Status</dt><dd>{courseStatusLabels[course.status]}</dd></div><div><dt>Meta semanal</dt><dd>{Math.round(course.weeklyGoalMinutes / 60 * 10) / 10}h</dd></div><div><dt>Início</dt><dd>{formatDate(course.startDate)}</dd></div><div><dt>Meta de conclusão</dt><dd>{formatDate(course.targetCompletionDate)}</dd></div></dl></article><article><h2>Seu objetivo</h2><p>{course.objective || course.notes || "Nenhum objetivo registrado para este curso."}</p>{course.group === "LANGUAGE" && <div className="level-flow"><span>{course.currentLevel || "Nível atual"}</span><b>→</b><span>{course.targetLevel || "Nível desejado"}</span></div>}<div className="next-activity"><strong>Próxima atividade</strong><span>{initialSessions.find((session) => session.status === "PLANNED")?.topic ?? "Planeje sua próxima sessão de estudo."}</span></div></article></div>}
      {tab === "progress" && <div className="course-progress-panel"><div className="course-progress-big"><strong>{course.progress}%</strong><span>concluído</span></div><div><h2>Resumo de progresso</h2><ProgressBar value={course.progress} color={course.color} /><dl><div><dt>Horas estudadas</dt><dd>{formatHours(course.studiedHours)}</dd></div><div><dt>Horas restantes</dt><dd>{course.workloadHours ? formatHours(remaining) : "Carga livre"}</dd></div><div><dt>Sessões registradas</dt><dd>{initialSessions.length}</dd></div></dl></div></div>}
      {tab === "resources" && <div className="course-resource-list"><h2>Recursos do curso</h2>{course.complementaryResources.length ? course.complementaryResources.map((resource) => <div key={resource}><ExternalLink size={16} /><span>{resource}</span></div>) : <EmptyState compact title="Nenhum recurso cadastrado" description="Edite o curso para adicionar livros, canais, plataformas e materiais complementares." />}{course.url && <a className="primary-button" href={course.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Abrir curso</a>}</div>}
      {tab === "notes" && <div><div className="course-tab-header"><h2>Anotações</h2><Link className="primary-button" href={`/anotacoes?curso=${course.id}&novo=1`}><FilePenLine size={15} /> Nova anotação</Link></div>{initialNotes.length ? <div className="course-note-grid">{initialNotes.map((note) => <Link key={note.id} href={`/anotacoes?curso=${course.id}`}><Badge color={note.category.color}>{note.category.name}</Badge><h3>{note.title}</h3><p>{note.content.slice(0, 130)}</p></Link>)}</div> : <EmptyState title="Nenhuma anotação vinculada" description="Crie resumos, dúvidas e revisões para este curso." />}</div>}
      {tab === "certificates" && <div><div className="course-tab-header"><h2>Certificados</h2><Link className="primary-button" href={`/certificados?curso=${course.id}&novo=1`}><Award size={15} /> Adicionar certificado</Link></div>{initialCertificates.length ? <div className="course-certificate-list">{initialCertificates.map((certificate) => <article key={certificate.id}><Award size={20} /><div><strong>{certificate.isAvailable ? "Certificado obtido" : "Certificado pendente"}</strong><span>{formatDate(certificate.issueDate ?? certificate.completionDate)}</span></div>{certificate.fileKey && <a href={`/api/certificates/${certificate.id}/file?download=1`}><Download size={16} /></a>}{certificate.validationUrl && <a href={certificate.validationUrl} target="_blank" rel="noreferrer"><ShieldCheck size={16} /></a>}</article>)}</div> : <EmptyState title="Nenhum certificado" description="Quando concluir o curso, registre sua conquista aqui." />}</div>}
      {tab === "history" && <div><div className="course-tab-header"><h2>Histórico de estudos</h2><Link className="primary-button" href={`/estudos?curso=${course.id}&novo=1`}><BookOpen size={15} /> Registrar estudo</Link></div>{initialSessions.length ? <div className="course-history-list">{initialSessions.map((session) => <article key={session.id}><span>{formatDate(session.studyDate)}</span><div><strong>{session.topic}</strong><small>{session.studyType.name}</small></div><b>{formatHours(session.studiedHours)}</b></article>)}</div> : <EmptyState title="Nenhum estudo registrado" description="Registre sua primeira sessão para iniciar o histórico." />}</div>}
    </section>

    {editing && <CourseFormModal course={course} platforms={platforms} areas={areas} onClose={() => setEditing(false)} onSaved={(saved, message) => { setCourse(saved); setEditing(false); setNotice(message); router.refresh(); }} />}
  </main>;
}
