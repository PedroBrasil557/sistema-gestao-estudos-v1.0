"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Copy,
  FilterX,
  Flame,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, HorizontalBars, MetricCard, Panel, ProgressBar } from "@/components/ui";
import { StudySessionFormModal } from "@/components/study-sessions/study-session-form-modal";
import {
  areaTotals,
  consistencyDays as buildConsistencyDays,
  courseProgress,
  currentStreak,
  dateInTimeZone,
  formatShortDate,
  generalProgress,
  weeklyTotals,
} from "@/lib/study-sessions/analytics";
import { sessionStatuses, sessionStatusLabels, sessionStatusTones } from "@/lib/study-sessions/constants";
import type { StudyCourseOption, StudySession, StudySessionInput, StudyTypeOption } from "@/types/study-session";

type Notice = { type: "success" | "error"; text: string } | null;
type DeletedFilter = "active" | "deleted" | "all";
type Sort = "date-desc" | "date-asc" | "course" | "studied-desc" | "planned-desc";

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatHours(value: number | null) {
  if (value === null) return "—";
  const totalMinutes = Math.round(Math.max(0, value) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function priorityRank(value: StudySession["course"]["priority"] | StudyCourseOption["priority"]) {
  return value === "HIGH" ? 0 : value === "MEDIUM" ? 1 : 2;
}

function statusRank(value: StudySession["status"]) {
  if (value === "IN_PROGRESS") return 0;
  if (value === "PLANNED") return 1;
  if (value === "PAUSED") return 2;
  if (value === "COMPLETED") return 3;
  return 4;
}

function courseStatusLabel(value: StudyCourseOption["status"]) {
  return ({
    PLANNED: "Planejado",
    NOT_STARTED: "Não iniciado",
    IN_PROGRESS: "Em andamento",
    PAUSED: "Pausado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  } as const)[value];
}

function courseStatusTone(value: StudyCourseOption["status"]): "blue" | "green" | "orange" | "gray" | "red" {
  if (value === "COMPLETED") return "green";
  if (value === "IN_PROGRESS") return "blue";
  if (value === "PAUSED" || value === "PLANNED") return "orange";
  if (value === "CANCELLED") return "red";
  return "gray";
}

export function StudySessionsManager({
  initialSessions,
  courses,
  studyTypes,
  databaseReady,
  monthlyGoalHours,
  currentCourseId: initialCurrentCourseId,
  defaultCourseId,
  timezone,
  consistencyDays,
  initialOpen,
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
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [notice, setNotice] = useState<Notice>(null);
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpen && databaseReady));
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [seed, setSeed] = useState<Partial<StudySessionInput> | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState(initialCurrentCourseId ?? "");
  const [savingCurrentCourse, setSavingCurrentCourse] = useState(false);
  const [selectedConsistencyDate, setSelectedConsistencyDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [studyTypeId, setStudyTypeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>("active");
  const [sort, setSort] = useState<Sort>("date-desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const today = useMemo(() => dateInTimeZone(timezone), [timezone]);
  const currentMonth = today.slice(0, 7);

  const activeSessions = useMemo(() => sessions.filter((session) => !session.deletedAt), [sessions]);
  const studyHoursByCourse = useMemo(() => {
    const totals = new Map<string, number>();
    for (const session of activeSessions) totals.set(session.course.id, (totals.get(session.course.id) ?? 0) + session.studiedHours);
    return totals;
  }, [activeSessions]);

  const summary = useMemo(() => {
    const totalHours = activeSessions.reduce((sum, session) => sum + session.studiedHours, 0);
    const monthHours = activeSessions.filter((session) => session.studyDate.startsWith(currentMonth)).reduce((sum, session) => sum + session.studiedHours, 0);
    const activeCourses = courses.filter((course) => course.status === "IN_PROGRESS" && !course.archivedAt).length;
    const completedCourses = courses.filter((course) => course.status === "COMPLETED" && !course.archivedAt).length;
    const streak = currentStreak(activeSessions, today);
    return {
      totalHours,
      monthHours,
      activeCourses,
      completedCourses,
      streak,
      progress: generalProgress(courses, activeSessions),
    };
  }, [activeSessions, courses, currentMonth, today]);

  const monthPercent = monthlyGoalHours > 0 ? Math.round((summary.monthHours / monthlyGoalHours) * 100) : 0;

  const currentCourse = useMemo(() => courses.find((course) => course.id === currentCourseId) ?? null, [courses, currentCourseId]);
  const currentCourseHours = currentCourse ? (studyHoursByCourse.get(currentCourse.id) ?? 0) : 0;
  const currentCourseProgress = currentCourse ? courseProgress(currentCourse, currentCourseHours) : 0;

  const focusToday = useMemo(() => activeSessions
    .filter((session) => session.studyDate === today && session.status !== "CANCELLED")
    .sort((a, b) => priorityRank(a.course.priority) - priorityRank(b.course.priority) || statusRank(a.status) - statusRank(b.status) || a.createdAt.localeCompare(b.createdAt)), [activeSessions, today]);

  const recentSessions = useMemo(() => [...activeSessions]
    .filter((session) => session.studiedHours > 0)
    .sort((a, b) => b.studyDate.localeCompare(a.studyDate) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5), [activeSessions]);

  const areaRows = useMemo(() => areaTotals(activeSessions).slice(0, 8).map(([label, value]) => ({ label, value, text: formatHours(value) })), [activeSessions]);
  const weeks = useMemo(() => weeklyTotals(activeSessions, today, 8), [activeSessions, today]);
  const maxWeekHours = Math.max(...weeks.map((week) => week.hours), 1);
  const consistency = useMemo(() => buildConsistencyDays(activeSessions, today, consistencyDays), [activeSessions, today, consistencyDays]);
  const selectedDaySessions = useMemo(() => selectedConsistencyDate ? activeSessions.filter((session) => session.studyDate === selectedConsistencyDate) : [], [activeSessions, selectedConsistencyDate]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const result = sessions.filter((session) => {
      if (deletedFilter === "active" && session.deletedAt) return false;
      if (deletedFilter === "deleted" && !session.deletedAt) return false;
      if (courseId && session.course.id !== courseId) return false;
      if (status && session.status !== status) return false;
      if (studyTypeId && session.studyType.id !== studyTypeId) return false;
      if (dateFrom && session.studyDate < dateFrom) return false;
      if (dateTo && session.studyDate > dateTo) return false;
      if (normalizedSearch && ![session.course.name, session.topic, session.notes ?? "", session.studyType.name].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedSearch)) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "date-asc") return a.studyDate.localeCompare(b.studyDate) || a.createdAt.localeCompare(b.createdAt);
      if (sort === "course") return a.course.name.localeCompare(b.course.name, "pt-BR") || b.studyDate.localeCompare(a.studyDate);
      if (sort === "studied-desc") return b.studiedHours - a.studiedHours || b.studyDate.localeCompare(a.studyDate);
      if (sort === "planned-desc") return (b.plannedHours ?? 0) - (a.plannedHours ?? 0) || b.studyDate.localeCompare(a.studyDate);
      return b.studyDate.localeCompare(a.studyDate) || b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [sessions, deletedFilter, courseId, status, studyTypeId, dateFrom, dateTo, search, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleSessions = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPage() { setPage(1); }
  function openCreate() { setEditing(null); setSeed(null); setModalOpen(true); }
  function openEdit(session: StudySession) { setEditing(session); setSeed(null); setModalOpen(true); }
  function openDuplicate(session: StudySession) {
    setEditing(null);
    setSeed({
      studyDate: today,
      courseId: session.course.id,
      topic: session.topic,
      plannedHours: session.plannedHours,
      studiedHours: 0,
      status: "PLANNED",
      studyTypeId: session.studyType.id,
      notes: session.notes,
    });
    setModalOpen(true);
  }

  function saved(savedSession: StudySession, message: string) {
    setSessions((current) => editing ? current.map((item) => item.id === savedSession.id ? savedSession : item) : [savedSession, ...current]);
    setNotice({ type: "success", text: message });
    setModalOpen(false);
    setEditing(null);
    setSeed(null);
    setPage(1);
  }

  async function remove(session: StudySession) {
    if (!window.confirm(`Excluir a sessão “${session.topic}” de ${formatDate(session.studyDate)}? Ela poderá ser restaurada pela lixeira.`)) return;
    setLoadingId(session.id);
    const response = await fetch(`/api/study-sessions/${session.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !payload.session) { setNotice({ type: "error", text: payload.message ?? "Não foi possível excluir a sessão." }); return; }
    setSessions((current) => current.map((item) => item.id === session.id ? payload.session! : item));
    setNotice({ type: "success", text: payload.message ?? "Sessão movida para a lixeira." });
  }

  async function restore(session: StudySession) {
    setLoadingId(session.id);
    const response = await fetch(`/api/study-sessions/${session.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    const payload = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !payload.session) { setNotice({ type: "error", text: payload.message ?? "Não foi possível restaurar a sessão." }); return; }
    setSessions((current) => current.map((item) => item.id === session.id ? payload.session! : item));
    setNotice({ type: "success", text: payload.message ?? "Sessão restaurada." });
  }

  async function quickStatus(session: StudySession, nextStatus: StudySession["status"]) {
    if (nextStatus === "COMPLETED" && session.studiedHours <= 0) {
      setNotice({ type: "error", text: "Informe as horas estudadas antes de concluir esta sessão." });
      openEdit(session);
      return;
    }
    setLoadingId(session.id);
    const response = await fetch(`/api/study-sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studyDate: session.studyDate,
        courseId: session.course.id,
        topic: session.topic,
        plannedHours: session.plannedHours,
        studiedHours: session.studiedHours,
        status: nextStatus,
        studyTypeId: session.studyType.id,
        notes: session.notes,
      } satisfies StudySessionInput),
    });
    const payload = await response.json().catch(() => ({})) as { message?: string; session?: StudySession };
    setLoadingId(null);
    if (!response.ok || !payload.session) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível atualizar a sessão." });
      return;
    }
    setSessions((current) => current.map((item) => item.id === session.id ? payload.session! : item));
    setNotice({ type: "success", text: nextStatus === "COMPLETED" ? "Sessão concluída." : "Sessão iniciada." });
  }

  async function changeCurrentCourse(value: string) {
    const previous = currentCourseId;
    setCurrentCourseId(value);
    setSavingCurrentCourse(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCourseId: value || null }),
    });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    setSavingCurrentCourse(false);
    if (!response.ok) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível salvar o curso atual." });
      setCurrentCourseId(previous);
      return;
    }
    setNotice({ type: "success", text: value ? "Curso atual salvo nas suas preferências." : "Curso atual removido das preferências." });
  }

  function clearFilters() {
    setSearch(""); setCourseId(""); setStatus(""); setStudyTypeId(""); setDateFrom(""); setDateTo(""); setDeletedFilter("active"); setSort("date-desc"); setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Estudos"
        subtitle="Seu painel diário agora usa os registros reais para calcular progresso, foco e consistência."
        actions={<button className="header-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={17} /><span className="button-label">Registrar estudo</span></button>}
      />

      <div className="content">
        {!databaseReady && <div className="settings-notice error" role="alert">Os dados de Estudos não puderam ser carregados. Confirme as migrações das versões 0.4 a 0.7 no Supabase.</div>}
        {notice && <div className={`settings-notice ${notice.type}`} role="status">{notice.text}</div>}

        <section className="metrics-grid" aria-label="Resumo principal dos estudos">
          <MetricCard label="Cursos ativos" value={String(summary.activeCourses)} helper="com status Em andamento" icon={BookOpen} tone="blue" />
          <MetricCard label="Horas estudadas" value={formatHours(summary.totalHours)} helper="total registrado" icon={Clock3} tone="cyan" />
          <MetricCard label="Meta do mês" value={`${monthPercent}%`} helper={`${formatHours(summary.monthHours)} de ${formatHours(monthlyGoalHours)}`} progress={monthPercent} icon={Target} tone="orange" />
          <MetricCard label="Sequência" value={`${summary.streak.days} dia${summary.streak.days === 1 ? "" : "s"}`} helper={summary.streak.atRisk ? "estude hoje para manter" : summary.streak.days ? "sequência ativa" : "comece hoje"} icon={Flame} tone="red" />
          <MetricCard label="Concluídos" value={String(summary.completedCourses)} helper="cursos concluídos" icon={GraduationCap} tone="green" />
          <MetricCard label="Progresso geral" value={`${Math.round(summary.progress)}%`} helper="ponderado pela carga horária" progress={summary.progress} icon={TrendingUp} tone="purple" />
        </section>

        <div className="dashboard-grid">
          <Panel title="Curso atual" className="span-5" action={savingCurrentCourse ? <span className="panel-saving"><LoaderCircle className="spin" size={14} /> Salvando</span> : undefined}>
            <div className="current-course-selector">
              <label htmlFor="current-course">Curso acompanhado no painel</label>
              <select id="current-course" className="form-control" value={currentCourseId} onChange={(event) => changeCurrentCourse(event.target.value)} disabled={!databaseReady || savingCurrentCourse}>
                <option value="">Selecione um curso</option>
                {courses.filter((course) => course.status !== "CANCELLED").map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
            </div>
            {currentCourse ? <div className="current-course-card">
              <div className="current-course-heading"><div><span className="eyebrow">{currentCourse.platform.name}</span><h3>{currentCourse.name}</h3><p>{currentCourse.area.name}</p></div><Badge tone={courseStatusTone(currentCourse.status)}>{courseStatusLabel(currentCourse.status)}</Badge></div>
              <div className="course-progress-summary"><div><strong>{Math.round(currentCourseProgress)}%</strong><span>progresso</span></div><div><strong>{formatHours(currentCourseHours)}</strong><span>estudadas</span></div><div><strong>{formatHours(Math.max(currentCourse.workloadHours - currentCourseHours, 0))}</strong><span>restantes</span></div></div>
              <ProgressBar value={currentCourseProgress} tone="blue" />
              <div className="current-course-footer"><span>Carga: {formatHours(currentCourse.workloadHours)}</span><span>{currentCourse.targetCompletionDate ? `Meta: ${formatDate(currentCourse.targetCompletionDate)}` : "Sem meta de conclusão"}</span></div>
            </div> : <div className="panel-empty current-course-empty">Escolha um curso para acompanhar seu progresso diretamente nesta tela.</div>}
          </Panel>

          <Panel title="Foco de hoje" className="span-7" action={<button type="button" className="secondary-button compact-button" onClick={openCreate}><Plus size={14} /> Planejar</button>}>
            {focusToday.length ? <div className="focus-list">{focusToday.map((session) => <article className="focus-item" key={session.id}>
              <div className="focus-icon"><CalendarCheck2 size={17} /></div>
              <div className="focus-main"><div className="focus-title-row"><strong>{session.course.name}</strong><Badge tone={sessionStatusTones[session.status]}>{sessionStatusLabels[session.status]}</Badge></div><span>{session.topic}</span><small>{session.studyType.name} • Planejado: {formatHours(session.plannedHours)} • Realizado: {formatHours(session.studiedHours)}</small></div>
              <div className="focus-actions">{session.status === "PLANNED" && <button type="button" className="table-icon-button" title="Iniciar" onClick={() => quickStatus(session, "IN_PROGRESS")} disabled={loadingId === session.id}>{loadingId === session.id ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />}</button>}{session.status !== "COMPLETED" && <button type="button" className="table-icon-button success-icon" title="Concluir" onClick={() => quickStatus(session, "COMPLETED")} disabled={loadingId === session.id}><CheckCircle2 size={15} /></button>}<button type="button" className="table-icon-button" title="Editar" onClick={() => openEdit(session)}><Pencil size={15} /></button></div>
            </article>)}</div> : <div className="focus-empty"><CalendarCheck2 size={30} /><strong>Nenhum estudo planejado para hoje.</strong><span>Crie uma sessão para organizar seu foco do dia.</span><button className="primary-button" type="button" onClick={openCreate}><Plus size={15} /> Planejar estudo de hoje</button></div>}
          </Panel>

          <Panel title="Registro de Estudos" className="span-12" action={<button className="secondary-button compact-button" type="button" onClick={clearFilters}><FilterX size={14} /> Limpar filtros</button>}>
            <div className="toolbar study-toolbar">
              <div className="search-box"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Buscar curso, assunto, tipo ou observação" aria-label="Buscar sessões" /></div>
              <select className="filter-select" value={courseId} onChange={(event) => { setCourseId(event.target.value); resetPage(); }} aria-label="Filtrar por curso"><option value="">Todos os cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
              <select className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} aria-label="Filtrar por status"><option value="">Todos os status</option>{sessionStatuses.map((item) => <option key={item} value={item}>{sessionStatusLabels[item]}</option>)}</select>
              <select className="filter-select" value={studyTypeId} onChange={(event) => { setStudyTypeId(event.target.value); resetPage(); }} aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>{studyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <input className="filter-select date-filter" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); resetPage(); }} aria-label="Data inicial" />
              <input className="filter-select date-filter" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); resetPage(); }} aria-label="Data final" />
              <select className="filter-select" value={deletedFilter} onChange={(event) => { setDeletedFilter(event.target.value as DeletedFilter); resetPage(); }} aria-label="Filtrar lixeira"><option value="active">Somente ativas</option><option value="deleted">Lixeira</option><option value="all">Ativas e excluídas</option></select>
              <select className="filter-select" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Ordenar sessões"><option value="date-desc">Data mais recente</option><option value="date-asc">Data mais antiga</option><option value="course">Curso</option><option value="studied-desc">Mais horas estudadas</option><option value="planned-desc">Mais horas planejadas</option></select>
            </div>

            {visibleSessions.length > 0 ? <div className="data-table-wrap"><table className="data-table study-session-table"><thead><tr><th>Data</th><th>Curso e assunto</th><th>Tipo</th><th>Planejado</th><th>Estudado</th><th>Status</th><th>Ações</th></tr></thead><tbody>{visibleSessions.map((session) => <tr key={session.id} className={session.deletedAt ? "archived-row" : ""}>
              <td><span className="table-title">{formatDate(session.studyDate)}</span><span className="table-subtitle">{session.deletedAt ? "Na lixeira" : session.studyDate === today ? "Hoje" : "Sessão de estudo"}</span></td>
              <td data-label="Curso e assunto"><span className="table-title">{session.course.name}</span><span className="table-subtitle">{session.topic}{session.notes ? ` • ${session.notes}` : ""}</span></td>
              <td data-label="Tipo">{session.studyType.name}</td>
              <td data-label="Planejado">{formatHours(session.plannedHours)}</td>
              <td data-label="Estudado"><strong>{formatHours(session.studiedHours)}</strong></td>
              <td data-label="Status"><Badge tone={sessionStatusTones[session.status]}>{sessionStatusLabels[session.status]}</Badge></td>
              <td data-label="Ações"><div className="table-actions">{!session.deletedAt && <><button className="table-icon-button" type="button" onClick={() => openEdit(session)} aria-label={`Editar ${session.topic}`}><Pencil size={15} /></button><button className="table-icon-button" type="button" onClick={() => openDuplicate(session)} aria-label={`Duplicar ${session.topic}`}><Copy size={15} /></button><button className="table-icon-button danger-icon" type="button" onClick={() => remove(session)} disabled={loadingId === session.id} aria-label={`Excluir ${session.topic}`}>{loadingId === session.id ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button></>}{session.deletedAt && <button className="table-icon-button" type="button" onClick={() => restore(session)} disabled={loadingId === session.id} aria-label={`Restaurar ${session.topic}`}>{loadingId === session.id ? <LoaderCircle className="spin" size={15} /> : <RotateCcw size={15} />}</button>}</div></td>
            </tr>)}</tbody></table></div> : <div className="courses-empty"><BookOpen size={34} /><h3>{sessions.length === 0 ? "Nenhuma sessão registrada" : "Nenhuma sessão corresponde aos filtros"}</h3><p>{sessions.length === 0 ? "Registre seu primeiro estudo para alimentar automaticamente os indicadores desta tela." : "Limpe ou altere os filtros para localizar outros registros."}</p>{sessions.length === 0 && <button className="primary-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={16} /> Registrar primeiro estudo</button>}</div>}

            <div className="table-footer"><span>Exibindo {visibleSessions.length ? (safePage - 1) * pageSize + 1 : 0} a {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} registros</span><div className="pagination"><button className="page-button" type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{Array.from({ length: Math.min(5, pages) }, (_, index) => index + 1).map((item) => <button key={item} className={`page-button ${safePage === item ? "active" : ""}`} type="button" onClick={() => setPage(item)}>{item}</button>)}<button className="page-button" type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></div></div>
          </Panel>

          <Panel title="Últimos Estudos" className="span-4">
            <div className="list">{recentSessions.map((session) => <button className="list-item session-list-button" type="button" key={session.id} onClick={() => openEdit(session)}><div className="list-item-main"><div className="list-icon"><BookOpen size={15} /></div><div><strong>{session.course.name}</strong><small>{session.topic} • {formatDate(session.studyDate)} • {session.studyType.name}</small></div></div><span className="list-item-value">{formatHours(session.studiedHours)}</span></button>)}{recentSessions.length === 0 && <div className="panel-empty">Nenhum estudo realizado ainda.</div>}</div>
          </Panel>

          <Panel title="Horas por Área" className="span-4">
            {areaRows.length ? <HorizontalBars rows={areaRows} /> : <div className="panel-empty">Registre horas para visualizar a distribuição por área.</div>}
          </Panel>

          <Panel title="Evolução Semanal" className="span-4">
            <div className="weekly-chart" role="img" aria-label="Horas estudadas nas últimas oito semanas">{weeks.map((week) => <div className="weekly-column" key={week.start} title={`${formatDate(week.start)} a ${formatDate(week.end)}: ${formatHours(week.hours)}`}><span className="weekly-value">{week.hours > 0 ? formatHours(week.hours) : "0h"}</span><div className="weekly-track"><span style={{ height: `${(week.hours / maxWeekHours) * 100}%` }} /></div><small>{formatShortDate(week.start)}</small></div>)}</div>
            <div className="weekly-caption"><Layers3 size={13} /> Semana inicia na segunda-feira; períodos sem estudo permanecem visíveis com zero.</div>
          </Panel>

          <Panel title={`Calendário de Consistência — últimos ${consistency.length} dias`} className="span-12">
            <div className="consistency-layout">
              <div>
                <div className="consistency-heatmap" role="group" aria-label="Calendário de consistência">{consistency.map((day) => {
                  const level = day.hours <= 0 ? 0 : day.hours < 1 ? 1 : day.hours < 2 ? 2 : 3;
                  return <button key={day.date} type="button" className={`consistency-day level-${level} ${day.date === today ? "today" : ""} ${selectedConsistencyDate === day.date ? "selected" : ""}`} title={`${formatDate(day.date)}: ${formatHours(day.hours)} em ${day.sessionCount} sessão(ões)`} aria-label={`${formatDate(day.date)}: ${formatHours(day.hours)} estudadas`} onClick={() => setSelectedConsistencyDate(day.date)}><span>{day.date.slice(8, 10)}</span></button>;
                })}</div>
                <div className="heatmap-legend"><span><i /> Sem estudo</span><span><i className="level-1" /> Até 1h</span><span><i className="level-3" /> 2h ou mais</span></div>
              </div>
              <div className="consistency-detail">{selectedConsistencyDate ? <><div className="consistency-detail-header"><strong>{formatDate(selectedConsistencyDate)}</strong><button type="button" className="link-button" onClick={() => setSelectedConsistencyDate(null)}>Fechar</button></div>{selectedDaySessions.length ? <div className="list">{selectedDaySessions.map((session) => <button key={session.id} type="button" className="list-item session-list-button" onClick={() => openEdit(session)}><div className="list-item-main"><div className="list-icon"><CalendarCheck2 size={14} /></div><div><strong>{session.course.name}</strong><small>{session.topic}</small></div></div><span className="list-item-value">{formatHours(session.studiedHours)}</span></button>)}</div> : <div className="panel-empty">Nenhuma sessão registrada neste dia.</div>}</> : <div className="consistency-hint"><CalendarCheck2 size={28} /><strong>Clique em um dia</strong><span>Você verá as sessões e horas registradas naquela data.</span></div>}</div>
            </div>
          </Panel>
        </div>
      </div>

      {modalOpen && <StudySessionFormModal session={editing} seed={seed} courses={courses} studyTypes={studyTypes} defaultCourseId={defaultCourseId ?? currentCourseId} onClose={() => { setModalOpen(false); setEditing(null); setSeed(null); }} onSaved={saved} />}
    </>
  );
}
