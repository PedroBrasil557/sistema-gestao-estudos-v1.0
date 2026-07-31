"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileUp,
  Flag,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Donut, HorizontalBars, MetricCard, Panel, ProgressBar } from "@/components/ui";
import { CourseFormModal } from "@/components/courses/course-form-modal";
import { CourseImportModal } from "@/components/courses/course-import-modal";
import {
  courseKindLabels,
  courseKinds,
  coursePriorityLabels,
  coursePriorities,
  coursePriorityTones,
  courseStatusLabels,
  courseStatuses,
  courseStatusTones,
} from "@/lib/courses/constants";
import type { Course, CourseListOption } from "@/types/course";

type Notice = { type: "success" | "error"; text: string } | null;
type ArchiveFilter = "active" | "archived" | "all";
type Sort = "name" | "priority" | "progress" | "target" | "created";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatHours(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}h`;
}

function priorityRank(value: Course["priority"]) {
  return value === "HIGH" ? 0 : value === "MEDIUM" ? 1 : 2;
}

function statusRank(value: Course["status"]) {
  return ["IN_PROGRESS", "NOT_STARTED", "PLANNED", "PAUSED", "COMPLETED", "CANCELLED"].indexOf(value);
}

export function CoursesManager({
  initialCourses,
  platforms,
  areas,
  databaseReady,
  importReady,
  currentCourseId,
}: {
  initialCourses: Course[];
  platforms: CourseListOption[];
  areas: CourseListOption[];
  databaseReady: boolean;
  importReady: boolean;
  currentCourseId: string | null;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedCurrentId, setSelectedCurrentId] = useState(currentCourseId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [priority, setPriority] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active");
  const [sort, setSort] = useState<Sort>("priority");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const activeCourses = useMemo(() => courses.filter((course) => !course.archivedAt), [courses]);
  const metrics = useMemo(() => ({
    total: activeCourses.length,
    inProgress: activeCourses.filter((course) => course.status === "IN_PROGRESS").length,
    completed: activeCourses.filter((course) => course.status === "COMPLETED").length,
    certifications: activeCourses.filter((course) => course.kind === "CERTIFICATION").length,
    high: activeCourses.filter((course) => course.priority === "HIGH").length,
    workload: activeCourses.reduce((total, course) => total + course.workloadHours, 0),
  }), [activeCourses]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const result = courses.filter((course) => {
      if (archiveFilter === "active" && course.archivedAt) return false;
      if (archiveFilter === "archived" && !course.archivedAt) return false;
      if (status && course.status !== status) return false;
      if (kind && course.kind !== kind) return false;
      if (priority && course.priority !== priority) return false;
      if (platformId && course.platform.id !== platformId) return false;
      if (areaId && course.area.id !== areaId) return false;
      if (normalizedSearch && ![course.name, course.platform.name, course.area.name, course.notes ?? ""].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedSearch)) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority) || statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name, "pt-BR");
      if (sort === "progress") return b.progress - a.progress;
      if (sort === "target") return (a.targetCompletionDate ?? "9999-12-31").localeCompare(b.targetCompletionDate ?? "9999-12-31");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [courses, archiveFilter, status, kind, priority, platformId, areaId, search, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleCourses = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const highlight = useMemo(() => activeCourses
    .slice()
    .sort((a, b) => Number(b.id === selectedCurrentId) - Number(a.id === selectedCurrentId) || statusRank(a.status) - statusRank(b.status) || priorityRank(a.priority) - priorityRank(b.priority))[0] ?? null, [activeCourses, selectedCurrentId]);

  const statusCounts = useMemo(() => courseStatuses.map((item) => ({ status: item, count: activeCourses.filter((course) => course.status === item).length })).filter((item) => item.count > 0), [activeCourses]);
  const areaRows = useMemo(() => {
    const counts = new Map<string, number>();
    activeCourses.forEach((course) => counts.set(course.area.name, (counts.get(course.area.name) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value, text: String(value) }));
  }, [activeCourses]);
  const priorityTrail = useMemo(() => activeCourses.filter((course) => !["COMPLETED", "CANCELLED"].includes(course.status)).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || (a.targetCompletionDate ?? "9999").localeCompare(b.targetCompletionDate ?? "9999")).slice(0, 5), [activeCourses]);

  function resetPage() { setPage(1); }
  function openCreate() {
    if (!databaseReady) { setNotice({ type: "error", text: "Execute a migração da versão 0.5 no Supabase antes de cadastrar cursos." }); return; }
    setEditingCourse(null); setModalOpen(true); setNotice(null);
  }
  function openEdit(course: Course) { setEditingCourse(course); setModalOpen(true); setNotice(null); }
  function openImport() {
    if (!importReady) { setNotice({ type: "error", text: "Execute a migração da versão 0.6 no Supabase antes de importar." }); return; }
    setImportOpen(true);
    setNotice(null);
  }

  function saved(course: Course, message: string) {
    setCourses((current) => current.some((item) => item.id === course.id) ? current.map((item) => item.id === course.id ? course : item) : [course, ...current]);
    setModalOpen(false);
    setEditingCourse(null);
    setNotice({ type: "success", text: message });
  }

  async function toggleArchive(course: Course) {
    const archiving = !course.archivedAt;
    if (archiving && !window.confirm(`Arquivar “${course.name}”? O registro permanecerá disponível no histórico.`)) return;
    setLoadingId(course.id);
    setNotice(null);
    const response = await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: archiving }) });
    const payload = await response.json().catch(() => ({})) as { message?: string; course?: Course };
    setLoadingId(null);
    if (!response.ok || !payload.course) { setNotice({ type: "error", text: payload.message ?? "Não foi possível atualizar o curso." }); return; }
    setCourses((current) => current.map((item) => item.id === course.id ? payload.course! : item));
    setNotice({ type: "success", text: payload.message ?? "Curso atualizado." });
  }

  async function permanentlyDelete(course: Course) {
    if (!course.archivedAt) return;
    if (!window.confirm(`Excluir permanentemente “${course.name}”? Esta ação não poderá ser desfeita.`)) return;
    setLoadingId(course.id);
    const response = await fetch(`/api/courses/${course.id}?permanent=1`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    setLoadingId(null);
    if (!response.ok) { setNotice({ type: "error", text: payload.message ?? "Não foi possível excluir o curso." }); return; }
    setCourses((current) => current.filter((item) => item.id !== course.id));
    setNotice({ type: "success", text: payload.message ?? "Curso excluído." });
  }

  async function setCurrent(course: Course) {
    setLoadingId(course.id);
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentCourseId: course.id }) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    setLoadingId(null);
    if (!response.ok) { setNotice({ type: "error", text: payload.message ?? "Não foi possível definir o curso atual." }); return; }
    setSelectedCurrentId(course.id);
    setNotice({ type: "success", text: `${course.name} foi definido como curso atual.` });
  }

  function exportCsv() {
    const header = ["Nome", "Tipo", "Plataforma", "Área", "Carga horária", "Status", "Prioridade", "Progresso", "Meta", "Arquivado"];
    const rows = filtered.map((course) => [course.name, courseKindLabels[course.kind], course.platform.name, course.area.name, course.workloadHours, courseStatusLabels[course.status], coursePriorityLabels[course.priority], `${course.progress}%`, formatDate(course.targetCompletionDate), course.archivedAt ? "Sim" : "Não"]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "cursos-v0.6.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Cursos" subtitle="Gerencie sua trilha de cursos e certificações." actions={<><button className="secondary-button header-secondary" type="button" onClick={openImport} disabled={!importReady}><FileUp size={17} /><span className="button-label">Importar</span></button><button className="header-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={17} /><span className="button-label">Novo curso</span></button></>} />
      <div className="content">
        {!databaseReady && <div className="settings-notice error" role="alert">Execute a migração da versão 0.5 no Supabase antes de usar o módulo de cursos.</div>}
        {databaseReady && !importReady && <div className="settings-notice error" role="alert">Execute a migração da versão 0.6 no Supabase para habilitar a importação.</div>}
        {notice && <div className={`settings-notice ${notice.type} course-page-notice`} role="alert">{notice.text}</div>}

        <section className="metrics-grid">
          <MetricCard label="Total de cursos" value={String(metrics.total)} helper="registros ativos" progress={metrics.total ? 100 : 0} icon={GraduationCap} tone="purple" />
          <MetricCard label="Em andamento" value={String(metrics.inProgress)} helper="cursos ativos" progress={metrics.total ? (metrics.inProgress / metrics.total) * 100 : 0} icon={Clock3} tone="orange" />
          <MetricCard label="Concluídos" value={String(metrics.completed)} helper="da trilha atual" progress={metrics.total ? (metrics.completed / metrics.total) * 100 : 0} icon={CheckCircle2} tone="green" />
          <MetricCard label="Certificações" value={String(metrics.certifications)} helper="profissionais planejadas" progress={metrics.total ? (metrics.certifications / metrics.total) * 100 : 0} icon={Award} tone="purple" />
          <MetricCard label="Prioridade alta" value={String(metrics.high)} helper="exigem atenção" progress={metrics.total ? (metrics.high / metrics.total) * 100 : 0} icon={Flag} tone="red" />
          <MetricCard label="Carga total" value={formatHours(metrics.workload)} helper="somada da trilha" progress={metrics.workload ? 100 : 0} icon={BookOpen} tone="blue" />
        </section>

        <div className="dashboard-grid">
          <Panel title="Minha trilha de cursos" className="span-9" action={<div className="panel-actions"><button type="button" className="secondary-button" onClick={openImport} disabled={!importReady}><FileUp size={15} /> Importar</button><button type="button" className="secondary-button" onClick={exportCsv} disabled={filtered.length === 0}><Download size={15} /> Exportar CSV</button></div>}>
            <div className="toolbar course-toolbar">
              <div className="search-box"><Search size={16} /><input aria-label="Buscar curso" placeholder="Buscar nome, plataforma, área..." value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} /></div>
              <select aria-label="Filtrar por status" className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }}><option value="">Todos os status</option>{courseStatuses.map((item) => <option key={item} value={item}>{courseStatusLabels[item]}</option>)}</select>
              <select aria-label="Filtrar por tipo" className="filter-select" value={kind} onChange={(event) => { setKind(event.target.value); resetPage(); }}><option value="">Cursos e certificações</option>{courseKinds.map((item) => <option key={item} value={item}>{courseKindLabels[item]}</option>)}</select>
              <select aria-label="Filtrar por prioridade" className="filter-select" value={priority} onChange={(event) => { setPriority(event.target.value); resetPage(); }}><option value="">Todas as prioridades</option>{coursePriorities.map((item) => <option key={item} value={item}>{coursePriorityLabels[item]}</option>)}</select>
              <select aria-label="Filtrar por área" className="filter-select" value={areaId} onChange={(event) => { setAreaId(event.target.value); resetPage(); }}><option value="">Todas as áreas</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <select aria-label="Filtrar por plataforma" className="filter-select" value={platformId} onChange={(event) => { setPlatformId(event.target.value); resetPage(); }}><option value="">Todas as plataformas</option>{platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <select aria-label="Filtrar arquivamento" className="filter-select" value={archiveFilter} onChange={(event) => { setArchiveFilter(event.target.value as ArchiveFilter); resetPage(); }}><option value="active">Somente ativos</option><option value="archived">Somente arquivados</option><option value="all">Ativos e arquivados</option></select>
              <select aria-label="Ordenar cursos" className="filter-select" value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="priority">Prioridade</option><option value="name">Nome</option><option value="progress">Progresso</option><option value="target">Meta de conclusão</option><option value="created">Mais recentes</option></select>
            </div>

            {visibleCourses.length > 0 ? <div className="data-table-wrap"><table className="data-table course-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Plataforma</th><th>Área</th><th>Carga</th><th>Status</th><th>Prioridade</th><th>Progresso</th><th>Meta</th><th>Ações</th></tr></thead><tbody>{visibleCourses.map((course) => <tr key={course.id} className={course.archivedAt ? "archived-row" : ""}>
              <td><span className="table-title">{course.name}</span><span className="table-subtitle">{course.id === selectedCurrentId ? "Curso atual • " : ""}{course.archivedAt ? "Arquivado" : course.emitsCertificate ? "Emite certificado" : "Sem certificado informado"}</span></td>
              <td data-label="Tipo">{courseKindLabels[course.kind]}</td><td data-label="Plataforma">{course.platform.name}</td><td data-label="Área">{course.area.name}</td><td data-label="Carga">{formatHours(course.workloadHours)}</td>
              <td data-label="Status"><Badge tone={courseStatusTones[course.status]}>{courseStatusLabels[course.status]}</Badge></td><td data-label="Prioridade"><Badge tone={coursePriorityTones[course.priority]}>{coursePriorityLabels[course.priority]}</Badge></td>
              <td data-label="Progresso"><div className="course-progress"><div className="inline-meta"><span>{course.progress}%</span></div><ProgressBar value={course.progress} /></div></td><td data-label="Meta">{formatDate(course.targetCompletionDate)}</td>
              <td data-label="Ações"><div className="table-actions"><Link className="table-icon-button" href={`/cursos/${course.id}`} aria-label={`Ver detalhes de ${course.name}`}><Eye size={15} /></Link>{!course.archivedAt && <Link className="table-icon-button" href={`/estudos?curso=${course.id}&novo=1`} aria-label={`Registrar estudo em ${course.name}`}><Clock3 size={15} /></Link>}{!course.archivedAt && <button className="table-icon-button" type="button" aria-label={`Editar ${course.name}`} onClick={() => openEdit(course)}><Pencil size={15} /></button>}{!course.archivedAt && <button className={`table-icon-button ${course.id === selectedCurrentId ? "selected" : ""}`} type="button" aria-label={`Definir ${course.name} como curso atual`} disabled={loadingId === course.id || course.id === selectedCurrentId} onClick={() => setCurrent(course)}><Star size={15} /></button>}<button className="table-icon-button" type="button" aria-label={course.archivedAt ? `Restaurar ${course.name}` : `Arquivar ${course.name}`} disabled={loadingId === course.id} onClick={() => toggleArchive(course)}>{loadingId === course.id ? <LoaderCircle className="spin" size={15} /> : course.archivedAt ? <RotateCcw size={15} /> : <Archive size={15} />}</button>{course.archivedAt && <button className="table-icon-button danger-icon" type="button" aria-label={`Excluir permanentemente ${course.name}`} disabled={loadingId === course.id} onClick={() => permanentlyDelete(course)}><Trash2 size={15} /></button>}</div></td>
            </tr>)}</tbody></table></div> : <div className="courses-empty"><GraduationCap size={34} /><h3>{courses.length === 0 ? "Sua trilha ainda está vazia" : "Nenhum curso corresponde aos filtros"}</h3><p>{courses.length === 0 ? "Cadastre manualmente ou importe agora os 56 registros da trilha oficial." : "Limpe ou altere os filtros para visualizar outros registros."}</p>{courses.length === 0 && <div className="empty-actions"><button className="primary-button" type="button" onClick={openImport} disabled={!importReady}><FileUp size={16} /> Importar trilha oficial</button><button className="secondary-button" type="button" onClick={openCreate}><Plus size={16} /> Cadastrar manualmente</button></div>}</div>}
            <div className="table-footer"><span>Exibindo {visibleCourses.length ? (safePage - 1) * pageSize + 1 : 0} a {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} registros</span><div className="pagination"><button className="page-button" type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{Array.from({ length: Math.min(5, pages) }, (_, index) => index + 1).map((item) => <button key={item} className={`page-button ${safePage === item ? "active" : ""}`} type="button" onClick={() => setPage(item)}>{item}</button>)}<button className="page-button" type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></div></div>
          </Panel>

          <Panel title="Curso em destaque" className="span-3">
            {highlight ? <div className="course-highlight"><div className="course-summary"><div className="course-logo">{highlight.kind === "CERTIFICATION" ? "C" : highlight.name.slice(0, 1).toUpperCase()}</div><div><h3>{highlight.name}</h3><p>{highlight.platform.name}</p></div></div><div className="info-list"><div className="info-row"><span>Área</span><strong>{highlight.area.name}</strong></div><div className="info-row"><span>Carga horária</span><strong>{formatHours(highlight.workloadHours)}</strong></div><div className="info-row"><span>Meta de conclusão</span><strong>{formatDate(highlight.targetCompletionDate)}</strong></div><div className="info-row"><span>Status</span><Badge tone={courseStatusTones[highlight.status]}>{courseStatusLabels[highlight.status]}</Badge></div></div><div><div className="inline-meta"><span>Progresso</span><strong>{highlight.progress}%</strong></div><ProgressBar value={highlight.progress} /></div><Link className="secondary-button" href={`/cursos/${highlight.id}`}>Ver detalhes</Link></div> : <div className="panel-empty">Cadastre um curso para acompanhar o destaque.</div>}
          </Panel>

          <Panel title="Distribuição por status" className="span-3"><div className="donut-layout"><Donut value={metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0} center={String(metrics.total)} label="Total" size={125} /><div className="legend">{statusCounts.slice(0, 5).map((item) => <div className="legend-row" key={item.status}><i className={`legend-dot ${courseStatusTones[item.status] === "green" ? "green" : courseStatusTones[item.status] === "orange" ? "orange" : courseStatusTones[item.status] === "purple" ? "purple" : courseStatusTones[item.status] === "red" ? "red" : courseStatusTones[item.status] === "gray" ? "gray" : ""}`} /><span>{courseStatusLabels[item.status]}</span><strong>{item.count}</strong></div>)}</div></div></Panel>
          <Panel title="Cursos por área" className="span-4">{areaRows.length ? <HorizontalBars rows={areaRows} /> : <div className="panel-empty">Sem dados por área.</div>}</Panel>
          <Panel title="Trilha prioritária" className="span-2"><div className="list">{priorityTrail.map((course, index) => <Link className="list-item" href={`/cursos/${course.id}`} key={course.id}><div className="list-item-main"><Badge tone="gray">{index + 1}</Badge><div><strong>{course.name}</strong><small>{coursePriorityLabels[course.priority]} • {courseStatusLabels[course.status]}</small></div></div><span className="list-item-value">{formatDate(course.targetCompletionDate)}</span></Link>)}{priorityTrail.length === 0 && <div className="panel-empty">Nenhum curso pendente.</div>}</div></Panel>
          <Panel title="Ações rápidas" className="span-3"><div className="quick-actions"><button className="quick-action" type="button" onClick={openImport} disabled={!importReady}><FileUp size={15} /> Importar trilha ou CSV</button><button className="quick-action" type="button" onClick={openCreate}><Plus size={15} /> Adicionar curso</button><Link className="quick-action" href="/estudos"><BookOpen size={15} /> Registrar estudo</Link><Link className="quick-action" href="/anotacoes"><BookOpen size={15} /> Adicionar anotação</Link><Link className="quick-action" href="/certificados"><Award size={15} /> Adicionar certificado</Link></div></Panel>
        </div>
      </div>

      {modalOpen && <CourseFormModal course={editingCourse} platforms={platforms} areas={areas} onClose={() => { setModalOpen(false); setEditingCourse(null); }} onSaved={saved} />}
      {importOpen && <CourseImportModal onClose={() => setImportOpen(false)} onImported={() => window.location.reload()} />}
    </>
  );
}
