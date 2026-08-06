"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Flame,
  GraduationCap,
  Languages,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { StudySessionFormModal } from "@/components/study-sessions/study-session-form-modal";
import { buildMonthGrid, currentStreak, dateInTimeZone } from "@/lib/study-sessions/analytics";
import { sessionStatusLabels } from "@/lib/study-sessions/constants";
import { courseIcon, normalizeHex, pastelColor } from "@/lib/visuals";
import type { StudyCourseOption, StudySession, StudySessionInput, StudyTypeOption } from "@/types/study-session";

type Notice = { type: "success" | "error"; text: string } | null;
type ModalState = { open: boolean; mode: "register" | "plan"; session: StudySession | null; seed: Partial<StudySessionInput> | null };

function formatDate(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
function formatHours(value: number | null) { const minutes = Math.round(Math.max(0, value ?? 0) * 60); const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? (rest ? `${hours}h ${rest}min` : `${hours}h`) : `${rest}min`; }
function formatTime(value: string | null) { return value ? value.slice(0, 5) : "Horário livre"; }

function mondayOf(date: string) {
  const base = new Date(`${date}T12:00:00Z`);
  const day = (base.getUTCDay() + 6) % 7;
  base.setUTCDate(base.getUTCDate() - day);
  return base.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number) {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function payloadFrom(session: StudySession, overrides: Partial<StudySessionInput> = {}): StudySessionInput {
  return {
    studyDate: session.studyDate,
    scheduledTime: session.scheduledTime,
    courseId: session.course.id,
    topic: session.topic,
    plannedHours: session.plannedHours,
    studiedHours: session.studiedHours,
    status: session.status,
    languageSkill: session.languageSkill,
    studyTypeId: session.studyType.id,
    resource: session.resource,
    recurrenceRule: session.recurrenceRule,
    reminderAt: session.reminderAt,
    notes: session.notes,
    ...overrides,
  };
}

export function StudySessionsManager({
  initialSessions,
  courses,
  studyTypes,
  databaseReady,
  monthlyGoalHours,
  currentCourseId,
  defaultCourseId,
  timezone,
  consistencyDays,
  initialOpen,
  initialMode = "register",
}: {
  initialSessions: StudySession[];
  courses: StudyCourseOption[];
  studyTypes: StudyTypeOption[];
  databaseReady: boolean;
  monthlyGoalHours: number;
  currentCourseId: string | null;
  defaultCourseId: string | null;
  timezone: string;
  consistencyDays: number;
  initialOpen: boolean;
  initialMode?: "register" | "plan";
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [notice, setNotice] = useState<Notice>(null);
  const [modal, setModal] = useState<ModalState>({ open: Boolean(initialOpen && databaseReady), mode: initialMode, session: null, seed: initialMode === "plan" ? { status: "PLANNED" } : null });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const today = useMemo(() => dateInTimeZone(timezone), [timezone]);
  const weekStart = useMemo(() => mondayOf(today), [today]);
  const activeSessions = useMemo(() => sessions.filter((session) => !session.deletedAt), [sessions]);

  const summary = useMemo(() => {
    const todaySessions = activeSessions.filter((session) => session.studyDate === today && session.status !== "CANCELLED");
    const weekSessions = activeSessions.filter((session) => session.studyDate >= weekStart && session.studyDate <= today && session.status !== "CANCELLED");
    return {
      todayPlanned: todaySessions.reduce((sum, session) => sum + (session.plannedHours ?? 0), 0),
      todayStudied: todaySessions.reduce((sum, session) => sum + session.studiedHours, 0),
      weekPlanned: weekSessions.reduce((sum, session) => sum + (session.plannedHours ?? 0), 0),
      weekStudied: weekSessions.reduce((sum, session) => sum + session.studiedHours, 0),
      streak: currentStreak(activeSessions, today).days,
    };
  }, [activeSessions, today, weekStart]);

  const focusToday = useMemo(() => activeSessions
    .filter((session) => session.studyDate === today && session.status !== "CANCELLED")
    .sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99") || a.createdAt.localeCompare(b.createdAt)), [activeSessions, today]);

  const inProgressCourses = useMemo(() => courses.filter((course) => course.status === "IN_PROGRESS" && !course.archivedAt), [courses]);
  const languageCourses = inProgressCourses.filter((course) => course.group === "LANGUAGE");
  const professionalCourses = inProgressCourses.filter((course) => course.group === "PROFESSIONAL");
  const recentSessions = useMemo(() => activeSessions.filter((session) => session.studiedHours > 0).sort((a, b) => b.studyDate.localeCompare(a.studyDate) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6), [activeSessions]);

  const monthDays = useMemo(() => buildMonthGrid(activeSessions, today), [activeSessions, today]);
  const studiedDaysThisMonth = monthDays.filter((day) => day.inMonth && day.hours > 0).length;
  const consistencyStart = useMemo(() => shiftDate(today, -(Math.max(1, consistencyDays) - 1)), [today, consistencyDays]);
  const recentConsistencyDays = useMemo(() => new Set(activeSessions.filter((session) => session.studyDate >= consistencyStart && session.studyDate <= today && session.studiedHours > 0).map((session) => session.studyDate)).size, [activeSessions, consistencyStart, today]);
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: timezone }).format(new Date(`${today}T12:00:00Z`));

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return [...sessions].filter((session) => !term || [session.course.name, session.topic, session.notes ?? "", session.studyType.name].join(" ").toLocaleLowerCase("pt-BR").includes(term)).sort((a, b) => b.studyDate.localeCompare(a.studyDate) || b.updatedAt.localeCompare(a.updatedAt));
  }, [sessions, search]);

  function openRegister(courseId?: string, session?: StudySession) {
    setModal({ open: true, mode: "register", session: session ?? null, seed: courseId ? { courseId } : null });
    setOpenMenuId(null);
  }
  function openPlan(courseId?: string, session?: StudySession) {
    setModal({ open: true, mode: "plan", session: session ?? null, seed: courseId ? { courseId, status: "PLANNED" } : null });
    setOpenMenuId(null);
  }
  function replan(session: StudySession) {
    setModal({
      open: true,
      mode: "plan",
      session: null,
      seed: {
        studyDate: session.studyDate,
        scheduledTime: session.scheduledTime,
        courseId: session.course.id,
        topic: session.topic,
        plannedHours: session.plannedHours ?? (session.studiedHours || 0.5),
        studyTypeId: session.studyType.id,
        languageSkill: session.languageSkill,
        resource: session.resource,
        notes: session.notes,
        status: "PLANNED",
      },
    });
    setOpenMenuId(null);
  }
  function saved(savedSession: StudySession, message: string) {
    setSessions((current) => current.some((item) => item.id === savedSession.id) ? current.map((item) => item.id === savedSession.id ? savedSession : item) : [savedSession, ...current]);
    setNotice({ type: "success", text: message });
    setModal({ open: false, mode: "register", session: null, seed: null });
  }

  async function quickComplete(session: StudySession) {
    setLoadingId(session.id);
    const response = await fetch(`/api/study-sessions/${session.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadFrom(session, { status: "COMPLETED", studiedHours: session.studiedHours > 0 ? session.studiedHours : session.plannedHours ?? 0.5 })) });
    const result = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !result.session) { setNotice({ type: "error", text: result.message ?? "Não foi possível concluir o estudo." }); return; }
    setSessions((current) => current.map((item) => item.id === session.id ? result.session! : item));
    setNotice({ type: "success", text: "Estudo concluído e métricas atualizadas." });
  }

  async function remove(session: StudySession) {
    if (!window.confirm(`Mover “${session.topic}” para a lixeira?`)) return;
    setLoadingId(session.id); setOpenMenuId(null);
    const response = await fetch(`/api/study-sessions/${session.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !result.session) { setNotice({ type: "error", text: result.message ?? "Não foi possível excluir." }); return; }
    setSessions((current) => current.map((item) => item.id === session.id ? result.session! : item));
    setNotice({ type: "success", text: result.message ?? "Registro movido para a lixeira." });
  }

  async function restore(session: StudySession) {
    setLoadingId(session.id);
    const response = await fetch(`/api/study-sessions/${session.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    const result = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !result.session) { setNotice({ type: "error", text: result.message ?? "Não foi possível restaurar." }); return; }
    setSessions((current) => current.map((item) => item.id === session.id ? result.session! : item));
    setNotice({ type: "success", text: result.message ?? "Registro restaurado." });
  }

  function courseProgress(course: StudyCourseOption) {
    if (course.status === "COMPLETED") return 100;
    if (course.group === "LANGUAGE" && course.weeklyGoalMinutes > 0) {
      const weekMinutes = activeSessions.filter((session) => session.course.id === course.id && session.studyDate >= weekStart && session.studyDate <= today).reduce((sum, session) => sum + session.studiedHours * 60, 0);
      return Math.min(100, Math.round((weekMinutes / course.weeklyGoalMinutes) * 100));
    }
    return course.workloadHours > 0 ? Math.min(100, Math.round((course.studiedHours / course.workloadHours) * 100)) : 0;
  }

  function renderCourseGroup(title: string, items: StudyCourseOption[], Icon: LucideIcon) {
    return (
      <section className="study-course-group card">
        <div className="study-course-group-header">
          <div><Icon size={19} /><h3>{title}</h3></div>
          <Link href="/cursos">Ver todos <ChevronRight size={14} /></Link>
        </div>
        {items.length ? (
          <div className="compact-course-grid">
            {items.slice(0, 4).map((course) => {
              const CourseIcon = courseIcon(course.icon || course.name);
              const color = normalizeHex(course.color);
              const style = { "--course-color": color, "--course-pastel": pastelColor(color) } as CSSProperties;
              const progress = courseProgress(course);
              return (
                <article className="compact-course-card" style={style} key={course.id}>
                  <div className="compact-course-card-top">
                    <div className="compact-course-icon"><CourseIcon size={23} /></div>
                    <div className="compact-course-copy">
                      <strong>{course.name}</strong>
                      <span>{course.group === "LANGUAGE" && course.weeklyGoalMinutes ? `Meta semanal ${formatHours(course.weeklyGoalMinutes / 60)}` : `${progress}% concluído`}</span>
                    </div>
                  </div>
                  <ProgressBar value={progress} color={color} />
                  <button className="compact-register-button" type="button" onClick={() => openRegister(course.id)}>
                    <Edit3 size={14} /> Registrar
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState compact title={`Nenhum ${title.toLocaleLowerCase("pt-BR")} em andamento`} description="Altere o status de um curso para começar a acompanhá-lo aqui." />
        )}
      </section>
    );
  }

  return (
    <>
      <PageHeader title="Estudos" subtitle="Acompanhe seus estudos, mantenha a consistência e alcance seus objetivos." timezone={timezone} actions={<div className="page-actions"><button className="primary-button" type="button" onClick={() => openRegister(defaultCourseId ?? currentCourseId ?? undefined)} disabled={!databaseReady}><Plus size={17} /> Registrar estudo</button><button className="secondary-button" type="button" onClick={() => openPlan(defaultCourseId ?? currentCourseId ?? undefined)} disabled={!databaseReady}><CalendarDays size={17} /> Planejar estudo</button></div>} />
      <div className="content redesign-content studies-redesign">
        {notice && <div className={`settings-notice ${notice.type}`} role="status">{notice.text}</div>}

        <section className="daily-summary card">
          <div className="daily-summary-item today">
            <span className="daily-summary-icon"><Clock3 size={22} /></span>
            <div><span>Hoje</span><strong>{formatHours(summary.todayStudied)}</strong><small>{formatHours(summary.todayPlanned)} planejadas</small></div>
          </div>
          <div className="daily-summary-item week">
            <span className="daily-summary-icon"><CalendarDays size={22} /></span>
            <div className="daily-summary-week-copy">
              <span>Semana</span>
              <strong>{formatHours(summary.weekStudied)}</strong>
              <small>de {formatHours(summary.weekPlanned || monthlyGoalHours / 4)} planejadas</small>
            </div>
            <div className="daily-summary-progress" aria-label="Progresso da meta semanal">
              <span style={{ width: `${Math.min(100, Math.round((summary.weekStudied / Math.max(summary.weekPlanned || monthlyGoalHours / 4, 0.01)) * 100))}%` }} />
            </div>
          </div>
          <div className="daily-summary-item streak">
            <span className="daily-summary-icon"><Flame size={22} /></span>
            <div><span>Sequência</span><strong>{summary.streak} dias</strong><small>{summary.streak ? "Continue assim!" : "Comece hoje"}</small></div>
          </div>
        </section>

        <section className="today-section">
          <div className="section-heading"><div><CalendarDays size={20} /><h2>Hoje</h2><Badge tone="blue">{focusToday.length} {focusToday.length === 1 ? "estudo" : "estudos"}</Badge></div><button className="link-button" type="button" onClick={() => openPlan()}>+ Planejar</button></div>
          {focusToday.length ? <div className="today-study-list">{focusToday.map((session) => { const color = normalizeHex(session.course.color); const Icon = courseIcon(session.course.icon || session.course.name); const style = { "--course-color": color, "--course-pastel": pastelColor(color) } as CSSProperties; return <article className="today-study-card" style={style} key={session.id}><div className="today-study-time"><strong>{formatTime(session.scheduledTime)}</strong><span>{formatHours(session.plannedHours ?? session.studiedHours)}</span></div><div className="today-study-icon"><Icon size={24} /></div><div className="today-study-copy"><strong>{session.course.name}</strong><span>{session.topic}</span>{session.languageSkill && <small>{session.languageSkill}</small>}</div><div className="today-study-actions">{session.status !== "COMPLETED" ? <button className="complete-button" type="button" onClick={() => quickComplete(session)} disabled={loadingId === session.id}>{loadingId === session.id ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Concluir</button> : <Badge tone="green">Concluído</Badge>}<button className="secondary-button compact-button" type="button" onClick={() => replan(session)}>Reagendar</button><div className="action-menu-wrap"><button className="icon-action" type="button" onClick={() => setOpenMenuId((value) => value === session.id ? null : session.id)} aria-label="Mais ações"><MoreHorizontal size={18} /></button>{openMenuId === session.id && <div className="action-menu"><button type="button" onClick={() => session.status === "PLANNED" ? openPlan(undefined, session) : openRegister(undefined, session)}><Edit3 size={14} /> Editar</button><button type="button" className="danger" onClick={() => remove(session)}><Trash2 size={14} /> Excluir</button></div>}</div></div></article>; })}</div> : <EmptyState title="Nada planejado para hoje" description="Planeje um estudo ou registre diretamente o que você já fez." action={<div className="empty-actions"><button className="primary-button" type="button" onClick={() => openPlan()}><CalendarDays size={16} /> Planejar hoje</button><button className="secondary-button" type="button" onClick={() => openRegister()}><Plus size={16} /> Registrar agora</button></div>} />}
        </section>

        <section className="in-progress-section">
          <div className="section-heading">
            <div><BookOpen size={20} /><h2>Em andamento</h2></div>
            <Link href="/cursos">Gerenciar cursos <ChevronRight size={15} /></Link>
          </div>
          <div className="study-course-groups-grid">
            {renderCourseGroup("Idiomas", languageCourses, Languages)}
            {renderCourseGroup("Profissionalizantes", professionalCourses, GraduationCap)}
          </div>
        </section>

        <div className="studies-lower-grid">
          <section className="card recent-studies-card"><div className="section-heading"><div><Clock3 size={19} /><h2>Registros recentes</h2></div><button className="link-button" type="button" onClick={() => setRecordsOpen(true)}>Ver todos os registros</button></div>{recentSessions.length ? <div className="recent-study-list">{recentSessions.map((session) => { const Icon = courseIcon(session.course.icon || session.course.name); return <button className="recent-study-item" type="button" key={session.id} onClick={() => openRegister(undefined, session)}><span className="recent-study-icon" style={{ color: session.course.color, background: pastelColor(session.course.color) }}><Icon size={18} /></span><span className="recent-study-copy"><strong>{session.course.name}</strong><small>{session.topic}</small></span><span className="recent-study-meta"><strong>{formatHours(session.studiedHours)}</strong><small>{formatDate(session.studyDate)}</small></span><MoreHorizontal size={17} /></button>; })}</div> : <EmptyState compact title="Nenhum registro recente" description="Seus estudos concluídos aparecerão aqui." />}</section>

          <section className="card consistency-card"><div className="section-heading"><div><Flame size={19} /><h2>Consistência</h2></div><span>{monthName}</span></div><div className="month-heatmap">{monthDays.map((day, index) => { const level = day.hours <= 0 ? 0 : day.hours < 1 ? 1 : day.hours < 2 ? 2 : 3; return <span key={`${day.date}-${index}`} className={`level-${level} ${day.inMonth ? "" : "outside"} ${day.date === today ? "today" : ""}`} title={`${formatDate(day.date)}: ${formatHours(day.hours)}`}>{Number(day.date.slice(8, 10))}</span>; })}</div><div className="consistency-summary"><strong>{studiedDaysThisMonth} dias estudados no mês</strong><small>{recentConsistencyDays} de {Math.max(1, consistencyDays)} dias recentes com estudo</small><span>Menos <i /><i className="level-1" /><i className="level-2" /><i className="level-3" /> Mais</span><p>Pequenos estudos frequentes constroem grandes resultados.</p></div></section>
        </div>
      </div>

      {recordsOpen && <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecordsOpen(false); }}><aside className="records-drawer" role="dialog" aria-modal="true" aria-label="Todos os registros"><header><div><h2>Todos os registros</h2><p>Pesquise, edite, exclua ou restaure sessões.</p></div><button className="icon-action" type="button" onClick={() => setRecordsOpen(false)} aria-label="Fechar"><CheckCircle2 size={19} /></button></header><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar curso, assunto ou observação" /></div><div className="records-list">{filteredRecords.map((session) => <article className={`record-card ${session.deletedAt ? "deleted" : ""}`} key={session.id}><div><strong>{session.course.name}</strong><span>{session.topic}</span><small>{formatDate(session.studyDate)} • {formatHours(session.studiedHours || session.plannedHours)} • {sessionStatusLabels[session.status]}</small></div><div>{session.deletedAt ? <button className="icon-button" type="button" onClick={() => restore(session)} aria-label="Restaurar"><RotateCcw size={16} /></button> : <><button className="icon-button" type="button" onClick={() => session.status === "PLANNED" ? openPlan(undefined, session) : openRegister(undefined, session)} aria-label="Editar"><Edit3 size={16} /></button><button className="icon-button danger-icon" type="button" onClick={() => remove(session)} aria-label="Excluir"><Trash2 size={16} /></button></>}</div></article>)}{filteredRecords.length === 0 && <EmptyState compact title="Nenhum registro encontrado" description="Tente outra busca." />}</div></aside></div>}

      {modal.open && <StudySessionFormModal key={`${modal.mode}-${modal.session?.id ?? "new"}`} mode={modal.mode} session={modal.session} seed={modal.seed} courses={courses} studyTypes={studyTypes} defaultCourseId={defaultCourseId ?? currentCourseId} onClose={() => setModal({ open: false, mode: "register", session: null, seed: null })} onSaved={saved} />}
    </>
  );
}
