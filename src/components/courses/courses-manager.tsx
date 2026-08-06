"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileUp,
  Filter,
  GraduationCap,
  Languages,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, FilterChips, ProgressBar } from "@/components/ui";
import { CourseFormModal } from "@/components/courses/course-form-modal";
import { CourseImportModal } from "@/components/courses/course-import-modal";
import { courseIcon, normalizeHex, pastelColor } from "@/lib/visuals";
import { courseStatusLabels, courseStatusTones } from "@/lib/courses/constants";
import type { Course, CourseListOption } from "@/types/course";

type Notice = { type: "success" | "error"; text: string } | null;
type ViewFilter = "all" | "languages" | "professional" | "in-progress" | "completed" | "archived";
type Sort = "priority" | "name" | "progress" | "target" | "created";

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatDurationMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}min`;
  return remainder ? `${hours}h ${remainder}min` : `${hours}h`;
}

function priorityRank(value: Course["priority"]) { return value === "HIGH" ? 0 : value === "MEDIUM" ? 1 : 2; }
function statusRank(value: Course["status"]) { return ["IN_PROGRESS", "NOT_STARTED", "PLANNED", "PAUSED", "COMPLETED", "CANCELLED"].indexOf(value); }

export function CoursesManager({ initialCourses, platforms, areas, databaseReady, importReady, currentCourseId, weeklyStudiedHours = 0, weeklyHoursByCourse = {} }: { initialCourses: Course[]; platforms: CourseListOption[]; areas: CourseListOption[]; databaseReady: boolean; importReady: boolean; currentCourseId: string | null; weeklyStudiedHours?: number; weeklyHoursByCourse?: Record<string, number> }) {
  const [courses, setCourses] = useState(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedCurrentId, setSelectedCurrentId] = useState(currentCourseId);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewFilter>("all");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [sort, setSort] = useState<Sort>("priority");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const activeCourses = useMemo(() => courses.filter((course) => !course.archivedAt), [courses]);
  const metrics = useMemo(() => ({
    total: activeCourses.length,
    inProgress: activeCourses.filter((course) => course.status === "IN_PROGRESS").length,
    completed: activeCourses.filter((course) => course.status === "COMPLETED").length,
  }), [activeCourses]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const result = courses.filter((course) => {
      if (view === "archived" && !course.archivedAt) return false;
      if (view !== "archived" && course.archivedAt) return false;
      if (view === "languages" && course.group !== "LANGUAGE") return false;
      if (view === "professional" && course.group !== "PROFESSIONAL") return false;
      if (view === "in-progress" && course.status !== "IN_PROGRESS") return false;
      if (view === "completed" && course.status !== "COMPLETED") return false;
      if (status && course.status !== status) return false;
      if (priority && course.priority !== priority) return false;
      if (platformId && course.platform.id !== platformId) return false;
      if (areaId && course.area.id !== areaId) return false;
      if (normalizedSearch && ![course.name, course.platform.name, course.area.name, course.notes ?? ""].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedSearch)) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "progress") return b.progress - a.progress;
      if (sort === "target") return (a.targetCompletionDate ?? "9999-12-31").localeCompare(b.targetCompletionDate ?? "9999-12-31");
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return priorityRank(a.priority) - priorityRank(b.priority) || statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name, "pt-BR");
    });
  }, [courses, view, status, priority, platformId, areaId, search, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleCourses = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPage() { setPage(1); }
  function openCreate() {
    if (!databaseReady) { setNotice({ type: "error", text: "Execute a migration da versão 1.1.0 no Supabase antes de cadastrar cursos." }); return; }
    setEditingCourse(null); setModalOpen(true); setNotice(null);
  }
  function openEdit(course: Course) { setEditingCourse(course); setModalOpen(true); setNotice(null); setOpenMenuId(null); }
  function openImport() {
    if (!importReady) { setNotice({ type: "error", text: "A estrutura de importação ainda não está disponível no Supabase." }); return; }
    setImportOpen(true); setNotice(null);
  }
  function saved(course: Course, message: string) {
    setCourses((current) => current.some((item) => item.id === course.id) ? current.map((item) => item.id === course.id ? course : item) : [course, ...current]);
    setModalOpen(false); setEditingCourse(null); setNotice({ type: "success", text: message });
  }

  async function toggleArchive(course: Course) {
    const archiving = !course.archivedAt;
    if (archiving && !window.confirm(`Arquivar “${course.name}”? O histórico será preservado.`)) return;
    setLoadingId(course.id); setOpenMenuId(null);
    const response = await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: archiving }) });
    const payload = await response.json().catch(() => ({})) as { message?: string; course?: Course };
    setLoadingId(null);
    if (!response.ok || !payload.course) { setNotice({ type: "error", text: payload.message ?? "Não foi possível atualizar o curso." }); return; }
    setCourses((current) => current.map((item) => item.id === course.id ? payload.course! : item));
    setNotice({ type: "success", text: payload.message ?? "Curso atualizado." });
  }

  async function permanentlyDelete(course: Course) {
    if (!course.archivedAt || !window.confirm(`Excluir permanentemente “${course.name}”?`)) return;
    setLoadingId(course.id); setOpenMenuId(null);
    const response = await fetch(`/api/courses/${course.id}?permanent=1`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    setLoadingId(null);
    if (!response.ok) { setNotice({ type: "error", text: payload.message ?? "Não foi possível excluir o curso." }); return; }
    setCourses((current) => current.filter((item) => item.id !== course.id));
    setNotice({ type: "success", text: payload.message ?? "Curso excluído." });
  }

  async function setCurrent(course: Course) {
    setLoadingId(course.id); setOpenMenuId(null);
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentCourseId: course.id }) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    setLoadingId(null);
    if (!response.ok) { setNotice({ type: "error", text: payload.message ?? "Não foi possível definir o curso atual." }); return; }
    setSelectedCurrentId(course.id); setNotice({ type: "success", text: `${course.name} foi definido como curso atual.` });
  }

  function exportCsv() {
    const rows = filtered.map((course) => [course.name, course.group === "LANGUAGE" ? "Idioma" : "Profissionalizante", course.platform.name, course.area.name, courseStatusLabels[course.status], `${course.progress}%`, course.color]);
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [["Nome", "Tipo", "Plataforma", "Área", "Status", "Progresso", "Cor"], ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); link.download = "cursos-v1.1.csv"; link.click(); URL.revokeObjectURL(link.href);
  }

  const viewItems = [
    { value: "all", label: "Todos", icon: BookOpen },
    { value: "languages", label: "Idiomas", icon: Languages },
    { value: "professional", label: "Profissionalizantes", icon: GraduationCap },
    { value: "in-progress", label: "Em andamento", icon: Clock3 },
    { value: "completed", label: "Concluídos", icon: CheckCircle2 },
    { value: "archived", label: "Arquivados", icon: Archive },
  ];

  return (
    <>
      <PageHeader title="Cursos" subtitle="Gerencie seus cursos, acompanhe seu progresso e mantenha sua jornada de aprendizado organizada." actions={<div className="page-actions"><button className="primary-button" type="button" onClick={openCreate}><Plus size={17} /> Novo curso</button><button className="secondary-button" type="button" onClick={() => setFiltersOpen((value) => !value)}><Filter size={17} /> Filtros</button><button className="icon-button" type="button" onClick={openImport} aria-label="Importar cursos"><FileUp size={18} /></button></div>} />
      <div className="content redesign-content courses-redesign">
        {notice && <div className={`settings-notice ${notice.type}`} role="status">{notice.text}</div>}

        <div className="courses-top-row">
          <FilterChips items={viewItems} value={view} onChange={(value) => { setView(value as ViewFilter); resetPage(); }} ariaLabel="Visualizações de cursos" />
          <section className="quick-overview card">
            <div className="quick-overview-heading"><strong>Visão rápida</strong><Link href="/dashboard">Ver resumo</Link></div>
            <div className="quick-overview-stats"><div><BookOpen size={18} /><strong>{metrics.total}</strong><span>Cursos</span></div><div><Clock3 size={18} /><strong>{metrics.inProgress}</strong><span>Em andamento</span></div><div><CheckCircle2 size={18} /><strong>{metrics.completed}</strong><span>Concluídos</span></div><div><Clock3 size={18} /><strong>{formatDurationMinutes(Math.round(weeklyStudiedHours * 60))}</strong><span>Estudadas esta semana</span></div></div>
          </section>
        </div>

        <div className="courses-search-row">
          <div className="search-box large"><Search size={18} /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Buscar cursos por nome, categoria ou plataforma..." aria-label="Buscar cursos" /></div>
          <button className="secondary-button" type="button" onClick={exportCsv}><Download size={16} /> Exportar</button>
        </div>

        {filtersOpen && <section className="card filter-drawer-inline"><div className="filter-drawer-heading"><strong>Filtros avançados</strong><button className="icon-action" type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros"><X size={17} /></button></div><div className="filters-row">
          <select className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} aria-label="Status"><option value="">Todos os status</option><option value="PLANNED">Planejado</option><option value="NOT_STARTED">Não iniciado</option><option value="IN_PROGRESS">Em andamento</option><option value="PAUSED">Pausado</option><option value="COMPLETED">Concluído</option><option value="CANCELLED">Cancelado</option></select>
          <select className="filter-select" value={priority} onChange={(event) => { setPriority(event.target.value); resetPage(); }} aria-label="Prioridade"><option value="">Todas as prioridades</option><option value="HIGH">Alta</option><option value="MEDIUM">Média</option><option value="LOW">Baixa</option></select>
          <select className="filter-select" value={areaId} onChange={(event) => { setAreaId(event.target.value); resetPage(); }} aria-label="Área"><option value="">Todas as áreas</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select className="filter-select" value={platformId} onChange={(event) => { setPlatformId(event.target.value); resetPage(); }} aria-label="Plataforma"><option value="">Todas as plataformas</option>{platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select className="filter-select" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Ordenação"><option value="priority">Prioridade</option><option value="name">Nome</option><option value="progress">Progresso</option><option value="target">Prazo</option><option value="created">Mais recentes</option></select>
        </div></section>}

        {visibleCourses.length ? <div className="course-card-grid">{visibleCourses.map((course) => {
          const Icon = courseIcon(course.icon || course.name);
          const color = normalizeHex(course.color);
          const style = { "--course-color": color, "--course-pastel": pastelColor(color) } as CSSProperties;
          const weeklyPercent = course.weeklyGoalMinutes > 0 ? Math.min(100, Math.round(((weeklyHoursByCourse[course.id] ?? 0) * 60 / course.weeklyGoalMinutes) * 100)) : course.progress;
          return <article className={`course-card ${course.archivedAt ? "archived" : ""}`} style={style} key={course.id}>
            {course.id === selectedCurrentId && <span className="current-ribbon">Curso atual</span>}
            <div className="course-card-header"><div className="course-card-icon"><Icon size={28} /></div><div className="course-card-title"><h2>{course.name}</h2><p>{course.group === "LANGUAGE" ? "Idioma" : course.area.name}</p></div><div className="action-menu-wrap"><button className="icon-action" type="button" onClick={() => setOpenMenuId((value) => value === course.id ? null : course.id)} aria-label={`Ações de ${course.name}`}><MoreHorizontal size={19} /></button>{openMenuId === course.id && <div className="action-menu"><button type="button" onClick={() => openEdit(course)}><Pencil size={14} /> Editar</button>{!course.archivedAt && course.id !== selectedCurrentId && <button type="button" onClick={() => setCurrent(course)}><Star size={14} /> Definir como atual</button>}<button type="button" onClick={() => toggleArchive(course)}>{course.archivedAt ? <RotateCcw size={14} /> : <Archive size={14} />}{course.archivedAt ? "Restaurar" : "Arquivar"}</button>{course.archivedAt && <button type="button" className="danger" onClick={() => permanentlyDelete(course)}><Trash2 size={14} /> Excluir</button>}</div>}</div></div>
            <div className="course-card-meta"><div><span>Plataforma</span><strong>{course.platform.name}</strong></div><div><span>{course.group === "LANGUAGE" ? "Meta semanal" : "Progresso do curso"}</span><strong>{course.group === "LANGUAGE" && course.weeklyGoalMinutes ? formatDurationMinutes(course.weeklyGoalMinutes) : `${course.progress}%`}</strong></div></div>
            {course.group === "LANGUAGE" && (course.currentLevel || course.targetLevel) && <div className="level-route"><span>{course.currentLevel || "Início"}</span><i /><span>{course.targetLevel || "Objetivo"}</span></div>}
            <ProgressBar value={course.group === "LANGUAGE" ? weeklyPercent : course.progress} color={color} />
            <div className="course-card-status"><Badge tone={courseStatusTones[course.status]}>{courseStatusLabels[course.status]}</Badge>{course.targetCompletionDate && <small>{formatDate(course.targetCompletionDate)}</small>}</div>
            <div className="course-card-actions"><Link className="secondary-button" href={`/cursos/${course.id}`}><Eye size={15} /> Ver detalhes</Link>{!course.archivedAt && <Link className="icon-button" href={`/estudos?curso=${course.id}&novo=1`} aria-label={`Registrar estudo em ${course.name}`}><Clock3 size={16} /></Link>}</div>
            {loadingId === course.id && <div className="card-loading"><LoaderCircle className="spin" size={22} /></div>}
          </article>;
        })}</div> : <EmptyState title={courses.length ? "Nenhum curso encontrado" : "Sua jornada começa aqui"} description={courses.length ? "Altere os filtros ou a busca para encontrar outros cursos." : "Importe a trilha inicial ou adicione seu primeiro curso."} action={<div className="empty-actions"><button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Novo curso</button><button className="secondary-button" type="button" onClick={openImport}><FileUp size={16} /> Importar</button></div>} />}

        {pages > 1 && <div className="card-grid-footer"><span>Mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} de {filtered.length} cursos</span><div className="pagination"><button className="page-button" type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{Array.from({ length: pages }, (_, index) => index + 1).slice(Math.max(0, safePage - 3), safePage + 2).map((item) => <button key={item} className={`page-button ${safePage === item ? "active" : ""}`} type="button" onClick={() => setPage(item)}>{item}</button>)}<button className="page-button" type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></div></div>}
      </div>

      {modalOpen && <CourseFormModal key={editingCourse?.id ?? "new"} course={editingCourse} platforms={platforms} areas={areas} onClose={() => { setModalOpen(false); setEditingCourse(null); }} onSaved={saved} />}
      {importOpen && <CourseImportModal onClose={() => setImportOpen(false)} onImported={() => window.location.reload()} />}
    </>
  );
}
